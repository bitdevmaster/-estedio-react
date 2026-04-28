import type { TokenManager } from "../../http/client/token-manager";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

/**
 * Type guard — checks that a response contains both token fields.
 * Exported so saga workers can use it with `yield call` while still
 * narrowing the type before the call.
 */
export function isTokenResponse(value: unknown): value is TokenResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.access_token === "string" &&
    typeof v.refresh_token === "string"
  );
}

/**
 * Persists tokens from an auth response to encrypted storage.
 *
 * Safe to call from both async/await contexts and redux-saga via
 * `yield call(saveAuthTokens, tokenMgr, result, isAuthResource)`.
 *
 * No-ops when isAuthResource is falsy or the response is not a token shape.
 */
export async function saveAuthTokens(
  tokenMgr: TokenManager,
  response: unknown,
  isAuthResource: boolean | undefined,
): Promise<void> {
  if (!isAuthResource || !isTokenResponse(response)) return;
  await tokenMgr.setTokens(response.access_token, response.refresh_token);
}
