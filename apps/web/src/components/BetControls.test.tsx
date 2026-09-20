import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BET_OPTIONS } from '@mahjong/shared';
import { BetButton, BetValue } from './BetControls';

describe('bet controls', () => {
  it('shows the allowed bets 10, 20, 50, 100, 200', () => {
    expect(BET_OPTIONS).toEqual([10, 20, 50, 100, 200]);
  });

  it('steps up and down through the allowed bets', async () => {
    const onChange = vi.fn();
    render(
      <>
        <BetButton side="decrease" bet={50} bets={BET_OPTIONS} onChange={onChange} />
        <BetButton side="increase" bet={50} bets={BET_OPTIONS} onChange={onChange} />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Increase bet' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decrease bet' }));
    expect(onChange).toHaveBeenNthCalledWith(1, 100);
    expect(onChange).toHaveBeenNthCalledWith(2, 20);
  });

  it('cannot go below the minimum bet', () => {
    render(<BetButton side="decrease" bet={10} bets={BET_OPTIONS} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Decrease bet' })).toBeDisabled();
  });

  it('cannot go above the maximum bet', () => {
    render(<BetButton side="increase" bet={200} bets={BET_OPTIONS} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Increase bet' })).toBeDisabled();
  });

  it('can be disabled entirely', () => {
    render(<BetButton side="increase" bet={20} bets={BET_OPTIONS} disabled onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Increase bet' })).toBeDisabled();
  });

  it('formats the current bet', () => {
    render(<BetValue bet={100} />);
    expect(screen.getByTestId('bet-value')).toHaveTextContent('100');
  });
});
