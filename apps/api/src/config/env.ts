import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const PLACEHOLDER_SECRET = 'change-me';

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    /** Reverse proxies in front of the API (e.g. 1 behind nginx). 0 = the API is reached directly. */
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  })
  .superRefine((value, ctx) => {
    if (
      value.NODE_ENV === 'production' &&
      (value.JWT_SECRET.length < 32 || value.JWT_SECRET.startsWith(PLACEHOLDER_SECRET))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'Production requires a random JWT_SECRET of at least 32 characters',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Loads the repository-root .env (when present) without overriding real environment variables. */
export function loadDotenv(): void {
  for (const candidate of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) {
    dotenv.config({ path: candidate });
  }
}

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}\nSee .env.example`);
  }
  return parsed.data;
}
