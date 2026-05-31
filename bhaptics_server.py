#!/usr/bin/env python3
"""
ironflower 触觉 HTTP 桥接

Web 页面（VR）通过 HTTP 调用本服务，由 Python SDK 触发手套 hit 事件。
参考：https://docs.bhaptics.com/sdk/python/guide/

启动：
  pip install -r requirements-bhaptics.txt
  python bhaptics_server.py

接口：
  GET  /health  → 设备状态
  POST /hit     → 触发 hit 事件
  POST /stop    → 停止全部触觉
"""

from __future__ import annotations

import asyncio
import json
import signal
import sys

from aiohttp import web

from bhaptics_ironflower import (
    ensure_sdk,
    fallback_glove_pulse,
    get_glove_status,
    shutdown,
    stop_all,
    trigger_hit,
)
from bhaptics_ironflower_config import HTTP_HOST, HTTP_PORT


@web.middleware
async def cors_middleware(request: web.Request, handler):
    """允许网页从其他端口（如 8080）调用本服务。"""
    if request.method == "OPTIONS":
        resp = web.Response()
    else:
        resp = await handler(request)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


async def handle_health(_request: web.Request) -> web.Response:
    try:
        status = await get_glove_status()
        return web.json_response({"ok": True, **status})
    except Exception as exc:
        return web.json_response({"ok": False, "error": str(exc)}, status=500)


async def handle_hit(request: web.Request) -> web.Response:
    body = {}
    if request.can_read_body:
        try:
            body = await request.json()
        except json.JSONDecodeError:
            body = {}

    use_fallback = bool(body.get("fallback", True))
    try:
        result = await trigger_hit()
        print(f"[hit] 成功 mode={result['mode']} steps={result.get('steps')}")
        return web.json_response({"ok": True, "event": "hit", **result})
    except Exception as exc:
        print(f"[hit] 失败: {exc}", file=sys.stderr)
        if not use_fallback:
            return web.json_response({"ok": False, "error": str(exc)}, status=500)
        try:
            ids = await fallback_glove_pulse()
            print(f"[hit] fallback play_glove ids={ids}")
            return web.json_response(
                {
                    "ok": True,
                    "mode": "fallback_glove",
                    "event": "hit",
                    "request_ids": ids,
                    "warning": str(exc),
                }
            )
        except Exception as exc2:
            return web.json_response(
                {"ok": False, "error": f"{exc}; fallback: {exc2}"},
                status=500,
            )


async def handle_stop(_request: web.Request) -> web.Response:
    await stop_all()
    return web.json_response({"ok": True})


async def on_startup(_app: web.Application) -> None:
    print("正在连接 bHaptics Player…")
    try:
        if not await ensure_sdk():
            print("警告：SDK 初始化失败，请确认 Player 已启动", file=sys.stderr)
            return
        status = await get_glove_status()
        idx = status["device_indexes"]
        print(
            f"ironflower 已就绪 | hit | "
            f"GloveR index={idx['right']} 在线={status['right_glove']} | "
            f"GloveL index={idx['left']} 在线={status['left_glove']}"
        )
        if not status["devices"] and not status["left_glove"] and not status["right_glove"]:
            print(
                "提示：SDK 未检测到手套（Player 界面里可能仍显示已连接）。\n"
                "  → 请在 Player 左侧点击「连接到游戏」\n"
                "  → 然后重启本脚本，再试 hit-trigger.html",
                file=sys.stderr,
            )
    except Exception as exc:
        print(f"警告：读取手套状态失败（{exc}），HTTP 服务仍会启动", file=sys.stderr)


async def on_cleanup(_app: web.Application) -> None:
    await shutdown()


def main() -> None:
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/health", handle_health)
    app.router.add_post("/hit", handle_hit)
    app.router.add_post("/stop", handle_stop)
    app.router.add_route("OPTIONS", "/health", lambda _: web.Response())
    app.router.add_route("OPTIONS", "/hit", lambda _: web.Response())
    app.router.add_route("OPTIONS", "/stop", lambda _: web.Response())
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)

    print(f"触觉服务：http://{HTTP_HOST}:{HTTP_PORT}")
    print("  GET  /health")
    print("  POST /hit")
    print("  POST /stop")

    web.run_app(app, host=HTTP_HOST, port=HTTP_PORT)


if __name__ == "__main__":
    main()
