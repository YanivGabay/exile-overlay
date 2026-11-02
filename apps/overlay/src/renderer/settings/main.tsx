import { createRoot } from "react-dom/client";
import { SettingsApp } from "./SettingsApp.js";
import "../common/theme.css";
import "./settings.css";

createRoot(document.getElementById("root")!).render(<SettingsApp />);
