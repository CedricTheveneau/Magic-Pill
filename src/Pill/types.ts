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
 * The pill's material. `glass` and `liquid` need `magic-pill/themes.css`. Any
 * other string is written to `data-theme` so you can define your own:
 * `[data-mp="pill"][data-theme="paper"] { --mp-surface: … }`.
 */
export type PillTheme = "plain" | "glass" | "liquid" | (string & {});

/**
 * A component that renders a link from an `href`, such as Next's `Link`.
 * React Router's `Link` takes `to`: wrap it.
 */
export type LinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> }
>;

/** How a pill goes from one scene to the next: through the circle, sliding, or at once. */
export type SceneChange = "circle" | "slide" | "none";

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
  ladder?: boolean;
  /**
   * `overlay` only: a click outside the modal does what Escape does (closes
   * the panel if it's open, the modal otherwise). Default `false`.
   */
  closeOnBackdropClick?: boolean;
  /**
   * `overlay` only. `glow` is an animated backdrop, and needs
   * `magic-pill/themes.css`. Any other string is written to `data-backdrop` so
   * you can define your own:
   * `[data-mp="pill"][data-backdrop="dots"]::backdrop { … }`. Default `plain`.
   */
  backdrop?: "plain" | "glow" | (string & {});
  orientation?: PillOrientation;
  /** Default `neutral`. */
  variant?: PillVariant;
  /** The variant picks the colour, the theme the material. Default `plain`. */
  theme?: PillTheme;
  /**
   * A name for what the pill shows. When it changes, the pill doesn't jump to
   * the new content: it closes on the old one and opens on the new one, as
   * between a host's navbar and its notifications.
   */
  scene?: string | number;
  /** How: through the circle (default), sliding in the open pill, or at once. */
  sceneChange?: SceneChange;
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
  /**
   * For several panels in one pill: the trigger whose `panel` is the same
   * opens this one. Default: the pill's only panel, with no name.
   */
  name?: string;
  /** At the end of the title's row, e.g. `<PillAction label="Default" … />`. */
  titleAction?: ReactNode;
  /** In the footer, before the close button, e.g. `<PillAction label="Save" … />`. */
  footer?: ReactNode;
  /** Default "Close". */
  closeLabel?: string;
  /** Default <CloseIcon />. */
  closeIcon?: ReactNode;
  /** Always show the close button's label, not only on hover and focus. Default `false`. */
  closeExpanded?: boolean;
}

export interface PillPanelTriggerProps extends Omit<PillButtonActionProps, "onClick"> {
  /** The `name` of the panel it opens, when the pill has several. */
  panel?: string;
}

export interface PillContextValue {
  presence: PillPresence;
  setPresence: (presence: PillPresence) => void;
  /** Opens the pill's panel, or the one with that name. */
  openPanel: (name?: string) => void;
  /** Back to the level the pill had before its panel opened. */
  closePanel: () => void;
  placement: PillPlacement;
  orientation: PillOrientation;
  variant: PillVariant;
}
