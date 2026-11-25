// Adaptive tinting: reads the colours behind each pill given, as the page
// scrolls and changes, for the theme to pick a light or a dark pill and tint it.

export type Colour = readonly [red: number, green: number, blue: number, alpha: number];
export type Scheme = "light" | "dark";

/** Past this, what's underneath no longer shows. */
const OPAQUE = 0.95;
/** A smaller change of colour than this (out of 255) isn't seen, and restyling the pill costs more than reading the page. */
const NOTICEABLE = 10;
/** Where the page is read, as parts of the pill's width and height. */
const ACROSS = [0.06, 0.28, 0.5, 0.72, 0.94];
const DOWN = [0.2, 0.8];
/** How wide a patch of a picture is read around each point, in px. */
const PATCH = 16;
/** Once per burst of scrolling events, and for what changes by itself (a new page, a video…). */
const SCROLL_DELAY = 100;
const INTERVAL = 500;

// ─── Colours (pure, so they can be tested) ──────────────────────────────────

/** What layers look like on top of each other, front to back. */
export function flatten(layers: readonly Colour[]): Colour {
  const flat = [0, 0, 0];
  let alpha = 0;
  for (const layer of layers) {
    const share = (1 - alpha) * layer[3];
    flat.forEach((_, channel) => (flat[channel] += layer[channel] * share));
    alpha += share;
  }
  return alpha === 0 ? [0, 0, 0, 0] : [flat[0] / alpha, flat[1] / alpha, flat[2] / alpha, alpha];
}

/** The mean of some colours, or null without any. */
export function mean(colours: readonly Colour[]): Colour | null {
  if (colours.length === 0) return null;
  const average = (channel: number) => colours.reduce((sum, colour) => sum + colour[channel], 0) / colours.length;
  return [average(0), average(1), average(2), average(3)];
}

/** Whether two colours are far enough apart to be told apart on a pill. */
export const differ = (one: Colour, other: Colour): boolean =>
  [0, 1, 2].some((channel) => Math.abs(one[channel] - other[channel]) >= NOTICEABLE);

const linear = (value: number) => {
  const part = value / 255;
  return part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
};

/** Over this colour, a light pill or a dark one? With a margin around the limit, so it doesn't flicker. */
export function pickScheme([red, green, blue]: Colour, previous?: string): Scheme {
  const luminance = 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
  return luminance > (previous === "light" ? 0.3 : 0.45) ? "light" : "dark";
}

// ─── Reading the page ───────────────────────────────────────────────────────

// One pixel, to have the browser turn any colour or picture into red, green and blue
let pixel: CanvasRenderingContext2D | null = null;

function readPixel(draw: (context: CanvasRenderingContext2D) => void): Colour | null {
  pixel ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!pixel) return null;
  pixel.clearRect(0, 0, 1, 1);
  try {
    draw(pixel);
    const [red, green, blue, alpha] = pixel.getImageData(0, 0, 1, 1).data;
    return [red, green, blue, alpha / 255];
  } catch {
    // A picture from another site can't be read, and spoils the canvas
    pixel = null;
    return null;
  }
}

// A page has few colours, read again and again as it scrolls
const KNOWN_COLOURS = 200;
const knownColours = new Map<string, Colour>();

function readColour(css: string): Colour | null {
  const known = knownColours.get(css);
  if (known) return known;
  const colour = readPixel((context) => {
    context.fillStyle = css;
    context.fillRect(0, 0, 1, 1);
  });
  // An animated colour never comes back: start over rather than grow
  if (knownColours.size >= KNOWN_COLOURS) knownColours.clear();
  if (colour) knownColours.set(css, colour);
  return colour;
}

type Picture = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

// Pictures that can't be read, with what they showed then: no need to try again
const unreadable = new WeakMap<Element, string>();

const sourceOf = (picture: Picture) => ("currentSrc" in picture ? picture.currentSrc : "");

function sizeOf(picture: Picture): readonly [width: number, height: number] {
  if (picture instanceof HTMLImageElement) return [picture.naturalWidth, picture.naturalHeight];
  if (picture instanceof HTMLVideoElement) return [picture.videoWidth, picture.videoHeight];
  return [picture.width, picture.height];
}

