import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'tea-shop-storage:';
const cache = new Map<string, string>();
let isInitialized = false;

const scopedKey = (key: string): string => `${STORAGE_PREFIX}${key}`;

const serialize = (value: unknown): string => JSON.stringify(value);

const deserialize = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const Storage = {
  initialize: async (): Promise<void> => {
    if (isInitialized) return;

    const keys = await AsyncStorage.getAllKeys();
    const scopedKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));

    if (scopedKeys.length > 0) {
      const entries = await AsyncStorage.multiGet(scopedKeys);
      entries.forEach(([fullKey, value]) => {
        if (value !== null) {
          const shortKey = fullKey.replace(STORAGE_PREFIX, '');
          cache.set(shortKey, value);
        }
      });
    }

    isInitialized = true;
  },

  // Generic get/set/delete methods
  getString: (key: string): string | undefined => {
    return cache.get(key);
  },

  setString: (key: string, value: string): void => {
    cache.set(key, value);
    void AsyncStorage.setItem(scopedKey(key), value);
  },

  getNumber: (key: string): number | undefined => {
    const raw = cache.get(key);
    if (raw === undefined) return undefined;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  },

  setNumber: (key: string, value: number): void => {
    const raw = String(value);
    cache.set(key, raw);
    void AsyncStorage.setItem(scopedKey(key), raw);
  },

  getBoolean: (key: string): boolean | undefined => {
    const raw = cache.get(key);
    if (raw === undefined) return undefined;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return undefined;
  },

  setBoolean: (key: string, value: boolean): void => {
    const raw = String(value);
    cache.set(key, raw);
    void AsyncStorage.setItem(scopedKey(key), raw);
  },

  // Type-safe JSON helpers
  getObject: <T>(key: string): T | null => {
    const value = cache.get(key);
    if (!value) return null;
    return deserialize<T>(value);
  },

  setObject: <T>(key: string, value: T): void => {
    const raw = serialize(value);
    cache.set(key, raw);
    void AsyncStorage.setItem(scopedKey(key), raw);
  },

  // Array helpers
  getArray: <T>(key: string): T[] => {
    const value = cache.get(key);
    if (!value) return [];
    const parsed = deserialize<T[]>(value);
    return parsed || [];
  },

  setArray: <T>(key: string, value: T[]): void => {
    const raw = serialize(value);
    cache.set(key, raw);
    void AsyncStorage.setItem(scopedKey(key), raw);
  },

  // Delete
  delete: (key: string): void => {
    cache.delete(key);
    void AsyncStorage.removeItem(scopedKey(key));
  },

  // Clear all
  clearAll: (): void => {
    const keysToClear = Array.from(cache.keys());
    cache.clear();
    if (keysToClear.length > 0) {
      void AsyncStorage.multiRemove(keysToClear.map(scopedKey));
    }
  },

  // Check if key exists
  contains: (key: string): boolean => {
    return cache.has(key);
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
  PRINTER_ADDRESS: 'printerAddress',
} as const;

