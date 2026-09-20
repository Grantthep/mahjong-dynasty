import { formatCredits } from '../utils/format';
import styles from './HUD.module.css';

interface Props {
  bet: number;
  bets: readonly number[];
  disabled?: boolean;
  onChange: (bet: number) => void;
  /** Which side of the SPIN button this half renders. */
  side: 'decrease' | 'increase';
}

/** One half of the bet selector; a "−" on the left of SPIN and a "+" on the right. */
export function BetButton({ bet, bets, disabled = false, onChange, side }: Props) {
  const index = bets.indexOf(bet);
  const step = side === 'decrease' ? -1 : 1;
  const target = bets[index + step];
  const atLimit = target === undefined;

  return (
    <button
      type="button"
      className={styles.round}
      aria-label={side === 'decrease' ? 'Decrease bet' : 'Increase bet'}
      disabled={disabled || atLimit}
      onClick={() => {
        if (target !== undefined) onChange(target);
      }}
    >
      {side === 'decrease' ? '−' : '+'}
    </button>
  );
}

export function BetValue({ bet }: { bet: number }) {
  return (
    <div className={styles.stat} role="group" aria-label="Bet">
      <span className={styles.label}>BET</span>
      <span className={styles.value} data-testid="bet-value">
        {formatCredits(bet)}
      </span>
    </div>
  );
}
