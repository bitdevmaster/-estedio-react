import { createStore, type StoreApi } from "zustand/vanilla";
import {
  initialResourceState,
  type ResourceConfig,
  type ResourceState,
} from "../../../core/entities/resource.entity";
import type { IApiPort } from "../../../core/ports/api.port";
import type { IStoragePort } from "../../../core/ports/storage.port";
import { tokenManager } from "../../../http/client/token-manager";
import { shouldSkipFetch } from "../../../state/behaviors/cache.behavior";
import {
  isTokenResponse,
  saveAuthTokens,
} from "../../../state/behaviors/auth.behavior";
import {
  persistResult,
  readPersistedResult,
} from "../../../state/behaviors/persist.behavior";

export type FetchCallback<TResponse> = (
  result: TResponse | null,
  error: unknown,
) => void;

export interface ResourceStoreState<
  TPayload,
  TResponse,
> extends ResourceState<TResponse> {
  fetch: (params: {
    payload?: TPayload;
    force?: boolean;
    callback?: FetchCallback<TResponse>;
  }) => Promise<void>;
  clearResult: () => void;
  reset: () => void;
}

/**
 * Builds a vanilla Zustand store for a single resource.
 *
 * Cross-cutting behaviours (cache-hit check, token saving, persistence)
 * are delegated to the shared state/behaviors layer — the same functions
 * used by the Redux and TanStack adapters.
 */
export function createResourceStore<TPayload, TResponse>(
  name: string,
  config: ResourceConfig<TPayload, TResponse>,
  apiPort: IApiPort,
  storage?: IStoragePort,
): StoreApi<ResourceStoreState<TPayload, TResponse>> {
  if (config.meta?.persist) {
    if (!config.meta.persistKey) {
      throw new Error(
        `[createResourceStore] Resource "${name}" has persist=true but no persistKey.`,
      );
    }

    if (!storage) {
      throw new Error(
        `[createResourceStore] Resource "${name}" has persist=true but no storage adapter was injected.`,
      );
    }
  }

  const store = createStore<ResourceStoreState<TPayload, TResponse>>(
    (set, get) => ({
      ...(initialResourceState as ResourceState<TResponse>),

      clearResult: () => {
        set({ result: null });
      },

      reset: () => {
        set({ ...(initialResourceState as ResourceState<TResponse>) });
      },

      fetch: async ({
        payload,
        force = true,
        callback,
      }: {
        payload?: TPayload;
        force?: boolean;
        callback?: FetchCallback<TResponse>;
      }) => {
        // Cache-hit check — delegates condition to shared behavior.
        if (shouldSkipFetch(force, get().result)) {
          callback?.(get().result, null);
          return;
        }

        set({ loading: true, error: null });

        try {
          const result = await apiPort.execute<TResponse>(name, payload);

          // Auth token handling — delegates to shared behavior.
          if (isTokenResponse(result)) {
            await saveAuthTokens(tokenManager, result, config.meta?.isAuthResource);
          }

          set({ result, loading: false, error: null });

          // Persistence — delegates to shared behavior.
          await persistResult(config.meta, storage, result);

          callback?.(result, null);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          set({ loading: false, error: message });
          callback?.(null, error);
        }
      },
    }),
  );

  // Hydrate store from persisted storage on initialization.
  if (config.meta?.persist && storage) {
    void readPersistedResult<TResponse>(config.meta, storage)
      .then((parsed) => {
        if (parsed !== null) {
          store.setState({ result: parsed, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[createResourceStore] Failed to read persisted state for resource "${name}".`,
            error,
          );
        }
      });
  }

  return store;
}
