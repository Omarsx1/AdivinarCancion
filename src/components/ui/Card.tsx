import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type CardTone = 'depth' | 'paper' | 'sun' | 'flamingo' | 'ink' | 'night';

const TONES: Record<CardTone, string> = {
  depth: 'bg-depth text-paper',
  paper: 'bg-paper text-ink',
  sun: 'bg-sun text-ink',
  flamingo: 'bg-flamingo text-ink',
  ink: 'bg-ink text-paper',
  night: 'bg-night text-paper',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padded?: boolean;
  children: ReactNode;
}

export function Card({ tone = 'depth', padded = true, className, children, ...rest }: CardProps) {
  return (
    <div className={cn('rounded-[28px]', TONES[tone], padded && 'p-6', className)} {...rest}>
      {children}
    </div>
  );
}
