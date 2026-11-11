export function Check({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  return (
    <div className="check">
      <span className={ok ? "ok" : ok === false ? "warn" : "muted"}>{ok ? "✓" : ok === false ? "!" : "…"}</span>
      <div>{children}</div>
    </div>
  );
}
