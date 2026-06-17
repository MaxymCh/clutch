import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatches } from '../api/queries/useMatches';
import { useTeams } from '../api/queries/useTeams';
import { useUser } from '../api/queries/useUser';
import { Page } from '../components/layout/Page';
import { GameLogo } from '../components/ui/GameLogo';
import { GameTile } from '../components/ui/GameTile';
import { Icon } from '../components/ui/Icon';
import { PageSpinner } from '../components/ui/Spinner';
import { TeamLogo } from '../components/ui/TeamLogo';
import { StatusPill } from '../features/matches/StatusPill';
import { PredictSheet } from '../features/prono/PredictSheet';
import { PronoBadge } from '../features/prono/PronoBadge';
import { PlatformIcon } from '../components/ui/PlatformIcon';
import { useFavorites } from '../features/favorites/favoritesContext';
import { canPredictMatch, formatDayMonth, formatMatchPhaseDate, formatWeekdayShort, isMatchLive, matchStartDateTime } from '../lib/date';
import type { Match } from '../types/esports';

const todayIso = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const formatCountdown = (diffMs: number): string => {
  if (diffMs <= 0) return 'imminent';
  const totalSecs = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
};

const FeedCountdown = ({ date, time }: { date: string; time: string }) => {
  const target = matchStartDateTime(date, time).getTime();
  const [diffMs, setDiffMs] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const tick = () => setDiffMs(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return <>{formatCountdown(diffMs)}</>;
};

const UPCOMING_LIMIT = 5;
const RESULTS_LIMIT = 4;

/* ─── Card de match condensée (2 colonnes) ─── */
type FeedCardProps = {
  match: Match;
  gameTag: string;
  gameName: string;
  gameLogoUrl?: string;
  onPredict?: (m: Match) => void;
  showCountdown?: boolean;
};

const FeedCard = ({ match, gameTag, gameName, gameLogoUrl, onPredict, showCountdown = false }: FeedCardProps) => {
  const live = isMatchLive(match);
  const done = match.status === 'done';
  const upcoming = !live && match.status === 'upcoming';

  const hasResult = match.resultA != null || match.resultB != null;
  const aIsLoser = done && (hasResult ? match.resultA !== 'W' : (match.scoreA ?? 0) < (match.scoreB ?? 0));
  const bIsLoser = done && (hasResult ? match.resultB !== 'W' : (match.scoreB ?? 0) < (match.scoreA ?? 0));
  const isFF = match.resultA === 'FF' || match.resultB === 'FF';

  return (
    <div className={`relative flex flex-col gap-2.5 overflow-hidden rounded-xl border p-3 ${live ? 'border-accent/30 bg-accent/5' : 'border-line bg-surface-2'}`}>
      {live && <span className="absolute top-0 right-0 left-0 h-[2px] bg-accent" />}

      <Link to={`/match/${match.id}`} className="flex flex-col gap-2.5">
        {/* Jeu + statut */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <GameLogo tag={gameTag} size={22} logoUrl={gameLogoUrl} />
            <span className="truncate text-[13px] font-bold text-ink">{gameName}</span>
          </div>
          <StatusPill match={match} />
        </div>

        {/* Équipes + score/heure */}
        <div className="flex items-center gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <TeamLogo tag={match.teamA.tag} size={18} logoUrl={match.teamA.logoUrl} />
            <span className={`truncate text-[12px] font-bold ${aIsLoser ? 'text-dim' : 'text-ink'}`}>
              {match.teamA.name}
            </span>
            {match.resultA === 'FF' && (
              <span className="shrink-0 rounded border border-dim/40 px-0.5 text-[8px] font-bold text-dim">FF</span>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-center px-1">
            <span className={`text-[13px] font-black tabular-nums ${live ? 'text-accent' : done ? 'text-ink' : (upcoming && showCountdown) ? 'text-accent' : 'text-dim'}`}>
              {live || done ? (
                isFF ? 'FF' : `${match.scoreA ?? 0}–${match.scoreB ?? 0}`
              ) : (upcoming && showCountdown) ? (
                <FeedCountdown date={match.date} time={match.time} />
              ) : (
                match.time
              )}
            </span>
            {done && match.likelyForfeit && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600">
                Forfait
              </span>
            )}
            {live && <span className="text-[9px] font-bold uppercase tracking-wide text-accent">Direct</span>}
            {upcoming && showCountdown && <span className="text-[9px] font-bold uppercase tracking-wide text-accent">Bientôt</span>}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            {match.resultB === 'FF' && (
              <span className="shrink-0 rounded border border-dim/40 px-0.5 text-[8px] font-bold text-dim">FF</span>
            )}
            <span className={`truncate text-[12px] font-bold ${bIsLoser ? 'text-dim' : 'text-ink'}`}>
              {match.teamB.name}
            </span>
            <TeamLogo tag={match.teamB.tag} size={18} logoUrl={match.teamB.logoUrl} />
          </div>
        </div>
        <p className="-mt-1 truncate text-[10px] font-medium text-faint">
          {formatMatchPhaseDate(match.phase, match.date, {
            time: match.time,
            showTime: live || done,
          })}
        </p>
      </Link>

      {/* Streams + Prono */}
      {(((live || (upcoming && showCountdown)) && match.streams && match.streams.length > 0) || (canPredictMatch(match) && onPredict)) && (
        <div className="relative flex items-center justify-center pt-1 pb-1.5">
          {(live || (upcoming && showCountdown)) && match.streams && match.streams.length > 0 && (
            <div className="absolute left-0 flex gap-1">
              {match.streams.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.platform}
                  className="grid size-7 shrink-0 place-items-center rounded-lg border border-line bg-surface transition-transform active:scale-95"
                >
                  <PlatformIcon platform={s.platform} size={15} />
                </a>
              ))}
            </div>
          )}
          {canPredictMatch(match) && onPredict && (
            <PronoBadge match={match} onPredict={onPredict} />
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Section ─── */
const Section = ({
  title,
  live = false,
  to,
  children,
}: {
  title: string;
  live?: boolean;
  to?: string;
  children: ReactNode;
}) => (
  <div className="px-5 pt-4">
    <div className="mb-2 flex items-center justify-between">
      <h2 className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${live ? 'text-accent' : 'text-dim'}`}>
        {live && <span className="animate-live-blink size-1.5 rounded-full bg-accent" />}
        {title}
      </h2>
      {to && (
        <Link to={to} className="text-[11px] font-semibold text-faint hover:text-dim">
          Tout voir
        </Link>
      )}
    </div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
  </div>
);

/* ─── Page ─── */
export const ForYouPage = () => {
  const { data: matches = [], isPending } = useMatches();
  const { data: games } = useGames();
  const { data: teams } = useTeams();
  const { data: user } = useUser();
  const { teams: favTeams, games: favGames } = useFavorites();
  const [predicting, setPredicting] = useState<Match | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hasFavs = favTeams.length > 0 || favGames.length > 0;

  const gameTag = (m: Match) =>
    games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();
  const gameName = (m: Match) =>
    games?.find((g) => g.id === m.gameId)?.name ?? m.gameId.toUpperCase();
  const gameLogoUrl = (m: Match) =>
    games?.find((g) => g.id === m.gameId)?.logoUrl;

  const inFavTeams = (m: Match) =>
    favTeams.includes(m.teamA.id) || favTeams.includes(m.teamB.id);
  const inFavGames = (m: Match) => favGames.includes(m.gameId);

  const live = useMemo(
    () => matches.filter((m) => isMatchLive(m) && (inFavTeams(m) || inFavGames(m))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matches, favTeams, favGames],
  );

  const upcoming2h = useMemo(() => {
    const limit = now.getTime() + 2 * 3600_000;
    return matches.filter((m) => {
      if (!canPredictMatch(m, now)) return false;
      if (!inFavTeams(m) && !inFavGames(m)) return false;
      const start = matchStartDateTime(m.date, m.time).getTime();
      return start > now.getTime() && start <= limit;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, favTeams, favGames, now]);

  const upcoming = useMemo(() => {
    const limit = now.getTime() + 2 * 3600_000;
    return matches
      .filter((m) => {
        if (m.date !== todayIso || !canPredictMatch(m, now) || !inFavTeams(m)) return false;
        return matchStartDateTime(m.date, m.time).getTime() > limit;
      })
      .slice(0, UPCOMING_LIMIT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, favTeams, now]);

  const todayGamesMatches = useMemo(() => {
    const limit = now.getTime() + 2 * 3600_000;
    return matches.filter((m) => {
      if (m.date !== todayIso || !inFavGames(m)) return false;
      if (m.status === 'upcoming') {
        if (!canPredictMatch(m, now)) return false;
        return matchStartDateTime(m.date, m.time).getTime() > limit;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, favGames, now]);

  const recent = useMemo(
    () =>
      [...matches]
        .filter((m) => m.date === todayIso && m.status === 'done' && inFavTeams(m))
        .reverse()
        .slice(0, RESULTS_LIMIT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matches, favTeams],
  );

  const firstName = user?.name.split(' ')[0];

  if (isPending) return <Page><PageSpinner /></Page>;

  return (
    <Page>
      {/* Header */}
      <div className="flex items-end justify-between px-5 pt-4 pb-2">
        <div>
          <h1 className="text-[22px] font-semibold leading-none tracking-tighter text-ink">
            {firstName ? `Salut, ${firstName}` : 'Pour toi'}
          </h1>
          <p className="mt-1 text-[12px] font-medium text-dim">
            {user ? `${user.points} pts · #${user.globalRank} mondial · ` : ''}
            {formatWeekdayShort(todayIso)} {formatDayMonth(todayIso)}
          </p>
        </div>
        <Link to="/calendar" className="flex items-center gap-1 text-[12px] font-semibold text-faint hover:text-dim">
          <Icon name="calendar" size={13} />
          Agenda
        </Link>
      </div>

      <div className="h-px bg-line mx-5" />

      {/* Empty state */}
      {!hasFavs && (
        <div className="mx-5 mt-4 flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-2 px-5 py-7 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Icon name="bolt" size={24} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-[14px] font-bold text-ink">Personnalise ton feed</p>
            <p className="mt-1 max-w-56 text-[12px] leading-snug text-dim">
              Ajoute des jeux et équipes favoris pour voir leurs matchs ici.
            </p>
          </div>
          <div className="flex w-full gap-2">
            <Link to="/profile" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-2 text-[12px] font-bold text-accent">
              <Icon name="games" size={13} strokeWidth={2} />Jeux
            </Link>
            <Link to="/teams" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-2 text-[12px] font-bold text-accent">
              <Icon name="shield" size={13} strokeWidth={2} />Équipes
            </Link>
          </div>
        </div>
      )}

      {/* En direct */}
      {live.length > 0 && (
        <Section title="En direct" live>
          {live.map((m) => (
            <FeedCard key={m.id} match={m} gameTag={gameTag(m)} gameName={gameName(m)} gameLogoUrl={gameLogoUrl(m)} onPredict={setPredicting} />
          ))}
        </Section>
      )}

      {/* Prochain(s) dans les 2h — si rien en live */}
      {upcoming2h.length > 0 && (
        <Section title="Bientôt en direct" live>
          {upcoming2h.map((m) => (
            <FeedCard key={m.id} match={m} gameTag={gameTag(m)} gameName={gameName(m)} gameLogoUrl={gameLogoUrl(m)} onPredict={setPredicting} showCountdown />
          ))}
        </Section>
      )}

      {/* Prochains matchs */}
      {upcoming.length > 0 && (
        <Section title="Prochains matchs">
          {upcoming.map((m) => (
            <FeedCard key={m.id} match={m} gameTag={gameTag(m)} gameName={gameName(m)} gameLogoUrl={gameLogoUrl(m)} />
          ))}
        </Section>
      )}

      {/* Matchs du jour · Mes jeux */}
      {todayGamesMatches.length > 0 && (
        <Section title="Matchs de mes jeux">
          {todayGamesMatches.map((m) => (
            <FeedCard key={m.id} match={m} gameTag={gameTag(m)} gameName={gameName(m)} gameLogoUrl={gameLogoUrl(m)} onPredict={setPredicting} />
          ))}
        </Section>
      )}

      {/* Résultats récents */}
      {recent.length > 0 && (
        <Section title="Résultats récents" to="/calendar">
          {recent.map((m) => (
            <FeedCard key={m.id} match={m} gameTag={gameTag(m)} gameName={gameName(m)} gameLogoUrl={gameLogoUrl(m)} />
          ))}
        </Section>
      )}

      {/* Mes jeux suivis */}
      {favGames.length > 0 && games && (
        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between px-5">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-dim">Mes jeux</h2>
            <Link to="/profile" className="text-[11px] font-semibold text-faint hover:text-dim">Modifier</Link>
          </div>
          <div className="grid grid-cols-4 gap-1.5 px-5 sm:grid-cols-5">
            {favGames.map((id) => {
              const game = games.find((g) => g.id === id);
              if (!game) return null;
              return (
                <Link key={id} to={`/game/${id}`}>
                  <GameTile game={game} variant="mini" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mes équipes suivies */}
      {favTeams.length > 0 && teams && (
        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between px-5">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-dim">Mes équipes</h2>
            <Link to="/teams" className="text-[11px] font-semibold text-faint hover:text-dim">Modifier</Link>
          </div>
          <div className="flex flex-wrap gap-1.5 px-5">
            {favTeams.map((id) => {
              const team = teams.find((t) => t.id === id);
              if (!team) return null;
              return (
                <Link
                  key={id}
                  to={`/team/${id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-1.5 transition-transform active:scale-[.97]"
                >
                  <TeamLogo tag={team.tag} size={22} logoUrl={team.logoUrl} />
                  <div>
                    <p className="text-[11px] font-bold leading-none text-ink">{team.tag}</p>
                    <p className="mt-0.5 max-w-[64px] truncate text-[9px] font-medium text-dim">{team.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="pb-6" />

      <PredictSheet match={predicting} onClose={() => setPredicting(null)} />
    </Page>
  );
};
