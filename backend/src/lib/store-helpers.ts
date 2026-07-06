export async function findById<T extends { _id?: string }>(
  collection: { find: (filter?: any) => { lean: () => Promise<T[]> } },
  id: string | string[],
): Promise<T | null> {
  const idStr = Array.isArray(id) ? id[0] : id;
  if (!idStr) return null;
  const items = await collection.find({ _id: idStr }).lean();
  return items[0] || null;
}

export function queryParam(value: unknown): string {
  if (Array.isArray(value)) return String(value[0]);
  return String(value ?? "");
}

export function queryParamOptional(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return String(value[0]);
  return String(value);
}

export function routeParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}
