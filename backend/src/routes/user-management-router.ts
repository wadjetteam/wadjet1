import { Router } from "express";
import { asyncHandler, AppError } from "../middleware/error-handler";
import * as userStore from "../services/user-management/store";
import { ALL_PERMISSIONS } from "../services/user-management/types";

const router = Router();

router.get("/permissions", asyncHandler(async (_req, res) => {
  res.json({ permissions: ALL_PERMISSIONS });
}));

router.get("/users", asyncHandler(async (_req, res) => {
  const users = await userStore.listUsers();
  res.json({ users });
}));

router.get("/users/:userId", asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;
  const user = await userStore.findUserById(userId);
  if (!user) throw new AppError(404, "User not found");
  res.json({ user });
}));

router.post("/users", asyncHandler(async (req, res) => {
  const { name, email, jobTitle, permissions } = req.body;
  if (!name || !email) {
    throw new AppError(400, "name and email are required");
  }
  const existing = await userStore.findUserByEmail(email as string);
  if (existing) throw new AppError(409, "Email already registered");
  const user = await userStore.createUser({
    name: name as string,
    email: email as string,
    jobTitle: (jobTitle as string) ?? "",
    permissions: Array.isArray(permissions) ? permissions : [],
  });
  res.status(201).json({ user });
}));

router.put("/users/:userId", asyncHandler(async (req, res) => {
  const { name, email, jobTitle, permissions } = req.body;
  const userId = req.params.userId as string;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email;
  if (jobTitle !== undefined) update.jobTitle = jobTitle;
  if (permissions !== undefined) update.permissions = permissions;
  const user = await userStore.updateUser(userId, update);
  if (!user) throw new AppError(404, "User not found");
  res.json({ user });
}));

router.delete("/users/:userId", asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;
  const deleted = await userStore.deleteUser(userId);
  if (!deleted) throw new AppError(404, "User not found");
  res.json({ success: true });
}));

export default router;
