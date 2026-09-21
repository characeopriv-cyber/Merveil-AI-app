/**
 * Merveil Offline IndexedDB — cache threads, messages, outbox, directory snapshot.
 * Browser only. Safe no-op when indexedDB missing.
 *
 * Stores:
 *  - meta: { key, value }
 *  - threads: conversation rows by id
 *  - messages: key = `${conversationId}:${messageId}`
 *  - outbox: queued sends
 *  - directory: citizen snapshots
 */

const DB_NAME = "merveil_offline_v1";
const DB_VER = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      if (!db.objectStoreNames.contains("threads")) db.createObjectStore("threads", { keyPath: "id" });
      if (!db.objectStoreNames.contains("messages")) {
        const s = db.createObjectStore("messages", { keyPath: "cacheKey" });
        s.createIndex("by_convo", "conversation_id", { unique: false });
      }
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("directory")) db.createObjectStore("directory", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB open failed"));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("aborted"));
  });
}

export async function idbPutMeta(key, value) {
  const db = await openDb();
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put({ key, value, updated_at: Date.now() });
  await txDone(tx);
  db.close();
}

export async function idbGetMeta(key) {
  const db = await openDb();
  const tx = db.transaction("meta", "readonly");
  const req = tx.objectStore("meta").get(key);
  const row = await new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  await txDone(tx);
  db.close();
  return row?.value;
}

export async function idbSaveThreads(threads) {
  if (!Array.isArray(threads)) return;
  const db = await openDb();
  const tx = db.transaction("threads", "readwrite");
  const store = tx.objectStore("threads");
  for (const t of threads) {
    if (t?.id) store.put({ ...t, _cached_at: Date.now() });
  }
  await txDone(tx);
  db.close();
}

export async function idbLoadThreads() {
  const db = await openDb();
  const tx = db.transaction("threads", "readonly");
  const req = tx.objectStore("threads").getAll();
  const rows = await new Promise((res, rej) => {
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
  await txDone(tx);
  db.close();
  return rows.sort((a, b) => {
    const ta = new Date(a.last_message_at || a.updated_at || 0).getTime() || 0;
    const tb = new Date(b.last_message_at || b.updated_at || 0).getTime() || 0;
    return tb - ta;
  });
}

export async function idbSaveMessages(conversationId, messages) {
  if (!conversationId || !Array.isArray(messages)) return;
  const db = await openDb();
  const tx = db.transaction("messages", "readwrite");
  const store = tx.objectStore("messages");
  for (const m of messages) {
    if (!m?.id) continue;
    store.put({
      ...m,
      conversation_id: conversationId,
      cacheKey: `${conversationId}:${m.id}`,
      _cached_at: Date.now(),
    });
  }
  await txDone(tx);
  db.close();
}

export async function idbLoadMessages(conversationId, limit = 500) {
  const db = await openDb();
  const tx = db.transaction("messages", "readonly");
  const idx = tx.objectStore("messages").index("by_convo");
  const req = idx.getAll(String(conversationId));
  const rows = await new Promise((res, rej) => {
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
  await txDone(tx);
  db.close();
  return rows
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    .slice(-limit);
}

export async function idbEnqueueOutbox(item) {
  const db = await openDb();
  const tx = db.transaction("outbox", "readwrite");
  tx.objectStore("outbox").add({
    ...item,
    queuedAt: item.queuedAt || Date.now(),
    attempts: item.attempts || 0,
  });
  await txDone(tx);
  db.close();
}

export async function idbListOutbox() {
  const db = await openDb();
  const tx = db.transaction("outbox", "readonly");
  const req = tx.objectStore("outbox").getAll();
  const rows = await new Promise((res, rej) => {
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
  await txDone(tx);
  db.close();
  return rows;
}

export async function idbClearOutboxIds(ids) {
  if (!ids?.length) return;
  const db = await openDb();
  const tx = db.transaction("outbox", "readwrite");
  const store = tx.objectStore("outbox");
  for (const id of ids) store.delete(id);
  await txDone(tx);
  db.close();
}

export async function idbSaveDirectory(users) {
  if (!Array.isArray(users)) return;
  const db = await openDb();
  const tx = db.transaction("directory", "readwrite");
  const store = tx.objectStore("directory");
  for (const u of users) {
    if (u?.id) store.put({ ...u, _cached_at: Date.now() });
  }
  await txDone(tx);
  db.close();
}

export async function idbLoadDirectory() {
  const db = await openDb();
  const tx = db.transaction("directory", "readonly");
  const req = tx.objectStore("directory").getAll();
  const rows = await new Promise((res, rej) => {
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
  await txDone(tx);
  db.close();
  return rows;
}

/** Hook helpers for App — never throw to UI */
export const MerveilOffline = {
  async cacheThreads(threads) {
    try { await idbSaveThreads(threads); } catch { /* ignore */ }
  },
  async readThreads() {
    try { return await idbLoadThreads(); } catch { return []; }
  },
  async cacheMessages(conversationId, messages) {
    try { await idbSaveMessages(conversationId, messages); } catch { /* ignore */ }
  },
  async readMessages(conversationId) {
    try { return await idbLoadMessages(conversationId); } catch { return []; }
  },
  async cacheDirectory(users) {
    try { await idbSaveDirectory(users); } catch { /* ignore */ }
  },
  async readDirectory() {
    try { return await idbLoadDirectory(); } catch { return []; }
  },
  async enqueue(item) {
    try { await idbEnqueueOutbox(item); } catch { /* ignore */ }
  },
  async listOutbox() {
    try { return await idbListOutbox(); } catch { return []; }
  },
};

export default MerveilOffline;
