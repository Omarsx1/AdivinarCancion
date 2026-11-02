import { cn } from './cn';

export interface TimerBarProps {
  remainingMs: number | null;
  progress: number;
  seconds: number;
  urgent?: boolean;
  label?: string;
  className?: string;
  ink?: boolean;
}

export function TimerBar({
  remainingMs,
  progress,
  seconds,
  urgent = false,
  label = 'Tiempo',
  className,
  ink = false,
}: TimerBarProps) {
  const idle = remainingMs === null;
  const width = `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'flex items-baseline justify-between text-sm font-bold',
          ink ? 'text-ink' : 'text-paper',
        )}
      >
        <span>{label}</span>
        <span className={cn('tabular text-3xl', urgent && 'text-flamingo')}>
          {idle ? '--' : `${seconds}s`}
        </span>
      </div>
      <div className={cn('h-3 w-full overflow-hidden rounded-full', ink ? 'bg-ink/15' : 'bg-white/25')}>
        <div
          className={cn('h-full rounded-full', urgent ? 'bg-flamingo' : ink ? 'bg-ink' : 'bg-sun')}
          style={{ width }}
        />
      </div>
    </div>
  );
}
