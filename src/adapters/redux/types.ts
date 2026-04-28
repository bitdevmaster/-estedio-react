import type { ResourceConfig } from "../../core/entities/resource.entity";

/**
 * Redux-specific resource configuration.
 *
 * Extends the core ResourceConfig with Redux-Saga–specific options.
 * Use this type when building resource maps that are exclusively
 * consumed by the Redux adapter to make the intent explicit.
 *
 * The sagaEffect field already lives on ResourceConfig for backward
 * compatibility — this type alias is an explicit, self-documenting
 * alternative for Redux-only resource maps.
 */
export type ReduxResourceConfig<
  TPayload = unknown,
  TResponse = unknown,
> = ResourceConfig<TPayload, TResponse>;
