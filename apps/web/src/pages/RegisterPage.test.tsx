import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoUser, mockFetch, renderWithProviders } from '../test/utils';
import RegisterPage from './RegisterPage';

afterEach(() => vi.unstubAllGlobals());

const loggedOut = {
  status: 401,
  body: { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
};

async function fill(email: string, username: string, password: string) {
  await userEvent.type(await screen.findByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Username'), username);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterPage', () => {
  it('explains the demo credits', async () => {
    mockFetch({ 'GET /api/auth/me': loggedOut });
    renderWithProviders(<RegisterPage />, { route: '/register' });
    expect(await screen.findByText(/10,000 DEMO CREDITS/)).toBeInTheDocument();
  });

  it('validates email, username and password', async () => {
    const { calls } = mockFetch({ 'GET /api/auth/me': loggedOut });
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await fill('nope', 'a!', 'short');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(calls.some((c) => c.key === 'POST /api/auth/register')).toBe(false);
  });

  it('rejects usernames with invalid characters', async () => {
    mockFetch({ 'GET /api/auth/me': loggedOut });
    renderWithProviders(<RegisterPage />, { route: '/register' });
    await fill('a@example.com', 'bad name', 'Password123');
    expect(
      await screen.findByText('Use letters, numbers and underscores only'),
    ).toBeInTheDocument();
  });

  it('registers with valid data', async () => {
    const { calls } = mockFetch({
      'GET /api/auth/me': loggedOut,
      'POST /api/auth/register': { status: 201, body: { user: demoUser } },
    });
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await fill('New@Example.com', 'new_player', 'Password123');

    await waitFor(() => expect(calls.some((c) => c.key === 'POST /api/auth/register')).toBe(true));
    const call = calls.find((c) => c.key === 'POST /api/auth/register');
    expect(JSON.parse(call?.init?.body as string)).toEqual({
      email: 'new@example.com',
      username: 'new_player',
      password: 'Password123',
    });
  });

  it('shows a duplicate-email error from the server', async () => {
    mockFetch({
      'GET /api/auth/me': loggedOut,
      'POST /api/auth/register': {
        status: 409,
        body: {
          error: { code: 'EMAIL_TAKEN', message: 'An account with that email already exists' },
        },
      },
    });
    renderWithProviders(<RegisterPage />, { route: '/register' });
    await fill('taken@example.com', 'someone', 'Password123');
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });
});
