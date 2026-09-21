import { formatCredits } from '../utils/format';
import { BetButton, BetValue } from './BetControls';
import { AUTO_SPIN_OPTIONS, type AutoMode } from '../store/gameStore';
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
  /** Auto spins to play (`null` = until stopped) and how many are left in the current run. */
  autoLimit?: number | null;
  autoLeft?: number | null;
  onAutoLimitChange?: (limit: number | null) => void;
  /** Turbo plays every animation faster; Skip fast-forwards the spin being shown. */
  turbo?: boolean;
  onTurboChange?: (turbo: boolean) => void;
  onSkip?: () => void;
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
  autoLimit = null,
  autoLeft = null,
  onAutoLimitChange,
  turbo = false,
  onTurboChange,
  onSkip,
}: HUDProps) {
  const inFreeSpins = Boolean(freeSpins && freeSpins.remaining > 0);
  const cannotAfford = !inFreeSpins && balance < bet;
  const betLocked = spinning || inFreeSpins;
  const autoOn = auto !== 'off';
  const paused = auto === 'paused';
  const showAuto = Boolean(onAutoStart && onAutoStop);
  const showSkip = Boolean(onSkip) && spinning;

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
          {!autoOn && onAutoLimitChange ? (
            <select
              className={styles.autoSelect}
              aria-label="Number of auto spins"
              value={autoLimit === null ? 'inf' : String(autoLimit)}
              onChange={(event) =>
                onAutoLimitChange(event.target.value === 'inf' ? null : Number(event.target.value))
              }
            >
              {AUTO_SPIN_OPTIONS.map((option) => (
                <option key={option ?? 'inf'} value={option === null ? 'inf' : String(option)}>
                  {option === null ? 'Until stopped' : `${option} spins`}
                </option>
              ))}
            </select>
          ) : null}
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
          {onTurboChange ? (
            <button
              type="button"
              className={`${styles.autoButton} ${turbo ? styles.autoActive : ''}`}
              aria-pressed={turbo}
              onClick={() => onTurboChange(!turbo)}
            >
              TURBO
            </button>
          ) : null}
          {showSkip ? (
            <button type="button" className={styles.autoButton} onClick={onSkip}>
              SKIP
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={styles.notice} role="status" aria-live="polite">
        {autoOn ? (
          <span className={styles.freeBadge}>
            {paused ? 'AUTO SPIN PAUSED' : 'AUTO SPIN ON'}
            {autoLeft !== null ? <small> · {autoLeft} left</small> : null}
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
