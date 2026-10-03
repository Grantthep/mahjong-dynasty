import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches crashes anywhere in the React tree so a bug in the game never shows a blank white
 * screen. Deliberately self-contained — no i18n, no router, no other app component — so the
 * fallback itself cannot be the thing that crashes.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Demo project: log to the console only. Wire up a reporting service here before a real launch.
    console.error('Unhandled error in the game UI:', error, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" style={styles.screen}>
        <h1 style={styles.heading}>Something went wrong</h1>
        <p style={styles.body}>
          The game hit an unexpected error. Reloading the page usually fixes it. Your demo balance
          is safe — it lives on the server, not in this page.
        </p>
        <button type="button" onClick={this.reload} style={styles.button}>
          Reload
        </button>
      </div>
    );
  }
}

// Inline styles on purpose: this must render even if global stylesheets failed to load.
const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
    textAlign: 'center',
    background: '#061512',
    color: '#f4ebd7',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  heading: { margin: 0, fontSize: '1.4rem' },
  body: { margin: 0, maxWidth: 420, opacity: 0.85, lineHeight: 1.5 },
  button: {
    padding: '0.6rem 1.4rem',
    borderRadius: 999,
    border: '1px solid #d6a84b',
    background: '#146b57',
    color: '#f2d27c',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
