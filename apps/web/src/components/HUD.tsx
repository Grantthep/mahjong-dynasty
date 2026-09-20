import { formatCredits } from '../utils/format';
import { BetButton, BetValue } from './BetControls';
import { SpinButton } from './SpinButton';
import styles from './HUD.module.css';

export interface HUDProps {
  balance: number;
  win: number;
  bet: number;
  bets: readonly number[];
  spinning: boolean;
  /** Present while a Free Spin round is active: the bet is locked and spins are free. */
  freeSpins?: { remaining: number; total: number } | null;
  onBetChange: (bet: number) => void;
  onSpin: () => void;
}

/** Balance / Win / Bet read-outs, bet controls and the SPIN button. All values come from the server. */
export function HUD({
  balance,
  win,
  bet,
  bets,
  spinning,
  freeSpins,
  onBetChange,
  onSpin,
}: HUDProps) {
  const inFreeSpins = Boolean(freeSpins && freeSpins.remaining > 0);
  const cannotAfford = !inFreeSpins && balance < bet;
  const betLocked = spinning || inFreeSpins;

  return (
    <section className={styles.hud} aria-label="Game controls">
      <div className={styles.stats}>
        <div className={styles.stat} role="group" aria-label="Demo balance">
          <span className={styles.label}>DEMO BALANCE</span>
          <span className={styles.value} data-testid="balance-value">
            {formatCredits(balance)}
          </span>
        </div>
        <div
          className={`${styles.stat} ${win > 0 ? styles.winning : ''}`}
          role="group"
          aria-label="Win"
        >
          <span className={styles.label}>WIN</span>
          <span className={styles.value} data-testid="win-value">
            {formatCredits(win)}
          </span>
        </div>
        <BetValue bet={bet} />
      </div>

      <div className={styles.controls}>
        <BetButton
          side="decrease"
          bet={bet}
          bets={bets}
          disabled={betLocked}
          onChange={onBetChange}
        />
        <SpinButton
          spinning={spinning}
          freeSpin={inFreeSpins}
          disabled={cannotAfford}
          onClick={onSpin}
        />
        <BetButton
          side="increase"
          bet={bet}
          bets={bets}
          disabled={betLocked}
          onChange={onBetChange}
        />
      </div>

      <div className={styles.notice} role="status" aria-live="polite">
        {inFreeSpins && freeSpins ? (
          <span className={styles.freeBadge}>
            FREE SPINS · {freeSpins.remaining} REMAINING
            <small> (bet locked at {formatCredits(bet)})</small>
          </span>
        ) : cannotAfford ? (
          <span className={styles.warn}>Not enough DEMO CREDITS for this bet. Lower your bet.</span>
        ) : (
          <span className={styles.demo}>DEMO MODE · DEMO CREDITS ONLY</span>
        )}
      </div>
    </section>
  );
}
