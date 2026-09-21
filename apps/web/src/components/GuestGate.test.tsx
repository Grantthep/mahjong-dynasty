import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoUser, mockFetch, renderWithProviders } from '../test/utils';
import { GuestGate } from './GuestGate';

afterEach(() => vi.unstubAllGlobals());

const routes = (
  <Route element={<GuestGate />}>
    <Route path="/" element={<p>THE GAME</p>} />
  </Route>
);

const render = () => renderWithProviders(<p>fallback</p>, { route: '/', extraRoutes: routes });

// The app retries once before giving up, so the error appears after about a second.
describe('GuestGate', { timeout: 15_000 }, () => {
  it('shows a loading state while the guest player is being set up', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    render();
    expect(screen.getByRole('status')).toHaveTextContent('Entering the palace');
  });

  it('asks the server for the guest once and then shows the page (no login screen)', async () => {
    const { calls } = mockFetch({
      'POST /api/auth/guest': { status: 201, body: { user: demoUser } },
    });
    render();
    expect(await screen.findByText('THE GAME')).toBeInTheDocument();
    expect(calls.filter((call) => call.key === 'POST /api/auth/guest')).toHaveLength(1);
    expect(screen.queryByText(/log in|register/i)).not.toBeInTheDocument();
  });

  it('shows an error with retry when the server cannot make a guest', async () => {
    mockFetch({
      'POST /api/auth/guest': {
        status: 429,
        body: {
          error: { code: 'AUTH_RATE_LIMITED', message: 'Too many new players from this address.' },
        },
      },
    });
    render();
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      'Too many new players',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows an error with retry when the server is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    render();
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      /cannot reach the game server/i,
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
