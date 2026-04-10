"use client";

import { useSelector } from "react-redux";
import type { ResourceState } from "../../../core/entities/resource.entity";

const EMPTY_RESOURCE_STATE: ResourceState = {
  result: null,
  error: null,
  loading: false,
};

export function useResourceSelector<TResponse>(
  resource: string,
): ResourceState<TResponse> {
  return useSelector((state: unknown) => {
    const stateRecord = state as Record<string, ResourceState<TResponse>>;
    const slice = stateRecord[resource];

    if (!slice) {
      return EMPTY_RESOURCE_STATE as ResourceState<TResponse>;
    }

    return slice;
  });
}
