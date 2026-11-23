import { AVATARS, BANDS, listProfiles, removeProfile, saveProfile, type Profile } from '../profiles/store';
import { emptyProgress, mergeProgress, readProgressOf, writeProgressOf, type Progress } from '../tajweed/progress';

/**
 * A grown-up's account, so their children's progress follows them to another phone or tablet.
 * Signing in is optional: without it everything stays on this device, as before.
 */
interface Account {
  email: string;
  /** When this device last synced, as an ISO time. */
  syncedAt?: string;
  /** Children removed here while offline, to remove on the server next time. */
  removed?: string[];
}

const KEY = 'jana-account';

export function readAccount(): Account | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

function writeAccount(account: Account | null) {
  try {
    if (account) localStorage.setItem(KEY, JSON.stringify(account));
    else localStorage.removeItem(KEY);
  } catch {
    // Without storage the account lasts this visit only.
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(code);
  }
}

/** Calls the server; a network failure is an ApiError with status 0. */
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(0, 'offline');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'server');
  return data as T;
}

export async function signUp(email: string, password: string) {
  const me = await api<{ email: string }>('POST', '/signup', { email, password });
  writeAccount({ email: me.email });
  return sync();
}

export async function signIn(email: string, password: string) {
  const me = await api<{ email: string }>('POST', '/login', { email, password });
  writeAccount({ email: me.email });
  return sync();
}

/** Signs out on this device; the children and their progress stay here. */
export async function signOut() {
  await api('POST', '/logout').catch(() => undefined);
  writeAccount(null);
}

/** Deletes the account and everything on the server. This device keeps its own copy. */
export async function deleteAccount() {
  await api('DELETE', '/me');
  writeAccount(null);
}

/** A child removed on this device: removed on the server too, now or at the next sync. */
export function forgetChild(id: string) {
  const account = readAccount();
  if (!account) return;
  writeAccount({ ...account, removed: [...new Set([...(account.removed ?? []), id])] });
  void sync().catch(() => undefined);
}

interface ServerChild extends Profile {
  progress: Progress;
}

const validProfile = (c: ServerChild): Profile => ({
  id: c.id,
  name: c.name,
  avatar: (AVATARS as readonly string[]).includes(c.avatar) ? c.avatar : 'cat',
  band: BANDS.includes(c.band) ? c.band : 'young'
});

let running: Promise<void> | null = null;

/**
 * Puts this device and the server together: children removed anywhere are removed, children from other devices
 * are added, and each child's progress is merged and saved on both sides. Does nothing when signed out.
 * A signed-out answer from the server (the session ended) signs this device out too.
 */
export function sync(): Promise<void> {
  if (!readAccount()) return Promise.resolve();
  running ??= run().finally(() => (running = null));
  return running;
}

async function run() {
  try {
    const account = readAccount()!;
    for (const id of account.removed ?? []) await api('DELETE', `/children/${encodeURIComponent(id)}`);
    if (account.removed?.length) writeAccount({ ...account, removed: [] });

    const server = await api<{ children: ServerChild[]; removed: string[] }>('GET', '/children');
    for (const id of server.removed) if (listProfiles().some((p) => p.id === id)) removeProfile(id);

    const theirs = new Map(server.children.map((c) => [c.id, c]));
    for (const child of server.children) if (!listProfiles().some((p) => p.id === child.id)) saveProfile(validProfile(child));

    for (const kid of listProfiles()) {
      const there = theirs.get(kid.id);
      const progress = there ? mergeProgress(readProgressOf(kid.id), { ...emptyProgress(), ...there.progress }) : readProgressOf(kid.id);
      writeProgressOf(kid.id, progress);
      try {
        await api('PUT', `/children/${encodeURIComponent(kid.id)}`, { name: kid.name, avatar: kid.avatar, band: kid.band, progress });
      } catch (err) {
        // Removed on another device since we asked, or one child too many for the account: leave it on this device.
        if (err instanceof ApiError && err.status === 410) removeProfile(kid.id);
        else if (!(err instanceof ApiError && err.status === 409)) throw err;
      }
    }
    writeAccount({ ...readAccount()!, syncedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) writeAccount(null);
    throw err;
  }
}
