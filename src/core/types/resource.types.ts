/**
 * Barrel re-export of core resource types for internal use across
 * adapters and the state layer.  Consumers should import directly
 * from the adapter entry-point or the root package index.
 */
export type {
  HttpMethod,
  SagaEffect,
  ResourceConfigMeta,
  ResourceConfig,
  ResourceState,
} from "../entities/resource.entity";
export { initialResourceState } from "../entities/resource.entity";
export type { NormalizedApiError } from "../entities/error.entity";
export type { IApiPort } from "../ports/api.port";
export type { IStoragePort } from "../ports/storage.port";
