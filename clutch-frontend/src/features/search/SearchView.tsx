import { useSearchParams } from 'react-router-dom';
import { useGames } from '../../api/queries/useGames';
import { GameLogo } from '../../components/ui/GameLogo';
import { Icon } from '../../components/ui/Icon';
import { Seg } from '../../components/ui/Seg';
import type { Game } from '../../types/esports';
import { SearchResults } from './SearchResults';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'done', label: 'Terminés' },
];

/** Recherche / filtres avancés — texte + statut + jeu, état dans l'URL. */
export const SearchView = () => {
  const [params, setParams] = useSearchParams();
  const { data: games } = useGames();

  const q = params.get('q') ?? '';
  const status = params.get('status') ?? 'all';
  const game = params.get('game') ?? 'all';

  const set = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === '' || value === 'all') next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="flex flex-col px-5">
      <div className="mt-1 mb-4 flex items-center gap-2.5 rounded-[14px] bg-surface-2 px-3.5 py-3">
        <Icon name="search" size={19} className="text-dim" />
        <input
          autoFocus
          value={q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Équipe, jeu, match…"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-faint"
        />
        {q && (
          <button onClick={() => set('q', '')} aria-label="Effacer" className="grid cursor-pointer text-dim">
            <Icon name="close" size={17} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Seg full options={STATUS_OPTIONS} value={status} onChange={(v) => set('status', v)} />
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {[{ id: 'all', label: 'Tous les jeux', game: null as Game | null }, ...(games ?? []).map((g) => ({ id: g.id as string, label: g.short, game: g }))].map(
            ({ id, label, game: g }) => {
              const on = id === game;
              return (
                <button
                  key={id}
                  onClick={() => set('game', id)}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
                    on ? 'border-ink bg-ink text-surface' : 'border-line-2 text-dim'
                  }`}
                >
                  {g && <GameLogo tag={g.tag} size={16} logoUrl={g.logoUrl} />}
                  {label}
                </button>
              );
            },
          )}
        </div>
      </div>

      <SearchResults q={q} status={status} game={game} />
    </div>
  );
};
