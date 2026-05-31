/**
 * ironflower Web 触觉客户端（tact-js）
 *
 * Portal 里 Play All 能震，说明浏览器 → Player 通路正常。
 * 本模块与 Portal 使用相同 tact-js / WASM 路径，不经过 Python。
 */

import Tact, { PositionType } from "./vendor/tact-js/bundle.js";
import { IRONFLOWER_BHAPTICS } from "./bhaptics-ironflower.js";

export { Tact, PositionType, IRONFLOWER_BHAPTICS };

let initPromise = null;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mappingKeys(mappings) {
  if (!Array.isArray(mappings)) return [];
  return mappings.map((m) => m.key || m.eventKey || m.name).filter(Boolean);
}

/** 初始化 tact-js（与 Portal Play All 同源） */
export async function initWebBhaptics() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const ok = await Tact.init({
      appId: IRONFLOWER_BHAPTICS.appId,
      apiKey: IRONFLOWER_BHAPTICS.apiKey,
    });
    if (!ok) throw new Error("tact-js 初始化失败，请确认 bHaptics Player 已运行");

    for (let i = 0; i < 6; i += 1) {
      await sleep(i === 0 ? 300 : 400);
      const connected = await Tact.isConnected();
      const left = await Tact.isDeviceConnected(PositionType.GloveL);
      const right = await Tact.isDeviceConnected(PositionType.GloveR);
      const devices = await Tact.getConnectedDevices();
      const events = mappingKeys(await Tact.getHapticMappings());
      if (connected && (left || right || devices.length > 0)) {
        return { connected, left, right, devices, events };
      }
    }

    const connected = await Tact.isConnected();
    const left = await Tact.isDeviceConnected(PositionType.GloveL);
    const right = await Tact.isDeviceConnected(PositionType.GloveR);
    const devices = await Tact.getConnectedDevices();
    const events = mappingKeys(await Tact.getHapticMappings());
    return { connected, left, right, devices, events };
  })();

  try {
    return await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

/** 播放 Portal 事件（默认 hiut） */
export async function triggerEvent(eventKey = IRONFLOWER_BHAPTICS.event) {
  await initWebBhaptics();
  await Tact.play({ eventKey });
  return { mode: "event", event: eventKey };
}

/** 按 Device Index 分别播放（GloveR=0, GloveL=1） */
export async function triggerEventIndexed(eventKey = IRONFLOWER_BHAPTICS.event) {
  await initWebBhaptics();
  const { deviceIndex } = IRONFLOWER_BHAPTICS;
  await Promise.all([
    Tact.play({ eventKey, deviceIndex: deviceIndex.right }),
    Tact.play({ eventKey, deviceIndex: deviceIndex.left }),
  ]);
  return { mode: "event_index", event: eventKey, deviceIndex };
}

/** 直连马达脉冲（不依赖 Portal 事件） */
export async function triggerDirectPulse(
  intensity = IRONFLOWER_BHAPTICS.directPulse.intensity,
  durationMs = IRONFLOWER_BHAPTICS.directPulse.durationMs
) {
  await initWebBhaptics();
  const motors = Array(6).fill(intensity);
  await Promise.all([
    Tact.playDot({ position: PositionType.GloveL, motorValues: motors, duration: durationMs }),
    Tact.playDot({ position: PositionType.GloveR, motorValues: motors, duration: durationMs }),
  ]);
  return { mode: "play_dot" };
}

export async function stopAll() {
  return Tact.stopAll();
}

export function resetWebBhaptics() {
  initPromise = null;
}
