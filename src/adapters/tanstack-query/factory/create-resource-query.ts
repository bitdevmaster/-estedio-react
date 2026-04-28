"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { IApiPort } from "../../../core/ports/api.port";
import type { IStoragePort } from "../../../core/ports/storage.port";
import type {
  ResourceConfig,
  ResourceState,
} from "../../../core/entities/resource.entity";
import { tokenManager } from "../../../http/client/token-manager";
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

type ResourceTypeMapLike = Record<
  string,
  { payload: unknown; response: unknown }
>;

type ResourceConfigsFromTypeMap<TResourceMap extends ResourceTypeMapLike> = {
  [K in keyof TResourceMap & string]: ResourceConfig<
    TResourceMap[K]["payload"],
    TResourceMap[K]["response"]
  >;
};

interface ResourceHookDependencies {
  apiPort: IApiPort;
  storageByResource: Partial<Record<string, IStoragePort>>;
}

export type QueryResourceResult<TResponse> = Omit<
  UseQueryResult<TResponse, Error>,
  "data" | "error"
> &
  ResourceState<TResponse>;

export type MutationResourceResult<TPayload, TResponse> = Omit<
  UseMutationResult<TResponse, Error, TPayload>,
  "data" | "error"
> &
  ResourceState<TResponse> & {
    dispatch: (
      payloadOrCallback?: TPayload | FetchCallback<TResponse>,
      callbackArg?: FetchCallback<TResponse>,
    ) => void;
  };

export type TanstackResourceHooks<TResourceMap extends ResourceTypeMapLike> = {
  useResourceQuery: <K extends keyof TResourceMap & string>(
    params: {
      resource: K;
      payload?: TResourceMap[K]["payload"];
      enabled?: boolean;
      force?: boolean;
      queryKey?: QueryKey;
    },
    options?: Omit<
      UseQueryOptions<
        TResourceMap[K]["response"],
        Error,
        TResourceMap[K]["response"],
        QueryKey
      >,
      "queryKey" | "queryFn" | "enabled"
    >,
  ) => QueryResourceResult<TResourceMap[K]["response"]>;
  useResourceMutation: <K extends keyof TResourceMap & string>(
    resource: K,
    options?: Omit<
      UseMutationOptions<
        TResourceMap[K]["response"],
        Error,
        TResourceMap[K]["payload"]
      >,
      "mutationFn"
    >,
  ) => MutationResourceResult<
    TResourceMap[K]["payload"],
    TResourceMap[K]["response"]
  >;
};

export function createResourceHooks<TResourceMap extends ResourceTypeMapLike>(
  resources: ResourceConfigsFromTypeMap<TResourceMap>,
  dependencies: ResourceHookDependencies,
): TanstackResourceHooks<TResourceMap> {
  const isCallback = <K extends keyof TResourceMap & string>(
    value:
      | TResourceMap[K]["payload"]
      | FetchCallback<TResourceMap[K]["response"]>
      | undefined,
  ): value is FetchCallback<TResourceMap[K]["response"]> => {
    return typeof value === "function";
  };

  /**
   * Executes a resource request and applies cross-cutting behaviours
   * (auth token saving, persistence) via the shared state/behaviors layer.
   */
  const executeResource = async <K extends keyof TResourceMap & string>(
    resource: K,
    payload?: TResourceMap[K]["payload"],
  ): Promise<TResourceMap[K]["response"]> => {
    const config = resources[resource];
    const result = await dependencies.apiPort.execute<
      TResourceMap[K]["response"]
    >(resource, payload);

    // Auth token handling — delegates to shared behavior.
    if (isTokenResponse(result)) {
      await saveAuthTokens(tokenManager, result, config.meta?.isAuthResource);
    }

    // Persistence — delegates to shared behavior.
    const storage = dependencies.storageByResource[resource];
    await persistResult(config.meta, storage, result);

    return result;
  };

  function useResourceQuery<K extends keyof TResourceMap & string>(
    params: {
      resource: K;
      payload?: TResourceMap[K]["payload"];
      enabled?: boolean;
      force?: boolean;
      queryKey?: QueryKey;
    },
    options?: Omit<
      UseQueryOptions<
        TResourceMap[K]["response"],
        Error,
        TResourceMap[K]["response"],
        QueryKey
      >,
      "queryKey" | "queryFn" | "enabled"
    >,
  ): QueryResourceResult<TResourceMap[K]["response"]> {
    const {
      resource,
      payload,
      enabled = true,
      force = true,
      queryKey,
    } = params;
    const config = resources[resource];
    const queryClient = useQueryClient();
    const resourceQueryKey = queryKey ?? ([resource, payload] as const);

    // Hydrate QueryClient cache from persisted storage on mount.
    useEffect(() => {
      const storage = dependencies.storageByResource[resource];

      void readPersistedResult<TResourceMap[K]["response"]>(
        config.meta,
        storage,
      ).then((parsed) => {
        if (parsed === null) return;
        const current = queryClient.getQueryData(resourceQueryKey);
        if (current !== undefined) return;
        queryClient.setQueryData(resourceQueryKey, parsed);
      });
    }, [
      config.meta?.persist,
      config.meta?.persistKey,
      queryClient,
      resource,
      resourceQueryKey,
    ]);

    const query = useQuery({
      ...options,
      queryKey: resourceQueryKey,
      enabled: enabled && config.method === "GET",
      queryFn: () => executeResource(resource, payload),
      staleTime: force ? options?.staleTime : Infinity,
    });

    const errorMessage = query.error ? query.error.message : null;

    return {
      ...query,
      result: query.data ?? null,
      error: errorMessage,
      loading: query.isPending || query.isFetching,
    };
  }

  function useResourceMutation<K extends keyof TResourceMap & string>(
    resource: K,
    options?: Omit<
      UseMutationOptions<
        TResourceMap[K]["response"],
        Error,
        TResourceMap[K]["payload"]
      >,
      "mutationFn"
    >,
  ): MutationResourceResult<
    TResourceMap[K]["payload"],
    TResourceMap[K]["response"]
  > {
    const mutation = useMutation({
      ...options,
      mutationFn: (payload: TResourceMap[K]["payload"]) =>
        executeResource(resource, payload),
    });

    const dispatch = (
      payloadOrCallback?:
        | TResourceMap[K]["payload"]
        | FetchCallback<TResourceMap[K]["response"]>,
      callbackArg?: FetchCallback<TResourceMap[K]["response"]>,
    ): void => {
      const payload = isCallback<K>(payloadOrCallback)
        ? undefined
        : payloadOrCallback;
      const callback = isCallback<K>(payloadOrCallback)
        ? payloadOrCallback
        : callbackArg;

      mutation.mutate(payload as TResourceMap[K]["payload"], {
        onSuccess: (data: TResourceMap[K]["response"]) => {
          callback?.(data, null);
        },
        onError: (error: Error) => {
          callback?.(null, error);
        },
      });
    };

    const errorMessage = mutation.error ? mutation.error.message : null;

    return {
      ...mutation,
      dispatch,
      result: mutation.data ?? null,
      error: errorMessage,
      loading: mutation.isPending,
    };
  }

  return { useResourceQuery, useResourceMutation };
}
