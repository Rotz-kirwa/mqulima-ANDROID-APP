const { withAndroidManifest } = require("@expo/config-plugins");

const OPTIONAL_FEATURES = [
  "android.hardware.screen.portrait",
  "android.hardware.screen.landscape",
  "android.hardware.wifi",
  "android.hardware.camera",
  "android.hardware.camera.autofocus",
  "android.hardware.location",
  "android.hardware.location.gps",
  "android.hardware.location.network",
];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Ensure xmlns:tools is declared so tools:replace overrides transitive library manifests.
    manifest.$ = manifest.$ || {};
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // Remove fixed portrait orientation lock on MainActivity so tablets, foldables & XR are not excluded.
    const app = manifest.application?.[0];
    if (app?.activity) {
      for (const act of app.activity) {
        if (act.$?.["android:screenOrientation"] === "portrait") {
          delete act.$["android:screenOrientation"];
        }
      }
    }

    manifest["uses-feature"] = manifest["uses-feature"] || [];
    const existing = manifest["uses-feature"];

    for (const featureName of OPTIONAL_FEATURES) {
      const idx = existing.findIndex((item) => item?.$?.["android:name"] === featureName);
      const entry = {
        $: {
          "android:name": featureName,
          "android:required": "false",
          "tools:replace": "android:required",
        },
      };
      if (idx >= 0) {
        existing[idx] = entry;
      } else {
        existing.push(entry);
      }
    }

    return cfg;
  });
};

