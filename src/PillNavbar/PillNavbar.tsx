"use client"
import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { PillActions } from "../Pill/parts";
import PillAction from "../Pill/PillAction";
import type { LinkComponent } from "../Pill/types";
import { findActiveIndex, type NavMatch } from "./matchPath";

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  /**
   * How the item matches the current `pathname`. Default `prefix`, on whole
   * path segments (`/blog` matches `/blog/post`, not `/blogroll`); `/` is
   * always exact. The longest match wins, so only one item is active.
   */
  match?: NavMatch;
}

export interface PillNavbarProps extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  items: readonly NavItem[];
  /**
   * The current path, e.g. Next's `usePathname()`. Without it, the navbar
   * reads `window.location.pathname` after mounting and on `popstate`, which
   * misses client-side navigations.
   */
  pathname?: string;
  linkComponent?: LinkComponent;
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

/**
 * A <nav> of icon links. The active one shows its label and gets
 * `aria-current="page"`. Render it inside a <Pill>, or as the base layer of a <MagicPill>.
 */
export const PillNavbar = forwardRef<HTMLElement, PillNavbarProps>(function PillNavbar(
  { items, pathname, linkComponent, "aria-label": ariaLabel = "Main", ...rest },
  ref,
) {
  const locationPathname = useLocationPathname(pathname === undefined);
  const activeIndex = findActiveIndex(pathname ?? locationPathname, items);

  return (
    <nav aria-label={ariaLabel} {...rest} ref={ref} data-mp="navbar">
      <PillActions>
        {items.map((item, index) => (
          <PillAction
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            linkComponent={linkComponent}
            aria-current={index === activeIndex ? "page" : undefined}
          />
        ))}
      </PillActions>
    </nav>
  );
});
