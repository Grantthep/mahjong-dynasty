import type { ReactNode } from 'react';
import { useT } from '../i18n';
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

export function LoadingScreen({ label }: { label?: string }) {
  const t = useT();
  return (
    <Shell>
      <div role="status" aria-live="polite" className={styles.loading}>
        <span className={styles.spinner} aria-hidden="true" />
        <p>{label ?? t('common.loading')}</p>
      </div>
    </Shell>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <Shell>
      <div role="alert" className={styles.error}>
        <h2>{t('status.error')}</h2>
        <p>{message}</p>
        {onRetry ? (
          <button type="button" className="btn primary" onClick={onRetry}>
            {t('status.tryAgain')}
          </button>
        ) : null}
      </div>
    </Shell>
  );
}
