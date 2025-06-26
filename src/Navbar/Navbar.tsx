"use client"
import React, { useState, useEffect } from "react";
import "../magicpill.css";

import { MagicPillNavbar, MagicPillNavbarItem } from "../types";
import { getIconComponent, CTAIcons } from "../utils/icons";
import { handleActiveNavItem } from "../utils/handlers";

interface NavItemsProps {
  mode: "navbar";
  navbar: MagicPillNavbar;
}

const Navbar = ({ navbar }: NavItemsProps) => {
  const { navItems } = navbar || {};
  const [active, setActive] = useState("");

  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const matchingLabel = handleActiveNavItem(currentPath, navItems);
    setActive(matchingLabel);
  }, [navItems]);

  return (
    <nav className="navbar">
      <ul className="navbarList">
        {navItems?.map((item: MagicPillNavbarItem, index: number) => {
          const IconComponent = getIconComponent(item.icon, CTAIcons);
          const isActive = active === item.label;

          return (
            <li key={index} className="navbarItem">
              <a 
              className={isActive ? "CTA active" : "CTA"} 
              href={item.link}
            >
              {IconComponent && <IconComponent className="label" />}
              <span>{item.label}</span>
            </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;
