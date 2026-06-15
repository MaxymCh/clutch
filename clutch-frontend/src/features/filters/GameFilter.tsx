import { useGames } from '../../api/queries/useGames';

type GameFilterProps = {
  value: string | null;
  onChange: (gameId: string | null) => void;
};

/** Filtre par jeu : onglets texte soulignés d'orange (style Pulse). */
export const GameFilter = ({ value, onChange }: GameFilterProps) => {
  const { data: games } = useGames();
  if (!games) return <div className="h-7" />; // réserve la hauteur pendant le chargement

  const items = [{ id: null as string | null, label: 'Tous' }].concat(
    games.map((g) => ({ id: g.id as string | null, label: g.short })),
  );

  return (
    <div className="scrollbar-none flex gap-4.5 overflow-x-auto px-5" role="tablist">
      {items.map(({ id, label }) => {
        const active = id === value;
        return (
          <button
            key={label}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`shrink-0 cursor-pointer border-b-2 pb-2 text-sm leading-none tracking-tight ${
              active ? 'border-accent font-bold text-ink' : 'border-transparent font-medium text-dim'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
