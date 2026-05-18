# 高德地图 Amap 天气API 集成指南

## 📌 API基本信息

**API提供商：** 高德地图（Amap）  
**官网：** https://lbs.amap.com/  
**Web服务文档：** https://lbs.amap.com/api/webservice/guide/api/weatherinfo/  
**控制台：** https://console.amap.com/

---

## 🔑 申请和配置步骤

### 第1步：注册高德账户

```
1. 访问 https://lbs.amap.com/
2. 点击 "用户中心" → "注册"
3. 选择账户类型：个人开发者或企业
4. 完成邮箱验证
```

### 第2步：创建应用并获取Key

```
1. 登录 https://console.amap.com/
2. 左侧菜单 → "应用管理" → "我的应用"
3. 点击 "创建新应用"
4. 应用名称：天津交通气象哨兵
5. 应用类型：Web应用
6. 添加API：勾选 "Web服务"
7. 确认生成，获得Key
```

### 第3步：配置API权限

在应用详情中，确保启用以下权限：
- ✅ 天气查询服务
- ✅ 地理编码服务
- ✅ 逆地理编码

---

## 🌧️ 天气查询接口

### 接口地址

```
https://restapi.amap.com/v3/weather/weatherInfo
```

### 请求方式

```
GET 或 POST
```

### 请求参数

| 参数 | 必需 | 类型 | 说明 | 示例 |
|------|------|------|------|------|
| city | ✅ | string | 城市编码或城市名 | 120100（天津） |
| key | ✅ | string | 应用的Key | axxxbxxxcxxxdxxxexxxfxxxgxxx |
| extensions | ⚠️ | string | base=基本信息，all=全部 | all |

### 天津市各区县编码

```
120100 - 天津市（全市）
120101 - 和平区
120102 - 河东区
120103 - 河西区
120104 - 南开区
120105 - 河北区
120106 - 红桥区
120107 - 北辰区
120108 - 武清区
120109 - 西青区
120110 - 津南区
120111 - 东丽区
120112 - 宁河区
120113 - 静海区
120114 - 宝坻区
120115 - 蓟州区
120116 - 滨海新区
```

### 请求示例

#### TypeScript/JavaScript

```typescript
// 获取天津市当前天气
const getAmapWeather = async (apiKey: string, cityCode: string = '120100') => {
  const url = new URL('https://restapi.amap.com/v3/weather/weatherInfo');
  url.searchParams.append('city', cityCode);
  url.searchParams.append('key', apiKey);
  url.searchParams.append('extensions', 'all');

  const response = await fetch(url.toString());
  const data = await response.json();
  return data;
};

// 批量获取所有区的天气
const getAllDistrictsWeather = async (apiKey: string) => {
  const districts = [
    '120101', '120102', '120103', '120104', '120105',
    '120106', '120107', '120108', '120109', '120110',
    '120111', '120112', '120113', '120114', '120115', '120116'
  ];

  const results = await Promise.all(
    districts.map(code => getAmapWeather(apiKey, code))
  );
  
  return results;
};
```

#### Python

```python
import requests

def get_amap_weather(api_key, city_code='120100'):
    url = 'https://restapi.amap.com/v3/weather/weatherInfo'
    params = {
        'city': city_code,
        'key': api_key,
        'extensions': 'all'
    }
    response = requests.get(url, params=params)
    return response.json()

# 使用示例
weather = get_amap_weather('your_api_key', '120100')
print(weather)
```

---

## 📊 返回数据格式

### 成功响应示例

```json
{
  "status": "1",
  "count": "1",
  "info": "OK",
  "infocode": "10000",
  "lives": [
    {
      "province": "天津",
      "city": "天津市",
      "adcode": "120100",
      "weather": "小雨",
      "temperature": "22",
      "winddirection": "180",
      "windpower": "3",
      "humidity": "78",
      "reporttime": "2026-05-17 14:35:00"
    }
  ],
  "forecasts": [
    {
      "city": "天津市",
      "adcode": "120100",
      "province": "天津",
      "reporttime": "2026-05-17 14:35:00",
      "casts": [
        {
          "date": "2026-05-17",
          "week": "6",
          "daytime_code": "10",
          "daytime_weather": "小雨",
          "daytime_temp": "24",
          "daytime_wind_direction": "180",
          "daytime_wind_direction_code": "S",
          "daytime_wind_power": "3",
          "nighttime_code": "10",
          "nighttime_weather": "小雨",
          "nighttime_temp": "18",
          "nighttime_wind_direction": "180",
          "nighttime_wind_direction_code": "S",
          "nighttime_wind_power": "2"
        },
        {
          "date": "2026-05-18",
          "week": "7",
          "daytime_code": "01",
          "daytime_weather": "晴",
          "daytime_temp": "26",
          "daytime_wind_direction": "90",
          "daytime_wind_direction_code": "E",
          "daytime_wind_power": "2",
          "nighttime_code": "01",
          "nighttime_weather": "晴",
          "nighttime_temp": "16",
          "nighttime_wind_direction": "90",
          "nighttime_wind_direction_code": "E",
          "nighttime_wind_power": "1"
        }
      ]
    }
  ]
}
```

