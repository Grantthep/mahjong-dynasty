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

  describe('turbo', () => {
    const autoHandlers = { onAutoToggle: vi.fn() };

    it('toggles turbo and shows its state', async () => {
      const onTurboChange = vi.fn();
      setup({ turbo: false, onTurboChange, ...autoHandlers });
      const button = screen.getByRole('button', { name: 'TURBO' });
      expect(button).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(button);
      expect(onTurboChange).toHaveBeenCalledWith(true);
    });

    it('has no SKIP button, not even while a spin is being shown', () => {
      setup({ spinning: true, onTurboChange: vi.fn(), ...autoHandlers });
      expect(screen.queryByRole('button', { name: 'SKIP' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'TURBO' })).toBeInTheDocument();
    });
  });

  describe('auto spin', () => {
    const autoHandlers = () => ({ onAutoToggle: vi.fn() });

    it('has ONE button that starts auto spin and shows no pause or resume', async () => {
      const handlers = autoHandlers();
      setup({ auto: false, ...handlers });
      expect(screen.queryByRole('button', { name: 'PAUSE' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'RESUME' })).not.toBeInTheDocument();
      const button = screen.getByRole('button', { name: 'AUTO SPIN' });
      expect(button).toHaveAttribute('aria-pressed', 'false');
      await userEvent.click(button);
      expect(handlers.onAutoToggle).toHaveBeenCalledTimes(1);
    });

    it('turns the same button into STOP AUTO while running', async () => {
      const handlers = autoHandlers();
      setup({ auto: true, ...handlers });
      expect(screen.getByRole('status')).toHaveTextContent('AUTO SPIN ON');
      expect(screen.queryByRole('button', { name: 'AUTO SPIN' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'PAUSE' })).not.toBeInTheDocument();
      const button = screen.getByRole('button', { name: 'STOP AUTO' });
      expect(button).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(button);
      expect(handlers.onAutoToggle).toHaveBeenCalledTimes(1);
    });

    it('lets the player pick how many auto spins to play, including until stopped', async () => {
      const onAutoLimitChange = vi.fn();
      setup({ auto: false, autoLimit: null, onAutoLimitChange, ...autoHandlers() });
      const select = screen.getByRole('combobox', { name: 'Number of auto spins' });
      expect(select).toHaveValue('inf');
      await userEvent.selectOptions(select, '25');
      expect(onAutoLimitChange).toHaveBeenLastCalledWith(25);
      await userEvent.selectOptions(select, 'inf');
      expect(onAutoLimitChange).toHaveBeenLastCalledWith(null);
    });

    it('hides the count picker and shows the spins left while running', () => {
      setup({
        auto: true,
        autoLimit: 50,
        autoLeft: 37,
        onAutoLimitChange: vi.fn(),
        ...autoHandlers(),
      });
      expect(
        screen.queryByRole('combobox', { name: 'Number of auto spins' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('AUTO SPIN ON · 37 left');
    });

    it('cannot start auto spin without enough balance', () => {
      setup({ balance: 5, bet: 20, auto: false, ...autoHandlers() });
      expect(screen.getByRole('button', { name: 'AUTO SPIN' })).toBeDisabled();
    });
  });
});
