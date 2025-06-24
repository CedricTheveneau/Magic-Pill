"use client"
import React, { useEffect, useState, useRef } from "react";
import "./magicpill.css";

import Notification from "./Notification/Notification"
import Navbar from "./Navbar/Navbar";

import { MagicPillType } from "./types/magicPill";

interface MagicPillProps {
  pillData: MagicPillType;
}

const MagicPill = ({ pillData }: MagicPillProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsVisible(true);
    if (!isHovering) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pillData, isHovering]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  return (
    <div
      className={
        isVisible ? "magicPill out" : isHovering ? "magicPill active" : "magicPill entry"
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
