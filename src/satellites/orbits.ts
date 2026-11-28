// Where an electron's orbitals go: on an arc around it, on the side away from
// the screen's edge, clear of the host, the other satellites and the screen's
// edges. If they don't all fit at the set distance, the arc moves out a
// little (up to one orbital's size); if they still don't, they turn into a
// wheel: the arc shows as many as fit, the next one peeking out faintly at
// each end, and turns to show the others. No DOM here: boxes in, spots out.
import type { Box } from "./layout";

export interface OrbitInput {
  /** The electron */
  electron: Box;
  count: number;
  /** An orbital's diameter */
  size: number;
  /** Between the electron and its orbitals */
  distance: number;
  /** The arc's angle, in degrees; 0: as tight as they fit */
  spread: number;
  /** The direction away from the screen's edge, in degrees (0: right, 90: down) */
  away: number;
  /** What they mustn't cover */
  obstacles: readonly Box[];
  viewport: { width: number; height: number };
  /** Right to left: the first one on the right */
  rtl: boolean;
}

export interface OrbitSpot {
  x: number;
  y: number;
  /** Its angle from the electron's centre, in degrees */
  angle: number;
  /** How much of it shows: 1 on the arc, less past a wheel's ends, 0 out of sight */
  shown: number;
}

export interface Orbit {
  /** The electron's centre */
  x: number;
  y: number;
  radius: number;
  /** Between two orbitals, in degrees */
  step: number;
  /** The angle of the arc's first slot */
  first: number;
  count: number;
  /** How many show at once: all of them, or what fits on a wheel */
  visible: number;
  /** More of them than room: the arc turns to show the others */
  wheel: boolean;
  /** Whether the spot just past each end of a wheel's arc is clear, for the next one to peek out there */
  peek: { low: boolean; high: boolean };
  rtl: boolean;
  /** Where they are with the wheel at rest, at its start */
  spots: OrbitSpot[];
  /** They fit, clear of everything (a wheel shows what fits, clear too) */
  clear: boolean;
}

/** How far a wheel can turn: from 0 to this many orbitals. */
export const wheelEnd = (orbit: Orbit) => Math.max(0, orbit.count - orbit.visible);

/**
 * Where orbital `index` is with the wheel turned by `turn` orbitals: on the
 * arc's slots, fading out past either end (the next one peeks out at a
 * fifth), mirrored in a right-to-left page (the first one on the right).
 */
