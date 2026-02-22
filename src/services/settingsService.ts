import { Storage, StorageKeys } from './storage';
import { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  currency: 'INR',
  defaultTaxRate: 0,
  shopName: 'Tea & Juice Shop',
  autoPrintAfterCheckout: false,
};

export const settingsService = {
  getSettings: (): Settings => {
    const settings = Storage.getObject<Settings>(StorageKeys.SETTINGS);
    return settings || DEFAULT_SETTINGS;
  },

  updateSettings: (updates: Partial<Settings>): Settings => {
    const current = settingsService.getSettings();
    const updated = { ...current, ...updates };
    Storage.setObject(StorageKeys.SETTINGS, updated);
    return updated;
  },
};

