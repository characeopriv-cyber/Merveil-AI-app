import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PlusHub from "./plusHub.jsx";
import MerveilSoundsPlayer from "./MerveilSoundsPlayer.jsx";
import MerveilAdminControlCenter from "./MerveilAdminControlCenter.jsx";
import MerveilInterfacePlatform from "./MerveilInterfacePlatform.jsx";
import MerveilInterfaceExplore from "./MerveilInterfaceExplore.jsx";
import MerveilPassport from "./MerveilPassport.jsx";
import MerveilConnect from "./MerveilConnect.jsx";
import MerveilAuthSession from "./MerveilAuthSession.jsx";
import "./index.css";

const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
const rawPath = typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") || "/" : "/";

// Platform domains are separate entry points on the same Vercel project.
// Vercel rewrites preserve the browser pathname, so the client must also
// resolve the platform from the hostname instead of falling back to App.
const isInterfaceHost = hostname === "interface.junction.technology";
const isAdminHost = hostname === "admin.junction.technology";

const path = isInterfaceHost
  ? (rawPath === "/" ? "/interface" : `/interface${rawPath}`)
  : isAdminHost
    ? (rawPath === "/" ? "/merveil-admin-x9k2" : `/merveil-admin-x9k2${rawPath}`)
    : rawPath;

const isAdminPath = path === "/merveil-admin-x9k2";
const interfacePaths = new Set([
  "/interface",
  "/interface/family",
  "/interface/organization",
  "/interface/community",
  "/interface/companion",
  "/interface/store",
]);
const isInterfacePath = interfacePaths.has(path);
const isInterfaceExplore = path === "/interface/explore";
const isPassportPath = path === "/passport";
const isConnectPath = path === "/connect";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MerveilAuthSession>
      {isAdminPath ? <MerveilAdminControlCenter />
        : isInterfaceExplore ? <MerveilInterfaceExplore />
        : isInterfacePath ? <MerveilInterfacePlatform />
        : isPassportPath ? <MerveilPassport />
        : isConnectPath ? <MerveilConnect />
        : <><App /><PlusHub /><MerveilSoundsPlayer /></>}
    </MerveilAuthSession>
  </React.StrictMode>
);
