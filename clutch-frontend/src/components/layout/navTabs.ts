import type { IconName } from "../ui/Icon";

/** Les 5 onglets principaux de l'app (BottomNav mobile / FloatingNav desktop). */
export const TABS: { id: string; label: string; icon: IconName; to: string }[] =
  [
    { id: "agenda", label: "Résultats", icon: "calendar", to: "/" },
    { id: "games", label: "Jeux", icon: "games", to: "/games" },
    { id: "prono", label: "Mes pronos", icon: "trophy", to: "/prono" },
    { id: "ligues", label: "Ligues", icon: "users", to: "/ligues" },
    { id: "profile", label: "Profil", icon: "user", to: "/profile" },
  ];

/** Onglet actif selon le chemin courant (les pages de détail rattachées). */
export const activeTabId = (pathname: string): string => {
  if (pathname.startsWith("/games") || pathname.startsWith("/game/"))
    return "games";
  if (pathname.startsWith("/prono")) return "prono";
  if (pathname.startsWith("/ligues")) return "ligues";
  if (pathname.startsWith("/profile")) return "profile";
  return "agenda"; // « / », /match/:id, /team/:id, /teams, /search
};
