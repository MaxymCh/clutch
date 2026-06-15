import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPredictions, postPrediction } from '../../api/server';
import type { Match } from '../../types/esports';
import type { Prediction, PredictionMap } from '../../types/community';
import { PredictionsContext } from './predictionsContext';

/**
 * Pronostics de l'utilisateur, portés par l'API interne (session cookie).
 * Mise à jour optimiste : l'UI reflète le prono immédiatement, l'API
 * confirme derrière ; en cas de refus (match commencé) on resynchronise.
 */
export const PredictionsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['predictions'], queryFn: fetchPredictions });
  const predictions: PredictionMap = data ?? {};

  const mutation = useMutation({
    mutationFn: ({ matchId, prediction }: { matchId: string; prediction: Prediction }) =>
      postPrediction(matchId, prediction),
    // Refus API (409 match commencé, 422 score invalide…) → on recharge l'état serveur
    onError: () => queryClient.invalidateQueries({ queryKey: ['predictions'] }),
  });

  const setPrediction = (matchId: string, prediction: Prediction) => {
    queryClient.setQueryData<PredictionMap>(['predictions'], (prev) => ({
      ...(prev ?? {}),
      [matchId]: prediction,
    }));
    mutation.mutate({ matchId, prediction });
  };

  const predictedWinnerId = (match: Match) => {
    const pred = predictions[match.id];
    if (!pred) return null;
    return pred.pick === 'a' ? match.teamA.id : match.teamB.id;
  };

  return (
    <PredictionsContext.Provider value={{ predictions, setPrediction, predictedWinnerId }}>
      {children}
    </PredictionsContext.Provider>
  );
};
