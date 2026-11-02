import {
  artistLanguage,
  artistGender,
  detectLanguage,
  knownSongMeta,
  normalizeName,
  SONG_CATALOG,
  type CatalogEntry,
} from '../data/songCatalog';

function resolveLanguage(song: OptionSource, catalog: readonly CatalogEntry[]): 'es' | 'en' {
  if (song.artist.trim().length > 0) {
    const byArtist = catalog.find(
      (candidate) => normalizeName(candidate.artist) === normalizeName(song.artist),
    );
    if (byArtist !== undefined) return artistLanguage(byArtist.artist) ?? 'es';
  }
  const byTitle = catalog.find(
    (candidate) => normalizeName(candidate.title) === normalizeName(song.title),
  );
  if (byTitle !== undefined) return artistLanguage(byTitle.artist) ?? 'es';
  const meta = knownSongMeta(song.title);
  if (meta?.artist !== undefined) {
    const language = artistLanguage(meta.artist);
    if (language !== null) return language;
  }
  return detectLanguage(song.title);
}

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
  catalog: readonly CatalogEntry[] = SONG_CATALOG,
): SongOption[] {
  const correctLabel = songLabel(correct);
  const usedLabels = new Set([correctLabel]);
  const distractors: SongOption[] = [];

  const add = (label: string, id: string) => {
    if (usedLabels.has(label)) return;
    usedLabels.add(label);
    distractors.push({ id, label });
  };

  const normalize = normalizeName;
  const gender = artistGender(correct.artist);
  const language = resolveLanguage(correct, catalog);
  const meta = knownSongMeta(correct.title);
  const entry =
    correct.artist.trim().length > 0
      ? catalog.find((candidate) => normalize(candidate.artist) === normalize(correct.artist))
      : catalog.find((candidate) => normalize(candidate.title) === normalize(correct.title));
  const genre = entry?.genre ?? meta?.genre ?? null;

  const usedArtists = new Set([normalize(correct.artist)]);
  const takeFrom = (list: readonly CatalogEntry[]) => {
    for (const candidate of shuffle(list, random)) {
      if (distractors.length === 3) return;
      const artistKey = normalize(candidate.artist);
      if (usedArtists.has(artistKey)) continue;
      if (artistLanguage(candidate.artist) !== language) continue;
      usedArtists.add(artistKey);
      add(songLabel(candidate), `cat:${candidate.artist}:${candidate.title}`);
    }
  };

  const sameLanguage = catalog.filter(
    (candidate) => normalize(candidate.artist) !== normalize(correct.artist),
  );
  const sameGenre =
    genre === null ? sameLanguage : sameLanguage.filter((candidate) => candidate.genre === genre);

  takeFrom(
    gender === null
      ? sameGenre
      : sameGenre.filter((candidate) => artistGender(candidate.artist) === gender),
  );
  if (distractors.length < 3) takeFrom(sameGenre);
  if (distractors.length < 3) takeFrom(sameLanguage);

  if (distractors.length < 3) {
    const sameLanguagePool = pool.filter(
      (candidate) =>
        candidate.id !== correct.id && resolveLanguage(candidate, catalog) === language,
    );
    for (const candidate of shuffle(sameLanguagePool, random)) {
      const artistKey = normalize(candidate.artist);
      if (usedArtists.has(artistKey)) continue;
      usedArtists.add(artistKey);
      add(songLabel(candidate), candidate.id);
      if (distractors.length === 3) break;
    }
  }

  if (distractors.length < 3) {
    for (const candidate of shuffle(pool, random)) {
      if (candidate.id === correct.id) continue;
      add(songLabel(candidate), candidate.id);
      if (distractors.length === 3) break;
    }
  }

  return shuffle(
    [{ id: correct.id, label: correctLabel }, ...distractors.slice(0, 3)],
    random,
  );
}

