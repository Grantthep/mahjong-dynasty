import { Outlet } from 'react-router-dom';
import { useMe } from '../hooks/useAuth';
import { useT } from '../i18n';
import { ErrorScreen, LoadingScreen } from './StatusScreens';

/**
 * Makes sure the visitor has a guest player before showing the page. Nobody logs in or signs up:
 * the server creates the guest on the first visit and the browser remembers it.
 */
export function GuestGate() {
  const t = useT();
  const me = useMe();

  if (me.isPending) return <LoadingScreen label={t('status.enterPalace')} />;
  if (me.isError) {
    return (
      <ErrorScreen
        message={me.error instanceof Error ? me.error.message : t('status.loadFailed')}
        onRetry={() => void me.refetch()}
      />
    );
  }
  return <Outlet />;
}
