import type { IApiPort } from "../../core/ports/api.port";
import type { IStoragePort } from "../../core/ports/storage.port";
import type { ResourceConfig } from "../../core/entities/resource.entity";
import { ResourceAdapter } from "../../http/adapters/resource.adapter";
import {
  createResourceHooks,
  type TanstackResourceHooks,
} from "./factory/create-resource-query";

export interface CreateResourcesOptions {
  apiPort?: IApiPort;
  storageByResource?: Partial<Record<string, IStoragePort>>;
}

type ResourceTypeMapLike = Record<
  string,
  { payload: unknown; response: unknown }
>;

export function createResources<TResourceMap extends ResourceTypeMapLike>(
  resources: {
    [K in keyof TResourceMap & string]: ResourceConfig<
      TResourceMap[K]["payload"],
      TResourceMap[K]["response"]
    >;
  },
  options: CreateResourcesOptions = {},
): TanstackResourceHooks<TResourceMap> {
  const apiPort =
    options.apiPort ??
    new ResourceAdapter(resources as Record<string, ResourceConfig>);

  return createResourceHooks<TResourceMap>(resources, {
    apiPort,
    storageByResource: options.storageByResource ?? {},
  });
}
