/**
 * Universal Storage Module for Rakshak Third Eye Extension
 * Supports chrome.storage.local when running as a Chrome Extension,
 * and falls back to window.localStorage when running in standalone browser mode.
 */

export async function getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (result && result[key] !== undefined) {
          resolve(result[key]);
        } else {
          resolve(defaultValue);
        }
      });
    });
  } else if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch (e) {
      console.warn(`[Storage] Failed to read "${key}" from localStorage:`, e);
    }
  }
  return defaultValue;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    });
  } else if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Notify same-window listeners via custom event
      window.dispatchEvent(
        new CustomEvent('rakshak-local-storage-change', {
          detail: { key, newValue: value }
        })
      );
    } catch (e) {
      console.warn(`[Storage] Failed to write "${key}" to localStorage:`, e);
    }
  }
}

export async function removeItem(key: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => resolve());
    });
  } else if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(
        new CustomEvent('rakshak-local-storage-change', {
          detail: { key, newValue: null }
        })
      );
    } catch (e) {
      console.warn(`[Storage] Failed to remove "${key}" from localStorage:`, e);
    }
  }
}

export function addStorageListener(callback: (key: string, newValue: any) => void): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    const chromeListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local') {
        for (const [key, change] of Object.entries(changes)) {
          callback(key, change.newValue);
        }
      }
    };
    chrome.storage.onChanged.addListener(chromeListener);
    return () => chrome.storage.onChanged.removeListener(chromeListener);
  } else if (typeof window !== 'undefined') {
    const windowStorageListener = (e: StorageEvent) => {
      if (e.key && e.newValue !== null) {
        try {
          callback(e.key, JSON.parse(e.newValue));
        } catch {
          callback(e.key, e.newValue);
        }
      }
    };
    const customListener = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.key !== undefined) {
        callback(detail.key, detail.newValue);
      }
    };
    window.addEventListener('storage', windowStorageListener);
    window.addEventListener('rakshak-local-storage-change', customListener);
    return () => {
      window.removeEventListener('storage', windowStorageListener);
      window.removeEventListener('rakshak-local-storage-change', customListener);
    };
  }
  return () => {};
}
