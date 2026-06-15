import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useGroups } from '../api/queries/useGroups';
import { useMatches } from '../api/queries/useMatches';
import { usePredictionHistory } from '../api/queries/useMatches';
import { useUser } from '../api/queries/useUser';
import { Page } from '../components/layout/Page';
import { Icon } from '../components/ui/Icon';
import { PageSpinner } from '../components/ui/Spinner';
import { FilterBar } from '../features/filters/FilterBar';
import { filterMatches } from '../features/filters/filterMatches';
import { useMatchFilters } from '../features/filters/useMatchFilters';
import { GroupCard } from '../features/prono/GroupCard';
import { PredictCard } from '../features/prono/PredictCard';
import { PredictSheet } from '../features/prono/PredictSheet';
import { StatCard } from '../features/prono/StatCard';
import type { Match } from '../types/esports';

/** Onglet Prono : stats, groupes, matchs à pronostiquer. */
export const PronoPage = () => {
  const { data: user } = useUser();
  const { data: groups } = useGroups();
  const { data: matches, isPending } = useMatches();
  const { data: history = [], isPending: isHistoryPending } = usePredictionHistory();
  const { data: games } = useGames();
  const { game, team } = useMatchFilters();
  const [predicting, setPredicting] = useState<Match | null>(null);

  const toPredict = useMemo(
    () => filterMatches((matches ?? []).filter((m) => m.status === 'upcoming'), game, team),
    [matches, game, team],
  );
  const filteredHistory = useMemo(
    () => history.filter(({ match }) => filterMatches([match], game, team).length > 0),
    [history, game, team],
  );
  const tagOf = (m: Match) => games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();
  const hasFilters = game !== null || team !== null;

  return (
    <Page>
      <div className="flex items-start justify-between px-5 pt-4 pb-4">
        <div>
          <h1 className="text-[24px] leading-none font-semibold tracking-tighter text-ink">
            Pronostics
          </h1>
          <p className="mt-1.5 text-[13px] leading-none font-medium text-dim">
            Devine, marque des points, grimpe
          </p>
        </div>
        <Link
          to="/prono/classement"
          className="inline-flex h-9.5 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-[13px] font-bold text-ink transition-transform active:scale-95"
        >
          <Icon name="trophy" size={16} />
          Classement
        </Link>
      </div>

      <div className="px-5">{user && <StatCard user={user} />}</div>

      <div className="flex items-baseline justify-between px-5 pt-6 pb-3">
        <h2 className="text-base leading-none font-bold tracking-tight text-ink">Tes groupes</h2>
        <div className="flex items-center gap-3">
          <Link
            to="/prono/group/create"
            className="inline-flex items-center gap-1 text-[13px] font-bold text-accent"
          >
            <Icon name="plus" size={14} strokeWidth={2.4} />
            Créer
          </Link>
          <Link
            to="/prono/group/join"
            className="inline-flex items-center gap-1 text-[13px] font-bold text-ink"
          >
            <Icon name="users" size={14} strokeWidth={2.1} />
            Rejoindre
          </Link>
        </div>
      </div>
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-5 pb-1">
        {(groups ?? []).map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
        <Link
          to="/prono/group/create"
          className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line-2 text-dim transition-transform active:scale-[.97]"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-ink">
            <Icon name="plus" size={18} />
          </span>
          <span className="text-center text-xs leading-tight font-bold">Créer</span>
        </Link>
        <Link
          to="/prono/group/join"
          className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line-2 text-dim transition-transform active:scale-[.97]"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-ink">
            <Icon name="users" size={18} />
          </span>
          <span className="text-center text-xs leading-tight font-bold">Rejoindre</span>
        </Link>
      </div>

      <h2 className="px-5 pt-6 pb-3 text-base leading-none font-bold tracking-tight text-ink">
        À pronostiquer <span className="text-faint">{toPredict.length}</span>
      </h2>
      <FilterBar />
      <div className="mt-3.5 h-0.5 bg-line" />
      {isPending && <PageSpinner />}
      {!isPending && toPredict.length === 0 && (
        <p className="px-5 py-10 text-center text-sm font-medium text-dim">
          {hasFilters
            ? 'Aucun match à pronostiquer ne correspond à ces filtres.'
            : "Aucun match à pronostiquer pour l'instant."}
        </p>
      )}
      <div className="flex flex-col gap-3 px-5 pt-3">
        {toPredict.map((m) => (
          <PredictCard key={m.id} match={m} gameTag={tagOf(m)} onPredict={setPredicting} />
        ))}
      </div>

      <div className="flex items-baseline justify-between px-5 pt-7 pb-3">
        <h2 className="text-base leading-none font-bold tracking-tight text-ink">Mes pronos passés</h2>
        <span className="text-[13px] font-bold text-dim">{filteredHistory.length}</span>
      </div>
      {isHistoryPending && <PageSpinner />}
      {!isHistoryPending && filteredHistory.length === 0 && (
        <p className="px-5 pb-6 text-sm font-medium text-dim">
          {hasFilters ? 'Aucun prono passé ne correspond à ces filtres.' : "Aucun prono terminé pour l'instant."}
        </p>
      )}
      <div className="flex flex-col gap-3 px-5 pb-6">
        {filteredHistory.map(({ match, prediction, points }) => {
          const pickedTeam = prediction.pick === 'a' ? match.teamA : match.teamB;
          const actualWinner = (match.scoreA ?? 0) > (match.scoreB ?? 0) ? match.teamA : match.teamB;
          const exact = prediction.scoreA === (match.scoreA ?? 0) && prediction.scoreB === (match.scoreB ?? 0);

          return (
            <div key={match.id} className="rounded-3xl border border-line-2 bg-surface p-4 shadow-soft">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10.5px] font-semibold tracking-wide text-dim uppercase">
                    {match.gameId.toUpperCase()} · {match.phase}
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink">
                    {match.teamA.tag} vs {match.teamB.tag}
                  </p>
                  <p className="mt-1 text-xs font-medium text-dim">
                    {match.date} · {match.time}
                  </p>
                </div>
                <div className="rounded-2xl bg-ink px-3 py-2 text-right text-white">
                  <div className="text-xs font-bold uppercase tracking-[.1em] opacity-70">Points</div>
                  <div className="text-lg font-black leading-none">{points ?? 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-cream px-3 py-2">
                  <div className="text-[11px] font-bold uppercase tracking-[.1em] text-dim">Mon prono</div>
                  <div className="mt-1 font-bold text-ink">
                    {pickedTeam.tag} {prediction.scoreA}–{prediction.scoreB}
                  </div>
                </div>
                <div className="rounded-2xl bg-cream px-3 py-2">
                  <div className="text-[11px] font-bold uppercase tracking-[.1em] text-dim">Résultat</div>
                  <div className="mt-1 font-bold text-ink">
                    {actualWinner.tag} {match.scoreA ?? 0}–{match.scoreB ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs font-semibold text-dim">
                {exact ? 'Score exact.' : pickedTeam.tag === actualWinner.tag ? 'Bon vainqueur.' : 'Mauvais vainqueur.'}
              </div>
            </div>
          );
        })}
      </div>

      <PredictSheet match={predicting} onClose={() => setPredicting(null)} />
    </Page>
  );
};
