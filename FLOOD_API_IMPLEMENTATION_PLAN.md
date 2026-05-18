# 天津积涝防洪预警API快速集成实施计划

## 🎯 目标

在你的"天津交通气象哨兵"项目中集成真实的积涝、防洪、水位监测API数据，替代或补充现有的模拟数据。

---

## ⚡ 第一阶段：快速集成（2-3天，无需官方申请）

### 方案选择：使用**和风天气 API** + **高德地图 API**

**原因：**
- ✅ 无需复杂审批流程
- ✅ 免费版本足够项目使用
- ✅ 数据实时性强
- ✅ 接口文档完整
- ✅ 已在类似项目中验证

---

### Step 1：注册获取API密钥（1小时）

#### 1.1 和风天气 QWeather

```bash
# 操作步骤：
1. 访问 https://dev.qweather.com/
2. 点击 "免费注册"
3. 验证邮箱
4. 创建应用 → 获取 API Key（例：xxx123abc）
5. 复制 Key 值

# 预期结果：
API_KEY_QWEATHER = "xxx123abc"
```

#### 1.2 高德地图 Amap

```bash
# 操作步骤：
1. 访问 https://console.amap.com/
2. 注册或登录账户
3. "应用管理" → "创建新应用"
4. 应用类型选 "Web应用"
5. 启用 "Web服务 API"
6. 获得 Key（例：xxx456def）
7. 复制 Key 值

# 预期结果：
API_KEY_AMAP = "xxx456def"
```

---

### Step 2：配置环境变量（10分钟）

#### 2.1 在项目根目录创建 `.env` 文件

```bash
# 编辑 /天津交通气象哨兵/.env

VITE_QWEATHER_API_KEY=你的和风天气API密钥
VITE_QWEATHER_LOCATION=tianjin

VITE_AMAP_API_KEY=你的高德地图API密钥
VITE_AMAP_LOCATION=120100
```

#### 2.2 更新 `tsconfig.json`（如需）

确保 TypeScript 能读取环境变量：

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

---

### Step 3：创建新的 API 服务集成（30分钟）

#### 3.1 创建或更新 `src/services/realFloodDataService.ts`

