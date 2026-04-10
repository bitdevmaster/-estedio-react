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

type FetchAction = PayloadAction<FetchPayload>;

type TokenResponse = {
  access_token: string;
  refresh_token: string;
};

/**
 * Factory that generates worker + watcher sagas for a given resource.
 *
 * Worker behaviour:
 *  1. If force=false and state[resource].result is non-null → call callback
 *     with cached result, skip API call.
 *  2. Otherwise call adapter.execute(resource, payload).
 *  3. Dispatch fetchSuccess / fetchFailure accordingly.
 *  4. Invoke callback(result, error).
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

  const isTokenResponse = (value: unknown): value is TokenResponse => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const maybeToken = value as Record<string, unknown>;
    return (
      typeof maybeToken.access_token === "string" &&
      typeof maybeToken.refresh_token === "string"
    );
  };

  function* persistResponse(result: unknown): Generator {
    if (!meta?.persist || !meta.persistKey || !storage) {
      return;
    }

    const serialized = JSON.stringify(result);
    yield call([storage, storage.setAsync], meta.persistKey, serialized);
  }

  function* workerSaga(action: FetchAction): Generator {
    const { payload: requestPayload, force, callback } = action.payload;

    // Cache check when force is explicitly false
    if (force === false) {
      const currentState = (yield select(
        (state: Record<string, { result: unknown }>) => state[name],
      )) as { result: unknown };

      if (currentState?.result !== null) {
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

      if (meta?.isAuthResource && isTokenResponse(result)) {
        yield call(
          [tokenManager, tokenManager.setTokens],
          result.access_token,
          result.refresh_token,
        );
      }

      yield put(fetchSuccess(result));
      yield* persistResponse(result);
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
