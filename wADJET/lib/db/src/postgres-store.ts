import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Document {
  _id: string;
  [key: string]: any;
}

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (pool) return pool;
  pool = new pg.Pool({
    connectionString: process.env["DATABASE_URL"] || "postgresql://localhost:5432/wadjet",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err.message);
  });
  return pool;
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

function rowToDoc(row: { _id: string; data: any }): any {
  if (!row) return null;
  const doc = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
  return { ...doc, _id: row._id };
}

export async function runMigrations(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    const { rows: applied } = await client.query("SELECT name FROM _migrations ORDER BY name");
    const appliedSet = new Set(applied.map((r: any) => r.name));

    const schemaPath = resolve(__dirname, "../../../../database/schema.sql");
    let sql: string;
    try {
      sql = readFileSync(schemaPath, "utf-8");
    } catch {
      console.warn("schema.sql not found at", schemaPath);
      return;
    }

    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    for (const stmt of statements) {
      const name = `migrate_${Buffer.from(stmt.slice(0, 40)).toString("base64").replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (appliedSet.has(name)) continue;
      try {
        await client.query(stmt);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        console.log(`Migration applied: ${name}`);
      } catch (err: any) {
        console.warn(`Migration skipped (${name}): ${err.message}`);
      }
    }
  } finally {
    client.release();
  }
}

class PostgresCollection<T extends Document> {
  private tableName: string;
  private counter = 0;

  constructor(name: string) {
    this.tableName = name;
  }

  private async ensureTable(): Promise<void> {
    const client = await getPool().connect();
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS ${this.tableName} (
        _id TEXT PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_data ON ${this.tableName} USING gin(data)`);
    } finally {
      client.release();
    }
  }

  private async nextId(): Promise<string> {
    const client = await getPool().connect();
    try {
      const { rows } = await client.query(
        `SELECT COALESCE(MAX(CAST(_id AS INTEGER)), 0) + 1 AS next_id FROM ${this.tableName} WHERE _id ~ '^\\d+$'`
      );
      return String(rows[0].next_id);
    } catch {
      this.counter++;
      return String(this.counter);
    } finally {
      client.release();
    }
  }

  async create(data: Partial<T>): Promise<T> {
    await this.ensureTable();
    const client = await getPool().connect();
    try {
      const id = await this.nextId();
      const doc = { ...data, _id: id } as T;
      await client.query(
        `INSERT INTO ${this.tableName} (_id, data) VALUES ($1, $2) ON CONFLICT (_id) DO NOTHING`,
        [id, JSON.stringify(doc)]
      );
      return { ...doc };
    } finally {
      client.release();
    }
  }

  find(filter: Partial<T> = {}): { sort(s: any): any; lean(): Promise<T[]> } {
    let sortKey: keyof T | null = null;
    let sortDir = 1;
    const keys = Object.keys(filter) as (keyof T)[];

    const builder = {
      sort: (sortObj: any) => {
        sortKey = Object.keys(sortObj)[0] as keyof T;
        sortDir = sortObj[sortKey] === 1 ? 1 : -1;
        return builder;
      },
      lean: async () => {
        const client = await getPool().connect();
        try {
          let query = `SELECT _id, data FROM ${this.tableName}`;
          const params: any[] = [];
          const conditions: string[] = [];

          if (keys.length > 0) {
            const paramIndex = 1;
            keys.forEach((k, i) => {
              const v = filter[k];
              if (v !== undefined) {
                conditions.push(`data->>'${String(k)}' = $${params.length + 1}`);
                params.push(String(v));
              }
            });
          }

          if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
          }

          if (sortKey) {
            query += ` ORDER BY data->>'${String(sortKey)}' ${sortDir === 1 ? "ASC" : "DESC"}`;
          }

          const { rows } = await client.query(query, params);
          return rows.map(rowToDoc) as T[];
        } finally {
          client.release();
        }
      },
    };
    return builder;
  }

  async findByIdAndUpdate(id: string, update: Partial<T>, options: { new?: boolean } = {}): Promise<T | null> {
    await this.ensureTable();
    const client = await getPool().connect();
    try {
      const { rows: existing } = await client.query(`SELECT _id, data FROM ${this.tableName} WHERE _id = $1`, [id]);
      if (existing.length === 0) return null;
      const doc = rowToDoc(existing[0]);
      const updated = { ...doc, ...update };
      await client.query(`UPDATE ${this.tableName} SET data = $1, updated_at = NOW() WHERE _id = $2`, [
        JSON.stringify(updated),
        id,
      ]);
      return options.new !== false ? (updated as T) : null;
    } finally {
      client.release();
    }
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    await this.ensureTable();
    const client = await getPool().connect();
    try {
      const { rows } = await client.query(
        `DELETE FROM ${this.tableName} WHERE _id = $1 RETURNING _id, data`,
        [id]
      );
      if (rows.length === 0) return null;
      return rowToDoc(rows[0]) as T;
    } finally {
      client.release();
    }
  }

  async findOneAndUpdate(
    filter: Partial<T>,
    updateOp: { $setOnInsert: Partial<T> },
    options: { upsert?: boolean } = {}
  ): Promise<T | null> {
    await this.ensureTable();
    const client = await getPool().connect();
    try {
      const keys = Object.keys(filter) as (keyof T)[];
      const conditions = keys.map((k, i) => `data->>'${String(k)}' = $${i + 1}`).join(" AND ");
      const params = keys.map((k) => String(filter[k]));

      const { rows } = await client.query(
        `SELECT _id, data FROM ${this.tableName} WHERE ${conditions}`,
        params
      );

      if (rows.length > 0) {
        return rowToDoc(rows[0]) as T;
      }

      if (options.upsert) {
        return this.create(updateOp.$setOnInsert as Partial<T>);
      }
      return null;
    } finally {
      client.release();
    }
  }

  async count(): Promise<number> {
    await this.ensureTable();
    const client = await getPool().connect();
    try {
      const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      return Number(rows[0].count);
    } finally {
      client.release();
    }
  }
}

const stores = new Map<string, PostgresCollection<any>>();

export function getCollection<T extends Document>(name: string): PostgresCollection<T> {
  if (!stores.has(name)) {
    stores.set(name, new PostgresCollection<T>(name));
  }
  return stores.get(name)!;
}

export async function waitForDB(): Promise<void> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("SELECT 1");
    console.log("PostgreSQL connected");
  } finally {
    client.release();
  }
}

export async function closeDB(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
