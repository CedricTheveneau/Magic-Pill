"use client";
import React, { Dispatch, SetStateAction } from "react";
import { MagicPillType, MagicPillNavbarItem } from "../types";
import {
  handleNavItemLabelChange,
  handleNavItemLinkChange,
  handleNavItemIconChange,
  handleAddNavItem,
  handleDeleteNavItem,
} from "../utils/handlers";
import { CTAIcon } from "../types";
import { CTAIcons } from "../utils/icons";

interface NavbarConfigProps {
  pillData: MagicPillType;
  setPillData: Dispatch<SetStateAction<MagicPillType>>;
}

const NavbarConfig = ({ pillData, setPillData }: NavbarConfigProps) => {
  if (pillData.mode !== "navbar") return null;

  const icons: CTAIcon[] = Object.keys(CTAIcons) as unknown as CTAIcon[];

  return (
    <div className="tile enlarged">
      <h3 className="title">Configure navbar items</h3>
      <div className="navItemsContainer">
        {pillData.navbar.navItems.map((item: MagicPillNavbarItem, index: number) => (
          <div key={index} className="navItemForm">
            <div className="formRow">
              <input
                type="text"
                placeholder="Label (e.g. Home)"
                value={item.label}
                onChange={(e) => handleNavItemLabelChange(e, index, setPillData)}
              />
              <input
                type="text"
                placeholder="Link (e.g. /home)"
                value={item.link}
                onChange={(e) => handleNavItemLinkChange(e, index, setPillData)}
              />
              <select
                value={item.icon}
                onChange={(e) => handleNavItemIconChange(e, index, setPillData)}
              >
                {icons.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon.charAt(0).toUpperCase() + icon.slice(1)}
                  </option>
                ))}
              </select>
              {pillData.navbar.navItems.length > 1 && (
                <button
                  onClick={() => handleDeleteNavItem(index, setPillData)}
                  className="deleteButton"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => handleAddNavItem(setPillData)} className="addButton">
          Add Nav Item
        </button>
      </div>
    </div>
  );
};

export default NavbarConfig; 