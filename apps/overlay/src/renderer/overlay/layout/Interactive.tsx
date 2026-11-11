import type { ReactNode } from "react";

/**
 * Marks controls that should take clicks. The main process reads the real
 * cursor position and makes the overlay clickable only over these areas
 * (see RegionReporter); everywhere else it stays click-through, and clicks
 * never take keyboard focus from the game.
 */
export function Interactive({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`interactive ${className}`}>{children}</span>;
}
