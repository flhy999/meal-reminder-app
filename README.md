# 🍽️ 饭点打卡 · 每日三餐拍照记录

一款可安装到手机桌面的 PWA：到点提醒你拍下吃了什么，自动按早/午/晚归档，本地保存成相册；并支持**每周打卡统计**与**分享朋友圈周报图**。

- 基于导入版精致 UI 改造
- 存储从 `localStorage` 升级为 **IndexedDB**（照片不再受 5MB 配额限制）
- 新增 **Web Push 后台推送**（关掉页面/锁屏也能收到饭点提醒）
- 新增 **本周打卡统计** + **一键生成周报图分享朋友圈**

---

## 功能一览

| 功能 | 说明 |
|------|------|
| 🍱 饭点提醒 | 默认北京时 07:00 / 12:00 / 19:00，页面内通知 +（可选）Web Push 后台推送 |
| 📸 拍照打卡 | 调起相机拍照，上传图片兜底；自动按早/午/晚归档，可加备注 |
| 📚 本地相册 | 照片存 IndexedDB，按日期分组，支持删除；数据不上传 |
| 📊 每周统计 | 首页「本周打卡」卡片：周一~周日网格、完成率、进度条 |
| 📤 分享周报 | canvas 合成周报图，支持系统分享（含微信）或下载 PNG |
| 📲 可安装 | 手机浏览器「添加到主屏幕」即可像原生 App 使用 |

---

## 本地运行（含后台推送）

```bash
cd meal-reminder-app
npm install
npm start            # 启动推送服务端（默认 3000 端口，同时托管前端）
# 浏览器打开 http://localhost:3000
```

设置 → 开启「📡 后台推送」即会向本机 `server.js` 订阅；到点（北京时间）会收到系统通知。

---

## 部署到 Vercel / Netlify（前端，手机直接打开）

静态托管**只托管前端**，无法自己发推送；后台推送需另部署 `server.js`（见下）。

**Vercel**

```bash
npm i -g vercel
vercel --prod        # 按提示登录，自动识别 vercel.json
```

或连接 GitHub 后一键导入仓库。

**Netlify**

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=.
```

> 仓库已含 `vercel.json` / `netlify.toml`，部署后深链接与 PWA 均正常工作。

---

## 部署后台推送服务（Render / Railway）

把 `server.js` 连同 `package.json` / `Procfile` / `railway.json` 部署到支持 Node 的平台：

- **Render**：New → Web Service → 连仓库 → Build `npm install`、Start `node server.js`、选免费实例
- **Railway**：`railway init` + `railway up`，或连接 GitHub

**环境变量（重要）**

| 变量 | 说明 |
|------|------|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | 用 `npx web-push generate-vapid-keys` 生成并固化，否则容器重启后旧订阅失效 |
| `REMINDERS` | 饭点时间（北京时间，逗号分隔），默认 `07:00,12:00,19:00` |
| `PORT` | 平台自动注入 |

部署拿到地址（如 `https://meal-push.onrender.com`）后，在 App **设置 → 推送服务地址** 填入并开启「后台推送」即可。

> 免费实例会休眠，可能错过饭点——可用 UptimeRobot 每 5–10 分钟 ping 一次保持唤醒。

---

## 🚀 一键部署（前后端都上线 · 推荐）

`server.js` 同时托管**前端 PWA + Web Push 推送**，因此把仓库一键部署到 **Render** 即可在一个域名上拿到「完整可用 + 后台推送」的 App，无需分别部署前后端、也无需在设置里填推送地址（同源）。

```
https://render.com/deploy?repo=https://github.com/flhy999/meal-reminder-app
```

**步骤（约 1 分钟）**
1. 把本仓库推到 GitHub（设为 **Public**，否则按钮需登录才能用）；
2. 浏览器打开上面那条链接 → 登录 Render → 点 `Deploy`；
3. 等待构建完成（约 1–2 分钟），Render 给出形如 `https://meal-reminder-app.onrender.com` 的地址；
4. 手机打开该地址 →「添加到主屏幕」；设置里开启「📡 后台推送」即可。
   即使关闭页面 / 锁屏，也会在 **北京时间 07:00 / 12:00 / 19:00** 收到系统通知。

> VAPID 密钥首次运行自动生成，按钮可零配置直接上线；如需固化，可在 Render 控制台添加 `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` 两个环境变量。
> 免费实例会休眠、可能错过饭点，可用 UptimeRobot 每 5–10 分钟 ping 一次保持唤醒。

---

## 仅部署前端（可选）

若只想把**前端**单独上线（后台推送另部署），用下面任意静态平台（仓库已含 `vercel.json` / `netlify.toml`）：

**Vercel**
```bash
npm i -g vercel && vercel --prod
```
**Netlify**
```bash
npm i -g netlify-cli && netlify deploy --prod --dir=.
```

前端上线后，后台推送仍需按上文部署 `server.js` 到 Render/Railway，并在 App **设置 → 推送服务地址** 填入该地址。

> 当前已有一个公网前端实例（CloudStudio 静态托管）：`https://dd43bb783c39498cad253d0c81cb682f.bj5.agentos-app.net`

---

## 目录结构

```
meal-reminder-app/
├── index.html          # 前端（单文件 PWA，内联 CSS/JS）
├── sw.js               # Service Worker（离线缓存 + Web Push）
├── manifest.json       # PWA 清单
├── server.js           # Web Push 推送服务端（Express + web-push）
├── package.json        # 依赖与启动脚本
├── Procfile            # Render/Heroku 启动
├── railway.json        # Railway 配置
├── Dockerfile          # 容器化部署
├── render.yaml         # Render 一键部署（按钮用）
├── vercel.json         # Vercel 静态部署
├── netlify.toml        # Netlify 静态部署
├── deploy.js           # 交互式部署脚本（Vercel/GitHub Pages/Netlify）
├── generate_icons.py   # 图标生成
└── *.png               # 应用图标
```

数据存储：`mealReminderDB`（IndexedDB）。推送订阅存 `server.js` 运行目录的 `subscriptions.json`（已在 `.gitignore` 忽略）。
