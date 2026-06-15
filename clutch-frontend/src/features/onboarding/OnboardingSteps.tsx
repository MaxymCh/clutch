import { useEffect, useRef } from 'react';
import { useGames } from '../../api/queries/useGames';
import { useTeams } from '../../api/queries/useTeams';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { useFavorites } from '../favorites/favoritesContext';

const MAX_PSEUDO = 20;

const nameToTag = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.map((w) => w[0]).join('').toUpperCase().slice(0, 3) || name.slice(0, 3).toUpperCase() || '?';
};

type PseudoStepProps = { pseudo: string; onChange: (v: string) => void; error?: string | null };

/** Étape 0 — bienvenue + choix du pseudo. */
export const PseudoStep = ({ pseudo, onChange, error }: PseudoStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const tag = nameToTag(pseudo);
  const remaining = MAX_PSEUDO - pseudo.length;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-4">
      <span className="mb-5 grid size-16 place-items-center rounded-[18px] bg-accent text-on-accent shadow-[0_10px_30px] shadow-accent/30">
        <Icon name="bolt" size={32} strokeWidth={2.2} />
      </span>

      <h2 className="text-[26px] leading-tight font-semibold tracking-tighter text-ink text-center">
        Bienvenue sur Clutch !
      </h2>
      <p className="mt-2 mb-7 text-[13px] leading-snug font-medium text-dim text-center max-w-64">
        Comment tu veux t'appeler dans l'app ?
      </p>

      <div className="w-full max-w-xs">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={pseudo}
            onChange={(e) => { onChange(e.target.value.slice(0, MAX_PSEUDO)); }}
            placeholder="Ton pseudo…"
            className={`w-full rounded-2xl border-[1.5px] bg-surface px-4 py-3.5 text-[15px] font-semibold text-ink placeholder:font-medium placeholder:text-faint outline-none transition-all focus:ring-2 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-line-2 focus:border-accent focus:ring-accent/15'}`}
          />
          <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums ${remaining <= 4 ? 'text-accent' : 'text-faint'}`}>
            {remaining}
          </span>
        </div>

        {error && <p className="mt-2 text-[12px] font-semibold text-red-500">{error}</p>}

        {pseudo.trim().length >= 2 && !error && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
            <Avatar tag={tag} size={36} me />
            <div>
              <p className="text-[13px] font-bold text-ink leading-none">{pseudo.trim()}</p>
              <p className="mt-1 text-[11px] font-semibold text-dim">{tag} · 0 pts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StepTitle = ({ title, sub }: { title: string; sub: string }) => (
  <>
    <h2 className="text-[26px] leading-tight font-semibold tracking-tighter text-ink">{title}</h2>
    <p className="mt-2.5 mb-5 text-[13px] leading-snug font-medium text-dim">{sub}</p>
  </>
);

/** Étape 1 — choix des jeux favoris. */
export const GamesStep = () => {
  const { data: games } = useGames();
  const { games: favGames, toggleGame } = useFavorites();
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pt-2">
      <StepTitle title="Quels jeux tu suis ?" sub="On mettra tes jeux en avant dans l'agenda." />
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid grid-cols-1 gap-2 pb-4 sm:grid-cols-2 lg:grid-cols-3">
        {(games ?? []).map((game) => {
          const on = favGames.includes(game.id);
          return (
            <button
              key={game.id}
              onClick={() => toggleGame(game.id)}
              className={`group relative aspect-[4/1.5] w-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 active:scale-[.96] ${
                on ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : 'ring-1 ring-line-2'
              }`}
            >
              {/* Image de fond */}
              {game.bgUrl ? (
                <img
                  src={game.bgUrl}
                  alt={game.name}
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${on ? 'scale-105' : 'group-active:scale-105'}`}
                />
              ) : (
                <div className="absolute inset-0 bg-ink" />
              )}

              {/* Overlay gradient — plus léger si sélectionné pour laisser voir l'image */}
              <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-200 ${
                on
                  ? 'from-black/75 via-black/20 to-black/0'
                  : 'from-black/85 via-black/40 to-black/10'
              }`} />

              {/* Badge check */}
              {on && (
                <div className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-accent shadow-sm">
                  <Icon name="check" size={11} strokeWidth={2.8} className="text-white" />
                </div>
              )}

              {/* Nom en bas */}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="text-center text-[12px] font-bold leading-tight text-white drop-shadow-sm">
                  {game.short}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};

const toFlag = (code: string) =>
  [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');

/** Étape 2 — choix des équipes favorites. */
export const TeamsStep = () => {
  const { data: teams } = useTeams();
  const { teams: favTeams, toggleTeam } = useFavorites();
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pt-2">
      <StepTitle title="Tes équipes favorites" sub="Filtre rapide + accès direct à leurs matchs." />
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 gap-2 pb-4">
        {(teams ?? []).map((team) => {
          const on = favTeams.includes(team.id);
          return (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-3 py-3 text-left transition-all duration-150 active:scale-[.97] ${
                on ? 'border-accent bg-accent/8' : 'border-line-2 bg-surface'
              }`}
            >
              <TeamLogo tag={team.tag} size={36} solid={on} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[12px] font-bold leading-tight ${on ? 'text-accent' : 'text-ink'}`}>
                  {team.name}
                </p>
                <p className="mt-0.5 text-[10.5px] font-semibold text-dim">
                  {toFlag(team.countryCode)} {team.tag}
                </p>
              </div>
              {on && (
                <div className="grid size-5 shrink-0 place-items-center rounded-full bg-accent">
                  <Icon name="check" size={11} strokeWidth={2.8} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};
