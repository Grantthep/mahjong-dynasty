import { Link } from 'react-router-dom';
import { Paytable } from '../components/Paytable';
import { useGameConfig } from '../hooks/useGameData';
import { useT } from '../i18n';
import { PageLayout } from '../layouts/PageLayout';
import styles from './InfoPages.module.css';

const ladder = (multipliers: readonly number[]) => multipliers.map((m) => `×${m}`).join(' → ');

/** "Title|rest of the sentence": the part before the bar is shown in bold. */
function Rule({ text }: { text: string }) {
  const [title, ...rest] = text.split('|');
  if (rest.length === 0) return <li>{text}</li>;
  return (
    <li>
      <strong>{title}</strong>
      {rest.join('|')}
    </li>
  );
}

export default function AboutPage() {
  const t = useT();
  const config = useGameConfig();
  const data = config.data;

  const awards = data
    ? data.freeSpinAwards
        .map((award) =>
          t('about.lotus', {
            min: award.min,
            plus: award.min === 5 ? '+' : '',
            spins: award.spins,
          }),
        )
        .join(', ')
    : '';

  return (
    <PageLayout width="wide">
      <article className={styles.article}>
        <h1>{t('about.title')}</h1>
        <p className={styles.lead}>{t('about.lead')}</p>

        <section className={styles.notice}>{t('common.demoDisclaimer')}</section>

        <section>
          <h2>{t('about.howTo')}</h2>
          <ul className={styles.list}>
            <Rule text={t('about.ways')} />
            <Rule
              text={t('about.cascades', { ladder: data ? ladder(data.multipliers.base) : '' })}
            />
            <Rule text={t('about.dragon')} />
            <Rule text={t('about.wilds')} />
            <Rule text={t('about.wildReel')} />
            <Rule
              text={t('about.free', {
                awards,
                ladder: data ? ladder(data.multipliers.freeSpins) : '',
              })}
            />
          </ul>
        </section>

        <section>
          <h2>{t('paytable.title')}</h2>
          {config.isPending ? (
            <p className={styles.muted}>{t('common.loading')}</p>
          ) : config.isError ? (
            <p className="alert">{t('paytable.failed')}</p>
          ) : (
            <Paytable paytable={config.data.paytable} bets={config.data.bets} />
          )}
        </section>

        <p className={styles.actions}>
          <Link to="/game" className="btn primary">
            {t('common.enterGame')}
          </Link>
          <Link to="/" className="btn ghost">
            {t('common.home')}
          </Link>
        </p>
        <p className={styles.muted}>{t('common.notCertified')}</p>
      </article>
    </PageLayout>
  );
}
