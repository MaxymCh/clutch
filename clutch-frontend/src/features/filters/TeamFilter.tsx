import { useTeams } from "../../api/queries/useTeams";
import { Icon } from "../../components/ui/Icon";
import { TeamLogo } from "../../components/ui/TeamLogo";
import { useFavorites } from "../favorites/favoritesContext";

type TeamFilterProps = {
  value: string[];
  onToggle: (teamId: string) => void;
  onClear: () => void;
};

/** Filtre par équipe : multi-sélection, favoris en premier avec ❤. */
export const TeamFilter = ({ value, onToggle, onClear }: TeamFilterProps) => {
  const { data } = useTeams();
  const { teams: favTeams } = useFavorites();
  if (!data) return <div className="h-8" />;

  // Favoris en premier
  const teams = [...data].sort(
    (a, b) => Number(favTeams.includes(b.id)) - Number(favTeams.includes(a.id)),
  );

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible">
      <button
        onClick={onClear}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
          value.length === 0
            ? "border-accent bg-accent/8 text-accent"
            : "border-line-2 text-dim"
        }`}
      >
        <Icon name="filter" size={13} strokeWidth={2} />
        Toutes
      </button>
      {teams.map((team) => {
        const active = value.includes(team.id);
        const isFav = favTeams.includes(team.id);
        return (
          <button
            key={team.id}
            onClick={() => onToggle(team.id)}
            aria-pressed={active}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 transition-transform active:scale-95 ${
              active ? "border-accent bg-accent/8" : "border-line-2"
            }`}
          >
            <TeamLogo
              tag={team.tag}
              size={20}
              solid={active}
              logoUrl={team.logoUrl}
            />
            <span
              className={`text-xs font-semibold ${active ? "text-accent" : "text-ink"}`}
            >
              {team.tag}
            </span>
            {isFav && <span className="text-[10px] text-accent">♥</span>}
          </button>
        );
      })}
    </div>
  );
};
