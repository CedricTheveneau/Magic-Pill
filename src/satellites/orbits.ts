// Where an electron's orbitals go: on an arc around it, on the side away from
// the screen's edge, clear of the host, the other satellites and the screen's
// edges. If they don't all fit at the set distance, the arc moves out a
// little (up to one orbital's size). No DOM here: boxes in, spots out.
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
}

export interface Orbit {
  /** The electron's centre */
  x: number;
  y: number;
  radius: number;
  /** Between two orbitals, in degrees */
  step: number;
  spots: OrbitSpot[];
  /** They fit, clear of everything */
  clear: boolean;
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

  const place = (radius: number, step: number, first: number, clear: boolean): Orbit => {
    const spots = Array.from({ length: count }, (_, index) => {
      const slot = input.rtl ? count - 1 - index : index;
      const angle = first + slot * step;
      return { ...at(radius, angle), angle };
    });
    return { x, y, radius, step, spots, clear };
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
        return place(radius, step, away + centre - needed / 2, true);
      }
    }
  }
  // No room for all of them, clear of everything: centred away from the edge at the set distance
  const step = count > 1 ? tightest(base) + 2 : 0;
  return place(base, step, away - (step * (count - 1)) / 2, false);
}

/** Which orbital a point is over, by its angle from the electron's centre: -1 for none (or the middle). */
export function orbitalAt(orbit: Orbit, size: number, electronRadius: number, px: number, py: number): number {
  const dx = px - orbit.x;
  const dy = py - orbit.y;
  const distance = Math.hypot(dx, dy);
  if (distance < electronRadius * 0.85 || distance > orbit.radius + size) return -1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let best = -1;
  let bestGap = Infinity;
  orbit.spots.forEach((spot, index) => {
    const gap = Math.abs(((angle - spot.angle + 540) % 360) - 180);
    if (gap < bestGap) {
      bestGap = gap;
      best = index;
    }
  });
  return bestGap <= Math.max(orbit.step / 2 + 8, 30) ? best : -1;
}
