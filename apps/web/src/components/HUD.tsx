import { formatCredits } from '../utils/format';
import { BetButton, BetValue } from './BetControls';
import type { AutoMode } from '../store/gameStore';
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
  /** Auto spin state; omit the handlers to hide the auto controls. */
  auto?: AutoMode;
  onAutoStart?: () => void;
  onAutoStop?: () => void;
  onAutoPause?: () => void;
  onAutoResume?: () => void;
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
  auto = 'off',
  onAutoStart,
  onAutoStop,
  onAutoPause,
  onAutoResume,
}: HUDProps) {
  const inFreeSpins = Boolean(freeSpins && freeSpins.remaining > 0);
  const cannotAfford = !inFreeSpins && balance < bet;
  const betLocked = spinning || inFreeSpins;
  const autoOn = auto !== 'off';
  const paused = auto === 'paused';
  const showAuto = Boolean(onAutoStart && onAutoStop);

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

      {showAuto ? (
        <div className={styles.autoRow}>
          <button
            type="button"
            className={`${styles.autoButton} ${autoOn ? styles.autoActive : ''}`}
            aria-pressed={autoOn}
            disabled={!autoOn && cannotAfford}
            onClick={autoOn ? onAutoStop : onAutoStart}
          >
            {autoOn ? 'STOP AUTO' : 'AUTO SPIN'}
          </button>
          {autoOn ? (
            <button
              type="button"
              className={`${styles.autoButton} ${paused ? styles.autoPaused : ''}`}
              onClick={paused ? onAutoResume : onAutoPause}
            >
              {paused ? 'RESUME' : 'PAUSE'}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={styles.notice} role="status" aria-live="polite">
        {autoOn ? (
          <span className={styles.freeBadge}>
            {paused ? 'AUTO SPIN PAUSED' : 'AUTO SPIN ON'}
            {inFreeSpins && freeSpins ? (
              <small> · {freeSpins.remaining} free spins left</small>
            ) : null}
          </span>
        ) : inFreeSpins && freeSpins ? (
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
