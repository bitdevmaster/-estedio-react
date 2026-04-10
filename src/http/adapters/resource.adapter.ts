import type { IApiPort } from "../../core/ports/api.port";
import type { ResourceConfig } from "../../core/entities/resource.entity";
import { apiClient } from "../client/api-client";
import type { RequestConfig } from "../client/api-client.types";
import { isRecord } from "../../utils/type-guards";

/**
 * ResourceAdapter implements IApiPort by mapping registered resource configs
 * to the appropriate APIClient method.
 *
 * Usage:
 *   const adapter = new ResourceAdapter(resources);
 *   const data = await adapter.execute('UserList', { page: 1 });
 */
export class ResourceAdapter implements IApiPort {
  constructor(private readonly registry: Record<string, ResourceConfig>) {}

  private interpolateEndpoint(
    endpoint: string,
    payload: unknown,
  ): { resolvedEndpoint: string; remainingPayload: unknown } {
    const paramTokens = endpoint.match(/:([A-Za-z0-9_]+)/g) ?? [];

    if (paramTokens.length === 0) {
      return { resolvedEndpoint: endpoint, remainingPayload: payload };
    }

    if (!isRecord(payload)) {
      throw new Error(
        `[ResourceAdapter] Endpoint "${endpoint}" requires payload object for path params.`,
      );
    }

    const payloadCopy: Record<string, unknown> = { ...payload };
    let resolvedEndpoint = endpoint;

    for (const token of paramTokens) {
      const key = token.slice(1);
      const value = payloadCopy[key];

      if (value === undefined || value === null) {
        throw new Error(
          `[ResourceAdapter] Missing path param "${key}" for endpoint "${endpoint}".`,
        );
      }

      resolvedEndpoint = resolvedEndpoint.replace(
        token,
        encodeURIComponent(String(value)),
      );
      delete payloadCopy[key];
    }

    return {
      resolvedEndpoint,
      remainingPayload: payloadCopy,
    };
  }

  async execute<T = unknown>(resource: string, payload?: unknown): Promise<T> {
    const config = this.registry[resource];

    if (!config) {
      throw new Error(`[ResourceAdapter] Unknown resource: "${resource}"`);
    }

    const { endpoint, method } = config;
    const { resolvedEndpoint, remainingPayload } = this.interpolateEndpoint(
      endpoint,
      payload,
    );
    const requestConfig: RequestConfig | undefined =
      config.authenticated === false ? { skipAuth: true } : undefined;

    let result: T;

    switch (method) {
      case "GET":
        result = await apiClient.get<T>(
          resolvedEndpoint,
          remainingPayload as Record<string, unknown>,
          requestConfig,
        );
        break;

      case "POST":
        result = await apiClient.post<T>(
          resolvedEndpoint,
          remainingPayload,
          requestConfig,
        );
        break;

      case "PUT":
        result = await apiClient.put<T>(
          resolvedEndpoint,
          remainingPayload,
          requestConfig,
        );
        break;

      case "PATCH":
        result = await apiClient.patch<T>(
          resolvedEndpoint,
          remainingPayload,
          requestConfig,
        );
        break;

      case "DELETE":
        result = await apiClient.delete<T>(resolvedEndpoint, {
          data: remainingPayload,
          ...requestConfig,
        });
        break;

      case "MULTIPART":
        if (!(remainingPayload instanceof FormData)) {
          throw new Error(
            `[ResourceAdapter] Resource "${resource}" expects FormData payload for MULTIPART method.`,
          );
        }
        result = await apiClient.multipart<T>(
          resolvedEndpoint,
          remainingPayload,
          requestConfig,
        );
        break;

      default: {
        const exhaustive: never = method;
        throw new Error(`[ResourceAdapter] Unsupported method: ${exhaustive}`);
      }
    }

    return result;
  }
}