```typescript
// src/services/realFloodDataService.ts

import { getCachedValue } from './cacheService';

const QWEATHER_API_KEY = import.meta.env.VITE_QWEATHER_API_KEY || '';
const AMAP_API_KEY = import.meta.env.VITE_AMAP_API_KEY || '';

// ==================== 类型定义 ====================

export interface FloodRiskAssessment {
  location: string;
  district: string;
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  confidence: number; // 0-1
  rainfall: number; // mm
  weather: string;
  updateTime: string;
  source: 'qweather' | 'amap' | 'combined';
  rawData?: any;
}

// ==================== 和风天气集成 ====================

export async function getQWeatherWarnings(location: string = 'tianjin'): Promise<any> {
  return getCachedValue(
    `flood:warnings:qweather:${location}`,
    async () => {
      if (!QWEATHER_API_KEY) {
        console.warn('QWeather API Key 未配置');
        return null;
      }

      try {
        const url = new URL('https://api.qweather.com/v7/warning/now');
        url.searchParams.append('location', location);
        url.searchParams.append('key', QWEATHER_API_KEY);
        url.searchParams.append('lang', 'zh');

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.code !== '200') {
          console.warn(`QWeather 返回错误: ${data.msg}`);
          return null;
        }

        return data;
      } catch (error) {
        console.error('QWeather API 调用失败:', error);
        return null;
      }
    },
    {
      ttlMs: 10 * 60 * 1000, // 10分钟缓存
      refreshAheadMs: 2 * 60 * 1000
    }
  );
}

export async function getQWeatherNow(location: string = 'tianjin'): Promise<any> {
  return getCachedValue(
    `flood:weather:qweather:${location}`,
    async () => {
      if (!QWEATHER_API_KEY) return null;

      try {
        const url = new URL('https://api.qweather.com/v7/weather/now');
        url.searchParams.append('location', location);
        url.searchParams.append('key', QWEATHER_API_KEY);
        url.searchParams.append('lang', 'zh');

        const response = await fetch(url.toString());
        const data = await response.json();

        return data.code === '200' ? data : null;
      } catch (error) {
        console.error('QWeather 实时天气获取失败:', error);
        return null;
      }
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

// ==================== 高德地图集成 ====================

export async function getAmapWeather(cityCode: string = '120100'): Promise<any> {
  return getCachedValue(
    `flood:weather:amap:${cityCode}`,
    async () => {
      if (!AMAP_API_KEY) {
        console.warn('Amap API Key 未配置');
        return null;
      }

      try {
        const url = new URL('https://restapi.amap.com/v3/weather/weatherInfo');
        url.searchParams.append('city', cityCode);
        url.searchParams.append('key', AMAP_API_KEY);
        url.searchParams.append('extensions', 'all');

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== '1') {
          console.warn(`Amap 返回错误: ${data.info}`);
          return null;
        }

        return data;
      } catch (error) {
        console.error('Amap 天气获取失败:', error);
        return null;
      }
    },
    { ttlMs: 60 * 60 * 1000 } // 1小时缓存
  );
}

// ==================== 风险评估算法 ====================

const QWEATHER_WARNING_RISK_MAP: Record<string, 'high' | 'medium' | 'low'> = {
  '4': 'high',   // 红色
  '3': 'high',   // 橙色
  '2': 'medium', // 黄色
  '1': 'low'     // 蓝色
};

const AMAP_WEATHER_RISK_MAP: Record<string, 'high' | 'medium' | 'low' | 'none'> = {
  '晴': 'none',
  '小雨': 'low',
  '中雨': 'medium',
  '大雨': 'high',
  '暴雨': 'high',
  '大暴雨': 'high'
};

export async function assessFloodRisk(
  location: string = 'tianjin',
  cityCode: string = '120100'
): Promise<FloodRiskAssessment> {
  const results = await Promise.all([
    getQWeatherWarnings(location),
    getQWeatherNow(location),
    getAmapWeather(cityCode)
  ]);

  const [qWarnings, qNow, amapData] = results;

  let riskLevel: 'high' | 'medium' | 'low' | 'none' = 'none';
  let confidence = 0;
  let rainfall = 0;
  let weather = '未知';
  let source: 'qweather' | 'amap' | 'combined' = 'combined';

  // 优先使用和风天气预警
  if (qWarnings?.warning && qWarnings.warning.length > 0) {
    const rainstorm = qWarnings.warning.find(
      (w: any) => w.type === '12' || w.type === '2' || w.type === '10'
    );

    if (rainstorm) {
      riskLevel = QWEATHER_WARNING_RISK_MAP[rainstorm.level] || 'medium';
      confidence = 0.95;
      source = 'qweather';
      weather = rainstorm.typeName;
    }
  }

  // 获取实时降水量
  if (qNow?.now?.precip) {
    rainfall = parseFloat(qNow.now.precip);

    // 根据降水量调整风险等级
    if (rainfall > 50) {
      riskLevel = 'high';
      confidence = Math.max(confidence, 0.85);
    } else if (rainfall > 25) {
      if (riskLevel !== 'high') riskLevel = 'medium';
      confidence = Math.max(confidence, 0.75);
    }

    weather = qNow.now.text;
  }

  // 补充高德地图数据
  if (amapData?.lives?.[0]) {
    const amapWeather = amapData.lives[0].weather;
    const amapRisk = AMAP_WEATHER_RISK_MAP[amapWeather] || 'none';

    // 如果Amap数据也表示高风险，提高置信度
    if (amapRisk === 'high' && riskLevel !== 'high') {
      riskLevel = 'high';
      confidence = Math.min(0.95, confidence + 0.1);
    }
  }

  return {
    location,
    district: '天津市',
    riskLevel,
    confidence,
    rainfall,
    weather,
    updateTime: new Date().toISOString(),
    source
  };
}

// ==================== 批量获取各区数据 ====================

const DISTRICT_MAP = {
  '和平区': '120101',
  '河东区': '120102',
  '河西区': '120103',
  '南开区': '120104',
  '河北区': '120105',
  '红桥区': '120106',
  '北辰区': '120107',
  '武清区': '120108',
  '西青区': '120109',
  '津南区': '120110',
  '东丽区': '120111',
  '宁河区': '120112',
  '静海区': '120113',
  '宝坻区': '120114',
  '蓟州区': '120115',
  '滨海新区': '120116'
};

export async function getAllDistrictsFloodRisk(): Promise<Map<string, FloodRiskAssessment>> {
  const results = new Map<string, FloodRiskAssessment>();

  // 批量获取，限制并发数避免API限流
  const entries = Object.entries(DISTRICT_MAP);
  const batchSize = 3;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const promises = batch.map(([district, code]) =>
      assessFloodRisk('tianjin', code)
        .then(risk => [district, risk] as [string, FloodRiskAssessment])
        .catch(err => {
          console.error(`获取 ${district} 数据失败:`, err);
          return null;
        })
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach(result => {
      if (result) {
        results.set(result[0], result[1]);
      }
    });

    // 批次间隔，避免频率限制
    if (i + batchSize < entries.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

// ==================== 导出为FloodWarning格式 ====================

export interface FloodWarning {
  id: string;
  name: string;
  district: string;
  severity: 'high' | 'medium' | 'low';
  depth: number;
  predictedDepth: number;
  lat: number;
  lng: number;
  lastUpdate: string;
  description: string;
}

// 地区中心坐标
const DISTRICT_COORDS: Record<string, [number, number]> = {
  '和平区': [39.1176, 117.1956],
  '河东区': [39.1284, 117.2495],
  '河西区': [39.0983, 117.2119],
  '南开区': [39.1382, 117.1508],
  '河北区': [39.1483, 117.1960],
  '红桥区': [39.1672, 117.1518],
  '滨海新区': [39.0160, 117.7060],
  '东丽区': [39.0861, 117.3140],
  '西青区': [39.1408, 117.0086],
  '津南区': [38.9380, 117.3549],
  '北辰区': [39.2241, 117.1322],
  '武清区': [39.3844, 117.0442],
  '宝坻区': [39.7175, 117.3091],
  '宁河区': [39.3302, 117.8260],
  '静海区': [38.9470, 116.9738],
  '蓟州区': [40.0460, 117.4076]
};

export async function convertToFloodWarnings(): Promise<FloodWarning[]> {
  const risks = await getAllDistrictsFloodRisk();
  const warnings: FloodWarning[] = [];

  let id = 1;
  risks.forEach((risk, district) => {
    const coords = DISTRICT_COORDS[district] || [39.1176, 117.1956];

    if (risk.riskLevel !== 'none') {
      warnings.push({
        id: `real_${id++}`,
        name: `${district} 积涝预警`,
        district,
        severity: risk.riskLevel,
        depth: risk.rainfall,
        predictedDepth: risk.rainfall * 1.5,
        lat: coords[0],
        lng: coords[1],
        lastUpdate: risk.updateTime,
        description: `${risk.weather} - 风险等级: ${risk.riskLevel} (数据源: ${risk.source})`
      });
    }
  });

  return warnings;
}
```

