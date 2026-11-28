import type { WordState } from '../core';

/**
 * Recordings a grown-up asks for. A child records their voice only inside one of these, unless the grown-up allowed
 * recording at any time. Requests and their results are kept on this device (not synced to the account yet).
 */

/** How a verse of a recording went, word by word, when the voice check could hear it. */
export interface VerseCheck {
  ayah: number;
  /** The words as written, and how each one was said. */
  words: string[];
  states: WordState[];
  /** The one tip the child was given. */
  tip: { kind: 'great' } | { kind: 'say'; word: number } | { kind: 'hold'; word: number; counts: number };
  /** Every correction, most needed first. Missing on checks kept before corrections were listed. */
  fixes?: VerseFix[];
}

export type VerseFix = { kind: 'say' | 'almost'; word: number } | { kind: 'hold'; word: number; counts: number; hum: boolean };

export interface RecordingRequest {
  id: string;
  surah: number;
  /** The verses asked for, first and last, as numbered in the mushaf. */
  from: number;
  to: number;
  note?: string;
  askedAt: number;
  /** Set once the child recorded every verse asked for. */
  recordedAt?: number;
  /** The verses recorded so far. */
  recorded: number[];
  /** 'waiting' when the recordings could not be checked yet (no voice service), 'checked' once every verse was. */
  check: 'none' | 'waiting' | 'checked';
  checks: VerseCheck[];
}

export type RecordingMode = 'ask' | 'always';

const requestsKey = (childId: string) => `jana-requests:${childId}`;
const modeKey = (childId: string) => `jana-record-mode:${childId}`;
/** The most requests kept per child: the oldest finished ones go first. */
const MAX = 20;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not kept without storage.
  }
}

/** A child's requests, newest first. */
export function listRequests(childId: string): RecordingRequest[] {
  const all = readJson<RecordingRequest[]>(requestsKey(childId), []);
  return Array.isArray(all) ? [...all].sort((a, b) => b.askedAt - a.askedAt) : [];
}

function save(childId: string, all: RecordingRequest[]) {
  const sorted = [...all].sort((a, b) => b.askedAt - a.askedAt);
  // Too many: drop finished ones from the oldest end, never an open one.
  while (sorted.length > MAX) {
    const old = sorted.map((r) => !!r.recordedAt).lastIndexOf(true);
    if (old < 0) break;
    sorted.splice(old, 1);
  }
  writeJson(requestsKey(childId), sorted);
}

/** A grown-up asks for a surah or some of its verses. The verses are put in order and kept within the surah. */
export function addRequest(childId: string, ask: { surah: number; from: number; to: number; note?: string; verses: number }, now = Date.now()): RecordingRequest {
  const clamp = (n: number) => Math.min(Math.max(1, Math.round(n) || 1), ask.verses);
  const [from, to] = [clamp(ask.from), clamp(ask.to)].sort((a, b) => a - b);
  const note = ask.note?.trim().slice(0, 120) || undefined;
  const request: RecordingRequest = { id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, surah: ask.surah, from, to, note, askedAt: now, recorded: [], check: 'none', checks: [] };
  save(childId, [request, ...listRequests(childId)]);
  return request;
}

export function getRequest(childId: string, id: string | null | undefined): RecordingRequest | undefined {
  return id ? listRequests(childId).find((r) => r.id === id) : undefined;
}

export function updateRequest(childId: string, id: string, change: (r: RecordingRequest) => RecordingRequest) {
  save(childId, listRequests(childId).map((r) => (r.id === id ? change(r) : r)));
}

export function removeRequest(childId: string, id: string) {
  save(childId, listRequests(childId).filter((r) => r.id !== id));
}

/** The request waiting for the child: the newest one not recorded yet. */
export function openRequest(childId: string): RecordingRequest | undefined {
  return listRequests(childId).find((r) => !r.recordedAt);
}

/** The verses a request asks for, in order. */
export function versesOf(r: Pick<RecordingRequest, 'from' | 'to'>): number[] {
  return Array.from({ length: r.to - r.from + 1 }, (_, i) => r.from + i);
}

/**
 * A verse was recorded. Once all are, the request is done. A verse the voice check heard gets its result; one it
 * could not check leaves the request waiting for a check.
 */
export function noteRecorded(r: RecordingRequest, ayah: number, check: VerseCheck | null | 'skip', now = Date.now()): RecordingRequest {
  if (ayah < r.from || ayah > r.to) return r;
  const recorded = r.recorded.includes(ayah) ? r.recorded : [...r.recorded, ayah].sort((a, b) => a - b);
  const checks = check && check !== 'skip' ? [...r.checks.filter((c) => c.ayah !== ayah), check].sort((a, b) => a.ayah - b.ayah) : r.checks.filter((c) => c.ayah !== ayah);
  const all = versesOf(r).every((v) => recorded.includes(v));
  const allChecked = versesOf(r).every((v) => checks.some((c) => c.ayah === v));
  return {
    ...r,
    recorded,
    checks,
    recordedAt: all ? (r.recordedAt ?? now) : undefined,
    check: allChecked ? 'checked' : recorded.length ? 'waiting' : 'none'
  };
}

/** The same verses asked for again, as a new request. */
export function askAgain(childId: string, r: RecordingRequest, verses: number, now = Date.now()): RecordingRequest {
  return addRequest(childId, { surah: r.surah, from: r.from, to: r.to, note: r.note, verses }, now);
}

/** Words the grown-up should look at: not said well enough, per verse. */
export function wordsToWorkOn(r: RecordingRequest): { ayah: number; words: string[] }[] {
  return r.checks
    .map((c) => ({ ayah: c.ayah, words: c.words.filter((_, i) => c.states[i] !== 'good') }))
    .filter((c) => c.words.length);
}

export function recordingMode(childId: string | undefined): RecordingMode {
  if (!childId) return 'ask';
  return readJson<RecordingMode>(modeKey(childId), 'ask') === 'always' ? 'always' : 'ask';
}

export function setRecordingMode(childId: string, mode: RecordingMode) {
  writeJson(modeKey(childId), mode);
}

/**
 * Whether the microphone can be offered: always when the grown-up allowed it, otherwise only inside a request that
 * is still open, and only on the surah it asks for.
 */
export function mayRecord(childId: string | undefined, request: RecordingRequest | undefined, surah?: number): boolean {
  if (recordingMode(childId) === 'always') return true;
  return !!request && !request.recordedAt && (surah === undefined || request.surah === surah);
}

/** The request the address carries (?request=…), for the child playing now. */
export function requestFromUrl(childId: string | undefined): RecordingRequest | undefined {
  if (!childId || typeof window === 'undefined') return undefined;
  return getRequest(childId, new URLSearchParams(window.location.search).get('request'));
}

/** Everything a removed child had: their requests and the recording setting. The recordings go with removeRecordings. */
export function forgetChild(childId: string) {
  try {
    localStorage.removeItem(requestsKey(childId));
    localStorage.removeItem(modeKey(childId));
  } catch {
    // Nothing kept.
  }
}

/** How a request is named: the whole surah, one verse, or some verses. */
export function requestShape(r: Pick<RecordingRequest, 'from' | 'to'>, surahVerses: number): 'askedWhole' | 'askedOne' | 'askedSome' {
  if (r.from === 1 && r.to >= surahVerses) return 'askedWhole';
  return r.from === r.to ? 'askedOne' : 'askedSome';
}
