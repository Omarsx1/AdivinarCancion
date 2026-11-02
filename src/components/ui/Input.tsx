import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
}

export function Input({ label, hint, error, leading, className, id, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-2">
      {label !== undefined && (
        <label htmlFor={inputId} className="block text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {leading !== undefined && (
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-night/60">
            {leading}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error !== undefined ? true : undefined}
          className={cn(
            'h-14 w-full rounded-2xl bg-night/[0.07] px-4 text-lg font-medium text-ink placeholder:text-night/40 focus:bg-paper focus:outline-none focus:ring-4 focus:ring-night/25',
            leading !== undefined && 'pl-11',
            className,
          )}
          {...rest}
        />
      </div>
      {error !== undefined ? (
        <p className="text-sm font-bold text-flamingo">{error}</p>
      ) : hint !== undefined ? (
        <p className="text-sm text-haze">{hint}</p>
      ) : null}
    </div>
  );
}
