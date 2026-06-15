import { Icon } from '../../components/ui/Icon';
import { useSettings } from './settingsContext';

/** Bouton de bascule clair/sombre (sidebar desktop). */
export const ThemeToggle = () => {
  const { theme, setTheme } = useSettings();
  const dark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[13px] border border-line-2 px-3.5 py-3 text-[13.5px] font-semibold tracking-tight text-ink transition-transform active:scale-[.97]"
    >
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
      {dark ? 'Thème clair' : 'Thème sombre'}
    </button>
  );
};
