# 天津市积涝防洪水位监测 API 数据源快速参考

## 📌 一句话总结

**中国暂无国家级实时积涝 API，但可通过和风天气+高德地图的暴雨预警+降水数据，结合官方防洪部门数据，实现综合积涝监测。**

---

## 🚀 立即可用的 API（无需审批）

### 1️⃣ 和风天气 QWeather ⭐⭐⭐⭐⭐

**最重要：实时暴雨预警 + 降水量数据**

```
🌐 官网：https://www.qweather.com/
📚 文档：https://dev.qweather.com/docs/api/
⏱️ 申请：5分钟（免费）

🔑 获取方式：
1. https://dev.qweather.com/ → 免费注册
2. 创建应用 → 获取 API Key
3. 复制 Key 到项目 .env

📊 积涝相关数据：
  ✅ 暴雨预警信息（风险等级1-4）
  ✅ 实时降水量（mm/小时）
  ✅ 预警有效期和描述
  ❌ 不直接提供积涝点数据，但可推断风险

🔗 主要端点：
  GET /v7/warning/now?location=tianjin&key=KEY
  GET /v7/weather/now?location=tianjin&key=KEY

📈 数据更新频率：
  实时～6小时

💰 费用：免费版5000次/天足够使用
```

---

### 2️⃣ 高德地图 Amap ⭐⭐⭐⭐

**天气和降雨数据，补充和风天气**

```
🌐 官网：https://lbs.amap.com/
📚 文档：https://lbs.amap.com/api/webservice/guide/api/weatherinfo/
⏱️ 申请：5分钟（免费）

🔑 获取方式：
1. https://console.amap.com/ → 注册
2. "应用管理" → 创建Web应用
3. 启用"Web服务" → 获取Key
4. 复制 Key 到项目 .env

📊 积涝相关数据：
  ✅ 实时天气状况（晴、小雨、大雨、暴雨等）
  ✅ 天气代码和风力等级
  ✅ 区县级天气预报（3天）
  ✅ 相对湿度等辅助信息

🔗 主要端点：
  GET /v3/weather/weatherInfo?city=120100&key=KEY

📈 数据更新频率：
  每小时更新

💰 费用：免费版500万次/天足够使用
```

---

## 🏛️ 需要申请的官方 API

### 3️⃣ 中国气象局官方预警 ⭐⭐⭐

**完全免费但需要部门授权**

```
🌐 官网：http://www.cma.gov.cn/
🌐 预警平台：http://www.nmc.cn/publish/alarm/

📊 数据类型：
  ✅ 官方气象灾害预警
  ✅ 暴雨预警（权威性最高）
  ✅ 强对流预警
  ✅ 分布式暴雨预警

🔍 获取方式：
  方式1（无需申请）：
  - 访问官网查看 HTML 页面数据
  - RSS 订阅：http://www.nmc.cn/f/fm/rss/forecast_tianjin.html
  
  方式2（需要申请）：
  - 联系中国气象部申请 API
  - 企业或科研机构可获得 REST API 权限
  - http://api.nmc.cn/ (部分开放)

📈 数据更新频率：实时（预警发布即时）
```

---

### 4️⃣ 水利部全国水情数据服务 ⭐⭐⭐

**全国江河水位和降雨数据（权威）**

```
🌐 官网：http://www.mwr.gov.cn/
🌐 数据平台：http://www.hydroinfo.gov.cn/

📊 数据类型：
  ✅ 全国主要江河实时水位
  ✅ 降雨量分布图
  ✅ 水文预报预警信息
  ✅ 防汛抗旱动态

🔍 获取方式：
  方式1（无需申请）：
  - 访问网站查看数据和地图
  - 在线查询各水文站数据
  
  方式2（需要申请）：
  - 填写《水利数据获取申请表》
  - 向水利部部办公室提交
  - 7-30天审批周期
  - 签署数据保密协议后获得 API 或数据库权限

🎯 天津相关水文站：
  - 海河三岔河口站
  - 海河北闸站
  - 永定河沿村站
  - 潮白河蓝村站

📈 数据更新频率：6-12小时
```

---

### 5️⃣ 天津市水务局防洪数据 ⭐⭐

**本地防洪部门专业数据（最专业但最难获取）**

