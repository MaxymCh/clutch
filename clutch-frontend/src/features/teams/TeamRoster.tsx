import { useTeamPlayers } from '../../api/queries/useTeams';
import { Card } from '../../components/ui/Card';
import { countryFlag } from '../../lib/flag';
import type { Player, Team } from '../../types/esports';

/** Pastille avatar : initiale du pseudo + drapeau en petit badge. */
const PlayerAvatar = ({ player }: { player: Player }) => (
  <span className="relative inline-flex shrink-0">
    <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface-2 text-[15px] font-bold text-ink">
      {player.name.charAt(0).toUpperCase()}
    </span>
    <span className="absolute -right-1 -bottom-1 text-[13px] leading-none">
      {countryFlag(player.countryCode)}
    </span>
  </span>
);

/** Effectif d'une équipe (page équipe) : grille responsive de joueurs. */
export const TeamRoster = ({ team }: { team: Team }) => {
  const { data: players, isPending } = useTeamPlayers(team.id);

  if (isPending) return null;
  if (!players || players.length === 0) return null;

  return (
    <section className="px-5 pt-5">
      <h2 className="pb-2 text-[17px] leading-none font-semibold tracking-tight text-ink">
        Effectif
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {players.map((player) => (
          <Card key={player.id} inset className="flex items-center gap-2.5 p-3">
            <PlayerAvatar player={player} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-semibold leading-tight text-ink">
                {player.name}
              </span>
              {player.role && (
                <span className="text-[11px] font-semibold tracking-wide text-dim uppercase">
                  {player.role}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
