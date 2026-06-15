import { Outlet } from 'react-router-dom';
import { useMatches } from '../api/queries/useMatches';
import { BottomNav } from '../components/layout/BottomNav';
import { Sidebar } from '../components/layout/Sidebar';
import { FavoritesProvider } from '../features/favorites/FavoritesProvider';
import { Onboarding } from '../features/onboarding/Onboarding';
import { PredictionsProvider } from '../features/prono/PredictionsProvider';
import { useSettings } from '../features/settings/settingsContext';
import { SettingsProvider } from '../features/settings/SettingsProvider';
import { ThemeToggle } from '../features/settings/ThemeToggle';

/** Coquille de l'app : sidebar desktop + bottom nav mobile + onboarding. */
const Shell = () => {
  const { onboarded, setOnboarded } = useSettings();
  const { data: matches } = useMatches();
  const agendaLive = (matches ?? []).some((m) => m.status === 'live');

  return (
    <>
      <Sidebar agendaLive={agendaLive} themeToggle={<ThemeToggle />} />
      <div className="lg:pl-60">
        <Outlet />
      </div>
      <BottomNav />
      {!onboarded && <Onboarding onDone={() => setOnboarded(true)} />}
    </>
  );
};

/** Layout racine : fournit les contextes d'état local à toutes les routes. */
export const AppLayout = () => (
  <SettingsProvider>
    <FavoritesProvider>
      <PredictionsProvider>
        <Shell />
      </PredictionsProvider>
    </FavoritesProvider>
  </SettingsProvider>
);
