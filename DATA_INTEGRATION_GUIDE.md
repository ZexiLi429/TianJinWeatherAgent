# 实时数据集成指南

## 已创建的数据服务

### 1. **高德地图 API 服务** (`aMapService.ts`)
提供实时路况、交通指数、积水预警等数据

**功能：**
- `fetchTrafficIndex()` - 获取城市交通指数
- `fetchRealTimeTraffic()` - 获取实时路况
- `fetchFloodWarnings()` - 获取积水预警信息
- `fetchExpressWayStatus()` - 获取高速路况

**使用示例：**
```tsx
import { fetchTrafficIndex, getCongestionText } from '../services/aMapService';

const index = await fetchTrafficIndex('天津');
console.log(`交通指数：${index.level} - ${getCongestionText(index.level)}`);
```

### 2. **中国气象局生态服务** (`ecologyService.ts`)
提供花粉、紫外线、舒适度等生态指标

**功能：**
- `fetchPollenIndex()` - 获取花粉指数
- `fetchUVIndex()` - 获取紫外线指数
- `fetchComfortIndex()` - 计算舒适度
- `fetchEcologyScore()` - 综合生态评分

**使用示例：**
```tsx
import { fetchPollenIndex, fetchUVIndex } from '../services/ecologyService';

const [pollen, uv] = await Promise.all([
  fetchPollenIndex(),
  fetchUVIndex()
]);

console.log(`花粉：${pollen.levelText}`);
console.log(`紫外线：${uv.levelText}`);
```

### 3. **实时交互地图** (`RealtimeMapView.tsx`)
展示地铁、高速、积水、花粉、UV 等在地图上的分布

**特性：**
- ✅ 实时地铁线路显示
- ✅ 交通拥堵热力图
- ✅ 积水预警标注
- ✅ 花粉/UV 分布指标
- ✅ 点击地图显示详细信息
- ✅ 过滤器切换显示内容

---

## 快速集成步骤

### 第一步：配置 API Key

编辑 `.env` 文件（复制自 `.env.example`）：

```bash
# 高德地图 API Key（必需用于路况数据）
# 申请地址：https://lbs.amap.com/api/webservice/guide/create-project/api-key
VITE_AMAP_API_KEY="你的高德地图API_Key"

# 其他 API Key（可选）
VITE_GEMINI_API_KEY="你的Gemini_Key"
VITE_GLM_API_KEY="你的GLM_Key"
VITE_PREFER_GLM="false"
```

**获取高德地图 API Key：**
1. 访问 https://lbs.amap.com/api/webservice/
2. 注册/登录高德账号
3. 创建应用，获取 Web 服务 API Key
4. 复制 Key 到 `.env` 文件

### 第二步：在你的视图中使用数据

#### 示例 1：在交通视图添加实时路况

```tsx
// TrafficView.tsx
import { useEffect, useState } from 'react';
import { fetchRealTimeTraffic, getCongestionText } from '../services/aMapService';

export default function TrafficView() {
  const [traffic, setTraffic] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await fetchRealTimeTraffic();
      setTraffic(data);
    })();
  }, []);

  return (
    <div>
      {traffic.map(item => (
        <div key={item.roadId} className="p-3 border rounded mb-2">
          <p className="font-semibold">{item.roadName}</p>
          <p className="text-sm">
            速度: {item.speed} km/h - {getCongestionText(item.congestionLevel)}
          </p>
        </div>
      ))}
    </div>
  );
}
```

#### 示例 2：在健康视图添加花粉警示

```tsx
// HealthView.tsx
import { useEffect, useState } from 'react';
import { fetchPollenIndex } from '../services/ecologyService';

export default function HealthView() {
  const [pollen, setPollen] = useState(null);

  useEffect(() => {
    fetchPollenIndex().then(setPollen);
  }, []);

  return (
    <div>
      {pollen && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900">花粉指数：{pollen.levelText}</h3>
          <p className="text-sm text-yellow-800 mt-2">
            主要花粉：{pollen.mainPollen}
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            💡 {pollen.advise}
          </p>
        </div>
      )}
    </div>
  );
}
```

#### 示例 3：在主页添加交通指数卡片

