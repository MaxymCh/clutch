import { Button } from '../../components/ui/Button';
import { Flag } from '../../components/ui/Flag';
import { GameLogo } from '../../components/ui/GameLogo';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import type { Game, Team } from '../../types/esports';
import { useFavorites } from '../favorites/favoritesContext';

type TeamHeaderProps = {
  team: Team;
  stats: { wins: number; played: number; upcoming: number };
  /** Jeux disputés par l'équipe (puce identité). */
  games?: Game[];
};

/** En-tête de la page équipe : identité, stats du tournoi, bouton de suivi. */
export const TeamHeader = ({ team, stats, games = [] }: TeamHeaderProps) => {
  const { teams: favTeams, toggleTeam } = useFavorites();
  const following = favTeams.includes(team.id);
  // Taux de victoire sur les matchs terminés (0 match joué → pas de %).
  const winrate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : null;
  return (
  <div className="flex flex-col items-center gap-3 border-b border-line px-5 pt-4 pb-6">
    <TeamLogo tag={team.tag} size={76} logoUrl={team.logoUrl} />
    <div className="text-center">
      <h1 className="text-[23px] leading-tight font-bold tracking-tight text-ink">{team.name}</h1>
      <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-dim">
        <Flag countryCode={team.countryCode} size={13} />
        {team.tag} · EWC 2026
      </p>
    </div>

    {/* Jeux disputés par l'équipe */}
    {games.length > 0 && (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {games.map((game) => (
          <span
            key={game.id}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 pr-2.5 pl-1"
          >
            <GameLogo tag={game.tag} size={18} logoUrl={game.logoUrl} />
            <span className="text-[11px] font-bold tracking-tight text-ink">{game.short}</span>
          </span>
        ))}
      </div>
    )}

    <dl className="mt-1 flex gap-7">
      {(
        [
          ['Victoires', stats.wins],
          ['Joués', stats.played],
          ['À venir', stats.upcoming],
          ...(winrate !== null ? ([['Winrate', `${winrate}%`]] as const) : []),
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="text-center">
          <dd className="text-[22px] leading-none font-semibold tabular-nums text-ink">{value}</dd>
          <dt className="mt-1.5 text-[11px] leading-none font-semibold tracking-wide text-dim uppercase">
            {label}
          </dt>
        </div>
      ))}
    </dl>
    <Button
      full
      variant={following ? 'soft' : 'dark'}
      onClick={() => toggleTeam(team.id)}
      className="mt-1 max-w-sm"
    >
      <Icon name={following ? 'check' : 'plus'} size={16} strokeWidth={2.2} />
      {following ? 'Équipe suivie' : "Suivre l'équipe"}
    </Button>
  </div>
  );
};
