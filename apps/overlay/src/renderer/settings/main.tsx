import { createRoot } from "react-dom/client";
import { SettingsApp } from "./SettingsApp.js";
import { ErrorBoundary } from "../common/ErrorBoundary.js";
import "../common/theme.css";
import "./settings.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary where="settings" variant="page">
    <SettingsApp />
  </ErrorBoundary>,
);
