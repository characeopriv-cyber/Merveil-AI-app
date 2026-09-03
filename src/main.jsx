import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PlusHub from "./plusHub.jsx";
import MerveilInvite from "./MerveilInvite.jsx";
import "./index.css";

function ScrollRepair() {
  useEffect(() => {
    const hasOpenLayer = () => Boolean(
      document.querySelector('[role="dialog"], [aria-modal="true"], .merveil-plus-overlay, .merveil-invite-overlay')
    );

    const repair = () => {
      if (hasOpenLayer()) return;
      const html = document.documentElement;
      const body = document.body;
      const root = document.getElementById("root");
      html.style.overflowY = "auto";
      html.style.overflowX = "hidden";
      body.style.overflowY = "auto";
      body.style.overflowX = "hidden";
      body.style.position = "static";
      body.style.height = "auto";
      body.style.minHeight = "100dvh";
      if (root) {
        root.style.overflow = "visible";
        root.style.height = "auto";
        root.style.minHeight = "100dvh";
      }
      body.classList.remove("merveil-no-scroll");
    };

    repair();
    const observer = new MutationObserver(repair);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    return () => observer.disconnect();
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <ScrollRepair />
      <App />
      <PlusHub />
      <MerveilInvite />
    </>
  </React.StrictMode>
);
