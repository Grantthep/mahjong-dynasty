import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { formatCredits } from '../utils/format';
import styles from './WinOverlay.module.css';

interface Props {
  title: string;
  subtitle?: string;
  amount: number;
  /** Extra styling for the tier (big / mega / epic / free). */
  tone?: 'big' | 'mega' | 'epic' | 'free';
  /** Turbo / skipped spins: count up and hold for a much shorter time. */
  fast?: boolean;
  onDone: () => void;
}

const COUNT_MS = 2200;
const HOLD_MS = 1400;
const FAST_COUNT_MS = 600;
const FAST_HOLD_MS = 500;

/**
 * BIG WIN / FREE SPINS COMPLETE presentation: dims the game, shows the title and counts the
 * demo credits up. Click to skip the count, click again to continue.
 */
export function WinOverlay({ title, subtitle, amount, tone = 'big', fast = false, onDone }: Props) {
  const t = useT();
  const [shown, setShown] = useState(0);
  const finished = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduce ? 1 : fast ? FAST_COUNT_MS : COUNT_MS;
    const hold = fast ? FAST_HOLD_MS : HOLD_MS;
    const start = performance.now();
    let frame = 0;
    let holdTimer = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(amount * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        finished.current = true;
        holdTimer = window.setTimeout(() => doneRef.current(), hold);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(holdTimer);
    };
  }, [amount, fast]);

  const handleClick = () => {
    if (finished.current) doneRef.current();
    else {
      finished.current = true;
      setShown(amount);
    }
  };

  return (
    <div
      className={`${styles.overlay} ${styles[tone]}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleClick}
    >
      <div className={styles.sparks} aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.35}s` }}
          />
        ))}
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.amount} aria-live="polite">
          {formatCredits(shown)}
        </div>
        <div className={styles.unit}>{t('common.demoCredits')}</div>
        {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        <div className={styles.hint}>{t('win.continue')}</div>
      </div>
    </div>
  );
}
