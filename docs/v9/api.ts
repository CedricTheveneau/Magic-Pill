/**
 * Magic Pill v9: proposed public API (declarations only, no implementation).
 *
 * This file is the typed half of `api-proposal.md`. `examples.tsx` is written
 * against it as if it were the published `magic-pill` package, and both are
 * typechecked with `npx tsc -p docs/v9`.
 *
 * Layers (VISION.md §6):
 *   1. Primitive: <Pill> and its parts, usePill()
 *   2. Templates: <PillNotification>, <PillNavbar> (plain compositions of layer 1)
 *   3. Controllers: <MagicPill> host + pill(name) + usePillQueue(name)
 */
import type {
  AnchorHTMLAttributes,
  ComponentPropsWithoutRef,
  ComponentType,
  JSX,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared vocabulary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How much room the pill takes (VISION §2.6). The pill animates between levels.
 * - `hidden`: not shown, and out of the accessibility tree (Y5)
 * - `rest`: a circle showing only the leading icon
 * - `compact`: the pill; actions show their icon only
 * - `expanded`: the pill; every action shows icon + label
 * - `panel`: the pill grows into a panel showing its <PillPanel>
 */
export type PillPresence = "hidden" | "rest" | "compact" | "expanded" | "panel";

/**
 * Where the pill sits.
 * - Edges and corners are `position: fixed`; `start`/`end` follow the text direction.
 * - `inline` stays in the normal page flow.
 * - `overlay` is a modal: a native <dialog> opened with showModal()
 *   (focus trap, Escape, inert background, no dependency).
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
 * Used instead of a plain <a> so client-side routers don't reload the page (L8).
 * React Router's `Link` takes `to`: wrap it (see examples.tsx).
 */
export type LinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> }
>;

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1: the primitive
// ─────────────────────────────────────────────────────────────────────────────
// Parts are separate named exports, not `Pill.Icon`: a Server Component can't
// "dot into" a client module, so compound statics would break RSC usage.

export interface PillProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children?: ReactNode;
  /** Controlled presence. */
  presence?: PillPresence;
  /** Uncontrolled initial presence. Default `compact`. */
  defaultPresence?: PillPresence;
  /** Called when the pill asks to change level (panel trigger, close button, Escape). */
  onPresenceChange?: (presence: PillPresence) => void;
  /** Default `inline` on <Pill>, `bottom` on <MagicPill>. */
  placement?: PillPlacement;
  orientation?: PillOrientation;
  /** Default `neutral`. */
  variant?: PillVariant;
  /** Keeps the behaviour and the data attributes, drops the visual styles. */
  unstyled?: boolean;
  ref?: Ref<HTMLElement>;
}

/** The container: shape, surface, elevation, placement and shape animation. */
export declare function Pill(props: PillProps): JSX.Element;

/** The leading icon. Decorative (`aria-hidden`) unless you give it a `label`. */
export declare function PillIcon(
  props: ComponentPropsWithoutRef<"span"> & { label?: string },
): JSX.Element;

/** The thin vertical line between the icon and the message. */
export declare function PillDivider(props: ComponentPropsWithoutRef<"span">): JSX.Element;

/** The message, in the italic serif. Accepts any content. */
export declare function PillMessage(props: ComponentPropsWithoutRef<"div">): JSX.Element;

/** A row (or column, when vertical) of actions. */
export declare function PillActions(props: ComponentPropsWithoutRef<"div">): JSX.Element;

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
 * Only relative, `http(s):`, `mailto:` and `tel:` URLs are rendered; anything
 * else (e.g. `javascript:`) renders no link and warns in development (L16).
 */
export interface PillLinkActionProps
  extends PillActionBase,
    Omit<ComponentPropsWithoutRef<"a">, "children" | "href"> {
  href: string;
  linkComponent?: LinkComponent;
}

export type PillActionProps = PillButtonActionProps | PillLinkActionProps;

/** The light round button: icon at rest, icon + bold label when expanded. */
export declare function PillAction(props: PillActionProps): JSX.Element;

export interface PillPanelProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title?: ReactNode;
  /** Default "Close". */
  closeLabel?: string;
  /** Default <CloseIcon />. */
  closeIcon?: ReactNode;
}

/**
 * Content shown when the pill's presence is `panel`. Labelled by its title,
 * receives focus when it opens, and returns focus to the trigger on close.
 */
export declare function PillPanel(props: PillPanelProps): JSX.Element;

/** An action that opens the pill's panel, with `aria-expanded`/`aria-controls` wired (Y4). */
export declare function PillPanelTrigger(props: Omit<PillButtonActionProps, "onClick">): JSX.Element;

export interface PillContextValue {
  presence: PillPresence;
  setPresence: (presence: PillPresence) => void;
  placement: PillPlacement;
  orientation: PillOrientation;
  variant: PillVariant;
}

/** Read and drive the enclosing <Pill>: what you need to write your own template. */
export declare function usePill(): PillContextValue;

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2: templates
// ─────────────────────────────────────────────────────────────────────────────
// A template renders *inside* a <Pill> (or a <MagicPill>, which owns one), so
// the host can swap its content while keeping the same container to animate.

