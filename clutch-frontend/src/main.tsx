import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AuthProvider } from './features/auth/AuthProvider';
import { useAuth } from './features/auth/authContext';
import { AppLayout } from './routes/AppLayout';
import { CalendarPage } from './routes/CalendarPage';
import { GamePage } from './routes/GamePage';
import { GamesPage } from './routes/GamesPage';
import { GroupNewPage } from './routes/GroupNewPage';
import { GroupPage } from './routes/GroupPage';
import { LeaderboardPage } from './routes/LeaderboardPage';
import { LoginPage } from './routes/LoginPage';
import { MatchPage } from './routes/MatchPage';
import { ProfilePage } from './routes/ProfilePage';
import { PronoPage } from './routes/PronoPage';
import { SearchPage } from './routes/SearchPage';
import { TeamPage } from './routes/TeamPage';

// Client TanStack Query — toutes les données serveur passent par lui
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

/** Redirige vers /login si l'utilisateur n'est pas connecté. */
const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<CalendarPage />} />
                <Route path="/team/:id" element={<TeamPage />} />
                <Route path="/match/:id" element={<MatchPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/game/:id" element={<GamePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/prono" element={<PronoPage />} />
                <Route path="/prono/group/new" element={<GroupNewPage />} />
                <Route path="/prono/group/:id" element={<GroupPage />} />
                <Route path="/prono/classement" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
