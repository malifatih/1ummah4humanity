import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';
import { AppError } from './errorHandler.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const details: Record<string, string[]> = {};
      for (const [key, messages] of Object.entries(errors)) {
        if (messages) details[key] = messages;
      }
      throw new AppError(400, 'Validation error', details);
    }
    req[source] = result.data;
    next();
  };
}

// Common validation schemas
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const usernameParamSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});
