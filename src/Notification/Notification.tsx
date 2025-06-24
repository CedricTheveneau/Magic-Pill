"use client"
import React, { useState } from "react";
import "../magicpill.css";

import { MagicPillNotification } from "../types";

import { getIconComponent, Icons, CTAIcons } from "../utils/icons";

interface NotificationProps {
  mode: "notification";
  notification: MagicPillNotification;
}

const Notification = ({ notification }: NotificationProps) => {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  
  const { icon, message, cta, info } = notification || {};
  const { icon: ctaIcon, label: ctaLabel, link: ctaLink } = cta || {};
  const { title, content, closeLabel } = info || {};

  const IconComponent = getIconComponent(icon || "", Icons);

  const currentCTAIcon = isInfoExpanded ? "cross" : ctaIcon;
  const CTAIconComponent = getIconComponent(currentCTAIcon || "", CTAIcons);

  return (
   <>
      {IconComponent ? <IconComponent className="icon" /> : null}
      <p className="message">{message}</p>

      {ctaLink && (
        <a className="CTA" href={ctaLink}>
          {CTAIconComponent && <CTAIconComponent className="label" />}
          <span>{ctaLabel}</span>
        </a>
      )}

      {info && !ctaLink && (
        <button className="CTA" onClick={() => setIsInfoExpanded(!isInfoExpanded)}>
          {CTAIconComponent && <CTAIconComponent className="label" />}
          <span>{!isInfoExpanded ? ctaLabel : closeLabel}</span>
        </button>
      )}
      {info && (
        <div className={isInfoExpanded ? "info active" : "info"}>
          <p className="title">{title}</p>
          <div
            className="content"
            dangerouslySetInnerHTML={{ __html: content || "" }}
          ></div>
        </div>
      )}
      </>
  );
};

export default Notification;
