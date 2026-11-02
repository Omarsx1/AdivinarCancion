export const POINTS_PER_HIT = 100;

export interface RankablePlayer {
  playerId: string;
  alias: string;
  score: number;
  correct: number;
  totalAnswerMs: number;
}

/**
 * Ranking estable: puntos, aciertos y luego velocidad acumulada. El alias
 * desempata para que dos jugadores nunca intercambien posiciones al azar.
 */
export function rankPlayers<T extends RankablePlayer>(players: readonly T[]): T[] {
  return [...players].sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    if (left.correct !== right.correct) return right.correct - left.correct;
    if (left.totalAnswerMs !== right.totalAnswerMs) {
      return left.totalAnswerMs - right.totalAnswerMs;
    }
    return (
      left.alias.localeCompare(right.alias, 'es', { sensitivity: 'base' }) ||
      left.playerId.localeCompare(right.playerId)
    );
  });
}
