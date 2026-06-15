import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { countryFlag } from '../../lib/flag';
import type { Team } from '../../types/esports';
import { useFavorites } from '../favorites/favoritesContext';

type TeamHeaderProps = {
  team: Team;
  stats: { wins: number; played: number; upcoming: number };
};

/** En-tête de la page équipe : identité, stats du tournoi, bouton de suivi. */
export const TeamHeader = ({ team, stats }: TeamHeaderProps) => {
  const { teams: favTeams, toggleTeam } = useFavorites();
  const following = favTeams.includes(team.id);
  return (
  <div className="flex flex-col items-center gap-3 border-b border-line px-5 pt-4 pb-6">
    <TeamLogo tag={team.tag} size={76} />
    <div className="text-center">
      <h1 className="text-[23px] leading-tight font-bold tracking-tight text-ink">{team.name}</h1>
      <p className="mt-1.5 text-[13px] font-semibold text-dim">
        {countryFlag(team.countryCode)} {team.tag} · EWC 2026
      </p>
    </div>
    <dl className="mt-1 flex gap-7">
      {(
        [
          ['Victoires', stats.wins],
          ['Joués', stats.played],
          ['À venir', stats.upcoming],
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
