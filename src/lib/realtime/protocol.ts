import type { AnswerPayload, StateBroadcast } from '../../types/song';

type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  return value as UnknownRecord;
}

function hasString(record: UnknownRecord, key: string): boolean {
  return typeof record[key] === 'string';
}

function hasNumber(record: UnknownRecord, key: string): boolean {
  return typeof record[key] === 'number';
}

/** Validación mínima del snapshot: lo que la UI necesita para no romperse. */
export function isStateBroadcast(value: unknown): value is StateBroadcast {
  const record = asRecord(value);
  if (record === null) return false;
  if (!hasNumber(record, 'sentAt')) return false;
  const view = asRecord(record.view);
  if (view === null) return false;
  if (!hasString(view, 'roomCode') || !hasString(view, 'phase')) return false;
  if (!hasNumber(view, 'rev') || !hasNumber(view, 'sentAt')) return false;
  if (!Array.isArray(view.options) || !Array.isArray(view.standings)) return false;
  return true;
}

export function isAnswerPayload(value: unknown): value is AnswerPayload {
  const record = asRecord(value);
  if (record === null) return false;
  return hasString(record, 'playerId') && hasString(record, 'optionId');
}
