"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ResourceState } from "../../../core/entities/resource.entity";
import type { ResourceSlice } from "../factory/create-resource-slice";

export interface ResourceDispatchParams<K extends string> {
  resource: K;
  force?: boolean;
}

type ResourceTypeMapLike = Record<
  string,
  { payload: unknown; response: unknown }
>;

type DispatchCallback<TResponse> = (
  result: TResponse | null,
  error: unknown,
) => void;

type RootStateFromTypeMap<TResourceMap extends ResourceTypeMapLike> = {
  [K in keyof TResourceMap & string]: ResourceState<
    TResourceMap[K]["response"]
  >;
};

const EMPTY_RESOURCE_STATE: ResourceState = {
  result: null,
  error: null,
  loading: false,
};

export function createResourceHooks<TResourceMap extends ResourceTypeMapLike>(
  slices: Record<keyof TResourceMap & string, ResourceSlice>,
) {
  function useResourceDispatch() {
    const dispatch = useDispatch();

    function isCallback<K extends keyof TResourceMap & string>(
      value:
        | TResourceMap[K]["payload"]
        | DispatchCallback<TResourceMap[K]["response"]>
        | undefined,
    ): value is DispatchCallback<TResourceMap[K]["response"]> {
      return typeof value === "function";
    }

    return useCallback(
      function dispatchResource<K extends keyof TResourceMap & string>(
        params: ResourceDispatchParams<K>,
        payloadOrCallback?:
          | TResourceMap[K]["payload"]
          | DispatchCallback<TResourceMap[K]["response"]>,
        callbackArg?: DispatchCallback<TResourceMap[K]["response"]>,
      ): void {
        const { resource, force = true } = params;
        const payload = isCallback<K>(payloadOrCallback)
          ? undefined
          : payloadOrCallback;
        const callback = isCallback<K>(payloadOrCallback)
          ? payloadOrCallback
          : callbackArg;

        const slice = slices[resource];
        if (!slice) {
          console.error(
            `[useResourceDispatch] Unknown resource: "${resource}"`,
          );
          return;
        }

        const typedCallback = callback
          ? (result: unknown, error: unknown) => {
              callback(result as TResourceMap[K]["response"] | null, error);
            }
          : undefined;

        dispatch(
          slice.actions.fetch({
            payload,
            force,
            callback: typedCallback,
          }),
        );
      },
      [dispatch],
    );
  }

  function useResourceSelector<K extends keyof TResourceMap & string>(
    resource: K,
  ): ResourceState<TResourceMap[K]["response"]> {
    return useSelector((state: RootStateFromTypeMap<TResourceMap>) => {
      const slice = state[resource];
      if (!slice) {
        return EMPTY_RESOURCE_STATE as ResourceState<
          TResourceMap[K]["response"]
        >;
      }
      return slice as ResourceState<TResourceMap[K]["response"]>;
    });
  }

  return { useResourceDispatch, useResourceSelector };
}
