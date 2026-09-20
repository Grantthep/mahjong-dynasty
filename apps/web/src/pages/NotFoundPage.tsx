import { Link } from 'react-router-dom';
import { PageLayout } from '../layouts/PageLayout';
import styles from './AuthForm.module.css';

export default function NotFoundPage() {
  return (
    <PageLayout>
      <div className={styles.card}>
        <h1>Lost in the palace</h1>
        <p className={styles.lead}>This page does not exist.</p>
        <p className={styles.alt}>
          <Link to="/">Return to the entrance</Link>
        </p>
      </div>
    </PageLayout>
  );
}
