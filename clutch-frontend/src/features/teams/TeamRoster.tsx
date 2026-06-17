import { useGames } from '../../api/queries/useGames';
import { useTeamPlayers } from '../../api/queries/useTeams';
import { Card } from '../../components/ui/Card';
import { GameLogo } from '../../components/ui/GameLogo';
import { countryFlag, countryName } from '../../lib/flag';
import type { Game, Player, Team } from '../../types/esports';

// Palette de dégradés déterministes pour les avatars (faute de vraie photo).
const AVATAR_GRADIENTS = [
  'from-rose-500 to-orange-400',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-fuchsia-500',
  'from-amber-500 to-pink-500',
  'from-cyan-500 to-blue-500',
];

/** Dégradé stable dérivé du pseudo (même joueur → même couleur). */
const gradientFor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

/** Avatar coloré : monogramme du pseudo sur dégradé + drapeau en badge. */
const PlayerAvatar = ({ player }: { player: Player }) => (
  <span className="relative inline-flex shrink-0">
    <span
      className={`inline-flex size-11 items-center justify-center rounded-full bg-linear-to-br ${gradientFor(player.name)} text-[16px] font-black text-white shadow-sm`}
    >
      {player.name.charAt(0).toUpperCase()}
    </span>
    <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-surface text-[12px] leading-none">
      {countryFlag(player.countryCode)}
    </span>
  </span>
);

/** Carte joueur réutilisée par chaque sous-effectif. */
const PlayerCard = ({ player }: { player: Player }) => {
  const country = countryName(player.countryCode);
  // Ligne secondaire : poste si connu, sinon nom du pays.
  const subtitle = player.role || country;
  return (
    <Card inset className="flex items-center gap-2.5 p-3">
      <PlayerAvatar player={player} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-semibold leading-tight text-ink">
          {player.name}
        </span>
        {subtitle && (
          <span
            className={`truncate text-[11px] font-semibold text-dim ${player.role ? 'tracking-wide uppercase' : ''}`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </Card>
  );
};

/** Grille de joueurs (responsive). */
const PlayerGrid = ({ players }: { players: Player[] }) => (
  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
    {players.map((player) => (
      <PlayerCard key={player.id} player={player} />
    ))}
  </div>
);

/** Regroupe les joueurs par jeu en conservant l'ordre d'arrivée. */
const groupByGame = (players: Player[]): { gameId?: string; players: Player[] }[] => {
  const groups: { gameId?: string; players: Player[] }[] = [];
  const index = new Map<string, number>();
  for (const player of players) {
    const key = player.gameId ?? '';
    let pos = index.get(key);
    if (pos === undefined) {
      pos = groups.length;
      index.set(key, pos);
      groups.push({ gameId: player.gameId, players: [] });
    }
    groups[pos].players.push(player);
  }
  return groups;
};

/** Effectif d'une équipe (page équipe) : un sous-bloc par jeu si plusieurs. */
export const TeamRoster = ({ team }: { team: Team }) => {
  const { data: players, isPending } = useTeamPlayers(team.id);
  const { data: games } = useGames();

  if (isPending) return null;
  if (!players || players.length === 0) return null;

  const gameOf = (id?: string): Game | undefined => games?.find((g) => g.id === id);
  const groups = groupByGame(players);
  const multiGame = groups.filter((g) => g.gameId).length > 1;

  return (
    <section className="px-5 pt-5">
      <h2 className="pb-2 text-[17px] leading-none font-semibold tracking-tight text-ink">
        Effectif
      </h2>

      {/* Un seul jeu (ou jeu inconnu) : grille simple. */}
      {!multiGame && <PlayerGrid players={players} />}

      {/* Plusieurs jeux : un bloc par jeu, avec en-tête (logo + nom + nombre). */}
      {multiGame &&
        groups.map((group) => {
          const game = gameOf(group.gameId);
          return (
            <div key={group.gameId ?? 'autres'} className="pt-3 first:pt-1">
              <div className="mb-2 flex items-center gap-2">
                <GameLogo
                  tag={game?.tag ?? group.gameId?.toUpperCase() ?? '?'}
                  size={22}
                  logoUrl={game?.logoUrl}
                />
                <span className="text-[13px] font-bold tracking-tight text-ink">
                  {game?.name ?? group.gameId?.toUpperCase() ?? 'Autres'}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-dim">
                  {group.players.length} joueur{group.players.length > 1 ? 's' : ''}
                </span>
              </div>
              <PlayerGrid players={group.players} />
            </div>
          );
        })}
    </section>
  );
};
