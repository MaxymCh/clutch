import { useTeams } from '../../api/queries/useTeams';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { useFavorites } from '../favorites/favoritesContext';

type TeamFilterProps = {
  value: string | null;
  onChange: (teamId: string | null) => void;
};

/** Filtre par équipe : puces tactiles, équipes suivies en premier. */
export const TeamFilter = ({ value, onChange }: TeamFilterProps) => {
  const { data } = useTeams();
  const { teams: favTeams } = useFavorites();
  if (!data) return <div className="h-8" />;

  // les favoris d'abord (accès pouce immédiat), puis le reste par ordre alpha
  const teams = [...data].sort(
    (a, b) => Number(favTeams.includes(b.id)) - Number(favTeams.includes(a.id)),
  );

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto px-5">
      <button
        onClick={() => onChange(null)}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
          value === null
            ? 'border-accent bg-accent/8 text-accent'
            : 'border-line-2 text-dim'
        }`}
      >
        <Icon name="filter" size={13} strokeWidth={2} />
        Toutes
      </button>
      {teams.map((team) => {
        const active = team.id === value;
        return (
          <button
            key={team.id}
            onClick={() => onChange(active ? null : team.id)}
            aria-pressed={active}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 transition-transform active:scale-95 ${
              active ? 'border-ink bg-ink' : 'border-line-2'
            }`}
          >
            <TeamLogo tag={team.tag} size={20} solid={active} />
            <span className={`text-xs font-semibold ${active ? 'text-surface' : 'text-dim'}`}>
              {team.tag}
            </span>
          </button>
        );
      })}
    </div>
  );
};
