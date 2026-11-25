// The lens: an SVG filter that bends what's behind the pill along its edge.
// Pure, so it can be tested. Its displacement map is drawn with percentages,
// so it follows the pill's size in every morph without a script: only the
// corners' radius and the tokens make a new one.

export interface Lens {
  /** The pill's corners, in px */
  radius: number;
  /** How wide the curved edge is, in px */
  edge: number;
  /** How far it bends at most, in px */
  depth: number;
  /** How far apart red and blue land, 0 to 1 */
  fringe: number;
}

const STEPS = 16;

/**
 * How much the light bends, from the edge (first) to the flat top (last),
 * 0 to 1: Snell's law through a rounded glass edge (refractive index 1.5).
 */
export const BEND: readonly number[] = (() => {
  const bend = Array.from({ length: STEPS + 1 }, (_, step) => {
    const inner = 1 - Math.min(0.999, Math.max(0.012, step / STEPS));
    const height = (1 - inner ** 4) ** 0.25;
    const angle = Math.atan(inner ** 3 / (1 - inner ** 4) ** 0.75);
    return Math.tan(angle - Math.asin(Math.sin(angle) / 1.5)) * (height + 0.35);
  });
  const most = Math.max(...bend);
  return bend.map((value) => value / most);
})();

/** Rounded, so pills with about the same lens share one. */
export function makeLens(radius: number, edge: number, refraction: number, fringe: number): Lens | null {
  const round = (value: number, per: number) => Math.round(value * per) / per;
  const lens = {
    radius: round(radius, 2),
    edge: round(Math.min(edge, radius), 2),
    depth: round(Math.max(0, refraction) * 90, 2),
    fringe: round(Math.min(1, Math.max(0, fringe)), 100),
  };
  return lens.radius > 0 && lens.edge > 0 && lens.depth > 0 ? lens : null;
}

export const lensId = ({ radius, edge, depth, fringe }: Lens): string =>
  `mp-lens-${[radius, edge, depth, fringe].join("-").replace(/\./g, "_")}`;

const stop = (offset: number, colour: string, opacity = 1) =>
  `<stop offset="${offset.toFixed(3)}" stop-color="${colour}" stop-opacity="${opacity.toFixed(3)}"/>`;
const NEUTRAL = "#808080";

/**
 * The displacement map, as a data URI: red bends along x, green along y,
 * #808080 doesn't bend. Every side points inwards, faded to neutral by how
 * little the light bends at that depth. The corners' direction (x/r, y/r)
 * is two ramps over a disc, so their fade is corrected by r.
 */
export function lensMap({ radius, edge }: Pick<Lens, "radius" | "edge">): string {
  const size = 2 * radius;
  const sideFade = BEND.map((bend, step) => stop(step / STEPS, NEUTRAL, 1 - bend)).join("");
  const cornerFade = BEND.map((bend, step) => {
    const r = 1 - ((step / STEPS) * edge) / radius;
    return stop(r, NEUTRAL, 1 - Math.min(1, r > 0 ? bend / r : 0));
  })
    .reverse()
    .join("");
  const linear = (id: string, x1: number, y1: number, x2: number, y2: number, stops: string) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
  const rect = (attributes: string, fill: string) => `<rect ${attributes} fill="${fill}"/>`;
  const side = (attributes: string, colour: string, fade: string) =>
    rect(attributes, colour) + rect(attributes, `url(#${fade})`);
  // Nested <svg>s anchored to the right and the bottom
  const at = (x: 0 | 1, y: 0 | 1, content: string) =>
    `<svg x="${x * 100}%" y="${y * 100}%" overflow="visible">${content}</svg>`;
  const corner = (x: 0 | 1, y: 0 | 1) =>
    at(
      x,
      y,
      `<svg x="${-x * radius}" y="${-y * radius}" width="${radius}" height="${radius}" style="isolation:isolate"><use href="#d" x="${-x * radius}" y="${-y * radius}"/></svg>`,
    );
  const disc = `width="${size}" height="${size}"`;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>${
      linear("t", 0, 0, 0, 1, sideFade) +
      linear("b", 0, 1, 0, 0, sideFade) +
      linear("l", 0, 0, 1, 0, sideFade) +
      linear("r", 1, 0, 0, 0, sideFade) +
      linear("x", 0, 0, 1, 0, stop(0, "#f00") + stop(1, "#000")) +
      linear("y", 0, 0, 0, 1, stop(0, "#0f0") + stop(1, "#000"))
    }<radialGradient id="c">${cornerFade}</radialGradient><g id="d">${
      rect(disc, "url(#x)") +
      rect(`${disc} style="mix-blend-mode:screen"`, "url(#y)") +
      rect(disc, "url(#c)")
    }</g></defs>${
      rect(`width="100%" height="100%"`, NEUTRAL) +
      side(`width="100%" height="${edge}"`, "#80ff00", "t") +
      at(0, 1, side(`y="${-edge}" width="100%" height="${edge}"`, "#800000", "b")) +
      side(`width="${edge}" height="100%"`, "#ff8000", "l") +
      at(1, 0, side(`x="${-edge}" width="${edge}" height="100%"`, "#008000", "r")) +
      corner(0, 0) +
      corner(1, 0) +
      corner(0, 1) +
      corner(1, 1)
    }</svg>`,
  )}`;
}

/**
 * Whether the browser draws SVG filters behind an element. Only Chromium
 * does; Safari would drop the whole backdrop-filter, and @supports says yes
 * everywhere, so the others are told by what only they know.
 */
export function canRefract(): boolean {
  try {
    if (!CSS.supports("not ((-moz-appearance: none) or (font: -apple-system-body))")) return false;
    // Without a GPU, Chromium draws the lens off-centre, by the size of the shadow
    const gl = document.createElement("canvas").getContext("webgl", { failIfMajorPerformanceCaveat: true });
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}
