import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PlusHub from "./plusHub.jsx";
import MerveilAdminControlCenter from "./MerveilAdminControlCenter.jsx";
import "./index.css";

const isAdminPath = typeof window !== "undefined" && window.location.pathname === "/merveil-admin-x9k2";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdminPath ? <MerveilAdminControlCenter /> : <><App /><PlusHub /></>}
  </React.StrictMode>
);
