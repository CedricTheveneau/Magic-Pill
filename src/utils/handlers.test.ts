import type { Dispatch, SetStateAction } from "react";
import { describe, expect, it } from "vitest";

import type { MagicPillType } from "../types";
import {
  addNavItem,
  deleteNavItem,
  updateCTAIcon,
  updateCTALabel,
  updateCTALink,
  updateInfoCloseLabel,
  updateInfoContent,
  updateInfoTitle,
  updateMode,
  updateNavItemIcon,
  updateNavItemLabel,
  updateNavItemLink,
  updateNotificationIcon,
  updateNotificationMessage,
} from "./handlers";

// Characterisation tests: they describe what the v8 handlers do today,
// including the surprising parts, so later changes are deliberate.

type SetPillData = Dispatch<SetStateAction<MagicPillType>>;

/** Runs a handler against `prev` the way React's setState would, and returns the next state. */
const applyHandler = (prev: MagicPillType, handler: (setPillData: SetPillData) => void): MagicPillType => {
  let next = prev;
  const setPillData: SetPillData = (action) => {
    next = typeof action === "function" ? action(next) : action;
  };
  handler(setPillData);
  return next;
};

const navbarState = (): MagicPillType => ({
  mode: "navbar",
  navbar: {
    navItems: [
      { icon: "arrow", label: "Home", link: "/" },
      { icon: "mail", label: "Contact", link: "/contact" },
    ],
  },
});

const notificationWithInfo = (): MagicPillType => ({
  mode: "notification",
  notification: {
    icon: "info",
    message: "Hello",
    cta: { icon: "plus", label: "More" },
    info: { title: "Title", content: "<p>Body</p>", closeLabel: "Close" },
  },
});

const notificationWithLink = (): MagicPillType => ({
  mode: "notification",
  notification: {
    icon: "checkmark",
    message: "Saved",
    cta: { icon: "box", label: "Open", link: "/orders" },
  },
});

describe("updateMode", () => {
  it("switches to an empty navbar, dropping the previous notification", () => {
    // Arrange
    const prev = notificationWithInfo();

    // Act
    const next = applyHandler(prev, (set) => updateMode("navbar", set));

    // Assert
    expect(next).toEqual({ mode: "navbar", navbar: { navItems: [] } });
  });

  it("switches to an empty notification, dropping the previous navbar", () => {
    const prev = navbarState();

    const next = applyHandler(prev, (set) => updateMode("notification", set));

    expect(next).toEqual({ mode: "notification", notification: { icon: "", message: "" } });
  });

  it("resets the data even when the mode doesn't change", () => {
    const prev = navbarState();

    const next = applyHandler(prev, (set) => updateMode("navbar", set));

    expect(next).toEqual({ mode: "navbar", navbar: { navItems: [] } });
  });
});

describe("notification setters", () => {
  it("updateNotificationIcon replaces the icon and keeps everything else", () => {
    const prev = notificationWithInfo();

    const next = applyHandler(prev, (set) => updateNotificationIcon("coupon", set));

    expect(next).toEqual({
      ...prev,
      notification: { ...prev.notification, icon: "coupon" },
    });
  });

  it("updateNotificationMessage replaces the message and keeps everything else", () => {
    const prev = notificationWithInfo();

    const next = applyHandler(prev, (set) => updateNotificationMessage("Bye", set));

    expect(next).toEqual({
      ...prev,
      notification: { ...prev.notification, message: "Bye" },
    });
  });

  it("updateCTAIcon replaces the CTA icon and keeps its label and link", () => {
    const prev = notificationWithLink();

    const next = applyHandler(prev, (set) => updateCTAIcon("tel", set));

    expect(next.notification?.cta).toEqual({ icon: "tel", label: "Open", link: "/orders" });
  });

  it("updateCTAIcon falls back to the default 'arrow' icon when given an empty icon", () => {
    const prev = notificationWithLink();

    const next = applyHandler(prev, (set) => updateCTAIcon("", set));

    expect(next.notification?.cta?.icon).toBe("arrow");
  });

  it("updateCTALabel sets the label and fills in the 'arrow' icon when there is no CTA yet", () => {
    const prev: MagicPillType = { mode: "notification", notification: { message: "Hi" } };

    const next = applyHandler(prev, (set) => updateCTALabel("Go", set));

    expect(next.notification?.cta).toEqual({ icon: "arrow", label: "Go" });
  });

  it("updateCTALink sets the link and removes the info panel", () => {
    const prev = notificationWithInfo();

    const next = applyHandler(prev, (set) => updateCTALink("/docs", set));

    expect(next.notification?.cta).toEqual({ icon: "plus", label: "More", link: "/docs" });
    expect(next.notification?.info).toBeUndefined();
  });

  it("updateInfoTitle sets the title and removes the CTA link", () => {
    const prev = notificationWithLink();

    const next = applyHandler(prev, (set) => updateInfoTitle("About", set));

    expect(next.notification?.cta).toEqual({ icon: "box", label: "Open", link: undefined });
    expect(next.notification?.info).toEqual({ title: "About", content: "", closeLabel: "" });
  });

  it("updateInfoContent sets the content and keeps the existing title and close label", () => {
    const prev = notificationWithInfo();

    const next = applyHandler(prev, (set) => updateInfoContent("<p>New</p>", set));

    expect(next.notification?.info).toEqual({ title: "Title", content: "<p>New</p>", closeLabel: "Close" });
  });

  it("updateInfoContent removes the CTA link", () => {
    const prev = notificationWithLink();

    const next = applyHandler(prev, (set) => updateInfoContent("<p>New</p>", set));

    expect(next.notification?.cta?.link).toBeUndefined();
  });

  it("updateInfoCloseLabel sets the close label and fills a missing title and content with empty strings", () => {
    const prev: MagicPillType = { mode: "notification", notification: { message: "Hi" } };

    const next = applyHandler(prev, (set) => updateInfoCloseLabel("Done", set));

    expect(next.notification?.info).toEqual({ title: "", content: "", closeLabel: "Done" });
    expect(next.notification?.cta).toEqual({ icon: "arrow", link: undefined });
  });

  it.each([
    ["updateNotificationIcon", (set: SetPillData) => updateNotificationIcon("info", set)],
    ["updateNotificationMessage", (set: SetPillData) => updateNotificationMessage("Hi", set)],
    ["updateCTAIcon", (set: SetPillData) => updateCTAIcon("tel", set)],
    ["updateCTALabel", (set: SetPillData) => updateCTALabel("Go", set)],
    ["updateCTALink", (set: SetPillData) => updateCTALink("/go", set)],
    ["updateInfoTitle", (set: SetPillData) => updateInfoTitle("T", set)],
    ["updateInfoContent", (set: SetPillData) => updateInfoContent("C", set)],
    ["updateInfoCloseLabel", (set: SetPillData) => updateInfoCloseLabel("X", set)],
  ])("%s leaves a navbar state untouched (same object)", (_name, handler) => {
    const prev = navbarState();

    const next = applyHandler(prev, handler);

    expect(next).toBe(prev);
  });
});

