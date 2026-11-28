// No "use client" and no React: the store and pill() can be imported from any
// module and called from anywhere on the client, including outside React.
import type { ReactNode } from "react";

import type { PillVariant } from "../Pill/types";
import type { NotificationLayout, PillNotificationProps } from "../PillNotification/PillNotification";
import { devWarn } from "../utils/react";

export type DismissReason = "timeout" | "action" | "dismissed" | "cleared";

interface NotifyCommon {
  /**
   * Reusing the id of a queued or visible notification updates it in place
   * (e.g. "Saving…" → "Saved") instead of queueing a new one.
   */
  id?: string;
  variant?: PillVariant;
  /**
   * Milliseconds the notification stays once fully shown. Default: the host's
   * `duration` (5000). `Infinity` keeps it until dismissed. The countdown
   * pauses on hover, focus, an open panel and a hidden browser tab, and
   * starts again from the full duration afterwards.
   */
  duration?: number;
  /**
   * What screen readers announce. Default: the text of the message (or of the
   * whole pill for a `render` notification). `false` announces nothing.
   */
  announce?: string | false;
  /** This notification's layout, instead of the host's `notificationLayout`. */
  layout?: NotificationLayout;
  /**
   * `flag` only: the navbar item it's about (its `href`), to come out next to
   * it, matched as the navbar matches the current page. Default: the middle
   * of the sidebar.
   */
  at?: string;
  onDismiss?: (id: string, reason: DismissReason) => void;
}

/** The built-in notification template, as data. */
export interface NotifyOptions extends NotifyCommon, Omit<PillNotificationProps, "linkComponent" | "classNames"> {
  render?: undefined;
}

/** Your own template, with the queue, timing and animation of the host. */
export interface NotifyRenderOptions extends NotifyCommon {
  render: (notification: { id: string; dismiss: () => void }) => ReactNode;
}

export type NotifyInput = NotifyOptions | NotifyRenderOptions;

export interface QueuedNotification {
  readonly id: string;
  readonly input: NotifyInput;
}

export interface PillQueueState {
  /** The notification the pill shows (or is about to show). */
  readonly current: QueuedNotification | null;
  /** The ones waiting behind it, first in, first out. */
  readonly queued: readonly QueuedNotification[];
}

/**
 * An electron (beta): a small round pill that splits out of the host to keep
 * a background activity (a timer, an upload…) in reach while the person goes
 * elsewhere in the app. Shown by `magic-pill/satellites`, passed to the host.
 */
export interface ElectronOptions {
  /** Its accessible name, e.g. "Focus timer". */
  label: string;
  /** A short live text, e.g. "4:34" or "64%". */
  value?: string;
  /**
   * What screen readers read for the value, e.g. "4 minutes left". Default:
   * `value`. Round it, so that the name doesn't change every second.
   */
  valueText?: string;
  /** An icon; with `progress` and no `value`, it sits inside the ring. */
  icon?: ReactNode;
  /** 0 to 1: draws a progress ring around its content. */
  progress?: number;
  variant?: PillVariant;
  /** Where it came from: a tap goes back there. Default: the path it was started on. */
  href?: string;
  /** Instead of going back: what a tap does. */
  onClick?: (event: { preventDefault(): void }) => void;
  /** Tucked into the pill while the current path is its `href` (needs the host's `pathname`). Default true. */
  hideOnOrigin?: boolean;
  /** How it leaves when it ends: back into the pill ("join") or scaling out ("pop"). Default: the host's. */
  ending?: "join" | "pop";
  /** Said once by screen readers whenever it changes, for a milestone ("Break time"). */
  announce?: string;
  /** Your own content instead of the ring, the value and the icon. */
  render?: () => ReactNode;
  /** Starting an electron with an id that's already there updates it in place. */
  id?: string;
}

export interface Electron {
  readonly id: string;
  readonly input: ElectronOptions;
  /** Where a tap takes the person back to: its `href`, or the path it was started on */
  readonly origin: string | undefined;
}

export interface PillController {
  readonly name: string;
  /**
   * Queue a notification (first in, first out). Returns its id.
   * Calls made before the host mounts are kept and shown once it mounts.
   */
  notify: (input: NotifyInput) => string;
  update: (id: string, patch: Partial<NotifyOptions>) => void;
  /** Dismiss one notification, or the visible one when called without an id. */
  dismiss: (id?: string) => void;
  /** Empty the queue and dismiss the visible notification. */
  clear: () => void;
  /** Start an electron (beta, `magic-pill/satellites`). Returns its id. */
  electron: (input: ElectronOptions) => string;
  /** Change an electron's options, e.g. its value every second. */
  updateElectron: (id: string, patch: Partial<ElectronOptions>) => void;
  /** End an electron: it joins back into the pill (or pops away). */
  endElectron: (id: string) => void;
}

