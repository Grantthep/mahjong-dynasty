import type { SpinHistoryItem } from './game';

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  demoBalance: number;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
}

export interface ProfileStats {
  totalSpins: number;
  totalBet: number;
  totalWon: number;
  largestWin: number;
  freeSpinsTriggered: number;
  dragonFortuneTriggers: number;
}

export interface ProfileResponse {
  user: UserDTO;
  stats: ProfileStats;
  recentSpins: SpinHistoryItem[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: 'ok';
  demoMode: true;
  time: string;
}
