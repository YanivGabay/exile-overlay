import { createRoot } from "react-dom/client";
import { OverlayApp } from "./OverlayApp.js";
import "./overlay.css";

createRoot(document.getElementById("root")!).render(<OverlayApp />);
