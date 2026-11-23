import type { CheckLetter, Heard } from '../core';
import { apiUrl } from '../core/api';
import { readAccount } from './sync';

/** Voice feedback is turned on per device by a grown-up, and needs their account: the recording goes to our server. */
const KEY = 'jana-voice';

export function voiceOn(): boolean {
  try {
    return !!readAccount() && localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function setVoiceOn(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, 'on');
    else localStorage.removeItem(KEY);
  } catch {
    // Off without storage.
  }
}

/** Whether the server can check recordings at all. */
export async function voiceAvailable(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/voice'), { credentials: 'include' });
    return res.ok && ((await res.json()) as { available: boolean }).available;
  } catch {
    return false;
  }
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** Sends one verse the child recited; the answer says where each letter was heard. Null when it could not be checked. */
export async function checkRecitation(letters: CheckLetter[], recording: Blob): Promise<Heard[] | null> {
  try {
    const res = await fetch(apiUrl('/voice/check'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letters: letters.map((l) => ({ text: l.text, rule: l.rule ?? null, word: l.word })), audio: await toBase64(recording) })
    });
    if (!res.ok) return null;
    const { heard } = (await res.json()) as { heard: Heard[] };
    return Array.isArray(heard) && heard.length === letters.length ? heard : null;
  } catch {
    return null;
  }
}
