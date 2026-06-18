import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGames } from '../api/queries/useGames';
import { useMatch } from '../api/queries/useMatches';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { PageSpinner } from '../components/ui/Spinner';
import { MatchHero } from '../features/matches/MatchHero';
import { MatchMaps } from '../features/matches/MatchMaps';
import { MatchStreams } from '../features/matches/MatchStreams';
import { MatchVeto } from '../features/matches/MatchVeto';
import { PredictionSummary } from '../features/prono/PredictionSummary';
import { PredictSheet } from '../features/prono/PredictSheet';
import { usePredictions } from '../features/prono/predictionsContext';
import { canPredictMatch } from '../lib/date';

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
            onPredict={canPredictMatch(match) ? () => setPredicting(true) : undefined}
          />
          <PredictionSummary match={match} />
          {match.streams && match.streams.length > 0 && <MatchStreams streams={match.streams} />}
          {match.veto && match.veto.length > 0 && (
            <MatchVeto veto={match.veto} teamA={match.teamA} teamB={match.teamB} gameId={match.gameId} />
          )}
          {match.maps && match.maps.length > 0 && (
            <MatchMaps
              maps={match.maps}
              teamA={match.teamA}
              teamB={match.teamB}
              gameId={match.gameId}
              standings={match.standings}
            />
          )}
          <PredictSheet match={predicting ? match : null} onClose={() => setPredicting(false)} />
        </>
      )}
    </Page>
  );
};
