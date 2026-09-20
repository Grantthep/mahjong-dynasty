import { memo } from 'react';
import styles from './PalaceBackground.module.css';

export type PalaceMode = 'normal' | 'free';

const frac = (n: number) => n - Math.floor(n);

/** Deterministic pseudo-random particle layout (stable between renders, no Math.random). */
const PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  left: frac(Math.sin(i * 12.9898) * 43758.5453) * 100,
  size: 2 + frac(Math.sin(i * 78.233) * 12345.6789) * 3,
  delay: -frac(Math.sin(i * 39.346) * 9876.5432) * 22,
  duration: 16 + frac(Math.sin(i * 11.135) * 5432.1) * 16,
  drift: (frac(Math.sin(i * 5.7) * 999.1) - 0.5) * 80,
}));

interface Props {
  mode?: PalaceMode;
  /** Darkens the whole scene (Dragon Fortune / Free Spins intro). */
  dim?: boolean;
}

/**
 * The night palace. Both atmospheres are always mounted and cross-fade, so the Free Spins
 * transformation (brighter lanterns, gold light, dragon silhouette, gold particles) is smooth.
 */
function PalaceBackgroundBase({ mode = 'normal', dim = false }: Props) {
  const free = mode === 'free';
  return (
    <div className={styles.root} data-mode={mode} aria-hidden="true">
      <img
        className={styles.layer}
        src="/assets/backgrounds/palace-normal.svg"
        alt=""
        draggable={false}
      />
      <img
        className={`${styles.layer} ${styles.freeLayer} ${free ? styles.visible : ''}`}
        src="/assets/backgrounds/palace-free.svg"
        alt=""
        draggable={false}
      />
      <div className={`${styles.particles} ${free ? styles.gold : ''}`}>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ['--drift' as string]: `${p.drift}px`,
            }}
          />
        ))}
      </div>
      <div className={`${styles.lanternPulse} ${free ? styles.visible : ''}`} />
      <div className={`${styles.dim} ${dim ? styles.dimOn : ''}`} />
    </div>
  );
}

export const PalaceBackground = memo(PalaceBackgroundBase);
