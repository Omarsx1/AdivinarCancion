export interface ParsedSongName {
  title: string;
  artist: string;
}

export interface OptionSource {
  id: string;
  title: string;
  artist: string;
}

export interface SongOption {
  id: string;
  label: string;
}

const AUDIO_EXTENSION = /\.(mp3|m4a|mp4|aac|wav|ogg|oga|flac|opus|webm)$/i;
const NAME_SEPARATOR = /\s+[-\u2013\u2014]\s+/;

/** "Artista - Título.mp3" → { artist, title }. Sin separador, todo es título. */
export function parseSongFileName(fileName: string): ParsedSongName {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const withoutExtension = base.replace(AUDIO_EXTENSION, '');
  const cleaned = withoutExtension.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(NAME_SEPARATOR).map((part) => part.trim());

  if (parts.length >= 2) {
    return {
      artist: parts[0] ?? '',
      title: parts.slice(1).join(' - '),
    };
  }

  return { artist: '', title: cleaned };
}

export function songLabel(song: { title: string; artist: string }): string {
  const artist = song.artist.trim();
  const title = song.title.trim();
  // taste-skill-ignore: el guion largo separa artista y título en la lista, no es prosa.
  return artist.length > 0 ? `${artist} — ${title}` : title;
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = result[index] as T;
    result[index] = result[swapWith] as T;
    result[swapWith] = current;
  }
  return result;
}

/**
 * Construye las 4 opciones de una ronda: la canción correcta y hasta tres
 * distractores distintos del pool cargado. Nunca repite etiqueta visible.
 */
export function buildOptions(
  correct: OptionSource,
  pool: readonly OptionSource[],
  random: () => number = Math.random,
): SongOption[] {
  const correctLabel = songLabel(correct);
  const usedLabels = new Set([correctLabel]);
  const distractors: SongOption[] = [];

  for (const candidate of shuffle(pool, random)) {
    if (candidate.id === correct.id) continue;
    const label = songLabel(candidate);
    if (usedLabels.has(label)) continue;
    usedLabels.add(label);
    distractors.push({ id: candidate.id, label });
    if (distractors.length === 3) break;
  }

  return shuffle([{ id: correct.id, label: correctLabel }, ...distractors], random);
}
