import { useEffect, useState } from "react";
import type { Api } from "../../preload/index.js";
import type { AppState, CharacterProfile } from "../../shared/types.js";
import type { GuideRender } from "../../shared/guide-render.js";
import { INITIAL_PROGRESS } from "@exile-overlay/route-engine";

declare global {
  interface Window {
    api: Api;
  }
}

export const api = window.api;

export function useAppState(): AppState | null {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => {
    let alive = true;
    void api.getState().then((s) => alive && setState(s));
    const off = api.onState(setState);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return state;
}

export function useGuide(): GuideRender | null {
  const [guide, setGuide] = useState<GuideRender | null>(null);
  useEffect(() => {
    let alive = true;
    void api.getGuide().then((g) => alive && g && setGuide(g));
    const off = api.onGuide(setGuide);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return guide;
}

export const DEFAULT_CHARACTER = "_default";

export function activeProfile(state: AppState): CharacterProfile {
  const key = state.settings.activeCharacter ?? DEFAULT_CHARACTER;
  return (
    state.settings.characters[key] ?? {
      name: key,
      className: null,
      level: null,
      progress: INITIAL_PROGRESS,
      pobCode: null,
      lastSeen: "",
    }
  );
}
