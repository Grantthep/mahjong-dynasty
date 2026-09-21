import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/endpoints';

export const ME_KEY = ['auth', 'me'] as const;

/**
 * The current guest player. There is no sign-up or log-in: the first call makes the server create
 * a guest (Guest4821) and the browser keeps the cookie; every later visit gets the same player back.
 */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => (await authApi.guest()).user,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}
