import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTeams } from '../api/queries/useTeams';
import { useUser } from '../api/queries/useUser';
import { Page } from '../components/layout/Page';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { Toggle } from '../components/ui/Toggle';
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

const chevron = <Icon name="chevron" size={16} className="text-faint" />;

/** Onglet Moi : profil, préférences (thème, notifs), application. */
export const ProfilePage = () => {
  const { data: user } = useUser();
  const { data: teams } = useTeams();
  const { theme, setTheme, notifications, setNotifications, setOnboarded } = useSettings();
  const { teams: favTeams } = useFavorites();
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
          <div>
            <div className="text-lg leading-none font-bold text-ink">{user?.name ?? '…'}</div>
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

        <SectionTitle>Application</SectionTitle>
        <Row icon="trophy" label="Mes pronostics" sub="Historique & points" right={chevron} to="/prono" />
        <Row icon="info" label="Revoir l'introduction" right={chevron} onClick={() => setOnboarded(false)} />
        <Row icon="info" label="À propos de Clutch" sub="Projet indépendant · non affilié à l'EWC" />
      </div>
    </Page>
  );
};
