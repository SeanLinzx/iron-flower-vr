#!/bin/zsh
cd "$(dirname "$0")"
PORT=8080

while lsof -ti tcp:$PORT >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

python3 serve-http.py --port "$PORT"