export function spotOn(orbit: Orbit, index: number, turn = 0): OrbitSpot {
  const { count, visible } = orbit;
  const slot = orbit.rtl ? count - 1 - index + turn - (count - visible) : index - turn;
  const angle = orbit.first + slot * orbit.step;
  const past = slot < 0 ? -slot : slot > visible - 1 ? slot - (visible - 1) : 0;
  // Past an end with a clear spot, the next one peeks out at a fifth; elsewhere, it's gone by the next slot
  const peeks = slot < 0 ? orbit.peek.low : orbit.peek.high;
  const shown = orbit.wheel ? Math.min(1, Math.max(0, 1 - past / (peeks ? 1.25 : 1))) : 1;
  return {
    x: orbit.x + Math.cos(radians(angle)) * orbit.radius,
    y: orbit.y + Math.sin(radians(angle)) * orbit.radius,
    angle,
    shown,
  };
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function planOrbit(input: OrbitInput): Orbit {
  const { electron, count, size, distance, away, obstacles, viewport } = input;
  const x = electron.left + electron.width / 2;
  const y = electron.top + electron.height / 2;
  const margin = 8;
  const pad = size / 2 + 6;
  const free = (px: number, py: number) =>
    px >= size / 2 + margin &&
    px <= viewport.width - size / 2 - margin &&
    py >= size / 2 + margin &&
    py <= viewport.height - size / 2 - margin &&
    !obstacles.some(
      (box) =>
        Math.abs(px - (box.left + box.width / 2)) < box.width / 2 + pad &&
        Math.abs(py - (box.top + box.height / 2)) < box.height / 2 + pad,
    );
  const at = (radius: number, angle: number) => ({ x: x + Math.cos(radians(angle)) * radius, y: y + Math.sin(radians(angle)) * radius });
  // As close as two orbitals can be without touching, a little apart
  const tightest = (radius: number) => (2 * Math.asin(Math.min(1, (size + 8) / (2 * radius))) * 180) / Math.PI;

  // The free arc around the direction away from the edge, as offsets from it
  const arcAt = (radius: number) => {
    const ok = (offset: number) => {
      const spot = at(radius, away + offset);
      return free(spot.x, spot.y);
    };
    let seed: number | null = null;
    for (let offset = 0; offset <= 180 && seed === null; offset++) {
      if (ok(offset)) seed = offset;
      else if (ok(-offset)) seed = -offset;
    }
    if (seed === null) return null;
    let low = seed;
    let high = seed;
    while (low > -180 && ok(low - 1)) low--;
    while (high < 180 && ok(high + 1)) high++;
    return { low, high };
  };

  const place = (radius: number, step: number, first: number, visible: number, clear: boolean): Orbit => {
    const wheel = count > visible;
    const clearAt = (angle: number) => {
      const spot = at(radius, angle);
      return free(spot.x, spot.y);
    };
    // Not on a wheel that goes all the way round: the next one would sit on the first ones
    const room = wheel && (visible + 1) * step < 360;
    const peek = { low: room && clearAt(first - step), high: room && clearAt(first + visible * step) };
    const orbit: Orbit = { x, y, radius, step, first, count, visible, wheel, peek, rtl: input.rtl, spots: [], clear };
    orbit.spots = Array.from({ length: count }, (_, index) => spotOn(orbit, index));
    return orbit;
  };

  const base = electron.width / 2 + distance + size / 2;
  const radii: number[] = [];
  for (let radius = base; radius <= base + size * 1.25; radius += 4) radii.push(radius);
  // The spread asked for, else the tightest spacing; at the set distance, or a little further out
  for (const wanted of input.spread > 0 ? [input.spread, 0] : [0]) {
    for (const radius of radii) {
      const arc = arcAt(radius);
      if (!arc) continue;
      const step = count > 1 ? Math.max(tightest(radius), wanted > 0 ? wanted / (count - 1) : tightest(radius) + 2) : 0;
      const needed = step * (count - 1);
      if (needed <= arc.high - arc.low) {
        const centre = Math.min(Math.max(0, arc.low + needed / 2), arc.high - needed / 2);
        return place(radius, step, away + centre - needed / 2, count, true);
      }
    }
  }
  // Not all of them: a wheel, at the radius that shows the most, with what fits on its arc
  let best: { radius: number; arc: { low: number; high: number }; step: number; visible: number } | null = null;
  for (const radius of radii) {
    const arc = arcAt(radius);
    if (!arc) continue;
    const step = tightest(radius) + 2;
    const visible = Math.max(1, Math.min(count, Math.floor((arc.high - arc.low) / step) + 1));
    if (!best || visible > best.visible) best = { radius, arc, step, visible };
  }
  if (!best) {
    // Nowhere clear at all: centred away from the edge at the set distance
    const step = count > 1 ? tightest(base) + 2 : 0;
    return place(base, step, away - (step * (count - 1)) / 2, count, false);
  }
  const width = best.step * (best.visible - 1);
  const centre = Math.min(Math.max(0, best.arc.low + width / 2), best.arc.high - width / 2);
  return place(best.radius, best.step, away + centre - width / 2, best.visible, true);
}

/**
 * Which orbital a point is over, by its angle from the electron's centre: -1
 * for none (or the middle). On a wheel turned by `turn`, only the ones that show.
 */
export function orbitalAt(orbit: Orbit, size: number, electronRadius: number, px: number, py: number, turn = 0): number {
  const dx = px - orbit.x;
  const dy = py - orbit.y;
  const distance = Math.hypot(dx, dy);
  if (distance < electronRadius * 0.85 || distance > orbit.radius + size) return -1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let best = -1;
  let bestGap = Infinity;
  Array.from({ length: orbit.count }, (_, index) => spotOn(orbit, index, turn)).forEach((spot, index) => {
    if (spot.shown < 0.5) return;
    const gap = Math.abs(((angle - spot.angle + 540) % 360) - 180);
    if (gap < bestGap) {
      bestGap = gap;
      best = index;
    }
  });
  return bestGap <= Math.max(orbit.step / 2 + 8, 30) ? best : -1;
}
