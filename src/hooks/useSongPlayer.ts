import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createSongChannel, hasHostPresence } from '../lib/realtime/channel';
import { isStateBroadcast } from '../lib/realtime/protocol';
import { getSupabaseClient, MISSING_CONFIG_MESSAGE } from '../lib/supabase';
import type { RoomCode, StateBroadcast } from '../types/song';

export type PlayerConnection = 'connecting' | 'online' | 'offline' | 'unconfigured';

export interface PlayerSession {
  playerId: string;
  alias: string;
  roomCode: RoomCode;
}

const SESSION_PREFIX = 'adivinacancion.session';
const IDLE_TIMER = { endsAt: null, durationMs: null };

function storageKey(roomCode: RoomCode): string {
  return `${SESSION_PREFIX}.${roomCode}`;
}

function readSession(roomCode: RoomCode): PlayerSession | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(roomCode));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerSession>;
    if (
      typeof parsed.playerId !== 'string' ||
      typeof parsed.alias !== 'string' ||
      parsed.alias.length === 0
    ) {
      return null;
    }
    return { playerId: parsed.playerId, alias: parsed.alias, roomCode };
  } catch {
    return null;
  }
}

export function useSongPlayer(initialCode: RoomCode | null) {
  const [session, setSession] = useState<PlayerSession | null>(() =>
    initialCode === null ? null : readSession(initialCode),
  );
  const [broadcast, setBroadcast] = useState<StateBroadcast | null>(null);
  const [connection, setConnection] = useState<PlayerConnection>('connecting');
  const [hostOnline, setHostOnline] = useState(false);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSongRef = useRef<number>(0);
  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    if (session === null) {
      if (supabase === null) setConnection('unconfigured');
      return;
    }
    if (supabase === null) {
      setConnection('unconfigured');
      return;
    }

    const channel = createSongChannel(supabase, session.roomCode, session.playerId);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        if (isStateBroadcast(payload)) setBroadcast(payload);
      })
      .on('presence', { event: 'sync' }, () => setHostOnline(hasHostPresence(channel)))
      .on('presence', { event: 'join' }, () => setHostOnline(hasHostPresence(channel)))
      .on('presence', { event: 'leave' }, () => setHostOnline(hasHostPresence(channel)))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnection('online');
          void channel.track({
            playerId: session.playerId,
            alias: session.alias,
            role: 'player',
            joinedAt: Date.now(),
          });
          return;
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnection('offline');
        }
      });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [supabase, session]);

  const view = broadcast?.view ?? null;

  useEffect(() => {
    if (view === null) return;
    if (view.songNumber === 0) return;
    if (view.songNumber === lastSongRef.current) return;
    lastSongRef.current = view.songNumber;
    setMyAnswer(null);
  }, [view?.songNumber, view]);

  const join = useCallback(
    (code: RoomCode, alias: string) => {
      const trimmed = alias.trim().slice(0, 18);
      if (trimmed.length === 0) return;
      const next: PlayerSession = {
        playerId: crypto.randomUUID(),
        alias: trimmed,
        roomCode: code,
      };
      try {
        window.sessionStorage.setItem(storageKey(code), JSON.stringify(next));
      } catch {
        // Sin sessionStorage igual se puede jugar; solo se pierde al recargar.
      }
      setMyAnswer(null);
      setSession(next);
    },
    [],
  );

  const leave = useCallback(() => {
    const current = session;
    try {
      if (current !== null) window.sessionStorage.removeItem(storageKey(current.roomCode));
    } catch {
      // Ignorado a propósito.
    }
    setSession(null);
    setBroadcast(null);
    setMyAnswer(null);
  }, [session]);

  const submitAnswer = useCallback(
    (optionId: string) => {
      if (session === null || view === null) return;
      if (view.phase !== 'answer' || myAnswer !== null) return;
      void channelRef.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          playerId: session.playerId,
          alias: session.alias,
          optionId,
          at: Date.now(),
        },
      });
      setMyAnswer(optionId);
    },
    [session, view, myAnswer],
  );

  const me = view?.standings.find((entry) => entry.playerId === session?.playerId) ?? null;

  return {
    session,
    view,
    sentAt: broadcast?.sentAt ?? null,
    timer: view?.timer ?? IDLE_TIMER,
    connection,
    hostOnline,
    myAnswer,
    me,
    configError: connection === 'unconfigured' ? MISSING_CONFIG_MESSAGE : null,
    join,
    leave,
    submitAnswer,
  };
}
