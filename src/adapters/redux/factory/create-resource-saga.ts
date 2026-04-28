import {
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest,
  type ForkEffect,
} from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IApiPort } from "../../../core/ports/api.port";
import type {
  ResourceConfigMeta,
  SagaEffect,
} from "../../../core/entities/resource.entity";
import type { ResourceSlice } from "./create-resource-slice";
import type { FetchPayload } from "./resource.types";
import type { IStoragePort } from "../../../core/ports/storage.port";
import { tokenManager } from "../../../http/client/token-manager";
import { shouldSkipFetch } from "../../../state/behaviors/cache.behavior";
import {
  isTokenResponse,
  saveAuthTokens,
} from "../../../state/behaviors/auth.behavior";
import { persistResult } from "../../../state/behaviors/persist.behavior";

type FetchAction = PayloadAction<FetchPayload>;

/**
 * Factory that generates worker + watcher sagas for a given resource.
 *
 * Worker behaviour:
 *  1. If force=false and state[resource].result is non-null → return cached
 *     result via callback, skip API call.
 *  2. Otherwise call adapter.execute(resource, payload).
 *  3. Dispatch fetchSuccess / fetchFailure accordingly.
 *  4. Invoke callback(result, error).
 *
 * Cross-cutting behaviours (cache-hit check, token saving, persistence)
 * are delegated to the shared state/behaviors layer so the same logic
 * is not duplicated across the Zustand and TanStack adapters.
 */
export function createResourceSaga(
  name: string,
  slice: ResourceSlice,
  adapter: IApiPort,
  effect: SagaEffect = "takeLatest",
  meta?: ResourceConfigMeta,
  storage?: IStoragePort,
): ForkEffect {
  if (meta?.persist) {
    if (!meta.persistKey) {
      throw new Error(
        `[createResourceSaga] Resource "${name}" has persist=true but no persistKey.`,
      );
    }

    if (!storage) {
      throw new Error(
        `[createResourceSaga] Resource "${name}" has persist=true but no storage adapter was injected.`,
      );
    }
  }

  const { fetch, fetchSuccess, fetchFailure } = slice.actions;

  function* workerSaga(action: FetchAction): Generator {
    const { payload: requestPayload, force, callback } = action.payload;

    // Cache-hit check — delegates condition to shared behavior.
    if (force === false) {
      const currentState = (yield select(
        (state: Record<string, { result: unknown }>) => state[name],
      )) as { result: unknown };

      if (shouldSkipFetch(force, currentState?.result)) {
        callback?.(currentState.result, null);
        return;
      }
    }

    try {
      const result = (yield call(
        adapter.execute.bind(adapter),
        name,
        requestPayload,
      )) as unknown;

      // Auth token handling — delegates to shared behavior via saga call effect.
      if (meta?.isAuthResource && isTokenResponse(result)) {
        yield call(saveAuthTokens, tokenManager, result, meta.isAuthResource);
      }

      yield put(fetchSuccess(result));

      // Persistence — delegates to shared behavior via saga call effect.
      yield call(persistResult, meta, storage, result);

      callback?.(result, null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      yield put(fetchFailure(message));
      callback?.(null, error);
    }
  }

  function* watcherSaga(): Generator {
    const actionType = fetch.type;
    if (effect === "takeEvery") {
      yield takeEvery(actionType, workerSaga);
    } else {
      yield takeLatest(actionType, workerSaga);
    }
  }

  return fork(watcherSaga);
}
