import type { ResourceConfig } from "../entities/resource.entity";

/**
 * Shared type-level utilities for the hook factory functions in all three
 * state-management adapters (Redux, Zustand, TanStack).
 *
 * Using these helpers removes the need to repeat conditional type
 * gymnastics in each adapter.
 */

/** Extract the payload type from a ResourceConfig. */
export type InferPayload<C> =
  C extends ResourceConfig<infer P, unknown> ? P : never;

/** Extract the response type from a ResourceConfig. */
export type InferResponse<C> =
  C extends ResourceConfig<unknown, infer R> ? R : never;

/**
 * Minimal shape that every adapter's resource type-map must conform to.
 * Keeps adapter generics interoperable without tying them to ResourceConfig.
 */
export type ResourceTypeMapLike = Record<
  string,
  { payload: unknown; response: unknown }
>;

/** Unified callback type for all dispatch/mutation operations. */
export type ResourceDispatchCallback<TResponse = unknown> = (
  result: TResponse | null,
  error: unknown,
) => void;
