import axios from "axios";
import { AxiosHeaders, type AxiosInstance, type AxiosResponse } from "axios";
import { requestQueue, type RequestQueue } from "./request-queue";
import type { NormalizedApiError, RequestConfig } from "./api-client.types";
import { tokenManager, type TokenManager } from "./token-manager";
import { isRecord } from "../../utils/type-guards";
import { getLibConfig } from "../../config/lib-config";

let hasWarnedMissingBaseUrl = false;

interface APIClientDependencies {
  tokenManager: TokenManager;
  requestQueue: RequestQueue;
  baseUrl: string;
  refreshEndpoint: string;
}

class APIClient {
  private readonly instance: AxiosInstance;
  private readonly tokenManager: TokenManager;
  private readonly requestQueue: RequestQueue;
  private readonly fallbackBaseUrl: string;
  private readonly fallbackRefreshEndpoint: string;

  private normalizeError(error: unknown): NormalizedApiError {
    const fallbackMessage = "Something went wrong";

    if (!axios.isAxiosError(error)) {
      if (isRecord(error)) {
        return {
          status: typeof error.status === "number" ? error.status : 0,
          code: typeof error.code === "string" ? error.code : "UNKNOWN_ERROR",
          ray_id: typeof error.ray_id === "string" ? error.ray_id : "",
          message:
            typeof error.message === "string" && error.message.trim()
              ? error.message
              : fallbackMessage,
        };
      }

      return {
        status: 0,
        code: "UNKNOWN_ERROR",
        ray_id: "",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : fallbackMessage,
      };
    }

    const data = isRecord(error.response?.data)
      ? error.response?.data
      : undefined;
    const rawCode = data?.error;
    const rawMessage = data?.message;
    const rawRayId = data?.ray_id;

    return {
      status: error.response?.status ?? 0,
      code:
        typeof rawCode === "string" ? rawCode : (error.code ?? "UNKNOWN_ERROR"),
      ray_id: typeof rawRayId === "string" ? rawRayId : "",
      message:
        typeof rawMessage === "string" && rawMessage.trim()
          ? rawMessage
          : error.message || fallbackMessage,
    };
  }

  constructor({
    tokenManager,
    requestQueue,
    baseUrl,
    refreshEndpoint,
  }: APIClientDependencies) {
    this.tokenManager = tokenManager;
    this.requestQueue = requestQueue;
    this.fallbackBaseUrl = baseUrl;
    this.fallbackRefreshEndpoint = refreshEndpoint;

    this.instance = axios.create({
      baseURL: this.fallbackBaseUrl,
      headers: { "Content-Type": "application/json" },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  // ---------------------------------------------------------------------------
  // Interceptors
  // ---------------------------------------------------------------------------

  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(async (config) => {
      const requestConfig = config as RequestConfig;
      const libConfig = getLibConfig();

      if (!config.baseURL) {
        config.baseURL = libConfig.apiBaseUrl || this.fallbackBaseUrl;
      }

      if (
        !hasWarnedMissingBaseUrl &&
        libConfig.nodeEnv !== "production" &&
        !libConfig.apiBaseUrl
      ) {
        hasWarnedMissingBaseUrl = true;
        console.warn(
          "[APIClient] API base URL is not configured. Requests will use relative paths.",
        );
      }

      if (requestConfig.skipAuth) {
        return config;
      }

      const token = await this.tokenManager.getAccessToken();
      if (token) {
        if (typeof config.headers?.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          const headers = AxiosHeaders.from(config.headers);
          headers.set("Authorization", `Bearer ${token}`);
          config.headers = headers;
        }
      }

      return config;
    });
  }

  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest: RequestConfig = error.config ?? {};

        if (originalRequest.skipAuth) {
          return Promise.reject(this.normalizeError(error));
        }

        // Only handle 401 once per request (avoid infinite retry loop)
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(this.normalizeError(error));
        }

        originalRequest._retry = true;

        if (this.requestQueue.isRefreshing) {
          // Another refresh is already in progress — queue this request
          try {
            await this.requestQueue.enqueue();
            return this.instance(originalRequest);
          } catch (queueError) {
            return Promise.reject(this.normalizeError(queueError));
          }
        }

        // Start refresh
        this.requestQueue.isRefreshing = true;

        try {
          const refreshToken = await this.tokenManager.getRefreshToken();
          const libConfig = getLibConfig();
          const baseUrl = libConfig.apiBaseUrl || this.fallbackBaseUrl;
          const refreshEndpoint =
            libConfig.refreshEndpoint || this.fallbackRefreshEndpoint;

          if (!refreshToken) {
            this.tokenManager.clearTokens();
            const missingRefreshTokenError: NormalizedApiError = {
              status: 401,
              code: "MISSING_REFRESH_TOKEN",
              ray_id: "",
              message: "Missing refresh token",
            };
            this.requestQueue.reject(missingRefreshTokenError);
            return Promise.reject(missingRefreshTokenError);
          }

          const response = await axios.post<{
            access_token: string;
            refresh_token: string;
          }>(
            `${baseUrl}${refreshEndpoint}`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } },
          );

          const { access_token, refresh_token } = response.data;
          await this.tokenManager.setTokens(access_token, refresh_token);

          // Flush all queued requests once refresh succeeds.
          this.requestQueue.flush();

          return this.instance(originalRequest);
        } catch (refreshError) {
          this.tokenManager.clearTokens();
          const normalizedError = this.normalizeError(refreshError);
          this.requestQueue.reject(normalizedError);
          return Promise.reject(normalizedError);
        }
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Public methods
  // ---------------------------------------------------------------------------

  async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, {
      params,
      ...config,
    });
    return response.data;
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(
      url,
      data,
      config,
    );
    return response.data;
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(
      url,
      data,
      config,
    );
    return response.data;
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.patch(
      url,
      data,
      config,
    );
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config);
    return response.data;
  }

  /**
   * Multipart/form-data upload. Automatically sets the correct Content-Type
   * header including the boundary.
   */
  async multipart<T = unknown>(
    url: string,
    formData: FormData,
    config?: RequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(url, formData, {
      ...config,
      headers: {
        ...(config?.headers ?? {}),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /** Expose the raw axios instance for advanced use cases. */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

export const apiClient = new APIClient({
  tokenManager,
  requestQueue,
  baseUrl: getLibConfig().apiBaseUrl,
  refreshEndpoint: getLibConfig().refreshEndpoint,
});
