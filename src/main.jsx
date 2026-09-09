import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { startMerveilRealtime } from "./merveilRealtime.js";
import { startMerveilNotifications } from "./merveilNotifications.js";

startMerveilRealtime();
startMerveilNotifications();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
