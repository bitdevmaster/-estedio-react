import type { HttpMethod } from "../../core/entities/resource.entity";
import type { AxiosRequestConfig } from "axios";

export type { HttpMethod };

export interface RequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  skipAuth?: boolean;
}

export interface NormalizedApiError {
  status: number;
  code: string;
  ray_id: string;
  message: string;
}
