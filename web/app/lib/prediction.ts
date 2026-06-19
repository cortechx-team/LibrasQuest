export const MINIMUM_PREDICTION_CONFIDENCE = 0.5;

export type PredictionLike = {
  letter: string;
  confidence: number;
};

export function normalizePredictionLetter(letter: string): string {
  return letter
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export function isConfidentPrediction(prediction: PredictionLike | null): prediction is PredictionLike {
  return Boolean(prediction && prediction.confidence >= MINIMUM_PREDICTION_CONFIDENCE);
}
