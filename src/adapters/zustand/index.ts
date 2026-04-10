export {
  createResources,
  type CreateResourcesOptions,
  type ResourceStoresFromTypeMap,
} from "./create-resources";
export { createResourceHooks, type ResourceDispatchParams } from "./hooks";
export {
  createResourceStore,
  type ResourceStoreState,
  type FetchCallback,
} from "./factory/create-resource-store";

export {
  dataProvider,
  initializeLibConfig,
  getLibConfig,
} from "../../config/lib-config";
export type {
  DataProviderConfig,
  LibraryConfig,
} from "../../config/lib-config";

export { ResourceAdapter } from "../../http/adapters/resource.adapter";
export {
  localStorageAdapter,
  type LocalStorageAdapter,
} from "../../storage/local-storage.adapter";
export {
  sessionStorageAdapter,
  type SessionStorageAdapter,
} from "../../storage/session-storage.adapter";
export {
  tokenManager,
  TokenManager,
  createTokenManager,
  type TokenManagerConfig,
} from "../../http/client/token-manager";

export { initialResourceState } from "../../core/entities/resource.entity";
export type {
  HttpMethod,
  ResourceConfig,
  ResourceConfigMeta,
  ResourceState,
} from "../../core/entities/resource.entity";
export type { IApiPort } from "../../core/ports/api.port";
export type { IStoragePort } from "../../core/ports/storage.port";

export type {
  RequestConfig,
  NormalizedApiError,
} from "../../http/client/api-client.types";
