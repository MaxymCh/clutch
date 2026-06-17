import { Outlet } from "react-router-dom";
import { usePreferences } from "../api/queries/usePreferences";
import { useMatches } from "../api/queries/useMatches";
import { useFavorites } from "../features/favorites/favoritesContext";
import { isMatchLive } from "../lib/date";
import { BottomNav } from "../components/layout/BottomNav";
import { FloatingNav } from "../components/layout/FloatingNav";
import { FavoritesProvider } from "../features/favorites/FavoritesProvider";
import { Onboarding } from "../features/onboarding/Onboarding";
import { PredictionsProvider } from "../features/prono/PredictionsProvider";
import { useSettings } from "../features/settings/settingsContext";
import { SettingsProvider } from "../features/settings/SettingsProvider";
import { ThemeToggle } from "../features/settings/ThemeToggle";

/** Coquille de l'app : floating nav desktop + bottom nav mobile + onboarding. */
const Shell = () => {
  const { onboarded, setOnboarded } = useSettings();
  const { isPlaceholderData: prefsLoading } = usePreferences();
  const { data: matches } = useMatches();
  const { teams: favTeams } = useFavorites();
  const agendaLive = (matches ?? []).some((m) => isMatchLive(m));
  const forYouLive = (matches ?? []).some(
    (m) => isMatchLive(m) && (favTeams.includes(m.teamA.id) || favTeams.includes(m.teamB.id)),
  );

  return (
    <>
      {/* Bande de flou fixe au-dessus de la FloatingNav desktop : floute le contenu qui scroll derrière */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-20 hidden h-5 backdrop-blur-xl lg:block"
      />
      <FloatingNav agendaLive={agendaLive} forYouLive={forYouLive} themeToggle={<ThemeToggle />} />
      <div className="lg:pt-28">
        <Outlet />
      </div>
      <BottomNav />
      {!prefsLoading && !onboarded && <Onboarding onDone={() => setOnboarded(true)} />}
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
