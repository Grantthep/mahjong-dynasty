import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DailyBars, niceMax } from './DailyBars';

const data = Array.from({ length: 14 }, (_, i) => ({
  label: `09-${String(i + 1).padStart(2, '0')}`,
  value: i === 6 ? 120 : i,
  description: `Day ${i + 1}: ${i === 6 ? 120 : i} spins`,
}));

describe('niceMax', () => {
  it('rounds up to a clean axis end', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(120)).toBe(200);
    expect(niceMax(450)).toBe(500);
    expect(niceMax(1000)).toBe(1000);
    expect(niceMax(1001)).toBe(2000);
  });
});

describe('DailyBars', () => {
  it('draws one column and one hover target per day, with a readable name', () => {
    render(<DailyBars data={data} ariaLabel="Spins per day" />);
    expect(screen.getByRole('img', { name: 'Spins per day' })).toBeInTheDocument();
    expect(document.querySelectorAll('path')).toHaveLength(13); // day 1 has value 0: no column
    expect(screen.getByLabelText('Day 7: 120 spins')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Day \d+:/)).toHaveLength(14);
  });

  it('labels only the highest value and puts it on a clean axis', () => {
    render(<DailyBars data={data} ariaLabel="Spins per day" />);
    expect(screen.getAllByText('120')).toHaveLength(1);
    expect(screen.getByText('200')).toBeInTheDocument(); // axis end
  });

  it('shows a tooltip on hover and on keyboard focus, and hides it again', async () => {
    render(<DailyBars data={data} ariaLabel="Spins per day" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await userEvent.hover(screen.getByLabelText('Day 7: 120 spins'));
    expect(screen.getByRole('status')).toHaveTextContent('Day 7: 120 spins');

    await userEvent.unhover(screen.getByLabelText('Day 7: 120 spins'));
    await userEvent.tab();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('copes with no activity at all', () => {
    const empty = data.map((d) => ({ ...d, value: 0 }));
    render(<DailyBars data={empty} ariaLabel="Spins per day" />);
    expect(document.querySelectorAll('path')).toHaveLength(0);
  });
});
