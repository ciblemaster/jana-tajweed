/** The age bands of the plan: how much text, hinting and challenge a child gets. */
export type Band = 'little' | 'young' | 'junior';
export const BANDS: Band[] = ['little', 'young', 'junior'];

export const AVATARS = ['cat', 'rabbit', 'bird', 'fish', 'turtle', 'squirrel', 'dog', 'snail'] as const;
export type Avatar = (typeof AVATARS)[number];

export interface Profile {
  id: string;
  name: string;
  avatar: Avatar;
  band: Band;
}

interface Store {
  profiles: Profile[];
  current: string | null;
}

const KEY = 'jana-profiles';
const MAX = 5;

/** Everything is kept on this device only; a browser that refuses storage still plays, without remembering. */
function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // Fall through to an empty store.
  }
  return { profiles: [], current: null };
}

/** Without storage, profiles live for this visit only. */
let memory: Store | null = null;

function load(): Store {
  return memory ?? read();
}

function write(store: Store) {
  memory = store;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    memory = null;
  } catch {
    // Kept in memory.
  }
}

export function listProfiles(): Profile[] {
  return load().profiles;
}

export function currentProfile(): Profile | null {
  const store = load();
  return store.profiles.find((p) => p.id === store.current) ?? null;
}

export function canAddProfile(): boolean {
  return load().profiles.length < MAX;
}

export function addProfile(name: string, avatar: Avatar, band: Band): Profile {
  const store = load();
  const profile: Profile = { id: Math.random().toString(36).slice(2, 10), name: name.trim().slice(0, 24), avatar, band };
  write({ profiles: [...store.profiles, profile].slice(0, MAX), current: profile.id });
  return profile;
}

export function updateProfile(id: string, change: Partial<Omit<Profile, 'id'>>) {
  const store = load();
  write({ ...store, profiles: store.profiles.map((p) => (p.id === id ? { ...p, ...change } : p)) });
}

export function chooseProfile(id: string) {
  write({ ...load(), current: id });
}

/** Adds or updates a child as another device has them (sync), keeping who is chosen on this one. */
export function saveProfile(profile: Profile) {
  const store = load();
  const known = store.profiles.some((p) => p.id === profile.id);
  if (!known && store.profiles.length >= MAX) return;
  const profiles = known ? store.profiles.map((p) => (p.id === profile.id ? profile : p)) : [...store.profiles, profile];
  write({ profiles, current: store.current ?? profile.id });
}

/** Removes a child and everything they won on this device. */
export function removeProfile(id: string) {
  const store = load();
  const profiles = store.profiles.filter((p) => p.id !== id);
  write({ profiles, current: store.current === id ? (profiles[0]?.id ?? null) : store.current });
  try {
    localStorage.removeItem(progressKey(id));
  } catch {
    // Nothing kept.
  }
}

/** Where a child's stars and levels are kept. */
export function progressKey(id: string | undefined = currentProfile()?.id): string {
  return id ? `jana-progress:${id}` : 'jana-progress';
}

/** How a band plays: the number of questions in a game, hints, and whether the recitation starts slow. */
export function bandRules(band: Band | undefined) {
  if (band === 'little') return { rounds: 3, hints: true, slow: true };
  if (band === 'junior') return { rounds: 6, hints: false, slow: false };
  return { rounds: 5, hints: true, slow: false };
}
