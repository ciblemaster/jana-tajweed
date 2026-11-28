/**
 * The child's recordings of a request, kept on this device so a grown-up can listen to them: one per verse, the
 * newest take only. Nothing is uploaded unless the voice check sends a verse to be heard.
 */

const DB = 'jana-recordings';
const STORE = 'takes';

const key = (requestId: string, ayah: number) => `${requestId}:${ayah}`;

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function run<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return open().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const req = act(tx.objectStore(STORE));
          tx.oncomplete = () => {
            db.close();
            resolve(req.result ?? null);
          };
          tx.onerror = tx.onabort = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      })
  );
}

/** Keeps the take of a verse, replacing the one before. */
export async function saveTake(requestId: string, ayah: number, take: Blob): Promise<void> {
  await run('readwrite', (s) => s.put(take, key(requestId, ayah)));
}

export async function loadTake(requestId: string, ayah: number): Promise<Blob | null> {
  const blob = await run<Blob | undefined>('readonly', (s) => s.get(key(requestId, ayah)));
  return blob instanceof Blob ? blob : null;
}

/** Lets go of a request's takes. */
export async function removeTakes(requestId: string, verses: number[]): Promise<void> {
  await Promise.all(verses.map((v) => run('readwrite', (s) => s.delete(key(requestId, v)))));
}
