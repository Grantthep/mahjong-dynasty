import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminPage from './AdminPage';
import { demoUser, mockFetch, renderWithProviders } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const analytics = {
  generatedAt: '2026-09-21T12:00:00.000Z',
  totals: {
    players: 12,
    admins: 1,
    newPlayersLast7Days: 4,
    totalSpins: 1500,
    paidSpins: 1400,
    freeSpins: 100,
    totalBet: 28_000,
    totalWon: 26_600,
    observedReturn: 0.95,
    largestWin: 4321,
    freeSpinTriggers: 17,
    dragonFortuneTriggers: 90,
    wildReelRespins: 66,
  },
  daily: Array.from({ length: 14 }, (_, i) => ({
    date: `2026-09-${String(8 + i).padStart(2, '0')}`,
    spins: i * 10,
    bet: i * 200,
    won: i * 190,
  })),
  topPlayers: [{ username: 'dragon_king', spins: 300, totalBet: 6000, totalWon: 7200 }],
};

describe('AdminPage', () => {
  it('turns non-admins away without asking the server for any data', async () => {
    const { calls } = mockFetch({ 'GET /api/auth/me': { body: { user: demoUser } } });
    renderWithProviders(<AdminPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Administrator access required.');
    expect(calls.some((call) => call.key.includes('/api/admin'))).toBe(false);
  });

  it('shows the totals, the chart and the tables to an administrator', async () => {
    mockFetch({
      'GET /api/auth/me': { body: { user: { ...demoUser, role: 'ADMIN' } } },
      'GET /api/admin/analytics': { body: analytics },
    });
    renderWithProviders(<AdminPage />);

    expect(await screen.findByTestId('observed-return')).toHaveTextContent('95.00%');
    expect(screen.getByText('1,500')).toBeInTheDocument(); // total spins
    expect(screen.getByText('28,000')).toBeInTheDocument(); // credits bet
    expect(screen.getByText('dragon_king')).toBeInTheDocument();
    expect(screen.getByText('120.00%')).toBeInTheDocument(); // that player's return
    expect(screen.getByRole('img', { name: 'Spins per day' })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/spins$/)).toHaveLength(14);
    // The table view repeats the chart's numbers, newest day first.
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('2026-09-21');
    expect(screen.getByRole('main').textContent).not.toMatch(/[$€£¥]/);
  });

  it('shows a dash instead of a return before the first bet', async () => {
    mockFetch({
      'GET /api/auth/me': { body: { user: { ...demoUser, role: 'ADMIN' } } },
      'GET /api/admin/analytics': {
        body: {
          ...analytics,
          totals: { ...analytics.totals, totalBet: 0, totalWon: 0, observedReturn: 0 },
          topPlayers: [],
        },
      },
    });
    renderWithProviders(<AdminPage />);
    expect(await screen.findByTestId('observed-return')).toHaveTextContent('—');
  });
});
