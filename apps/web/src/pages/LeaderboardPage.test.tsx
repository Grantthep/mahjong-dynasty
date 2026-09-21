import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LeaderboardPage from './LeaderboardPage';
import { mockFetch, renderWithProviders } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const entry = (rank: number, username: string, win: number, extra = {}) => ({
  rank,
  username,
  win,
  bet: 20,
  multiple: win / 20,
  isFreeSpin: false,
  createdAt: '2026-09-20T10:00:00.000Z',
  isYou: false,
  ...extra,
});

describe('LeaderboardPage', () => {
  it('lists the top wins and marks the player’s own row', async () => {
    mockFetch({
      'GET /api/leaderboard': {
        body: {
          period: 'all',
          entries: [
            entry(1, 'dragon_king', 5000),
            entry(2, 'demo_player', 1200, { isYou: true }),
            entry(3, 'lotus', 800, { isFreeSpin: true }),
          ],
        },
      },
    });
    renderWithProviders(<LeaderboardPage />);

    expect(await screen.findByRole('heading', { name: 'Top demo wins' })).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText('dragon_king')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('5,000')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('×250')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('YOU')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('FREE SPIN')).toBeInTheDocument();
    expect(screen.getByRole('main').textContent).not.toMatch(/[$€£¥]/);
  });

  it('asks the server for the last 24 hours when that tab is chosen', async () => {
    const { fetchMock } = mockFetch({
      'GET /api/leaderboard': { body: { period: 'all', entries: [] } },
    });
    renderWithProviders(<LeaderboardPage />);
    await screen.findByText('No wins yet. Be the first!');
    expect(screen.getByRole('button', { name: 'All time' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Last 24 hours' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Last 24 hours' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.some((url) => url.includes('period=all'))).toBe(true);
    expect(urls.some((url) => url.includes('period=day'))).toBe(true);
  });

  it('shows a friendly message when the leaderboard cannot be loaded', async () => {
    mockFetch({
      'GET /api/leaderboard': { status: 500, body: { error: { code: 'X', message: 'boom' } } },
    });
    renderWithProviders(<LeaderboardPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the leaderboard.');
  });
});
