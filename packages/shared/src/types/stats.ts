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

export interface AnalyticsTotals {
  players: number;
  admins: number;
  newPlayersLast7Days: number;
  totalSpins: number;
  paidSpins: number;
  freeSpins: number;
  /** Demo credits bet on paid spins (Free Spins are not charged). */
  totalBet: number;
  totalWon: number;
  /** totalWon / totalBet, or 0 before the first bet. Observed, not certified. */
  observedReturn: number;
  largestWin: number;
  freeSpinTriggers: number;
  dragonFortuneTriggers: number;
  wildReelRespins: number;
}

export interface AnalyticsDay {
  /** UTC calendar day, YYYY-MM-DD. */
  date: string;
  spins: number;
  bet: number;
  won: number;
}

export interface AnalyticsTopPlayer {
  username: string;
  spins: number;
  totalBet: number;
  totalWon: number;
}

export interface AdminAnalyticsResponse {
  generatedAt: string;
  totals: AnalyticsTotals;
  /** The last 14 UTC days, oldest first, including days with no spins. */
  daily: AnalyticsDay[];
  topPlayers: AnalyticsTopPlayer[];
}
