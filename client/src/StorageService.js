// Abstraction layer for persistence.
// Currently utilizes localStorage, but structured to easily support
// async REST API / external database calls in the future.

export const StorageService = {
  getItem: (key, defaultValue) => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;

      // Attempt to parse JSON (e.g. for chat_history arrays)
      try {
        return JSON.parse(item);
      } catch {
        // If it's just a raw string/number, return it as is
        return item;
      }
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    try {
      const valToStore = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, valToStore);
    } catch (e) {
      console.warn(`Error setting localStorage key "${key}":`, e);
    }
  },

  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Error removing localStorage key "${key}":`, e);
    }
  }
};
