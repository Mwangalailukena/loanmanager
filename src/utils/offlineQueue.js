// src/utils/offlineQueue.js
import { openDB } from 'idb';

const DB_NAME = 'offline-queue-db';
const STORE_NAME = 'requests';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
    },
  });
}

export async function enqueueRequest(request) {
  const db = await getDB();
  await db.add(STORE_NAME, request);
}

export async function dequeueRequest() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const requests = await store.getAll();
  if (requests.length > 0) {
    const request = requests[0];
    await store.delete(request.id);
    return request;
  }
  return null;
}

export async function getQueuedRequests() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}