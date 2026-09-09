import React from "react";
import { createRoot } from "react-dom/client";
import MachineConnectPlatform from "../MachineConnectPlatform.jsx";

createRoot(document.getElementById("machine-connect-root")).render(
  <React.StrictMode>
    <MachineConnectPlatform />
  </React.StrictMode>
);
