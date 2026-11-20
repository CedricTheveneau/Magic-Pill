// What the user last interacted with: a pointer (mouse, touch, pen) or the
// keyboard. Focus that follows a tap isn't keyboard focus: it shouldn't pause
// a notification or look like keyboard focus (L22).

export type InputModality = "keyboard" | "pointer";

// Until the first interaction, treat focus as keyboard focus: the safe side
// (a pause, a visible focus) for keyboard and assistive technology users
let modality: InputModality = "keyboard";
let listening = false;

const onPointer = () => {
  modality = "pointer";
};

const onKey = (event: KeyboardEvent) => {
  // Shortcuts such as Cmd+Tab don't move focus inside the page
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  modality = "keyboard";
};

/** Starts listening (once, in the capture phase, so nothing can stop it). */
export function trackInputModality(): void {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("pointerdown", onPointer, true);
  document.addEventListener("keydown", onKey, true);
}

export function getInputModality(): InputModality {
  return modality;
}

/** For tests. */
export function resetInputModality(): void {
  modality = "keyboard";
}
