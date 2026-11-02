import { ChevronDown, ChevronUp, Plus, Play, Trash2 } from 'lucide-react';
import { formatDuration } from '../../lib/format';
import type { Song, SongPhase } from '../../types/song';
import { cn } from '../ui/cn';

interface SongLibraryProps {
  songs: Song[];
  currentIndex: number;
  phase: SongPhase;
  onAddFiles: (files: FileList) => void;
  onUpdate: (id: string, patch: { title?: string; artist?: string }) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onPlay: (index: number) => void;
}

export function SongLibrary({
  songs,
  currentIndex,
  phase,
  onAddFiles,
  onUpdate,
  onRemove,
  onMove,
  onPlay,
}: SongLibraryProps) {
  const locked = phase === 'clip' || phase === 'answer';
  const remaining = songs.filter((_, index) => index > currentIndex).length;

  return (
    <section className="flex w-full min-w-0 flex-col rounded-[28px] bg-night/[0.06] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">Canciones</h2>
          <p className="text-sm text-night/60">
            {songs.length} cargadas · {remaining} por jugar
          </p>
        </div>
        <label className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-ink px-5 text-base font-bold text-paper transition-colors hover:bg-ink/85">
          <input
            type="file"
            accept="audio/*,.mp3,.m4a"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files !== null) onAddFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <Plus size={17} />
          Agregar MP3
        </label>
      </div>

      {songs.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-2xl bg-paper px-6 py-14 text-center">
          <div className="space-y-2">
            <p className="text-xl font-bold">Todavía no hay música</p>
            <p className="text-base text-night/60">
              Elige archivos MP3 o M4A. Nómbralos “Artista - Título.mp3” y el título se lee solo.
            </p>
          </div>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {songs.map((song, index) => {
            const isCurrent = index === currentIndex;
            const isPlayed = index <= currentIndex;
            const canRemove = index > currentIndex;
            const canEdit = !isCurrent || phase === 'lobby' || phase === 'ranking';

            return (
              <li
                key={song.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5',
                  isCurrent ? 'bg-sun' : 'bg-paper',
                  isPlayed && !isCurrent && 'opacity-45',
                )}
              >
                <span className="w-6 shrink-0 text-sm font-bold text-night/50">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <input
                    key={`${song.id}-title`}
                    defaultValue={song.title}
                    disabled={!canEdit}
                    aria-label={`Título de la canción ${index + 1}`}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value.length > 0 && value !== song.title) onUpdate(song.id, { title: value });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    className="w-full rounded-lg bg-transparent px-1 py-0.5 text-base font-bold text-ink outline-none focus:bg-white focus:ring-2 focus:ring-ink disabled:text-night/70"
                  />
                  <input
                    key={`${song.id}-artist`}
                    defaultValue={song.artist}
                    disabled={!canEdit}
                    placeholder="Artista"
                    aria-label={`Artista de la canción ${index + 1}`}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value !== song.artist) onUpdate(song.id, { artist: value });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    className="w-full rounded-lg bg-transparent px-1 text-sm text-night/60 outline-none placeholder:text-night/30 focus:bg-white focus:ring-2 focus:ring-ink"
                  />
                </div>

                <span className="shrink-0 text-sm text-night/50">{formatDuration(song.durationMs)}</span>

                <div className="flex shrink-0 items-center gap-0.5">
                  {isCurrent ? (
                    <span className="px-2 text-sm font-bold">Ahora</span>
                  ) : (
                    <>
                      {!isPlayed && (
                        <button
                          type="button"
                          title="Reproducir esta canción"
                          onClick={() => onPlay(index)}
                          disabled={locked}
                          className="grid size-9 place-items-center rounded-full text-night/60 transition-colors hover:bg-night/10 hover:text-ink disabled:opacity-20"
                        >
                          <Play size={15} />
                        </button>
                      )}
                      {canRemove && (
                        <>
                          <button
                            type="button"
                            title="Subir"
                            onClick={() => onMove(song.id, -1)}
                            disabled={index === currentIndex + 1}
                            className="grid size-9 place-items-center rounded-full text-night/60 transition-colors hover:bg-night/10 hover:text-ink disabled:opacity-20"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            title="Bajar"
                            onClick={() => onMove(song.id, 1)}
                            disabled={index === songs.length - 1}
                            className="grid size-9 place-items-center rounded-full text-night/60 transition-colors hover:bg-night/10 hover:text-ink disabled:opacity-20"
                          >
                            <ChevronDown size={15} />
                          </button>
                          <button
                            type="button"
                            title="Quitar de la lista"
                            onClick={() => onRemove(song.id)}
                            className="grid size-9 place-items-center rounded-full text-night/60 transition-colors hover:bg-flamingo hover:text-ink"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="pt-4 text-sm text-night/60">
        La lista vive solo en esta pestaña. Si recargas, se pierde.
      </p>
    </section>
  );
}
