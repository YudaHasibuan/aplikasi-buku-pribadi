/**
 * assetStore.ts
 *
 * On WEB: expo-image-picker returns a long base64/blob URI that crashes wa-sqlite.
 * This helper offloads large asset data to browser localStorage and returns a
 * short key (e.g. "__asset_1716123456789_abc") that is safe to store in SQLite.
 *
 * On NATIVE: the file URI is short enough — we return it as-is.
 */

import { Platform } from 'react-native';

const PREFIX = '__asset_';

/** Generate a short unique key */
const makeKey = () =>
  `${PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Store an asset URI safely.
 * - On web: if the URI is too long (>2000 chars), save to localStorage and return its key.
 * - On native / short URI: return as-is.
 */
export const storeAsset = (uri: string | null | undefined): string => {
  if (!uri) return '';

  // On native, or if the URI is short enough, store directly
  if (Platform.OS !== 'web' || uri.length <= 2000) return uri;

  // Web + long URI → offload to localStorage
  try {
    const key = makeKey();
    localStorage.setItem(key, uri);
    return key;
  } catch (e) {
    // localStorage full or unavailable — drop the asset rather than crash SQLite
    console.warn('[assetStore] Could not save asset to localStorage:', e);
    return '';
  }
};

/**
 * Resolve an asset key back to its actual URI.
 * - If the value is a localStorage key (starts with PREFIX), look it up.
 * - Otherwise return the value unchanged.
 */
export const resolveAsset = (stored: string | null | undefined): string => {
  if (!stored) return '';
  if (stored.startsWith(PREFIX) && Platform.OS === 'web') {
    try {
      return localStorage.getItem(stored) ?? '';
    } catch (e) {
      return '';
    }
  }
  return stored;
};

/**
 * Delete a stored asset (call when deleting a book to free localStorage space).
 */
export const deleteAsset = (stored: string | null | undefined): void => {
  if (!stored) return;
  if (stored.startsWith(PREFIX) && Platform.OS === 'web') {
    try {
      localStorage.removeItem(stored);
    } catch (_) {}
  }
};
