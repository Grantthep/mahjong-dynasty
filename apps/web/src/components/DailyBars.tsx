import { useState } from 'react';
import styles from './DailyBars.module.css';

export interface DailyBarsDatum {
  /** Short x-axis label, e.g. "09-21". */
  label: string;
  value: number;
  /** Text read out by the tooltip and by screen readers. */
  description: string;
}

interface Props {
  data: readonly DailyBarsDatum[];
  /** Accessible name of the chart (the visible title sits above it). */
  ariaLabel: string;
}

const W = 640;
const H = 230;
const PAD = { top: 22, right: 12, bottom: 30, left: 46 };
const MAX_BAR = 24;
const RADIUS = 4;

/** Round a maximum up to a clean axis end (1, 2, 5 x 10^n). */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((multiple) => multiple * power >= value) ?? 10;
  return step * power;
}

/** A column with a rounded top and a square baseline. */
function columnPath(x: number, y: number, width: number, height: number): string {
  if (height <= 0) return '';
  const r = Math.min(RADIUS, height, width / 2);
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${y + height}`,
    'Z',
  ].join(' ');
}

/**
 * One-series column chart drawn in plain SVG (no chart library). One hue, thin columns, hairline
 * grid, one value label (the maximum), and a tooltip on hover or keyboard focus. The exact
 * figures are always available in the table shown next to it.
 */
export function DailyBars({ data, ariaLabel }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = data.length > 0 ? plotW / data.length : plotW;
  const barW = Math.min(MAX_BAR, slot - 6);
  const yOf = (value: number) => PAD.top + plotH - (value / max) * plotH;
  const ticks = [0, max / 2, max];
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const hover = active === null ? null : data[active];

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        className={styles.svg}
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              className={tick === 0 ? styles.axis : styles.grid}
            />
            <text x={PAD.left - 8} y={yOf(tick) + 4} textAnchor="end" className={styles.tick}>
              {tick.toLocaleString('en-US')}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const height = (d.value / max) * plotH;
          const x = cx - barW / 2;
          return (
            <g key={d.label}>
              {/* Wide invisible target: much easier to hit than a thin column. */}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                className={styles.hit}
                tabIndex={0}
                aria-label={d.description}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
              {d.value > 0 ? (
                <path
                  d={columnPath(x, yOf(d.value), barW, height)}
                  className={`${styles.bar} ${active === i ? styles.barActive : ''}`}
                />
              ) : null}
              {i % 2 === (data.length - 1) % 2 ? (
                <text x={cx} y={H - 10} textAnchor="middle" className={styles.tick}>
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {data[peak] && data[peak].value > 0 ? (
          <text
            x={PAD.left + slot * peak + slot / 2}
            y={yOf(data[peak].value) - 6}
            textAnchor="middle"
            className={styles.peak}
          >
            {data[peak].value.toLocaleString('en-US')}
          </text>
        ) : null}
      </svg>

      {hover && active !== null ? (
        <div
          className={styles.tooltip}
          role="status"
          style={{
            left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%`,
          }}
        >
          {hover.description}
        </div>
      ) : null}
    </div>
  );
}
