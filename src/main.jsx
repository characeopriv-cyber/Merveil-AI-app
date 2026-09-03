import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// PlusHub floating trigger removed — it covered the notification bell.
// Secondary destinations (Sound, Arena, AI Call, Community, Transactions)
// and Ecosystem rooms stay reachable from Passport → More / Ecosystem.

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
