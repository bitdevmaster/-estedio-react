"use client";

import { useRef, type ReactNode } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  initializeLibConfig,
  type LibraryConfig,
} from "../../config/lib-config";

interface TanstackProviderProps {
  children: ReactNode;
  /** Pre-configured QueryClient instance to pass to QueryClientProvider. */
  queryClient: QueryClient;
  /**
   * Library configuration to apply on mount.
   * Mirrors the provider prop on StoreProvider (Redux) and ZustandProvider
   * so all three adapters have an identical config-initialisation story.
   */
  provider?: Partial<LibraryConfig>;
}

/**
 * Provider for the TanStack Query adapter.
 *
 * Wraps QueryClientProvider and calls initializeLibConfig once on first
 * render — the same behaviour as StoreProvider (Redux) and ZustandProvider.
 * Applications that already call initializeLibConfig manually and manage
 * their own QueryClientProvider do not need this wrapper.
 */
export function TanstackProvider({
  children,
  queryClient,
  provider,
}: TanstackProviderProps) {
  const initializedRef = useRef(false);

  if (!initializedRef.current) {
    if (provider) {
      initializeLibConfig(provider);
    }
    initializedRef.current = true;
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
