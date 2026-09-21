import { BET_OPTIONS, REGULAR_SYMBOLS, SYMBOL_META, type PublicGameConfig } from '@mahjong/shared';
import { useState } from 'react';
import { useT } from '../i18n';
import styles from './Paytable.module.css';

const REEL_COUNTS = [3, 4, 5, 6] as const;

/** Credits with up to two decimals and no trailing zeros (e.g. 0.07, 1.6, 12). */
export const formatPay = (value: number): string => Number(value.toFixed(2)).toString();

interface Props {
  paytable: PublicGameConfig['paytable'];
  bets?: readonly number[];
  /** Bet the table starts on (the player's current bet). */
  initialBet?: number;
}

/**
 * Credits paid PER WAY for each symbol and reel count, at the bet the player picks.
 * Only display maths: the server decides every real payout.
 */
export function Paytable({ paytable, bets = BET_OPTIONS, initialBet }: Props) {
  const t = useT();
  const [bet, setBet] = useState(
    initialBet !== undefined && bets.includes(initialBet) ? initialBet : (bets[0] ?? 10),
  );

  return (
    <div className={styles.wrap}>
      <p className={styles.lead}>{t('paytable.lead')}</p>

      <div className={styles.bets} role="group" aria-label={t('paytable.bet')}>
        <span className={styles.betLabel}>{t('paytable.bet')}</span>
        {bets.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.betButton} ${option === bet ? styles.active : ''}`}
            aria-pressed={option === bet}
            onClick={() => setBet(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t('paytable.symbol')}</th>
              {REEL_COUNTS.map((reels) => (
                <th key={reels} scope="col">
                  {t('paytable.reels', { count: reels })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...REGULAR_SYMBOLS].reverse().map((symbol) => (
              <tr key={symbol}>
                <th scope="row" className={styles.symbolCell}>
                  <img src={SYMBOL_META[symbol].asset} alt="" width={30} height={33} />
                  {t(`symbol.${symbol}`)}
                </th>
                {REEL_COUNTS.map((reels) => (
                  <td key={reels} data-testid={`pay-${symbol}-${reels}`}>
                    {formatPay((paytable[symbol]?.[reels] ?? 0) * bet)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{t('paytable.rounding')}</p>
    </div>
  );
}