### 关键字段解释

#### 实时天气 (lives)
| 字段 | 说明 | 示例 |
|------|------|------|
| weather | 天气状况 | 小雨、大雨、暴雨等 |
| temperature | 温度 | 22 (摄氏度) |
| humidity | 相对湿度 | 78 (%) |
| windpower | 风力等级 | 1-17 |
| reporttime | 更新时间 | 2026-05-17 14:35:00 |

#### 预报天气 (forecasts.casts)
| 字段 | 说明 | 范围 |
|------|------|------|
| date | 预报日期 | YYYY-MM-DD |
| daytime_weather | 白天天气 | 晴、阴、雨等 |
| daytime_temp | 白天温度 | -30～60℃ |
| daytime_wind_power | 白天风力 | 1-17 |
| nighttime_weather | 夜间天气 | 晴、阴、雨等 |
| nighttime_temp | 夜间温度 | -30～60℃ |

### 天气代码对应表

| 代码 | 中文 | 与积涝的关系 |
|------|------|------------|
| 01 | 晴 | ✅ 无风险 |
| 02 | 阴 | ✅ 无风险 |
| 03 | 阴 | ✅ 无风险 |
| 04 | 阴 | ✅ 无风险 |
| 05 | 阴 | ✅ 低风险 |
| 06 | 阴 | ✅ 低风险 |
| 07 | 小雨 | 🟡 低风险 |
| 08 | 中雨 | 🟡 中风险 |
| 09 | 大雨 | 🔴 高风险 |
| 10 | 暴雨 | 🔴 极高风险 |
| 11 | 大暴雨 | 🔴 极高风险 |
| 12 | 特大暴雨 | 🔴 极高风险 |
| 13 | 冰雹 | 🟡 中风险 |
| 14 | 冰雨 | 🟡 中风险 |
| 15 | 雨夹雪 | ✅ 低风险 |
| 16 | 雪 | ✅ 低风险 |

---

## 💾 与积涝预警的关联

### 降雨代码到风险等级的映射

```typescript
interface AmapWeatherData {
  status: string;
  lives: Array<{
    weather: string;
    temperature: string;
    humidity: string;
    reporttime: string;
  }>;
  forecasts: Array<{
    casts: Array<{
      date: string;
      daytime_weather: string;
      daytime_temp: string;
    }>;
  }>;
}

interface FloodRisk {
  district: string;
  currentRisk: 'high' | 'medium' | 'low' | 'none';
  forecastRisk: 'high' | 'medium' | 'low' | 'none';
  currentWeather: string;
  nextDay: string;
}

const WEATHER_RISK_MAP: Record<string, 'high' | 'medium' | 'low' | 'none'> = {
  '晴': 'none',
  '阴': 'none',
  '多云': 'none',
  '小雨': 'low',
  '中雨': 'medium',
  '大雨': 'high',
  '暴雨': 'high',
  '大暴雨': 'high',
  '特大暴雨': 'high',
  '阵雨': 'low',
  '强阵雨': 'medium',
  '雷阵雨': 'medium',
  '强雷阵雨': 'high',
  '冰雹': 'medium',
  '冰雨': 'low',
  '雨夹雪': 'low',
  '雪': 'none',
};

function assessFloodRisk(amapData: AmapWeatherData): FloodRisk {
  const currentWeather = amapData.lives[0]?.weather || '未知';
  const currentRisk = WEATHER_RISK_MAP[currentWeather] || 'none';
  
  const forecast = amapData.forecasts[0]?.casts[0] || {};
  const forecastWeather = forecast.daytime_weather || '未知';
  const forecastRisk = WEATHER_RISK_MAP[forecastWeather] || 'none';

  return {
    district: amapData.lives[0]?.city || '天津',
    currentRisk,
    forecastRisk,
    currentWeather,
    nextDay: forecastWeather
  };
}
```

---

## ⚙️ 在项目中的集成示例

### 修改 `weatherService.ts`

