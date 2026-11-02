import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-display font-bold transition-[transform,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun/50 disabled:cursor-not-allowed disabled:opacity-35 active:translate-y-0.5';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-sun text-ink hover:bg-[#ffe873]',
  secondary: 'bg-paper text-night hover:bg-haze',
  ghost: 'text-paper hover:bg-white/10',
  danger: 'bg-flamingo text-ink hover:bg-[#f263ab]',
  dark: 'bg-ink text-paper hover:bg-[#262626]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
  xl: 'h-16 px-9 text-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  );
}
