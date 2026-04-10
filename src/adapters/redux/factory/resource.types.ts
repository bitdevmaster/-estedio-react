import type { ResourceState } from "../../../core/entities/resource.entity";

export type { ResourceState };

/** Payload dispatched via slice.actions.fetch */
export interface FetchPayload {
  payload?: unknown;
  force?: boolean;
  callback?: (result: unknown, error: unknown) => void;
}
