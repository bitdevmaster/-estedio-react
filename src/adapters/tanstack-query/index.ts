// ─── Store/hook factory and configuration ─────────────────────────────────────
export {
  createResources,
  type CreateResourcesOptions,
} from "./create-resources";

// Generalized alias — adapters share a unified naming convention.
export { createResources as createStore } from "./create-resources";

export { TanstackProvider } from "./provider";

// ─── Hook factory ─────────────────────────────────────────────────────────────
export {
  createResourceHooks,
  type TanstackResourceHooks,
  type QueryResourceResult,
  type MutationResourceResult,
  type FetchCallback,
} from "./factory/create-resource-query";

// Generalized alias.
export { createResourceHooks as createHooks } from "./factory/create-resource-query";

// ─── Config helpers ───────────────────────────────────────────────────────────
export {
  dataProvider,
  initializeLibConfig,
  getLibConfig,
} from "../../config/lib-config";
export type {
  DataProviderConfig,
  LibraryConfig,
} from "../../config/lib-config";

// ─── Infrastructure exports ───────────────────────────────────────────────────
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

// ─── Core types and entities ──────────────────────────────────────────────────
export { initialResourceState } from "../../core/entities/resource.entity";
export type {
  HttpMethod,
  ResourceConfig,
  ResourceConfigMeta,
  ResourceState,
} from "../../core/entities/resource.entity";
export type { IApiPort } from "../../core/ports/api.port";
export type { IStoragePort } from "../../core/ports/storage.port";

// ─── API client types ─────────────────────────────────────────────────────────
export type {
  RequestConfig,
  NormalizedApiError,
} from "../../http/client/api-client.types";
