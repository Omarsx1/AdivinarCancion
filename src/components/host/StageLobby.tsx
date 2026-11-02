import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { QrCode } from '../ui/QrCode';
import { playersLabel, songsLabel } from '../../lib/format';

interface StageLobbyProps {
  roomCode: string;
  playerUrl: string;
  playerCount: number;
  songsCount: number;
  canStart: boolean;
  minSongs: number;
  configError: string | null;
  audioError: string | null;
  onOpenAdmin: () => void;
  onStart: () => void;
  onDismissError: () => void;
}

export function StageLobby({
  roomCode,
  playerUrl,
  playerCount,
  songsCount,
  canStart,
  minSongs,
  configError,
  audioError,
  onOpenAdmin,
  onStart,
  onDismissError,
}: StageLobbyProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {configError !== null && (
        <p className="rounded-2xl bg-flamingo px-5 py-4 text-base font-bold text-ink">{configError}</p>
      )}
      {audioError !== null && (
        <button
          type="button"
          onClick={onDismissError}
          className="rounded-2xl bg-flamingo px-5 py-4 text-left text-base font-bold text-ink"
        >
          {audioError}
        </button>
      )}

      <Card tone="sun" className="flex min-h-0 flex-1 flex-col justify-between gap-8 p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <p className="text-base font-bold">Sala de espera</p>
            <h1 className="poster text-7xl sm:text-8xl">{roomCode}</h1>
            <p className="max-w-md text-lg">
              Abre <span className="font-bold">/song-play</span> en el celular, escribe el código y
              tu alias. El audio sale por esta pantalla.
            </p>
            <p className="text-base font-bold">
              {playersLabel(playerCount)} · {songsLabel(songsCount)}
            </p>
          </div>
          <QrCode value={playerUrl} size={216} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-md text-sm">
            Carga los MP3 desde el panel de administración. El público nunca ve la lista de
            canciones.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="lg" onClick={onOpenAdmin}>
              Cargar canciones
            </Button>
            <Button variant="dark" size="lg" onClick={onStart} disabled={!canStart}>
              Empezar
            </Button>
          </div>
        </div>
        {!canStart && (
          <p className="text-sm font-bold">
            Faltan canciones: necesitas al menos {minSongs} para armar 4 opciones por ronda.
          </p>
        )}
      </Card>
    </div>
  );
}
