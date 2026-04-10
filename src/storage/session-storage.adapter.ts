import { EncryptedStorageBase } from "./encrypted-storage-base";

/**
 * sessionStorage adapter with transparent AES-GCM encryption.
 * Data is cleared when the browser tab is closed.
 */
export class SessionStorageAdapter extends EncryptedStorageBase {
  constructor() {
    super(() => sessionStorage);
  }
}

export const sessionStorageAdapter = new SessionStorageAdapter();
