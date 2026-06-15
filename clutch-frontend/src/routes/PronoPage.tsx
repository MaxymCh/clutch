import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useGroups } from '../api/queries/useGroups';
import { useMatches } from '../api/queries/useMatches';
import { useUser } from '../api/queries/useUser';
import { Page } from '../components/layout/Page';
import { Icon } from '../components/ui/Icon';
import { PageSpinner } from '../components/ui/Spinner';
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
  const { data: games } = useGames();
  const [predicting, setPredicting] = useState<Match | null>(null);

  const toPredict = (matches ?? []).filter((m) => m.status === 'upcoming');
  const tagOf = (m: Match) => games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();

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
        <Link
          to="/prono/group/new"
          className="inline-flex items-center gap-1 text-[13px] font-bold text-accent"
        >
          <Icon name="plus" size={14} strokeWidth={2.4} />
          Créer / rejoindre
        </Link>
      </div>
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-5 pb-1">
        {(groups ?? []).map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
        <Link
          to="/prono/group/new"
          className="flex w-32 shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-line-2 text-dim transition-transform active:scale-[.97]"
        >
          <span className="grid size-9.5 place-items-center rounded-xl bg-surface-2 text-ink">
            <Icon name="plus" size={19} />
          </span>
          <span className="text-center text-xs leading-tight font-bold">
            Nouveau
            <br />
            groupe
          </span>
        </Link>
      </div>

      <h2 className="px-5 pt-6 pb-3 text-base leading-none font-bold tracking-tight text-ink">
        À pronostiquer <span className="text-faint">{toPredict.length}</span>
      </h2>
      {isPending && <PageSpinner />}
      <div className="flex flex-col gap-3 px-5">
        {toPredict.map((m) => (
          <PredictCard key={m.id} match={m} gameTag={tagOf(m)} onPredict={setPredicting} />
        ))}
      </div>

      <PredictSheet match={predicting} onClose={() => setPredicting(null)} />
    </Page>
  );
};
