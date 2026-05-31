/**
 * 打铁花节奏命中 → bHaptics 手套触觉
 * 在 A-Frame 页面中以 module 引入，暴露 window.IronflowerBhaptics
 */
import { initWebBhaptics, triggerDirectPulse } from "./bhaptics-web-client.js";
import { IRONFLOWER_BHAPTICS } from "./bhaptics-ironflower.js";

let initPromise = null;

function ensureReady() {
  if (!initPromise) {
    initPromise = initWebBhaptics().catch((err) => {
      initPromise = null;
      console.warn("[ironflower bhaptics] init failed:", err.message);
      throw err;
    });
  }
  return initPromise;
}

/** 节奏音符命中时调用（fire-and-forget，直连马达脉冲） */
export function triggerRhythmHaptic(mode = "performance") {
  const pulse =
    mode === "practice"
      ? IRONFLOWER_BHAPTICS.directPulsePractice
      : IRONFLOWER_BHAPTICS.directPulsePerformance;
  ensureReady()
    .then(() => triggerDirectPulse(pulse.intensity, pulse.durationMs))
    .catch((err) => {
      console.warn("[ironflower bhaptics] trigger failed:", err.message);
    });
}

window.IronflowerBhaptics = {
  triggerRhythmHaptic,
  ensureReady,
};

ensureReady();
