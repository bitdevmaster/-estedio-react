// Store factory and configuration
export {
  createResources,
  type CreateResourcesOptions,
  type RootStateFromResources,
} from "./create-resources";
export { StoreProvider } from "./provider";
export {
  useResourceSelector,
  createResourceHooks,
  type ResourceDispatchParams,
} from "./hooks";
export {
  dataProvider,
  initializeLibConfig,
  getLibConfig,
} from "../../config/lib-config";
export type {
  DataProviderConfig,
  LibraryConfig,
} from "../../config/lib-config";

// Factory functions (for advanced use)
export {
  createResourceSlice,
  type ResourceSlice,
} from "./factory/create-resource-slice";
export { createResourceSaga } from "./factory/create-resource-saga";
export type { FetchPayload } from "./factory/resource.types";

// Composition types
export type { RootSagaDependencies } from "./composition";

// Infrastructure exports (adapters, utilities, singletons)
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

// Core types and entities
export { initialResourceState } from "../../core/entities/resource.entity";
export type {
  HttpMethod,
  SagaEffect,
  ResourceConfig,
  ResourceConfigMeta,
  ResourceState,
} from "../../core/entities/resource.entity";
export type { IApiPort } from "../../core/ports/api.port";
export type { IStoragePort } from "../../core/ports/storage.port";

// API client types
export type {
  RequestConfig,
  NormalizedApiError,
} from "../../http/client/api-client.types";