```
🌐 官网：https://swj.tj.gov.cn/

📊 数据类型：
  ✅ 天津市水文站实时数据
  ✅ 防洪预报信息
  ✅ 防汛通报（汛期）
  ✅ 排水泵站运行状态

🔍 获取方式：
  方式1：
  - 访问官网查看最新防汛信息
  - 下载发布的防汛通报和报表
  
  方式2（需要申请）：
  - 准备企业证明和项目计划
  - 说明数据用途
  - 联系天津水务局数据部门
  - 2-4周审批
  - 签署协议后获得 API 接口
  
  联系部门：
  - 防汛办公室 (汛期设置)
  - 水文处 (常年设置)

📈 数据更新频率：汛期每6-12小时更新
```

---

### 6️⃣ 天津市应急管理部预警 ⭐⭐⭐

**应急部门权威预警信息**

```
🌐 官网：https://yjglj.tj.gov.cn/
🌐 微信：@天津应急管理
🌐 微博：@天津应急管理

📊 数据类型：
  ✅ 气象灾害预警
  ✅ 水旱灾害预警
  ✅ 应急响应通知
  ✅ 灾害信息发布

🔍 获取方式：
  方式1（无需申请）：
  - 访问官网预警栏目
  - 关注官方微信公众号
  - 实时接收预警推送
  
  方式2（需要申请）：
  - 与应急管理部合作获得 API 权限
  - 3-7天审批

📈 数据更新频率：实时
```

---

## 📊 API 对比表

| API | 费用 | 实时性 | 需要申请 | 积涝数据 | 难度 | 推荐度 |
|----|------|--------|--------|---------|------|-------|
| 🟢 和风天气 | 免费 | 实时 | ✅ 免费 | 暴雨+降水 | 简单 | ⭐⭐⭐⭐⭐ |
| 🟢 高德地图 | 免费 | 实时 | ✅ 免费 | 天气+风力 | 简单 | ⭐⭐⭐⭐ |
| 🟡 气象局 | 免费 | 实时 | ⚠️ 申请 | 官方预警 | 中等 | ⭐⭐⭐ |
| 🟡 水利部 | 免费 | 6-12h | ⚠️ 申请 | 水位+降雨 | 困难 | ⭐⭐⭐ |
| 🔴 天津水务 | 免费 | 6-12h | ⚠️ 申请 | 专业数据 | 困难 | ⭐⭐ |
| 🔴 天津应急 | 免费 | 实时 | ⚠️ 申请 | 预警信息 | 中等 | ⭐⭐⭐ |

---

## 🎯 推荐方案

### 快速方案（2-3天，无需审批）

**使用：和风天气 + 高德地图**

```
第1天：
1. 注册和风天气 (5分钟)
2. 注册高德地图 (5分钟)
3. 获取 API Keys (10分钟)

第2-3天：
1. 在项目中集成两个 API
2. 实现暴雨预警 + 降水量监测
3. 地图显示风险地区

优势：
✅ 快速上线
✅ 数据实时
✅ 无审批等待
✅ 成本零

劣势：
❌ 不是积涝专业数据
❌ 是间接推断而非直接监测
```

### 完整方案（2-8周）

**快速方案 + 官方部门数据**

```
2-3周：实现快速方案
4-8周：
  - 申请气象部、水利部、天津相关部门数据
  - 融合多源数据
  - 建立完整的积涝监测系统

优势：
✅ 数据最准确
✅ 包括历史数据
✅ 官方支持和维护
✅ 可用于应急决策

劣势：
❌ 审批周期长
❌ 申请流程复杂
❌ 需要企业证件
```

---

## 🔌 代码示例

### 快速集成示例（TypeScript）

```typescript
// 获取天津市积涝风险
async function getFloodRisk() {
  // 1. 和风天气：获取暴雨预警
  const warningUrl = new URL('https://api.qweather.com/v7/warning/now');
  warningUrl.searchParams.append('location', 'tianjin');
  warningUrl.searchParams.append('key', 'YOUR_QWEATHER_KEY');
  
  const warningData = await fetch(warningUrl).then(r => r.json());
  const hasRainstorm = warningData.warning?.some(w => w.type === '12');

  // 2. 高德地图：获取天气
  const weatherUrl = new URL('https://restapi.amap.com/v3/weather/weatherInfo');
  weatherUrl.searchParams.append('city', '120100'); // 天津
  weatherUrl.searchParams.append('key', 'YOUR_AMAP_KEY');
  
  const weatherData = await fetch(weatherUrl).then(r => r.json());
  const weather = weatherData.lives[0]?.weather;

  // 3. 评估风险
  let risk = 'low';
  if (hasRainstorm || weather?.includes('暴雨')) {
    risk = 'high';
  } else if (weather?.includes('大雨')) {
    risk = 'medium';
  }

  return { hasRainstorm, weather, risk };
}
```

