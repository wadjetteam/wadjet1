interface Document {
  _id: string;
  [key: string]: any;
}

class MemoryCollection<T extends Document> {
  private docs: Map<string, T> = new Map();
  private counter = 0;

  async create(data: Partial<T>): Promise<T> {
    this.counter++;
    const doc = { ...data, _id: String(this.counter) } as T;
    this.docs.set(doc._id, doc);
    return { ...doc };
  }

  find(filter: Partial<T> = {}): { sort(s: any): any; lean(): Promise<T[]> } {
    let results = Array.from(this.docs.values());
    const keys = Object.keys(filter) as (keyof T)[];
    if (keys.length > 0) {
      results = results.filter((doc) =>
        keys.every((k) => doc[k] === filter[k])
      );
    }

    const builder = {
      sort(sortObj: any) {
        const key = Object.keys(sortObj)[0] as keyof T;
        const dir = sortObj[key] === 1 ? 1 : -1;
        results.sort((a, b) => {
          if ((a[key] ?? '') < (b[key] ?? '')) return -dir;
          if ((a[key] ?? '') > (b[key] ?? '')) return dir;
          return 0;
        });
        return builder;
      },
      lean() {
        return Promise.resolve(results.map((d) => ({ ...d })));
      },
    };
    return builder;
  }

  async findByIdAndUpdate(
    id: string,
    update: Partial<T>,
    options: { new?: boolean } = {}
  ): Promise<T | null> {
    const existing = this.docs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update } as T;
    this.docs.set(id, updated);
    return options.new !== false ? { ...updated } : null;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const doc = this.docs.get(id);
    if (!doc) return null;
    this.docs.delete(id);
    return { ...doc };
  }

  async findOneAndUpdate(
    filter: Partial<T>,
    updateOp: { $setOnInsert: Partial<T> },
    options: { upsert?: boolean } = {}
  ): Promise<T | null> {
    const keys = Object.keys(filter) as (keyof T)[];
    for (const doc of this.docs.values()) {
      if (keys.every((k) => doc[k] === filter[k])) {
        return doc;
      }
    }
    if (options.upsert) {
      return this.create(updateOp.$setOnInsert as Partial<T>);
    }
    return null;
  }

  count(): number {
    return this.docs.size;
  }
}

const stores = new Map<string, MemoryCollection<any>>();

export function getCollection<T extends Document>(name: string): MemoryCollection<T> {
  if (!stores.has(name)) {
    stores.set(name, new MemoryCollection<T>());
  }
  return stores.get(name)!;
}

export async function waitForDB() {}

export async function closeDB() {}