#### 3.2 更新 `src/views/FloodView.tsx` 使用新数据

```typescript
// 在 FloodView.tsx 中修改 useEffect：

import { convertToFloodWarnings } from '../services/realFloodDataService';

useEffect(() => {
  const loadFloodData = async () => {
    setLoading(true);
    try {
      // 优先尝试真实API数据
      const realWarnings = await convertToFloodWarnings();
      
      if (realWarnings.length > 0) {
        setFloodPoints(realWarnings);
        setLastUpdate(new Date().toLocaleString('zh-CN'));
      } else {
        // 无真实数据时降级到模拟数据
        setFloodPoints(FALLBACK_FLOOD_POINTS);
        console.info('使用本地数据 (API 不可用)');
      }
    } catch (error) {
      console.error('加载积涝数据失败:', error);
      setFloodPoints(FALLBACK_FLOOD_POINTS);
      setError('数据加载失败，使用本地数据');
    } finally {
      setLoading(false);
    }
  };

  loadFloodData();
  
  // 每5分钟刷新一次
  const interval = setInterval(loadFloodData, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

---

### Step 4：测试集成（30分钟）

#### 4.1 本地测试

```bash
# 在项目目录运行
npm run dev

# 访问 http://localhost:5173
# 打开浏览器开发者工具 (F12)
# 查看 Console 输出
```

#### 4.2 验证事项

- [ ] API 密钥正确加载
- [ ] 网络请求成功（在 Network 标签查看）
- [ ] 返回数据格式正确
- [ ] 地图显示更新的数据
- [ ] 缓存机制正常工作

#### 4.3 处理常见问题

```
问题1: "API Key 未配置"
解决: 检查 .env 文件是否存在且值正确，重启开发服务器

