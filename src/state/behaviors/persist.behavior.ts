import type { ResourceConfigMeta } from "../../core/entities/resource.entity";
import type { IStoragePort } from "../../core/ports/storage.port";

/**
 * Reads a previously persisted result from storage.
 * Returns null when persistence is disabled, the storage adapter is absent,
 * no data is stored under the key, or JSON parsing fails.
 *
 * Callers are responsible for dev-mode warnings if desired.
 */
export async function readPersistedResult<T>(
  meta: ResourceConfigMeta | undefined,
  storage: IStoragePort | undefined,
): Promise<T | null> {
  if (!meta?.persist || !meta.persistKey || !storage) return null;

  const raw = await storage.getAsync(meta.persistKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Writes a fetch result to storage when persistence is enabled.
 *
 * Safe to call from both async/await contexts and redux-saga via
 * `yield call(persistResult, meta, storage, result)`.
 *
 * No-ops when persistence is disabled or the storage adapter is absent.
 */
export async function persistResult(
  meta: ResourceConfigMeta | undefined,
  storage: IStoragePort | undefined,
  result: unknown,
): Promise<void> {
  if (!meta?.persist || !meta.persistKey || !storage) return;
  await storage.setAsync(meta.persistKey, JSON.stringify(result));
}
