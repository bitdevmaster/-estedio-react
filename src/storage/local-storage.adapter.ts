import { EncryptedStorageBase } from "./encrypted-storage-base";

/**
 * localStorage adapter with transparent AES-GCM encryption.
 * Values are encrypted before writing and decrypted on read.
 * Falls back gracefully on decryption failures (returns null).
 */
export class LocalStorageAdapter extends EncryptedStorageBase {
  constructor() {
    super(() => localStorage);
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
