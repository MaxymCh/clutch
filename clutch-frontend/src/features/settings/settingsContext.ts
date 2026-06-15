import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

export type Settings = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  notifications: boolean;
  setNotifications: (on: boolean) => void;
  onboarded: boolean;
  setOnboarded: (done: boolean) => void;
};

/** Contexte des réglages utilisateur (fourni par <SettingsProvider>). */
export const SettingsContext = createContext<Settings | null>(null);

export const useSettings = (): Settings => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings doit être utilisé sous <SettingsProvider>');
  return ctx;
};
