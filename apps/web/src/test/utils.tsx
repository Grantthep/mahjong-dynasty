import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

export interface MockResponse {
  status?: number;
  body?: unknown;
}

type Handler = MockResponse | ((init: RequestInit | undefined) => MockResponse);

/**
 * Replaces global fetch with a router keyed by "METHOD /path". Unknown requests fail the test
 * loudly so a missing mock never hides a bug.
 */
export function mockFetch(routes: Record<string, Handler>) {
  const calls: { key: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const key = `${init?.method ?? 'GET'} ${url.split('?')[0]}`;
    calls.push({ key, init });
    const handler = routes[key];
    if (!handler) throw new Error(`Unmocked request: ${key}`);
    const { status = 200, body } = typeof handler === 'function' ? handler(init) : handler;
    return new Response(status === 204 ? null : JSON.stringify(body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, calls };
}

export function renderWithProviders(
  ui: ReactElement,
  options: { route?: string; extraRoutes?: ReactElement } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>
        <Routes>
          <Route path="*" element={ui} />
          {options.extraRoutes}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export const demoUser = {
  id: 'user-1',
  email: 'demo@mahjong.local',
  username: 'demo_player',
  demoBalance: 10_000,
  createdAt: '2026-01-01T00:00:00.000Z',
};
