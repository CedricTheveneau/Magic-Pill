import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MagicPill from "../MagicPill/MagicPill";
import { PillNavbar } from "../PillNavbar/PillNavbar";
import { getStore, pill, resetStores, type ElectronOptions } from "../store/store";
import { satellites } from "./index";

const FADE = 150;
const CHANGE = 250;
const EXIT = 300;

const electron = () => document.querySelector<HTMLElement>('[data-mp="pill"][data-satellite="electron"]');
const host = () => document.querySelector<HTMLElement>('[data-mp="pill"]:not([data-satellite])')!;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const start = (input: ElectronOptions) => {
  let id = "";
  act(() => {
    id = pill().electron(input);
  });
  return id;
};
const items = [
  { href: "/", label: "Home" },
  { href: "/focus", label: "Focus" },
];

function App({ pathname = "/", ...props }: { pathname?: string } & Partial<Parameters<typeof MagicPill>[0]>) {
  return (
    <MagicPill pathname={pathname} satellites={satellites} {...props}>
      <PillNavbar items={items} pathname={pathname} />
    </MagicPill>
  );
}

describe("the controller", () => {
  beforeEach(() => resetStores());

  it("starts, updates and ends electrons, remembering where each one was started", () => {
    window.history.pushState({}, "", "/focus");
    const id = pill().electron({ label: "Focus timer", value: "25:00" });
    expect(getStore("main").getElectrons()).toEqual([{ id, input: { label: "Focus timer", value: "25:00" }, origin: "/focus" }]);

    pill().updateElectron(id, { value: "24:59" });
    expect(getStore("main").getElectrons()[0].input.value).toBe("24:59");

    pill().electron({ id, label: "Focus timer", value: "24:58" });
    expect(getStore("main").getElectrons()).toHaveLength(1);

    pill().endElectron(id);
    expect(getStore("main").getElectrons()).toEqual([]);
    window.history.pushState({}, "", "/");
  });

  it("takes its own href as its origin", () => {
    pill().electron({ label: "Upload", href: "/notes" });
    expect(getStore("main").getElectrons()[0].origin).toBe("/notes");
  });
});

