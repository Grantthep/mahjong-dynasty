import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BET_OPTIONS } from '@mahjong/shared';
import { HUD, type HUDProps } from './HUD';

const setup = (overrides: Partial<HUDProps> = {}) => {
  const props: HUDProps = {
    balance: 10_000,
    win: 0,
    bet: 20,
    bets: BET_OPTIONS,
    spinning: false,
    onBetChange: vi.fn(),
    onSpin: vi.fn(),
    ...overrides,
  };
  render(<HUD {...props} />);
  return props;
};

describe('HUD', () => {
  it('shows the demo balance, win and bet without currency symbols', () => {
    setup({ balance: 12_345, win: 250, bet: 50 });
    expect(screen.getByText('DEMO BALANCE')).toBeInTheDocument();
    expect(screen.getByTestId('balance-value')).toHaveTextContent('12,345');
    expect(screen.getByTestId('win-value')).toHaveTextContent('250');
    expect(screen.getByTestId('bet-value')).toHaveTextContent('50');
    expect(screen.getByRole('region', { name: 'Game controls' }).textContent).not.toMatch(/[$€£¥]/);
  });

  it('labels the game as DEMO MODE with DEMO CREDITS', () => {
    setup();
    expect(screen.getByText(/DEMO MODE · DEMO CREDITS ONLY/)).toBeInTheDocument();
  });

  it('spins when SPIN is clicked', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Spin' }));
    expect(props.onSpin).toHaveBeenCalledTimes(1);
  });

  it('disables SPIN and the bet buttons while spinning', () => {
    setup({ spinning: true });
    expect(screen.getByRole('button', { name: 'Spin' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Spin' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Increase bet' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease bet' })).toBeDisabled();
  });

  it('blocks a spin the player cannot afford and explains why', () => {
    setup({ balance: 15, bet: 20 });
    expect(screen.getByRole('button', { name: 'Spin' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Not enough DEMO CREDITS');
  });

  it('allows a spin when the balance equals the bet', () => {
    setup({ balance: 20, bet: 20 });
    expect(screen.getByRole('button', { name: 'Spin' })).toBeEnabled();
  });

  it('locks the bet and shows the remaining count during Free Spins', () => {
    setup({ balance: 0, freeSpins: { remaining: 6, total: 8 } });
    expect(screen.getByRole('button', { name: 'Free spin' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('FREE SPINS · 6 REMAINING');
    expect(screen.getByRole('button', { name: 'Increase bet' })).toBeDisabled();
  });
});