---

## 📞 官方联系方式

### 需要的对口部门

| 部门 | 官网 | 数据申请 |
|-----|------|--------|
| 水利部 | http://www.mwr.gov.cn/ | 向部办公室提交申请 |
| 气象部 | http://www.cma.gov.cn/ | 向部服务处提交申请 |
| 应急部 | http://www.mem.gov.cn/ | 向应急信息科提交申请 |
| 天津水务局 | https://swj.tj.gov.cn/ | 防汛办或水文处 |
| 天津应急 | https://yjglj.tj.gov.cn/ | 公共服务科 |
| 天津气象 | https://tj.cma.gov.cn/ | 气象服务部 |

### 快速查询电话
```
全国客服：114
天津市长热线：12345
应急管理部：010-123xxxx
水利部：010-123xxxx
气象部门：12121
```

---

## 🔐 关键提示

### ⚠️ 安全和法律注意事项

```
✅ 允许：
  - 使用免费 API 进行非商业应用
  - 在经过授权的范围内使用官方数据
  - 用于防灾减灾和公众安全

❌ 禁止：
  - 将 API 密钥暴露在前端代码
  - 转卖或转移数据给第三方
  - 用于商业竞争
  - 违反数据保密协议

📋 合规建议：
  1. 在后端调用 API，而非前端直接调用
  2. 实施严格的访问控制
  3. 定期审计数据使用情况
  4. 保存相关的授权文档
```

---

## 📁 文档导航

本调研包含以下详细文档：

| 文档 | 内容 | 阅读时间 |
|-----|------|--------|
| **TIANJIN_FLOOD_API_RESEARCH.md** | 完整调研报告 | 30分钟 |
| **QWEATHER_API_INTEGRATION_GUIDE.md** | 和风天气详细指南 | 20分钟 |
| **AMAP_WEATHER_API_GUIDE.md** | 高德地图详细指南 | 20分钟 |
| **OFFICIAL_GOVERNMENT_API_GUIDE.md** | 官方部门 API 指南 | 45分钟 |
| **FLOOD_API_IMPLEMENTATION_PLAN.md** | 实施计划和代码 | 30分钟 |

---

## ✅ 立即行动清单

### 今天就能做

- [ ] 访问 https://dev.qweather.com/ 注册和风天气
- [ ] 访问 https://console.amap.com/ 注册高德地图
- [ ] 获取两个 API Keys
- [ ] 在项目 `.env` 文件中配置

### 明天做

- [ ] 查看 `QWEATHER_API_INTEGRATION_GUIDE.md`
- [ ] 查看 `AMAP_WEATHER_API_GUIDE.md`
- [ ] 开始代码集成

### 本周做

- [ ] 完成基础集成
- [ ] 测试数据加载
- [ ] 部署到开发环境

### 下周做

- [ ] 准备官方部门申请材料
- [ ] 制定长期融合方案

---

## 💡 关键要点总结

1. **没有直接的积涝 API**
   - 中国暂无国家级实时积涝监测开放 API
   - 积涝数据主要由城市排水部门内部使用

2. **可用的替代方案**
   - ✅ 暴雨预警（和风天气、高德、气象局）
   - ✅ 实时降水量（和风天气、高德）
   - ✅ 官方防洪数据（水利部、地方水务局）
   - ✅ 应急预警（应急管理部、地方应急部门）

3. **推荐的实施路线**
   - **第1步**（2-3天）：使用和风 + 高德 API
   - **第2步**（2-4周）：申请官方部门数据
   - **第3步**（持续）：优化融合算法

4. **关键成功因素**
   - 快速启动：不等待官方审批
   - 逐步优化：持续完善数据质量
   - 法规合规：遵守数据使用协议

---

## 🎓 扩展阅读

- [和风天气官方文档](https://dev.qweather.com/docs/api/)
- [高德地图官方文档](https://lbs.amap.com/api/webservice/guide/api/weatherinfo/)
- [中国气象部预警平台](http://www.nmc.cn/publish/alarm/)
- [水利部水情服务](http://www.hydroinfo.gov.cn/)

---

**最后更新**：2026年5月17日  
**下次推荐更新**：完成第一阶段集成后  
**维护责任**：天津交通气象哨兵项目团队
