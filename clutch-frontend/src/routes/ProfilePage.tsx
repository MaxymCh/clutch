import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useTeams } from '../api/queries/useTeams';
import { useUpdateUser, useUser } from '../api/queries/useUser';
import { Page } from '../components/layout/Page';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { GameTile } from '../components/ui/GameTile';
import { Icon, type IconName } from '../components/ui/Icon';
import { Toggle } from '../components/ui/Toggle';
import { useAuth } from '../features/auth/authContext';
import { useFavorites } from '../features/favorites/favoritesContext';
import { useSettings } from '../features/settings/settingsContext';
import { formatPoints } from '../lib/format';

type RowProps = { icon: IconName; label: string; sub?: string; right?: ReactNode; to?: string; onClick?: () => void };

/** Ligne de réglage : icône, libellé, action à droite. */
const Row = ({ icon, label, sub, right, to, onClick }: RowProps) => {
  const body = (
    <>
      <span className="grid size-9.5 shrink-0 place-items-center rounded-[11px] bg-surface-2 text-ink">
        <Icon name={icon} size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug font-semibold text-ink">{label}</span>
        {sub && <span className="mt-0.5 block truncate text-xs font-medium text-dim">{sub}</span>}
      </span>
      {right}
    </>
  );
  const cls = 'flex w-full items-center gap-3 border-b border-line px-1 py-3.5 text-left';
  if (to) return <Link to={to} className={`${cls} transition-colors active:bg-surface-2`}>{body}</Link>;
  if (onClick)
    return <button onClick={onClick} className={`${cls} cursor-pointer transition-colors active:bg-surface-2`}>{body}</button>;
  return <div className={cls}>{body}</div>;
};

const SectionTitle = ({ children }: { children: string }) => (
  <h2 className="mt-6 mb-0.5 px-1 text-[11px] font-bold tracking-[.1em] text-dim uppercase">{children}</h2>
);

/** Onglet Moi : profil, préférences (thème, notifs), application. */
export const ProfilePage = () => {
  const chevron = <Icon name="chevron" size={16} className="text-faint" />;
  const { signOut } = useAuth();
  const { data: user } = useUser();
  const updateUser = useUpdateUser();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setNameValue(user?.name ?? '');
    setEditingName(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const confirmEdit = () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user?.name) { setEditingName(false); return; }
    updateUser.mutate({ name: trimmed }, { onSettled: () => setEditingName(false) });
  };

  const cancelEdit = () => setEditingName(false);
  const { data: teams } = useTeams();
  const { theme, setTheme, notifications, setNotifications } = useSettings();
  const { teams: favTeams, games: favGames, toggleGame } = useFavorites();
  const { data: games } = useGames();
  const dark = theme === 'dark';

  const followedTags =
    favTeams.length > 0
      ? favTeams
          .map((id) => teams?.find((t) => t.id === id)?.tag ?? id.toUpperCase())
          .join(' · ')
      : "Aucune pour l'instant";

  return (
    <Page>
      <div className="px-5 pt-4">
        <h1 className="pb-4 text-[24px] leading-none font-semibold tracking-tighter text-ink">Profil</h1>

        <Card className="flex items-center gap-4 p-4">
          <Avatar tag={user?.tag ?? 'YOU'} size={56} me />
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  className="min-w-0 flex-1 rounded-lg border border-accent bg-surface px-2 py-1 text-[15px] font-bold text-ink outline-none"
                  maxLength={32}
                  autoFocus
                />
                <button
                  onClick={confirmEdit}
                  disabled={updateUser.isPending}
                  className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg bg-accent text-on-accent disabled:opacity-50"
                >
                  <Icon name="check" size={14} strokeWidth={2.5} />
                </button>
                <button onClick={cancelEdit} className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-line text-dim">
                  <Icon name="close" size={14} />
                </button>
              </div>
            ) : (
              <button onClick={startEdit} className="group flex cursor-pointer items-center gap-1.5">
                <span className="text-lg leading-none font-bold text-ink">{user?.name ?? '…'}</span>
                <Icon name="pencil" size={13} className="text-faint transition-colors group-hover:text-dim" />
              </button>
            )}
            {user && (
              <div className="mt-1.5 text-[12.5px] leading-none font-semibold text-dim">
                {formatPoints(user.points)} pts · #{formatPoints(user.globalRank)} mondial
              </div>
            )}
          </div>
        </Card>

        <SectionTitle>Préférences</SectionTitle>
        <Row
          icon={dark ? 'moon' : 'sun'}
          label="Thème sombre"
          sub={dark ? 'Activé' : 'Désactivé'}
          right={<Toggle on={dark} onChange={(v) => setTheme(v ? 'dark' : 'light')} label="Thème sombre" />}
        />
        <Row
          icon="bell"
          label="Notifications"
          sub="Avant les matchs de mes équipes"
          right={<Toggle on={notifications} onChange={setNotifications} label="Notifications" />}
        />
        <Row icon="shield" label="Équipes suivies" sub={followedTags} right={chevron} to="/teams" />

        <SectionTitle>Jeux suivis</SectionTitle>
        <div className="grid grid-cols-3 gap-2 py-2 px-1 sm:grid-cols-4">
          {(games ?? []).map((game) => {
            const on = favGames.includes(game.id);
            return (
              <GameTile
                key={game.id}
                game={game}
                variant="compact"
                selected={on}
                onClick={() => toggleGame(game.id)}
              />
            );
          })}
        </div>

        <SectionTitle>Application</SectionTitle>
        <Row icon="info" label="À propos de Clutch" sub="Projet indépendant · non affilié à l'EWC" />

        <SectionTitle>Compte</SectionTitle>
        <button
          onClick={signOut}
          className="flex w-full cursor-pointer items-center gap-3 border-b border-line px-1 py-3.5 text-left transition-colors active:bg-surface-2"
        >
          <span className="grid size-9.5 shrink-0 place-items-center rounded-[11px] bg-red-50 text-red-500">
            <Icon name="close" size={19} />
          </span>
          <span className="text-[15px] font-semibold text-red-500">Se déconnecter</span>
        </button>
      </div>
    </Page>
  );
};