/** The mean colour of a picture around a point (as if it filled its box: `object-fit` isn't worth more). */
function readPicture(picture: Picture, x: number, y: number): Colour | null {
  if (unreadable.get(picture) === sourceOf(picture)) return null;
  const [sourceWidth, sourceHeight] = sizeOf(picture);
  const { left, top, width, height } = picture.getBoundingClientRect();
  // Not loaded yet
  if (sourceWidth === 0 || sourceHeight === 0 || width === 0 || height === 0) return null;
  const scaleX = sourceWidth / width;
  const scaleY = sourceHeight / height;
  const colour = readPixel((context) =>
    context.drawImage(
      picture,
      (x - left - PATCH / 2) * scaleX,
      (y - top - PATCH / 2) * scaleY,
      PATCH * scaleX,
      PATCH * scaleY,
      0,
      0,
      1,
      1,
    ),
  );
  if (!colour) unreadable.set(picture, sourceOf(picture));
  return colour;
}

const isPicture = (element: Element): element is Picture => element.matches("img, canvas, video");

/** The layers an element paints at a point, front to back. `url()` backgrounds can't be read. */
function layersOf(element: Element, x: number, y: number): Colour[] {
  const { backgroundColor, backgroundImage } = getComputedStyle(element);
  // A gradient: the mean of its colours
  const stops = (backgroundImage.match(/(?:rgb|hsl|hwb|lab|lch|oklab|oklch|color)a?\([^()]*\)/g) ?? []).map(readColour);
  return [
    isPicture(element) ? readPicture(element, x, y) : null,
    mean(stops.filter((stop) => stop !== null)),
    readColour(backgroundColor),
  ].filter((layer) => layer !== null);
}

/** What the page shows where nothing else does. */
function canvasColour(): Colour {
  for (const element of [document.documentElement, document.body]) {
    const colour = readColour(getComputedStyle(element).backgroundColor);
    if (colour && colour[3] > 0) return colour;
  }
  const scheme = getComputedStyle(document.documentElement).colorScheme ?? "";
  const dark = scheme.includes("dark") && (!scheme.includes("light") || matchMedia("(prefers-color-scheme: dark)").matches);
  return dark ? [18, 18, 18, 1] : [255, 255, 255, 1];
}

/** The page's colour at a point, pills left out, or null out of the window. */
function colourAt(x: number, y: number): Colour | null {
  const elements = document.elementsFromPoint(x, y);
  if (elements.length === 0) return null;
  const layers: Colour[] = [];
  for (const element of elements) {
    if (element.closest('[data-mp="pill"]')) continue;
    layers.push(...layersOf(element, x, y));
    if (flatten(layers)[3] > OPAQUE) return flatten(layers);
  }
  return flatten([...layers, canvasColour()]);
}

/** The mean colour of the page behind the pill, or null when none of it is in the window. */
function colourBehind(pill: HTMLElement): Colour | null {
  const { left, top, width, height } = pill.getBoundingClientRect();
  const colours = ACROSS.flatMap((across) => DOWN.map((down) => colourAt(left + width * across, top + height * down)));
  return mean(colours.filter((colour) => colour !== null));
}

// An open modal makes the page inert: nothing could be found behind the pills
const isModalOpen = () => [...document.querySelectorAll("dialog[open]")].some((dialog) => dialog.matches(":modal"));

/** Keeps the pills' scheme and ambient colour up to date. Returns what stops it, and gives them their own colours back. */
export function adapt(pills: ReadonlySet<HTMLElement>): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const shown = new Map<HTMLElement, Colour>();

  const update = () => {
    if (document.hidden || isModalOpen()) return;
    for (const pill of pills) {
      if (pill.dataset.presence === "hidden") continue;
      const colour = colourBehind(pill);
      const last = shown.get(pill);
      if (!colour || (last && !differ(colour, last))) continue;
      shown.set(pill, colour);
      pill.dataset.scheme = pickScheme(colour, pill.dataset.scheme);
      pill.style.setProperty("--_mp-ambient", `rgb(${colour.slice(0, 3).map(Math.round).join(" ")})`);
    }
  };
  const onScroll = () => {
    timer ??= setTimeout(() => {
      timer = undefined;
      update();
    }, SCROLL_DELAY);
  };

  update();
  // Anything that scrolls, not only the page
  document.addEventListener("scroll", onScroll, { passive: true, capture: true });
  const interval = setInterval(update, INTERVAL);
  return () => {
    document.removeEventListener("scroll", onScroll, { capture: true });
    clearInterval(interval);
    clearTimeout(timer);
    for (const pill of pills) {
      delete pill.dataset.scheme;
      pill.style.removeProperty("--_mp-ambient");
    }
  };
}
