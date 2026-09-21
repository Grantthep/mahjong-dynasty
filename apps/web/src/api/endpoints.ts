import type {
  AuthResponse,
  GameStateResponse,
  LeaderboardPeriod,
  LeaderboardResponse,
  ProfileResponse,
  PublicGameConfig,
  SpinHistoryResponse,
  SpinRequest,
  SpinResponse,
} from '@mahjong/shared';
import { apiFetch } from './client';

export const authApi = {
  /** Returns this browser's guest player, creating one on the very first visit. */
  guest: () => apiFetch<AuthResponse>('/api/auth/guest', { method: 'POST' }),
  me: () => apiFetch<AuthResponse>('/api/auth/me'),
};

export const gameApi = {
  config: () => apiFetch<PublicGameConfig>('/api/game/config'),
  state: () => apiFetch<GameStateResponse>('/api/game/state'),
  spin: (request: SpinRequest) =>
    apiFetch<SpinResponse>('/api/game/spin', { method: 'POST', body: request }),
  history: (limit = 20) => apiFetch<SpinHistoryResponse>(`/api/game/history?limit=${limit}`),
};

export const leaderboardApi = {
  get: (period: LeaderboardPeriod, limit = 20) =>
    apiFetch<LeaderboardResponse>(`/api/leaderboard?period=${period}&limit=${limit}`),
};

export const profileApi = {
  get: () => apiFetch<ProfileResponse>('/api/profile'),
};
