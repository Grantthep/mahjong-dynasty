import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingScreen } from './components/StatusScreens';
import AboutPage from './pages/AboutPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

// Phaser is large: load the game page (and Phaser) only when a player enters the game.
const GamePage = lazy(() => import('./pages/GamePage'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/game"
          element={
            <Suspense fallback={<LoadingScreen label="Entering the palace…" />}>
              <GamePage />
            </Suspense>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