```tsx
// WeatherHome.tsx
import { fetchTrafficIndex } from '../services/aMapService';

export default function WeatherHome() {
  const [trafficIndex, setTrafficIndex] = useState(null);

  useEffect(() => {
    fetchTrafficIndex('天津').then(setTrafficIndex);
  }, []);

  return (
    <div>
      {trafficIndex && (
        <div className="p-4 bg-surface-variant rounded-lg">
          <h4 className="font-semibold">交通指数</h4>
          <p className="text-2xl font-bold text-primary">
            {trafficIndex.index}/10
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            {trafficIndex.level} - {trafficIndex.description}
          </p>
        </div>
      )}
    </div>
  );
}
```

### 第三步：使用实时地图视图

在 `App.tsx` 中添加实时地图路由：

```tsx
import RealtimeMapView from './views/RealtimeMapView';

// 在 ViewType 中添加
export type ViewType = 'weather' | 'map' | ... | 'realtime-map';

// 在 renderView() 中添加
case 'realtime-map':
  return <RealtimeMapView onBack={() => setActiveView('weather')} />;

// 在导航菜单中添加
<button onClick={() => handleNavigate('realtime-map')}>
  实时地图
</button>
```

---

## 数据源对应关系

| 功能 | 数据源 | API | 无需Key | 备注 |
|------|--------|-----|--------|------|
| 实时路况 | 高德地图 | Traffic API | ❌ | 需要注册 Key |
| 交通指数 | 高德地图 | Traffic Index | ❌ | 需要 Key |
| 积水预警 | 模拟数据 | - | ✅ | 建议后续接入官方API |
| 花粉指数 | 中国气象局 | REST API | ✅ | 无需 Key，支持爬虫 |
| 紫外线指数 | 中国气象局 | REST API | ✅ | 无需 Key |
| 舒适度指数 | 本地计算 | - | ✅ | 基于温湿风综合计算 |
| 地铁线路 | 静态数据 | - | ✅ | 可自维护更新 |

---

## 地图交互特性

### 点击地图上的标记查看详情

- **交通点**：显示路段名称、速度、拥堵程度
- **积水点**：显示风险等级、历史信息
- **花粉/UV**：显示等级、建议

### 过滤器

点击顶部按钮快速切换显示内容：

- 🚗 路况 - 显示实时交通拥堵
- 🚇 地铁 - 显示地铁线路
- 💧 积水 - 显示易积水点
- 🌼 花粉 - 显示花粉浓度
- ☀️ UV - 显示紫外线指数

---

## 常见问题

### Q: 高德地图 API Key 申请要多久？
A: 通常即时生成，可直接使用。注意需要在高德账号中配置应用白名单。

### Q: 没有 API Key 可以测试吗？
A: 可以，大部分功能会返回模拟数据或 fallback 值。但路况数据需要真实 Key。

### Q: 如何更新地铁线路数据？
A: 编辑 `RealtimeMapView.tsx` 中的 `METRO_LINES` 常量，加入新线路坐标即可。

### Q: 积水数据如何来源？
A: 目前为模拟数据。建议后续：
- 联系天津防汛办获取 API
- 使用高德的积水预警功能
- 集成社交媒体实时上报

---

## 下一步建议

1. **配置高德 API Key** 并测试路况功能
2. **在各个视图中逐步集成** 这些数据源
3. **优化地图性能** - 添加数据缓存和更新频率控制
4. **接入官方数据** - 联系相关部门获取积水、地铁等官方数据
5. **用户反馈** - 根据用户反馈调整数据展示优先级

---

## 技术架构

```
App.tsx
├── WeatherHome - 主页 (可集成交通指数卡片)
├── TrafficView - 交通视图 (可集成实时路况)
├── HealthView - 健康视图 (可集成花粉/UV)
├── EcoView - 生态视图 (可集成综合评分)
├── RealtimeMapView - 新增：实时交互地图 (所有数据源)
└── ...

Services/
├── weatherService.ts - 基础天气数据 (Open-Meteo)
├── aiService.ts - AI 对话服务
├── aMapService.ts - 新增：高德地图 API
├── ecologyService.ts - 新增：生态指标数据
└── ...
```

---

**集成完成后，你的应用将展示真实的：**
- ✅ 实时交通路况
- ✅ 花粉/UV 指数
- ✅ 舒适度评估
- ✅ 积水风险预警
- ✅ 地铁/高速线路
- ✅ 交通指数趋势
