import type { StoreApi } from "zustand/vanilla";
import type { IApiPort } from "../../core/ports/api.port";
import type { IStoragePort } from "../../core/ports/storage.port";
import type { ResourceConfig } from "../../core/entities/resource.entity";
import { ResourceAdapter } from "../../http/adapters/resource.adapter";
import {
  createResourceStore,
  type ResourceStoreState,
} from "./factory/create-resource-store";

export interface CreateResourcesOptions {
  apiPort?: IApiPort;
  storageByResource?: Partial<Record<string, IStoragePort>>;
}

type ResourceTypeMapLike = Record<
  string,
  { payload: unknown; response: unknown }
>;

export type ResourceStoresFromTypeMap<
  TResourceMap extends ResourceTypeMapLike,
> = {
  [K in keyof TResourceMap & string]: StoreApi<
    ResourceStoreState<TResourceMap[K]["payload"], TResourceMap[K]["response"]>
  >;
};

export function createResources<TResourceMap extends ResourceTypeMapLike>(
  resources: {
    [K in keyof TResourceMap & string]: ResourceConfig<
      TResourceMap[K]["payload"],
      TResourceMap[K]["response"]
    >;
  },
  options: CreateResourcesOptions = {},
): { stores: ResourceStoresFromTypeMap<TResourceMap> } {
  const apiPort =
    options.apiPort ??
    new ResourceAdapter(resources as Record<string, ResourceConfig>);
  const storageByResource = options.storageByResource ?? {};

  const stores = Object.fromEntries(
    Object.entries(resources).map(([name, config]) => {
      const storage = config.meta?.persist
        ? storageByResource[name]
        : undefined;
      return [name, createResourceStore(name, config, apiPort, storage)];
    }),
  ) as ResourceStoresFromTypeMap<TResourceMap>;

  return { stores };
}