/** Same rules as the matching <PillAction> props. */
export type NotificationAction =
  | {
      icon?: ReactNode;
      label: string;
      /**
       * Inside a <MagicPill>, clicking an action dismisses the notification.
       * Call `event.preventDefault()` to keep it open.
       */
      onClick: (event: MouseEvent<HTMLButtonElement>) => void;
      href?: undefined;
    }
  | { icon?: ReactNode; label: string; href: string; onClick?: undefined };

export interface NotificationPanel {
  title?: ReactNode;
  content: ReactNode;
  /** The action that opens the panel. Default `{ icon: <PlusIcon />, label: "Learn more" }`. */
  trigger?: { icon?: ReactNode; label: string };
  /** Default "Close". */
  closeLabel?: string;
}

export interface PillNotificationClassNames {
  icon?: string;
  divider?: string;
  message?: string;
  actions?: string;
  action?: string;
  panel?: string;
}

export interface PillNotificationProps {
  icon?: ReactNode;
  /** Any content: strings, emphasis, live data. Never parsed as HTML (L3). */
  message: ReactNode;
  action?: NotificationAction;
  panel?: NotificationPanel;
  linkComponent?: LinkComponent;
  classNames?: PillNotificationClassNames;
}

/** Icon · divider · message · action, and an optional expandable panel. */
export declare function PillNotification(props: PillNotificationProps): JSX.Element;

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  /**
   * How the item matches the current `pathname`. Default `prefix`, on whole
   * path segments (`/blog` matches `/blog/post`, not `/blogroll`); `/` is
   * always exact. The longest match wins, so only one item is active (L8).
   */
  match?: "exact" | "prefix" | ((pathname: string) => boolean);
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

/** A <nav> of icon links; the active one shows its label and gets `aria-current="page"`. */
export declare function PillNavbar(props: PillNavbarProps): JSX.Element;

// ─────────────────────────────────────────────────────────────────────────────
// Layer 3: controllers (store, imperative API, host)
// ─────────────────────────────────────────────────────────────────────────────
// The store and pill() live in a module *without* "use client": callable from
// any client code, including outside React. On the server they do nothing
// (and warn in development), so no notification leaks between requests.

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
   * pauses on hover, focus, an open panel and a hidden browser tab.
   */
  duration?: number;
  /**
   * What screen readers announce. Default: the text content of the message.
   * `false` announces nothing.
   */
  announce?: string | false;
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
}

/** Control the <MagicPill> with this name (default "main") from anywhere. */
export declare function pill(name?: string): PillController;

export interface PillQueueState {
  readonly current: QueuedNotification | null;
  readonly queued: readonly QueuedNotification[];
}

/** Headless access to a pill's queue, to build your own host (like react-hot-toast's useToaster). */
export declare function usePillQueue(name?: string): PillQueueState;

export interface MagicPillProps
  extends Omit<PillProps, "presence" | "defaultPresence" | "onPresenceChange" | "children"> {
  /** Default "main". Two hosts with the same name warn in development. */
  name?: string;
  /**
   * The base layer (e.g. a <PillNavbar>), shown whenever no notification is.
   * Notifications take the pill over, then it returns to this content (A2).
   */
  children?: ReactNode;
  /** Default display time for notifications, in ms. Default 5000. */
  duration?: number;
  /** With no base layer and nothing queued: hide (default) or rest as a circle. */
  idle?: "hidden" | "rest";
  /** The icon shown when `idle="rest"`. */
  idleIcon?: ReactNode;
  /** Passed to notification actions that have an `href`. */
  linkComponent?: LinkComponent;
  classNames?: PillNotificationClassNames;
}

/**
 * The batteries-included pill: a <Pill> + the store + the notification
 * template, with an always-mounted live region for announcements (Y1, Y5).
 */
export declare function MagicPill(props: MagicPillProps): JSX.Element;

// ─────────────────────────────────────────────────────────────────────────────
// Icons: plain components, server-safe (no "use client"), tree-shakeable.
// `currentColor`, sized by CSS, `aria-hidden` and `focusable="false"` by default.
// ─────────────────────────────────────────────────────────────────────────────

export type IconProps = ComponentPropsWithoutRef<"svg">;

export declare function ArrowIcon(props: IconProps): JSX.Element;
export declare function BoxIcon(props: IconProps): JSX.Element;
export declare function CheckIcon(props: IconProps): JSX.Element;
export declare function CloseIcon(props: IconProps): JSX.Element;
export declare function CouponIcon(props: IconProps): JSX.Element;
export declare function DocumentIcon(props: IconProps): JSX.Element;
export declare function HelpIcon(props: IconProps): JSX.Element;
export declare function InfoIcon(props: IconProps): JSX.Element;
export declare function MailIcon(props: IconProps): JSX.Element;
export declare function PhoneIcon(props: IconProps): JSX.Element;
export declare function PlusIcon(props: IconProps): JSX.Element;
export declare function UndoIcon(props: IconProps): JSX.Element;
