import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodIssue } from "zod";
import { AppError } from "./error-handler";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, result.error.issues.map((i: ZodIssue) => i.message).join("; ")));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new AppError(400, result.error.issues.map((i: ZodIssue) => i.message).join("; ")));
      return;
    }
    next();
  };
}
