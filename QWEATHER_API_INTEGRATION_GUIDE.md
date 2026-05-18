# 和风天气 QWeather API 快速集成指南

## 📌 API基本信息

**API提供商：** 和风天气 QWeather  
**官网：** https://www.qweather.com/  
**开发者平台：** https://dev.qweather.com/  
**文档：** https://dev.qweather.com/docs/api/

---

## 🔑 申请步骤

### 第1步：注册账户
```
1. 访问 https://dev.qweather.com/
2. 点击 "免费注册"
3. 填写邮箱、密码、验证码
4. 验证邮箱
```

### 第2步：创建应用
```
1. 登录控制台
2. 导航到 "应用管理" → "创建应用"
3. 应用名称：天津交通气象哨兵
4. 应用类型：选择"服务端应用"
5. 获得 API Key（免费版每日5000次请求）
```

### 第3步：获取位置编码
```
天津市主要区域编码：
- 和平区：12010105
- 河东区：12010102
- 河西区：12010103
- 南开区：12010104
- 河北区：12010107
- 红桥区：12010108
- 滨海新区：12010120
- 东丽区：12010111
- 西青区：12010109
- 津南区：12010112
- 北辰区：12010113
- 武清区：12010114
- 宝坻区：12010115
- 宁河区：12010116
- 静海区：12010117
- 蓟州区：12010118

简化写法（按拼音首字母）：
- "tianjin" (推荐)
- "120100" (地级市编码)
```

---

## 🌧️ 暴雨预警接口详解

### 接口URL
```
https://api.qweather.com/v7/warning/now
```

### 请求方式
```
GET 或 POST
```

### 请求参数

| 参数 | 必需 | 类型 | 说明 | 示例 |
|------|------|------|------|------|
| location | ✅ | string | 城市编码或经纬度 | tianjin 或 120100 |
| key | ✅ | string | API密钥 | xxx123xxx |
| lang | ⚠️ | string | 语言(zh/en) | zh |

### 请求示例

#### JavaScript/TypeScript示例

```typescript
// 方式1：使用城市名或编码
const qWeatherAPI = async (apiKey: string) => {
  const url = new URL('https://api.qweather.com/v7/warning/now');
  url.searchParams.append('location', 'tianjin');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('lang', 'zh');

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
};

// 方式2：使用经纬度
const qWeatherAPIByCoords = async (apiKey: string) => {
  const url = new URL('https://api.qweather.com/v7/warning/now');
  url.searchParams.append('location', '39.0842,117.2010'); // 天津市中心坐标
  url.searchParams.append('key', apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
};
```

#### Python示例
```python
import requests

def get_tianjin_flood_warnings(api_key):
    url = 'https://api.qweather.com/v7/warning/now'
    params = {
        'location': 'tianjin',
        'key': api_key,
        'lang': 'zh'
    }
    response = requests.get(url, params=params)
    return response.json()
```

---

## 📊 返回数据格式

### 成功响应示例

```json
{
  "code": "200",
  "updateTime": "2026-05-17T14:30+08:00",
  "fxLink": "https://www.qweather.com/...",
  "warning": [
    {
      "id": "202605171430001",
      "type": "12",
      "typeName": "暴雨",
      "level": "3",
      "levelName": "橙色",
      "text": "天津市和平区将在12小时内出现强降水，易引发积涝。",
      "startTime": "2026-05-17T14:00+08:00",
      "endTime": "2026-05-17T20:00+08:00",
      "effective": "2026-05-17T14:30+08:00",
      "expire": "2026-05-17T21:00+08:00"
    },
    {
      "id": "202605171430002",
      "type": "14",
      "typeName": "大雾",
      "level": "2",
      "levelName": "黄色",
      "text": "天津市滨海新区将出现能见度降低的大雾。",
      "startTime": "2026-05-18T06:00+08:00",
      "endTime": "2026-05-18T12:00+08:00",
      "effective": "2026-05-17T14:30+08:00",
      "expire": "2026-05-18T14:30+08:00"
    }
  ]
}
```

