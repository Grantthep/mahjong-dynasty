import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { PageLayout } from '../layouts/PageLayout';
import styles from './AuthForm.module.css';

export default function NotFoundPage() {
  const t = useT();
  return (
    <PageLayout>
      <div className={styles.card}>
        <h1>{t('notFound.title')}</h1>
        <p className={styles.lead}>{t('notFound.lead')}</p>
        <p className={styles.alt}>
          <Link to="/">{t('notFound.back')}</Link>
        </p>
      </div>
    </PageLayout>
  );
}
