import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatch } from '../api/queries/useMatches';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { PageSpinner } from '../components/ui/Spinner';
import { MapList } from '../features/matches/MapList';
import { MatchHero } from '../features/matches/MatchHero';
import { MatchInfoGrid } from '../features/matches/MatchInfoGrid';
import { PredictionSummary } from '../features/prono/PredictionSummary';
import { PredictSheet } from '../features/prono/PredictSheet';
import { usePredictions } from '../features/prono/predictionsContext';

/** Page détail d'un match : /match/:id */
export const MatchPage = () => {
  const { id = '' } = useParams();
  const { data: match, isPending, isError } = useMatch(id);
  const { data: games } = useGames();
  const { predictions } = usePredictions();
  const [predicting, setPredicting] = useState(false);

  const title = match ? `${match.teamA.tag} – ${match.teamB.tag}` : 'Match';
  const game = match ? games?.find((g) => g.id === match.gameId) : undefined;
  const gameName = game?.name ?? match?.gameId.toUpperCase() ?? '';

  return (
    <Page>
      <TopBar title={title} />
      {isPending && <PageSpinner />}
      {isError && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">
          Match introuvable.
        </p>
      )}
      {match && (
        <>
          <MatchHero
            match={match}
            gameName={gameName}
            gameLogoUrl={game?.logoUrl}
            hasPrediction={Boolean(predictions[match.id])}
            onPredict={() => setPredicting(true)}
          />
          <PredictionSummary match={match} />
          {match.maps && match.maps.length > 0 && <MapList maps={match.maps} />}
          <MatchInfoGrid match={match} />
          <PredictSheet match={predicting ? match : null} onClose={() => setPredicting(false)} />
        </>
      )}
    </Page>
  );
};
