"use client";
import React from "react";
import { MagicPillType } from "../types";
import { Dispatch, SetStateAction } from "react";
import {
  handleCTAMessageChange,
  handleCTATextChange,
  handleCTALinkChange,
  handleCTACustomLinkChange,
  handleInfoTitleChange,
  handleInfoCustomTitleChange,
  handleInfoCustomContentChange,
} from "../utils/handlers";

interface NotificationConfigBottomProps {
  pillData: MagicPillType;
  setPillData: Dispatch<SetStateAction<MagicPillType>>;
}

const NotificationConfigBottom = ({ pillData, setPillData }: NotificationConfigBottomProps) => {
  if (pillData.mode !== "notification") return null;

  return (
    <>
      <div className="tile">
        <h3 className="title">Write your CTA label</h3>
        <div className="radioSelection">
          <label>
            <input
              type="radio"
              hidden
              name="ctaMessage"
              value="View parcel details"
              onChange={(e) => handleCTAMessageChange(e, setPillData)}
              checked={pillData.notification?.cta?.label === "View parcel details"}
            />
            View parcel details
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaMessage"
              value="Go to cart"
              onChange={(e) => handleCTAMessageChange(e, setPillData)}
              checked={pillData.notification?.cta?.label === "Go to cart"}
            />
            Go to cart
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaMessage"
              value="Sign in"
              onChange={(e) => handleCTAMessageChange(e, setPillData)}
              checked={pillData.notification?.cta?.label === "Sign in"}
            />
            Sign in
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaMessage"
              value="Create an account"
              onChange={(e) => handleCTAMessageChange(e, setPillData)}
              checked={pillData.notification?.cta?.label === "Create an account"}
            />
            Create an account
          </label>
          <input
            type="text"
            placeholder="Type your custom label"
            onChange={(e) => handleCTATextChange(e, setPillData)}
          />
        </div>
      </div>

      <div className="tile">
        <h3 className="title">Add a link to redirect to</h3>
        <div className="radioSelection">
          <label>
            <input
              type="radio"
              hidden
              name="link"
              value="/cart"
              onChange={(e) => handleCTALinkChange(e, setPillData)}
              checked={pillData.notification?.cta?.link === "/cart"}
            />
            /cart
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="link"
              value="/profile"
              onChange={(e) => handleCTALinkChange(e, setPillData)}
              checked={pillData.notification?.cta?.link === "/profile"}
            />
            /profile
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="link"
              value="/order/123456"
              onChange={(e) => handleCTALinkChange(e, setPillData)}
              checked={pillData.notification?.cta?.link === "/order/123456"}
            />
            /order/123456
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="link"
              value="/signup"
              onChange={(e) => handleCTALinkChange(e, setPillData)}
              checked={pillData.notification?.cta?.link === "/signup"}
            />
            /signup
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="link"
              value="/login"
              onChange={(e) => handleCTALinkChange(e, setPillData)}
              checked={pillData.notification?.cta?.link === "/login"}
            />
            /login
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="link"
              value="https://site.com"
              onChange={(e) => handleCTACustomLinkChange(e, setPillData)}
              checked={pillData.notification?.cta?.link === "https://site.com"}
            />
            https://site.com
          </label>
          <input
            type="text"
            placeholder="Type your custom url"
            onChange={(e) => handleCTATextChange(e, setPillData)}
          />
        </div>
      </div>

      <div className="tile">
        <h3 className="title">OR</h3>
      </div>

      <div className="tile">
        <h3 className="title">Give more contextual details</h3>
        <p className="subtitle">Add a title</p>
        <div className="radioSelection">
          <label>
            <input
              type="radio"
              hidden
              name="link"
              value="About your parcel n°123456"
              onChange={(e) => handleInfoTitleChange(e, setPillData)}
              checked={pillData.notification?.info && pillData.notification?.info.title === "About your parcel n°123456"}
            />
            About your parcel n°123456
          </label>
          <input
            type="text"
            placeholder="Type your custom title"
            onChange={(e) => handleInfoCustomTitleChange(e, setPillData)}
          />
        </div>
        <p className="subtitle">Add contextual information &#40;supports HTML&#41;</p>
        <div className="radioSelection">
          <input
            type="text"
            placeholder="<p>My important information</p><p>Some text...</p>"
            onChange={(e) => handleInfoCustomContentChange(e, setPillData)}
          />
        </div>
      </div>
    </>
  );
};

export default NotificationConfigBottom; 