问题2: 返回 "Access-Control-Allow-Origin" 错误
解决: 配置 Vite 代理（见下文）

问题3: 数据仍为模拟数据
解决: 检查 Console 中的网络请求状态和错误信息
```

---

### Step 5：配置开发服务器代理（如需要）

#### 5.1 更新 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/qweather': {
        target: 'https://api.qweather.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qweather/, '/v7')
      },
      '/api/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/amap/, '/v3')
      }
    }
  }
});
```

#### 5.2 修改服务调用使用代理

```typescript
// 在 realFloodDataService.ts 中修改 URL：

// 开发环境使用代理
const isProduction = import.meta.env.PROD;
const QWEATHER_URL = isProduction 
  ? 'https://api.qweather.com/v7/warning/now'
  : '/api/qweather/warning/now';

const AMAP_URL = isProduction
  ? 'https://restapi.amap.com/v3/weather/weatherInfo'
  : '/api/amap/weather/weatherInfo';
```

---

## 📦 第二阶段：增强功能（3-7天）

### 可选功能集成

#### 功能1：官方数据混合

```typescript
// 集成中国气象部官方预警页面的数据爬取
export async function getChinaMeteorologicalWarnings() {
  // 从 http://www.nmc.cn/publish/alarm/ 爬取数据
}
```

#### 功能2：多数据源权重评分

```typescript
// 当多个API都有数据时，根据权重综合评分
export function weightedFloodRiskAssessment(
  qweatherRisk: FloodRiskAssessment,
  amapRisk: FloodRiskAssessment,
  historicalData?: FloodRiskAssessment
) {
  // 权重: QWeather 40% + Amap 30% + 历史数据 30%
}
```

#### 功能3：预测模型

```typescript
// 基于当前降水和预报，预测未来N小时的积涝风险
export function predictFloodRiskTrend(
  currentWeather: any,
  forecast: any,
  historicalPattern: any
): FloodRiskPrediction[] {
  // 返回未来12小时的风险趋势
}
```

#### 功能4：用户告警订阅

```typescript
// 允许用户订阅高风险地区的实时告警
export function subscribeToFloodAlert(
  userId: string,
  districts: string[],
  riskLevel: 'high' | 'medium'
): Promise<void> {
  // 当该地区达到订阅风险等级时发送通知
}
```

---

## 🚀 第三阶段：官方部门数据对接（2-4周）

### 当第一阶段完成后，进行以下步骤：

```
Step 1: 准备申请材料 (1-2天)
  - 项目演示版本
  - 企业营业执照副本
  - 数据用途说明书

Step 2: 联系官方部门 (1-2天)
  - 邮件或在线申请
  - 列出需要的具体数据字段
  - 说明更新频率要求

Step 3: 数据协议签署 (3-7天)
  - 等待审核
  - 签署保密协议
  - 获取测试 API

Step 4: 技术集成 (3-5天)
  - 集成新API
  - 进行兼容性测试
  - 发布更新版本
```

