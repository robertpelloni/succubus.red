export const DB_NAME = 'WebWaifuCache';
export const STORE_NAME = 'assets';
export const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function getFromCache(url) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToCache(url, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, url);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function fetchAndCache(url) {
  try {
    const cachedBlob = await getFromCache(url);
    if (cachedBlob) {
      console.log(`Loaded ${url} from IndexedDB cache.`);
      return URL.createObjectURL(cachedBlob);
    }
  } catch (err) {
    console.warn(`Failed to read from cache for ${url}`, err);
  }

  console.log(`Fetching ${url} from network...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const blob = await response.blob();

  try {
    await saveToCache(url, blob);
    console.log(`Saved ${url} to IndexedDB cache.`);
  } catch (err) {
    console.warn(`Failed to save to cache for ${url}`, err);
  }

  return URL.createObjectURL(blob);
}
