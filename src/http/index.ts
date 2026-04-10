export { ResourceAdapter } from "./adapters/resource.adapter";
export { apiClient } from "./client/api-client";
export type {
  RequestConfig,
  NormalizedApiError,
} from "./client/api-client.types";
export { RequestQueue, requestQueue } from "./client/request-queue";
export {
  TokenManager,
  createTokenManager,
  tokenManager,
  type TokenManagerConfig,
} from "./client/token-manager";
