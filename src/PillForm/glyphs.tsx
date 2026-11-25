// Small signs the fields draw. Not exported: icons are the app's to choose.
import type { ReactNode } from "react";

const Glyph = ({ children, width = 2.4 }: { children: ReactNode; width?: number }) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const AlertGlyph = () => (
  <Glyph width={3}>
    <path d="M12 6v7M12 17.6v.01" />
  </Glyph>
);

export const CalendarGlyph = () => (
  <Glyph>
    <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
    <path d="M3.5 10.5h17M8.5 3v4M15.5 3v4" />
  </Glyph>
);

export const ChevronGlyph = () => (
  <Glyph>
    <path d="m6 9 6 6 6-6" />
  </Glyph>
);

export const ClockGlyph = () => (
  <Glyph>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Glyph>
);

export const EyeGlyph = ({ crossed }: { crossed: boolean }) => (
  <Glyph>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />
    {crossed && <path d="M4 20 20 4" />}
  </Glyph>
);

export const SearchGlyph = () => (
  <Glyph>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Glyph>
);
