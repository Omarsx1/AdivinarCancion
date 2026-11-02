export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '--:--';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function playersLabel(count: number): string {
  return `${count} ${count === 1 ? 'jugador' : 'jugadores'}`;
}

export function songsLabel(count: number): string {
  return `${count} ${count === 1 ? 'canción' : 'canciones'}`;
}