### 警告类型代码

| 代码 | 中文 | 与积涝的关系 |
|------|------|------------|
| 1 | 台风 | 🔴 高风险 |
| 2 | 暴雨 | 🔴 高风险 |
| 10 | 持续降雨 | 🟡 中风险 |
| 11 | 冰雹 | 🟡 中风险 |
| 14 | 大雾 | ⚪ 低风险 |
| 15 | 冻雨 | ⚪ 低风险 |

### 风险等级映射

| 等级 | 颜色 | 严重程度 |
|------|------|--------|
| 1 | 蓝色 (Blue) | 一般 |
| 2 | 黄色 (Yellow) | 较重 |
| 3 | 橙色 (Orange) | 严重 |
| 4 | 红色 (Red) | 特别严重 |

---

## 💾 降水量实时数据接口

### 获取实时降水量
```
https://api.qweather.com/v7/weather/now
```

### 请求参数
```
location: 天津市位置代码
key: 你的API密钥
```

### 返回示例

```json
{
  "code": "200",
  "updateTime": "2026-05-17T14:35+08:00",
  "now": {
    "obsTime": "2026-05-17T14:35+08:00",
    "temp": "22",
    "feelsLike": "21",
    "icon": "10",
    "text": "小雨",
    "wind360": "180",
    "windDir": "南风",
    "windScale": "3",
    "windSpeed": "15",
    "humidity": "78",
    "precip": "2.5",
    "pressure": "1013",
    "vis": "10",
    "cloud": "50",
    "dew": "18",
    "uvIndex": "2"
  }
}
```

**关键字段解释：**
- `precip`: 降水量 (mm/小时)
  - < 2.5mm/h → 小雨（积涝风险低）
  - 2.5-10mm/h → 中雨（积涝风险中）
  - 10-50mm/h → 大雨（积涝风险高）
  - > 50mm/h → 暴雨（积涝风险极高）

---

## 🔐 API密钥管理

### 环境变量配置

#### .env文件
```
VITE_QWEATHER_API_KEY=your_api_key_here
VITE_QWEATHER_LOCATION=tianjin
```

#### TypeScript中使用
```typescript
const API_KEY = import.meta.env.VITE_QWEATHER_API_KEY || '';
const LOCATION = import.meta.env.VITE_QWEATHER_LOCATION || 'tianjin';
```

#### 安全建议
```
✅ 将API密钥存在环境变量中
✅ 在后端调用API（Node.js/Express）
✅ 前端通过后端代理调用
✅ 定期轮换API密钥
❌ 不要在前端直接暴露API密钥
❌ 不要将密钥提交到Git仓库
```

---

## 📈 与积涝预警的映射关系

### 算法：预测积涝风险

```typescript
interface FloodRiskPrediction {
  location: string;
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  confidence: number; // 0-1
  factors: {
    rainWarning: boolean;      // 是否有暴雨预警
    rainfall: number;           // 当前降水量 mm/h
    forecastRainfall: number;   // 预测降水量
    historicalRiskPoints: number; // 该区域历史积涝点数
  };
}

function predictFloodRisk(qWeatherData: any, historicalSpots: Point[]): FloodRiskPrediction {
  let riskScore = 0;
  const factors = {
    rainWarning: false,
    rainfall: qWeatherData.now.precip || 0,
    forecastRainfall: 0,
    historicalRiskPoints: 0
  };

  // 检查暴雨预警 (权重40%)
  const rainstorm = qWeatherData.warning?.find((w: any) => w.type === '2');
  if (rainstorm) {
    factors.rainWarning = true;
    riskScore += (5 - parseInt(rainstorm.level)) * 10; // 红色=40, 蓝色=10
  }

  // 检查当前降水量 (权重30%)
  if (factors.rainfall > 50) {
    riskScore += 30; // 暴雨
  } else if (factors.rainfall > 25) {
    riskScore += 20; // 大雨
  } else if (factors.rainfall > 10) {
    riskScore += 10; // 中雨
  }

  // 历史积涝点 (权重30%)
  factors.historicalRiskPoints = historicalSpots.length;
  if (historicalSpots.length > 5) {
    riskScore += 20;
  } else if (historicalSpots.length > 0) {
    riskScore += 10;
  }

  const riskLevel = 
    riskScore >= 50 ? 'high' :
    riskScore >= 30 ? 'medium' :
    riskScore >= 10 ? 'low' :
    'none';

  return {
    location: qWeatherData.location,
    riskLevel,
    confidence: Math.min(riskScore / 60, 1), // 正规化到0-1
    factors
  };
}
```

