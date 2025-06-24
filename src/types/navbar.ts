/**
 * Defines the structure of a navigation item in the Magic Pill navbar.
 * Each item has an icon, an optional label, and a link.
 * @example
 * ```ts
 * {
 *   icon: "home",
 *   label: "Home",
 *   link: "/home"
 * }
 * ```
 * @see {@link MagicPillNavbar} for the structure of the navbar that contains these items.
 */
export interface MagicPillNavbarItem {
 icon: string;
 label?: string;
 link: string;
}

/**
 * Defines the structure of the navbar in the Magic Pill component.
 * It contains an array of navigation items.
 * @see {@link MagicPillNavbarItem} for the structure of each item in the navbar.
 */
export interface MagicPillNavbar {
 navItems: MagicPillNavbarItem[],
}