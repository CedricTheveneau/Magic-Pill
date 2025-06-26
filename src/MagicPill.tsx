"use client"
import React, { useEffect, useState, useRef } from "react";
import "./magicpill.css";

import Notification from "./Notification/Notification"
import Navbar from "./Navbar/Navbar";

import { MagicPillType } from "./types";

interface MagicPillProps {
  pillData: MagicPillType;
}

const MagicPill = ({ pillData }: MagicPillProps) => {
  const [active, setActive] = useState<boolean>(false);
  const [exit, setExit] = useState<boolean>(true);
  const [hovering, setHovering] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayMagicPill = () => {
    setExit(false);
    setTimeout(() => {
      setActive(true);
      if (pillData.mode === "notification") {
        startExitAnimation();
      }
    }, 2500);
  };

  const startExitAnimation = () => {
    clearExitAnimation();
    timeoutRef.current = setTimeout(() => {
      setActive(false);
      setExit(true);
    }, 5000);
  };

  const clearExitAnimation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (pillData.mode === "notification") {
      displayMagicPill();
    } else {
      setActive(true);
      setExit(false);
    }

    return () => {
      clearExitAnimation();
    };
  }, [pillData.mode]);

  const handleMouseEnter = () => {
    if (pillData.mode === "notification") {
      setHovering(true);
      clearExitAnimation();
    }
  };

  const handleMouseLeave = () => {
    if (pillData.mode === "notification") {
      setHovering(false);
      if (active) {
        startExitAnimation();
      }
    }
  };

  return (
    <div
      className={
        exit ? "magicPill out" : active ? "magicPill active" : "magicPill entry"
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
