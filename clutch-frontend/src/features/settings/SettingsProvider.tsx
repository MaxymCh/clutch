import { useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../../lib/useLocalStorage';
import { SettingsContext, type Theme } from './settingsContext';

/** Réglages utilisateur persistés : thème, notifications, onboarding vu. */
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
  const [notifications, setNotifications] = useLocalStorage('notifications', true);
  const [onboarded, setOnboarded] = useLocalStorage('onboarded', false);

  // applique le thème sur <html> → les tokens [data-theme="dark"] prennent le relais
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, notifications, setNotifications, onboarded, setOnboarded }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
