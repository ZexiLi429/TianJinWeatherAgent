<div align="center">

# 🌦️ 天津交通气象哨兵

### FengHe-Weather · 风和天气

**面向天津市的交通气象综合服务平台**

*实时天气 · 暴雨积涝预警 · 交通路况 · AI 智能问答*

---

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-deployed-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://tianjin-weather-sentinel.pages.dev)
[![License](https://img.shields.io/badge/License-Apache_2.0-green?style=flat-square)](LICENSE)

<br/>

**[🌐 在线访问](https://tianjin-weather-sentinel.pages.dev)** · **[📖 项目总结](项目总结.md)**

</div>

---

## ✨ 功能亮点

<table>
<tr>
<td width="50%">

**🌤️ 实时气象**
- 天津 16 区实时天气总览
- 逐小时预报 & 7 天趋势
- 气象雷达动态图

**🌊 暴雨积涝预警**
- 16 处历史易涝点实时监控
- 低/中/高三级风险色阶
- 积水地图动态渲染

**🚗 交通出行**
- 高德实时路况叠加地图
- 天津地铁 5 条线路状态
- 天气-路况风险联动分析

</td>
<td width="50%">

**🗺️ 气象预警地图**
- 红/橙/黄/蓝四级预警分区
- 预警发布时间 & 影响范围
- 实时更新，自动计算预警时长

**🤖 AI 智能助手**
- 津小天 & 津小晴双角色
- 气泡台词每 6 秒智能轮播
- 支持天气、交通、旅游全领域问答

**🏔️ 更多模块**
- 山区出行安全评估
- 旅游天气适宜度
- 健康气象指数

</td>
</tr>
</table>

---

## 🚀 快速开始

### 前置要求

| 工具 | 版本 |
|------|------|
| [Node.js](https://nodejs.org) | ≥ 18.x LTS |
| npm | ≥ 9.x |

### 1 · 克隆 & 安装依赖

```bash
git clone <仓库地址>
cd 天津交通气象哨兵
npm install
```

### 2 · 配置环境变量

复制下方内容，在项目根目录新建 `.env` 文件：

```env
# ── AI 问答（智谱 GLM-4）──────────────────────────────
VITE_GLM_API_KEY=your_glm_api_key
VITE_PREFER_GLM=true

# ── 地图（高德地图）──────────────────────────────────
VITE_AMAP_API_KEY=your_amap_api_key

# ── 气象数据（和风天气）──────────────────────────────
VITE_QWEATHER_API_KEY=your_qweather_api_key
```

> 获取 API Key：[智谱 GLM](https://open.bigmodel.cn) · [高德开放平台](https://lbs.amap.com) · [和风天气](https://dev.qweather.com)

### 3 · 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 → **http://localhost:3000** 🎉

> **Windows 用户提示**：若 PowerShell 提示脚本执行受限，请先执行：
> ```powershell
> Set-ExecutionPolicy Bypass -Scope Process -Force
> ```

---

## 📦 构建 & 部署

```bash
# 本地构建（输出到 dist/）
npm run build

# 预览构建产物
npm run preview

# ── 部署到 Cloudflare Pages ──────────────────────────
# 首次登录 Cloudflare 账号
npm run cf:login

# 部署到预览分支
npm run cf:deploy

# 部署到生产环境（main 分支）
npm run cf:deploy:prod
```

🌍 **生产地址**：https://tianjin-weather-sentinel.pages.dev

---

## 🗂️ 项目结构

```
src/
├── components/
│   ├── AIAssistant.tsx          # 🤖 悬浮 AI 助手（津小天 / 津小晴）
│   ├── Header.tsx               # 顶部导航栏
│   └── MapContainer.tsx         # 地图容器
│
├── views/
│   ├── WeatherHome.tsx          # 🏠 首页天气总览
│   ├── FloodView.tsx            # 🌊 暴雨积涝预警
│   ├── TrafficRealtimeMetroView.tsx  # 🚗 实时路况 & 地铁
│   ├── WarningMapView.tsx       # 🗺️ 气象预警地图
│   ├── ChatPage.tsx             # 💬 AI 对话页
│   ├── MountainView.tsx         # 🏔️ 山区出行安全
│   ├── TourismView.tsx          # 🎡 旅游天气
│   ├── HealthView.tsx           # 🏥 健康气象指数
│   ├── EcoView.tsx              # 🌿 生态气候
│   ├── ScienceView.tsx          # 🔬 气象科普
│   ├── ConventionalWeatherView.tsx  # 📅 常规天气预报
│   ├── LiveWeatherView.tsx      # 📡 实时气象站
│   └── RadarView.tsx            # 📻 雷达图
│
├── services/
│   ├── aiService.ts             # AI 问答（GLM / Gemini 可切换）
│   ├── qweatherService.ts       # 和风天气 API
│   ├── weatherService.ts        # 天气数据聚合
│   ├── floodWarningService.ts   # 积涝预警数据
│   ├── chatHistoryService.ts    # 对话历史持久化
│   └── officialWarningService.ts  # 官方预警抓取
│
└── assets/avatars/
    ├── boy.png                  # 津小天头像
    └── girl.png                 # 津小晴头像
```

---

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript 5.8 |
| 构建工具 | Vite 6 |
| 样式方案 | Tailwind CSS 4 |
| 地图引擎 | React-Leaflet 5 + Leaflet 1.9 |
| 动画库 | Framer Motion |
| 图表库 | Recharts |
| AI 问答 | 智谱 GLM-4 / Google Gemini |
| 气象数据 | 和风天气 API · NMC 国家气象中心 |
| 地图数据 | 高德地图 REST API |
| 部署平台 | Cloudflare Pages（Wrangler 4） |

---

## 📜 License

[Apache 2.0](LICENSE) · Made with ❤️ for Tianjin
