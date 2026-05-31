# 铜官窑打铁花 VR 原型

WebXR 互动原型，入口为 `iron.html`。推荐从 **故事模式** 完整体验：开场 CG → 素材场景 → 四关练习 → 表演场景 → 结局 CG。

## 项目结构

```text
ironflower/
├── iron.html              # 主菜单（故事模式 / 关卡模式入口）
├── story-image.html       # 故事 CG 播放页
├── story-flow.js          # 故事流程与跳转配置
├── scene-materials.html   # 素材收集场景
├── scene-practice.html    # 四关节奏练习
├── scene-performance.html # 正式表演场景
├── assets/
│   ├── backgrounds/       # 全景与界面背景
│   │   ├── start-nano.png
│   │   ├── start-screen.jpg
│   │   ├── workshop-panorama.jpg
│   │   ├── scene2-nano.png
│   │   └── per.png
│   └── story/             # 剧情 CG 图片
├── css/                   # 共用样式
├── js/                    # VR UI 与 bHaptics 触觉脚本
├── serve-https.py         # 本地 HTTPS 静态服务
└── start-local-server*.command
```

## 故事流程

`iron.html` → `story-image.html` → `scene-materials.html` → `scene-practice.html`（4 关）→ `scene-performance.html` → 结局 CG → 返回 `iron.html`

## 启动方式

推荐双击运行：

```text
start-local-server.command
```

默认端口 **8080**，并绑定 `0.0.0.0`，同一 WiFi 内的手机 / Pico 可直接访问。终端会显示本机与局域网地址，例如：

```text
本机：http://127.0.0.1:8080/iron.html
局域网：http://192.168.1.23:8080/iron.html
```

命令行手动启动（效果相同）：

```bash
cd ironflower
python3 serve-http.py --port 8080
```

若 8080 已被占用，脚本会自动尝试 8081、8082……

请用 Chrome 打开，不要用 `file://` 直接打开场景页。

### 同一局域网内其他设备访问

1. 电脑与手机 / Pico 头显连接 **同一个 Wi‑Fi**。
2. 在本机运行 `start-local-server.command`（已绑定 `0.0.0.0`，允许局域网访问）。
3. 在其他设备的浏览器中输入终端里显示的 **局域网地址**（`http://192.168.x.x:8080/iron.html`）。
4. 若无法打开，请检查：
   - macOS「系统设置 → 网络 → 防火墙」是否拦截了 `python3` 入站连接（可暂时允许，或为 Python 添加例外）；
   - 路由器是否开启了「AP 隔离 / 访客网络隔离」（开启后设备之间不能互访）。

### 局域网 HTTPS（推荐 Pico / WebXR）

WebXR 在头显里通常需要 **安全上下文**（`https://` 或 localhost）。局域网可用自签名证书：

1. 双击 **`start-local-server-https.command`**
2. 证书保存在 `.local-certs/`
3. 访问终端显示的 `https://` 地址，首次需信任自签名证书

### 触觉反馈（可选）

若使用 bHaptics 手套，另运行 `start-bhaptics-server.command`，并确保页面通过 HTTPS 或 localhost 访问。

## 关卡模式

主菜单也提供直接进入各场景的 **关卡模式** 链接，便于单独调试素材、练习或表演，无需走完整故事线。
