#!/usr/bin/env python3
"""Serve ironflower over HTTP for local / LAN testing."""

from __future__ import annotations

import argparse
import http.server
import os
import socket
import sys


class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def detect_lan_ip() -> str:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        if not ip.startswith("127."):
            return ip
    except OSError:
        pass

    for iface in ("en0", "en1", "awdl0"):
        try:
            import subprocess

            result = subprocess.run(
                ["ipconfig", "getifaddr", iface],
                capture_output=True,
                text=True,
                check=False,
            )
            ip = (result.stdout or "").strip()
            if ip:
                return ip
        except OSError:
            continue
    return ""


def print_banner(port: int, lan_ip: str) -> None:
    print("==========================================")
    print("  Iron Flower VR · 本地 / 局域网 HTTP 服务器")
    print("==========================================")
    print("")
    print("本机访问：")
    print(f"  http://127.0.0.1:{port}/iron.html")
    print("")
    if lan_ip:
        print("同一 WiFi / 局域网内的手机、Pico、平板访问：")
        print(f"  http://{lan_ip}:{port}/iron.html")
        print("")
        print("请确保其他设备与这台电脑连接同一无线网络。")
    else:
        print("未能自动检测局域网 IP，可在「系统设置 → 网络」中查看本机 IP，")
        print(f"然后用：http://<你的IP>:{port}/iron.html")
    print("")
    print("需要 HTTPS（Pico WebXR 更稳定）请运行：start-local-server-https.command")
    print("按 Ctrl+C 停止服务器")
    print("==========================================")
    print("")


def main() -> None:
    parser = argparse.ArgumentParser(description="Iron Flower HTTP static server")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--bind", default="0.0.0.0")
    args = parser.parse_args()

    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)

    lan_ip = detect_lan_ip()
    print_banner(args.port, lan_ip)

    httpd = http.server.HTTPServer((args.bind, args.port), CORSRequestHandler)
    print(f"Serving {root}")
    print(f"HTTP on http://{args.bind}:{args.port}/ (LAN: 0.0.0.0 表示监听所有网卡)")
    print("")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
