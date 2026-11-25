import type { CSSProperties } from "react";

/**
 * Readable by screen readers, invisible on screen. Inline, so it's independent
 * of the stylesheets: it must work for unstyled pills too.
 */
export const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};
