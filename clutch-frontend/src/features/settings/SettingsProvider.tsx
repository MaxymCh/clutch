import { useEffect, type ReactNode } from 'react';
import { usePreferences, useUpdatePreferences } from '../../api/queries/usePreferences';
import { SettingsContext, type Theme } from './settingsContext';

/** Réglages utilisateur persistés en base via /me/preferences. */
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data: prefs } = usePreferences();
  const { mutate: updatePrefs } = useUpdatePreferences();

  const theme = prefs?.theme ?? 'light';
  const notifications = prefs?.notifications ?? true;
  const onboarded = prefs?.onboarded ?? false;

  // applique le thème sur <html> → les tokens [data-theme="dark"] prennent le relais
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme: (t: Theme) => updatePrefs({ theme: t }),
        notifications,
        setNotifications: (on: boolean) => updatePrefs({ notifications: on }),
        onboarded,
        setOnboarded: (done: boolean) => updatePrefs({ onboarded: done }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
