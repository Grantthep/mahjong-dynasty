import { Link } from 'react-router-dom';
import { REGULAR_SYMBOLS, SYMBOL_META, DEMO_DISCLAIMER } from '@mahjong/shared';
import { useGameConfig } from '../hooks/useGameData';
import { PageLayout } from '../layouts/PageLayout';
import styles from './InfoPages.module.css';

const trim = (value: number) => Number(value.toFixed(3)).toString();

export default function AboutPage() {
  const config = useGameConfig();

  return (
    <PageLayout width="wide">
      <article className={styles.article}>
        <h1>About Mahjong Dynasty</h1>
        <p className={styles.lead}>
          A mystical, ancient Chinese-inspired Mahjong palace where a Golden Dragon controls
          fortune. This is a full-stack browser demo: the server decides every result, the browser
          only animates it.
        </p>

        <section className={styles.notice}>{DEMO_DISCLAIMER}</section>

        <section>
          <h2>How it plays</h2>
          <ul className={styles.list}>
            <li>
              <strong>Ways to win.</strong> Match a symbol on 3 or more adjacent reels starting from
              the leftmost reel. Every matching tile on a reel multiplies your ways.
            </li>
            <li>
              <strong>Cascading wins.</strong> Winning tiles vanish, the rest fall and new tiles
              drop in. Each consecutive cascade raises the multiplier
              {config.data
                ? ` (${config.data.multipliers.base.map((m) => `×${m}`).join(' → ')})`
                : ''}
              .
            </li>
            <li>
              <strong>Dragon Fortune.</strong> Every winning cascade fills the meter. At 100% the
              Golden Dragon sweeps the board and turns 3–6 tiles into Wilds.
            </li>
            <li>
              <strong>Golden Wilds</strong> substitute for every regular symbol (not for the Lotus).
            </li>
            <li>
              <strong>Free Spins.</strong> Land 3 or more Lotus Scatters anywhere.
              {config.data
                ? ` ${config.data.freeSpinAwards.map((a) => `${a.min}${a.min === 5 ? '+' : ''} Lotus = ${a.spins} spins`).join(', ')}. `
                : ' '}
              Free Spins use bigger multipliers
              {config.data
                ? ` (${config.data.multipliers.freeSpins.map((m) => `×${m}`).join(' → ')})`
                : ''}
              , and your progress is saved even if you refresh.
            </li>
          </ul>
        </section>

        <section>
          <h2>Paytable</h2>
          <p className={styles.muted}>
            Credits paid <em>per way</em> as a multiple of your bet, by number of reels matched.
          </p>
          {config.isPending ? (
            <p className={styles.muted}>Loading…</p>
          ) : config.isError ? (
            <p className="alert">Could not load the paytable. Is the API running?</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Symbol</th>
                    {[3, 4, 5, 6].map((reels) => (
                      <th key={reels} scope="col">
                        {reels} reels
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...REGULAR_SYMBOLS].reverse().map((symbol) => (
                    <tr key={symbol}>
                      <th scope="row" className={styles.symbolCell}>
                        <img src={SYMBOL_META[symbol].asset} alt="" width={30} height={33} />
                        {SYMBOL_META[symbol].name}
                      </th>
                      {[3, 4, 5, 6].map((reels) => (
                        <td key={reels}>×{trim(config.data.paytable[symbol]?.[reels] ?? 0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className={styles.actions}>
          <Link to="/game" className="btn primary">
            Enter game
          </Link>
          <Link to="/" className="btn ghost">
            Home
          </Link>
        </p>
        <p className={styles.muted}>
          FOR DEVELOPMENT / DEMONSTRATION ONLY. NOT CERTIFIED GAME MATH.
        </p>
      </article>
    </PageLayout>
  );
}
