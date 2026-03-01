import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

const LICENSE_STORE_KEY = 'tea_shop_license';
const MASTER_SECRET = 'TeaShopPOS2026SecureKey';

export type ActivationStatus = {
  activated: boolean;
  deviceId: string | null;
};

/**
 * Get a stable device identifier for this device.
 * Android: getAndroidId(); iOS: getIosIdForVendorAsync(); Web: fallback.
 */
export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'android') {
    try {
      const id = Application.getAndroidId();
      return id || `android-${Date.now()}`;
    } catch {
      return `android-${Date.now()}`;
    }
  }
  if (Platform.OS === 'ios') {
    try {
      const id = await Application.getIosIdForVendorAsync();
      return id || `ios-${Date.now()}`;
    } catch {
      return `ios-${Date.now()}`;
    }
  }
  return `web-${Date.now()}`;
}

/**
 * Compute the expected activation key for a device ID (same formula as generator script).
 * Format: first 12 hex chars as XXXX-XXXX-XXXX.
 */
export function computeKey(deviceId: string): string {
  const hash = CryptoJS.SHA256(deviceId + MASTER_SECRET).toString(CryptoJS.enc.Hex);
  const raw = hash.substring(0, 12).toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

/**
 * Normalize user input: strip spaces/dashes, uppercase.
 */
function normalizeKeyInput(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Validate that the user-entered key matches the key for this device.
 */
export function validateActivationKey(deviceId: string, inputKey: string): boolean {
  const normalized = normalizeKeyInput(inputKey);
  if (normalized.length < 12) return false;
  const expectedRaw = computeKey(deviceId).replace(/-/g, '');
  const inputRaw = normalized.substring(0, 12);
  return inputRaw === expectedRaw;
}

/**
 * Read activation status from SecureStore.
 * Returns { activated: false, deviceId: null } if unset or SecureStore unavailable.
 */
export async function getActivationStatus(): Promise<ActivationStatus> {
  try {
    const raw = await SecureStore.getItemAsync(LICENSE_STORE_KEY);
    if (!raw) return { activated: false, deviceId: null };
    const data = JSON.parse(raw) as { activated: boolean; deviceId: string };
    return {
      activated: !!data.activated,
      deviceId: data.deviceId || null,
    };
  } catch {
    return { activated: false, deviceId: null };
  }
}

/**
 * Save activated state and device ID to SecureStore (device binding).
 */
export async function setActivated(deviceId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      LICENSE_STORE_KEY,
      JSON.stringify({ activated: true, deviceId })
    );
  } catch (err) {
    console.warn('[Activation] SecureStore set failed', err);
    throw new Error('Could not save activation');
  }
}

/**
 * Clear activation (e.g. on device mismatch). Useful for re-activation.
 */
export async function clearActivation(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(LICENSE_STORE_KEY);
  } catch {
    // ignore
  }
}
