import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AppLayout } from './routes/AppLayout';
import { CalendarPage } from './routes/CalendarPage';
import { GamePage } from './routes/GamePage';
import { GamesPage } from './routes/GamesPage';
import { GroupNewPage } from './routes/GroupNewPage';
import { GroupPage } from './routes/GroupPage';
import { LeaderboardPage } from './routes/LeaderboardPage';
import { MatchPage } from './routes/MatchPage';
import { ProfilePage } from './routes/ProfilePage';
import { PronoPage } from './routes/PronoPage';
import { SearchPage } from './routes/SearchPage';
import { TeamsPage } from './routes/TeamsPage';
import { TeamPage } from './routes/TeamPage';

// Client TanStack Query — toutes les données serveur passent par lui
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
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
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
