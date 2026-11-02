import type { ConnectionStatus } from '../../hooks/useSongHost';
import { playersLabel } from '../../lib/format';
import { Button } from '../ui/Button';

interface HostHeaderProps {
  roomCode: string;
  playerCount: number;
  connection: ConnectionStatus;
  onOpenAdmin: () => void;
}

const LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Conectando',
  online: 'En vivo',
  offline: 'Sin conexión',
  unconfigured: 'Sin Supabase',
};

export function HostHeader({ roomCode, playerCount, connection, onOpenAdmin }: HostHeaderProps) {
  const online = connection === 'online';

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex items-baseline gap-3">
        <span className="poster text-xl sm:text-2xl">Adivina la canción</span>
        <span className="flex items-center gap-1.5 text-sm font-bold text-haze">
          <span
            className={`size-2 rounded-full ${online ? 'bg-mint' : connection === 'connecting' ? 'bg-sun' : 'bg-flamingo'}`}
            aria-hidden="true"
          />
          {LABEL[connection]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm font-bold text-haze">{playersLabel(playerCount)}</span>
        <span className="poster text-3xl text-sun sm:text-4xl">Sala {roomCode}</span>
        <Button variant="secondary" size="sm" onClick={onOpenAdmin}>
          Administrar
        </Button>
      </div>
    </header>
  );
}
