import type { RoomCode } from '../types/song';

/** Sin I ni O para que nadie confunda el código leído en la pantalla de Teams. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;
export const ROOM_QUERY_PARAM = 'room';

export function generateRoomCode(random: () => number = Math.random): RoomCode {
  let code = '';
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    const position = Math.floor(random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET.charAt(Math.min(position, CODE_ALPHABET.length - 1));
  }
  return code;
}

export function normalizeRoomCode(input: string): RoomCode {
  return input
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export function isValidRoomCode(input: string): boolean {
  return /^[A-HJ-NP-Z]{4}$/.test(input);
}

export function buildPlayerUrl(origin: string, code: RoomCode): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/song-play?${ROOM_QUERY_PARAM}=${encodeURIComponent(code)}`;
}

export function readRoomCodeFromSearch(search: string): RoomCode | null {
  const params = new URLSearchParams(search);
  const raw = params.get(ROOM_QUERY_PARAM);
  if (raw === null) return null;
  const normalized = normalizeRoomCode(raw);
  return isValidRoomCode(normalized) ? normalized : null;
}
