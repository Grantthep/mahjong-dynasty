import type { LeaderboardPeriod } from '../schemas/game';

/** One row of the demo-wins leaderboard: a single spin, best wins first. */
export interface LeaderboardEntry {
  rank: number;
  username: string;
  /** Demo credits won in that one spin. */
  win: number;
  bet: number;
  /** win / bet, rounded to one decimal. */
  multiple: number;
  isFreeSpin: boolean;
  createdAt: string;
  /** True for the signed-in player's own rows. */
  isYou: boolean;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
}
