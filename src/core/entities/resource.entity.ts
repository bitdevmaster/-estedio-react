export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "MULTIPART";

export type SagaEffect = "takeLatest" | "takeEvery";

export interface ResourceConfigMeta {
  /** Enable persisting API response to browser storage. */
  persist: boolean;
  /** Storage key used to save the persisted response. */
  persistKey: string;
  /** Mark this resource as an auth resource to auto-save tokens. */
  isAuthResource?: boolean;
}

export interface ResourceConfig<TPayload = unknown, TResponse = unknown> {
  endpoint: string;
  method: HttpMethod;
  authenticated?: boolean;
  sagaEffect?: SagaEffect;
  meta?: ResourceConfigMeta;
  /**
   * Type-only marker used for inference in consumer resource maps.
   * This field is optional and not used at runtime.
   */
  payload?: TPayload;
  /**
   * Type-only marker used for inference in consumer resource maps.
   * This field is optional and not used at runtime.
   */
  response?: TResponse;
}

export interface ResourceState<T = unknown> {
  result: T | null;
  error: string | null;
  loading: boolean;
}

export const initialResourceState: ResourceState = {
  result: null,
  error: null,
  loading: false,
};
