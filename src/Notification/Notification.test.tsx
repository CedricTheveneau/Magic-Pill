import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MagicPillNotification } from "../types";
import Notification from "./Notification";

const withInfo: MagicPillNotification = {
  icon: "info",
  message: "Hello",
  cta: { icon: "plus", label: "More" },
  info: { title: "About", content: "<p>Body</p>", closeLabel: "Close" },
};

const renderNotification = (notification: MagicPillNotification) =>
  render(<Notification mode="notification" notification={notification} />);

describe("Notification info toggle", () => {
  it("toggles the info panel and switches between the CTA and close labels", () => {
    const { container } = renderNotification(withInfo);
    const toggle = screen.getByRole("button", { name: "More" });

    fireEvent.click(toggle);

    expect(container.querySelector(".info")?.className).toBe("info active");
    expect(toggle.textContent).toBe("Close");
  });

  it("exposes whether the panel is expanded (Y4)", () => {
    renderNotification(withInfo);
    const toggle = screen.getByRole("button", { name: "More" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("points to the panel it controls (Y4)", () => {
    const { container } = renderNotification(withInfo);
    const toggle = screen.getByRole("button", { name: "More" });

    const panelId = toggle.getAttribute("aria-controls");

    expect(panelId).toBeTruthy();
    expect(container.querySelector(".info")?.id).toBe(panelId);
  });

  it("gives each notification's panel its own id (Y4)", () => {
    render(
      <>
        <Notification mode="notification" notification={withInfo} />
        <Notification mode="notification" notification={withInfo} />
      </>,
    );

    const ids = screen.getAllByRole("button").map((toggle) => toggle.getAttribute("aria-controls"));

    expect(new Set(ids).size).toBe(2);
  });

  it("renders a link instead of a toggle when the CTA has a link", () => {
    renderNotification({ icon: "info", message: "Hello", cta: { icon: "arrow", label: "Open", link: "/orders" } });

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: "Open" }).getAttribute("href")).toBe("/orders");
  });
});
