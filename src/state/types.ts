export type { ResourceState } from "../core/entities/resource.entity";

/** Unified callback signature used by all state adapters (Redux, Zustand, TanStack). */
export type ResourceCallback<TResponse = unknown> = (
  result: TResponse | null,
  error: unknown,
) => void;
