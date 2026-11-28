"use client";
// The docs' two background activities: a focus timer and an upload. They live
// here, outside any page, so that they keep running while you go elsewhere in
// the site: the electron is how you keep them in reach.
import { pill, type ElectronOptions } from "magic-pill";

import { CrossIcon, PauseIcon, PlayIcon, PlusIcon, SkipIcon, StopIcon, UploadIcon } from "../../icons";

/**
 * Where each one goes back to: pages of their own, as an app's timer would
 * have its timer page (the router adds the site's base path). Not this page,
 * so that they come out at once here, and a tap takes you somewhere.
 */
export const TIMER_PAGE = { href: "/", name: "the Playground" };
export const UPLOAD_PAGE = { href: "/templates/", name: "Templates" };

const FOCUS = 25 * 60;
const BREAK = 5 * 60;
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

interface Timer {
  id: string;
  mode: "focus" | "break";
  left: number;
  total: number;
  paused: boolean;
  announce?: string;
  interval: ReturnType<typeof setInterval>;
}
let timer: Timer | null = null;

function timerElectron(current: Timer): ElectronOptions {
  const minutes = Math.ceil(current.left / 60);
  return {
    id: current.id,
    label: current.mode === "focus" ? "Focus timer" : "Break",
    value: time(current.left),
    valueText: `${minutes} minute${minutes > 1 ? "s" : ""} left${current.paused ? ", paused" : ""}`,
    progress: 1 - current.left / current.total,
    variant: current.mode === "break" ? "success" : undefined,
    href: TIMER_PAGE.href,
    announce: current.announce,
    orbitals: [
      { id: "add", icon: <PlusIcon />, label: "+1 min", onClick: () => change((t) => ({ left: t.left + 60, total: t.total + 60 })) },
      {
        id: "pause",
        icon: current.paused ? <PlayIcon /> : <PauseIcon />,
        label: current.paused ? "Resume" : "Pause",
        onClick: () => change((t) => ({ paused: !t.paused })),
      },
      {
        id: "skip",
        icon: <SkipIcon />,
        label: current.mode === "focus" ? "Skip to the break" : "Back to focus",
        onClick: () => change((t) => (t.mode === "focus" ? { mode: "break", left: BREAK, total: BREAK } : { mode: "focus", left: FOCUS, total: FOCUS })),
      },
      { id: "stop", icon: <StopIcon />, label: "Stop", onClick: stopFocus },
    ],
  };
}

function change(patch: (current: Timer) => Partial<Timer>) {
  if (!timer) return;
  timer = { ...timer, ...patch(timer) };
  pill().updateElectron(timer.id, timerElectron(timer));
}

/** Starts the focus timer (or does nothing if it runs already). */
export function startFocus() {
  if (timer) return;
  const interval = setInterval(() => {
    if (!timer || timer.paused) return;
    if (timer.left > 1) return change((t) => ({ left: t.left - 1 }));
    // The end of a session: the other one starts, said once
    change((t) =>
      t.mode === "focus"
        ? { mode: "break", left: BREAK, total: BREAK, announce: "Time for a break" }
        : { mode: "focus", left: FOCUS, total: FOCUS, announce: "Back to focus" },
    );
  }, 1000);
  // An id of its own: the upload has another
  timer = { id: "docs-focus-timer", mode: "focus", left: FOCUS, total: FOCUS, paused: false, interval };
  pill().electron(timerElectron(timer));
}

export function stopFocus() {
  if (!timer) return;
  clearInterval(timer.interval);
  pill().endElectron(timer.id);
  timer = null;
}

interface Upload {
  id: string;
  done: number;
  paused: boolean;
  interval: ReturnType<typeof setInterval>;
}
let upload: Upload | null = null;

function uploadElectron(current: Upload): ElectronOptions {
  return {
    id: current.id,
    label: "Upload",
    value: `${current.done}%`,
    valueText: `${Math.floor(current.done / 10) * 10}%${current.paused ? ", paused" : ""}`,
    progress: current.done / 100,
    href: UPLOAD_PAGE.href,
    // It's done: no need to go back into the pill
    ending: "pop",
    orbitals: [
      {
        id: "pause",
        icon: current.paused ? <PlayIcon /> : <PauseIcon />,
        label: current.paused ? "Resume the upload" : "Pause the upload",
        onClick: () => {
          if (!upload) return;
          upload = { ...upload, paused: !upload.paused };
          pill().updateElectron(upload.id, uploadElectron(upload));
        },
      },
      { id: "cancel", icon: <CrossIcon />, label: "Cancel the upload", onClick: () => endUpload() },
    ],
  };
}

function endUpload(done = false) {
  if (!upload) return;
  clearInterval(upload.interval);
  pill().endElectron(upload.id);
  upload = null;
  if (done) pill().notify({ icon: <UploadIcon />, message: "Your file is uploaded", variant: "success", duration: 4000 });
}

/** Starts an upload of about 40 seconds (or does nothing if one runs already). */
export function startUpload() {
  if (upload) return;
  const interval = setInterval(() => {
    if (!upload || upload.paused) return;
    if (upload.done >= 100) return endUpload(true);
    upload = { ...upload, done: upload.done + 1 };
    pill().updateElectron(upload.id, uploadElectron(upload));
  }, 400);
  upload = { id: "docs-upload", done: 0, paused: false, interval };
  pill().electron(uploadElectron(upload));
}
