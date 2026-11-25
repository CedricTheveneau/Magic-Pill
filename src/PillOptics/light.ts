// The light that follows the pointer: while it runs, every pill given faces it.

const PROPERTIES = ["--_mp-angle", "--_mp-sheen-x", "--_mp-sheen-y"] as const;

/** Where the pointer is from the pill: the light's angle, and its highlight's place. Pure, so it can be tested. */
export function aim(x: number, y: number, { left, top, width, height }: DOMRect): readonly [string, string, string] {
  const dx = x - left;
  const dy = y - top;
  return [`${Math.atan2(dy - height / 2, dx - width / 2)}rad`, `${dx}px`, `${dy}px`];
}

/** Returns what stops it, and gives the pills their own light back. */
export function followPointer(pills: ReadonlySet<HTMLElement>): () => void {
  let frame = 0;
  const onMove = ({ clientX, clientY, pointerType }: PointerEvent) => {
    // A finger only passes by: it would leave the light where it was lifted
    if (pointerType === "touch") return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      // Read them all, then write
      const aims = [...pills].map((pill) => [pill, aim(clientX, clientY, pill.getBoundingClientRect())] as const);
      for (const [pill, values] of aims) {
        PROPERTIES.forEach((property, index) => pill.style.setProperty(property, values[index]));
      }
    });
  };
  document.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    document.removeEventListener("pointermove", onMove);
    cancelAnimationFrame(frame);
    for (const pill of pills) PROPERTIES.forEach((property) => pill.style.removeProperty(property));
  };
}
