// Open-Meteo 实时天气（免费，无需 API Key）

// 各区坐标
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
  '蓟州区': [40.0460, 117.4076],
};

// 默认坐标（和平区/市中心）
const DEFAULT_LAT = 39.1176;
const DEFAULT_LON = 117.1956;

export interface CurrentWeather {
  temp: number;           // 实际气温 °C
  feelsLike: number;      // 体感气温 °C
  humidity: number;       // 湿度 %
  windSpeed: number;      // 风速 m/s
  windDirection: number;  // 风向 °
  weatherCode: number;    // WMO 天气码
  aqi: number | null;     // 空气质量指数（欧标）
}

export interface TemperatureTrendPoint {
  date: string;
  max: number;
  min: number;
  weatherCode: number;
}

// WMO 天气码 → 中文描述
export function weatherCodeToText(code: number): string {
  if (code === 0) return '晴';
  if (code === 1) return '晴间多云';
  if (code === 2) return '多云';
  if (code === 3) return '阴';
  if (code <= 49) return '有雾';
  if (code <= 59) return '毛毛雨';
  if (code <= 69) return '雨';
  if (code <= 79) return '雪';
  if (code <= 84) return '阵雨';
  if (code <= 94) return '雪阵';
  return '雷暴';
}

// 风向角度 → 中文
export function windDirToText(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return dirs[Math.round(deg / 45) % 8] + '风';
}

// 风速(m/s) → 风级
export function windSpeedToLevel(ms: number): number {
  if (ms < 0.3) return 0;
  if (ms < 1.6) return 1;
  if (ms < 3.4) return 2;
  if (ms < 5.5) return 3;
  if (ms < 8.0) return 4;
  if (ms < 10.8) return 5;
  if (ms < 13.9) return 6;
  if (ms < 17.2) return 7;
  if (ms < 20.8) return 8;
  return 9;
}

// 欧标 AQI → 中文等级
export function aqiToText(aqi: number | null): string {
  if (aqi === null) return '未知';
  if (aqi <= 20) return '优';
  if (aqi <= 40) return '良';
  if (aqi <= 60) return '中等';
  if (aqi <= 80) return '差';
  if (aqi <= 100) return '很差';
  return '极差';
}

export async function fetchCurrentWeather(district?: string): Promise<CurrentWeather> {
  const [lat, lon] = district && DISTRICT_COORDS[district]
    ? DISTRICT_COORDS[district]
    : [DEFAULT_LAT, DEFAULT_LON];

  const [weatherRes, aqiRes] = await Promise.allSettled([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code` +
      `&timezone=Asia%2FShanghai`
    ).then((r) => r.json()),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi&timezone=Asia%2FShanghai`
    ).then((r) => r.json()),
  ]);

  if (weatherRes.status !== 'fulfilled') throw new Error('天气数据获取失败');
  const w = weatherRes.value.current;

  const aqi =
    aqiRes.status === 'fulfilled' && aqiRes.value?.current?.european_aqi != null
      ? Math.round(aqiRes.value.current.european_aqi)
      : null;

  return {
    temp: Math.round(w.temperature_2m),
    feelsLike: Math.round(w.apparent_temperature),
    humidity: Math.round(w.relative_humidity_2m),
    windSpeed: w.wind_speed_10m,
    windDirection: w.wind_direction_10m,
    weatherCode: w.weather_code,
    aqi,
  };
}

export async function fetchTemperatureTrend(district?: string, days: number = 7): Promise<TemperatureTrendPoint[]> {
  const [lat, lon] = district && DISTRICT_COORDS[district]
    ? DISTRICT_COORDS[district]
    : [DEFAULT_LAT, DEFAULT_LON];

  const safeDays = Math.max(3, Math.min(days, 10));
  const pastDays = Math.max(1, safeDays - 2);

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&past_days=${pastDays}&forecast_days=2&timezone=Asia%2FShanghai`
  );

  const data = await res.json();
  const daily = data?.daily;
  if (!daily?.time || !daily?.temperature_2m_max || !daily?.temperature_2m_min || !daily?.weather_code) {
    throw new Error('温度趋势数据获取失败');
  }

  const points: TemperatureTrendPoint[] = daily.time.map((date: string, idx: number) => ({
    date,
    max: Math.round(daily.temperature_2m_max[idx]),
    min: Math.round(daily.temperature_2m_min[idx]),
    weatherCode: Number(daily.weather_code[idx]),
  }));

  return points.slice(-safeDays);
}
