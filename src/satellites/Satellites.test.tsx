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
