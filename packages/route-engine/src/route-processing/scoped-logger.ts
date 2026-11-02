export interface Log {
  type: "warning" | "error";
  msg: string;
}

export class ScopedLogger {
  scopes: string[];
  logs: Log[];

  constructor() {
    this.scopes = [];
    this.logs = [];
  }

  pushScope(scope: string) {
    this.scopes.push(scope);
  }

  popScope() {
    this.scopes.pop();
  }

  withScope(scope: string, func: () => void) {
    this.pushScope(scope);
    func();
    this.popScope();
  }

  private buildPrefix() {
    if (this.scopes.length > 0) return `${this.scopes.join(", ")}: `;
    return "";
  }

  warn(msg: string) {
    this.logs.push({
      type: "warning",
      msg: `${this.buildPrefix()}${msg}`,
    });
  }

  error(msg: string) {
    this.logs.push({
      type: "error",
      msg: `${this.buildPrefix()}${msg}`,
    });
  }

  /** Returns collected logs and clears them. */
  drain(): Log[] {
    const out = [...this.logs];
    this.logs.length = 0;
    if (this.scopes.length !== 0)
      out.push({
        type: "warning",
        msg: `expected 0 scopes got ${this.scopes.length}, ${this.scopes.join(", ")}`,
      });
    return out;
  }
}
