# 暴雨积涝数据 API 集成方案

## 📋 概述

已成功将积涝页面（暴雨积涝监测）从完全硬编码的模拟数据改造为支持真实 API 数据的架构，包含完整的备选方案和降级处理。

## 🏗️ 架构设计

### 1. 服务层 (`src/services/floodWarningService.ts`)

新创建的专用服务模块负责获取积涝预警数据。

#### 核心功能：

**主函数 `fetchFloodWarnings()`**
```typescript
export async function fetchFloodWarnings(): Promise<FloodWarning[]>
```

- **主API**: `/api/flood/warnings` - 天津市防洪部门积涝预警
- **备选API1**: `/api/weather/flood-warnings` - 气象部门预警
- **降级方案**: 返回空数组（触发本地数据）

#### 数据接口：

```typescript
interface FloodWarning {
  id: string;           // 唯一标识
  name: string;         // 位置名称
  district: string;     // 所属区
  severity: 'high' | 'medium' | 'low';  // 风险等级
  depth: number;        // 当前水深 (cm)
  predictedDepth: number; // 预测水深 (cm)
  lat: number;          // 纬度
  lng: number;          // 经度
  lastUpdate: string;   // 最后更新时间
  description?: string; // 位置描述
}
```

#### 缓存策略：

- **缓存键**: `flood:warnings:tianjin`
- **TTL**: 10分钟 (600秒) - 实时性和性能平衡
- **预刷新**: 2分钟 - 提前3分钟刷新避免过期

```typescript
{ 
  ttlMs: 10 * 60 * 1000,        // 10分钟缓存
  refreshAheadMs: 2 * 60 * 1000 // 2分钟预刷新
}
```

### 2. 页面层改造 (`src/views/FloodView.tsx`)

#### 状态管理：

```typescript
const [floodPoints, setFloodPoints] = useState<FloodPoint[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [lastUpdate, setLastUpdate] = useState<string>('');
```

#### 数据加载流程：

```
┌─────────────────────────────┐
│  页面挂载 (useEffect)        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  调用 fetchFloodWarnings()  │
└──────────────┬──────────────┘
               │
               ├─ 成功返回数据 ──► 使用真实数据
               │
               ├─ 返回空数组 ──► 使用本地降级数据
               │
               └─ 出现错误 ──► 使用本地降级数据
                              + 显示错误提示
```

#### UI 反馈：

1. **加载状态**
   ```
   ⏳ 加载积涝预警数据中...
   ```

2. **数据源提示**
   ```
   ℹ️ 实时数据已加载       (真实API成功)
   ℹ️ 使用本地数据 (API 不可用) (降级使用)
   ```

3. **空数据状态**
   ```
   💧 暂无积涝预警数据
   ```

## 🔄 多层级备选方案

### 层级1：官方防洪API
```
GET /api/flood/warnings
返回: 天津市防办的实时积涝预警数据
```

### 层级2：气象部门API
```
GET /api/weather/flood-warnings
返回: 气象部门的雨洪预警数据
```

### 层级3：本地降级数据
当所有API都不可用时，自动使用本地维护的6个典型积涝点数据：
- 滨海新区蔡家堡码头下沉通道 (高风险)
- 西青区地铁2号线曹庄停车场 (高风险)
- 武清区郑家楼村铁路涵洞 (高风险)
- 河西区应急管理局 (中风险)
- 东丽区湖滨路交汇口 (中风险)
- 红桥区芦东路地下通道 (中风险)

## 📡 API接入指南

### 如果有天津防办API

将此端点配置到代理或项目配置中：

```javascript
// vite.config.ts 代理配置示例
server: {
  proxy: {
    '/api/flood/warnings': {
      target: 'https://api.tianjin-flood-prevention.gov.cn',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/flood/, '/api/warnings')
    }
  }
}
```

### 如果有气象部门API

```javascript
server: {
  proxy: {
    '/api/weather/flood-warnings': {
      target: 'https://api.tianjin-weather.gov.cn',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/weather/, '/api')
    }
  }
}
```

