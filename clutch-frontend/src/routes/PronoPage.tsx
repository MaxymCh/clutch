import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useGroups } from '../api/queries/useGroups';
import { useLeaderboard } from '../api/queries/useLeaderboard';
import { useMatches } from '../api/queries/useMatches';
import { usePredictionHistory } from '../api/queries/useMatches';
import { useUser } from '../api/queries/useUser';
import { Avatar } from '../components/ui/Avatar';
import { Page } from '../components/layout/Page';
import { GameLogo } from '../components/ui/GameLogo';
import { Icon } from '../components/ui/Icon';
import { Seg } from '../components/ui/Seg';
import { PageSpinner } from '../components/ui/Spinner';
import { TeamLogo } from '../components/ui/TeamLogo';
import { PredictCard } from '../features/prono/PredictCard';
import { PredictSheet } from '../features/prono/PredictSheet';
import { RankRow } from '../features/prono/RankRow';
import { formatDayMonth, formatWeekdayShort } from '../lib/date';
import { countryFlag } from '../lib/flag';
import { formatPoints } from '../lib/format';
import type { GroupMember } from '../types/community';
import type { Match } from '../types/esports';

/** Onglet Mes pronos : sélecteur de groupe, pronos + classement. */
export const PronoPage = () => {
  const { data: groups } = useGroups();
  const { data: matches, isPending } = useMatches();
  const { data: history = [], isPending: isHistoryPending } = usePredictionHistory();
  const { data: games } = useGames();
  const { data: user } = useUser();
  const { data: global, isPending: isGlobalPending } = useLeaderboard();

  const [predicting, setPredicting] = useState<Match | null>(null);
  const [view, setView] = useState<'pronos' | 'classement'>('pronos');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);

  const selectedGroup = (groups ?? []).find((g) => g.id === selectedGroupId) ?? null;

  // Jeux disponibles : dépend du groupe sélectionné
  const availableGames = useMemo(() => {
    if (!games) return [];
    if (!selectedGroup) return games;
    if (selectedGroup.gameIds && selectedGroup.gameIds.length > 0)
      return games.filter((g) => selectedGroup.gameIds!.includes(g.id));
    return games;
  }, [games, selectedGroup]);

  // Filtrage des matchs
  const filteredMatches = useMemo(() => {
    let list = matches ?? [];
    if (selectedGroup && selectedGroup.gameIds && selectedGroup.gameIds.length > 0) {
      list = list.filter((m) => selectedGroup.gameIds!.includes(m.gameId));
    }
    if (selectedGameId) list = list.filter((m) => m.gameId === selectedGameId);
    return list;
  }, [matches, selectedGroup, selectedGameId]);

  const toPredict = useMemo(
    () => filteredMatches.filter((m) => m.status === 'upcoming'),
    [filteredMatches],
  );

  const filteredHistory = useMemo(
    () =>
      history.filter(({ match }) => {
        if (selectedGroup && selectedGroup.gameIds && selectedGroup.gameIds.length > 0) {
          if (!selectedGroup.gameIds.includes(match.gameId)) return false;
        }
        if (selectedGameId && match.gameId !== selectedGameId) return false;
        return true;
      }),
    [history, selectedGroup, selectedGameId],
  );

  const tagOf = (m: Match) => games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();

  // Classement : mondial si "Général", membres du groupe sinon
  const ranking = useMemo<GroupMember[]>(() => {
    if (selectedGroup) {
      return [...selectedGroup.members].sort((a, b) => b.points - a.points);
    }
    return [];
  }, [selectedGroup]);

  // Reset game filter when switching group
  const selectGroup = (id: string | null) => {
    setSelectedGroupId(id);
    setSelectedGameId(null);
  };

  const hasGroups = (groups ?? []).length > 0;

  return (
    <Page>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[24px] leading-none font-semibold tracking-tighter text-ink">
          Mes pronos
        </h1>
        <p className="mt-1.5 text-[13px] leading-none font-medium text-dim">
          Devine, marque des points, grimpe
        </p>
      </div>

      {/* Sélecteur de ligue — clairement identifié */}
      <div className="relative px-5 pb-3">
        <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-dim uppercase">
          Ligue
        </label>
        <button
          onClick={() => setGroupOpen(!groupOpen)}
          className="inline-flex w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-left transition-colors"
        >
          <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
            {selectedGroup ? (
              <>
                <span>{selectedGroup.emoji}</span>
                {selectedGroup.name}
                <span className="text-[11px] font-medium text-dim">· {selectedGroup.members.length} joueurs</span>
              </>
            ) : (
              'Général'
            )}
          </span>
          <Icon
            name="chevron"
            size={16}
            className={`text-dim transition-transform ${groupOpen ? '-rotate-90' : 'rotate-90'}`}
          />
        </button>
        {groupOpen && (
          <div className="absolute right-5 left-5 z-20 rounded-b-xl border border-t-0 border-line bg-surface shadow-lg">
            <button
              onClick={() => { selectGroup(null); setGroupOpen(false); }}
              className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-[13px] font-bold transition-colors ${
                !selectedGroupId ? 'bg-accent/8 text-accent' : 'text-ink'
              }`}
            >
              Général
              <span className="ml-auto text-[11px] font-medium text-dim">Classement global</span>
            </button>
            {(groups ?? []).map((g, i) => (
              <button
                key={g.id}
                onClick={() => { selectGroup(g.id); setGroupOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-[13px] font-bold transition-colors ${
                  i === (groups ?? []).length - 1 ? 'rounded-b-xl' : ''
                } ${
                  selectedGroupId === g.id ? 'bg-accent/8 text-accent' : 'text-ink'
                }`}
              >
                <span>{g.emoji}</span>
                <span>{g.name}</span>
                <span className="ml-auto text-[11px] font-medium text-dim">{g.members.length} joueurs</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtre par jeu — badges lisibles, retour à la ligne */}
      {availableGames.length > 1 && (
        <div className="px-5 pt-1 pb-4">
          <div className="flex flex-wrap gap-2.5" role="tablist">
            <button
              role="tab"
              aria-selected={!selectedGameId}
              onClick={() => setSelectedGameId(null)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-transform active:scale-95 ${
                !selectedGameId
                  ? 'border-accent bg-accent/8 text-accent'
                  : 'border-line-2 text-dim'
              }`}
            >
              <Icon name="filter" size={14} strokeWidth={2} />
              Tous
            </button>
            {availableGames.map((g) => {
              const active = selectedGameId === g.id;
              return (
                <button
                  key={g.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedGameId(active ? null : g.id)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 transition-transform active:scale-95 ${
                    active ? 'border-accent bg-accent/8' : 'border-line-2'
                  }`}
                >
                  <GameLogo tag={g.tag} size={18} logoUrl={g.logoUrl} />
                  <span className={`text-[13px] font-semibold ${active ? 'text-accent' : 'text-ink'}`}>
                    {g.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Seg tabs */}
      <div className="px-5 pb-4">
        <Seg
          full
          value={view}
          onChange={(value) => setView(value as 'pronos' | 'classement')}
          options={[
            { value: 'pronos', label: 'Pronos' },
            { value: 'classement', label: 'Classement' },
          ]}
        />
      </div>

      <div className="h-px bg-line" />

      {/* ─── Vue Pronos ─── */}
      {view === 'pronos' && (
        <div className="px-5">
          {/* Empty state */}
          {!hasGroups && !isPending && toPredict.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-14 text-center">
              <span className="grid size-16 place-items-center rounded-3xl bg-accent/10 text-accent">
                <Icon name="trophy" size={32} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-base font-bold text-ink">Prêt à jouer ?</p>
                <p className="mt-1.5 max-w-65 text-[13px] leading-relaxed font-medium text-dim">
                  Rejoins une ligue pour défier tes amis et commencer à pronostiquer.
                </p>
              </div>
              <Link
                to="/ligues"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-bold text-on-accent"
              >
                <Icon name="users" size={14} strokeWidth={2} />
                Mes ligues
              </Link>
            </div>
          )}

          {/* Matchs à pronostiquer */}
          {(isPending || toPredict.length > 0) && (
            <>
              <h2 className="pt-5 pb-4 text-[17px] leading-none font-bold tracking-tight text-ink">
                À pronostiquer <span className="text-faint">{toPredict.length}</span>
              </h2>
              {isPending && <PageSpinner />}
              <div className="grid grid-cols-2 gap-3 pb-4">
                {toPredict.map((m) => (
                  <PredictCard
                    key={m.id}
                    match={m}
                    gameTag={tagOf(m)}
                    gameLogoUrl={games?.find((g) => g.id === m.gameId)?.logoUrl}
                    onPredict={setPredicting}
                    compact
                  />
                ))}
              </div>
            </>
          )}

          {/* Historique */}
          {(isHistoryPending || filteredHistory.length > 0) && (
            <>
              <div className="flex items-baseline justify-between pt-4 pb-3">
                <h2 className="text-base leading-none font-bold tracking-tight text-ink">
                  Pronos passés
                </h2>
                <span className="text-[13px] font-bold text-dim">{filteredHistory.length}</span>
              </div>
              {isHistoryPending && <PageSpinner />}
              <div className="flex flex-col gap-3 pb-6">
                {filteredHistory.map(({ match, prediction, points }) => {
                  const pickedTeam = prediction.pick === 'a' ? match.teamA : match.teamB;
                  const actualWinner =
                    (match.scoreA ?? 0) > (match.scoreB ?? 0) ? match.teamA : match.teamB;
                  const correct = pickedTeam.id === actualWinner.id;
                  const exact =
                    prediction.scoreA === (match.scoreA ?? 0) &&
                    prediction.scoreB === (match.scoreB ?? 0);
                  const game = games?.find((g) => g.id === match.gameId);
                  const pointsValue = points ?? 0;

                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-line bg-surface-2 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between text-[10px] font-semibold tracking-wide text-ink-2 uppercase">
                        <span className="flex items-center gap-1.5">
                          <Link
                            to={`/game/${match.gameId}`}
                            className="inline-flex items-center gap-1.5 text-accent"
                          >
                            <GameLogo tag={tagOf(match)} size={18} logoUrl={game?.logoUrl} />
                            <span className="text-[10px] font-bold tracking-[.08em]">{tagOf(match)}</span>
                          </Link>
                          <span className="size-0.75 rounded-full bg-dim" />
                          {match.phase}
                        </span>
                        <span className="text-dim">
                          {formatWeekdayShort(match.date)} {formatDayMonth(match.date)} · {match.time}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-1 flex-col items-center gap-1.5">
                          <TeamLogo tag={match.teamA.tag} size={44} logoUrl={match.teamA.logoUrl} />
                          <span className={`max-w-full truncate text-center text-[13px] font-bold ${(match.scoreA ?? 0) < (match.scoreB ?? 0) ? 'text-dim' : 'text-ink'}`}>
                            {match.teamA.name}
                          </span>
                        </div>

                        <div className="shrink-0 px-3 text-center">
                          <div className="mb-1 text-[11px] font-bold text-accent">+{pointsValue} pts</div>
                          <div className="text-xl font-bold tabular-nums text-ink">
                            {match.scoreA ?? 0} – {match.scoreB ?? 0}
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col items-center gap-1.5">
                          <TeamLogo tag={match.teamB.tag} size={44} logoUrl={match.teamB.logoUrl} />
                          <span className={`max-w-full truncate text-center text-[13px] font-bold ${(match.scoreB ?? 0) < (match.scoreA ?? 0) ? 'text-dim' : 'text-ink'}`}>
                            {match.teamB.name}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                            exact
                              ? 'bg-accent/12 text-accent'
                              : correct
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          <Icon name={correct ? 'check' : 'close'} size={11} strokeWidth={2.5} />
                          Mon prono : {pickedTeam.tag} {prediction.scoreA}–{prediction.scoreB}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Vue Classement ─── */}
      {view === 'classement' && (
        <div className="px-5 pt-5">
          {/* Podium — top 3 */}
          {!selectedGroup && !isGlobalPending && (global ?? []).length >= 3 && (
            <Podium entries={global!.slice(0, 3)} />
          )}
          {selectedGroup && ranking.length >= 3 && (
            <Podium
              entries={ranking.slice(0, 3).map((m, i) => ({
                rank: i + 1,
                name: m.name,
                tag: m.tag,
                points: m.points,
              }))}
            />
          )}

          {/* Lien vers la ligue */}
          {selectedGroup && (
            <Link
              to={`/ligues/${selectedGroup.id}`}
              className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-bold text-on-accent transition-transform active:scale-[.97]"
            >
              Accéder à la ligue
              <Icon name="chevron" size={14} />
            </Link>
          )}

          {/* Ma position */}
          {user && !selectedGroup && (
            <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5">
              <RankRow
                rank={user.globalRank}
                name={user.name}
                tag={user.tag}
                points={user.points}
                countryCode={user.countryCode}
                isMe
              />
            </div>
          )}
          {selectedGroup && ranking.find((m) => m.isMe) && (
            <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5">
              <RankRow
                rank={ranking.findIndex((m) => m.isMe) + 1}
                name={ranking.find((m) => m.isMe)!.name}
                tag={ranking.find((m) => m.isMe)!.tag}
                points={ranking.find((m) => m.isMe)!.points}
                isMe
              />
            </div>
          )}

          {/* Liste complète */}
          {!selectedGroup && (
            <>
              {isGlobalPending && <PageSpinner />}
              {!isGlobalPending && (
                <div className="pb-6">
                  {(global ?? []).map((entry) => (
                    <RankRow key={entry.rank} {...entry} topHighlight={entry.rank <= 3} />
                  ))}
                </div>
              )}
            </>
          )}

          {selectedGroup && (
            <div className="pb-6">
              {ranking.map((m, i) => (
                <RankRow
                  key={m.name}
                  rank={i + 1}
                  name={m.name}
                  tag={m.tag}
                  points={m.points}
                  isMe={m.isMe}
                  topHighlight={i < 3}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <PredictSheet match={predicting} onClose={() => setPredicting(null)} />
    </Page>
  );
};

/* ─── Podium ─── */

type PodiumEntry = { rank: number; name: string; tag: string; points: number; countryCode?: string };

const Podium = ({ entries }: { entries: PodiumEntry[] }) => {
  // Ordre visuel : 2e à gauche, 1er au centre, 3e à droite
  const [first, second, third] = [entries[0], entries[1], entries[2]];
  const order = [second, first, third];

  return (
    <div className="mb-6 flex items-end justify-center gap-3">
      {order.map((entry, i) => {
        const isFirst = i === 1;
        return (
          <div key={entry.rank} className="flex flex-col items-center gap-2">
            <div className={`relative ${isFirst ? 'mb-1' : ''}`}>
              <Avatar tag={entry.tag} size={isFirst ? 56 : 44} />
              <span
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 grid size-5 place-items-center rounded-full text-[10px] font-black text-white ${
                  entry.rank === 1 ? 'bg-accent' : 'bg-dim'
                }`}
              >
                {entry.rank}
              </span>
            </div>
            <span className={`max-w-20 truncate text-center font-bold text-ink ${isFirst ? 'text-[13px]' : 'text-[11px]'}`}>
              {entry.name}
            </span>
            {entry.countryCode && (
              <span className="text-xs">{countryFlag(entry.countryCode)}</span>
            )}
            <span className={`font-bold tabular-nums text-accent ${isFirst ? 'text-base' : 'text-[13px]'}`}>
              {formatPoints(entry.points)} Pts
            </span>
          </div>
        );
      })}
    </div>
  );
};
