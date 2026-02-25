import { Storage, StorageKeys } from './storage';
import { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  currency: 'INR',
  defaultTaxRate: 0,
  shopName: 'Tea & Juice Shop',
  autoPrintAfterCheckout: false,
  tokenPrintMode: 'single',
};

export const settingsService = {
  getSettings: (): Settings => {
    const settings = Storage.getObject<Settings>(StorageKeys.SETTINGS) || DEFAULT_SETTINGS;
    // Backfill newly added fields to keep older stored settings compatible
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      tokenPrintMode: settings?.tokenPrintMode || 'single',
    };
  },

  updateSettings: (updates: Partial<Settings>): Settings => {
    const current = settingsService.getSettings();
    const updated = { ...current, ...updates };
    Storage.setObject(StorageKeys.SETTINGS, updated);
    return updated;
  },
};

