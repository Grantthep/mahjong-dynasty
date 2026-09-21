import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BET_OPTIONS } from '@mahjong/shared';
import { formatPay, Paytable } from './Paytable';

const paytable = {
  circle: { 3: 0.007, 4: 0.016, 5: 0.04, 6: 0.098 },
  'red-dragon': { 3: 0.048, 4: 0.125, 5: 0.32, 6: 0.8 },
};

describe('Paytable', () => {
  it('shows credits per way for the selected bet', async () => {
    render(<Paytable paytable={paytable} bets={BET_OPTIONS} initialBet={100} />);
    expect(screen.getByTestId('pay-red-dragon-3')).toHaveTextContent('4.8');
    expect(screen.getByTestId('pay-red-dragon-6')).toHaveTextContent('80');
    expect(screen.getByTestId('pay-circle-3')).toHaveTextContent('0.7');

    await userEvent.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByTestId('pay-red-dragon-3')).toHaveTextContent('0.48');
    expect(screen.getByTestId('pay-circle-3')).toHaveTextContent('0.07');
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('starts on the first bet when the current bet is not an option', () => {
    render(<Paytable paytable={paytable} bets={BET_OPTIONS} initialBet={33} />);
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('formats credits without trailing zeros', () => {
    expect(formatPay(0.07)).toBe('0.07');
    expect(formatPay(1.6)).toBe('1.6');
    expect(formatPay(12)).toBe('12');
    expect(formatPay(0.4699999)).toBe('0.47');
  });
});
