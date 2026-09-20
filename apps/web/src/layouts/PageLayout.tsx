import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PalaceBackground } from '../components/PalaceBackground';
import { Logo } from '../components/Logo';
import styles from './PageLayout.module.css';

interface Props {
  children: ReactNode;
  /** "narrow" for forms, "wide" for profile / about. */
  width?: 'narrow' | 'wide';
}

/** Shared frame for the non-game pages: palace background, small logo, DEMO MODE badge. */
export function PageLayout({ children, width = 'narrow' }: Props) {
  return (
    <div className={styles.page}>
      <PalaceBackground />
      <header className={styles.header}>
        <Link to="/" aria-label="Mahjong Dynasty home">
          <Logo size="sm" />
        </Link>
        <span className="demo-badge">DEMO MODE</span>
      </header>
      <main className={`${styles.main} ${width === 'wide' ? styles.wide : styles.narrow}`}>
        {children}
      </main>
      <footer className={styles.footer}>
        Virtual DEMO CREDITS only · no deposits, withdrawals, payments or real-money wagering
      </footer>
    </div>
  );
}
