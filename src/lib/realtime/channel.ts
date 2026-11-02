import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { PlayerPresence, RoomCode } from '../../types/song';

/** Canal propio: nunca colisiona con el juego BreachParty. */
export const SONG_CHANNEL_PREFIX = 'breachparty-song';
export const HOST_PRESENCE_KEY = 'host';

export function songChannelName(code: RoomCode): string {
  return `${SONG_CHANNEL_PREFIX}:${code}`;
}

export function createSongChannel(
  supabase: SupabaseClient,
  code: RoomCode,
  presenceKey: string,
): RealtimeChannel {
  return supabase.channel(songChannelName(code), {
    config: {
      broadcast: { self: false, ack: false },
      presence: { key: presenceKey },
    },
  });
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toPresence(value: unknown): PlayerPresence | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const playerId = readString(record.playerId);
  const alias = readString(record.alias);
  const role = record.role;
  if (playerId === null || alias === null) return null;
  if (role !== 'host' && role !== 'player') return null;
  const joinedAt = typeof record.joinedAt === 'number' ? record.joinedAt : Date.now();
  return { playerId, alias, role, joinedAt };
}

export function collectPresence(channel: RealtimeChannel): PlayerPresence[] {
  const state = channel.presenceState<Record<string, unknown>>();
  const presences: PlayerPresence[] = [];
  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      const presence = toPresence(entry);
      if (presence !== null) presences.push(presence);
    }
  }
  return presences;
}

export function hasHostPresence(channel: RealtimeChannel): boolean {
  return collectPresence(channel).some((presence) => presence.role === 'host');
}
