import type {
  AnchorHTMLAttributes,
  ComponentPropsWithoutRef,
  ComponentType,
  ReactNode,
  Ref,
} from "react";

/**
 * How much room the pill takes. The pill animates between levels.
 * - `hidden`: not shown, and out of the accessibility tree
 * - `rest`: a circle showing only the leading icon
 * - `compact`: the pill; actions show their icon only
 * - `expanded`: the pill; every action shows icon + label
 * - `panel`: the pill grows into a panel showing its <PillPanel>
 */
export type PillPresence = "hidden" | "rest" | "compact" | "expanded" | "panel";

/**
 * Where the pill sits.
 * - Edges are `position: fixed`; `start`/`end` follow the text direction.
 * - `inline` stays in the normal page flow.
 * - `overlay` is a modal: a native <dialog> opened with showModal().
 */
export type PillPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right"
  | "inline"
  | "overlay";

/** Defaults to `vertical` for `left`/`right`, `horizontal` everywhere else. */
export type PillOrientation = "horizontal" | "vertical";

/**
 * Colour scheme. Any other string is written to `data-variant` so you can
 * define your own: `[data-mp="pill"][data-variant="brand"] { --mp-surface: … }`.
 */
export type PillVariant = "neutral" | "success" | "danger" | (string & {});

/**
 * A component that renders a link from an `href`, such as Next's `Link`.
 * React Router's `Link` takes `to`: wrap it.
 */
export type LinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> }
>;

export interface PillProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children?: ReactNode;
  /** Controlled presence. */
  presence?: PillPresence;
  /** Uncontrolled initial presence. Default `compact`. */
  defaultPresence?: PillPresence;
  /** Called when the pill asks to change level (panel trigger, close button, Escape, backdrop click). */
  onPresenceChange?: (presence: PillPresence) => void;
  /** Default `inline`. */
  placement?: PillPlacement;
  /**
   * Fixed placements only: pills with the same placement line up one after
   * the other, the first one set up keeping its spot. `false` leaves this
   * pill out: it stays in its spot and the others ignore it. Default `true`.
   */
  stack?: boolean;
  /**
   * `overlay` only: a click outside the modal does what Escape does (closes
   * the panel if it's open, the modal otherwise). Default `false`.
   */
  closeOnBackdropClick?: boolean;
  orientation?: PillOrientation;
  /** Default `neutral`. */
  variant?: PillVariant;
  /** Keeps the behaviour and the data attributes, drops the visual styles. */
  unstyled?: boolean;
}

interface PillActionBase {
  /** Shown at every level. */
  icon?: ReactNode;
  /**
   * Always required: it's the accessible name when only the icon shows.
   * Visible on hover and focus, when `aria-current`/`expanded` is set, or at
   * the `expanded` and `panel` levels.
   */
  label: string;
  /** Force the label to show. */
  expanded?: boolean;
}

/** An action that runs code: renders a <button>. */
export interface PillButtonActionProps
  extends PillActionBase,
    Omit<ComponentPropsWithoutRef<"button">, "children"> {
  href?: undefined;
}

/**
 * An action that navigates: renders `linkComponent` (default <a>).
 * Only relative, `http(s):`, `mailto:` and `tel:` URLs are rendered.
 */
export interface PillLinkActionProps
  extends PillActionBase,
    Omit<ComponentPropsWithoutRef<"a">, "children" | "href"> {
  href: string;
  linkComponent?: LinkComponent;
}

export type PillActionProps = PillButtonActionProps | PillLinkActionProps;

export interface PillPanelProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title?: ReactNode;
  /** Default "Close". */
  closeLabel?: string;
  /** Default <CloseIcon />. */
  closeIcon?: ReactNode;
}

export interface PillContextValue {
  presence: PillPresence;
  setPresence: (presence: PillPresence) => void;
  placement: PillPlacement;
  orientation: PillOrientation;
  variant: PillVariant;
}
