#!/usr/bin/env python3
"""Serve ironflower over HTTPS for local / LAN testing (WebXR-friendly)."""

from __future__ import annotations

import argparse
import http.server
import os
import socket
import ssl
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
    print("  Iron Flower VR · 本地 / 局域网 HTTPS 服务器")
    print("==========================================")
    print("")
    print("本机访问：")
    print(f"  https://127.0.0.1:{port}/iron.html")
    print("")
    if lan_ip:
        print("同一 WiFi / 局域网内的手机、Pico、平板访问：")
        print(f"  https://{lan_ip}:{port}/iron.html")
        print("")
        print("首次打开时浏览器会提示证书不受信任，请选择「继续访问」")
        print("（自签名证书，仅用于本地调试；换 WiFi 后请重新运行 start-local-server-https.command）")
    else:
        print("未能自动检测局域网 IP，可在「系统设置 → 网络」中查看本机 IP，")
        print(f"然后用：https://<你的IP>:{port}/iron.html")
    print("")
    print("HTTP 版本（无证书提示）：start-local-server.command")
    print("按 Ctrl+C 停止服务器")
    print("==========================================")
    print("")


def main() -> None:
    parser = argparse.ArgumentParser(description="Iron Flower HTTPS static server")
    parser.add_argument("--port", type=int, default=9877)
    parser.add_argument("--cert", default=".local-certs/cert.pem")
    parser.add_argument("--key", default=".local-certs/key.pem")
    args = parser.parse_args()

    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)

    if not os.path.isfile(args.cert) or not os.path.isfile(args.key):
        print("Certificate not found. Run start-local-server-https.command first.", file=sys.stderr)
        sys.exit(1)

    lan_ip = detect_lan_ip()
    print_banner(args.port, lan_ip)

    httpd = http.server.HTTPServer(("0.0.0.0", args.port), CORSRequestHandler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(args.cert, args.key)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"Serving {root}")
    print(f"HTTPS on https://0.0.0.0:{args.port}/ (LAN: 0.0.0.0 表示监听所有网卡)")
    print("")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
