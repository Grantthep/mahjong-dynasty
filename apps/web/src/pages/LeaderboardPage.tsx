import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LeaderboardPeriod } from '@mahjong/shared';
import { LoadingScreen } from '../components/StatusScreens';
import { useLeaderboard } from '../hooks/useGameData';
import { useT } from '../i18n';
import { PageLayout } from '../layouts/PageLayout';
import { formatCredits, formatDateTime } from '../utils/format';
import styles from './InfoPages.module.css';

const PERIODS: { id: LeaderboardPeriod; label: 'leaderboard.all' | 'leaderboard.day' }[] = [
  { id: 'all', label: 'leaderboard.all' },
  { id: 'day', label: 'leaderboard.day' },
];

export default function LeaderboardPage() {
  const t = useT();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const board = useLeaderboard(period);

  if (board.isPending && !board.data) return <LoadingScreen />;

  return (
    <PageLayout width="wide">
      <article className={styles.article}>
        <h1>{t('leaderboard.title')}</h1>
        <p className={styles.lead}>{t('leaderboard.lead')}</p>

        <div className={styles.tabs} role="group" aria-label={t('leaderboard.period')}>
          {PERIODS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.tab} ${period === option.id ? styles.tabActive : ''}`}
              aria-pressed={period === option.id}
              onClick={() => setPeriod(option.id)}
            >
              {t(option.label)}
            </button>
          ))}
        </div>

        {board.isError ? (
          <p className="alert" role="alert">
            {t('leaderboard.failed')}
          </p>
        ) : board.data && board.data.entries.length === 0 ? (
          <p className={styles.muted}>{t('leaderboard.empty')}</p>
        ) : board.data ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('leaderboard.rank')}</th>
                  <th scope="col">{t('leaderboard.player')}</th>
                  <th scope="col">{t('leaderboard.win')}</th>
                  <th scope="col">{t('leaderboard.bet')}</th>
                  <th scope="col">{t('leaderboard.multiple')}</th>
                  <th scope="col">{t('leaderboard.when')}</th>
                </tr>
              </thead>
              <tbody>
                {board.data.entries.map((entry) => (
                  <tr key={entry.rank} className={entry.isYou ? styles.you : undefined}>
                    <td>{entry.rank}</td>
                    <th scope="row">
                      {entry.username}
                      {entry.isYou ? (
                        <span className={styles.tag}>{t('leaderboard.you')}</span>
                      ) : null}
                      {entry.isFreeSpin ? (
                        <span className={styles.tag}>{t('leaderboard.free')}</span>
                      ) : null}
                    </th>
                    <td className={styles.win}>{formatCredits(entry.win)}</td>
                    <td>{entry.isFreeSpin ? '—' : formatCredits(entry.bet)}</td>
                    <td>×{entry.multiple}</td>
                    <td>{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <p className={styles.actions}>
          <Link to="/" className="btn primary">
            {t('common.backToGame')}
          </Link>
        </p>
        <p className={styles.muted}>{t('common.demoFooter')}</p>
      </article>
    </PageLayout>
  );
}
