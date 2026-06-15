import { Outlet } from "react-router-dom";
import { useMatches } from "../api/queries/useMatches";
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
  const { data: matches } = useMatches();
  const agendaLive = (matches ?? []).some((m) => m.status === "live");

  return (
    <>
      {/* Bande de flou fixe au-dessus de la FloatingNav desktop : floute le contenu qui scroll derrière */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-20 hidden h-5 backdrop-blur-xl lg:block"
      />
      <FloatingNav agendaLive={agendaLive} themeToggle={<ThemeToggle />} />
      <div className="lg:pt-28">
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
