"use client";
import React from "react";
import { MagicPillType } from "../types";
import { Dispatch, SetStateAction } from "react";
import {
  handleIconChange,
  handleMessageChange,
  handleTextChange,
  handleCTAIconChange,
} from "../utils/handlers";

interface NotificationConfigTopProps {
  pillData: MagicPillType;
  setPillData: Dispatch<SetStateAction<MagicPillType>>;
}

const NotificationConfigTop = ({ pillData, setPillData }: NotificationConfigTopProps) => {
  if (pillData.mode !== "notification") return null;

  return (
    <>
      <div className="tile">
        <h3 className="title">Select a main icon</h3>
        <div className="radioSelection">
          <label>
            <input
              type="radio"
              hidden
              name="icon"
              value="checkmark"
              onChange={(e) => handleIconChange(e, setPillData)}
              checked={pillData.notification?.icon === "checkmark"}
            />
            Checkmark
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="icon"
              value="coupon"
              onChange={(e) => handleIconChange(e, setPillData)}
              checked={pillData.notification?.icon === "coupon"}
            />
            Coupon
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="icon"
              value="info"
              onChange={(e) => handleIconChange(e, setPillData)}
              checked={pillData.notification?.icon === "info"}
            />
            Info
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="icon"
              value="questionmark"
              onChange={(e) => handleIconChange(e, setPillData)}
              checked={pillData.notification?.icon === "questionmark"}
            />
            Questionmark
          </label>
        </div>
        <p className="subtitle">More to come...</p>
        <div className="radioSelection">
          <p>Box</p>
          <p>Cart</p>
          <p>Truck</p>
          <p>Emoji</p>
          <p>SVG</p>
        </div>
      </div>

      <div className="tile">
        <h3 className="title">Write your message</h3>
        <div className="radioSelection">
          <label>
            <input
              type="radio"
              hidden
              name="message"
              value="Your Amazon parcel is 5 stops away!"
              onChange={(e) => handleMessageChange(e, setPillData)}
              checked={
                pillData.notification?.message === "Your Amazon parcel is 5 stops away!"
              }
            />
            Your Amazon parcel is 5 stops away!
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="message"
              value="Welcome back, Alex!"
              onChange={(e) => handleMessageChange(e, setPillData)}
              checked={pillData.notification?.message === "Welcome back, Alex!"}
            />
            Welcome back, Alex!
          </label>
          <input
            type="text"
            placeholder="Type your custom message"
            onChange={(e) => handleTextChange(e, setPillData)}
          />
        </div>
      </div>

      <div className="tile">
        <h3 className="title">Select a CTA icon</h3>
        <div className="radioSelection">
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="arrow"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "arrow"}
            />
            Arrow
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="checkmark"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "checkmark"}
            />
            Checkmark
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="cross"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "cross"}
            />
            Cross
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="undo"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "undo"}
            />
            Undo
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="tel"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "tel"}
            />
            Phone
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="mail"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "mail"}
            />
            Mail
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="box"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "box"}
            />
            Box
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="plus"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "plus"}
            />
            Plus
          </label>
          <label>
            <input
              type="radio"
              hidden
              name="ctaIcon"
              value="quotation"
              onChange={(e) => handleCTAIconChange(e, setPillData)}
              checked={pillData.notification?.cta?.icon === "quotation"}
            />
            Quote
          </label>
        </div>
        <p className="subtitle">More to come...</p>
        <div className="radioSelection">
          <p>Box</p>
          <p>Cart</p>
          <p>Truck</p>
          <p>Emoji</p>
          <p>SVG</p>
        </div>
      </div>
    </>
  );
};

export default NotificationConfigTop; 