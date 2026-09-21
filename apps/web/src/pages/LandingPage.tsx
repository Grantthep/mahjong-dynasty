import { Link } from 'react-router-dom';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { Logo } from '../components/Logo';
import { PalaceBackground } from '../components/PalaceBackground';
import { useLogout, useMe } from '../hooks/useAuth';
import { useT, type TranslationKey } from '../i18n';
import styles from './LandingPage.module.css';

const FEATURES: { title: TranslationKey; image: string }[] = [
  { title: 'landing.feature.cascade', image: '/assets/symbols/red-dragon.svg' },
  { title: 'landing.feature.dragon', image: '/assets/ui/dragon-icon.svg' },
  { title: 'landing.feature.wilds', image: '/assets/symbols/wild-dragon.svg' },
  { title: 'landing.feature.free', image: '/assets/symbols/lotus-scatter.svg' },
];

export default function LandingPage() {
  const t = useT();
  const me = useMe();
  const logout = useLogout();

  return (
    <div className={styles.page}>
      <PalaceBackground />

      <header className={styles.top}>
        <span className="demo-badge">{t('common.demoMode')}</span>
        <nav aria-label="Account">
          <LanguageSwitch />
          <Link to="/about">{t('common.about')}</Link>
          {me.data ? (
            <>
              <Link to="/profile">{me.data.username}</Link>
              <button type="button" className={styles.linkButton} onClick={() => logout.mutate()}>
                {t('common.logOut')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login">{t('common.logIn')}</Link>
              <Link to="/register">{t('common.register')}</Link>
            </>
          )}
        </nav>
      </header>

      <main className={styles.hero}>
        <Logo size="lg" as="h1" />
        <p className={styles.tagline}>{t('landing.tagline')}</p>
        <Link to="/game" className={`btn primary ${styles.cta}`}>
          {t('landing.enter')}
        </Link>

        <ul className={styles.features}>
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <img src={feature.image} alt="" width={44} height={48} draggable={false} />
              <span>{t(feature.title)}</span>
            </li>
          ))}
        </ul>
      </main>

      <footer className={styles.footer}>{t('landing.footer')}</footer>
    </div>
  );
}