---

## ⚙️ 与现有项目集成

### 修改 `floodWarningService.ts`

```typescript
import { getCachedValue } from './cacheService';

const QWEATHER_API_KEY = import.meta.env.VITE_QWEATHER_API_KEY || '';

export async function fetchFloodWarningsFromQWeather(): Promise<FloodWarning[]> {
  if (!QWEATHER_API_KEY) {
    console.warn('QWeather API Key未配置');
    return [];
  }

  try {
    // 获取暴雨预警
    const warningRes = await fetch(
      `https://api.qweather.com/v7/warning/now?location=tianjin&key=${QWEATHER_API_KEY}&lang=zh`
    );
    const warningData = await warningRes.json();

    // 获取实时降水量
    const weatherRes = await fetch(
      `https://api.qweather.com/v7/weather/now?location=tianjin&key=${QWEATHER_API_KEY}&lang=zh`
    );
    const weatherData = await weatherRes.json();

    // 转换为FloodWarning格式
    const floods: FloodWarning[] = [];
    
    if (warningData.warning) {
      warningData.warning.forEach((warning: any) => {
        if (warning.type === '12' || warning.type === '10') { // 暴雨或持续降雨
          const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
            '4': 'high',
            '3': 'high',
            '2': 'medium',
            '1': 'low'
          };

          floods.push({
            id: warning.id,
            name: warning.typeName,
            district: '天津市',
            severity: severityMap[warning.level] || 'medium',
            depth: weatherData.now?.precip || 0,
            predictedDepth: weatherData.now?.precip ? weatherData.now.precip * 2 : 0,
            lat: 39.0842,
            lng: 117.2010,
            lastUpdate: warning.updateTime,
            description: warning.text
          });
        }
      });
    }

    return floods;
  } catch (error) {
    console.error('QWeather API错误:', error);
    return [];
  }
}
```

---

## 💰 付费计划对比

| 功能 | 免费版 | 付费版 |
|------|--------|--------|
| 日请求数 | 5,000 | 100,000+ |
| 预警数据 | ✅ | ✅ |
| 天气数据 | ✅ | ✅ |
| 历史数据 | ❌ | ✅ |
| 技术支持 | 社区 | 专业支持 |
| 价格 | 免费 | ¥99/月起 |

---

## 🐛 常见问题

### 问题1：跨域问题 (CORS)
```
错误：Access-Control-Allow-Origin
原因：浏览器安全策略
解决方案：
1. 使用代理服务器
2. 在后端调用API后返回给前端
3. 配置Vite代理 (vite.config.ts)
```

### 问题2：API密钥无效
```
错误：code: "401"
原因：密钥错误、过期或已禁用
解决方案：
1. 检查.env文件中的密钥
2. 登录控制台确认密钥有效
3. 重新生成新密钥
```

### 问题3：请求次数超限
```
错误：code: "429"
原因：超过免费版日限（5000次）
解决方案：
1. 增加缓存时间
2. 升级到付费版
3. 减少请求频率
```

---

## 📚 参考资源

- 官方文档：https://dev.qweather.com/docs/api/
- 控制台：https://console.qweather.com/
- 天气代码表：https://dev.qweather.com/docs/start/icons/
- 城市编码查询：https://dev.qweather.com/docs/api/geoapi/city-lookup/
