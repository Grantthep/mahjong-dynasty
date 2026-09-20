import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registerSchema } from '@mahjong/shared';
import { LoadingScreen } from '../components/StatusScreens';
import { useMe, useRegister } from '../hooks/useAuth';
import { PageLayout } from '../layouts/PageLayout';
import styles from './AuthForm.module.css';

type FieldName = 'email' | 'username' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const me = useMe();
  const register = useRegister();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  if (me.isPending) return <LoadingScreen />;
  if (me.data) return <Navigate to="/game" replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = registerSchema.safeParse({ email, username, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    register.mutate(parsed.data, { onSuccess: () => navigate('/game', { replace: true }) });
  };

  const field = (
    name: FieldName,
    label: string,
    type: string,
    value: string,
    set: (v: string) => void,
    autoComplete: string,
  ) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => set(event.target.value)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={`${name}-error`}
      />
      <span id={`${name}-error`} className="error">
        {errors[name]}
      </span>
    </div>
  );

  return (
    <PageLayout>
      <div className={styles.card}>
        <h1>Create your account</h1>
        <p className={styles.lead}>Start with 10,000 DEMO CREDITS. No payment needed, ever.</p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          {field('email', 'Email', 'email', email, setEmail, 'email')}
          {field('username', 'Username', 'text', username, setUsername, 'username')}
          {field('password', 'Password', 'password', password, setPassword, 'new-password')}

          {register.isError ? (
            <div className="alert" role="alert">
              {register.error.message}
            </div>
          ) : null}

          <button type="submit" className="btn primary" disabled={register.isPending}>
            {register.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={styles.alt}>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </PageLayout>
  );
}
