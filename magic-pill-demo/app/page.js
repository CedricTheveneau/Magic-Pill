"use client";
import { useState } from "react";
import "magic-pill/dist/magicpill.css";
import MagicPill from "magic-pill";

export default function Home() {
  const [pillData, setPillData] = useState({
    icon: "info",
    message: "Hey ! I'm Magic Pill, your omnipotent toolbox !",
    cta: {
      icon: "arrow",
      label: "Discover what I can do",
      link: "https://voyage-stoique.com",
    },
    info: {
      title: "I'm Magic Pill, let me empower you !",
      content:
        "<p>I'll appear sometimes, depending on context, either to send you notifications regarding your experience on this website or to give you indications and hints at what you can do !</p><p>See you around !</p>",
      closeLabel: "Close",
    },
  });

  const handleIconChange = (event) => {
    const selectedIcon = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      icon: selectedIcon,
    }));
  };

  const handleMessageChange = (event) => {
    const selectedMessage = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      message: selectedMessage,
    }));
  };

  const handleTextChange = (event) => {
    const customMessage = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      message: customMessage,
    }));
  };

  const handleCTAIconChange = (event) => {
    const selectedIcon = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      cta: {
        ...prevData.cta,
        icon: selectedIcon,
      },
    }));
  };

  const handleCTAMessageChange = (event) => {
    const selectedMessage = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      cta: {
        ...prevData.cta,
        label: selectedMessage,
      },
    }));
  };

  const handleCTATextChange = (event) => {
    const customMessage = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      cta: {
        ...prevData.cta,
        label: customMessage,
      },
    }));
  };

  const handleCTALinkChange = (event) => {
    const selectedLink = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      cta: {
        ...prevData.cta,
        link: selectedLink,
      },
      info: null,
    }));
  };

  const handleCTACustomLinkChange = (event) => {
    const customLink = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      cta: {
        ...prevData.cta,
        link: customLink,
      },
      info: null,
    }));
  };

  const handleInfoTitleChange = (event) => {
    const selectedTitle = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      info: {
        ...prevData.info,
        title: selectedTitle,
        closeLabel: 'Close'
      },
      cta: {
        ...prevData.cta,
        link: null,
      },
    }));
  };

  const handleInfoCustomTitleChange = (event) => {
    const customTitle = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      info: {
        ...prevData.info,
        title: customTitle,
        closeLabel: 'Close'
      },
      cta: {
        ...prevData.cta,
        link: null,
      },
    }));
  };

  const handleInfoCustomContentChange = (event) => {
    const customContent = event.target.value;
    setPillData((prevData) => ({
      ...prevData,
      info: {
        ...prevData.info,
        content: customContent,
        closeLabel: 'Close'
      },
      cta: {
        ...prevData.cta,
        link: null,
      },
    }));
  };

  return (
    <div>
      <main>
        <div className="bg"></div>
        <div className="tile">
          <h3 className="title">Display mode</h3>
          <div className="radioSelection alt">
            <p>Notification</p>
          </div>
          <p className="subtitle">More to come...</p>
          <div className="radioSelection">
            <p>Toolbox</p>
            <p>Navbar</p>
            <p>Carousel indicators</p>
          </div>
        </div>
        <div className="tile">
          <h3 className="title">Select a main icon</h3>
          <div className="radioSelection">
            <label>
              <input
                type="radio"
                hidden
                name="icon"
                value="checkmark"
                onChange={handleIconChange}
                checked={pillData.icon === "checkmark"}
              />
              Checkmark
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="icon"
                value="coupon"
                onChange={handleIconChange}
                checked={pillData.icon === "coupon"}
              />
              Coupon
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="icon"
                value="info"
                onChange={handleIconChange}
                checked={pillData.icon === "info"}
              />
              Info
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="icon"
                value="questionmark"
                onChange={handleIconChange}
                checked={pillData.icon === "questionmark"}
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
                onChange={handleMessageChange}
                checked={
                  pillData.message === "Your Amazon parcel is 5 stops away!"
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
                onChange={handleMessageChange}
                checked={pillData.message === "Welcome back, Alex!"}
              />
              Welcome back, Alex!
            </label>
            <input
              type="text"
              placeholder="Type your custom message"
              onChange={handleTextChange}
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
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "arrow"}
              />
              Arrow
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="checkmark"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "checkmark"}
              />
              Checkmark
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="cross"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "cross"}
              />
              Cross
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="undo"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "undo"}
              />
              Undo
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="tel"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "tel"}
              />
              Phone
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="mail"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "mail"}
              />
              Mail
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="box"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "box"}
              />
              Box
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="plus"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "plus"}
              />
              Plus
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaIcon"
                value="quotation"
                onChange={handleCTAIconChange}
                checked={pillData.cta.icon === "quotation"}
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
        <div className="tile">
          <MagicPill pillData={pillData} />
        </div>
        <div className="tile">
          <h3 className="title">Write your CTA label</h3>
          <div className="radioSelection">
            <label>
              <input
                type="radio"
                hidden
                name="ctaMessage"
                value="View parcel details"
                onChange={handleCTAMessageChange}
                checked={pillData.cta.label === "View parcel details"}
              />
              View parcel details
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaMessage"
                value="Go to cart"
                onChange={handleCTAMessageChange}
                checked={pillData.cta.label === "Go to cart"}
              />
              Go to cart
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaMessage"
                value="Sign in"
                onChange={handleCTAMessageChange}
                checked={pillData.cta.label === "Sign in"}
              />
              Sign in
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="ctaMessage"
                value="Create an account"
                onChange={handleCTAMessageChange}
                checked={pillData.cta.label === "Create an account"}
              />
              Create an account
            </label>
            <input
              type="text"
              placeholder="Type your custom label"
              onChange={handleCTATextChange}
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
                onChange={handleCTALinkChange}
                checked={pillData.cta.link === "/cart"}
              />
              /cart
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="link"
                value="/profile"
                onChange={handleCTALinkChange}
                checked={pillData.cta.link === "/profile"}
              />
              /profile
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="link"
                value="/order/123456"
                onChange={handleCTALinkChange}
                checked={pillData.cta.link === "/order/123456"}
              />
              /order/123456
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="link"
                value="/signup"
                onChange={handleCTALinkChange}
                checked={pillData.cta.link === "/signup"}
              />
              /signup
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="link"
                value="/login"
                onChange={handleCTALinkChange}
                checked={pillData.cta.link === "/login"}
              />
              /login
            </label>
            <label>
              <input
                type="radio"
                hidden
                name="link"
                value="https://site.com"
                onChange={handleCTACustomLinkChange}
                checked={pillData.cta.link === "https://site.com"}
              />
              https://site.com
            </label>
            <input
              type="text"
              placeholder="Type your custom url"
              onChange={handleCTATextChange}
            />
          </div>
        </div>
        <div className="tile"><h3 className="title">OR</h3></div>
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
                onChange={handleInfoTitleChange}
                checked={pillData.info && pillData.info.title === "About your parcel n°123456"}
              />
              About your parcel n°123456
            </label>
            <input
              type="text"
              placeholder="Type your custom title"
              onChange={handleInfoCustomTitleChange}
            />
          </div>
          <p className="subtitle">Add contextual information &#40;supports HTML&#41;</p>
          <div className="radioSelection">
          <input
              type="text"
              placeholder="<p>My important information</p><p>Some text...</p>"
              onChange={handleInfoCustomContentChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