describe("the satellites' electrons", () => {
  beforeEach(() => {
    resetStores();
    vi.useFakeTimers();
  });

  it("shows an electron away from its page, as a link back to it, with its ring and value", () => {
    render(<App pathname="/" />);
    start({ label: "Focus timer", value: "4:34", valueText: "5 minutes left", progress: 0.4, href: "/focus" });

    expect(electron()?.dataset.presence).toBe("compact");
    const link = electron()!.querySelector<HTMLAnchorElement>('a[data-mp="electron"]')!;
    expect(link.getAttribute("href")).toBe("/focus");
    expect(link.getAttribute("aria-label")).toBe("Focus timer, 5 minutes left");
    expect(link.querySelector('[data-mp="progress"] [data-mp="progress-bar"]')?.getAttribute("stroke-dasharray")).toBe("40 100");
    expect(link.querySelector('[data-mp="electron-value"]')?.textContent).toBe("4:34");
  });

  it("is tucked in on its own page (and its sub-pages), and comes out once the person leaves", () => {
    const { rerender } = render(<App pathname="/focus/settings" />);
    start({ label: "Focus timer", href: "/focus" });
    expect(electron()?.dataset.presence).toBe("hidden");

    rerender(<App pathname="/" />);
    expect(electron()?.dataset.presence).toBe("compact");
  });

  it("stays out on its page with hideOnOrigin={false}", () => {
    render(<App pathname="/focus" />);
    start({ label: "Focus timer", href: "/focus", hideOnOrigin: false });
    expect(electron()?.dataset.presence).toBe("compact");
  });

  it("tucks in while a notification has the pill, unless kept out", () => {
    const { rerender } = render(<App />);
    start({ label: "Focus timer", href: "/focus" });
    act(() => void pill().notify({ message: "Saved" }));
    expect(electron()?.dataset.presence).toBe("hidden");

    rerender(<App keepElectronsOut />);
    expect(electron()?.dataset.presence).toBe("compact");
  });

  it("leaves when it ends, and goes from the page once it has gone", () => {
    render(<App />);
    const id = start({ label: "Focus timer", href: "/focus" });
    act(() => pill().endElectron(id));
    expect(electron()?.dataset.presence).toBe("hidden");
    expect(electron()?.dataset.ending).toBeUndefined();

    advance(FADE + CHANGE + EXIT + 100);
    expect(electron()).toBeNull();
  });

  it("pops away instead with ending=\"pop\"", () => {
    render(<App />);
    const id = start({ label: "Upload", href: "/notes", ending: "pop" });
    act(() => pill().endElectron(id));
    expect(electron()?.dataset.ending).toBe("pop");
  });

  it("is a button for its own onClick", () => {
    const onClick = vi.fn();
    render(<App />);
    start({ label: "Call", onClick });
    const button = electron()!.querySelector<HTMLButtonElement>('button[data-mp="electron"]')!;
    act(() => button.click());
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("says a milestone once", () => {
    render(<App />);
    const id = start({ label: "Focus timer", href: "/focus" });
    act(() => pill().updateElectron(id, { announce: "Break time" }));
    const announcers = [...document.querySelectorAll('[data-mp="announcer"]')];
    expect(announcers.some((announcer) => announcer.textContent === "Break time")).toBe(true);
  });

  it("gives the host back its spot when the satellites go", () => {
    const { rerender } = render(<App />);
    start({ label: "Focus timer", href: "/focus" });
    rerender(<App satellites={undefined} />);
    expect(host().style.getPropertyValue("translate")).toBe("");
    expect(host().style.getPropertyValue("--_mp-shift-x")).toBe("");
  });

  it("warns in development when there are electrons and no satellites", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <MagicPill>
        <PillNavbar items={items} pathname="/" />
      </MagicPill>,
    );
    start({ label: "Focus timer" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs the satellites: <MagicPill satellites={satellites}>'));
    expect(electron()).toBeNull();
  });
});

describe("an electron's orbitals", () => {
  beforeEach(() => {
    resetStores();
    vi.useFakeTimers();
  });

  const link = () => electron()!.querySelector<HTMLElement>('[data-mp="electron"]')!;
  const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
  const orbitals = () => [...document.querySelectorAll<HTMLElement>('[data-satellite="orbital"]')];
  const items = () => [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  const timer = (onClick = vi.fn()) => ({
    label: "Focus timer",
    href: "/focus",
    orbitals: [
      { icon: <span>+</span>, label: "+1 min", onClick },
      { icon: <span>II</span>, label: "Pause" },
      { icon: <span>»</span>, label: "Skip" },
    ],
  });
  const longPress = () => {
    act(() => void link().dispatchEvent(Object.assign(new Event("pointerdown", { bubbles: true }), { button: 0, clientX: 0, clientY: 0, pointerId: 1 })));
    advance(450);
    advance(200);
  };

  it("opens on a long press: a menu of its orbitals, coming out one after the other", () => {
    render(<App />);
    start(timer());
    expect(link().getAttribute("aria-haspopup")).toBe("menu");
    expect(menu()).toBeNull();

    longPress();
    expect(menu()?.getAttribute("aria-label")).toBe("Focus timer");
    expect(items().map((item) => item.getAttribute("aria-label"))).toEqual(["+1 min", "Pause", "Skip"]);
    expect(orbitals().every((orbital) => orbital.dataset.presence === "compact")).toBe(true);
    expect(link().getAttribute("aria-expanded")).toBe("true");
  });

  it("opens from the keyboard with the arrow away from the edge, focusing the first; Escape closes them", () => {
    render(<App />);
    start(timer());
    act(() => void link().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })));
    advance(200);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("+1 min");

    act(() => void items()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Pause");

    act(() => void items()[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(document.activeElement).toBe(link());
    advance(1000);
    expect(menu()).toBeNull();
  });

  it("runs an orbital and stays open, or closes with orbitalsStayOpen={false}", () => {
    const onClick = vi.fn();
    const { rerender } = render(<App />);
    start(timer(onClick));
    longPress();
    act(() => items()[0].click());
    expect(onClick).toHaveBeenCalledOnce();
    advance(1000);
    expect(menu()).not.toBeNull();

    rerender(<App orbitalsStayOpen={false} />);
    act(() => items()[0].click());
    advance(1000);
    expect(menu()).toBeNull();
  });

  it("opens on a tap with orbitalsOpenOn=\"tap\", with a first orbital going back", () => {
    render(<App orbitalsOpenOn="tap" />);
    start(timer());
    act(() => link().click());
    advance(200);
    expect(items()[0].getAttribute("aria-label")).toBe("Back");
    expect(items()[0].getAttribute("href")).toBe("/focus");
    expect(items()).toHaveLength(4);
  });

  it("closes on a tap away", () => {
    render(<App />);
    start(timer());
    longPress();
    act(() => void document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
    advance(1000);
    expect(menu()).toBeNull();
  });

  it("closes when the electron tucks in", () => {
    render(<App />);
    start(timer());
    longPress();
    act(() => void pill().notify({ message: "Saved" }));
    advance(1000);
    expect(menu()).toBeNull();
  });

  it("shows the label of the one focused, unless orbitalLabels={false}", () => {
    const { rerender } = render(<App />);
    start(timer());
    act(() => void link().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })));
    advance(200);
    expect(document.querySelector('[data-mp="orbital-label"]')?.textContent).toBe("+1 min");
    expect(orbitals()[0].dataset.hot).toBe("");

    rerender(<App orbitalLabels={false} />);
    expect(document.querySelector('[data-mp="orbital-label"]')).toBeNull();
  });
});
