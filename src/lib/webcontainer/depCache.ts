import type { FileSystemTree } from "@webcontainer/api";

const DB_NAME = "nestjs-study";
const STORE = "deps";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isFileTree(value: unknown): value is FileSystemTree {
  return (
    typeof value === "object" &&
    value !== null &&
    !ArrayBuffer.isView(value) &&
    !(value instanceof ArrayBuffer)
  );
}

export async function readDepCache(key: string): Promise<FileSystemTree | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return isFileTree(value) ? value : null;
  } finally {
    db.close();
  }
}

/** Guarda la copia actual y descarta las de otros package.json. */
export async function writeDepCache(
  key: string,
  tree: FileSystemTree,
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const keys = store.getAllKeys();
      keys.onsuccess = () => {
        for (const existing of keys.result) {
          if (existing !== key) store.delete(existing);
        }
        store.put(tree, key);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
