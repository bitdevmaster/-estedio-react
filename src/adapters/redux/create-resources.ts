import { all } from "redux-saga/effects";
import type { EnhancedStore } from "@reduxjs/toolkit";
import type { IApiPort } from "../../core/ports/api.port";
import type { IStoragePort } from "../../core/ports/storage.port";
import type {
  ResourceConfig,
  ResourceState,
} from "../../core/entities/resource.entity";
import { ResourceAdapter } from "../../http/adapters/resource.adapter";
import {
  createResourceSlice,
  type ResourceSlice,
} from "./factory/create-resource-slice";
import { createResourceSaga } from "./factory/create-resource-saga";
import { assembleReduxStore } from "./factory/create-store";
import type { RootSagaDependencies } from "./composition";

/**
 * Options for configuring createResources factory.
 */
export interface CreateResourcesOptions extends Partial<RootSagaDependencies> {
  /** Custom API adapter. Defaults to ResourceAdapter(resources). */
  apiPort?: IApiPort;
  /** Storage adapters mapped by resource name for persistence. */
  storageByResource?: Partial<Record<string, IStoragePort>>;
}

export type RootStateFromResources<
  TResourceMap extends Record<string, ResourceConfig<unknown, unknown>>,
> = {
  [K in keyof TResourceMap & string]: ResourceState<
    TResourceMap[K] extends ResourceConfig<unknown, infer TResponse>
      ? TResponse
      : unknown
  >;
};

/**
 * Factory that wires up a Redux store for resource management.
 *
 * Generates:
 *  - Slices for each resource
 *  - rootSaga that forks all resource sagas
 *  - makeStore closure for creating store instances
 *
 * Store construction (reducer combination + saga middleware) is handled
 * internally by assembleReduxStore, keeping this function focused on
 * resource orchestration.
 *
 * @param resources Registry of resource configs
 * @param options API adapter and storage configuration
 * @returns { makeStore, slices }
 */
export function createResources<
  TResourceMap extends Record<string, ResourceConfig<unknown, unknown>>,
>(
  resources: TResourceMap,
  options: CreateResourcesOptions = {},
): {
  makeStore: () => EnhancedStore<RootStateFromResources<TResourceMap>>;
  slices: Record<keyof TResourceMap & string, ResourceSlice>;
} {
  const apiPort =
    options.apiPort ??
    new ResourceAdapter(resources as Record<string, ResourceConfig>);
  const storageByResource = options.storageByResource ?? {};

  // Create one RTK slice per resource.
  const slices = Object.fromEntries(
    Object.keys(resources).map((name) => [name, createResourceSlice(name)]),
  ) as Record<keyof TResourceMap & string, ResourceSlice>;

  // Build root saga — forks one watcher saga per resource.
  function* rootSaga() {
    yield all(
      Object.entries(resources).map(([name, config]) => {
        const storage = config.meta?.persist
          ? storageByResource[name as string]
          : undefined;

        return createResourceSaga(
          name,
          slices[name as keyof TResourceMap & string],
          apiPort,
          config.sagaEffect ?? "takeLatest",
          config.meta,
          storage,
        );
      }),
    );
  }

  async function hydratePersistedResources(
    store: EnhancedStore<RootStateFromResources<TResourceMap>>,
  ): Promise<void> {
    await Promise.all(
      Object.entries(resources).map(async ([name, config]) => {
        if (!config.meta?.persist || !config.meta.persistKey) {
          return;
        }

        const storage = storageByResource[name];
        if (!storage) {
          return;
        }

        const persisted = await storage.getAsync(config.meta.persistKey);
        if (!persisted) {
          return;
        }

        try {
          const parsed = JSON.parse(persisted);
          store.dispatch(
            slices[name as keyof TResourceMap & string].actions.fetchSuccess(
              parsed,
            ),
          );
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[createResources] Failed to parse persisted state for resource "${name}".`,
              error,
            );
          }
        }
      }),
    );
  }

  // makeStore: assembles the store via the focused factory, then hydrates.
  function makeStore(): EnhancedStore<RootStateFromResources<TResourceMap>> {
    const store = assembleReduxStore(
      slices,
      rootSaga,
    ) as EnhancedStore<RootStateFromResources<TResourceMap>>;

    void hydratePersistedResources(store);

    return store;
  }

  return { makeStore, slices };
}
