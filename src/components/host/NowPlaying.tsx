import { ArrowRight, Eye, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { Countdown } from '../../hooks/useCountdown';
import { formatDuration, formatSeconds } from '../../lib/format';
import type { RevealInfo, Song, SongOption, SongPhase, StandingsEntry } from '../../types/song';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TimerBar } from '../ui/TimerBar';
import { cn } from '../ui/cn';

const LETTERS = ['A', 'B', 'C', 'D'];

export interface NowPlayingProps {
  phase: SongPhase;
  songNumber: number;
  songTotal: number;
  options: SongOption[];
  answerCount: number;
  playerCount: number;
  timer: Countdown;
  paused: boolean;
  reveal: RevealInfo | null;
  standings: StandingsEntry[];
  currentSong: Song | null;
  audioError: string | null;
  onPause: () => void;
  onResume: () => void;
  onReveal: () => void;
  onShowRanking: () => void;
  onNextSong: () => void;
  onReset: () => void;
  onSeek: (seconds: number) => void;
  onDismissError: () => void;
}

type OptionTone = 'dark' | 'paper';

function OptionRow({
  option,
  index,
  tone,
  correct = false,
  count,
}: {
  option: SongOption;
  index: number;
  tone: OptionTone;
  correct?: boolean;
  count?: number;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3',
        correct
          ? 'bg-ink text-paper'
          : tone === 'dark'
            ? 'bg-white/10 text-paper'
            : 'bg-paper text-ink',
      )}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full text-sm font-black',
          correct ? 'bg-white/15' : tone === 'dark' ? 'bg-white/15' : 'bg-night/10',
        )}
      >
        {LETTERS[index] ?? index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-base font-bold sm:text-lg">{option.label}</span>
      {count !== undefined && (
        <span className={cn('shrink-0 text-sm font-black', correct ? 'text-sun' : 'opacity-70')}>
          {count}
        </span>
      )}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      className="rounded-2xl bg-flamingo px-5 py-3 text-left text-base font-bold text-ink"
    >
      {message}
    </button>
  );
}

function Vinyl({ spinning }: { spinning: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative grid size-32 place-items-center rounded-full bg-[#141414] sm:size-40',
        spinning && 'spin-slow',
      )}
    >
      <div className="size-12 rounded-full bg-sun sm:size-14" />
      <div className="absolute size-3 rounded-full bg-ink" />
      <div className="absolute size-24 rounded-full border border-white/15 sm:size-32" />
    </div>
  );
}

