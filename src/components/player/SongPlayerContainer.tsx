import { useState } from 'react';
import { Check, LogOut } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { useSongPlayer } from '../../hooks/useSongPlayer';
import { isValidRoomCode, normalizeRoomCode } from '../../lib/roomCode';
import { playersLabel } from '../../lib/format';
import type { SongOption, SongView } from '../../types/song';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TimerBar } from '../ui/TimerBar';
import { cn } from '../ui/cn';
import { JoinScreen } from './JoinScreen';

interface SongPlayerContainerProps {
  initialCode: string | null;
}

const LETTERS = ['A', 'B', 'C', 'D'];

function AnswerButton({
  option,
  index,
  picked,
  disabled,
  onPick,
}: {
  option: SongOption;
  index: number;
  picked: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-pressed={picked}
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-transform active:translate-y-0.5',
        picked ? 'bg-ink text-paper' : 'bg-paper text-ink',
        disabled && !picked && 'opacity-40',
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full text-sm font-black',
          picked ? 'bg-white/15' : 'bg-night/10',
        )}
      >
        {LETTERS[index] ?? index + 1}
      </span>
      <span className="min-w-0 flex-1 text-base font-bold">{option.label}</span>
      {picked && <Check size={18} className="shrink-0 text-sun" />}
    </button>
  );
}

function RevealCard({
  view,
  myAnswer,
  score,
}: {
  view: SongView;
  myAnswer: string | null;
  score: number;
}) {
  const reveal = view.reveal;
  if (reveal === null) return null;
  const hit = myAnswer !== null && myAnswer === reveal.correctOptionId;
  const missed = myAnswer === null;

  return (
    <Card tone="flamingo" className="space-y-5 p-6">
      <p className="text-base font-bold">
        {hit ? '¡Acertaste!' : missed ? 'No respondiste' : 'Casi…'}
      </p>
      <div className="space-y-1">
        <p className="text-sm font-bold">Era</p>
        <p className="display text-3xl">{reveal.songTitle}</p>
        <p className="text-base font-bold">
          {reveal.songArtist.length > 0 ? reveal.songArtist : 'Artista desconocido'}
        </p>
      </div>
      <p className="display text-5xl">{hit ? '+100' : '+0'}</p>
      <p className="text-base font-bold">Total: {score} puntos</p>
    </Card>
  );
}

