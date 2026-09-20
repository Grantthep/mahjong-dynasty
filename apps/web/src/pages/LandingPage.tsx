import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { PalaceBackground } from '../components/PalaceBackground';
import { useLogout, useMe } from '../hooks/useAuth';
import styles from './LandingPage.module.css';

const FEATURES = [
  { title: 'CASCADING WINS', image: '/assets/symbols/red-dragon.svg' },
  { title: 'DRAGON FORTUNE', image: '/assets/ui/dragon-icon.svg' },
  { title: 'GOLDEN WILDS', image: '/assets/symbols/wild-dragon.svg' },
  { title: 'FREE SPINS', image: '/assets/symbols/lotus-scatter.svg' },
];

export default function LandingPage() {
  const me = useMe();
  const logout = useLogout();

  return (
    <div className={styles.page}>
      <PalaceBackground />

      <header className={styles.top}>
        <span className="demo-badge">DEMO MODE</span>
        <nav aria-label="Account">
          <Link to="/about">About</Link>
          {me.data ? (
            <>
              <Link to="/profile">{me.data.username}</Link>
              <button type="button" className={styles.linkButton} onClick={() => logout.mutate()}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main className={styles.hero}>
        <Logo size="lg" as="h1" />
        <p className={styles.tagline}>A mystical Mahjong adventure awaits.</p>
        <Link to="/game" className={`btn primary ${styles.cta}`}>
          Enter Game
        </Link>

        <ul className={styles.features}>
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <img src={feature.image} alt="" width={44} height={48} draggable={false} />
              <span>{feature.title}</span>
            </li>
          ))}
        </ul>
      </main>

      <footer className={styles.footer}>
        DEMO MODE · virtual DEMO CREDITS only · no deposits, withdrawals, payments or real-money
        wagering
      </footer>
    </div>
  );
}
