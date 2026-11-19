"use client";
import { createContext, useContext, useState } from "react";

const DemoContext = createContext({ showNavbar: true, setShowNavbar: () => {} });

/** Demo-wide settings: whether the main pill has its navbar base layer. */
export function DemoProvider({ children }) {
  const [showNavbar, setShowNavbar] = useState(true);
  return <DemoContext.Provider value={{ showNavbar, setShowNavbar }}>{children}</DemoContext.Provider>;
}

export const useDemo = () => useContext(DemoContext);
