import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
  id: 'tea-shop-storage',
});

export const Storage = {
  // Generic get/set/delete methods
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },

  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },

  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },

  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  // Type-safe JSON helpers
  getObject: <T>(key: string): T | null => {
    const value = storage.getString(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Array helpers
  getArray: <T>(key: string): T[] => {
    const value = storage.getString(key);
    if (!value) return [];
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  },

  setArray: <T>(key: string, value: T[]): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Delete
  delete: (key: string): void => {
    storage.delete(key);
  },

  // Clear all
  clearAll: (): void => {
    storage.clearAll();
  },

  // Check if key exists
  contains: (key: string): boolean => {
    return storage.contains(key);
  },
};

// Storage keys
export const StorageKeys = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CATEGORIES: 'categories',
  CURRENT_USER: 'currentUser',
  SETTINGS: 'settings',
  TOKEN_COUNTER: 'tokenCounter',
} as const;

