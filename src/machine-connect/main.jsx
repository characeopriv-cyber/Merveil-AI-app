import React from "react";
import { createRoot } from "react-dom/client";
import MachineConnect from "./MachineConnect.jsx";
import "./machine-connect.css";

createRoot(document.getElementById("machine-connect-root")).render(
  <React.StrictMode><MachineConnect /></React.StrictMode>
);
