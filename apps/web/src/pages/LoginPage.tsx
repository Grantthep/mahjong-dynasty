import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '@mahjong/shared';
import { LoadingScreen } from '../components/StatusScreens';
import { useLogin, useMe } from '../hooks/useAuth';
import { PageLayout } from '../layouts/PageLayout';
import styles from './AuthForm.module.css';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/game';

  const me = useMe();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  if (me.isPending) return <LoadingScreen />;
  if (me.data) return <Navigate to={from} replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    login.mutate(parsed.data, { onSuccess: () => navigate(from, { replace: true }) });
  };

  return (
    <PageLayout>
      <div className={styles.card}>
        <h1>Welcome back</h1>
        <p className={styles.lead}>Log in to enter the palace.</p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby="email-error"
            />
            <span id="email-error" className="error">
              {errors.email}
            </span>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby="password-error"
            />
            <span id="password-error" className="error">
              {errors.password}
            </span>
          </div>

          {login.isError ? (
            <div className="alert" role="alert">
              {login.error.message}
            </div>
          ) : null}

          <button type="submit" className="btn primary" disabled={login.isPending}>
            {login.isPending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className={styles.alt}>
          New here? <Link to="/register">Create a free demo account</Link>
        </p>
        <p className={styles.demoHint}>
          Seeded demo account: <code>demo@mahjong.local</code> / <code>Demo1234!</code>
        </p>
      </div>
    </PageLayout>
  );
}
