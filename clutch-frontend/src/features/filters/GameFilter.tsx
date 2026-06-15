import { GameLogo } from '../../components/ui/GameLogo';
import { useGames } from '../../api/queries/useGames';

type GameFilterProps = {
  value: string | null;
  onChange: (gameId: string | null) => void;
};

/** Filtre par jeu : onglets texte soulignés d'orange (style Pulse). */
export const GameFilter = ({ value, onChange }: GameFilterProps) => {
  const { data: games } = useGames();
  if (!games) return <div className="h-7" />; // réserve la hauteur pendant le chargement

  return (
    <div className="scrollbar-none flex gap-4.5 overflow-x-auto px-5" role="tablist">
      <button
        role="tab"
        aria-selected={value === null}
        onClick={() => onChange(null)}
        className={`shrink-0 cursor-pointer border-b-2 pb-2 text-sm leading-none tracking-tight ${
          value === null ? 'border-accent font-bold text-ink' : 'border-transparent font-medium text-dim'
        }`}
      >
        Tous
      </button>
      {games.map((g) => {
        const active = g.id === value;
        return (
          <button
            key={g.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(g.id)}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 pb-2 text-sm leading-none tracking-tight ${
              active ? 'border-accent font-bold text-ink' : 'border-transparent font-medium text-dim'
            }`}
          >
            <GameLogo tag={g.tag} size={16} logoUrl={g.logoUrl} />
            {g.short}
          </button>
        );
      })}
    </div>
  );
};
