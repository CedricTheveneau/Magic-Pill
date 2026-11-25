import { fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adapt, differ, flatten, mean, pickScheme, type Colour } from "./adaptive";

const WHITE: Colour = [255, 255, 255, 1];
const BLACK: Colour = [0, 0, 0, 1];

describe("flatten", () => {
  it("shows only the front layer when it's opaque", () => {
    // Assert
    expect(flatten([BLACK, WHITE])).toEqual(BLACK);
  });

  it("blends see-through layers over what's behind them", () => {
    // Assert
    expect(flatten([[0, 0, 0, 0.5], WHITE])).toEqual([127.5, 127.5, 127.5, 1]);
    expect(flatten([[255, 0, 0, 0.5]])).toEqual([255, 0, 0, 0.5]);
  });

  it("is see-through without any", () => {
    // Assert
    expect(flatten([])[3]).toBe(0);
  });
});

describe("mean", () => {
  it("is the mean of some colours, or nothing", () => {
    // Assert
    expect(mean([WHITE, BLACK])).toEqual([127.5, 127.5, 127.5, 1]);
    expect(mean([])).toBeNull();
  });
});

describe("differ", () => {
  it("is about what can be seen", () => {
    // Assert
    expect(differ(WHITE, [250, 250, 250, 1])).toBe(false);
    expect(differ(WHITE, [255, 255, 240, 1])).toBe(true);
  });
});

describe("pickScheme", () => {
  it("is light over light pages and dark over dark ones", () => {
    // Assert
    expect(pickScheme(WHITE)).toBe("light");
    expect(pickScheme(BLACK)).toBe("dark");
  });

  it("stays as it was around the limit, so it doesn't flicker", () => {
    // Arrange: a luminance of about 0.37
    const between: Colour = [165, 165, 165, 1];

    // Assert
    expect(pickScheme(between, "light")).toBe("light");
    expect(pickScheme(between, "dark")).toBe("dark");
  });
});

