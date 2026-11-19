"use client"
import { useSyncExternalStore } from "react";

import { EMPTY_STATE, getStore, type PillQueueState } from "./store";

// The server never holds notifications (see store.ts), and hydration must match it
const getServerSnapshot = () => EMPTY_STATE;

/**
 * Headless access to a pill's queue, to build your own host or display
 * (like react-hot-toast's useToaster). <MagicPill> is built on it.
 */
export function usePillQueue(name = "main"): PillQueueState {
  const store = getStore(name);
  return useSyncExternalStore(store.subscribe, store.getState, getServerSnapshot);
}
