import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ArrowIcon from "./ArrowIcon";
import BoxIcon from "./BoxIcon";
import CheckIcon from "./CheckIcon";
import CloseIcon from "./CloseIcon";
import CouponIcon from "./CouponIcon";
import DocumentIcon from "./DocumentIcon";
import HelpIcon from "./HelpIcon";
import InfoIcon from "./InfoIcon";
import MailIcon from "./MailIcon";
import PhoneIcon from "./PhoneIcon";
import PlusIcon from "./PlusIcon";
import UndoIcon from "./UndoIcon";

const icons = {
  ArrowIcon,
  BoxIcon,
  CheckIcon,
  CloseIcon,
  CouponIcon,
  DocumentIcon,
  HelpIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  UndoIcon,
};

describe("v9 icons", () => {
  it.each(Object.entries(icons))("%s is a decorative, 1em, currentColor svg", (_name, Icon) => {
    // Act
    const { container } = render(<Icon />);
    const svg = container.querySelector("svg")!;

    // Assert
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.getAttribute("width")).toBe("1em");
    expect(svg.querySelector("path")?.hasAttribute("fill")).toBe(false);
  });

  it("passes svg props through, so an icon can be given a name", () => {
    // Act
    const { container } = render(<CheckIcon aria-hidden={false} role="img" aria-label="Done" className="big" />);
    const svg = container.querySelector("svg")!;

    // Assert
    expect(svg.getAttribute("aria-label")).toBe("Done");
    expect(svg.getAttribute("aria-hidden")).toBe("false");
    expect(svg.getAttribute("class")).toBe("big");
  });
});
