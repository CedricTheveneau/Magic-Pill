"use client"
import { forwardRef, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";

import { PillActions } from "../Pill/parts";
import PillAction from "../Pill/PillAction";
import { PillPanelTrigger } from "../Pill/PillPanel";
import type { LinkComponent } from "../Pill/types";
import { findActiveIndex, type NavMatch } from "./matchPath";
import { useRoom, type NavLabels } from "./room";
import { mergeRefs } from "../utils/react";

interface NavItemBase {
  label: string;
  icon?: ReactNode;
}

/** A link to a page: the current one shows its label. */
export interface NavLinkItem extends NavItemBase {
  href: string;
  /**
   * How the item matches the current `pathname`. Default `prefix`, on whole
   * path segments (`/blog` matches `/blog/post`, not `/blogroll`); `/` is
   * always exact. The longest match wins, so only one item is active.
   */
  match?: NavMatch;
  onClick?: undefined;
  panel?: undefined;
}

/** A button. */
export interface NavActionItem extends NavItemBase {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Always show the label, not only on hover and focus. */
  expanded?: boolean;
  href?: undefined;
  panel?: undefined;
}

/** A button that opens the panel with that `name`, next to the navbar in the pill. */
export interface NavPanelItem extends NavItemBase {
  panel: string;
  /** Always show the label, not only on hover and focus. */
  expanded?: boolean;
  href?: undefined;
  onClick?: undefined;
}

export type NavItem = NavLinkItem | NavActionItem | NavPanelItem;

export interface PillNavbarProps extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  items: readonly NavItem[];
  /**
   * The current path, e.g. Next's `usePathname()`. Without it, the navbar
   * reads `window.location.pathname` after mounting and on `popstate`, which
   * misses client-side navigations.
   */
  pathname?: string;
  linkComponent?: LinkComponent;
  /**
   * Which labels show at rest: the current page's ("current"), none
   * ("closed"), or the current page's while the pill has room for it
   * ("auto", the default: it folds next to an electron on a narrow screen).
   * An item pointed at or focused shows its label in every case.
   */
  labels?: NavLabels;
  /** Default "Main". */
  "aria-label"?: string;
}

/** Without a `pathname` prop: the browser's path, read after mounting (no hydration mismatch). */
function useLocationPathname(enabled: boolean): string | undefined {
  const [pathname, setPathname] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!enabled) return;
    const update = () => setPathname(window.location.pathname);
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [enabled]);
  return pathname;
}

const isLink = (item: NavItem): item is NavLinkItem => item.href !== undefined;

/**
 * A <nav> of icon links, actions and panel triggers. The active link shows its
 * label and gets `aria-current="page"`. Render it inside a <Pill>, or as the base layer of a <MagicPill>.
 */
export const PillNavbar = forwardRef<HTMLElement, PillNavbarProps>(function PillNavbar(
  { items, pathname, linkComponent, labels = "auto", "aria-label": ariaLabel = "Main", ...rest },
  forwardedRef,
) {
  const navRef = useRef<HTMLElement | null>(null);
  const ref = useMemo(() => mergeRefs(navRef, forwardedRef), [forwardedRef]);
  useRoom(navRef, labels);
  const locationPathname = useLocationPathname(pathname === undefined);
  const links = items.filter(isLink);
  const active = links[findActiveIndex(pathname ?? locationPathname, links)];

  const renderItem = (item: NavItem) => {
    const { label, icon } = item;
    if (item.panel !== undefined) {
      return <PillPanelTrigger key={`panel ${item.panel}`} panel={item.panel} icon={icon} label={label} expanded={item.expanded} />;
    }
    if (item.onClick !== undefined) {
      return <PillAction key={`action ${label}`} icon={icon} label={label} expanded={item.expanded} onClick={item.onClick} />;
    }
    return (
      <PillAction
        key={item.href}
        icon={icon}
        label={label}
        href={item.href}
        linkComponent={linkComponent}
        aria-current={item === active ? "page" : undefined}
        // The item's own href, as given: a sidebar's flag finds its section by it
        // (the rendered one may carry the app's base path)
        data-href={item.href}
      />
    );
  };

  return (
    <nav aria-label={ariaLabel} {...rest} ref={ref} data-mp="navbar" data-labels={labels}>
      <PillActions>{items.map(renderItem)}</PillActions>
    </nav>
  );
});
