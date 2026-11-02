import { contextBridge, ipcRenderer } from "electron";
import { IPC, type AppState, type Command } from "../shared/types.js";
import type { GuideRender } from "../shared/guide-render.js";

export interface Diagnostics {
  logDetail: string;
  hotkeyFailures: string[];
  displayScale: number | null;
  userData: string;
  platform: string;
  electron: string;
}

const api = {
  getState: (): Promise<AppState> => ipcRenderer.invoke(IPC.getState),
  getGuide: (): Promise<GuideRender | null> => ipcRenderer.invoke(IPC.getGuide),
  getDiagnostics: (): Promise<Diagnostics> => ipcRenderer.invoke("diagnostics:get"),
  send: (cmd: Command): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> =>
    ipcRenderer.invoke(IPC.command, cmd),
  onState: (cb: (s: AppState) => void) => {
    const fn = (_: unknown, s: AppState) => cb(s);
    ipcRenderer.on(IPC.state, fn);
    return () => void ipcRenderer.off(IPC.state, fn);
  },
  onGuide: (cb: (g: GuideRender) => void) => {
    const fn = (_: unknown, g: GuideRender) => cb(g);
    ipcRenderer.on(IPC.guide, fn);
    return () => void ipcRenderer.off(IPC.guide, fn);
  },
  onSettingsTab: (cb: (tab: string) => void) => {
    const fn = (_: unknown, tab: string) => cb(tab);
    ipcRenderer.on("settings:tab", fn);
    return () => void ipcRenderer.off("settings:tab", fn);
  },
};

export type Api = typeof api;
contextBridge.exposeInMainWorld("api", api);
