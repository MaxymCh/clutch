import { useGames } from '../../api/queries/useGames';
import { useTeams } from '../../api/queries/useTeams';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { useFavorites } from '../favorites/favoritesContext';

/** Étape 0 — bienvenue. */
export const WelcomeStep = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
    <span className="grid size-19 place-items-center rounded-[22px] bg-accent text-on-accent shadow-[0_14px_40px] shadow-accent/35">
      <Icon name="bolt" size={40} strokeWidth={2.2} />
    </span>
    <div>
      <p className="text-4xl leading-none font-semibold tracking-tighter text-ink">Clutch</p>
      <p className="mx-auto mt-3.5 max-w-70 text-base leading-relaxed font-medium text-dim">
        Tous les matchs de l'Esports World Cup 2026, réunis. Un seul calendrier, tous jeux
        confondus.
      </p>
    </div>
  </div>
);

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
    <div className="flex flex-1 flex-col px-6 pt-2">
      <StepTitle title="Quels jeux tu suis ?" sub="On mettra tes jeux en avant dans l'agenda." />
      <div className="grid grid-cols-2 gap-2.5">
        {(games ?? []).map((game) => {
          const on = favGames.includes(game.id);
          return (
            <button
              key={game.id}
              onClick={() => toggleGame(game.id)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-left transition-transform active:scale-[.97] ${
                on ? 'border-accent bg-accent/5' : 'border-line-2 bg-surface'
              }`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-[10px] text-[11px] font-extrabold text-on-accent ${
                  on ? 'bg-accent' : 'bg-ink'
                }`}
              >
                {game.tag.slice(0, 3)}
              </span>
              <span className={`text-[13px] leading-tight font-bold ${on ? 'text-accent' : 'text-ink'}`}>
                {game.short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Étape 2 — choix des équipes favorites. */
export const TeamsStep = () => {
  const { data: teams } = useTeams();
  const { teams: favTeams, toggleTeam } = useFavorites();
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pt-2">
      <StepTitle title="Tes équipes favorites" sub="Filtre rapide + accès direct à leurs matchs." />
      <div className="grid flex-1 content-start gap-2 overflow-auto sm:grid-cols-2">
        {(teams ?? []).map((team) => {
          const on = favTeams.includes(team.id);
          return (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-[14px] border-[1.5px] px-3 py-2.5 text-left transition-transform active:scale-[.97] ${
                on ? 'border-accent bg-accent/5' : 'border-line-2 bg-surface'
              }`}
            >
              <TeamLogo tag={team.tag} size={28} solid={on} />
              <span className={`truncate text-[12.5px] font-semibold ${on ? 'text-accent' : 'text-ink'}`}>
                {team.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
