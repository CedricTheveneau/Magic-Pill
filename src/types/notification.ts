import { NotificationIcon, CTAIcon } from "./index";

/**
 * Defines the structure of a call to action (CTA) in the Magic Pill notification.
 * Each CTA has an icon, an optional label, and an optional link.
 * @example
 * ```ts
 * {
 *   icon: "action",
 *   label: "Take Action",
 *   link: "/action"
 * }
 * ```
 * @see {@link MagicPillNotification} for the structure of the notification that contains this CTA.
 */
export interface MagicPillNotificationCTA {
 icon: CTAIcon;
 label?: string;
 link?: string;
}

/**
 * Defines the structure of additional information in the Magic Pill notification.
 * This can include a title, content (which can contain HTML), and a close label.
 * @example
 * ```ts
 * {
 *   title: "Notification Title",
 *   content: "This is the content of the notification.",
 *   closeLabel: "Close"
 * }
 * ```
 * @see {@link MagicPillNotification} for the structure of the notification that contains this information.
 * @see {@link MagicPillNotificationCTA} for the structure of the call to action in the notification.
 */
export interface MagicPillNotificationInfo {
 title?: string;
 //!The content of the notification, which can include HTML. 
 content: string;
 closeLabel: string;
}

/**
 * Defines the structure of a Magic Pill notification CTA with a link.
 * @example
 * ```ts
 * {
 *   icon: "info",
 *   label: "Learn More",
 *   link: "/learn-more"
 * }
 * ```
 * @see {@link MagicPillNotificationWithLink} for the whole notification structure that incorporates this very type..
 */
interface MagicPillNotificationCTAWithLink {
 icon: CTAIcon;
 label?: string;
 link: string;  // mandatory
}

/**
 * Defines the structure of a Magic Pill notification CTA without a link.
 * @example
 * ```ts
 * {
 *   icon: "info",
 *   label: "No Link Available"
 * }
 * ```
 * @see {@link MagicPillNotificationWithoutLink} for the whole notification structure that incorporates this very type.
 */
interface MagicPillNotificationCTAWithoutLink {
 icon: CTAIcon;
 label?: string;
 link?: undefined; // willingly undefined
}

/**
 * Defines the base structure of a Magic Pill notification.
 * It includes an optional icon and a mandatory message.
 * @example
 * ```ts
 * {
 *   icon: "info",
 *   message: "This is a notification message."
 * }
 * ```
 * @see {@link MagicPillNotificationWithLink} for notifications that include a CTA with a link.
 * @see {@link MagicPillNotificationWithoutLink} for notifications that include a CTA without a link.
 * @see {@link MagicPillNotificationWithoutCTA} for notifications that do not include a CTA.
 */
interface MagicPillNotificationBase {
 icon?: NotificationIcon;
 message: string;
 cta?: MagicPillNotificationCTA; // optional, can be with or without link
 info?: MagicPillNotificationInfo; // optional, can be with or without link
}

/**
 * Defines the structure of a Magic Pill notification with a CTA that includes a link.
 * This type extends the base notification structure and includes a CTA with a mandatory link.
 * @example
 * ```ts
 * {
 *   icon: "info",
 *   message: "This is a notification with a link.",
 *   cta: {
 *     icon: "action",
 *     label: "Take Action",
 *     link: "/action"
 *   }
 * }
 * ````
 * @see {@link MagicPillNotificationBase} for the base structure of the notification.
 * @see {@link MagicPillNotificationCTAWithLink} for the structure of the CTA with a link.
 */
type MagicPillNotificationWithLink = MagicPillNotificationBase & {
 cta: MagicPillNotificationCTAWithLink;
};

/**
 * Defines the structure of a Magic Pill notification without a link in the CTA.
 * This type extends the base notification structure and includes a CTA without a mandatory link.
 * @example
 * ```ts
 * {
 *   icon: "info",
 *   message: "This is a notification without a link.",
 *   cta: {
 *     icon: "action",
 *     label: "No Link Available"
 *   },
 *   info: {
 *     title: "Notification Title",
 *     content: "This is the content of the notification.",
 *     closeLabel: "Close"
 *   }
 * }
 * ```
 * @see {@link MagicPillNotificationBase} for the base structure of the notification.
 * @see {@link MagicPillNotificationCTAWithoutLink} for the structure of the CTA without a link.
 */
type MagicPillNotificationWithoutLink = MagicPillNotificationBase & {
 cta: MagicPillNotificationCTAWithoutLink;
 info: MagicPillNotificationInfo; // obligatoire
};

export type MagicPillNotification =
 | MagicPillNotificationWithLink
 | MagicPillNotificationWithoutLink
 | MagicPillNotificationBase;