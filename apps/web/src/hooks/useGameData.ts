import { useQuery } from '@tanstack/react-query';
import type { LeaderboardPeriod } from '@mahjong/shared';
import { adminApi, gameApi, leaderboardApi, profileApi } from '../api/endpoints';

export const GAME_STATE_KEY = ['game', 'state'] as const;

export const useGameConfig = () =>
  useQuery({ queryKey: ['game', 'config'], queryFn: gameApi.config, staleTime: Infinity });

/** Fetched fresh whenever the game page mounts (a refresh must restore server state). */
export const useGameState = () =>
  useQuery({
    queryKey: GAME_STATE_KEY,
    queryFn: gameApi.state,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

export const useLeaderboard = (period: LeaderboardPeriod) =>
  useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => leaderboardApi.get(period),
    staleTime: 15_000,
  });

/** Only asks the server when the user is an admin (everyone else would just get a 403). */
export const useAdminAnalytics = (enabled: boolean) =>
  useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminApi.analytics,
    enabled,
    staleTime: 0,
    retry: false,
  });

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: profileApi.get, staleTime: 0 });
