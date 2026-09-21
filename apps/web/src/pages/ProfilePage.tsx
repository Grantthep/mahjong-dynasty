import { Link } from 'react-router-dom';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';
import { useProfile } from '../hooks/useGameData';
import { useT } from '../i18n';
import { PageLayout } from '../layouts/PageLayout';
import { formatCredits, formatDateTime } from '../utils/format';
import styles from './InfoPages.module.css';

export default function ProfilePage() {
  const t = useT();
  const profile = useProfile();

  if (profile.isPending) return <LoadingScreen label={t('status.loadProfile')} />;
  if (profile.isError) {
    return <ErrorScreen message={profile.error.message} onRetry={() => void profile.refetch()} />;
  }

  const { user, stats, recentSpins } = profile.data;
  const cards: [string, string][] = [
    [t('profile.balance'), formatCredits(user.demoBalance)],
    [t('profile.totalSpins'), formatCredits(stats.totalSpins)],
    [t('profile.totalBet'), formatCredits(stats.totalBet)],
    [t('profile.totalWon'), formatCredits(stats.totalWon)],
    [t('profile.largest'), formatCredits(stats.largestWin)],
    [t('profile.freeTriggered'), formatCredits(stats.freeSpinsTriggered)],
    [t('profile.dragonTriggers'), formatCredits(stats.dragonFortuneTriggers)],
  ];

  return (
    <PageLayout width="wide">
      <article className={styles.article}>
        <h1>{user.username}</h1>
        <p className={styles.muted}>
          {t('profile.member', { date: new Date(user.createdAt).toLocaleDateString() })} ·{' '}
          {t('common.demoMode')}
        </p>

        <div className={styles.statsGrid}>
          {cards.map(([label, value]) => (
            <div key={label} className={styles.statCard}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <h2>{t('profile.recent')}</h2>
        {recentSpins.length === 0 ? (
          <p className={styles.muted}>{t('profile.none')}</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('profile.time')}</th>
                  <th scope="col">{t('profile.colBet')}</th>
                  <th scope="col">{t('profile.colWin')}</th>
                  <th scope="col">{t('profile.cascades')}</th>
                  <th scope="col">{t('profile.colBalance')}</th>
                  <th scope="col">{t('profile.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {recentSpins.map((spin) => (
                  <tr key={spin.id}>
                    <th scope="row">{formatDateTime(spin.createdAt)}</th>
                    <td>{spin.isFreeSpin ? '—' : formatCredits(spin.bet)}</td>
                    <td className={spin.totalWin > 0 ? styles.win : undefined}>
                      {formatCredits(spin.totalWin)}
                    </td>
                    <td>{spin.cascadeCount}</td>
                    <td>{formatCredits(spin.balanceAfter)}</td>
                    <td>
                      {spin.isFreeSpin ? (
                        <span className={styles.tag}>{t('profile.tagFree')}</span>
                      ) : null}{' '}
                      {spin.freeSpinsAwarded > 0 ? (
                        <span className={styles.tag}>
                          {t('profile.tagAwarded', { count: spin.freeSpinsAwarded })}
                        </span>
                      ) : null}{' '}
                      {spin.dragonFortuneTriggers > 0 ? (
                        <span className={styles.tag}>{t('profile.tagDragon')}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className={styles.actions}>
          <Link to="/" className="btn primary">
            {t('common.backToGame')}
          </Link>
        </p>
      </article>
    </PageLayout>
  );
}
