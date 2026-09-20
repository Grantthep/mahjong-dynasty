import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '../hooks/useAuth';
import { ErrorScreen, LoadingScreen } from './StatusScreens';

/** Only lets logged-in players through; everyone else is sent to /login. */
export function ProtectedRoute() {
  const location = useLocation();
  const me = useMe();

  if (me.isPending) return <LoadingScreen label="Checking your session…" />;
  if (me.isError) {
    return (
      <ErrorScreen
        message={me.error instanceof Error ? me.error.message : 'Could not reach the server.'}
        onRetry={() => void me.refetch()}
      />
    );
  }
  if (!me.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
