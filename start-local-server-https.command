#!/bin/zsh
cd "$(dirname "$0")"

PORT=9877
CERT_DIR=".local-certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"
IP_META="$CERT_DIR/last-lan-ip.txt"

while lsof -ti tcp:$PORT >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

LAN_IP=""
for iface in en0 en1 awdl0; do
  ip=$(ipconfig getifaddr "$iface" 2>/dev/null)
  if [[ -n "$ip" ]]; then
    LAN_IP="$ip"
    break
  fi
done

mkdir -p "$CERT_DIR"

need_cert=0
if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]]; then
  need_cert=1
elif [[ -n "$LAN_IP" && "$(cat "$IP_META" 2>/dev/null)" != "$LAN_IP" ]]; then
  need_cert=1
fi

if [[ $need_cert -eq 1 ]]; then
  echo "正在生成本地 HTTPS 证书（含 localhost 与当前局域网 IP）..."
  SAN="DNS:localhost,IP:127.0.0.1"
  if [[ -n "$LAN_IP" ]]; then
    SAN="$SAN,IP:$LAN_IP"
    echo "$LAN_IP" >"$IP_META"
  fi
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY_FILE" -out "$CERT_FILE" -days 825 \
    -subj "/CN=IronFlower-Local/O=IronFlower VR/C=CN" \
    -addext "subjectAltName=$SAN" 2>/dev/null || {
    echo "证书生成失败，请确认已安装 OpenSSL（macOS 自带）。"
    exit 1
  }
  echo "证书已写入 $CERT_DIR/"
  echo ""
fi

echo "=========================================="
echo "  Iron Flower VR · HTTPS 局域网服务器"
echo "=========================================="
echo ""
echo "本机访问："
echo "  https://127.0.0.1:$PORT/iron.html"
echo ""
if [[ -n "$LAN_IP" ]]; then
  echo "同一 WiFi 内其他设备访问："
  echo "  https://$LAN_IP:$PORT/iron.html"
  echo ""
  echo "首次在 Pico / 手机打开时，浏览器会提示证书不受信任，"
  echo "请选择「继续访问」或「高级 → 继续」即可（自签名证书，仅用于本地调试）。"
else
  echo "未能检测局域网 IP，请在系统设置中查看 IP 后使用："
  echo "  https://<你的IP>:$PORT/iron.html"
fi
echo ""
echo "HTTP 版本（无证书提示）仍可用：start-local-server.command"
echo "按 Ctrl+C 停止服务器"
echo "=========================================="
echo ""

python3 serve-https.py --port "$PORT" --cert "$CERT_FILE" --key "$KEY_FILE"
