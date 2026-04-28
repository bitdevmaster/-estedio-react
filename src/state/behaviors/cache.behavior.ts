/**
 * Returns true when the fetch should be skipped because a non-null cached
 * result already exists and the caller has explicitly requested cache-hit
 * behaviour by passing force=false.
 *
 * force=true  (default) — always fetch fresh data.
 * force=false            — skip API call if result is present.
 * force=undefined        — treated as force=true (always fetch).
 */
export function shouldSkipFetch(
  force: boolean | undefined,
  currentResult: unknown,
): boolean {
  return (
    force === false &&
    currentResult !== null &&
    currentResult !== undefined
  );
}
