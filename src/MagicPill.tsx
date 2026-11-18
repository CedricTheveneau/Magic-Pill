"use client"
import { useEffect, useState, useRef, type FocusEvent } from "react";

import Notification from "./Notification/Notification"
import Navbar from "./Navbar/Navbar";

import { MagicPillType } from "./types";

interface MagicPillProps {
  pillData: MagicPillType;
}

const MagicPill = ({ pillData }: MagicPillProps) => {
  const [active, setActive] = useState<boolean>(false);
  const [exit, setExit] = useState<boolean>(true);
  const entryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The auto-hide pauses while the pill is hovered (L15) or holds keyboard focus (Y3).
  // Tracked in every mode: the pointer or focus may already be on the pill when a notification arrives.
  const hoveringRef = useRef<boolean>(false);
  const focusedRef = useRef<boolean>(false);
  const isPaused = () => hoveringRef.current || focusedRef.current;

  const clearEntryAnimation = () => {
    if (entryTimeoutRef.current) {
      clearTimeout(entryTimeoutRef.current);
      entryTimeoutRef.current = null;
    }
  };

  const clearExitAnimation = () => {
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
  };

  const startExitAnimation = () => {
    clearExitAnimation();
    exitTimeoutRef.current = setTimeout(() => {
      setActive(false);
      setExit(true);
    }, 5000);
  };

  // Only called in notification mode. The effect cleanup clears this timer
  // whenever the mode changes or the pill unmounts, so the callback can't
  // act on a mode that is no longer current (L5).
  const displayMagicPill = () => {
    setExit(false);
    clearEntryAnimation();
    entryTimeoutRef.current = setTimeout(() => {
      entryTimeoutRef.current = null;
      setActive(true);
      // While paused, the exit timer starts when the pointer and focus have left
      if (!isPaused()) {
        startExitAnimation();
      }
    }, 2500);
  };

  // Every visible field of the notification, as primitives: new content
  // replays the pill, while the same content in a new object doesn't (L1)
  const notification = pillData.mode === "notification" ? pillData.notification : undefined;

  useEffect(() => {
    if (pillData.mode === "notification") {
      displayMagicPill();
    } else {
      setActive(true);
      setExit(false);
    }

    return () => {
      clearEntryAnimation();
      clearExitAnimation();
    };
  }, [
    pillData.mode,
    notification?.icon,
    notification?.message,
    notification?.cta?.icon,
    notification?.cta?.label,
    notification?.cta?.link,
    notification?.info?.title,
    notification?.info?.content,
    notification?.info?.closeLabel,
  ]);

  const pauseExitAnimation = () => {
    if (pillData.mode === "notification") {
      clearExitAnimation();
    }
  };

  const resumeExitAnimation = () => {
    if (pillData.mode === "notification" && active && !isPaused()) {
      startExitAnimation();
    }
  };

  const handleMouseEnter = () => {
    hoveringRef.current = true;
    pauseExitAnimation();
  };

  const handleMouseLeave = () => {
    hoveringRef.current = false;
    resumeExitAnimation();
  };

  const handleFocus = () => {
    focusedRef.current = true;
    pauseExitAnimation();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    // Focus moving between elements inside the pill keeps it paused
    focusedRef.current = event.currentTarget.contains(event.relatedTarget as Node | null);
    resumeExitAnimation();
  };

  return (
    <div
      className={
        exit ? "magicPill out" : active ? "magicPill active" : "magicPill entry"
      }
      // Live region (Y1): always registered, so screen readers pick up a
      // notification that replaces the navbar; non-atomic, so only what
      // changed is read out
      aria-live="polite"
      aria-atomic="false"
      role={pillData.mode === "notification" ? "status" : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {pillData.mode === "notification" ? (
        <Notification {...pillData} />
      ) : pillData.mode === "navbar" ? (
        <Navbar {...pillData} />
      ) : null}
    </div>
  );
};

export default MagicPill;
