"use client"
// The current page's actions (beta), the design's wide atom: one or more
// actions next to the pill, set by the page that shows (usePillActions), in a
// pill of their own (the satellites' layer places it) or in the pill itself,
// after a divider.
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import PillAction from "../Pill/PillAction";
import { PillActions, PillDivider } from "../Pill/parts";
import { getStore, type PillActionItem } from "../store/store";
import type { SatelliteHost } from "./types";

/**
 * Sets the current page's actions while the calling component is mounted:
 * call it in a page, and they show next to the pill there, and go when the
 * page goes. `null` or none: no actions. Give a stable array (a constant or
 * `useMemo`), or they're set again at every render.
 */
export function usePillActions(items: readonly PillActionItem[] | null, options: { pill?: string } = {}): void {
  const store = getStore(options.pill ?? "main");
  useEffect(() => {
    store.setActions(items);
    // Only if they're still this page's: the next page may have set its own already
    return () => {
      if (store.getActions() === items) store.setActions(null);
    };
  }, [store, items]);
}

/** The host's page actions, as they change. */
export function useHostActions(host: SatelliteHost): readonly PillActionItem[] | null {
  return useSyncExternalStore(host.store.subscribe, host.store.getActions, () => null);
}

/** The actions themselves, as the pill's own: their label on hover and focus, a link or a button. */
export function ActionList({ items, host }: { items: readonly PillActionItem[]; host: SatelliteHost }): ReactNode {
  return (
    <PillActions>
      {items.map((item) =>
        item.href !== undefined ? (
          <PillAction
            key={item.id ?? item.label}
            icon={item.icon}
            label={item.label}
            expanded={item.expanded}
            href={item.href}
            linkComponent={host.linkComponent}
            onClick={item.onClick}
          />
        ) : (
          <PillAction key={item.id ?? item.label} icon={item.icon} label={item.label} expanded={item.expanded} onClick={item.onClick} />
        ),
      )}
    </PillActions>
  );
}

/** In the pill itself (`actionsStyle="inside"`): the actions, then a divider (the other way round on the end side). */
export function InsideActions({ host }: { host: SatelliteHost }) {
  const items = useHostActions(host);
  if (!items) return null;
  const list = <ActionList items={items} host={host} />;
  return host.actionsSide === "end" ? (
    <>
      <PillDivider />
      {list}
    </>
  ) : (
    <>
      {list}
      <PillDivider />
    </>
  );
}
