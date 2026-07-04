export interface Document {
  _id?: string;
  [key: string]: any;
}

export interface SortBuilder<T> {
  sort(sortObj: Partial<Record<keyof T, 1 | -1>>): SortBuilder<T>;
  lean(): Promise<T[]>;
}

export interface StoreCollection<T extends Document> {
  find(filter?: Partial<T>): SortBuilder<T>;
  findByIdAndUpdate(id: string, update: Partial<T>, options?: { new?: boolean }): Promise<T | null>;
  findByIdAndDelete(id: string): Promise<T | null>;
  findOneAndUpdate(
    filter: Partial<T>,
    updateOp: { $setOnInsert: Partial<T> },
    options?: { upsert?: boolean }
  ): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  count(): Promise<number>;
}
