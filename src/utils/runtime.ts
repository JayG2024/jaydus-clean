/**
 * Runtime environment detection utilities
 */

export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isNode = typeof process !== 'undefined' && 
  process.versions != null && 
  process.versions.node != null;

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Safely access browser APIs
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage access failed', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage setItem failed', e);
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage removeItem failed', e);
    }
  }
};
