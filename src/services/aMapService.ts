import { getCachedValue } from './cacheService';

/**
 * 高德地图 API 服务
 * 用于获取：实时路况、积水预警、交通指数等
 */

export interface TrafficStatus {
  roadId: string;
  roadName: string;
  speed: number; // km/h
  congestionLevel: 'smooth' | 'slow' | 'congested' | 'severely_congested';
  description: string;
}

export interface FloodWarning {
  id: string;
  location: string;
  lat: number;
  lng: number;
  level: 'low' | 'medium' | 'high'; // 低风险、中风险、高风险
  description: string;
  updateTime: string;
}

export interface AmapPlace {
  id: string;
  name: string;
  address: string;
  district: string;
  cityname: string;
  location: { lat: number; lng: number };
  type: string;
}

function getAmapApiKey(): string {
  return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_AMAP_API_KEY || '';
}

async function fetchAmapTextPlaces(params: {
  keywords: string;
  city?: string;
  types?: string;
  offset?: number;
  page?: number;
}): Promise<AmapPlace[]> {
  const apiKey = getAmapApiKey();
  if (!apiKey) return [];

  const cacheKey = `amap:place:${params.city || '天津'}:${params.types || 'any'}:${params.page || 1}:${params.offset || 20}:${params.keywords}`;

  return getCachedValue(
    cacheKey,
    async () => {
      const searchParams = new URLSearchParams({
        keywords: params.keywords,
        city: params.city || '天津',
        citylimit: 'true',
        offset: String(params.offset || 20),
        page: String(params.page || 1),
        key: apiKey,
        extensions: 'base',
      });

      if (params.types) {
        searchParams.set('types', params.types);
      }

      try {
        const response = await fetch(`/api/amap/v3/place/text?${searchParams.toString()}`);
        const data = await response.json();
        const pois = Array.isArray(data?.pois) ? data.pois : [];

        return pois
          .map((poi: any) => {
            const [lng, lat] = String(poi?.location || '')
              .split(',')
              .map((value: string) => Number(value.trim()));

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            return {
              id: String(poi.id || `${poi.name}-${poi.location}`),
              name: String(poi.name || ''),
              address: String(poi.address || ''),
              district: String(poi.adname || poi.district || ''),
              cityname: String(poi.cityname || params.city || '天津'),
              location: { lat, lng },
              type: String(poi.type || ''),
            } satisfies AmapPlace;
          })
          .filter(Boolean) as AmapPlace[];
      } catch (error) {
        console.error('高德地点搜索失败:', error);
        return [];
      }
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}

/**
 * 获取城市交通指数
 * 需要配置 VITE_AMAP_API_KEY
 */
export async function fetchTrafficIndex(city: string = '天津'): Promise<{
  index: number; // 0-10
  level: string; // 畅通、缓行、拥堵、严重拥堵
  description: string;
}> {
  return getCachedValue(
    `traffic:index:${city}`,
    async () => {
      const apiKey = getAmapApiKey();
      if (!apiKey) {
        return {
          index: 5,
          level: '中等',
          description: '未配置高德地图 API Key',
        };
      }

      try {
        const response = await fetch(
          `/api/amap/v1/traffic/status?city=${encodeURIComponent(city)}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === '1' && data.trafficinfo) {
          const items = data.trafficinfo;
          const avgSpeed = items.reduce((sum: number, item: any) => sum + (item.speed || 0), 0) / items.length;

          let level = '畅通';
          let index = 1;
          if (avgSpeed < 10) {
            level = '严重拥堵';
            index = 9;
          } else if (avgSpeed < 20) {
            level = '拥堵';
            index = 7;
          } else if (avgSpeed < 30) {
            level = '缓行';
            index = 5;
          }

          return {
            index,
            level,
            description: `平均速度 ${Math.round(avgSpeed)} km/h`,
          };
        }

        return {
          index: 5,
          level: '未知',
          description: '暂无数据',
        };
      } catch (error) {
        console.error('交通指数获取失败:', error);
        return {
          index: 5,
          level: '暂无',
          description: '获取失败',
        };
      }
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}

/**
 * 智能搜索地铁站点
 */
export async function searchMetroStations(lineName: string, city: string = '天津'): Promise<AmapPlace[]> {
  return getCachedValue(
    `metro-search:${city}:${lineName}`,
    async () => {
      const keywords = [
        `${city}${lineName} 地铁站`,
        `${city}${lineName}`,
        `${lineName} 地铁站`,
      ];

      const merged: AmapPlace[] = [];
      for (const keyword of keywords) {
        const pageResults = await Promise.all([
          fetchAmapTextPlaces({ keywords: keyword, city, types: '150700', offset: 25, page: 1 }),
          fetchAmapTextPlaces({ keywords: keyword, city, types: '150700', offset: 25, page: 2 }),
        ]);
        merged.push(...pageResults.flat());
      }

      const seen = new Set<string>();
      return merged
        .filter((place) => /站|地铁|换乘|口/.test(place.name))
        .filter((place) => {
          const key = `${place.name}-${place.location.lat.toFixed(5)}-${place.location.lng.toFixed(5)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}

/**
 * 搜索道路/高速相关 POI
 */
export async function searchRoadPlaces(keyword: string, city: string = '天津'): Promise<AmapPlace[]> {
  const places = await fetchAmapTextPlaces({
    keywords: `${city}${keyword}`,
    city,
    offset: 30,
  });

  return places.filter((place) => /高速|路|桥|立交|收费站|服务区/.test(place.name + place.address));
}

/**
 * 通用智能搜索：站点 / 高速 / 区域 POI
 */
export async function smartSearchPlaces(keyword: string, city: string = '天津'): Promise<AmapPlace[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const [metro, road, mixed] = await Promise.all([
    searchMetroStations(trimmed, city),
    searchRoadPlaces(trimmed, city),
    fetchAmapTextPlaces({ keywords: `${city}${trimmed}`, city, offset: 20 }),
  ]);

  const merged = [...metro, ...road, ...mixed];
  const seen = new Set<string>();

  return merged.filter((item) => {
    const key = `${item.name}-${item.location.lat.toFixed(4)}-${item.location.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 获取实时路况
 */
export async function fetchRealTimeTraffic(bounds?: {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}): Promise<TrafficStatus[]> {
  const bbox = bounds
    ? `${bounds.sw.lng},${bounds.sw.lat},${bounds.ne.lng},${bounds.ne.lat}`
    : '116.8,38.5,117.8,40';

  return getCachedValue(
    `traffic:realtime:${bbox}`,
    async () => {
      const apiKey = getAmapApiKey();
      if (!apiKey) {
        return [];
      }

      try {
        const response = await fetch(
          `/api/amap/v1/traffic/status?bounding=${bbox}&level=4&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === '1' && data.trafficinfo) {
          return data.trafficinfo.map((item: any) => ({
            roadId: item.roadId,
            roadName: item.name,
            speed: item.speed || 0,
            congestionLevel: getCongestionLevel(item.speed),
            description: item.direction || '未知方向',
          }));
        }

        return [];
      } catch (error) {
        console.error('实时路况获取失败:', error);
        return [];
      }
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}

/**
 * 获取积水预警
 * 暂时使用模拟数据，后续可接入高德或官方数据
 */
export async function fetchFloodWarnings(district?: string): Promise<FloodWarning[]> {
  // 模拟数据 - 实际环境应从高德或天津防办获取
  const mockWarnings: FloodWarning[] = [
    {
      id: 'flood-1',
      location: '河西区德国风情街',
      lat: 39.0983,
      lng: 117.1989,
      level: 'low',
      description: '历史易积水点，当前水位正常',
      updateTime: new Date().toISOString(),
    },
    {
      id: 'flood-2',
      location: '东丽区华明立交',
      lat: 39.0861,
      lng: 117.3140,
      level: 'medium',
      description: '近期降雨后易积水，建议绕行',
      updateTime: new Date().toISOString(),
    },
  ];

  return mockWarnings;
}

/**
 * 获取高速路况
 */
export async function fetchExpressWayStatus(): Promise<TrafficStatus[]> {
  const apiKey = getAmapApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    // 京哈高速、秦滨高速、津滨高速等天津主要高速范围
    const highways = [
      { name: '京哈高速', bounds: '117.3,39.2,117.5,40.0' },
      { name: '秦滨高速', bounds: '116.9,38.8,117.1,39.2' },
      { name: '津滨高速', bounds: '117.0,39.0,117.8,39.2' },
    ];

    const allStatus: TrafficStatus[] = [];

    for (const hw of highways) {
      try {
        const response = await fetch(
          `/api/amap/v1/traffic/status?bounding=${hw.bounds}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === '1' && data.trafficinfo) {
          const status = data.trafficinfo.map((item: any) => ({
            roadId: item.roadId,
            roadName: hw.name,
            speed: item.speed || 0,
            congestionLevel: getCongestionLevel(item.speed),
            description: item.direction || '',
          }));
          allStatus.push(...status);
        }
      } catch (e) {
        console.error(`获取 ${hw.name} 失败:`, e);
      }
    }

    return allStatus;
  } catch (error) {
    console.error('高速路况获取失败:', error);
    return [];
  }
}

/**
 * 根据速度判断拥堵程度
 */
function getCongestionLevel(
  speed: number
): 'smooth' | 'slow' | 'congested' | 'severely_congested' {
  if (speed >= 40) return 'smooth';
  if (speed >= 25) return 'slow';
  if (speed >= 10) return 'congested';
  return 'severely_congested';
}

/**
 * 获取拥堵等级的中文描述
 */
export function getCongestionText(level: string): string {
  const map: Record<string, string> = {
    smooth: '畅通',
    slow: '缓行',
    congested: '拥堵',
    severely_congested: '严重拥堵',
  };
  return map[level] || '未知';
}

/**
 * 获取拥堵等级的颜色
 */
export function getCongestionColor(level: string): string {
  const map: Record<string, string> = {
    smooth: '#00b050',
    slow: '#ffb000',
    congested: '#ff6600',
    severely_congested: '#cc0000',
  };
  return map[level] || '#999999';
}
