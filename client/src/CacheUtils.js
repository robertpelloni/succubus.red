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

export const CUSTOM_AVATAR_KEY = 'custom_avatar.vrm';
export const CUSTOM_AVATAR_META_KEY = 'custom_avatar_meta.json';

/**
 * Validates glTF/VRM binary magic header ("glTF" = 0x46546C67 in little-endian).
 * @param {Blob|File} file
 * @returns {Promise<boolean>}
 */
export async function validateVRMBinary(file) {
  try {
    const slice = file.slice(0, 4);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);
    const magic = view.getUint32(0, true);
    // 0x46546C67 corresponds to ASCII "glTF"
    return magic === 0x46546C67;
  } catch (err) {
    console.warn("Error validating VRM binary magic header:", err);
    return false;
  }
}

export async function saveCustomAvatar(fileOrBlob) {
  await saveToCache(CUSTOM_AVATAR_KEY, fileOrBlob);

  const meta = {
    name: fileOrBlob.name || 'custom_model.vrm',
    size: fileOrBlob.size || 0,
    type: fileOrBlob.type || 'model/gltf-binary',
    lastModified: fileOrBlob.lastModified || Date.now()
  };

  try {
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    await saveToCache(CUSTOM_AVATAR_META_KEY, metaBlob);
  } catch (err) {
    console.warn("Failed to persist avatar metadata to IndexedDB:", err);
  }

  return {
    url: URL.createObjectURL(fileOrBlob),
    meta
  };
}

export async function getCustomAvatarMeta() {
  try {
    const cachedBlob = await getFromCache(CUSTOM_AVATAR_META_KEY);
    if (cachedBlob) {
      const text = await cachedBlob.text();
      return JSON.parse(text);
    }
  } catch (err) {
    console.warn("Failed to load custom avatar metadata from IndexedDB:", err);
  }
  return null;
}

export async function getCustomAvatar() {
  try {
    const cachedBlob = await getFromCache(CUSTOM_AVATAR_KEY);
    if (cachedBlob) {
      return URL.createObjectURL(cachedBlob);
    }
  } catch (err) {
    console.warn("Failed to load custom avatar from IndexedDB:", err);
  }
  return null;
}

export async function clearCustomAvatar() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(CUSTOM_AVATAR_KEY);
    store.delete(CUSTOM_AVATAR_META_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
