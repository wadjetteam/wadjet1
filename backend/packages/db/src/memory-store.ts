import { DatabaseSync } from 'node:sqlite'
import { promises as fs } from 'fs'
import * as path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import type { Document, StoreCollection } from './store-types'

const USE_PG = !!process.env['DATABASE_URL']
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const _require = createRequire(import.meta.url)

export type { Document, StoreCollection }

const DATA_DIR = process.env.DB_DATA_DIR || path.resolve(__dirname, '../../../data')
let db: DatabaseSync | null = null

function getDB(): DatabaseSync {
  if (db) return db
  const dbPath = path.join(DATA_DIR, 'wadjet.db')
  const dbDir = path.dirname(dbPath)
  fs.mkdir(dbDir, { recursive: true }).catch(() => {})
  db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode=WAL')
  db.exec('PRAGMA synchronous=NORMAL')
  db.exec('PRAGMA busy_timeout=5000')
  db.exec(`CREATE TABLE IF NOT EXISTS collections (
    name TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (name, id)
  )`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name)`)
  migrateFromJson().catch(() => {})
  return db
}

async function migrateFromJson() {
  const dbDir = DATA_DIR
  try {
    const files = await fs.readdir(dbDir)
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'wadjet.db')
    if (jsonFiles.length === 0) return
    const sqlite = getDB()
    const insert = sqlite.prepare('INSERT OR IGNORE INTO collections (name, id, data) VALUES (?, ?, ?)')
    for (const file of jsonFiles) {
      const name = file.replace('.json', '')
      if (name === 'wadjet') continue
      try {
        const raw = await fs.readFile(path.join(dbDir, file), 'utf-8')
        const parsed = JSON.parse(raw)
        const docsEntries = parsed.docs ? Object.entries(parsed.docs) : []
        for (const [id, doc] of docsEntries) {
          insert.run(name, id, JSON.stringify(doc))
        }
        await fs.rename(path.join(dbDir, file), path.join(dbDir, `${file}.migrated`))
      } catch {}
    }
  } catch {}
}

class MemoryCollection<T extends Document> {
  private docs: Map<string, T> = new Map()
  private counter = 0
  private storeName: string
  private loaded = false

  constructor(name: string) {
    this.storeName = name
  }

  ensureLoaded() {
    if (this.loaded) return
    this.loaded = true
    const sqlite = getDB()
    const stmt = sqlite.prepare('SELECT id, data FROM collections WHERE name = ?')
    const rows = stmt.all(this.storeName) as { id: string; data: string }[]
    let maxId = 0
    for (const row of rows) {
      try {
        const doc = JSON.parse(row.data) as T
        this.docs.set(row.id, doc)
        const idNum = parseInt(row.id, 10)
        if (!isNaN(idNum) && idNum > maxId) maxId = idNum
      } catch {}
    }
    this.counter = maxId
  }

  private writeSQLite(id: string, doc: T) {
    const sqlite = getDB()
    sqlite.prepare('INSERT OR REPLACE INTO collections (name, id, data) VALUES (?, ?, ?)').run(this.storeName, id, JSON.stringify(doc))
  }

  private deleteSQLite(id: string) {
    const sqlite = getDB()
    sqlite.prepare('DELETE FROM collections WHERE name = ? AND id = ?').run(this.storeName, id)
  }

  async create(data: Partial<T>): Promise<T> {
    this.ensureLoaded()
    const sqlite = getDB()
    sqlite.exec('BEGIN IMMEDIATE TRANSACTION')
    try {
      this.counter++
      const id = String(this.counter)
      const doc = { ...data, _id: id } as T
      this.docs.set(id, doc)
      this.writeSQLite(id, doc)
      sqlite.exec('COMMIT')
      return { ...doc }
    } catch (e) {
      sqlite.exec('ROLLBACK')
      throw e
    }
  }

  private matchValue(docValue: any, filterValue: any): boolean {
    if (filterValue !== null && typeof filterValue === 'object' && !Array.isArray(filterValue)) {
      const opKeys = Object.keys(filterValue)
      return opKeys.every(op => {
        const expected = filterValue[op]
        switch (op) {
          case '$ne': return docValue !== expected
          case '$gt': return docValue > expected
          case '$gte': return docValue >= expected
          case '$lt': return docValue < expected
          case '$lte': return docValue <= expected
          case '$in': return Array.isArray(expected) && expected.includes(docValue)
          case '$nin': return Array.isArray(expected) && !expected.includes(docValue)
          default: return docValue === filterValue
        }
      })
    }
    return docValue === filterValue
  }

  find(filter: Partial<T> = {}): { sort(s: any): any; lean(): Promise<T[]> } {
    let sortKey: keyof T | null = null
    let sortDir = 1
    const keys = Object.keys(filter) as (keyof T)[]

    const builder = {
      sort: (sortObj: any) => {
        sortKey = Object.keys(sortObj)[0] as keyof T
        sortDir = sortObj[sortKey] === 1 ? 1 : -1
        return builder
      },
      lean: async () => {
        this.ensureLoaded()
        let results = Array.from(this.docs.values())
        if (keys.length > 0) {
          results = results.filter((doc) =>
            keys.every((k) => this.matchValue(doc[k], filter[k]))
          )
        }
        if (sortKey) {
          results.sort((a, b) => {
            if ((a[sortKey!] ?? '') < (b[sortKey!] ?? '')) return -sortDir
            if ((a[sortKey!] ?? '') > (b[sortKey!] ?? '')) return sortDir
            return 0
          })
        }
        return results.map((d) => ({ ...d }))
      },
    }
    return builder
  }

  async findByIdAndUpdate(id: string, update: Partial<T>, options: { new?: boolean } = {}): Promise<T | null> {
    this.ensureLoaded()
    const existing = this.docs.get(id)
    if (!existing) return null
    const sqlite = getDB()
    sqlite.exec('BEGIN IMMEDIATE TRANSACTION')
    try {
      const updated = { ...existing, ...update } as T
      this.docs.set(id, updated)
      this.writeSQLite(id, updated)
      sqlite.exec('COMMIT')
      return options.new !== false ? { ...updated } : null
    } catch (e) {
      sqlite.exec('ROLLBACK')
      throw e
    }
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    this.ensureLoaded()
    const doc = this.docs.get(id)
    if (!doc) return null
    const sqlite = getDB()
    sqlite.exec('BEGIN IMMEDIATE TRANSACTION')
    try {
      this.docs.delete(id)
      this.deleteSQLite(id)
      sqlite.exec('COMMIT')
      return { ...doc }
    } catch (e) {
      sqlite.exec('ROLLBACK')
      throw e
    }
  }

  async findOneAndUpdate(
    filter: Partial<T>,
    updateOp: { $setOnInsert: Partial<T> },
    options: { upsert?: boolean } = {}
  ): Promise<T | null> {
    this.ensureLoaded()
    const keys = Object.keys(filter) as (keyof T)[]
    for (const doc of this.docs.values()) {
      if (keys.every((k) => doc[k] === filter[k])) {
        return doc
      }
    }
    if (options.upsert) {
      return this.create(updateOp.$setOnInsert as Partial<T>)
    }
    return null
  }

  async count(): Promise<number> {
    this.ensureLoaded()
    return this.docs.size
  }
}

const stores = new Map<string, MemoryCollection<any>>()

export function getCollection<T extends Document>(name: string): StoreCollection<T> {
  if (USE_PG) {
    return pgGetCollection<T>(name)
  }
  if (!stores.has(name)) {
    stores.set(name, new MemoryCollection<T>(name))
  }
  return stores.get(name)!
}

const pgStores = new Map<string, any>()

function pgGetCollection<T extends Document>(name: string): StoreCollection<T> {
  if (!pgStores.has(name)) {
    const { PostgresCollection } = _require('./postgres-store') as any
    pgStores.set(name, new PostgresCollection(name))
  }
  return pgStores.get(name)!
}

export async function waitForDB() {
  if (USE_PG) {
    const pg = _require('./postgres-store') as typeof import('./postgres-store')
    await pg.runMigrations()
    await pg.waitForDB()
    return
  }
  getDB()
}

export async function closeDB() {
  if (USE_PG) {
    const pg = _require('./postgres-store') as typeof import('./postgres-store')
    await pg.closeDB()
    return
  }
  if (db) {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    db.close()
    db = null
  }
}
