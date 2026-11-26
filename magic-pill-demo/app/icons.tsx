// The demo's own icons, drawn like the library's: currentColor, decorative.
// Icons are plain React content, so any SVG works in a pill.
import type { SVGProps } from "react";

const stroke: SVGProps<SVGSVGElement> = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export const BookIcon = () => (
  <svg {...stroke}>
    <path d="M4.5 5.5A2 2 0 0 1 6.5 3.5h13v14h-13a2 2 0 0 0-2 2Zm0 0v14a2 2 0 0 0 2 2h13v-4" />
    <path d="M9 8h6" />
  </svg>
);

export const SparkIcon = () => (
  <svg {...stroke}>
    <path d="M12 3.5c.6 4.4 2.6 6.9 8.5 8.5-5.9 1.6-7.9 4.1-8.5 8.5-.6-4.4-2.6-6.9-8.5-8.5 5.9-1.6 7.9-4.1 8.5-8.5Z" />
  </svg>
);

export const BellIcon = () => (
  <svg {...stroke}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z" />
    <path d="M10 20.5h4" />
  </svg>
);

export const LayersIcon = () => (
  <svg {...stroke}>
    <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8Z" />
    <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
    <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
  </svg>
);

export const CompassIcon = () => (
  <svg {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.5 8.5-2 5-5 2 2-5Z" />
  </svg>
);

export const CapsuleIcon = () => (
  <svg {...stroke}>
    <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" />
    <path d="M12 7.5v9" />
  </svg>
);

export const PanelIcon = () => (
  <svg {...stroke}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M3.5 9h17M8 13.5h8M8 17h5" />
  </svg>
);

export const ModalIcon = () => (
  <svg {...stroke}>
    <rect x="2.5" y="3.5" width="19" height="17" rx="3" strokeDasharray="3 3" />
    <rect x="6.5" y="9" width="11" height="6" rx="3" />
  </svg>
);

export const PillsIcon = () => (
  <svg {...stroke}>
    <rect x="3.5" y="4" width="17" height="6.5" rx="3.25" />
    <rect x="3.5" y="13.5" width="11" height="6.5" rx="3.25" />
  </svg>
);

export const FormIcon = () => (
  <svg {...stroke}>
    <path d="M4 20h16" />
    <path d="M6.5 16.5v-3L15 5a2.1 2.1 0 0 1 3 3l-8.5 8.5Z" />
  </svg>
);

export const CalendarIcon = () => (
  <svg {...stroke}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
    <path d="M3.5 10.5h17M8.5 3v4M15.5 3v4" />
  </svg>
);

export const PaletteIcon = () => (
  <svg {...stroke}>
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 1.5-2.2-.6-1.4.3-2.8 1.8-2.8h1.7a3.5 3.5 0 0 0 3.5-3.5c0-4.8-3.8-8.5-8.5-8.5Z" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
    <circle cx="11.5" cy="7.5" r="1" fill="currentColor" />
    <circle cx="16" cy="9" r="1" fill="currentColor" />
  </svg>
);

export const DropIcon = () => (
  <svg {...stroke}>
    <path d="M12 3.5s6.5 6.6 6.5 11a6.5 6.5 0 0 1-13 0c0-4.4 6.5-11 6.5-11Z" />
    <path d="M9 15a3 3 0 0 0 3 3" />
  </svg>
);

export const GearIcon = () => (
  <svg {...stroke}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2.2" />
    <circle cx="9" cy="17" r="2.2" />
  </svg>
);

export const UserIcon = () => (
  <svg {...stroke}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
  </svg>
);

export const SkipIcon = () => (
  <svg {...stroke}>
    <path d="M6 5.5v13l9.5-6.5ZM19 5.5v13" />
  </svg>
);

export const HeartIcon = () => (
  <svg {...stroke}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...stroke}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const CopyIcon = () => (
  <svg {...stroke}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="3" />
    <path d="M15.5 8.5v-2a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h2" />
  </svg>
);
