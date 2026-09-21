import { z } from 'zod';
import { BET_OPTIONS } from '../constants/game';

export const betSchema = z
  .number({ invalid_type_error: 'Bet must be a number' })
  .int()
  .refine((value) => (BET_OPTIONS as readonly number[]).includes(value), {
    message: `Bet must be one of: ${BET_OPTIONS.join(', ')}`,
  });

export const spinRequestSchema = z.object({
  bet: betSchema,
  /** Client-generated idempotency key: the same key never charges twice. */
  requestId: z.string().uuid('requestId must be a UUID'),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const LEADERBOARD_PERIODS = ['day', 'all'] as const;

export const leaderboardQuerySchema = z.object({
  /** "day" = the last 24 hours. */
  period: z.enum(LEADERBOARD_PERIODS).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SpinRequest = z.infer<typeof spinRequestSchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];
