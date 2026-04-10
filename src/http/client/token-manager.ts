import type { IStoragePort } from "../../core/ports/storage.port";
import { localStorageAdapter } from "../../storage/local-storage.adapter";
import { getLibConfig } from "../../config/lib-config";

export interface TokenManagerConfig {
  accessTokenKey: string;
  refreshTokenKey: string;
}

type TokenManagerConfigResolver =
  | TokenManagerConfig
  | (() => TokenManagerConfig);

/**
 * Stores auth tokens in browser storage with adapter-level encryption.
 *
 * Warning: browser-accessible token storage is vulnerable to XSS. Prefer
 * httpOnly cookies for production systems that handle sensitive auth flows.
 */
export class TokenManager {
  constructor(
    private readonly storage: IStoragePort,
    private readonly config: TokenManagerConfigResolver,
  ) {}

  private resolveConfig(): TokenManagerConfig {
    if (typeof this.config === "function") {
      return this.config();
    }
    return this.config;
  }

  async getAccessToken(): Promise<string | null> {
    return this.storage.getAsync(this.resolveConfig().accessTokenKey);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.storage.getAsync(this.resolveConfig().refreshTokenKey);
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    const config = this.resolveConfig();
    await Promise.all([
      this.storage.setAsync(config.accessTokenKey, accessToken),
      this.storage.setAsync(config.refreshTokenKey, refreshToken),
    ]);
  }

  clearTokens(): void {
    const config = this.resolveConfig();
    this.storage.remove(config.accessTokenKey);
    this.storage.remove(config.refreshTokenKey);
  }
}

export function createTokenManager(
  storage: IStoragePort,
  config: TokenManagerConfigResolver,
): TokenManager {
  return new TokenManager(storage, config);
}

export const tokenManager = createTokenManager(localStorageAdapter, () => {
  const libConfig = getLibConfig();
  return {
    accessTokenKey: libConfig.accessTokenKey,
    refreshTokenKey: libConfig.refreshTokenKey,
  };
});
