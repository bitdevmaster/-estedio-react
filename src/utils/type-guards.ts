/**
 * Returns true if value is a plain object (not null, array, or FormData).
 * Used to distinguish plain key-value payloads from other object types.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof FormData)
  );
}
