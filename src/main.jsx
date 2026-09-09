import React from "react";
import ReactDOM from "react-dom/client";
import MerveilEntry from "./MerveilEntry.jsx";
import "./index.css";

// Merveil now opens through one private owner experience.
// The existing App remains the product workspace behind the entry doorway.
// Secondary destinations remain reachable from the product's existing navigation.

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MerveilEntry />
  </React.StrictMode>
);
