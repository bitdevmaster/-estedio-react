"use client";

import { useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import type { EnhancedStore } from "@reduxjs/toolkit";
import {
  initializeLibConfig,
  type LibraryConfig,
} from "../../config/lib-config";

interface StoreProviderProps<TStore extends EnhancedStore = EnhancedStore> {
  children: ReactNode;
  makeStore: () => TStore;
  provider?: Partial<LibraryConfig>;
}

export function StoreProvider<TStore extends EnhancedStore = EnhancedStore>({
  children,
  makeStore,
  provider,
}: StoreProviderProps<TStore>) {
  const storeRef = useRef<TStore | null>(null);

  if (storeRef.current === null) {
    if (provider) {
      initializeLibConfig(provider);
    }
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