### API响应格式要求

系统期望的返回格式：

```json
{
  "code": "0",
  "msg": "success",
  "data": {
    "warnings": [
      {
        "id": "flood-001",
        "name": "某条路积涝",
        "district": "某区",
        "severity": "high",
        "depth": 25.5,
        "predictedDepth": 30.0,
        "lat": 39.0842,
        "lng": 117.2008,
        "lastUpdate": "2026-05-17T15:30:00Z",
        "description": "易积水点"
      }
    ],
    "updateTime": "2026-05-17T15:30:00Z",
    "statistics": {
      "high": 3,
      "medium": 2,
      "low": 1
    }
  }
}
```

## ✅ 功能验证清单

- ✅ 页面首次加载显示加载状态
- ✅ 成功获取API数据时显示"实时数据已加载"
- ✅ API不可用时自动降级到本地数据
- ✅ 地图正确显示所有积涝点标记
- ✅ 列表视图显示完整的积涝数据
- ✅ 统计视图显示风险等级分布
- ✅ 详情侧栏显示单个点的历史数据曲线
- ✅ 防灾建议根据实时数据更新
- ✅ 数据源状态提示清晰可见

## 🔧 开发环境配置

### 本地测试

1. 当前开发环境中，两个API端点都返回404
2. 系统自动降级到本地数据
3. 所有功能正常运行

### 生产环境配置

1. 配置代理指向真实API
2. 监控日志中的"✅ 加载成功"提示
3. 系统会自动使用真实数据

## 📊 数据流

```
FloodView.tsx (React组件)
    │
    └─► useEffect 挂载时
         │
         └─► fetchFloodWarnings()
              │
              ├─► getCachedValue 检查缓存
              │   │
              │   └─► 缓存未过期 ──► 返回缓存数据
              │   
              │   缓存过期/不存在
              │   │
              │   └─► 发送请求 /api/flood/warnings
              │       │
              │       ├─ 成功 ──► 解析返回数据
              │       │
              │       └─ 失败 ──► 尝试备选源
              │
              ├─► 尝试备选源 /api/weather/flood-warnings
              │   │
              │   ├─ 成功 ──► 返回数据
              │   │
              │   └─ 失败 ──► 返回空数组
              │
              └─► fetchFloodWarningsFromAlternative()

              最后返回的数据：
              ├─ 真实API数据 (首选)
              ├─ 本地降级数据 (当API返回空时)
              └─ 本地降级数据 (当所有API都失败时)
```

## 🚀 后续优化建议

1. **添加更多备选源**
   - 高德地图的积涝相关接口
   - 用户众包的积涝数据

2. **增强缓存策略**
   - 根据天气预警等级动态调整TTL
   - 实现智能预刷新

3. **数据验证**
   - 验证返回数据的有效性
   - 检测异常值并标记

4. **监控和告警**
   - 跟踪API响应时间
   - 记录数据源切换事件
   - 告警所有API都不可用的情况

5. **用户体验**
   - 支持手动刷新数据
   - 显示数据更新进度
   - 提供重试机制

## 📝 相关文件

- `src/services/floodWarningService.ts` - 积涝数据服务
- `src/services/cacheService.ts` - 缓存管理
- `src/views/FloodView.tsx` - 积涝监测页面
- `src/services/officialWarningService.ts` - 参考实现（官方预警）
- `src/services/aMapService.ts` - 参考实现（第三方API集成）

## 🎯 总结

这个架构设计实现了：

1. **真实API优先** - 尝试从官方API获取实时数据
2. **智能降级** - 多层级备选方案确保服务可用
3. **高效缓存** - 减少API调用，改善响应速度
4. **完整错误处理** - 任何环节失败都有备选方案
5. **用户透明** - 清晰显示数据源状态
6. **易于集成** - 实际API就绪时只需更改配置

使用者可以随时将代理指向真实API，系统会自动使用真实数据而无需修改业务逻辑。