describe("navbar setters", () => {
  it("updateNavItemLabel changes one item without mutating the previous state", () => {
    const prev = navbarState();
    const prevItems = prev.navbar?.navItems;

    const next = applyHandler(prev, (set) => updateNavItemLabel("Start", 0, set));

    expect(next.navbar?.navItems).toEqual([
      { icon: "arrow", label: "Start", link: "/" },
      { icon: "mail", label: "Contact", link: "/contact" },
    ]);
    expect(prev.navbar?.navItems).toBe(prevItems);
    expect(prevItems?.[0].label).toBe("Home");
  });

  it("updateNavItemLink changes the link of one item", () => {
    const prev = navbarState();

    const next = applyHandler(prev, (set) => updateNavItemLink("/hello", 1, set));

    expect(next.navbar?.navItems[1]).toEqual({ icon: "mail", label: "Contact", link: "/hello" });
  });

  it("updateNavItemIcon changes the icon of one item", () => {
    const prev = navbarState();

    const next = applyHandler(prev, (set) => updateNavItemIcon("undo", 1, set));

    expect(next.navbar?.navItems[1]).toEqual({ icon: "undo", label: "Contact", link: "/contact" });
  });

  it("updateNavItemLabel on an index past the end creates a partial item there", () => {
    const prev = navbarState();

    const next = applyHandler(prev, (set) => updateNavItemLabel("Ghost", 2, set));

    expect(next.navbar?.navItems).toHaveLength(3);
    expect(next.navbar?.navItems[2]).toEqual({ label: "Ghost" });
  });

  it("addNavItem appends an item", () => {
    const prev = navbarState();

    const next = applyHandler(prev, (set) => addNavItem({ icon: "box", label: "Shop", link: "/shop" }, set));

    expect(next.navbar?.navItems.map((item) => item.label)).toEqual(["Home", "Contact", "Shop"]);
  });

  it("deleteNavItem removes the item at the index without mutating the previous state", () => {
    const prev = navbarState();

    const next = applyHandler(prev, (set) => deleteNavItem(0, set));

    expect(next.navbar?.navItems.map((item) => item.label)).toEqual(["Contact"]);
    expect(prev.navbar?.navItems).toHaveLength(2);
  });

  it.each([
    ["updateNavItemLabel", (set: SetPillData) => updateNavItemLabel("A", 0, set)],
    ["updateNavItemLink", (set: SetPillData) => updateNavItemLink("/a", 0, set)],
    ["updateNavItemIcon", (set: SetPillData) => updateNavItemIcon("box", 0, set)],
    ["addNavItem", (set: SetPillData) => addNavItem({ icon: "box", link: "/a" }, set)],
    ["deleteNavItem", (set: SetPillData) => deleteNavItem(0, set)],
  ])("%s leaves a notification state untouched (same object)", (_name, handler) => {
    const prev = notificationWithInfo();

    const next = applyHandler(prev, handler);

    expect(next).toBe(prev);
  });
});
