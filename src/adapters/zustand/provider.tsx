"use client";

import { useRef, type ReactNode } from "react";
import {
  initializeLibConfig,
  type LibraryConfig,
} from "../../config/lib-config";

interface ZustandProviderProps {
  children: ReactNode;
  /**
   * Library configuration to apply on mount.
   * Mirrors the provider prop on StoreProvider (Redux) so all three
   * adapters have an identical config-initialisation story.
   */
  provider?: Partial<LibraryConfig>;
}

/**
 * Optional provider for the Zustand adapter.
 *
 * Calls initializeLibConfig once on first render — the same behaviour
 * as StoreProvider for the Redux adapter.  Applications that already
 * call initializeLibConfig manually do not need this wrapper.
 */
export function ZustandProvider({ children, provider }: ZustandProviderProps) {
  const initializedRef = useRef(false);

  if (!initializedRef.current) {
    if (provider) {
      initializeLibConfig(provider);
    }
    initializedRef.current = true;
  }

  return <>{children}</>;
}
