import { BrowserWindow, app, clipboard, dialog, shell, type IpcMainInvokeEvent } from "electron";
import type { Command } from "../shared/types.js";
import { bugReportUrl, guideErrorUrl } from "../shared/support-links.js";
import type { GuideService } from "./guide/guide-service.js";
import { importPob } from "./guide/pob.js";
import type { AppStateStore } from "./state/app-state.js";
import type { AppLog } from "./support/app-log.js";
import type { Updates } from "./support/updates.js";
import type { OverlayWindow } from "./windows/overlay-window.js";
import { openSettingsWindow } from "./windows/windows.js";

export interface CommandDeps {
  state: AppStateStore;
  guide: GuideService;
  overlay: OverlayWindow;
  updates: Updates;
  appLog: AppLog;
  makeReport: () => string;
  /** Click test: clipboard writes are recorded here instead of overwriting the user's clipboard. */
  clickTest: string[] | null;
}

/** Handles every command a renderer sends over IPC (see `Command` in shared/types). */
export function createCommandHandler({ state, guide, overlay, updates, appLog, makeReport, clickTest }: CommandDeps) {
  return async (e: IpcMainInvokeEvent, cmd: Command) => {
    if (cmd.type !== "setRegions") console.log(`[cmd] ${cmd.type}`);
    switch (cmd.type) {
      case "updateSettings":
        state.updateSettings(cmd.patch);
        return { ok: true };
      case "setWidgetLayout": {
        const layouts = state.settings.layouts;
        const forRes = { ...layouts[cmd.resolution], [cmd.widget]: cmd.layout };
        state.replaceSettings({ ...state.settings, layouts: { ...layouts, [cmd.resolution]: forRes } });
        return { ok: true };
      }
      case "resetLayout": {
        const layouts = { ...state.settings.layouts };
        delete layouts[cmd.resolution];
        state.replaceSettings({ ...state.settings, layouts });
        return { ok: true };
      }
      case "setHidden":
        overlay.setHidden(cmd.hidden);
        return { ok: true };
      case "setEditing":
        overlay.setEditing(cmd.editing);
        return { ok: true };
      case "guideStep":
        guide.step(cmd.delta);
        return { ok: true };
      case "guideResync":
        guide.resync();
        return { ok: true };
      case "guideSetEdge":
        guide.pick(cmd.edge);
        return { ok: true };
      case "guideUndo":
        guide.undo();
        return { ok: true };
      case "copyText":
        // Click test: record instead of overwriting the user's clipboard.
        if (clickTest) clickTest.push(cmd.text);
        else clipboard.writeText(cmd.text);
        return { ok: true };
      case "dismissReminder":
        guide.dismissReminder(cmd.id);
        return { ok: true };
      case "setRegions":
        // Only the real overlay window's layout drives click-through.
        if (e.sender === overlay.window.webContents) overlay.setRegions(cmd.controls, cmd.widgets);
        return { ok: true };
      case "toggleStepDone":
        guide.toggleStep(cmd.stepId);
        return { ok: true };
      case "selectCharacter":
        guide.selectCharacter(cmd.name);
        return { ok: true };
      case "importPob": {
        const result = await importPob(cmd.input);
        if (result.ok) guide.setPob(result.code);
        return result;
      }
      case "reportStep": {
        const s = state.get();
        const areaId = s.game.area?.id;
        const area = areaId ? guide.getRender()?.areas[areaId] : undefined;
        const zone = areaId ? (area ? `Act ${area.act}, ${area.name}` : s.game.area?.name ?? areaId) : "unknown";
        const url = guideErrorUrl({ stepId: cmd.stepId, zone, note: cmd.note, guideVersion: s.guide.version, gameVersion: s.guide.gameVersion, options: s.settings.guide.options });
        void shell.openExternal(url);
        return { ok: true };
      }
      case "openSettings":
        openSettingsWindow(cmd.tab);
        return { ok: true };
      case "openExternal":
        if (/^https:\/\//.test(cmd.url)) void shell.openExternal(cmd.url);
        return { ok: true };
      case "logError":
        appLog.write("error", `${cmd.where}: ${cmd.stack ?? cmd.message}`);
        return { ok: true };
      case "copyReport":
        if (clickTest) clickTest.push("report");
        else clipboard.writeText(makeReport());
        return { ok: true };
      case "reportProblem":
        // Copy the report, then open the bug form where the player pastes it.
        if (clickTest) clickTest.push("report");
        else {
          clipboard.writeText(makeReport());
          void shell.openExternal(bugReportUrl());
        }
        return { ok: true };
      case "openLogFolder":
        void shell.openPath(appLog.dir);
        return { ok: true };
      case "pickClientLog": {
        const parent = BrowserWindow.fromWebContents(e.sender) ?? undefined;
        const opts = {
          title: "Choose the game's Client.txt",
          properties: ["openFile" as const],
          filters: [{ name: "Path of Exile log", extensions: ["txt"] }],
        };
        const res = parent ? await dialog.showOpenDialog(parent, opts) : await dialog.showOpenDialog(opts);
        if (res.canceled || !res.filePaths[0]) return { ok: false };
        state.updateSettings({ game: { clientLogPath: res.filePaths[0] } });
        return { ok: true, path: res.filePaths[0] };
      }
      case "checkUpdates":
        updates.check();
        return { ok: true };
      case "installUpdate":
        updates.install();
        return { ok: true };
      case "quit":
        app.quit();
        return { ok: true };
    }
  };
}
