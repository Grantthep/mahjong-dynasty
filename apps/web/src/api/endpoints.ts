import type {
  AuthResponse,
  GameStateResponse,
  LoginInput,
  ProfileResponse,
  PublicGameConfig,
  RegisterInput,
  SpinHistoryResponse,
  SpinRequest,
  SpinResponse,
} from '@mahjong/shared';
import { apiFetch } from './client';

export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<AuthResponse>('/api/auth/register', { method: 'POST', body: input }),
  login: (input: LoginInput) =>
    apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: input }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch<AuthResponse>('/api/auth/me'),
};

export const gameApi = {
  config: () => apiFetch<PublicGameConfig>('/api/game/config'),
  state: () => apiFetch<GameStateResponse>('/api/game/state'),
  spin: (request: SpinRequest) =>
    apiFetch<SpinResponse>('/api/game/spin', { method: 'POST', body: request }),
  history: (limit = 20) => apiFetch<SpinHistoryResponse>(`/api/game/history?limit=${limit}`),
};

export const profileApi = {
  get: () => apiFetch<ProfileResponse>('/api/profile'),
};
