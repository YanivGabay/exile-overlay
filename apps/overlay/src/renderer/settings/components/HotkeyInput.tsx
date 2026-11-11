import { useState, type KeyboardEvent } from "react";

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

/** Convert a keydown event into an Electron accelerator string, e.g. "Ctrl+Shift+F4". */
export function toAccelerator(e: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey">): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null;
  let key: string | null = null;
  if (/^F\d{1,2}$/.test(e.key)) key = e.key;
  else if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3);
  else if (/^Digit\d$/.test(e.code)) key = e.code.slice(5);
  else if (/^Numpad\d$/.test(e.code)) key = `num${e.code.slice(6)}`;
  else {
    const named: Record<string, string> = {
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right",
      " ": "Space",
      Tab: "Tab",
      Enter: "Enter",
      Insert: "Insert",
      Delete: "Delete",
      Home: "Home",
      End: "End",
      PageUp: "PageUp",
      PageDown: "PageDown",
      "`": "`",
      "-": "-",
      "=": "=",
      "[": "[",
      "]": "]",
      ";": ";",
      "'": "'",
      ",": ",",
      ".": ".",
      "/": "/",
      "\\": "\\",
    };
    key = named[e.key] ?? null;
  }
  if (!key) return null;
  const mods = [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift"].filter(Boolean);
  return [...mods, key].join("+");
}

export function HotkeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [recording, setRecording] = useState(false);
  return (
    <input
      readOnly
      className={`hotkey ${recording ? "recording" : ""}`}
      value={recording ? "Press keys…" : value || "(none)"}
      onFocus={() => setRecording(true)}
      onBlur={() => setRecording(false)}
      onKeyDown={(e) => {
        e.preventDefault();
        if (e.key === "Escape") return (e.target as HTMLInputElement).blur();
        if (e.key === "Backspace") {
          onChange("");
          return (e.target as HTMLInputElement).blur();
        }
        const acc = toAccelerator(e);
        if (acc) {
          onChange(acc);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}
