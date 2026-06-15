import type { IconName } from '../ui/Icon';

/** Les 4 onglets principaux de l'app (BottomNav mobile / Sidebar desktop). */
export const TABS: { id: string; label: string; icon: IconName; to: string }[] = [
  { id: 'agenda', label: 'Agenda', icon: 'calendar', to: '/' },
  { id: 'games', label: 'Jeux', icon: 'games', to: '/games' },
  { id: 'prono', label: 'Prono', icon: 'trophy', to: '/prono' },
  { id: 'profile', label: 'Moi', icon: 'user', to: '/profile' },
];

/** Onglet actif selon le chemin courant (les pages de détail rattachées). */
export const activeTabId = (pathname: string): string => {
  if (pathname.startsWith('/games') || pathname.startsWith('/game/')) return 'games';
  if (pathname.startsWith('/prono')) return 'prono';
  if (pathname.startsWith('/teams')) return 'agenda';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'agenda'; // « / », /match/:id, /team/:id, /search
};
