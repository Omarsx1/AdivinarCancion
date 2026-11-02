import { describe, expect, it } from 'vitest';
import { buildOptions, parseSongFileName, songLabel } from './songs';

describe('parseSongFileName', () => {
  it('reads artist and title from "Artista - Título.mp3"', () => {
    expect(parseSongFileName('Daft Punk - One More Time.mp3')).toEqual({
      artist: 'Daft Punk',
      title: 'One More Time',
    });
  });

  it('accepts en dash and em dash separators', () => {
    expect(parseSongFileName('Soda Stereo – De Música Ligera.m4a')).toEqual({
      artist: 'Soda Stereo',
      title: 'De Música Ligera',
    });
    expect(parseSongFileName('Queen — Bohemian Rhapsody.mp3')).toEqual({
      artist: 'Queen',
      title: 'Bohemian Rhapsody',
    });
  });

  it('falls back to the file name without extension', () => {
    expect(parseSongFileName('one_more_time.mp3')).toEqual({
      artist: '',
      title: 'one more time',
    });
  });

  it('keeps hyphens that are not a separator', () => {
    expect(parseSongFileName('Blink-182 - All The Small Things.mp3')).toEqual({
      artist: 'Blink-182',
      title: 'All The Small Things',
    });
  });
});

describe('songLabel', () => {
  it('joins artist and title, and hides an empty artist', () => {
    expect(songLabel({ title: 'One More Time', artist: 'Daft Punk' })).toBe(
      'Daft Punk — One More Time',
    );
    expect(songLabel({ title: 'One More Time', artist: '  ' })).toBe('One More Time');
  });
});

describe('buildOptions', () => {
  const pool = [
    { id: 'a', title: 'Uno', artist: 'Artista A' },
    { id: 'b', title: 'Dos', artist: 'Artista B' },
    { id: 'c', title: 'Tres', artist: 'Artista C' },
    { id: 'd', title: 'Cuatro', artist: 'Artista D' },
    { id: 'e', title: 'Cinco', artist: 'Artista E' },
  ];

  it('returns the correct song plus three different distractors', () => {
    const options = buildOptions(pool[0]!, pool, () => 0.42);
    expect(options).toHaveLength(4);
    expect(options.filter((option) => option.id === 'a')).toHaveLength(1);
    expect(new Set(options.map((option) => option.id)).size).toBe(4);
    expect(options.map((option) => option.id)).toContain('a');
  });

  it('never repeats the same visible label', () => {
    const duplicated = [
      ...pool,
      { id: 'a-copy', title: 'Uno', artist: 'Artista A' },
    ];
    const options = buildOptions(pool[0]!, duplicated, () => 0.1);
    expect(new Set(options.map((option) => option.label)).size).toBe(options.length);
  });

  it('degrades gracefully when the pool is smaller than four songs', () => {
    const options = buildOptions(pool[0]!, pool.slice(0, 2), () => 0.5);
    expect(options.map((option) => option.id).sort()).toEqual(['a', 'b']);
  });

  it('places the correct song in a random position', () => {
    const positions = new Set<number>();
    for (let index = 0; index < 40; index += 1) {
      const options = buildOptions(pool[0]!, pool);
      positions.add(options.findIndex((option) => option.id === 'a'));
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});
