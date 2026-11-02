import { Volume2 } from 'lucide-react';
import type { ConnectionStatus } from '../../hooks/useSongHost';
import type { Song, SongPhase } from '../../types/song';
import { Button } from '../ui/Button';
import { QrCode } from '../ui/QrCode';
import { cn } from '../ui/cn';
import { SongLibrary } from './SongLibrary';

interface AdminPanelProps {
  roomCode: string;
  playerUrl: string;
  playerUrlIsLocal: boolean;
  playerCount: number;
  connection: ConnectionStatus;
  configError: string | null;
  audioError: string | null;
  songs: Song[];
  currentIndex: number;
  phase: SongPhase;
  canStart: boolean;
  minSongs: number;
  clipSeconds: number;
  answerSeconds: number;
  volume: number;
  onClipSeconds: (seconds: number) => void;
  onAnswerSeconds: (seconds: number) => void;
  onVolume: (volume: number) => void;
  onAddFiles: (files: FileList) => void;
  onUpdate: (id: string, patch: { title?: string; artist?: string }) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onPlay: (index: number) => void;
  onStart: () => void;
  onClose: () => void;
  onDismissError: () => void;
}

const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Conectando con Supabase',
  online: 'Sala en vivo',
  offline: 'Sin conexión',
  unconfigured: 'Supabase sin configurar',
};

function Choice({
  label,
  value,
  options,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-sm font-bold text-night/70">{label}</p>
      <div className="mt-2 flex gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={cn(
              'h-11 flex-1 rounded-full text-sm font-bold transition-colors',
              option === value ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-night/10',
            )}
          >
            {option}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminPanel({
  roomCode,
  playerUrl,
  playerUrlIsLocal,
  playerCount,
  connection,
  configError,
  audioError,
  songs,
  currentIndex,
  phase,
  canStart,
  minSongs,
  clipSeconds,
  answerSeconds,
  volume,
  onClipSeconds,
  onAnswerSeconds,
  onVolume,
  onAddFiles,
  onUpdate,
  onRemove,
  onMove,
  onPlay,
  onStart,
  onClose,
  onDismissError,
}: AdminPanelProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 p-5 sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-night">Panel de administración</p>
            <h1 className="poster text-4xl sm:text-5xl">Sala {roomCode}</h1>
          </div>
          <Button variant="dark" onClick={onClose}>
            Volver al juego
          </Button>
        </header>

        <p className="max-w-2xl text-base text-night/70">
          Carga y ordena la música aquí. Este panel no forma parte de la pantalla compartida:
          ciérralo para volver al escenario.
        </p>

        {configError !== null && (
          <p className="rounded-2xl bg-flamingo px-5 py-4 text-base font-bold">{configError}</p>
        )}
        {audioError !== null && (
          <button
            type="button"
            onClick={onDismissError}
            className="rounded-2xl bg-sun px-5 py-4 text-left text-base font-bold"
          >
            {audioError}
          </button>
        )}

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <SongLibrary
            songs={songs}
            currentIndex={currentIndex}
            phase={phase}
            onAddFiles={onAddFiles}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onMove={onMove}
            onPlay={onPlay}
          />

          <aside className="min-w-0 space-y-4">
            <section className="rounded-[28px] bg-night/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">Ajustes de ronda</h2>
                <span className="text-sm font-bold text-night/60">{CONNECTION_LABEL[connection]}</span>
              </div>
              <Choice
                label="Clip por canción"
                value={clipSeconds}
                options={[10, 15, 20, 25]}
                suffix="s"
                onChange={onClipSeconds}
              />
              <Choice
                label="Tiempo para responder"
                value={answerSeconds}
                options={[5, 8, 10]}
                suffix="s"
                onChange={onAnswerSeconds}
              />

              <label className="mt-5 block">
                <span className="flex items-center gap-2 text-sm font-bold text-night/70">
                  <Volume2 size={16} /> Volumen de la pestaña
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(event) => onVolume(Number(event.target.value))}
                  className="mt-2 h-2 w-full accent-night"
                />
              </label>

            </section>

            <section className="rounded-[28px] bg-ink p-5 text-paper">
              <h2 className="text-xl font-bold">Entrada de jugadores</h2>
              <div className="mt-3 flex items-center gap-4">
                <QrCode value={playerUrl} size={132} />
                <div className="min-w-0 space-y-1">
                  <p className="text-3xl font-black">{playerCount}</p>
                  <p className="text-sm text-haze">
                    {playerCount === 1 ? 'jugador conectado' : 'jugadores conectados'}
                  </p>
                  <p className="truncate text-sm text-haze">{playerUrl}</p>
                </div>
              </div>
            </section>

            {playerUrlIsLocal && (
              <section className="rounded-[28px] bg-flamingo p-5 text-ink">
                <h2 className="text-xl font-bold">El QR apunta a tu Mac</h2>
                <p className="mt-1 text-sm font-bold">
                  Los celulares no pueden abrir localhost. Publica la app o define
                  PUBLIC_PLAY_ORIGIN con una URL accesible y reinicia el servidor.
                </p>
              </section>
            )}

            <section className="rounded-[28px] bg-sun p-5">
              <h2 className="text-xl font-bold">Todo listo</h2>
              <p className="mt-1 text-sm">
                {songs.length} canciones cargadas · mínimo {minSongs}
              </p>
              <Button
                variant="dark"
                size="lg"
                fullWidth
                className="mt-4"
                onClick={onStart}
                disabled={!canStart}
              >
                Empezar el juego
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
