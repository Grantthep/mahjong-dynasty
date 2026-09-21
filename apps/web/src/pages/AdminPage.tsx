import { Link } from 'react-router-dom';
import { DailyBars } from '../components/DailyBars';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';
import { useMe } from '../hooks/useAuth';
import { useAdminAnalytics } from '../hooks/useGameData';
import { useT, type TranslationKey } from '../i18n';
import { PageLayout } from '../layouts/PageLayout';
import { formatCredits, formatDateTime } from '../utils/format';
import styles from './AdminPage.module.css';
import info from './InfoPages.module.css';

const percent = (ratio: number) => `${(ratio * 100).toFixed(2)}%`;
const ratioOrDash = (won: number, bet: number) => (bet > 0 ? percent(won / bet) : '—');

export default function AdminPage() {
  const t = useT();
  const me = useMe();
  const isAdmin = me.data?.role === 'ADMIN';
  const analytics = useAdminAnalytics(isAdmin);

  if (me.isPending) return <LoadingScreen />;
  if (!isAdmin) {
    return (
      <PageLayout>
        <div className={info.article} role="alert">
          <h1>{t('admin.title')}</h1>
          <p>{t('admin.denied')}</p>
          <p className={info.actions}>
            <Link to="/" className="btn ghost">
              {t('common.home')}
            </Link>
          </p>
        </div>
      </PageLayout>
    );
  }
  if (analytics.isPending) return <LoadingScreen />;
  if (analytics.isError) {
    return (
      <ErrorScreen message={analytics.error.message} onRetry={() => void analytics.refetch()} />
    );
  }

  const { totals, daily, topPlayers, generatedAt } = analytics.data;
  const tiles: [TranslationKey, string][] = [
    ['admin.players', formatCredits(totals.players)],
    ['admin.newPlayers', formatCredits(totals.newPlayersLast7Days)],
    ['admin.spins', formatCredits(totals.totalSpins)],
    ['admin.freeSpins', formatCredits(totals.freeSpins)],
    ['admin.bet', formatCredits(totals.totalBet)],
    ['admin.won', formatCredits(totals.totalWon)],
    ['admin.largest', formatCredits(totals.largestWin)],
    ['admin.freeTriggers', formatCredits(totals.freeSpinTriggers)],
    ['admin.dragon', formatCredits(totals.dragonFortuneTriggers)],
    ['admin.respins', formatCredits(totals.wildReelRespins)],
  ];

  return (
    <PageLayout width="wide">
      <article className={info.article}>
        <h1>{t('admin.title')}</h1>
        <p className={info.lead}>{t('admin.lead')}</p>

        <section className={styles.hero} aria-label={t('admin.return')}>
          <span className={styles.heroLabel}>{t('admin.return')}</span>
          <span className={styles.heroValue} data-testid="observed-return">
            {totals.totalBet > 0 ? percent(totals.observedReturn) : '—'}
          </span>
          <span className={info.muted}>{t('admin.returnNote')}</span>
        </section>

        <div className={styles.tiles}>
          {tiles.map(([label, value]) => (
            <div key={label} className={styles.tile}>
              <span>{t(label)}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <h2>{t('admin.chartTitle')}</h2>
        <p className={info.muted}>{t('admin.chartNote')}</p>
        <DailyBars
          ariaLabel={t('admin.chartTitle')}
          data={daily.map((day) => ({
            label: day.date.slice(5),
            value: day.spins,
            description: t('admin.chartTip', { date: day.date, count: formatCredits(day.spins) }),
          }))}
        />

        <h2>{t('admin.tableView')}</h2>
        <div className={info.tableWrap}>
          <table className={info.table}>
            <thead>
              <tr>
                <th scope="col">{t('admin.day')}</th>
                <th scope="col">{t('admin.colSpins')}</th>
                <th scope="col">{t('admin.colBet')}</th>
                <th scope="col">{t('admin.colWon')}</th>
                <th scope="col">{t('admin.colReturn')}</th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((day) => (
                <tr key={day.date}>
                  <th scope="row">{day.date}</th>
                  <td>{formatCredits(day.spins)}</td>
                  <td>{formatCredits(day.bet)}</td>
                  <td>{formatCredits(day.won)}</td>
                  <td>{ratioOrDash(day.won, day.bet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>{t('admin.top')}</h2>
        {topPlayers.length === 0 ? (
          <p className={info.muted}>{t('leaderboard.empty')}</p>
        ) : (
          <div className={info.tableWrap}>
            <table className={info.table}>
              <thead>
                <tr>
                  <th scope="col">{t('leaderboard.player')}</th>
                  <th scope="col">{t('admin.colSpins')}</th>
                  <th scope="col">{t('admin.colBet')}</th>
                  <th scope="col">{t('admin.colWon')}</th>
                  <th scope="col">{t('admin.colReturn')}</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((player) => (
                  <tr key={player.username}>
                    <th scope="row">{player.username}</th>
                    <td>{formatCredits(player.spins)}</td>
                    <td>{formatCredits(player.totalBet)}</td>
                    <td>{formatCredits(player.totalWon)}</td>
                    <td>{ratioOrDash(player.totalWon, player.totalBet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className={info.muted}>
          {t('admin.generated', { time: formatDateTime(generatedAt) })} · {t('common.notCertified')}
        </p>
        <p className={info.actions}>
          <Link to="/game" className="btn primary">
            {t('common.backToGame')}
          </Link>
          <Link to="/leaderboard" className="btn ghost">
            {t('nav.leaderboard')}
          </Link>
        </p>
      </article>
    </PageLayout>
  );
}
