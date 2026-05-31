"""
ironflower bHaptics Python 封装

参考：https://docs.bhaptics.com/sdk/python/guide/
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

try:
    import bhaptics_python
except ImportError as exc:
    raise SystemExit("请先安装：pip install -r requirements-bhaptics.txt") from exc

from bhaptics_ironflower_config import (
    API_KEY,
    APP_ID,
    EVENT_HIT,
    GLOVE_INDEX_LEFT,
    GLOVE_INDEX_RIGHT,
    GLOVE_LEFT,
    GLOVE_RIGHT,
)

_initialized = False
_init_lock = asyncio.Lock()


def _parse_json_list(raw: str | None) -> list[dict[str, Any]]:
    if not raw or not str(raw).strip():
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


async def get_device_info(retries: int = 5, delay_sec: float = 0.4) -> list[dict[str, Any]]:
    for attempt in range(retries):
        raw = await bhaptics_python.get_device_info_json()
        devices = _parse_json_list(raw)
        if devices:
            return devices
        if attempt < retries - 1:
            await asyncio.sleep(delay_sec)
    return []


async def ensure_sdk() -> bool:
    global _initialized
    if _initialized:
        return True
    async with _init_lock:
        if _initialized:
            return True
        ok = await bhaptics_python.registry_and_initialize(APP_ID, API_KEY, "")
        if not ok:
            return False
        _initialized = True
        await asyncio.sleep(0.5)
        return True


async def get_glove_status() -> dict[str, Any]:
    await ensure_sdk()
    devices = await get_device_info()
    left = await bhaptics_python.is_bhaptics_device_connected(GLOVE_LEFT)
    right = await bhaptics_python.is_bhaptics_device_connected(GLOVE_RIGHT)
    return {
        "app": APP_ID,
        "event": EVENT_HIT,
        "left_glove": left,
        "right_glove": right,
        "device_indexes": {"right": GLOVE_INDEX_RIGHT, "left": GLOVE_INDEX_LEFT},
        "devices": devices,
    }


async def _play_event_indexed() -> dict[str, int]:
    right_id = await bhaptics_python.play_event(EVENT_HIT, GLOVE_INDEX_RIGHT)
    left_id = await bhaptics_python.play_event(EVENT_HIT, GLOVE_INDEX_LEFT)
    return {"right": right_id, "left": left_id}


async def _play_event_all() -> int:
    return await bhaptics_python.play_event(EVENT_HIT)


async def _play_glove_direct(intensity: int = 100) -> dict[str, int]:
    motors = [intensity] * 6
    playtimes = [8] * 6
    shapes = [0] * 6
    left_id, right_id = await asyncio.gather(
        bhaptics_python.play_glove(GLOVE_LEFT, motors, playtimes, shapes, 0),
        bhaptics_python.play_glove(GLOVE_RIGHT, motors, playtimes, shapes, 0),
    )
    return {"left": left_id, "right": right_id}


async def _play_dot_direct(intensity: int = 100, duration_ms: int = 800) -> dict[str, int]:
    values = [intensity] * 6
    left_id, right_id = await asyncio.gather(
        bhaptics_python.play_dot(GLOVE_LEFT, duration_ms, values),
        bhaptics_python.play_dot(GLOVE_RIGHT, duration_ms, values),
    )
    return {"left": left_id, "right": right_id}


def _any_ok(ids: dict[str, int] | int) -> bool:
    if isinstance(ids, int):
        return ids != -1
    return any(v != -1 for v in ids.values())


async def trigger_hit() -> dict[str, Any]:
    """
    按多种方式依次尝试触发，直到有一种返回成功。
    macOS Player 上 is_bhaptics_device_connected 常为 False，但直连仍可能有效。
    """
    if not await ensure_sdk():
        raise RuntimeError("SDK 初始化失败：请确认 bHaptics Player 已启动")

    status = await get_glove_status()
    steps: list[str] = []

    try:
        await bhaptics_python.ping_all()
        steps.append("ping_all")
    except Exception:
        pass

    # 1) Device Index 0/1 播放 Portal 事件
    indexed = await _play_event_indexed()
    steps.append(f"event_index right={indexed['right']} left={indexed['left']}")
    if _any_ok(indexed):
        return {"mode": "event_index", "request_ids": indexed, "steps": steps, "status": status}

    await asyncio.sleep(0.15)

    # 2) 不指定 index（-1 全部设备）
    all_id = await _play_event_all()
    steps.append(f"event_all id={all_id}")
    if _any_ok(all_id):
        return {"mode": "event_all", "request_id": all_id, "steps": steps, "status": status}

    await asyncio.sleep(0.15)

    # 3) 直连 play_glove（不依赖 Portal 事件）
    glove_ids = await _play_glove_direct(intensity=100)
    steps.append(f"play_glove right={glove_ids['right']} left={glove_ids['left']}")
    if _any_ok(glove_ids):
        return {"mode": "play_glove", "request_ids": glove_ids, "steps": steps, "status": status}

    await asyncio.sleep(0.15)

    # 4) 直连 play_dot 持续震
    dot_ids = await _play_dot_direct(intensity=100, duration_ms=800)
    steps.append(f"play_dot right={dot_ids['right']} left={dot_ids['left']}")
    if _any_ok(dot_ids):
        return {"mode": "play_dot", "request_ids": dot_ids, "steps": steps, "status": status}

    raise RuntimeError(
        "所有触发方式均失败。"
        f" steps={steps}; "
        "请确认：1) Player 里手套已连接 2) 点「连接到游戏」3) Portal 已 Deploy hit"
    )


async def fallback_glove_pulse(intensity: int = 100) -> dict[str, int]:
    return await _play_glove_direct(intensity=intensity)


async def stop_all() -> None:
    await bhaptics_python.stop_all()


async def shutdown() -> None:
    global _initialized
    await bhaptics_python.stop_all()
    await bhaptics_python.close()
    _initialized = False
