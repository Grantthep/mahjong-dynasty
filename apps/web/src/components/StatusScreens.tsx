import type { ReactNode } from 'react';
import { PalaceBackground } from './PalaceBackground';
import styles from './StatusScreens.module.css';

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <PalaceBackground />
      <div className={styles.card}>{children}</div>
    </div>
  );
}

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <Shell>
      <div role="status" aria-live="polite" className={styles.loading}>
        <span className={styles.spinner} aria-hidden="true" />
        <p>{label}</p>
      </div>
    </Shell>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Shell>
      <div role="alert" className={styles.error}>
        <h2>Something went wrong</h2>
        <p>{message}</p>
        {onRetry ? (
          <button type="button" className="btn primary" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    </Shell>
  );
}