function ClipView(props: NowPlayingProps) {
  const { options, answerCount, playerCount, timer, paused, currentSong } = props;
  const isClip = props.phase === 'clip';

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {props.audioError !== null && (
        <ErrorBanner message={props.audioError} onDismiss={props.onDismissError} />
      )}

      <Card
        tone="ink"
        className="flex min-h-0 flex-1 flex-col gap-5 p-6 sm:p-8"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-haze">
            Canción {props.songNumber} de {props.songTotal}
          </p>
          <p className="text-sm font-bold text-haze">
            {isClip ? (paused ? 'Clip en pausa' : 'Suena en esta pestaña') : 'Responden en el celular'}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          {isClip ? (
            <>
              <Vinyl spinning={!paused} />
              <h2 className="display text-5xl sm:text-6xl">¿Qué canción es?</h2>
              <p className="max-w-xl text-base text-haze">
                Sube el volumen de la pestaña y compártela con audio en Teams.
              </p>
            </>
          ) : (
            <>
              <p className="display tabular text-8xl sm:text-9xl">
                {answerCount}
                <span className="text-5xl text-haze">/{playerCount}</span>
              </p>
              <h2 className="display text-4xl sm:text-5xl">Respondan en sus celulares</h2>
              <p className="text-base text-haze">
                {answerCount === 0
                  ? 'Esperando la primera respuesta…'
                  : 'Cada acierto vale 100 puntos.'}
              </p>
            </>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option, index) => (
            <OptionRow key={option.id} option={option} index={index} tone="dark" />
          ))}
        </div>

        <div className="space-y-4">
          <TimerBar
            remainingMs={timer.remainingMs}
            progress={timer.progress}
            seconds={timer.seconds}
            urgent={timer.urgent}
            label={isClip ? 'Clip' : 'Respuesta'}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isClip &&
                (paused ? (
                  <Button variant="secondary" onClick={props.onResume}>
                    <Play size={17} />
                    Reanudar
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={props.onPause}>
                    <Pause size={17} />
                    Pausar
                  </Button>
                ))}
              {isClip && (
                <Button variant="secondary" onClick={() => props.onSeek(0)}>
                  <RotateCcw size={17} />
                  Desde el inicio
                </Button>
              )}
              <Button variant="primary" onClick={props.onReveal}>
                <Eye size={17} />
                Revelar
              </Button>
            </div>

            {currentSong !== null && isClip && (
              <div className="flex min-w-[220px] flex-1 items-center gap-3 text-sm text-haze">
                <span className="tabular shrink-0">{formatSeconds(currentSong.startAtMs / 1000)}</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, Math.floor(currentSong.durationMs / 1000))}
                  step={1}
                  value={Math.floor(currentSong.startAtMs / 1000)}
                  aria-label="Mover el punto de inicio del clip"
                  onChange={(event) => props.onSeek(Number(event.target.value))}
                  className="h-2 flex-1 accent-[var(--color-sun)]"
                />
                <span className="tabular shrink-0">{formatDuration(currentSong.durationMs)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function RevealView(props: NowPlayingProps) {
  const reveal = props.reveal;
  if (reveal === null) return null;
  const answered = Object.keys(reveal.answers).length;
  const hits = reveal.counts[reveal.correctOptionId] ?? 0;

  return (
    <Card tone="flamingo" className="flex h-full min-h-0 flex-col gap-6 p-6 sm:p-8">
      <p className="text-sm font-bold">
        Canción {props.songNumber} de {props.songTotal}
      </p>

      <div className="space-y-2">
        <p className="text-base font-bold">Era…</p>
        <h2 className="display text-5xl sm:text-7xl">{reveal.songTitle}</h2>
        <p className="text-xl font-bold">
          {reveal.songArtist.length > 0 ? reveal.songArtist : 'Artista desconocido'}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {props.options.map((option, index) => (
          <OptionRow
            key={option.id}
            option={option}
            index={index}
            tone="paper"
            correct={option.id === reveal.correctOptionId}
            count={reveal.counts[option.id] ?? 0}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-bold">
          {hits} de {answered} acertaron · +100 por acierto
        </p>
        <Button variant="dark" size="lg" onClick={props.onShowRanking}>
          Ver ranking
          <ArrowRight size={18} />
        </Button>
      </div>
    </Card>
  );
}

function RankingView(props: NowPlayingProps) {
  const last = props.songNumber >= props.songTotal;

  return (
    <Card tone="depth" className="flex h-full min-h-0 flex-col gap-5 p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display text-5xl sm:text-6xl">Ranking</h2>
        <p className="text-sm font-bold text-haze">
          {props.songNumber} de {props.songTotal}
        </p>
      </div>

      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {props.standings.map((entry, index) => (
          <li
            key={entry.playerId}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3',
              index === 0 ? 'bg-sun text-ink' : 'bg-white/10 text-paper',
            )}
          >
            <span className="w-7 text-lg font-black">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-lg font-bold">{entry.alias}</span>
            <span className="text-sm font-bold opacity-70">{entry.correct} aciertos</span>
            <span className="tabular w-16 text-right text-2xl font-black">{entry.score}</span>
          </li>
        ))}
        {props.standings.length === 0 && (
          <li className="rounded-2xl bg-white/10 px-4 py-8 text-center text-lg text-haze">
            Todavía no hay puntajes.
          </li>
        )}
      </ol>

      <Button size="lg" onClick={props.onNextSong} className="w-full">
        {last ? 'Ver podio' : 'Siguiente canción'}
        <SkipForward size={18} />
      </Button>
    </Card>
  );
}

function PodiumView(props: NowPlayingProps) {
  const [first, second, third] = props.standings;
  const places = [
    { entry: second, place: 2, height: 'h-32' },
    { entry: first, place: 1, height: 'h-48' },
    { entry: third, place: 3, height: 'h-24' },
  ].filter((item): item is { entry: StandingsEntry; place: number; height: string } =>
    item.entry !== undefined,
  );

  return (
    <Card tone="sun" className="flex h-full min-h-0 flex-col justify-center gap-8 p-6 text-center sm:p-10">
      <div>
        <p className="text-base font-bold">Podio final</p>
        <h2 className="display text-5xl sm:text-6xl">¡Fin del juego!</h2>
      </div>

      <div className="flex w-full items-end justify-center gap-3">
        {places.map(({ entry, place, height }) => (
          <div key={entry.playerId} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="max-w-full truncate text-base font-bold">{entry.alias}</span>
            <div
              className={cn(
                'flex w-full flex-col items-center justify-center gap-1 rounded-[28px]',
                height,
                place === 1 ? 'bg-ink text-paper' : 'bg-paper text-ink',
              )}
            >
              <span className="display text-5xl">{place}</span>
              <span className="tabular text-sm font-bold">{entry.score} pts</span>
            </div>
          </div>
        ))}
        {places.length === 0 && <p className="text-lg font-bold">Nadie sumó puntos esta vez.</p>}
      </div>

      <Button variant="dark" onClick={props.onReset}>
        Nueva partida
      </Button>
    </Card>
  );
}

export function NowPlaying(props: NowPlayingProps) {
  if (props.phase === 'reveal') return <RevealView {...props} />;
  if (props.phase === 'ranking') return <RankingView {...props} />;
  if (props.phase === 'podium') return <PodiumView {...props} />;
  return <ClipView {...props} />;
}
