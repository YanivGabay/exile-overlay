import { createRoot } from "react-dom/client";
import { OverlayApp } from "./OverlayApp.js";
import "../common/theme.css";
import "./overlay.css";

createRoot(document.getElementById("root")!).render(<OverlayApp />);
