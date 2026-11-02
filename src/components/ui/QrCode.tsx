import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from './cn';

export interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 208, className }: QrCodeProps) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      margin: 1,
      width: size * 2,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setSource(url);
      })
      .catch(() => {
        if (!cancelled) setSource(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      className={cn('shrink-0 rounded-2xl bg-paper p-3', className)}
      style={{ width: size, height: size }}
    >
      {source === null ? (
        <div className="size-full rounded-lg bg-night/10" />
      ) : (
        <img
          src={source}
          alt={`Código QR para unirse a la sala ${value}`}
          className="size-full rounded-lg"
        />
      )}
    </div>
  );
}