### 优先级顺序

1. **天津市应急管理部** - 预警信息API
2. **天津市水务局** - 防洪预报和水位数据
3. **中国气象部** - 官方预警数据
4. **水利部** - 全国水文数据

---

## 📊 部署检查清单

### 生产环境前

- [ ] 所有环境变量已配置
- [ ] API 密钥未暴露在代码中
- [ ] 请求超时和重试逻辑完善
- [ ] 缓存策略合理
- [ ] 错误处理和降级方案完整
- [ ] 监控和日志系统配置

### 安全检查

- [ ] 不在前端直接暴露 API 密钥
- [ ] 实现后端代理（可选但推荐）
- [ ] 配置 IP 白名单和 Referer 限制
- [ ] 定期轮换 API 密钥
- [ ] 监控异常 API 调用

---

## 📈 关键性能指标 (KPI)

集成完成后应监测：

| 指标 | 目标 | 监测方式 |
|------|------|--------|
| API 响应时间 | < 2秒 | 浏览器开发工具 |
| 数据准确率 | > 90% | 与官方通报对比 |
| 系统可用性 | > 99% | 监控面板 |
| 缓存命中率 | > 80% | 日志分析 |
| 用户反馈 | 满意度 > 4/5 | 反馈表单 |

---

## 🎓 学习资源

- [和风天气API文档](https://dev.qweather.com/docs/api/)
- [高德地图API文档](https://lbs.amap.com/api/webservice/guide/api/weatherinfo/)
- [Vite环境变量](https://vitejs.dev/guide/env-and-mode)
- [TypeScript异步处理](https://www.typescriptlang.org/docs/handbook/2/async-await.html)

---

## 📝 项目计划甘特图

```
第1周：
  Day 1-2: 注册API并获取密钥 ████
  Day 3-4: 实现服务集成层 ████
  Day 5:   测试和修复问题 ███

第2周：
  Day 1-2: UI 集成和优化 ████
  Day 3-4: 增强功能开发 ████
  Day 5:   部署和性能优化 ███

第3周：
  Day 1-5: 官方部门申请流程 ████████
           (并行)
```

---

## 🆘 故障排查指南

### 常见问题速查表

| 问题 | 症状 | 解决方案 |
|------|------|--------|
| API Key 无效 | 返回 401/403 | 检查.env，重新复制密钥 |
| CORS 错误 | Network 失败 | 配置代理或使用后端 |
| 请求超时 | 超过30秒 | 增加超时时间或检查网络 |
| 数据仍为模拟 | FloodPoints 不变 | 检查 Console 错误信息 |
| 缓存失效 | 数据总是旧的 | 清除浏览器缓存或调整TTL |

---

## ✅ 完成检查表

```
第一阶段完成标准：
- [ ] 和风天气 API 数据成功加载
- [ ] 高德地图 API 数据成功加载
- [ ] 两个数据源融合工作正常
- [ ] 地图显示真实数据
- [ ] 缓存机制正常工作
- [ ] 错误处理完善
- [ ] 没有暴露 API 密钥
- [ ] 开发环境测试通过

第二阶段完成标准：
- [ ] 实现了所有增强功能
- [ ] 性能优化完成
- [ ] 用户反馈积极

第三阶段完成标准：
- [ ] 官方部门数据成功接入
- [ ] 数据融合算法优化
- [ ] 部署到生产环境
```

---

## 🎯 总体时间估计

- **第一阶段**：2-3 天
- **第二阶段**：3-7 天
- **第三阶段**：2-4 周（包括等待审批）

**总计**：7 周左右可以完全整合所有可获取的积涝防洪数据源。

---

## 📞 获得帮助

如在实施过程中遇到问题：

1. 查看本文档其他章节
2. 参考 API 官方文档
3. 在浏览器开发工具查看网络请求
4. 检查 Console 中的错误信息
5. 查阅项目的 README 或 Wiki

---

**下次更新：** 2026年7月（完成第一阶段后）
