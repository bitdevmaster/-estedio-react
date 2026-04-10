import { createStore, type StoreApi } from "zustand/vanilla";
import {
  initialResourceState,
  type ResourceConfig,
  type ResourceState,
} from "../../../core/entities/resource.entity";
import type { IApiPort } from "../../../core/ports/api.port";
import type { IStoragePort } from "../../../core/ports/storage.port";
import { tokenManager } from "../../../http/client/token-manager";

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

type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

function isTokenResponse(value: unknown): value is TokenResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const maybeToken = value as Record<string, unknown>;
  return (
    typeof maybeToken.access_token === "string" &&
    typeof maybeToken.refresh_token === "string"
  );
}

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
        const currentState = get();
        if (force === false && currentState.result !== null) {
          callback?.(currentState.result, null);
          return;
        }

        set({ loading: true, error: null });

        try {
          const result = await apiPort.execute<TResponse>(name, payload);

          if (config.meta?.isAuthResource && isTokenResponse(result)) {
            await tokenManager.setTokens(
              result.access_token,
              result.refresh_token,
            );
          }

          set({ result, loading: false, error: null });

          if (config.meta?.persist && config.meta.persistKey && storage) {
            await storage.setAsync(
              config.meta.persistKey,
              JSON.stringify(result),
            );
          }

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

  if (config.meta?.persist && config.meta.persistKey && storage) {
    void storage
      .getAsync(config.meta.persistKey)
      .then((persisted) => {
        if (!persisted) {
          return;
        }

        try {
          const parsed = JSON.parse(persisted) as TResponse;
          store.setState({ result: parsed, loading: false, error: null });
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[createResourceStore] Failed to parse persisted state for resource "${name}".`,
              error,
            );
          }
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
