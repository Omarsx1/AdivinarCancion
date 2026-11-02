import { describe, expect, it } from 'vitest';
import { POINTS_PER_HIT, rankPlayers } from './scoring';

describe('rankPlayers', () => {
  it('sorts by score, then hits, then fastest answer', () => {
    const ranked = rankPlayers([
      { playerId: '1', alias: 'Ana', score: 200, correct: 2, totalAnswerMs: 4000 },
      { playerId: '2', alias: 'Beto', score: 300, correct: 3, totalAnswerMs: 9000 },
      { playerId: '3', alias: 'Caro', score: 200, correct: 2, totalAnswerMs: 2500 },
      { playerId: '4', alias: 'Dani', score: 200, correct: 3, totalAnswerMs: 6000 },
    ]);
    expect(ranked.map((player) => player.alias)).toEqual(['Beto', 'Dani', 'Caro', 'Ana']);
  });

  it('breaks a full tie by alias and keeps the input immutable', () => {
    const input = [
      { playerId: '1', alias: 'Zoe', score: 100, correct: 1, totalAnswerMs: 1000 },
      { playerId: '2', alias: 'Ana', score: 100, correct: 1, totalAnswerMs: 1000 },
    ];
    expect(rankPlayers(input).map((player) => player.alias)).toEqual(['Ana', 'Zoe']);
    expect(input.map((player) => player.alias)).toEqual(['Zoe', 'Ana']);
  });
});

describe('POINTS_PER_HIT', () => {
  it('is 100 points per correct answer', () => {
    expect(POINTS_PER_HIT).toBe(100);
  });
});
