import { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { isProduction } from '../config/env';
import { ApiError } from '../utils/ApiError';

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (err: unknown): err is MongoDuplicateKeyError =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

const isMalformedJson = (err: unknown): boolean =>
  err instanceof SyntaxError && (err as { type?: string }).type === 'entity.parse.failed';

/** Normalizes every error type into an ApiError so responses have a single consistent shape. */
const toApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;

  if (isMalformedJson(err)) return ApiError.badRequest('Malformed JSON in request body');

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  return new ApiError(500, 'Internal server error');
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const apiError = toApiError(err);

  if (apiError.statusCode >= 500) {
    console.error(err);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details !== undefined && { errors: apiError.details }),
    ...(!isProduction && apiError.statusCode >= 500 && err instanceof Error && { stack: err.stack }),
  });
};
