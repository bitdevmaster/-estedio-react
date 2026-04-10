import type { IStoragePort } from "../core/ports/storage.port";
import { decrypt, encrypt } from "./crypto.util";

export abstract class EncryptedStorageBase implements IStoragePort {
  constructor(private readonly getStorage: () => Storage) {}

  private resolveStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return this.getStorage();
  }

  async getAsync(key: string): Promise<string | null> {
    const storage = this.resolveStorage();
    if (!storage) return null;

    const raw = storage.getItem(key);
    if (!raw) return null;

    try {
      return await decrypt(raw);
    } catch {
      return null;
    }
  }

  async setAsync(key: string, value: string): Promise<void> {
    const storage = this.resolveStorage();
    if (!storage) return;

    const encrypted = await encrypt(value);
    storage.setItem(key, encrypted);
  }

  remove(key: string): void {
    const storage = this.resolveStorage();
    if (!storage) return;

    storage.removeItem(key);
  }

  clear(): void {
    const storage = this.resolveStorage();
    if (!storage) return;

    storage.clear();
  }
}
