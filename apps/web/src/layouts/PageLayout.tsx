import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { PalaceBackground } from '../components/PalaceBackground';
import { Logo } from '../components/Logo';
import { useT } from '../i18n';
import styles from './PageLayout.module.css';

interface Props {
  children: ReactNode;
  /** "narrow" for forms, "wide" for profile / about. */
  width?: 'narrow' | 'wide';
}

/** Shared frame for the non-game pages: palace background, small logo, DEMO MODE badge. */
export function PageLayout({ children, width = 'narrow' }: Props) {
  const t = useT();
  return (
    <div className={styles.page}>
      <PalaceBackground />
      <header className={styles.header}>
        <Link to="/" aria-label={t('common.homeLink')}>
          <Logo size="sm" />
        </Link>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LanguageSwitch />
          <span className="demo-badge">{t('common.demoMode')}</span>
        </span>
      </header>
      <main className={`${styles.main} ${width === 'wide' ? styles.wide : styles.narrow}`}>
        {children}
      </main>
      <footer className={styles.footer}>{t('common.demoFooter')}</footer>
    </div>
  );
}
