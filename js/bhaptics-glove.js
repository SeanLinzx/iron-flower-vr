/**
 * bHaptics TactGlove Web 封装（macOS / Windows 通用）
 *
 * 依赖：本机运行 bHaptics Player，浏览器通过 tact-js WASM 连接 Player
 * 文档：https://github.com/bhaptics/tact-js
 */

import Tact, { PositionType } from "./vendor/tact-js/bundle.js";

export { PositionType, Tact };

// tact-js 2.x 正确枚举名是 GloveL / GloveR（不是 GloveLeft）
const LEFT = PositionType.GloveL;
const RIGHT = PositionType.GloveR;

let initialized = false;
let initPromise = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncPlayerState() {
  const connected = await Tact.isConnected();
  const devices = await Tact.getConnectedDevices();
  const mappings = await Tact.getHapticMappings();
  const left = await Tact.isDeviceConnected(LEFT);
  const right = await Tact.isDeviceConnected(RIGHT);
  return { connected, devices, mappings, left, right };
}

/** 连接 Player 并注册应用 */
export async function initBhaptics(appId, apiKey) {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const ok = await Tact.init({ appId, apiKey });
    initialized = !!ok;
    if (!ok) {
      return { ok: false, connected: false, devices: [], mappings: [], left: false, right: false };
    }

    let state = await syncPlayerState();
    for (let i = 0; i < 6 && !state.left && !state.right && state.devices.length === 0; i += 1) {
      await sleep(400);
      state = await syncPlayerState();
    }

    return { ok: true, ...state };
  })();

  try {
    return await initPromise;
  } catch (err) {
    resetBhaptics();
    throw err;
  }
}

export function isInitialized() {
  return initialized;
}

export function resetBhaptics() {
  initialized = false;
  initPromise = null;
}

/** 查询左右手套是否在线 */
export async function checkGloves() {
  const [left, right, devices, connected] = await Promise.all([
    Tact.isDeviceConnected(LEFT),
    Tact.isDeviceConnected(RIGHT),
    Tact.getConnectedDevices(),
    Tact.isConnected(),
  ]);
  return { left, right, devices, connected };
}

/** 单只手套 playDot 震动（6 个马达，强度 0–100） */
export async function vibrateGloveDot(hand, intensity = 80, durationMs = 400) {
  const position = hand === "left" ? LEFT : RIGHT;
  const motorValues = Array(6).fill(intensity);
  return Tact.playDot({ position, motorValues, duration: durationMs });
}

/** 单只手套 playGlove 脉冲（波形更细腻） */
export async function vibrateGlovePulse(hand, intensity = 85) {
  const position = hand === "left" ? LEFT : RIGHT;
  const motors = new Int32Array(Array(6).fill(intensity));
  const playtimes = new Int32Array(Array(6).fill(8));
  const shapes = new Int32Array(Array(6).fill(2));
  return Tact.playGlove({
    position,
    motors,
    playtimes,
    shapes,
    repeatCount: 0,
  });
}

/** 双手同步短震 */
export async function vibrateBothHands({
  intensity = 85,
  pulses = 3,
  intervalMs = 350,
  mode = "pulse",
} = {}) {
  const fn = mode === "dot" ? vibrateGloveDot : vibrateGlovePulse;
  for (let i = 0; i < pulses; i += 1) {
    await Promise.all([fn("left", intensity), fn("right", intensity)]);
    if (i < pulses - 1) {
      await sleep(intervalMs);
    }
  }
}

/** 播放 Designer / Portal 里上传的事件 pattern */
export async function playHapticEvent(eventKey, options = {}) {
  const {
    intensityRatio = 1,
    durationRatio = 1,
    offsetX = 0,
    offsetY = 0,
    deviceIndex = -1,
  } = options;
  return Tact.play({
    eventKey,
    intensityRatio,
    durationRatio,
    offsetX,
    offsetY,
    deviceIndex,
  });
}

/** 事件不可用时，直接马达震动作为 fallback */
export async function playHitFallback(intensity = 90) {
  await vibrateBothHands({ intensity, pulses: 2, intervalMs: 120, mode: "pulse" });
}

export async function pingAll() {
  return Tact.pingAll();
}

export async function stopAll() {
  return Tact.stopAll();
}

export function formatMappingKeys(mappings) {
  if (!Array.isArray(mappings) || mappings.length === 0) return [];
  return mappings.map((m) => m.key || m.eventKey || m.name || m.eventName).filter(Boolean);
}
