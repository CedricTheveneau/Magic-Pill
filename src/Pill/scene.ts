"use client"
// A pill whose content changes altogether (a form, then "You're in!"). It goes
// from one to the other like a host between its navbar and a notification:
// through the circle, or sliding.
import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { captureSwap, playSwap, readMorphTimings, type SwapCapture } from "./morph";
import type { PillPresence, PillVariant, SceneChange } from "./types";
import { prefersReducedMotion } from "../utils/timing";

export type SceneKey = string | number | undefined;

/** What the pill shows of a scene. */
interface SceneContent {
  children: ReactNode;
  variant: PillVariant;
}

const CLOSED: ReadonlySet<PillPresence> = new Set(["rest", "hidden"]);

interface SceneOptions extends SceneContent {
  scene: SceneKey;
  change: SceneChange;
  presence: PillPresence;
  /** Off: the new content just shows (unstyled pills). */
  enabled: boolean;
  /** The old scene is out of sight: its panel, if it was open, closes. */
  onClosed: () => void;
}

/**
 * Through the circle: the old content stays while the pill closes on it, the
 * new one is laid out in the closed pill, then the pill opens. Returns what to
 * show, and the level to show it at.
 */
export function useScene(
  rootRef: RefObject<HTMLElement | null>,
  { scene, change, presence, enabled, onClosed, children, variant }: SceneOptions,
): SceneContent & { key: SceneKey; presence: PillPresence } {
  const [shownScene, setShownScene] = useState(scene);
  // The new content is in, and the pill is still closed
  const [isOpening, setIsOpening] = useState(false);
  const animates = enabled && change === "circle" && !CLOSED.has(presence);
  const isClosing = shownScene !== scene && animates;

  // The shown scene's content, as last given
  const shown = useRef<SceneContent>({ children, variant });
  if (!isClosing) shown.current = { children, variant };
  const closed = useRef(onClosed);
  closed.current = onClosed;
  const hadFocus = useRef(false);

  useEffect(() => {
    if (shownScene === scene) return;
    const root = rootRef.current;
    if (!isClosing || !root || prefersReducedMotion()) {
      setShownScene(scene);
      return;
    }
    hadFocus.current = root.contains(document.activeElement);
    const { fade, change: duration } = readMorphTimings(root);
    const timer = setTimeout(() => {
      closed.current();
      setShownScene(scene);
      setIsOpening(true);
    }, fade + duration);
    return () => clearTimeout(timer);
  }, [rootRef, scene, shownScene, isClosing]);

  // Laid out closed: have the browser style it, then open (as the host does, L21)
  useEffect(() => {
    const root = rootRef.current;
    if (!isOpening || !root) return;
    // The focus left with the old content
    if (hadFocus.current) focusIfLost(root);
    void root.offsetWidth;
    setIsOpening(false);
  }, [rootRef, isOpening]);

  return { ...shown.current, key: isClosing ? shownScene : scene, presence: isClosing || (isOpening && !CLOSED.has(presence)) ? "rest" : presence };
}

/** The focus was on what left: the pill takes it, so the keyboard goes on from there. */
function focusIfLost(root: HTMLElement) {
  if (document.activeElement !== document.body) return;
  if (!root.hasAttribute("tabindex")) root.tabIndex = -1;
  root.focus({ preventScroll: true });
}

interface SceneWatchProps {
  scene: SceneKey;
  /** Whether it slides. */
  slides: boolean;
  target: RefObject<HTMLElement | null>;
}

/**
 * Sliding: the old content is copied just before React updates the page, and
 * slides out as the new one comes in.
 */
export class SceneWatch extends Component<SceneWatchProps> {
  getSnapshotBeforeUpdate(previous: Readonly<SceneWatchProps>): SwapCapture | null {
    const { scene, slides, target } = this.props;
    const presence = target.current?.dataset.presence as PillPresence | undefined;
    if (!slides || previous.scene === scene || !presence || CLOSED.has(presence) || presence === "panel") return null;
    return captureSwap(target.current);
  }

  componentDidUpdate(_props: unknown, _state: unknown, capture: SwapCapture | null) {
    if (capture && this.props.target.current) playSwap(this.props.target.current, capture);
  }

  render() {
    return null;
  }
}
