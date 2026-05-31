#!/usr/bin/env python3
"""
ironflower 手套触觉 CLI

用法：
  python glove_haptic.py          # 触发 hit 事件
  python glove_haptic.py status   # 查看手套连接状态
"""

from __future__ import annotations

import asyncio
import sys

from bhaptics_ironflower import (
    fallback_glove_pulse,
    get_glove_status,
    shutdown,
    trigger_hit,
)


async def cmd_hit() -> None:
    print("触发 hit 事件…")
    try:
        result = await trigger_hit()
        print(f"完成 mode={result['mode']} steps={result.get('steps')}")
    except Exception as exc:
        print(f"事件失败（{exc}），尝试直连脉冲…")
        await fallback_glove_pulse()
        print("直连脉冲完成")


async def cmd_status() -> None:
    status = await get_glove_status()
    print(f"应用事件：{status['event']}")
    idx = status["device_indexes"]
    print(f"Device Index：GloveR={idx['right']}  GloveL={idx['left']}")
    print(f"左手套：{'已连接' if status['left_glove'] else '未连接'}")
    print(f"右手套：{'已连接' if status['right_glove'] else '未连接'}")
    print(f"设备列表：{status['devices']}")


async def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "hit"
    try:
        if cmd == "status":
            await cmd_status()
        elif cmd == "hit":
            await cmd_hit()
        else:
            print(f"未知命令：{cmd}（可用 hit / status）")
            sys.exit(1)
    finally:
        await shutdown()


if __name__ == "__main__":
    asyncio.run(main())
