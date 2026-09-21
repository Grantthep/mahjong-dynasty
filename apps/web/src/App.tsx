import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestGate } from './components/GuestGate';
import { LoadingScreen } from './components/StatusScreens';
import AboutPage from './pages/AboutPage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';

// Phaser is large: load the game page (and Phaser) only when it is needed.
const GamePage = lazy(() => import('./pages/GamePage'));

/** The site opens straight into the game. There is no landing, sign-up or log-in page. */
export default function App() {
  return (
    <Routes>
      <Route path="/about" element={<AboutPage />} />
      <Route element={<GuestGate />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <GamePage />
            </Suspense>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>
      {/* The game used to live at /game. */}
      <Route path="/game" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
