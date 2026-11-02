import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { collectPresence, createSongChannel, HOST_PRESENCE_KEY } from '../lib/realtime/channel';
import { isAnswerPayload } from '../lib/realtime/protocol';
import { generateRoomCode } from '../lib/roomCode';
import { POINTS_PER_HIT, rankPlayers } from '../lib/scoring';
import { buildOptions, parseSongFileName } from '../lib/songs';
import { getSupabaseClient, MISSING_CONFIG_MESSAGE } from '../lib/supabase';
import type {
  AnswerRecord,
  Player,
  RevealInfo,
  RoomCode,
  Song,
  SongOption,
  SongPhase,
  SongView,
  StandingsEntry,
  TimerState,
} from '../types/song';

export const MIN_SONGS = 4;
export const DEFAULT_CLIP_SECONDS = 20;
export const DEFAULT_ANSWER_SECONDS = 5;

export type ConnectionStatus = 'connecting' | 'online' | 'offline' | 'unconfigured';

interface HostState {
  roomCode: RoomCode;
  rev: number;
  phase: SongPhase;
  songs: Song[];
  currentIndex: number;
  options: SongOption[];
  answers: Record<string, AnswerRecord>;
  players: Record<string, Player>;
  timer: TimerState;
  reveal: RevealInfo | null;
  clipMs: number;
  answerMs: number;
}

const IDLE_TIMER: TimerState = { endsAt: null, durationMs: null };
const AUDIO_FILE = /\.(mp3|m4a|mp4|aac|wav|ogg|oga|flac|opus|webm)$/i;

/** Punto de inicio aleatorio: evita intro y final, para que cada ronda suene distinta. */
function randomStartMs(song: Song, clipMs: number): number {
  const duration = song.durationMs;
  if (duration <= clipMs + 4000) return 0;
  const min = Math.round(duration * 0.2);
  const max = Math.max(
    min,
    Math.min(Math.round(duration * 0.75), duration - clipMs - 2000),
  );
  return Math.round(min + Math.random() * (max - min));
}

function toStandings(players: Record<string, Player>): StandingsEntry[] {
  return rankPlayers(Object.values(players)).map((player) => ({
    playerId: player.playerId,
    alias: player.alias,
    score: player.score,
    correct: player.correct,
  }));
}

function toView(state: HostState): SongView {
  const sentAt = Date.now();
  return {
    roomCode: state.roomCode,
    rev: state.rev,
    phase: state.phase,
    options: state.options,
    answerCount: Object.keys(state.answers).length,
    playerCount: Object.values(state.players).filter((player) => player.connected).length,
    timer: state.timer,
    songNumber: state.currentIndex + 1,
    songTotal: state.songs.length,
    standings: toStandings(state.players),
    reveal: state.reveal,
    sentAt,
  };
}

