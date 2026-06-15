import { createContext, useContext } from 'react';
import type { Match } from '../../types/esports';
import type { Prediction, PredictionMap } from '../../types/community';

export type Predictions = {
  predictions: PredictionMap;
  setPrediction: (matchId: string, prediction: Prediction) => void;
  /** Id de l'équipe pronostiquée gagnante, ou null si pas de prono */
  predictedWinnerId: (match: Match) => string | null;
};

/** Contexte des pronostics (fourni par <PredictionsProvider>). */
export const PredictionsContext = createContext<Predictions | null>(null);

export const usePredictions = (): Predictions => {
  const ctx = useContext(PredictionsContext);
  if (!ctx) throw new Error('usePredictions doit être utilisé sous <PredictionsProvider>');
  return ctx;
};
