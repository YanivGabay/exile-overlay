import { createRoot } from "react-dom/client";
import { OverlayApp } from "./OverlayApp.js";
import { ErrorBoundary } from "../common/ErrorBoundary.js";
import "./overlay.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary where="overlay" variant="panel">
    <OverlayApp />
  </ErrorBoundary>,
);