export function useSongHost(initialCode?: RoomCode) {
  const [roomCode] = useState<RoomCode>(() => initialCode ?? generateRoomCode());
  const [state, setState] = useState<HostState>(() => ({
    roomCode,
    rev: 0,
    phase: 'lobby',
    songs: [],
    currentIndex: -1,
    options: [],
    answers: {},
    players: {},
    timer: IDLE_TIMER,
    reveal: null,
    clipMs: DEFAULT_CLIP_SECONDS * 1000,
    answerMs: DEFAULT_ANSWER_SECONDS * 1000,
  }));
  const [connection, setConnection] = useState<ConnectionStatus>('connecting');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.85);

  const stateRef = useRef(state);
  stateRef.current = state;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const clipRemainingRef = useRef<number>(DEFAULT_CLIP_SECONDS * 1000);
  const answerStartedAtRef = useRef<number>(0);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (audioRef.current === null) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = volumeRef.current;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const playAudio = useCallback(() => {
    const audio = ensureAudio();
    void audio.play().catch(() => {
      setAudioError(
        'El navegador bloqueó el audio. Pulsa Reproducir otra vez (o revisa el volumen de la pestaña).',
      );
    });
  }, [ensureAudio]);

  const startSong = useCallback(
    (index: number) => {
      const current = stateRef.current;
      const song = current.songs[index];
      if (song === undefined) return;

      const options = buildOptions(song, current.songs);
      const audio = ensureAudio();
      const startAt = song.startAtMs > 0 ? song.startAtMs : randomStartMs(song, current.clipMs);
      const maxStart = Math.max(0, song.durationMs - 5000);
      const clampedStart = Math.min(startAt, maxStart);
      audio.src = song.url;
      audio.volume = volumeRef.current;
      try {
        audio.currentTime = clampedStart / 1000;
      } catch {
        audio.currentTime = 0;
      }
      setAudioError(null);
      playAudio();
      answerStartedAtRef.current = Date.now();
      clipRemainingRef.current = current.clipMs;

      setState((prev) => ({
        ...prev,
        phase: 'clip',
        currentIndex: index,
        songs: prev.songs.map((item) =>
          item.id === song.id ? { ...item, startAtMs: clampedStart } : item,
        ),
        options,
        answers: {},
        reveal: null,
        timer: { endsAt: Date.now() + prev.clipMs, durationMs: prev.clipMs },
        rev: prev.rev + 1,
      }));
    },
    [ensureAudio, playAudio],
  );

  const endClip = useCallback(() => {
    pauseAudio();
    answerStartedAtRef.current = Date.now();
    setState((prev) => {
      if (prev.phase !== 'clip') return prev;
      return {
        ...prev,
        phase: 'answer',
        timer: { endsAt: Date.now() + prev.answerMs, durationMs: prev.answerMs },
        rev: prev.rev + 1,
      };
    });
  }, [pauseAudio]);

  const revealNow = useCallback(() => {
    pauseAudio();
    setState((prev) => {
      if (prev.phase !== 'clip' && prev.phase !== 'answer') return prev;
      const song = prev.songs[prev.currentIndex];
      if (song === undefined) return prev;

      const players = { ...prev.players };
      const counts: Record<string, number> = {};
      const answers: Record<string, string> = {};

      for (const answer of Object.values(prev.answers)) {
        answers[answer.playerId] = answer.optionId;
        counts[answer.optionId] = (counts[answer.optionId] ?? 0) + 1;
        const player = players[answer.playerId];
        if (player === undefined) continue;
        const hit = answer.optionId === song.id;
        players[answer.playerId] = {
          ...player,
          score: player.score + (hit ? POINTS_PER_HIT : 0),
          correct: player.correct + (hit ? 1 : 0),
          totalAnswerMs: player.totalAnswerMs + (hit ? answer.ms : 0),
        };
      }

      return {
        ...prev,
        players,
        phase: 'reveal',
        timer: IDLE_TIMER,
        reveal: {
          correctOptionId: song.id,
          counts,
          answers,
          songTitle: song.title,
          songArtist: song.artist,
        },
        rev: prev.rev + 1,
      };
    });
  }, [pauseAudio]);

  const handleAnswer = useCallback((payload: unknown) => {
    if (!isAnswerPayload(payload)) return;
    const receivedAt = Date.now();
    setState((prev) => {
      if (prev.phase !== 'clip' && prev.phase !== 'answer') return prev;
      if (prev.answers[payload.playerId] !== undefined) return prev;
      if (!prev.options.some((option) => option.id === payload.optionId)) return prev;

      const player: Player =
        prev.players[payload.playerId] ?? {
          playerId: payload.playerId,
          alias: typeof payload.alias === 'string' && payload.alias.length > 0 ? payload.alias : 'Jugador',
          score: 0,
          correct: 0,
          totalAnswerMs: 0,
          joinedAt: receivedAt,
          connected: true,
        };

      return {
        ...prev,
        players: { ...prev.players, [player.playerId]: { ...player, connected: true } },
        answers: {
          ...prev.answers,
          [payload.playerId]: {
            playerId: payload.playerId,
            optionId: payload.optionId,
            receivedAt,
            ms: Math.max(0, receivedAt - answerStartedAtRef.current),
          },
        },
        rev: prev.rev + 1,
      };
    });
  }, []);

  const syncPlayers = useCallback(() => {
    const channel = channelRef.current;
    if (channel === null) return;
    const presences = collectPresence(channel).filter((presence) => presence.role === 'player');

    setState((prev) => {
      const players = { ...prev.players };
      const present = new Set<string>();
      let changed = false;

      for (const presence of presences) {
        present.add(presence.playerId);
        const existing = players[presence.playerId];
        if (existing === undefined) {
          players[presence.playerId] = {
            playerId: presence.playerId,
            alias: presence.alias,
            score: 0,
            correct: 0,
            totalAnswerMs: 0,
            joinedAt: presence.joinedAt,
            connected: true,
          };
          changed = true;
        } else if (!existing.connected || existing.alias !== presence.alias) {
          players[presence.playerId] = { ...existing, alias: presence.alias, connected: true };
          changed = true;
        }
      }

      for (const [playerId, player] of Object.entries(players)) {
        if (player.connected && !present.has(playerId)) {
          players[playerId] = { ...player, connected: false };
          changed = true;
        }
      }

      return changed ? { ...prev, players, rev: prev.rev + 1 } : prev;
    });
  }, []);

  useEffect(() => {
    if (supabase === null) {
      setConnection('unconfigured');
      return;
    }

    const channel = createSongChannel(supabase, roomCode, HOST_PRESENCE_KEY);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'answer' }, ({ payload }) => handleAnswer(payload))
      .on('presence', { event: 'sync' }, () => syncPlayers())
      .on('presence', { event: 'join' }, () => syncPlayers())
      .on('presence', { event: 'leave' }, () => syncPlayers())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnection('online');
          void channel.track({
            playerId: 'host',
            alias: 'Host',
            role: 'host',
            joinedAt: Date.now(),
          });
          syncPlayers();
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
  }, [supabase, roomCode, handleAnswer, syncPlayers]);

  useEffect(() => {
    const channel = channelRef.current;
    if (channel === null || connection !== 'online') return;
    const view = { ...toView(stateRef.current) };
    view.sentAt = Date.now();
    void channel.send({ type: 'broadcast', event: 'state', payload: { view, sentAt: view.sentAt } });
  }, [state, connection]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = stateRef.current;
      if (current.timer.endsAt === null) return;
      if (Date.now() < current.timer.endsAt) return;
      if (current.phase === 'clip') endClip();
      else if (current.phase === 'answer') revealNow();
    }, 200);
    return () => window.clearInterval(id);
  }, [endClip, revealNow]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (stateRef.current.songs.length === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const probeDuration = useCallback((song: Song) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.addEventListener(
      'loadedmetadata',
      () => {
        const durationMs = Number.isFinite(probe.duration) ? Math.round(probe.duration * 1000) : 0;
        if (durationMs <= 0) return;
        setState((prev) => ({
          ...prev,
          songs: prev.songs.map((item) =>
            item.id === song.id ? { ...item, durationMs: item.durationMs || durationMs } : item,
          ),
        }));
      },
      { once: true },
    );
    probe.src = song.url;
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter(
        (file) => file.type.startsWith('audio/') || AUDIO_FILE.test(file.name),
      );
      if (list.length === 0) {
        setAudioError('No encontré audio en esos archivos. Usa MP3, M4A, WAV u OGG.');
        return;
      }

      const added: Song[] = list.map((file) => {
        const parsed = parseSongFileName(file.name);
        return {
          id: crypto.randomUUID(),
          title: parsed.title.length > 0 ? parsed.title : file.name,
          artist: parsed.artist,
          fileName: file.name,
          durationMs: 0,
          startAtMs: 0,
          url: URL.createObjectURL(file),
          addedAt: Date.now(),
        };
      });

      setAudioError(null);
      setState((prev) => ({ ...prev, songs: [...prev.songs, ...added], rev: prev.rev + 1 }));
      for (const song of added) probeDuration(song);
    },
    [probeDuration],
  );

  /** Carga la carpeta public/canciones (solo si existe manifest.json). */
  const loadBundledSongs = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/canciones/manifest.json', { cache: 'no-store' });
      if (!response.ok) return 0;
      const data = (await response.json()) as { songs?: unknown };
      const names = Array.isArray(data.songs)
        ? data.songs.filter((name): name is string => typeof name === 'string' && name.length > 0)
        : [];
      const existing = new Set(stateRef.current.songs.map((song) => song.fileName));
      const added: Song[] = names
        .filter((name) => !existing.has(name))
        .map((name) => {
          const parsed = parseSongFileName(name);
          return {
            id: crypto.randomUUID(),
            title: parsed.title.length > 0 ? parsed.title : name,
            artist: parsed.artist,
            fileName: name,
            durationMs: 0,
            startAtMs: 0,
            url: `/canciones/${encodeURIComponent(name)}`,
            addedAt: Date.now(),
          };
        });
      if (added.length === 0) return 0;
      setState((prev) => ({ ...prev, songs: [...prev.songs, ...added], rev: prev.rev + 1 }));
      for (const song of added) probeDuration(song);
      return added.length;
    } catch {
      return 0;
    }
  }, [probeDuration]);

  const updateSong = useCallback((id: string, patch: { title?: string; artist?: string }) => {
    setState((prev) => ({
      ...prev,
      songs: prev.songs.map((song) => (song.id === id ? { ...song, ...patch } : song)),
      rev: prev.rev + 1,
    }));
  }, []);

  const removeSong = useCallback((id: string) => {
    const current = stateRef.current;
    const index = current.songs.findIndex((song) => song.id === id);
    if (index <= current.currentIndex) return;
    const removed = current.songs[index];
    if (removed === undefined) return;
    URL.revokeObjectURL(removed.url);
    setState((prev) => {
      const position = prev.songs.findIndex((song) => song.id === id);
      if (position <= prev.currentIndex) return prev;
      return {
        ...prev,
        songs: prev.songs.filter((song) => song.id !== id),
        rev: prev.rev + 1,
      };
    });
  }, []);

  const moveSong = useCallback((id: string, direction: -1 | 1) => {
    setState((prev) => {
      const index = prev.songs.findIndex((song) => song.id === id);
      const target = index + direction;
      if (index <= prev.currentIndex) return prev;
      if (target <= prev.currentIndex) return prev;
      if (index < 0 || target < 0 || target >= prev.songs.length) return prev;
      const songs = [...prev.songs];
      const moved = songs[index] as Song;
      songs[index] = songs[target] as Song;
      songs[target] = moved;
      return { ...prev, songs, rev: prev.rev + 1 };
    });
  }, []);

  const startGame = useCallback(() => {
    const current = stateRef.current;
    if (current.songs.length < MIN_SONGS) return;
    if (current.phase !== 'lobby' && current.phase !== 'podium') return;
    startSong(0);
  }, [startSong]);

  const playSongAt = useCallback(
    (index: number) => {
      const current = stateRef.current;
      if (current.phase === 'clip' || current.phase === 'answer') return;
      if (index <= current.currentIndex && current.phase !== 'lobby') return;
      startSong(index);
    },
    [startSong],
  );

  const pauseClip = useCallback(() => {
    pauseAudio();
    setState((prev) => {
      if (prev.phase !== 'clip' || prev.timer.endsAt === null) return prev;
      clipRemainingRef.current = Math.max(500, prev.timer.endsAt - Date.now());
      return { ...prev, timer: { endsAt: null, durationMs: prev.clipMs }, rev: prev.rev + 1 };
    });
  }, [pauseAudio]);

  const resumeClip = useCallback(() => {
    const remaining = Math.max(500, clipRemainingRef.current);
    playAudio();
    setState((prev) => {
      if (prev.phase !== 'clip') return prev;
      return { ...prev, timer: { endsAt: Date.now() + remaining, durationMs: prev.clipMs }, rev: prev.rev + 1 };
    });
  }, [playAudio]);

  const seek = useCallback((seconds: number) => {
    const current = stateRef.current;
    const song = current.songs[current.currentIndex];
    if (song === undefined) return;
    const maxSeconds = Math.max(0, song.durationMs / 1000 - 1);
    const clamped = Math.max(0, Math.min(seconds, maxSeconds));
    const audio = audioRef.current;
    if (audio !== null) audio.currentTime = clamped;
    setState((prev) => {
      if (prev.phase !== 'clip') {
        return {
          ...prev,
          songs: prev.songs.map((item) =>
            item.id === song.id ? { ...item, startAtMs: Math.round(clamped * 1000) } : item,
          ),
          rev: prev.rev + 1,
        };
      }
      return {
        ...prev,
        songs: prev.songs.map((item) =>
          item.id === song.id ? { ...item, startAtMs: Math.round(clamped * 1000) } : item,
        ),
        timer: { endsAt: Date.now() + prev.clipMs, durationMs: prev.clipMs },
        rev: prev.rev + 1,
      };
    });
  }, []);

  const showRanking = useCallback(() => {
    setState((prev) =>
      prev.phase === 'reveal'
        ? { ...prev, phase: 'ranking', timer: IDLE_TIMER, rev: prev.rev + 1 }
        : prev,
    );
  }, []);

  const nextSong = useCallback(() => {
    const current = stateRef.current;
    const next = current.currentIndex + 1;
    if (next >= current.songs.length) {
      pauseAudio();
      setState((prev) => ({ ...prev, phase: 'podium', timer: IDLE_TIMER, rev: prev.rev + 1 }));
      return;
    }
    startSong(next);
  }, [pauseAudio, startSong]);

  const resetGame = useCallback(() => {
    pauseAudio();
    setState((prev) => ({
      ...prev,
      phase: 'lobby',
      currentIndex: -1,
      options: [],
      answers: {},
      reveal: null,
      timer: IDLE_TIMER,
      players: Object.fromEntries(
        Object.entries(prev.players).map(([playerId, player]) => [
          playerId,
          { ...player, score: 0, correct: 0, totalAnswerMs: 0 },
        ]),
      ),
      rev: prev.rev + 1,
    }));
  }, [pauseAudio]);

  const setClipSeconds = useCallback((seconds: number) => {
    setState((prev) => ({ ...prev, clipMs: Math.max(5, Math.min(60, seconds)) * 1000 }));
  }, []);

  const setAnswerSeconds = useCallback((seconds: number) => {
    setState((prev) => ({ ...prev, answerMs: Math.max(5, Math.min(60, seconds)) * 1000 }));
  }, []);

  const setVolume = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setVolumeState(clamped);
    if (audioRef.current !== null) audioRef.current.volume = clamped;
  }, []);

  const standings = useMemo(() => toStandings(state.players), [state.players]);
  const connectedPlayers = useMemo(
    () => Object.values(state.players).filter((player) => player.connected),
    [state.players],
  );

  return {
    roomCode,
    connection,
    configError: connection === 'unconfigured' ? MISSING_CONFIG_MESSAGE : null,
    phase: state.phase,
    songs: state.songs,
    currentIndex: state.currentIndex,
    currentSong: state.songs[state.currentIndex] ?? null,
    options: state.options,
    answerCount: Object.keys(state.answers).length,
    players: connectedPlayers,
    standings,
    timer: state.timer,
    reveal: state.reveal,
    clipMs: state.clipMs,
    answerMs: state.answerMs,
    volume,
    audioError,
    dismissAudioError: () => setAudioError(null),
    canStart: state.songs.length >= MIN_SONGS,
    addFiles,
    loadBundledSongs,
    updateSong,
    removeSong,
    moveSong,
    startGame,
    playSongAt,
    pauseClip,
    resumeClip,
    seek,
    revealNow,
    showRanking,
    nextSong,
    resetGame,
    setClipSeconds,
    setAnswerSeconds,
    setVolume,
  };
}
