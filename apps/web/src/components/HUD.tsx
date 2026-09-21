import { useT } from '../i18n';
import { formatCredits } from '../utils/format';
import { BetButton, BetValue } from './BetControls';
import { AUTO_SPIN_OPTIONS } from '../store/gameStore';
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
  /** Auto spin is running. One button starts and stops it; omit the handler to hide it. */
  auto?: boolean;
  onAutoToggle?: () => void;
  /** Auto spins to play (`null` = until stopped) and how many are left in the current run. */
  autoLimit?: number | null;
  autoLeft?: number | null;
  onAutoLimitChange?: (limit: number | null) => void;
  /** Turbo plays every animation faster. */
  turbo?: boolean;
  onTurboChange?: (turbo: boolean) => void;
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
  auto = false,
  onAutoToggle,
  autoLimit = null,
  autoLeft = null,
  onAutoLimitChange,
  turbo = false,
  onTurboChange,
}: HUDProps) {
  const t = useT();
  const inFreeSpins = Boolean(freeSpins && freeSpins.remaining > 0);
  const cannotAfford = !inFreeSpins && balance < bet;
  const betLocked = spinning || inFreeSpins;
  const autoOn = auto;
  const showAuto = Boolean(onAutoToggle);

  return (
    <section className={styles.hud} aria-label={t('hud.controls')}>
      <div className={styles.stats}>
        <div className={styles.stat} role="group" aria-label={t('hud.balance')}>
          <span className={styles.label}>{t('hud.balance')}</span>
          <span className={styles.value} data-testid="balance-value">
            {formatCredits(balance)}
          </span>
        </div>
        <div
          className={`${styles.stat} ${win > 0 ? styles.winning : ''}`}
          role="group"
          aria-label={t('hud.win')}
        >
          <span className={styles.label}>{t('hud.win')}</span>
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
              aria-label={t('hud.autoCount')}
              value={autoLimit === null ? 'inf' : String(autoLimit)}
              onChange={(event) =>
                onAutoLimitChange(event.target.value === 'inf' ? null : Number(event.target.value))
              }
            >
              {AUTO_SPIN_OPTIONS.map((option) => (
                <option key={option ?? 'inf'} value={option === null ? 'inf' : String(option)}>
                  {option === null ? t('hud.untilStopped') : t('hud.autoSpins', { count: option })}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className={`${styles.autoButton} ${autoOn ? styles.autoActive : ''}`}
            aria-pressed={autoOn}
            disabled={!autoOn && cannotAfford}
            onClick={onAutoToggle}
          >
            {autoOn ? t('hud.stopAuto') : t('hud.autoSpin')}
          </button>
          {onTurboChange ? (
            <button
              type="button"
              className={`${styles.autoButton} ${turbo ? styles.autoActive : ''}`}
              aria-pressed={turbo}
              onClick={() => onTurboChange(!turbo)}
            >
              {t('hud.turbo')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={styles.notice} role="status" aria-live="polite">
        {autoOn ? (
          <span className={styles.freeBadge}>
            {t('hud.autoOn')}
            {autoLeft !== null ? <small> · {t('hud.left', { count: autoLeft })}</small> : null}
            {inFreeSpins && freeSpins ? (
              <small> · {t('hud.freeLeft', { count: freeSpins.remaining })}</small>
            ) : null}
          </span>
        ) : inFreeSpins && freeSpins ? (
          <span className={styles.freeBadge}>
            {t('hud.freeRemaining', { count: freeSpins.remaining })}
            <small> {t('hud.betLocked', { bet: formatCredits(bet) })}</small>
          </span>
        ) : cannotAfford ? (
          <span className={styles.warn}>{t('hud.cannotAfford')}</span>
        ) : (
          <span className={styles.demo}>{t('hud.demoOnly')}</span>
        )}
      </div>
    </section>
  );
}
