import { getCachedValue } from './cacheService';
import { fetchCurrentWeatherByCoords, weatherCodeToText, CurrentWeather } from './weatherService';
import { fetchRealTimeTraffic, getCongestionText, searchRoadPlaces, TrafficStatus } from './aMapService';

export type HighwayRiskLevel = 'low' | 'medium' | 'high';

export type HighwayPointType = '收费站' | '服务区' | '互通立交' | '桥梁' | '匝道' | '隧道' | '路段点';

export interface HighwayPoint {
  id: string;
  name: string;
  routeName: string;
  routeColor: string;
  type: HighwayPointType;
  lat: number;
  lng: number;
  district: string;
  address: string;
  weather: CurrentWeather;
  trafficText: string;
  trafficSpeed: number | null;
  risk: HighwayRiskLevel;
  riskReasons: string[];
}

export interface HighwayRouteCard {
  id: string;
  routeName: string;
  routeColor: string;
  points: HighwayPoint[];
  trafficText: string;
  risk: HighwayRiskLevel;
  floodWatchPoints: HighwayPoint[];
  accidentTips: string[];
}

export interface TianjinHighwayRouteMeta {
  id: string;
  name: string;
  color: string;
  aliases: string[];
}

export const TIANJIN_HIGHWAY_ROUTES = [
  { id: 'g1', name: '京哈高速', color: '#ef4444', aliases: ['京哈', 'G1 京哈'] },
  { id: 'g0111', name: '秦滨高速', color: '#f59e0b', aliases: ['秦滨', 'G0111 秦滨'] },
  { id: 's40', name: '津滨高速', color: '#0ea5e9', aliases: ['津滨', 'S40 津滨'] },
  { id: 's1', name: '津蓟高速', color: '#8b5cf6', aliases: ['津蓟', 'S1 津蓟'] },
  { id: 'g25', name: '长深高速', color: '#10b981', aliases: ['长深', 'G25 长深'] },
  { id: 'g18', name: '荣乌高速', color: '#14b8a6', aliases: ['荣乌', 'G18 荣乌'] },
  { id: 'g2', name: '京沪高速', color: '#6366f1', aliases: ['京沪', 'G2 京沪'] },
  { id: 'g0211', name: '津石高速', color: '#06b6d4', aliases: ['津石', 'G0211 津石'] },
  { id: 's6', name: '津沧高速', color: '#ec4899', aliases: ['津沧', 'S6 津沧'] },
  { id: 's7', name: '津保高速', color: '#84cc16', aliases: ['津保', 'S7 津保'] },
] as const satisfies readonly TianjinHighwayRouteMeta[];

function classifyPoint(name: string, address: string): HighwayPointType {
  const text = `${name}${address}`;
  if (/收费站/.test(text)) return '收费站';
  if (/服务区/.test(text)) return '服务区';
  if (/互通|立交/.test(text)) return '互通立交';
  if (/桥|大桥/.test(text)) return '桥梁';
  if (/匝道|出口|入口/.test(text)) return '匝道';
  if (/隧道/.test(text)) return '隧道';
  return '路段点';
}

function summarizeTraffic(statuses: TrafficStatus[]): { text: string; speed: number | null; level: HighwayRiskLevel } {
  if (!statuses.length) {
    return { text: '暂无实时路况', speed: null, level: 'low' };
  }

  const avgSpeed = statuses.reduce((sum, item) => sum + (item.speed || 0), 0) / statuses.length;
  const worst = statuses.reduce((prev, item) => (item.speed < prev.speed ? item : prev), statuses[0]);
  const level = avgSpeed < 15 ? 'high' : avgSpeed < 30 ? 'medium' : 'low';

  return {
    text: `${getCongestionText(worst.congestionLevel)} · ${Math.round(avgSpeed)}km/h`,
    speed: Math.round(avgSpeed),
    level,
  };
}

function scoreRisk(pointType: HighwayPointType, weather: CurrentWeather, trafficLevel: HighwayRiskLevel): { risk: HighwayRiskLevel; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (pointType === '收费站' || pointType === '互通立交') {
    score += 1;
    reasons.push('车流汇入汇出频繁');
  }
  if (pointType === '桥梁' || pointType === '匝道') {
    score += 1;
    reasons.push('桥面与匝道更容易受横风影响');
  }
  if (weather.weatherCode >= 51 && weather.weatherCode <= 99) {
    score += 1;
    reasons.push(`当前天气：${weatherCodeToText(weather.weatherCode)}`);
  }
  if (weather.windSpeed >= 8) {
    score += 1;
    reasons.push('风力偏强');
  }
  if (trafficLevel === 'medium') {
    score += 1;
    reasons.push('周边交通开始放缓');
  }
  if (trafficLevel === 'high') {
    score += 2;
    reasons.push('周边实时路况偏慢');
  }

  if (score >= 4) return { risk: 'high', reasons };
  if (score >= 2) return { risk: 'medium', reasons };
  return { risk: 'low', reasons };
}

