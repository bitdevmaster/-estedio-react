import {
  configureStore,
  combineReducers,
  type EnhancedStore,
} from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import type { ResourceSlice } from "./create-resource-slice";

type SliceMap = Record<string, ResourceSlice>;

/**
 * Assembles a configured Redux store from a slice map and a root saga.
 *
 * Extracted from createResources so that store construction is a single
 * focused responsibility — slices and sagas are wired here, hydration
 * remains in the calling factory.
 *
 * @internal — not part of the public API; used by createResources.
 */
export function assembleReduxStore(
  slices: SliceMap,
  rootSaga: () => Generator,
): EnhancedStore {
  const rootReducer = combineReducers(
    Object.fromEntries(
      Object.entries(slices).map(([name, slice]) => [name, slice.reducer]),
    ),
  );

  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: { ignoredActionPaths: ["payload.callback"] },
      }).concat(sagaMiddleware),
  });

  sagaMiddleware.run(rootSaga);

  return store;
}
