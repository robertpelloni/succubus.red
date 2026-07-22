// StorageService manages synchronization between local state and the backend REST API

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

let currentToken = null;

const fetchWithRefresh = async (url, options = {}) => {
  if (!currentToken) return null;

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${currentToken}`
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        currentToken = data.token;

        headers['Authorization'] = `Bearer ${currentToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        currentToken = null;
        return null; // Force re-login
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      currentToken = null;
      return null;
    }
  }

  return response;
};

export const StorageService = {
  setToken: (token) => {
    currentToken = token;
  },

  getToken: () => {
    return currentToken;
  },

  // Fetch initial state from database
  fetchSettings: async () => {
    try {
      const response = await fetchWithRefresh(`${API_BASE_URL}/api/settings`);
      if (!response || !response.ok) {
        throw new Error(`HTTP error!`);
      }
      return await response.json();
    } catch (error) {
      console.error("StorageService fetch error:", error);
      return null;
    }
  },

  // Update backend database
  saveSettings: async (settingsData) => {
    try {
      const response = await fetchWithRefresh(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      if (!response || !response.ok) {
        throw new Error(`HTTP error!`);
      }
    } catch (error) {
      console.error("StorageService save error:", error);
    }
  }
};
