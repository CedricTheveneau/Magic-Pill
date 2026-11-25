"use client"
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";

import { onThemedPills, themedPills } from "../Pill/themed";
import { adapt } from "./adaptive";
import { canRefract, lensId, lensMap, makeLens, type Lens } from "./lens";
import { followPointer } from "./light";

const LENSES = ["--_mp-lens", "--_mp-action-lens"] as const;
// What a lens is made from: registered in themes.css, which also gives them a
// (very short) transition, so a change of any token is heard when it ends
const WATCHED = /^(--_mp-(refraction|edge|fringe|follow|adaptive|action-layer|action-radius)|border-top-left-radius)$/;

/** Red, green and blue: how far each one bends apart, and the matrix that keeps it alone. */
const CHANNELS = [
  [1, "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"],
  [0, "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"],
  [-1, "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"],
] as const;

function LensFilter({ lens }: { lens: Lens }) {
  const bend = (apart: number, result?: string) => (
    <feDisplacementMap
      in="SourceGraphic"
      in2="map"
      // The map goes from -0.5 to 0.5
      scale={lens.depth * 2 * (1 + apart * lens.fringe)}
      xChannelSelector="R"
      yChannelSelector="G"
      result={result}
    />
  );
  return (
    <filter
      id={lensId(lens)}
      x="0"
      y="0"
      width="100%"
      height="100%"
      primitiveUnits="userSpaceOnUse"
      colorInterpolationFilters="sRGB"
    >
      <feImage href={lensMap(lens)} preserveAspectRatio="none" result="map" />
      {lens.fringe === 0 ? (
        bend(0)
      ) : (
        <>
          {CHANNELS.map(([apart, matrix], index) => (
            <Fragment key={apart}>
              {bend(apart, `bent${index}`)}
              <feColorMatrix in={`bent${index}`} type="matrix" values={matrix} result={`channel${index}`} />
            </Fragment>
          ))}
          <feComposite operator="arithmetic" k2={1} k3={1} in="channel0" in2="channel1" result="two" />
          <feComposite operator="arithmetic" k2={1} k3={1} in="two" in2="channel2" />
        </>
      )}
    </filter>
  );
}

type Read = (property: string) => number;
const reader = (element: HTMLElement): Read => {
  const style = getComputedStyle(element);
  return (property) => Number.parseFloat(style.getPropertyValue(property)) || 0;
};

/** The lenses of a pill and of its actions (null: none), from its tokens. In the order of LENSES. */
function readLenses(element: HTMLElement, read: Read, glassActions: boolean): readonly (Lens | null)[] {
  const refraction = read("--_mp-refraction");
  if (refraction <= 0) return [];
  const edge = read("--_mp-edge");
  const fringe = read("--_mp-fringe");
  // The browser never rounds a corner by more than half the pill
  const corner = Math.min(read("border-top-left-radius"), element.offsetWidth / 2, element.offsetHeight / 2);
  const pill = makeLens(corner, edge, refraction, fringe);
  if (!glassActions) return [pill];
  // The same glass at the actions' scale
  const radius = read("--_mp-action-radius");
  const scale = corner > 0 ? Math.min(1, radius / corner) : 1;
  return [pill, makeLens(radius, edge * scale, refraction * scale, fringe)];
}

const clear = (element: HTMLElement) => LENSES.forEach((property) => element.style.removeProperty(property));

/** Runs an effect for the pills that ask for it, and only while some do. */
function makeGroup(start: (pills: ReadonlySet<HTMLElement>) => () => void) {
  let pills: readonly HTMLElement[] = [];
  let stop: (() => void) | undefined;
  return (next: readonly HTMLElement[]) => {
    if (next.length === pills.length && next.every((pill) => pills.includes(pill))) return;
    stop?.();
    pills = next;
    stop = next.length > 0 ? start(new Set(next)) : undefined;
  };
}

/**
 * What themes can't do in CSS. Render it once, anywhere: the tokens of each
 * themed pill decide. It draws the refraction of the glass (in the browsers
 * that can: Chromium), makes the actions of the same glass
 * (`--mp-action-glass`), has the light follow the pointer (`--mp-light-follow`),
 * and tints the pill after what's behind it (`--mp-adaptive`).
 */
export function PillOptics() {
  // The lenses on the page (what has the same one shares it), and whose they are
  const [lenses, setLenses] = useState<readonly Lens[]>([]);
  const wanted = useRef(new Map<HTMLElement, readonly (string | null)[]>());

  const apply = () => {
    for (const [element, ids] of wanted.current) {
      LENSES.forEach((property, index) => {
        if (ids[index]) element.style.setProperty(property, `url(#${ids[index]})`);
        else element.style.removeProperty(property);
      });
    }
  };
  // Once their filters are on the page
  useLayoutEffect(apply, [lenses]);

  useEffect(() => {
    let stopped = false;
    let pending = false;
    let refracts: boolean | undefined;
    const following = makeGroup(followPointer);
    const adaptive = makeGroup(adapt);

    const update = () => {
      pending = false;
      if (stopped) return;
      const next = new Map<string, Lens>();
      const before = wanted.current;
      wanted.current = new Map();
      const follow: HTMLElement[] = [];
      const adapted: HTMLElement[] = [];
      for (const element of themedPills) {
        const read = reader(element);
        if (read("--_mp-follow") > 0) follow.push(element);
        if (read("--_mp-adaptive") > 0) adapted.push(element);
        const glassActions = read("--_mp-action-layer") > 0;
        if (glassActions) element.dataset.actions = "glass";
        else delete element.dataset.actions;
        const found = refracts === false ? [] : readLenses(element, read, glassActions);
        if (!found.some((lens) => lens !== null)) continue;
        // Asked once, and only if a pill needs it
        refracts ??= canRefract();
        if (!refracts) continue;
        for (const lens of found) if (lens) next.set(lensId(lens), lens);
        wanted.current.set(
          element,
          found.map((lens) => lens && lensId(lens)),
        );
      }
      for (const element of before.keys()) {
        if (!wanted.current.has(element)) clear(element);
      }
      following(follow);
      adaptive(adapted);
      setLenses((current) => {
        const same = current.length === next.size && current.every((lens) => next.has(lensId(lens)));
        return same ? current : [...next.values()];
      });
      apply();
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      queueMicrotask(update);
    };
    const onTransitionEnd = ({ target, propertyName }: TransitionEvent) => {
      if (WATCHED.test(propertyName) && themedPills.has(target as HTMLElement)) schedule();
    };

    schedule();
    const unsubscribe = onThemedPills(schedule);
    document.addEventListener("transitionend", onTransitionEnd);
    window.addEventListener("resize", schedule);
    return () => {
      stopped = true;
      unsubscribe();
      document.removeEventListener("transitionend", onTransitionEnd);
      window.removeEventListener("resize", schedule);
      for (const element of wanted.current.keys()) clear(element);
      for (const element of themedPills) delete element.dataset.actions;
      wanted.current.clear();
      following([]);
      adaptive([]);
    };
  }, []);

  if (lenses.length === 0) return null;
  return (
    // Not display: none, which some browsers also apply to the filters
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }} data-mp="optics">
      {lenses.map((lens) => (
        <LensFilter key={lensId(lens)} lens={lens} />
      ))}
    </svg>
  );
}
