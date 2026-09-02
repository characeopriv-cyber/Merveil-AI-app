import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PlusHub from "./plusHub.jsx";
import MerveilSoundsPlayer from "./MerveilSoundsPlayer.jsx";
import MerveilAdminControlCenter from "./MerveilAdminControlCenter.jsx";
import MerveilInterfacePlatform from "./MerveilInterfacePlatform.jsx";
import MerveilInterfaceExplore from "./MerveilInterfaceExplore.jsx";
import "./index.css";

const path = typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") || "/" : "/";
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdminPath ? <MerveilAdminControlCenter /> : isInterfaceExplore ? <MerveilInterfaceExplore /> : isInterfacePath ? <MerveilInterfacePlatform /> : <><App /><PlusHub /><MerveilSoundsPlayer /></>}
  </React.StrictMode>
);
