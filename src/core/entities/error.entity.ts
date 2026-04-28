/**
 * Normalized API error shape used across all state adapters.
 *
 * Promoted from the HTTP client layer to the core domain so that
 * Redux, Zustand, and TanStack adapters can reference a single
 * canonical error type without importing from the HTTP layer.
 */
export interface NormalizedApiError {
  status: number;
  code: string;
  ray_id: string;
  message: string;
}
