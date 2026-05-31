"""ironflower × bHaptics 应用配置（一个应用绑定 hit 动作）"""

APP_NAME = "ironflower"
APP_ID = "6a1c1014f44e4d49cb99560a"
API_KEY = "dDN3wkj53BwCRGCi6yim"
EVENT_HIT = "hiut"

# TactGlove device type（见官方 Device Type 表）
GLOVE_LEFT = 8
GLOVE_RIGHT = 9

# Player → Settings → Labs → Device Index（重连后会重置，需与 Player 一致）
# GloveR = 0, GloveL = 1
GLOVE_INDEX_RIGHT = 0
GLOVE_INDEX_LEFT = 1
GLOVE_DEVICE_INDICES = (GLOVE_INDEX_RIGHT, GLOVE_INDEX_LEFT)

# HTTP 桥接默认端口（供 Web VR 调用）
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 8765
