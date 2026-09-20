import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

/** Validates and replaces req.body with the parsed (trimmed/normalised) value. */
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    req.body = parsed.data;
    next();
  };

/** Validates the query string; the result is stored in res.locals.query (req.query is read-only in Express 5). */
export const validateQuery =
  (schema: ZodTypeAny): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    res.locals.query = parsed.data;
    next();
  };

export const getQuery = <S extends ZodTypeAny>(
  res: { locals: Record<string, unknown> },
  _schema: S,
): z.infer<S> => res.locals.query as z.infer<S>;
