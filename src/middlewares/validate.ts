import { RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validates req.body / req.params / req.query against a zod schema.
 * Parsed (and coerced) values replace the originals.
 */
export const validate =
  (schema: AnyZodObject): RequestHandler =>
  (req, _res, next) => {
    try {
      const parsed = schema.parse({ body: req.body, params: req.params, query: req.query });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) req.params = parsed.params;
      if (parsed.query !== undefined) req.query = parsed.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.slice(1).join('.'),
          message: issue.message,
        }));
        next(ApiError.badRequest('Validation failed', details));
        return;
      }
      next(error);
    }
  };
