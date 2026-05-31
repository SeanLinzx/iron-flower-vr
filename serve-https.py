#!/usr/bin/env python3
"""Serve ironflower over HTTPS for local / LAN testing (WebXR-friendly)."""

from __future__ import annotations

import argparse
import http.server
import os
import ssl
import sys


class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


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

    httpd = http.server.HTTPServer(("0.0.0.0", args.port), CORSRequestHandler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(args.cert, args.key)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"Serving {root}")
    print(f"HTTPS on https://0.0.0.0:{args.port}/")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
