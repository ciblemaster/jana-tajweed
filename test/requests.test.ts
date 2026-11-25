import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addRequest, askAgain, getRequest, listRequests, mayRecord, noteRecorded, openRequest, recordingMode, removeRequest,
  requestShape, setRecordingMode, updateRequest, versesOf, wordsToWorkOn, type VerseCheck
} from '../src/parents/requests';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size; }
  };
}

const check = (ayah: number, states: VerseCheck['states']): VerseCheck => ({
  ayah, words: states.map((_, i) => `w${i}`), states, tip: { kind: 'great' }
});

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));

describe('readings a grown-up asks for', () => {
  it('keeps each child’s requests apart, newest first', () => {
    addRequest('a', { surah: 112, from: 1, to: 4, verses: 4 }, 1000);
    addRequest('a', { surah: 113, from: 1, to: 5, verses: 5, note: '  Slowly please  ' }, 2000);
    addRequest('b', { surah: 114, from: 1, to: 6, verses: 6 }, 1500);
    expect(listRequests('a').map((r) => r.surah)).toEqual([113, 112]);
    expect(listRequests('a')[0].note).toBe('Slowly please');
    expect(listRequests('b')).toHaveLength(1);
    expect(listRequests('c')).toEqual([]);
  });

  it('puts the verses in order and keeps them inside the surah', () => {
    const r = addRequest('a', { surah: 112, from: 9, to: 0, verses: 4 });
    expect([r.from, r.to]).toEqual([1, 4]);
    expect(versesOf(r)).toEqual([1, 2, 3, 4]);
    const one = addRequest('a', { surah: 112, from: 3, to: 2, verses: 4 });
    expect([one.from, one.to]).toEqual([2, 3]);
  });

  it('names a whole surah, one verse or some verses', () => {
    expect(requestShape({ from: 1, to: 4 }, 4)).toBe('askedWhole');
    expect(requestShape({ from: 2, to: 2 }, 4)).toBe('askedOne');
    expect(requestShape({ from: 1, to: 3 }, 4)).toBe('askedSome');
  });

  it('is done once every verse is recorded, and checked once every verse was heard', () => {
    let r = addRequest('a', { surah: 112, from: 2, to: 3, verses: 4 }, 1000);
    r = noteRecorded(r, 1, null, 2000); // outside the request: ignored
    expect(r.recorded).toEqual([]);
    r = noteRecorded(r, 2, check(2, ['good', 'again']), 2000);
    expect(r.recordedAt).toBeUndefined();
    expect(r.check).toBe('waiting');
    r = noteRecorded(r, 3, null, 3000); // the voice check could not hear it
    expect(r.recordedAt).toBe(3000);
    expect(r.check).toBe('waiting');
    r = noteRecorded(r, 3, check(3, ['good', 'almost', 'good']), 4000); // recorded again and heard
    expect(r.recordedAt).toBe(3000);
    expect(r.check).toBe('checked');
    expect(wordsToWorkOn(r)).toEqual([{ ayah: 2, words: ['w1'] }, { ayah: 3, words: ['w1'] }]);
  });

  it('waits for the child until recorded, and can be asked again', () => {
    const r = addRequest('a', { surah: 112, from: 1, to: 1, verses: 4 }, 1000);
    expect(openRequest('a')?.id).toBe(r.id);
    updateRequest('a', r.id, (x) => noteRecorded(x, 1, null, 2000));
    expect(openRequest('a')).toBeUndefined();
    expect(getRequest('a', r.id)?.recordedAt).toBe(2000);
    const again = askAgain('a', getRequest('a', r.id)!, 4, 3000);
    expect(openRequest('a')?.id).toBe(again.id);
    expect([again.surah, again.from, again.to, again.recorded]).toEqual([112, 1, 1, []]);
    removeRequest('a', again.id);
    expect(listRequests('a').map((x) => x.id)).toEqual([r.id]);
  });

  it('keeps at most 20, dropping the oldest finished ones and never one still open', () => {
    const first = addRequest('a', { surah: 112, from: 1, to: 1, verses: 4 }, 1);
    for (let i = 2; i <= 21; i++) {
      const r = addRequest('a', { surah: 112, from: 1, to: 1, verses: 4 }, i);
      updateRequest('a', r.id, (x) => noteRecorded(x, 1, null, i));
    }
    const kept = listRequests('a');
    expect(kept).toHaveLength(20);
    expect(kept.some((r) => r.id === first.id)).toBe(true);
  });
});

describe('when the microphone is offered', () => {
  it('only inside an open request for this surah, by default', () => {
    expect(recordingMode('a')).toBe('ask');
    expect(mayRecord('a', undefined)).toBe(false);
    expect(mayRecord(undefined, undefined)).toBe(false);
    const r = addRequest('a', { surah: 112, from: 1, to: 4, verses: 4 });
    expect(mayRecord('a', r, 112)).toBe(true);
    expect(mayRecord('a', r, 113)).toBe(false);
    expect(mayRecord('a', noteRecorded(noteRecorded(noteRecorded(noteRecorded(r, 1, null), 2, null), 3, null), 4, null), 112)).toBe(false);
  });

  it('everywhere when the grown-up allows it always, for that child only', () => {
    setRecordingMode('a', 'always');
    expect(mayRecord('a', undefined)).toBe(true);
    expect(mayRecord('a', undefined, 113)).toBe(true);
    expect(mayRecord('b', undefined)).toBe(false);
    setRecordingMode('a', 'ask');
    expect(mayRecord('a', undefined)).toBe(false);
  });

  it('stays off when storage is refused', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); }, removeItem: () => undefined });
    expect(mayRecord('a', undefined)).toBe(false);
    expect(listRequests('a')).toEqual([]);
  });
});
