// Where the satellites go around the host, and how far the host moves to
// keep the group where its placement says. No DOM here: sizes in, boxes out.
//
// Along the host's edge (the main axis: across the screen for a top or
// bottom pill, down it for a sidebar), the electrons go after the pill,
// before it, or beside it, one row towards the page. The group is centred
// (or at the start or the end, for a placement's -start and -end), or the
// satellites are spread to the screen's edges. Short of room, the last ones
// move beside the pill, like the ladder.
import type { PillPlacement } from "../Pill/types";
import type { ElectronLine, ElectronSide, SatelliteArrangement } from "./types";

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Satellite {
  id: string;
  width: number;
  height: number;
}

export interface SatelliteLayoutInput {
  viewport: { width: number; height: number };
  /** Where the host is on its own, without the shift the satellites give it */
  host: Box;
  /**
   * How long the host can get along its main axis when it gives the
   * satellites room (a navbar folding its labels): what decides whether
   * they fit in its row. Default: its own length.
   */
  hostMin?: number;
  placement: PillPlacement;
  /** A sidebar: the main axis runs down the screen */
  vertical: boolean;
  rtl: boolean;
  /** The electrons that are out, in the order they were started */
  electrons: readonly Satellite[];
  side: ElectronSide;
  line: ElectronLine;
  arrange: SatelliteArrangement;
  gap: number;
  /** The screen's offset, as the placements keep it */
  offset: number;
}

export interface SatelliteLayout {
  /** How far the host moves along its main axis (right or down for a positive value), in px */
  shift: number;
  /** The room the satellites take in the host's row, so that it can size itself in the rest */
  reserve: number;
  boxes: Record<string, Box>;
  /** The ones that went beside the pill for lack of room */
  movedBeside: string[];
}

export function planSatellites(input: SatelliteLayoutInput): SatelliteLayout {
  const { viewport, host, placement, vertical, electrons, side, line, gap, offset } = input;
  const rtl = input.rtl && !vertical;
  const sizes = new Map(electrons.map((electron) => [electron.id, electron]));
  const len = (box: { width: number; height: number }) => (vertical ? box.height : box.width);
  const mainLength = vertical ? viewport.height : viewport.width;
  const available = mainLength - offset * 2;

  // Which side each one takes; across, the ones after the first stack on it
  const sides: Record<ElectronSide, string[]> = { before: [], after: [], beside: [] };
  const stacked: string[] = [];
  electrons.forEach((electron, index) => {
    if (line === "across" && index > 0) stacked.push(electron.id);
    else sides[side].push(electron.id);
  });
  const lengthOf = (ids: readonly string[]) => ids.reduce((sum, id) => sum + len(sizes.get(id)!) + gap, 0);
  const rowLength = () => lengthOf(sides.before) + len(host) + lengthOf(sides.after);
  const leastRowLength = () => lengthOf(sides.before) + Math.min(len(host), input.hostMin ?? Infinity) + lengthOf(sides.after);

  // Short of room, even with the host as short as it gets: the last ones go beside the pill
  const movedBeside: string[] = [];
  while (leastRowLength() > available) {
    const from = sides.after.length > 0 ? "after" : sides.before.length > 0 ? "before" : null;
    if (!from) break;
    const id = sides[from].pop()!;
    sides.beside.push(id);
    movedBeside.push(id);
  }

  // Along the edge, measured from its start (the right in a right-to-left page)
  const align = vertical ? "center" : placement.endsWith("-start") ? "start" : placement.endsWith("-end") ? "end" : "center";
  const hostStartOnItsOwn = vertical ? host.top : rtl ? viewport.width - host.left - host.width : host.left;
  const at: Record<string, number> = {};
  // Gathered: before, the pill, after, in one row, centred or at an edge
  const gather = () => {
    const total = rowLength();
    let cursor = align === "start" ? offset : align === "end" ? mainLength - offset - total : mainLength / 2 - total / 2;
    for (const id of [...sides.before].reverse()) {
      at[id] = cursor;
      cursor += len(sizes.get(id)!) + gap;
    }
    at.host = cursor;
    cursor += len(host) + gap;
    for (const id of sides.after) {
      at[id] = cursor;
      cursor += len(sizes.get(id)!) + gap;
    }
  };
  // Spread: the pill where it is on its own, the satellites at the screen's edges, if they fit
  const spread = () => {
    const hostStart =
      align === "start"
        ? offset + lengthOf(sides.before)
        : align === "end"
          ? mainLength - offset - lengthOf(sides.after) - len(host)
          : mainLength / 2 - len(host) / 2;
    const roomBefore = hostStart - offset - lengthOf(sides.before);
    const roomAfter = mainLength - offset - (hostStart + len(host)) - lengthOf(sides.after);
    if (roomBefore < 0 || roomAfter < 0) return false;
    at.host = hostStart;
    let cursor = offset;
    for (const id of [...sides.before].reverse()) {
      at[id] = cursor;
      cursor += len(sizes.get(id)!) + gap;
    }
    cursor = mainLength - offset;
    for (const id of [...sides.after].reverse()) {
      cursor -= len(sizes.get(id)!);
      at[id] = cursor;
      cursor -= gap;
    }
    return true;
  };
  if (input.arrange !== "spread" || !spread()) gather();
  const hostStart = at.host;
  const hostEnd = hostStart + len(host);
  // Beside the pill: from its end, inwards
  let cursor = hostEnd;
  for (const id of sides.beside) {
    cursor -= len(sizes.get(id)!);
    at[id] = cursor;
    cursor -= gap;
  }

  // Across the edge: on the host's edge line, beside ones a row in, stacked ones a row further
  const towardsPage = placement.startsWith("bottom") || placement === "right" ? -1 : 1;
  const boxes: Record<string, Box> = {};
  const toBox = (id: string, mainStart: number, crossStart: number): Box => {
    const { width, height } = sizes.get(id)!;
    if (vertical) return { left: crossStart, top: mainStart, width, height };
    const left = rtl ? viewport.width - mainStart - width : mainStart;
    return { left, top: crossStart, width, height };
  };
  const hostCross = vertical ? host.left : host.top;
  const hostThick = vertical ? host.width : host.height;
  const onEdge = (thick: number) => (towardsPage < 0 ? hostCross + hostThick - thick : hostCross);
  const rowIn = (thick: number, from: number, fromThick: number) => (towardsPage < 0 ? from - gap - thick : from + fromThick + gap);
  const thickOf = (id: string) => (vertical ? sizes.get(id)!.width : sizes.get(id)!.height);
  for (const id of [...sides.before, ...sides.after]) boxes[id] = toBox(id, at[id], onEdge(thickOf(id)));
  for (const id of sides.beside) boxes[id] = toBox(id, at[id], rowIn(thickOf(id), hostCross, hostThick));
  let previous = electrons[0]?.id;
  for (const id of stacked) {
    const base = boxes[previous];
    const baseCross = vertical ? base.left : base.top;
    const baseThick = vertical ? base.width : base.height;
    const mainStart = vertical ? base.top : rtl ? viewport.width - base.left - base.width : base.left;
    boxes[id] = toBox(id, mainStart, rowIn(thickOf(id), baseCross, baseThick));
    previous = id;
  }

  const shiftAlong = hostStart - hostStartOnItsOwn;
  return {
    shift: rtl ? -shiftAlong : shiftAlong,
    reserve: vertical ? 0 : lengthOf(sides.before) + lengthOf(sides.after),
    boxes,
    movedBeside,
  };
}