/** One named pill's queue. Internal: the host uses more than the controller exposes. */
export interface PillStore {
  getState: () => PillQueueState;
  subscribe: (listener: () => void) => () => void;
  notify: (input: NotifyInput) => string;
  update: (id: string, patch: Partial<NotifyOptions>) => void;
  dismiss: (id: string | undefined, reason: DismissReason) => void;
  clear: () => void;
  /** Counts mounted hosts, to warn about two hosts with the same name. Returns the cleanup. */
  registerHost: () => () => void;
  getElectrons: () => readonly Electron[];
  electron: (input: ElectronOptions) => string;
  updateElectron: (id: string, patch: Partial<ElectronOptions>) => void;
  endElectron: (id: string) => void;
}

export const NO_ELECTRONS: readonly Electron[] = Object.freeze([]);

export const EMPTY_STATE: PillQueueState = Object.freeze({ current: null, queued: Object.freeze([]) });

let lastId = 0;

// On the server, a module-level queue would be shared by every request
const isServer = () => typeof document === "undefined";

function createStore(name: string): PillStore {
  let items: readonly QueuedNotification[] = [];
  let state: PillQueueState = EMPTY_STATE;
  let hosts = 0;
  let electrons: readonly Electron[] = NO_ELECTRONS;
  const listeners = new Set<() => void>();
  const setElectrons = (next: readonly Electron[]) => {
    electrons = next.length === 0 ? NO_ELECTRONS : next;
    listeners.forEach((listener) => listener());
  };

  const commit = (next: readonly QueuedNotification[]) => {
    items = next;
    state = next.length === 0 ? EMPTY_STATE : { current: next[0], queued: next.slice(1) };
    listeners.forEach((listener) => listener());
  };

  const replace = (id: string, input: NotifyInput) =>
    commit(items.map((item) => (item.id === id ? { id, input } : item)));

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    notify(input) {
      const id = input.id ?? `mp-${++lastId}`;
      if (isServer()) {
        devWarn(`pill("${name}").notify() was called on the server and does nothing: call it from client code.`);
        return id;
      }
      if (items.some((item) => item.id === id)) {
        replace(id, input);
      } else {
        commit([...items, { id, input }]);
      }
      return id;
    },

    update(id, patch) {
      const item = items.find((queued) => queued.id === id);
      if (item) {
        replace(id, { ...item.input, ...patch } as NotifyInput);
      }
    },

    dismiss(id, reason) {
      const item = id === undefined ? items[0] : items.find((queued) => queued.id === id);
      if (!item) return;
      commit(items.filter((queued) => queued !== item));
      item.input.onDismiss?.(item.id, reason);
    },

    clear() {
      const dismissed = items;
      if (dismissed.length === 0) return;
      commit([]);
      dismissed.forEach((item) => item.input.onDismiss?.(item.id, "cleared"));
    },

    getElectrons: () => electrons,

    electron(input) {
      const id = input.id ?? `mp-${++lastId}`;
      if (isServer()) {
        devWarn(`pill("${name}").electron() was called on the server and does nothing: call it from client code.`);
        return id;
      }
      const existing = electrons.find((electron) => electron.id === id);
      if (existing) {
        setElectrons(electrons.map((electron) => (electron === existing ? { ...existing, input } : electron)));
      } else {
        setElectrons([...electrons, { id, input, origin: input.href ?? window.location.pathname }]);
      }
      return id;
    },

    updateElectron(id, patch) {
      const existing = electrons.find((electron) => electron.id === id);
      if (existing) {
        setElectrons(electrons.map((electron) => (electron === existing ? { ...existing, input: { ...existing.input, ...patch } } : electron)));
      }
    },

    endElectron(id) {
      if (electrons.some((electron) => electron.id === id)) setElectrons(electrons.filter((electron) => electron.id !== id));
    },

    registerHost() {
      hosts += 1;
      if (hosts > 1) {
        devWarn(`Several <MagicPill name="${name}"> are mounted. Give each one its own name.`);
      }
      return () => {
        hosts -= 1;
      };
    },
  };
}

const stores = new Map<string, PillStore>();

/** The store of the pill with this name, created on first use. */
export function getStore(name: string): PillStore {
  let store = stores.get(name);
  if (!store) {
    store = createStore(name);
    stores.set(name, store);
  }
  return store;
}

const controllers = new Map<string, PillController>();

/** Control the <MagicPill> with this name (default "main") from anywhere. */
export function pill(name = "main"): PillController {
  let controller = controllers.get(name);
  if (!controller) {
    const store = getStore(name);
    controller = Object.freeze({
      name,
      notify: (input: NotifyInput) => store.notify(input),
      update: (id: string, patch: Partial<NotifyOptions>) => store.update(id, patch),
      dismiss: (id?: string) => store.dismiss(id, "dismissed"),
      clear: () => store.clear(),
      electron: (input: ElectronOptions) => store.electron(input),
      updateElectron: (id: string, patch: Partial<ElectronOptions>) => store.updateElectron(id, patch),
      endElectron: (id: string) => store.endElectron(id),
    });
    controllers.set(name, controller);
  }
  return controller;
}

/** Tests only: forget every store. */
export function resetStores(): void {
  stores.clear();
  controllers.clear();
}
