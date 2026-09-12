import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { startMerveilRealtime } from "./merveilRealtime.js";
import { startMerveilNotifications } from "./merveilNotifications.js";
import { startMerveilProductionFeeds } from "./merveilProductionFeeds.js";
import { startMerveilBoost } from "./merveilBoostGlobal.js";

startMerveilRealtime();
startMerveilNotifications();
startMerveilProductionFeeds();
startMerveilBoost();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);