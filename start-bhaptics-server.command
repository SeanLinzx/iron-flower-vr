#!/bin/bash
cd "$(dirname "$0")"
echo "安装依赖（首次运行）…"
python3 -m pip install -r requirements-bhaptics.txt -q
echo ""
python3 bhaptics_server.py
