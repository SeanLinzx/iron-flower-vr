/**
 * ironflower 触觉客户端 — 通过本地 Python 服务触发
 *
 * 先启动：python bhaptics_server.py
 * Python SDK 文档：https://docs.bhaptics.com/sdk/python/guide/
 */

import { IRONFLOWER_BHAPTICS } from "./bhaptics-ironflower.js";

const DEFAULT_BASE = "http://127.0.0.1:8765";

function getBaseUrl() {
  return localStorage.getItem("ironflower_bhaptics_py_url") || DEFAULT_BASE;
}

async function request(path, options = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

/** 检查 Python 触觉服务与手套状态 */
export async function ensureBhaptics() {
  const status = await request("/health");
  return {
    ok: true,
    connected: true,
    left: status.left_glove,
    right: status.right_glove,
    devices: status.devices || [],
    eventKeys: [IRONFLOWER_BHAPTICS.event],
    boundEvent: IRONFLOWER_BHAPTICS.event,
    source: "python",
  };
}

/** 触发 ironflower 绑定的 hit 事件（由 Python SDK play_event 执行） */
export async function triggerHit(options = {}) {
  const { fallback = true } = options;
  return request("/hit", {
    method: "POST",
    body: JSON.stringify({ fallback }),
  });
}

export async function stopHaptics() {
  return request("/stop", { method: "POST", body: "{}" });
}

export function resetConnection() {
  /* Python 服务无浏览器侧状态，刷新 health 即可 */
}

export { IRONFLOWER_BHAPTICS };
