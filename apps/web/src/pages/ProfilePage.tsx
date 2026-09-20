import { Link, useNavigate } from 'react-router-dom';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';
import { useLogout } from '../hooks/useAuth';
import { useProfile } from '../hooks/useGameData';
import { PageLayout } from '../layouts/PageLayout';
import { formatCredits, formatDateTime } from '../utils/format';
import styles from './InfoPages.module.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const logout = useLogout();

  if (profile.isPending) return <LoadingScreen label="Loading your profile…" />;
  if (profile.isError) {
    return <ErrorScreen message={profile.error.message} onRetry={() => void profile.refetch()} />;
  }

  const { user, stats, recentSpins } = profile.data;
  const cards: [string, string][] = [
    ['Demo Balance', formatCredits(user.demoBalance)],
    ['Total Spins', formatCredits(stats.totalSpins)],
    ['Total Demo Credits Bet', formatCredits(stats.totalBet)],
    ['Total Demo Credits Won', formatCredits(stats.totalWon)],
    ['Largest Demo Win', formatCredits(stats.largestWin)],
    ['Free Spins Triggered', formatCredits(stats.freeSpinsTriggered)],
    ['Dragon Fortune Triggers', formatCredits(stats.dragonFortuneTriggers)],
  ];

  return (
    <PageLayout width="wide">
      <article className={styles.article}>
        <h1>{user.username}</h1>
        <p className={styles.muted}>
          {user.email} · member since {new Date(user.createdAt).toLocaleDateString()} · DEMO MODE
        </p>

        <div className={styles.statsGrid}>
          {cards.map(([label, value]) => (
            <div key={label} className={styles.statCard}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <h2>Recent Spins</h2>
        {recentSpins.length === 0 ? (
          <p className={styles.muted}>No spins yet. Head to the game and press SPIN.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Bet</th>
                  <th scope="col">Win</th>
                  <th scope="col">Cascades</th>
                  <th scope="col">Balance</th>
                  <th scope="col">Notes</th>
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
                      {spin.isFreeSpin ? <span className={styles.tag}>FREE SPIN</span> : null}{' '}
                      {spin.freeSpinsAwarded > 0 ? (
                        <span className={styles.tag}>+{spin.freeSpinsAwarded} FREE SPINS</span>
                      ) : null}{' '}
                      {spin.dragonFortuneTriggers > 0 ? (
                        <span className={styles.tag}>DRAGON</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className={styles.actions}>
          <Link to="/game" className="btn primary">
            Back to game
          </Link>
          <button
            type="button"
            className="btn ghost"
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}
          >
            Log out
          </button>
        </p>
      </article>
    </PageLayout>
  );
}
