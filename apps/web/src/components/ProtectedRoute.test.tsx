import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoUser, mockFetch, renderWithProviders } from '../test/utils';
import { ProtectedRoute } from './ProtectedRoute';

afterEach(() => vi.unstubAllGlobals());

const routes = (
  <>
    <Route path="/login" element={<p>LOGIN PAGE</p>} />
    <Route element={<ProtectedRoute />}>
      <Route path="/game" element={<p>SECRET GAME</p>} />
    </Route>
  </>
);

const render = () => renderWithProviders(<p>fallback</p>, { route: '/game', extraRoutes: routes });

describe('ProtectedRoute', () => {
  it('shows a loading state while checking the session', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    render();
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
  });

  it('renders the protected page for a logged-in player', async () => {
    mockFetch({ 'GET /api/auth/me': { body: { user: demoUser } } });
    render();
    expect(await screen.findByText('SECRET GAME')).toBeInTheDocument();
  });

  it('redirects a logged-out visitor to /login', async () => {
    mockFetch({
      'GET /api/auth/me': { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'x' } } },
    });
    render();
    expect(await screen.findByText('LOGIN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('SECRET GAME')).not.toBeInTheDocument();
  });

  it('shows an error with retry when the server is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    render();
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the game server/i);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