describe("adapt", () => {
  let pill: HTMLElement;
  let page: HTMLElement;
  // jsdom draws nothing: a canvas that gives back the colour it was filled
  // with, until a picture from another site spoils it
  const canvas = () => {
    let filled = [0, 0, 0, 0];
    let spoiled = false;
    return {
      clearRect: () => (filled = [0, 0, 0, 0]),
      fillRect: () => {},
      set fillStyle(css: string) {
        const parts = (css.match(/[\d.]+/g) ?? []).map(Number);
        filled = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, (parts[3] ?? (parts.length ? 1 : 0)) * 255];
      },
      drawImage: (picture: HTMLElement) => {
        filled = [255, 255, 255, 255];
        spoiled ||= picture.dataset.foreign !== undefined;
      },
      getImageData: () => {
        if (spoiled) throw new DOMException("tainted", "SecurityError");
        return { data: filled };
      },
    };
  };
  const behind = (...elements: Element[]) => {
    document.elementsFromPoint = vi.fn(() => [pill, ...elements, document.documentElement]);
  };
  const box = (element: Element) =>
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 200, height: 70 } as DOMRect);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => canvas()) as never);
    pill = document.createElement("div");
    pill.dataset.mp = "pill";
    pill.dataset.presence = "compact";
    page = document.createElement("section");
    document.body.append(page, pill);
    box(pill);
  });
  afterEach(() => {
    document.body.replaceChildren();
    document.body.removeAttribute("style");
    delete (document as Partial<Document>).elementsFromPoint;
    vi.useRealTimers();
  });

  const ambient = () => pill.style.getPropertyValue("--_mp-ambient");

  it.each([
    ["light", "rgb(255, 255, 255)", "rgb(255 255 255)"],
    ["dark", "rgb(10, 20, 30)", "rgb(10 20 30)"],
  ])("makes the pill %s over %s, and gives it its colour", (scheme, background, colour) => {
    // Arrange
    page.style.backgroundColor = background;
    behind(page);

    // Act
    const stop = adapt(new Set([pill]));

    // Assert
    expect(pill.dataset.scheme).toBe(scheme);
    expect(ambient()).toBe(colour);
    stop();
  });

  it("sees through see-through layers", () => {
    // Arrange
    const veil = document.createElement("div");
    veil.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    page.style.backgroundColor = "rgb(255, 255, 255)";
    page.append(veil);
    behind(veil, page);

    // Act
    const stop = adapt(new Set([pill]));

    // Assert
    expect(ambient()).toBe("rgb(128 128 128)");
    stop();
  });

  it("reads a gradient as the mean of its colours", () => {
    // Arrange
    page.style.backgroundImage = "linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255))";
    behind(page);

    // Act
    const stop = adapt(new Set([pill]));

    // Assert
    expect(ambient()).toBe("rgb(128 128 128)");
    stop();
  });

  it("reads pictures", () => {
    // Arrange
    const image = document.createElement("img");
    vi.spyOn(image, "naturalWidth", "get").mockReturnValue(400);
    vi.spyOn(image, "naturalHeight", "get").mockReturnValue(140);
    box(image);
    page.style.backgroundColor = "rgb(0, 0, 0)";
    page.append(image);
    behind(image, page);

    // Act
    const stop = adapt(new Set([pill]));

    // Assert
    expect(ambient()).toBe("rgb(255 255 255)");
    stop();
  });

  it("falls back to the page's own background, then to white", () => {
    // Arrange
    behind();
    const stop = adapt(new Set([pill]));
    const white = ambient();

    // Act
    document.body.style.backgroundColor = "rgb(20, 0, 60)";
    vi.advanceTimersByTime(500);

    // Assert
    expect(white).toBe("rgb(255 255 255)");
    expect(ambient()).toBe("rgb(20 0 60)");
    stop();
  });

  it("follows the scroll, once per burst", () => {
    // Arrange
    page.style.backgroundColor = "rgb(255, 255, 255)";
    behind(page);
    const stop = adapt(new Set([pill]));
    page.style.backgroundColor = "rgb(0, 0, 0)";
    const reads = vi.mocked(document.elementsFromPoint).mock.calls.length;

    // Act
    for (let i = 0; i < 5; i++) fireEvent.scroll(page);
    vi.advanceTimersByTime(100);

    // Assert
    expect(pill.dataset.scheme).toBe("dark");
    expect(vi.mocked(document.elementsFromPoint).mock.calls.length).toBe(reads * 2);
    stop();
  });

  it("doesn't restyle the pill for a change nobody would see", () => {
    // Arrange
    page.style.backgroundColor = "rgb(255, 255, 255)";
    behind(page);
    const stop = adapt(new Set([pill]));
    const setProperty = vi.spyOn(pill.style, "setProperty");

    // Act
    page.style.backgroundColor = "rgb(250, 250, 250)";
    vi.advanceTimersByTime(1000);

    // Assert
    expect(setProperty).not.toHaveBeenCalled();
    stop();
  });

  it("leaves hidden pills and hidden tabs alone", () => {
    // Arrange
    behind(page);
    pill.dataset.presence = "hidden";

    // Act
    const stop = adapt(new Set([pill]));

    // Assert
    expect(document.elementsFromPoint).not.toHaveBeenCalled();
    stop();
    pill.dataset.presence = "compact";
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    adapt(new Set([pill]))();
    expect(document.elementsFromPoint).not.toHaveBeenCalled();
  });

  it("keeps what it knew while a modal makes the page inert", () => {
    // Arrange
    page.style.backgroundColor = "rgb(255, 255, 255)";
    behind(page);
    const stop = adapt(new Set([pill]));
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    vi.spyOn(dialog, "matches").mockReturnValue(true);
    document.body.append(dialog);

    // Act
    page.style.backgroundColor = "rgb(0, 0, 0)";
    vi.advanceTimersByTime(500);

    // Assert
    expect(pill.dataset.scheme).toBe("light");
    stop();
  });

  it("goes on with what's behind a picture it can't read", () => {
    // Arrange
    const image = document.createElement("img");
    vi.spyOn(image, "naturalWidth", "get").mockReturnValue(400);
    vi.spyOn(image, "naturalHeight", "get").mockReturnValue(140);
    box(image);
    image.dataset.foreign = "";
    page.style.backgroundColor = "rgb(1, 2, 3)";
    page.append(image);
    behind(image, page);

    // Act
    const stop = adapt(new Set([pill]));

    // Assert
    expect(ambient()).toBe("rgb(1 2 3)");
    stop();
  });

  it("gives the pill its own colours back when it stops, and leaves it alone", () => {
    // Arrange
    page.style.backgroundColor = "rgb(255, 255, 255)";
    behind(page);
    const stop = adapt(new Set([pill]));

    // Act
    fireEvent.scroll(page);
    stop();
    vi.advanceTimersByTime(1000);

    // Assert
    expect(pill.dataset.scheme).toBeUndefined();
    expect(pill.style.cssText).toBe("");
  });
});
