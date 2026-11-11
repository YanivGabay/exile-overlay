/** Where the app downloads guide updates: the guides repo CI publishes this bundle on every push to main. */
export const DEFAULT_GUIDE_URL: string | null =
  "https://raw.githubusercontent.com/YanivGabay/exile-overlay-guides/bundles/poe1.json";

/** Test hooks (offscreen capture, scripted tour): no tray, no dialogs, no setup window. */
export const testEnv = {
  userData: process.env.EXILE_OVERLAY_USERDATA,
  target: process.env.EXILE_OVERLAY_TARGET,
  log: process.env.EXILE_OVERLAY_LOG,
  captureDir: process.env.EXILE_OVERLAY_CAPTURE,
  tourDir: process.env.EXILE_OVERLAY_TOUR,
  clickTest: !!process.env.EXILE_OVERLAY_CLICKTEST,
};
export const testRun = !!(testEnv.captureDir || testEnv.tourDir);
