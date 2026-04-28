import type { NormalizedApiError } from "../core/entities/error.entity";

export function isNormalizedApiError(value: unknown): value is NormalizedApiError {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.status === "number" &&
    typeof v.code === "string" &&
    typeof v.message === "string"
  );
}

/**
 * Converts any thrown value into a NormalizedApiError.
 * Already-normalized errors pass through unchanged.
 */
export function normalizeError(error: unknown): NormalizedApiError {
  if (isNormalizedApiError(error)) return error;
  if (error instanceof Error) {
    return { status: 0, code: "UNKNOWN_ERROR", ray_id: "", message: error.message };
  }
  return { status: 0, code: "UNKNOWN_ERROR", ray_id: "", message: String(error) };
}
