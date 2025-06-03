/**
 * Browser polyfills for Node.js utilities
 * 
 * This file provides browser-compatible versions of Node.js utilities
 * that might be used in the application.
 */

// Polyfill for util.promisify
export function promisify<T>(fn: Function): (...args: any[]) => Promise<T> {
  return function(...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, result: T) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// Add more polyfills as needed