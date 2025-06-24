"use client"
import React, { useState } from "react";
import "../magicpill.css";

import { MagicPillNavbar, MagicPillNavbarItem } from "../types";
import { getIconComponent, CTAIcons } from "../utils/icons";

interface NavItemsProps {
  mode: "navbar";
  navbar: MagicPillNavbar;
}

const Navbar = ( {navbar}: NavItemsProps) => {

  const { navItems } = navbar || {};

  const [active, setActive] = useState("Home");

  return (
    <nav className="navbar">
    <ul className="navbarList">
      {navItems?.map((item: MagicPillNavbarItem, index: number) => {
        const IconComponent = getIconComponent(item.icon, CTAIcons);
        return (
          <a key={index} className={active === item.label ? "CTA active" : "CTA"} href={item.link} onClick={() => setActive(item.label || "")}>
            {IconComponent && <IconComponent className="label" />}
            <span>{item.label}</span>
          </a>
        );
      })}
    </ul>
  </nav>
  );
};

export default Navbar;