export function SongPlayerContainer({ initialCode }: SongPlayerContainerProps) {
  const [code] = useState<string | null>(() => {
    if (initialCode !== null) return initialCode;
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('room') ?? '';
    const normalized = normalizeRoomCode(raw);
    return isValidRoomCode(normalized) ? normalized : null;
  });
  const player = useSongPlayer(code);
  const timer = useCountdown(player.timer, player.sentAt);

  if (player.session === null) {
    return (
      <JoinScreen
        initialCode={code}
        configError={player.configError}
        onJoin={player.join}
      />
    );
  }

  const session = player.session;
  const view = player.view;
  const phase = view?.phase ?? 'lobby';
  const me = player.me;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 overflow-x-hidden px-4 pt-4 pb-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xl font-black">{session.alias}</p>
          <p className="text-sm font-bold text-haze">Sala {session.roomCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-sun">{me?.score ?? 0} pts</span>
          <button
            type="button"
            onClick={player.leave}
            aria-label="Salir de la sala"
            className="grid size-11 place-items-center rounded-full text-haze transition-colors hover:bg-white/10 hover:text-paper"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {player.connection !== 'online' && (
        <p className="rounded-2xl bg-sun px-4 py-3 text-sm font-bold text-ink" role="status">
          {player.connection === 'connecting' ? 'Conectando con la sala…' : 'Sin conexión. Reintentando…'}
        </p>
      )}

      {player.connection === 'online' && !player.hostOnline && (
        <p className="rounded-2xl bg-sun px-4 py-3 text-sm font-bold text-ink" role="status">
          El host no está conectado todavía.
        </p>
      )}

      <main className="flex flex-1 flex-col">
        {(view === null || phase === 'lobby') && (
          <Card tone="sun" className="space-y-6 p-6">
            <div className="space-y-2">
              <p className="text-base font-bold">Estás dentro</p>
              <h1 className="display text-4xl">Hola, {session.alias}</h1>
              <p className="text-base">
                Espera a que el host cargue la música y arranque la primera canción.
              </p>
            </div>

            <div className="rounded-2xl bg-paper px-5 py-4">
              <p className="text-sm font-bold text-night/60">Sala</p>
              <p className="poster text-4xl">{session.roomCode}</p>
            </div>

            <p className="text-base font-bold">
              {playersLabel(view?.playerCount ?? 1)} conectados
            </p>
          </Card>
        )}

        {phase === 'clip' && view !== null && (
          <Card tone="ink" className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-haze">
                Canción {view.songNumber} de {view.songTotal}
              </p>
              <p className="tabular text-3xl font-black text-sun">{timer.seconds}s</p>
            </div>
            <div className="space-y-2">
              <h2 className="display text-3xl">Escucha la pantalla</h2>
              <p className="text-base text-haze">
                El audio suena en la sala. Aquí no se reproduce nada.
              </p>
            </div>
            <TimerBar
              remainingMs={timer.remainingMs}
              progress={timer.progress}
              seconds={timer.seconds}
              urgent={timer.urgent}
              label="Clip"
            />
            <div className="space-y-2">
              {view.options.map((option, index) => (
                <AnswerButton
                  key={option.id}
                  option={option}
                  index={index}
                  picked={player.myAnswer === option.id}
                  disabled={player.myAnswer !== null}
                  onPick={() => player.submitAnswer(option.id)}
                />
              ))}
            </div>
            {player.myAnswer !== null ? (
              <p className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
                <Check size={16} className="text-sun" /> Respuesta enviada.
              </p>
            ) : (
              <p className="text-center text-sm text-haze">
                Puedes responder mientras escuchas.
              </p>
            )}
          </Card>
        )}

        {phase === 'answer' && view !== null && (
          <Card tone="sun" className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-bold">Responde</p>
              <p className="tabular text-3xl font-black">{timer.seconds}s</p>
            </div>
            <TimerBar
              remainingMs={timer.remainingMs}
              progress={timer.progress}
              seconds={timer.seconds}
              urgent={timer.urgent}
              label="Tiempo"
              ink
            />
            <div className="space-y-2">
              {view.options.map((option, index) => (
                <AnswerButton
                  key={option.id}
                  option={option}
                  index={index}
                  picked={player.myAnswer === option.id}
                  disabled={player.myAnswer !== null}
                  onPick={() => player.submitAnswer(option.id)}
                />
              ))}
            </div>
            {player.myAnswer !== null ? (
              <p className="flex items-center gap-2 rounded-2xl bg-paper px-4 py-3 text-sm font-bold text-ink">
                <Check size={16} /> Respuesta enviada. Espera la revelación.
              </p>
            ) : (
              <p className="text-center text-sm font-bold">Tienes una sola oportunidad.</p>
            )}
          </Card>
        )}

        {phase === 'reveal' && view !== null && (
          <RevealCard view={view} myAnswer={player.myAnswer} score={me?.score ?? 0} />
        )}

        {phase === 'ranking' && view !== null && (
          <Card tone="depth" className="space-y-4 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="display text-4xl">Ranking</h2>
              <p className="text-sm font-bold text-haze">
                {view.songNumber} de {view.songTotal}
              </p>
            </div>
            <ol className="space-y-2">
              {view.standings.map((entry, index) => (
                <li
                  key={entry.playerId}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3',
                    entry.playerId === session.playerId ? 'bg-sun text-ink' : 'bg-white/10',
                  )}
                >
                  <span className="w-5 text-sm font-black opacity-60">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-base font-bold">{entry.alias}</span>
                  <span className="tabular text-lg font-black">{entry.score}</span>
                </li>
              ))}
            </ol>
            <p className="text-center text-sm text-haze">
              Mira la pantalla compartida para la próxima canción.
            </p>
          </Card>
        )}

        {phase === 'podium' && view !== null && (
          <Card tone="sun" className="space-y-5 p-6">
            <div>
              <p className="text-base font-bold">Podio final</p>
              <h2 className="display text-4xl">¡Fin del juego!</h2>
            </div>
            <div className="space-y-2">
              {view.standings.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.playerId}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3',
                    entry.playerId === session.playerId ? 'bg-ink text-paper' : 'bg-paper text-ink',
                  )}
                >
                  <span className="w-5 text-sm font-black">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-base font-bold">{entry.alias}</span>
                  <span className="tabular text-lg font-black">{entry.score}</span>
                </div>
              ))}
            </div>
            <p className="text-base font-bold">Terminaste con {me?.score ?? 0} puntos.</p>
            <Button variant="dark" size="sm" onClick={player.leave}>
              Salir
            </Button>
          </Card>
        )}
      </main>

      <footer className="text-center text-sm font-bold text-haze">Adivina la canción</footer>
    </div>
  );
}
