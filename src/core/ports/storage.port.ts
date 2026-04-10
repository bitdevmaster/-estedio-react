export interface IStoragePort {
  remove(key: string): void;
  clear(): void;
  /** Preferred API for encrypted reads. */
  getAsync(key: string): Promise<string | null>;
  /** Preferred API for encrypted writes. */
  setAsync(key: string, value: string): Promise<void>;
}
