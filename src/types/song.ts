export type RoomCode = string;

export type SongPhase = 'lobby' | 'clip' | 'answer' | 'reveal' | 'ranking' | 'podium';

export interface TimerState {
  endsAt: number | null;
  durationMs: number | null;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  durationMs: number;
  startAtMs: number;
  url: string;
  addedAt: number;
}

export interface SongOption {
  id: string;
  label: string;
}

export interface Player {
  playerId: string;
  alias: string;
  score: number;
  correct: number;
  totalAnswerMs: number;
  joinedAt: number;
  connected: boolean;
}

export interface AnswerRecord {
  playerId: string;
  optionId: string;
  receivedAt: number;
  ms: number;
}

export interface RevealInfo {
  correctOptionId: string;
  counts: Record<string, number>;
  answers: Record<string, string>;
  songTitle: string;
  songArtist: string;
}

export interface StandingsEntry {
  playerId: string;
  alias: string;
  score: number;
  correct: number;
}

export interface SongView {
  roomCode: RoomCode;
  rev: number;
  phase: SongPhase;
  options: SongOption[];
  answerCount: number;
  playerCount: number;
  timer: TimerState;
  songNumber: number;
  songTotal: number;
  standings: StandingsEntry[];
  reveal: RevealInfo | null;
  sentAt: number;
}

export interface StateBroadcast {
  view: SongView;
  sentAt: number;
}

export interface AnswerPayload {
  playerId: string;
  alias?: string;
  optionId: string;
  at: number;
}

export interface PlayerPresence {
  playerId: string;
  alias: string;
  role: 'host' | 'player';
  joinedAt: number;
}
