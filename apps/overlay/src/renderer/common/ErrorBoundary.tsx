import { Component, type ReactNode } from "react";
import { api } from "./api.js";

interface Props {
  /** Where this boundary sits, for the app log ("overlay: guide", "settings"). */
  where: string;
  /** "panel": one quiet line, retries by itself (the overlay is click-through mid-game).
   *  "page": a full message with buttons (the settings window). */
  variant: "panel" | "page";
  children: ReactNode;
}

interface State {
  error: Error | null;
  attempt: number;
}

const RETRY_MS = 5000;

/**
 * Catches render errors so one broken panel never blanks the whole overlay.
 * Errors go to the app log (Settings → Diagnostics → Open log folder).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };
  private timer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    void api.send({
      type: "logError",
      where: this.props.where,
      message: error.message,
      stack: `${error.stack ?? ""}${info.componentStack ? `\nComponent stack:${info.componentStack}` : ""}`,
    });
    // Panels retry: a bad state from one zone usually clears in the next.
    if (this.props.variant === "panel" && this.state.attempt < 5) {
      this.timer = setTimeout(() => this.setState((s) => ({ error: null, attempt: s.attempt + 1 })), RETRY_MS * (this.state.attempt + 1));
    }
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.variant === "panel")
      return (
        <div className="panel-error muted small" role="status">
          This panel hit an error and will try again shortly. Your progress is saved.
        </div>
      );
    return (
      <section className="page-error">
        <h1>Something went wrong on this page</h1>
        <p>Your guide progress and settings are saved, and the overlay keeps running.</p>
        <p className="muted small">{error.message}</p>
        <div className="row">
          <button className="primary" onClick={() => location.reload()}>
            Reload this page
          </button>
          <button onClick={() => void api.send({ type: "copyReport" })}>Copy report</button>
          <button onClick={() => void api.send({ type: "openLogFolder" })}>Open log folder</button>
        </div>
        <p className="muted small">Paste the report into a GitHub issue or a Discord message. It contains no account or character names.</p>
      </section>
    );
  }
}
