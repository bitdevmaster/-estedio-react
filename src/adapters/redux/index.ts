// ─── Store factory and configuration ─────────────────────────────────────────
export {
  createResources,
  type CreateResourcesOptions,
  type RootStateFromResources,
} from "./create-resources";

// Generalized alias — adapters share a unified naming convention.
export { createResources as createStore } from "./create-resources";

export { StoreProvider } from "./provider";

// ─── Hooks ────────────────────────────────────────────────────────────────────
export {
  useResourceSelector,
  createResourceHooks,
  type ResourceDispatchParams,
} from "./hooks";

// Generalized alias.
export { createResourceHooks as createHooks } from "./hooks";

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

// ─── Factory internals (for advanced / custom use) ────────────────────────────
export {
  createResourceSlice,
  type ResourceSlice,
} from "./factory/create-resource-slice";
export { createResourceSaga } from "./factory/create-resource-saga";
export { assembleReduxStore } from "./factory/create-store";
export type { FetchPayload } from "./factory/resource.types";

// ─── Redux-specific types ─────────────────────────────────────────────────────
export type { ReduxResourceConfig } from "./types";

// ─── Composition types ────────────────────────────────────────────────────────
export type { RootSagaDependencies } from "./composition";

// ─── Infrastructure exports (adapters, utilities, singletons) ─────────────────
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
  SagaEffect,
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
