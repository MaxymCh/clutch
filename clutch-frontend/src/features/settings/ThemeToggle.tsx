import { Icon } from "../../components/ui/Icon";
import { useSettings } from "./settingsContext";

/** Bouton compact de bascule clair/sombre (icône seule). */
export const ThemeToggle = () => {
  const { theme, setTheme } = useSettings();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Thème clair" : "Thème sombre"}
      className="grid size-9 cursor-pointer place-items-center rounded-xl text-ink transition-transform hover:bg-surface-2 active:scale-90"
    >
      <Icon name={dark ? "sun" : "moon"} size={18} strokeWidth={1.9} />
    </button>
  );
};
