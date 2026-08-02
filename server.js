// 饭点打卡 · Web Push 推送服务端
// 功能：托管静态 PWA + 提供 /api/* 推送接口 + 按北京时间饭点定时推送
// 部署：Render / Railway / 任意支持 Node 的平台（静态托管平台无法运行此服务）
//
// 环境变量：
//   PORT              监听端口（默认 3000，云平台自动注入）
//   VAPID_PUBLIC_KEY  VAPID 公钥（建议用 ENV 固化，避免重启后旧订阅失效）
//   VAPID_PRIVATE_KEY VAPID 私钥
//   REMINDERS         饭点时间（北京时间，逗号分隔，默认 07:00,12:00,19:00）
//   APP_URL           前端地址（点击通知跳转用，默认 '/'）

const express = require('express');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const VAPID_FILE = path.join(__dirname, 'vapid.json');
const SUBS_FILE = path.join(__dirname, 'subscriptions.json');

// ---------- VAPID 密钥（优先用 ENV，否则本地生成一次） ----------
let vapidKeys;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
  };
} else if (fs.existsSync(VAPID_FILE)) {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}
webpush.setVapidDetails(
  'mailto:meal-reminder@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ---------- 订阅存储（个人使用：文件即可；多实例请挂持久卷） ----------
let subscriptions = [];
if (fs.existsSync(SUBS_FILE)) {
  try { subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')); } catch (e) { subscriptions = []; }
}
function saveSubs() {
  try { fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions)); } catch (e) {}
}

// ---------- 饭点（北京时间） ----------
const MEAL_TIMES = (process.env.REMINDERS || '07:00,12:00,19:00').split(',').map(s => s.trim());
const MEAL_LABELS = ['早餐', '午餐', '晚餐', '加餐'];
const APP_URL = process.env.APP_URL || '/';

// ---------- Express ----------
const app = express();
app.use(express.json());

// CORS（前端（Vercel/Netlify）与推送服务（Render/Railway）通常不同源）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 托管静态 PWA（一键整站部署时本服务同时是前端）
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

// 获取 VAPID 公钥
app.get('/api/vapid', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// 订阅
app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'invalid subscription' });
  if (!subscriptions.find(s => s.endpoint === sub.endpoint)) subscriptions.push(sub);
  saveSubs();
  res.status(201).json({ ok: true });
});

// 取消订阅
app.post('/api/unsubscribe', (req, res) => {
  const sub = req.body;
  if (sub && sub.endpoint) subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
  saveSubs();
  res.json({ ok: true });
});

// 测试推送（手动验证链路）
app.post('/api/test-push', async (req, res) => {
  const sent = await sendToAll('🍽️ 饭点打卡 · 测试推送', '这是一条来自饭点打卡的测试提醒～');
  res.json({ ok: true, sent });
});

// 推送首页（简单健康检查）
app.get('/', (req, res) => {
  res.send('饭点打卡 Web Push 服务运行中。前端请访问部署静态站，或本服务同时托管了 PWA。');
});

// ---------- 推送逻辑 ----------
async function sendToAll(title, body) {
  if (subscriptions.length === 0) return 0;
  const payload = JSON.stringify({ title, body, url: APP_URL });
  const results = await Promise.allSettled(
    subscriptions.map(s => webpush.sendNotification(s, payload))
  );
  // 清理失效订阅（404/410）
  results.forEach((r, i) => {
    if (r.status === 'rejected' && r.reason && (r.reason.statusCode === 404 || r.reason.statusCode === 410)) {
      subscriptions.splice(i, 1);
    }
  });
  saveSubs();
  return results.filter(r => r.status === 'fulfilled').length;
}

// ---------- 北京时间助手 ----------
function beijingNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 8 * 3600000);
}

// ---------- 定时调度（每 20 秒检查一次是否到饭点） ----------
setInterval(() => {
  const bj = beijingNow();
  const cur = `${String(bj.getHours()).padStart(2, '0')}:${String(bj.getMinutes()).padStart(2, '0')}`;
  const todayKey = `${bj.getFullYear()}-${String(bj.getMonth() + 1).padStart(2, '0')}-${String(bj.getDate()).padStart(2, '0')}`;

  MEAL_TIMES.forEach((t, idx) => {
    if (t === cur) {
      const flagFile = path.join(__dirname, `.pushed-${todayKey}-${t}`);
      if (!fs.existsSync(flagFile)) {
        const label = MEAL_LABELS[idx] || '饭点';
        sendToAll(`🍽️ ${label}时间到啦！`, '快拍张照片记录今天吃了什么吧～');
        try { fs.writeFileSync(flagFile, '1'); } catch (e) {}
      }
    }
  });
}, 20000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`饭点打卡推送服务已启动：端口 ${PORT}`);
  console.log(`饭点（北京时间）：${MEAL_TIMES.join(' / ')}`);
  console.log(`当前订阅数：${subscriptions.length}`);
});
