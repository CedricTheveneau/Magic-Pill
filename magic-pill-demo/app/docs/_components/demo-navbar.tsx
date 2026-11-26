"use client";
import { createContext, useContext, useMemo, useState, type AnchorHTMLAttributes, type ReactNode, type Ref } from "react";
import { PillNavbar, type NavItem } from "magic-pill";

const SetPathname = createContext<(href: string) => void>(() => {});

/** A link that doesn't leave the page: it makes its item the current one. */
function DemoLink({ href, onClick, ref, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> }) {
  const setPathname = useContext(SetPathname);
  return (
    <a
      {...props}
      ref={ref}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
        setPathname(href);
      }}
    />
  );
}

/**
 * A navbar for the examples, with its own current page: its links switch it
 * instead of navigating. Self-contained, so it works inline in a <Pill> and in
 * the main pill alike. `children` go next to it (its panels).
 */
export function DemoNavbar({
  items,
  pathname: initial,
  label = "Example",
  children,
}: {
  items: readonly NavItem[];
  pathname: string;
  label?: string;
  children?: ReactNode;
}) {
  const [pathname, setPathname] = useState(initial);
  // The current page follows the prop when an example changes it
  const [previous, setPrevious] = useState(initial);
  if (previous !== initial) {
    setPrevious(initial);
    setPathname(initial);
  }
  const set = useMemo(() => (href: string) => setPathname(href), []);
  return (
    <SetPathname.Provider value={set}>
      <PillNavbar items={items} pathname={pathname} linkComponent={DemoLink} aria-label={label} />
      {children}
    </SetPathname.Provider>
  );
}
