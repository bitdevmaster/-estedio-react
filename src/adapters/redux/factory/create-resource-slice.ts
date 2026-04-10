import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  initialResourceState,
  type ResourceState,
} from "../../../core/entities/resource.entity";
import type { FetchPayload } from "./resource.types";

/**
 * Factory that generates a typed RTK slice for a given resource name.
 *
 * Generated actions:
 *   - fetch(FetchPayload)      → sets loading: true
 *   - fetchSuccess(unknown)    → sets result, clears error, loading: false
 *   - fetchFailure(string)     → sets error, preserves result, loading: false
 *   - clearResult()            → clears result explicitly
 *   - reset()                  → restores initialState
 */
export function createResourceSlice(name: string) {
  return createSlice({
    name,
    initialState: initialResourceState as ResourceState,
    reducers: {
      fetch(state, _action: PayloadAction<FetchPayload>) {
        state.loading = true;
        state.error = null;
      },

      fetchSuccess(state, action: PayloadAction<unknown>) {
        state.loading = false;
        state.result = action.payload;
        state.error = null;
      },

      fetchFailure(state, action: PayloadAction<string>) {
        state.loading = false;
        state.error = action.payload;
      },

      clearResult(state) {
        state.result = null;
      },

      reset() {
        return { ...initialResourceState };
      },
    },
  });
}

export type ResourceSlice = ReturnType<typeof createResourceSlice>;