```typescript
import { getCachedValue } from './cacheService';

const AMAP_API_KEY = import.meta.env.VITE_AMAP_API_KEY || '';

interface AmapWeatherResponse {
  status: string;
  info: string;
  infocode: string;
  lives?: Array<{
    weather: string;
    temperature: string;
    humidity: string;
    reporttime: string;
  }>;
}

export async function fetchWeatherFromAmap(cityCode: string = '120100'): Promise<any> {
  return getCachedValue(
    `weather:amap:${cityCode}`,
    async () => {
      if (!AMAP_API_KEY) {
        console.warn('Amap API Key未配置');
        return null;
      }

      try {
        const url = new URL('https://restapi.amap.com/v3/weather/weatherInfo');
        url.searchParams.append('city', cityCode);
        url.searchParams.append('key', AMAP_API_KEY);
        url.searchParams.append('extensions', 'all');

        const response = await fetch(url.toString());
        const data: AmapWeatherResponse = await response.json();

        if (data.status === '1' && data.lives && data.lives.length > 0) {
          return data;
        }
        
        console.warn(`天气查询失败: ${data.info}`);
        return null;
      } catch (error) {
        console.error('Amap天气查询错误:', error);
        return null;
      }
    },
    {
      ttlMs: 60 * 60 * 1000, // 1小时缓存
      refreshAheadMs: 10 * 60 * 1000 // 10分钟预刷新
    }
  );
}

// 批量获取所有区县天气
export async function fetchAllDistrictsWeather() {
  const districtCodes = [
    '120101', '120102', '120103', '120104', '120105',
    '120106', '120107', '120108', '120109', '120110',
    '120111', '120112', '120113', '120114', '120115', '120116'
  ];

  const results = await Promise.all(
    districtCodes.map(code => fetchWeatherFromAmap(code))
  );

  return results.filter(r => r !== null);
}
```

---

## 🔐 API密钥配置

### .env 配置

```
VITE_AMAP_API_KEY=你的高德API密钥
VITE_AMAP_SECURITY_JS_CODE=（可选）安全验证码
```

### 安全建议

```typescript
// ✅ 推荐：在后端或通过代理调用
const response = await fetch('/api/weather/amap', {
  method: 'GET',
  params: { cityCode: '120100' }
});

// ❌ 不推荐：在前端直接暴露API密钥
const unsafeUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=120100&key=${API_KEY}`;
```

### 配置IP白名单

在高德控制台配置安全中心：
1. 应用详情 → 安全中心
2. 添加服务器IP地址到白名单
3. 配置Web端的Referer限制

---

## 📈 更新频率和限制

### 数据更新频率
- **实时天气**：约每小时更新一次
- **预报数据**：每天更新一次（通常早上5点）
- **警告信息**：实时更新（需单独订阅预警服务）

### 请求限制

| 限制项 | 免费版 | 专业版 |
|------|--------|--------|
| 日请求数 | 500万+ | 1000万+ |
| 并发数 | 10QPS | 50QPS |
| 技术支持 | 社区 | 电话+邮件 |
| 价格 | 免费 | ¥1000/年起 |

---

## 🐛 常见问题

### 问题1：返回状态为"0"
```
错误信息：info: "auth failure"
原因：API密钥无效或格式错误
解决方案：
1. 检查密钥是否复制正确
2. 确保已启用Web服务权限
3. 检查IP白名单配置
4. 在控制台重新生成密钥
```

### 问题2：跨域错误(CORS)
```
错误：Access-Control-Allow-Origin missing
原因：浏览器直接调用API受到限制
解决方案：
1. 在后端创建代理端点
2. 使用JSONP回调（如果支持）
3. 配置正确的Referer和IP白名单
```

### 问题3：地区信息不准确
```
错误：返回的区县信息不正确
原因：城市代码使用错误或已更新
解决方案：
1. 使用正确的 adcode（行政区划代码）
2. 参考最新的行政区划编码
3. 联系高德技术支持获取更新
```

### 问题4：请求超时
```
错误：Request timeout
原因：网络延迟或请求过多
解决方案：
1. 增加超时时间设置
2. 使用缓存减少请求
3. 检查网络连接
4. 考虑使用CDN加速
```

---

## 📊 与现有项目的数据融合

### 积涝预警数据综合算法

```typescript
// 综合高德天气 + 和风天气 + 本地积涝点 → 预测风险

interface IntegratedFloodPrediction {
  location: string;
  amapRisk: 'high' | 'medium' | 'low' | 'none';
  qweatherRisk: 'high' | 'medium' | 'low' | 'none';
  combinedRisk: 'high' | 'medium' | 'low' | 'none';
  confidence: number;
}

async function integrateFloodData(cityCode: string): Promise<IntegratedFloodPrediction> {
  // 获取高德数据
  const amapData = await fetchWeatherFromAmap(cityCode);
  const amapRisk = assessAmapWeather(amapData);

  // 获取和风数据
  const qweatherData = await fetchQWeatherWarning();
  const qweatherRisk = assessQWeatherWarning(qweatherData);

  // 综合风险评分
  const combined = (amapRisk === qweatherRisk) ? amapRisk : 
                   (amapRisk === 'high' || qweatherRisk === 'high') ? 'high' :
                   (amapRisk === 'medium' || qweatherRisk === 'medium') ? 'medium' :
                   'low';

  return {
    location: cityCode,
    amapRisk,
    qweatherRisk,
    combinedRisk: combined,
    confidence: 0.85 // 两个独立数据源交叉验证
  };
}
```

---

## 📚 参考资源

- **官方文档**：https://lbs.amap.com/api/webservice/guide/api/weatherinfo/
- **开发者控制台**：https://console.amap.com/
- **API Key管理**：https://console.amap.com/dev/keys
- **行政区划编码**：https://lbs.amap.com/dev/id/newmap
- **天气代码表**：https://lbs.amap.com/api/webservice/gettingstarted