async function buildPoint(routeName: string, routeColor: string, place: Awaited<ReturnType<typeof searchRoadPlaces>>[number]): Promise<HighwayPoint | null> {
  const pointType = classifyPoint(place.name, place.address);
  const weather = await fetchCurrentWeatherByCoords(place.location.lat, place.location.lng);
  const trafficList = await fetchRealTimeTraffic({
    sw: { lat: place.location.lat - 0.015, lng: place.location.lng - 0.015 },
    ne: { lat: place.location.lat + 0.015, lng: place.location.lng + 0.015 },
  });

  const trafficSummary = summarizeTraffic(trafficList);
  const risk = scoreRisk(pointType, weather, trafficSummary.level);

  return {
    id: `${routeName}-${place.id}`,
    name: place.name,
    routeName,
    routeColor,
    type: pointType,
    lat: place.location.lat,
    lng: place.location.lng,
    district: place.district || '天津市',
    address: place.address || '',
    weather,
    trafficText: trafficSummary.text,
    trafficSpeed: trafficSummary.speed,
    risk: risk.risk,
    riskReasons: risk.reasons,
  };
}

async function loadRoutePoints(routeName: string, routeColor: string, aliases: readonly string[]): Promise<HighwayPoint[]> {
  const places = new Map<string, Awaited<ReturnType<typeof searchRoadPlaces>>[number]>();

  for (const keyword of [routeName, ...aliases]) {
    const results = await searchRoadPlaces(keyword, '天津');
    for (const place of results) {
      const key = `${place.name}-${place.location.lat.toFixed(5)}-${place.location.lng.toFixed(5)}`;
      if (!places.has(key)) {
        places.set(key, place);
      }
    }
  }

  const sortedPlaces = Array.from(places.values())
    .filter((place) => /收费站|服务区|互通|立交|桥|匝道|出口|入口|高速/.test(`${place.name}${place.address}`))
    .slice(0, 14);

  const points: HighwayPoint[] = [];
  const batchSize = 4;
  for (let index = 0; index < sortedPlaces.length; index += batchSize) {
    const batch = sortedPlaces.slice(index, index + batchSize);
    const entries = await Promise.allSettled(batch.map((place) => buildPoint(routeName, routeColor, place)));
    for (const entry of entries) {
      if (entry.status === 'fulfilled' && entry.value) {
        points.push(entry.value);
      }
    }
  }

  return points
    .sort((a, b) => {
      const rank: Record<HighwayPointType, number> = { '收费站': 0, '服务区': 1, '互通立交': 2, '桥梁': 3, '匝道': 4, '隧道': 5, '路段点': 6 };
      return rank[a.type] - rank[b.type] || a.name.localeCompare(b.name, 'zh-CN');
    })
    .map((point, seq) => ({ ...point, id: `${point.id}-${seq}` }));
}

async function buildRouteCard(route: TianjinHighwayRouteMeta): Promise<HighwayRouteCard | null> {
  const points = await loadRoutePoints(route.name, route.color, route.aliases);
  if (!points.length) return null;

  const trafficText = `${points.filter((point) => point.risk === 'high').length}处高风险点 · ${points[0].trafficText}`;

  const floodWatchPoints = points.filter((point) =>
    point.risk === 'high' || point.type === '收费站' || point.type === '互通立交' || point.type === '桥梁' || point.type === '匝道'
  );

  const accidentTips = Array.from(
    new Set(
      points.flatMap((point) => {
        const tips: string[] = [];
        if (point.type === '收费站') tips.push('收费站车流汇入汇出频繁，注意追尾与并线。');
        if (point.type === '服务区') tips.push('服务区出入口车速变化大，注意观察减速。');
        if (point.type === '互通立交') tips.push('互通立交匝道多，提前变道更安全。');
        if (point.type === '桥梁') tips.push('桥面横风更明显，雨天和大风天要稳住方向。');
        if (point.type === '匝道') tips.push('匝道弯道和坡度变化较大，控制车速。');
        if (point.risk === 'high') tips.push('当前实时气象和路况叠加，建议优先避开。');
        return tips;
      })
    )
  ).slice(0, 5);

  const routeRisk: HighwayRiskLevel = points.some((point) => point.risk === 'high')
    ? 'high'
    : points.some((point) => point.risk === 'medium')
      ? 'medium'
      : 'low';

  return {
    id: route.id,
    routeName: route.name,
    routeColor: route.color,
    points,
    trafficText,
    risk: routeRisk,
    floodWatchPoints,
    accidentTips,
  };
}

export async function fetchTianjinHighwayRouteCard(routeId: string): Promise<HighwayRouteCard | null> {
  const route = TIANJIN_HIGHWAY_ROUTES.find((item) => item.id === routeId);
  if (!route) return null;

  return getCachedValue(
    `highway:tianjin:route:${route.id}`,
    async () => buildRouteCard(route),
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}

export async function fetchTianjinHighwayDashboard(): Promise<HighwayRouteCard[]> {
  return getCachedValue(
    'highway:tianjin:dashboard',
    async () => {
      const routeCards = await Promise.all(
        TIANJIN_HIGHWAY_ROUTES.map((route) => fetchTianjinHighwayRouteCard(route.id))
      );

      return routeCards.filter(Boolean) as HighwayRouteCard[];
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}
