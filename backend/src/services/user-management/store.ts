import { randomUUID } from "node:crypto";
import { getCollection } from "@workspace/db";
import type { UserDoc } from "./types";

const usersCol = getCollection<UserDoc>("app_users");

export async function listUsers(): Promise<UserDoc[]> {
  return usersCol.find().lean();
}

export async function findUserById(userId: string): Promise<UserDoc | null> {
  const all = await usersCol.find().lean();
  return all.find(u => u.userId === userId) ?? null;
}

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const all = await usersCol.find().lean();
  return all.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createUser(data: Omit<UserDoc, "_id" | "userId" | "createdAt" | "updatedAt">): Promise<UserDoc> {
  const doc: UserDoc = {
    userId: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  return usersCol.create(doc);
}

export async function updateUser(userId: string, data: Partial<Omit<UserDoc, "_id" | "userId" | "createdAt">>): Promise<UserDoc | null> {
  const all = await usersCol.find().lean();
  const existing = all.find(u => u.userId === userId);
  if (!existing) return null;
  return usersCol.findByIdAndUpdate(existing._id!, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteUser(userId: string): Promise<boolean> {
  const all = await usersCol.find().lean();
  const existing = all.find(u => u.userId === userId);
  if (!existing) return false;
  await usersCol.findByIdAndDelete(existing._id!);
  return true;
}
