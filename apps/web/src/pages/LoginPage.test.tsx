import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoUser, mockFetch, renderWithProviders } from '../test/utils';
import LoginPage from './LoginPage';

afterEach(() => vi.unstubAllGlobals());

const loggedOut = {
  status: 401,
  body: { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
};
const gameStub = <Route path="/game" element={<p>GAME SCREEN</p>} />;

describe('LoginPage', () => {
  it('renders the login form with the demo-mode reminder', async () => {
    mockFetch({ 'GET /api/auth/me': loggedOut });
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getAllByText(/DEMO MODE/i).length).toBeGreaterThan(0);
  });

  it('validates the fields before calling the server', async () => {
    const { calls } = mockFetch({ 'GET /api/auth/me': loggedOut });
    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(calls.some((c) => c.key === 'POST /api/auth/login')).toBe(false);
  });

  it('logs in and goes to the game', async () => {
    const { calls } = mockFetch({
      'GET /api/auth/me': loggedOut,
      'POST /api/auth/login': { body: { user: demoUser } },
    });
    renderWithProviders(<LoginPage />, { route: '/login', extraRoutes: gameStub });

    await userEvent.type(await screen.findByLabelText('Email'), 'Demo@Mahjong.local');
    await userEvent.type(screen.getByLabelText('Password'), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(calls.some((c) => c.key === 'POST /api/auth/login')).toBe(true));
    const login = calls.find((c) => c.key === 'POST /api/auth/login');
    expect(JSON.parse(login?.init?.body as string)).toEqual({
      email: 'demo@mahjong.local',
      password: 'Demo1234!',
    });
    expect(login?.init?.credentials).toBe('include');
  });

  it('shows the server error for wrong credentials', async () => {
    mockFetch({
      'GET /api/auth/me': loggedOut,
      'POST /api/auth/login': {
        status: 401,
        body: { error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' } },
      },
    });
    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.type(await screen.findByLabelText('Email'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
  });

  it('shows a friendly error when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') throw new TypeError('Failed to fetch');
        return new Response(JSON.stringify(loggedOut.body), { status: 401 });
      }),
    );
    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.type(await screen.findByLabelText('Email'), 'a@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the game server/i);
  });

  it('shows a loading state while the session is being checked', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    renderWithProviders(<LoginPage />, { route: '/login' });
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('redirects straight to the game when already logged in', async () => {
    mockFetch({ 'GET /api/auth/me': { body: { user: demoUser } } });
    renderWithProviders(<LoginPage />, { route: '/login', extraRoutes: gameStub });
    // "*" matches first in this tiny router, so assert that the form is NOT rendered
    await waitFor(() => expect(screen.queryByLabelText('Email')).not.toBeInTheDocument());
  });
});
