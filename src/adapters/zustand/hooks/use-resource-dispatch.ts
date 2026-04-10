"use client";

import { useCallback } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import type { ResourceState } from "../../../core/entities/resource.entity";
import type {
  FetchCallback,
  ResourceStoreState,
} from "../factory/create-resource-store";

export interface ResourceDispatchParams<K extends string> {
  resource: K;
  force?: boolean;
}

type ResourceTypeMapLike = Record<
  string,
  { payload: unknown; response: unknown }
>;

type StoresFromTypeMap<TResourceMap extends ResourceTypeMapLike> = {
  [K in keyof TResourceMap & string]: StoreApi<
    ResourceStoreState<TResourceMap[K]["payload"], TResourceMap[K]["response"]>
  >;
};

const EMPTY_RESOURCE_STATE: ResourceState = {
  result: null,
  error: null,
  loading: false,
};

const emptyStore = createStore<ResourceStoreState<unknown, unknown>>(() => ({
  ...EMPTY_RESOURCE_STATE,
  fetch: async ({
    callback,
  }: {
    payload?: unknown;
    force?: boolean;
    callback?: FetchCallback<unknown>;
  }) => {
    callback?.(null, new Error("Unknown resource"));
  },
  clearResult: () => undefined,
  reset: () => undefined,
}));

export function createResourceHooks<TResourceMap extends ResourceTypeMapLike>(
  stores: StoresFromTypeMap<TResourceMap>,
) {
  function isCallback<K extends keyof TResourceMap & string>(
    value:
      | TResourceMap[K]["payload"]
      | FetchCallback<TResourceMap[K]["response"]>
      | undefined,
  ): value is FetchCallback<TResourceMap[K]["response"]> {
    return typeof value === "function";
  }

  function useResourceDispatch() {
    return useCallback(function dispatchResource<
      K extends keyof TResourceMap & string,
    >(
      params: ResourceDispatchParams<K>,
      payloadOrCallback?:
        | TResourceMap[K]["payload"]
        | FetchCallback<TResourceMap[K]["response"]>,
      callbackArg?: FetchCallback<TResourceMap[K]["response"]>,
    ): void {
      const { resource, force = true } = params;
      const store = stores[resource];

      if (!store) {
        console.error(`[useResourceDispatch] Unknown resource: "${resource}"`);
        return;
      }

      const payload = isCallback<K>(payloadOrCallback)
        ? undefined
        : payloadOrCallback;
      const callback = isCallback<K>(payloadOrCallback)
        ? payloadOrCallback
        : callbackArg;

      void store.getState().fetch({
        payload,
        force,
        callback,
      });
    }, []);
  }

  function useResourceSelector<K extends keyof TResourceMap & string>(
    resource: K,
  ): ResourceState<TResourceMap[K]["response"]> {
    const store =
      stores[resource] ??
      (emptyStore as StoreApi<
        ResourceStoreState<
          TResourceMap[K]["payload"],
          TResourceMap[K]["response"]
        >
      >);

    return useStore(store, (state) => ({
      result: state.result,
      error: state.error,
      loading: state.loading,
    }));
  }

  return { useResourceDispatch, useResourceSelector };
}
