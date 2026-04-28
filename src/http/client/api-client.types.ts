import type { HttpMethod } from "../../core/entities/resource.entity";
import type { AxiosRequestConfig } from "axios";

export type { HttpMethod };

export interface RequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  skipAuth?: boolean;
}

// Re-exported from core so consumers importing from either location get the same type.
export type { NormalizedApiError } from "../../core/entities/error.entity";
