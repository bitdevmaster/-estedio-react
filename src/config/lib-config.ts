type EnvLike = Record<string, string | undefined>;

export interface LibraryConfig {
  nodeEnv: string;
  apiBaseUrl: string;
  refreshEndpoint: string;
  accessTokenKey: string;
  refreshTokenKey: string;
  storageSecret: string;
}

export interface DataProviderConfig {
  access_token_key?: string;
  refresh_token_key?: string;
  /** @deprecated Use access_token_key instead. */
  access_token?: string;
  /** @deprecated Use refresh_token_key instead. */
  refresh_token?: string;
  base_url?: string;
  refresh_endpoint?: string;
  storage_secret?: string;
}

let runtimeConfig: Partial<LibraryConfig> = {};

function readEnv(env: EnvLike, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function pickNonEmpty(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return value.trim() ? value : undefined;
}

export function dataProvider(
  config: DataProviderConfig,
): Partial<LibraryConfig> {
  return {
    apiBaseUrl: pickNonEmpty(config.base_url),
    refreshEndpoint: pickNonEmpty(config.refresh_endpoint),
    accessTokenKey: pickNonEmpty(
      config.access_token_key ?? config.access_token,
    ),
    refreshTokenKey: pickNonEmpty(
      config.refresh_token_key ?? config.refresh_token,
    ),
    storageSecret: pickNonEmpty(config.storage_secret),
  };
}

export function initializeLibConfig(config: Partial<LibraryConfig>): void {
  runtimeConfig = {
    ...runtimeConfig,
    ...config,
  };
}

export function resetLibConfig(): void {
  runtimeConfig = {};
}

export function getLibConfig(
  overrides: Partial<LibraryConfig> = {},
  env: EnvLike = process.env,
): LibraryConfig {
  return {
    nodeEnv:
      overrides.nodeEnv ??
      runtimeConfig.nodeEnv ??
      env.NODE_ENV ??
      "development",
    apiBaseUrl:
      overrides.apiBaseUrl ??
      runtimeConfig.apiBaseUrl ??
      readEnv(env, ["ESTEDIO_API_BASE_URL", "NEXT_PUBLIC_API_BASE_URL"]) ??
      "",
    refreshEndpoint:
      overrides.refreshEndpoint ??
      runtimeConfig.refreshEndpoint ??
      readEnv(env, [
        "ESTEDIO_REFRESH_ENDPOINT",
        "NEXT_PUBLIC_REFRESH_ENDPOINT",
      ]) ??
      "/auth/refresh",
    accessTokenKey:
      overrides.accessTokenKey ??
      runtimeConfig.accessTokenKey ??
      readEnv(env, [
        "ESTEDIO_ACCESS_TOKEN_KEY",
        "NEXT_PUBLIC_ACCESS_TOKEN_KEY",
      ]) ??
      "access_token",
    refreshTokenKey:
      overrides.refreshTokenKey ??
      runtimeConfig.refreshTokenKey ??
      readEnv(env, [
        "ESTEDIO_REFRESH_TOKEN_KEY",
        "NEXT_PUBLIC_REFRESH_TOKEN_KEY",
      ]) ??
      "refresh_token",
    storageSecret:
      overrides.storageSecret ??
      runtimeConfig.storageSecret ??
      readEnv(env, ["ESTEDIO_STORAGE_SECRET", "NEXT_PUBLIC_STORAGE_SECRET"]) ??
      "default-storage-secret-change-me",
  };
}
