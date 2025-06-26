import type { MagicPillNotification } from "./notification";
import type { MagicPillNavbar } from "./navbar";

export type Mode = "navbar" | "notification";

// All available notification icons
export type NotificationIcon = 
  | "info" 
  | "checkmark" 
  | "questionmark" 
  | "coupon" 
  | "";

// All available CTA icons
export type CTAIcon = 
  | "arrow" 
  | "box" 
  | "checkmark" 
  | "cross" 
  | "info" 
  | "mail" 
  | "plus" 
  | "quotation" 
  | "tel" 
  | "undo" 
  | ""; 

/**
 * Defines the structure of the Magic Pill component.
 * Magic Pill can be used in two modes:
 * 1. Navbar mode: Displays a navigation bar with multiple items.
 * 2. Notification mode: Displays a notification with an optional call to action (CTA).
 * Each mode has its own specific properties.
 * @see {@link MagicPillNotification} for the structure of the notification.
 * @see {@link MagicPillNavbar} for the structure of the navbar.
 * 
 * @example
 * ```json
 * {
 *   mode: "navbar",
 *   navbar: [
 *     { icon: "home", label: "Home", link: "/home" },
 *     { icon: "settings", label: "Settings", link: "/settings" }
 *   ]
 * }
 * ```
 * @example
 * ```json
 * {
 *   mode: "notification",
 *   notification: {
 *     icon: "info",
 *     message: "This is a notification",
 *     cta: { icon: "action", label: "Take Action", link: "/action" },
 *     info: {
 *       title: "Notification Title",
 *       content: "This is the content of the notification.",
 *       closeLabel: "Close"
 *     }
 *   }
 * }
 * ```
 */
export type MagicPillType =
  | { mode: "navbar"; navbar: MagicPillNavbar; notification?: never }
  | { mode: "notification"; notification: MagicPillNotification; navbar?: never };