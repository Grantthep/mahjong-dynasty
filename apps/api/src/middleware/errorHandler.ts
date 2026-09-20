import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@mahjong/shared';
import { AppError } from '../utils/AppError';

interface HttpishError {
  status?: number;
  type?: string;
}

const body = (code: string, message: string, details?: unknown): ApiErrorBody => ({
  error: { code, message, ...(details === undefined ? {} : { details }) },
});

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body('NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
};

/** Central error handler: never leaks stack traces or internal messages. */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(body(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json(
      body(
        'VALIDATION_ERROR',
        err.issues[0]?.message ?? 'Invalid request',
        err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      ),
    );
    return;
  }

  const http = err as HttpishError;
  if (http?.type === 'entity.too.large') {
    res.status(413).json(body('PAYLOAD_TOO_LARGE', 'Request body is too large'));
    return;
  }
  if (http?.type === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'Request body is not valid JSON'));
    return;
  }

  console.error('[api] Unhandled error:', err);
  res.status(500).json(body('INTERNAL_ERROR', 'Something went wrong on our side'));
};
