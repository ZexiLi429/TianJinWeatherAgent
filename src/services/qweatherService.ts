import { getCachedValue } from './cacheService';

export interface WeatherWarning {
  id: string;
  title: string;
  type: string; // 预警类型：暴雨、洪水等
  level: 'orange' | 'red' | 'yellow' | 'blue'; // 预警级别
  description: string;
  updateTime: string;
}

export interface PrecipitationData {
  location: string;
  precipitation: number; // 降水量 mm
  intensity: 'light' | 'moderate' | 'heavy' | 'extreme'; // 降水强度
  updateTime: string;
}

interface QWeatherWarningResponse {
  code: string;
  updateTime: string;
  warning: Array<{
    id: string;
    title: string;
    type: string;
    level: string;
    startTime: string;
    endTime: string;
    text: string;
  }>;
}

interface QWeatherNowResponse {
  code: string;
  updateTime: string;
  now: {
    precip: string; // 降水量
    precipProbability: string;
    windPower: string;
    windDir: string;
    temp: string;
  };
}

/**
 * 从和风天气API获取天津市暴雨预警数据
 */
export async function fetchWeatherWarnings(): Promise<WeatherWarning[]> {
  return getCachedValue(
    'qweather:warnings:tianjin',
    async () => {
      try {
        const apiKey = import.meta.env.VITE_QWEATHER_API_KEY;
        if (!apiKey) {
          console.warn('缺少VITE_QWEATHER_API_KEY');
          return [];
        }

        // 天津的location code是101070101
        const res = await fetch(
          `/api/qweather/v7/warning/now?location=101070101&key=${apiKey}`,
          {
            headers: { Accept: 'application/json' },
          }
        );

        if (!res.ok) {
          console.warn('和风天气API不可用');
          return [];
        }

        const data = (await res.json()) as QWeatherWarningResponse;

        if (data.code === '200' && data.warning && Array.isArray(data.warning)) {
          // 转换和风天气格式为本地格式
          const warnings = data.warning
            .filter(w => 
              // 只保留暴雨、洪水、暴雨洪水等相关预警
              w.type.includes('暴雨') || 
              w.type.includes('洪水') || 
              w.type.includes('积涝') ||
              w.type.includes('雨')
            )
            .map((w, index) => ({
              id: `qw-${index}`,
              title: w.title,
              type: w.type,
              level: mapWarningLevel(w.level),
              description: w.text,
              updateTime: data.updateTime,
            }));

          console.log(`✅ 和风天气：获取${warnings.length}条暴雨预警`);
          return warnings;
        }

        return [];
      } catch (error) {
        console.error('获取暴雨预警失败:', error);
        return [];
      }
    },
    { ttlMs: 15 * 60 * 1000, refreshAheadMs: 3 * 60 * 1000 } // 15分钟缓存，3分钟提前刷新
  );
}

/**
 * 从和风天气API获取天津市实时降水数据
 */
export async function fetchPrecipitationData(): Promise<PrecipitationData | null> {
  return getCachedValue(
    'qweather:precipitation:tianjin',
    async () => {
      try {
        const apiKey = import.meta.env.VITE_QWEATHER_API_KEY;
        if (!apiKey) {
          console.warn('缺少VITE_QWEATHER_API_KEY');
          return null;
        }

        // 天津的location code是101070101
        const res = await fetch(
          `/api/qweather/v7/weather/now?location=101070101&key=${apiKey}`,
          {
            headers: { Accept: 'application/json' },
          }
        );

        if (!res.ok) {
          console.warn('和风天气实时数据API不可用');
          return null;
        }

        const data = (await res.json()) as QWeatherNowResponse;

        if (data.code === '200' && data.now) {
          const precipMm = parseFloat(data.now.precip) || 0;
          const intensity = getIntensity(precipMm, data.now.precipProbability);

          console.log(
            `✅ 和风天气：降水量${precipMm}mm，强度${intensity}`
          );

          return {
            location: '天津市',
            precipitation: precipMm,
            intensity,
            updateTime: data.updateTime,
          };
        }

        return null;
      } catch (error) {
        console.error('获取降水数据失败:', error);
        return null;
      }
    },
    { ttlMs: 10 * 60 * 1000, refreshAheadMs: 2 * 60 * 1000 } // 10分钟缓存
  );
}

/**
 * 基于降水量判断降水强度
 */
function getIntensity(
  precipMm: number,
  probability?: string
): 'light' | 'moderate' | 'heavy' | 'extreme' {
  if (precipMm >= 50) return 'extreme';
  if (precipMm >= 25) return 'heavy';
  if (precipMm >= 5) return 'moderate';
  return 'light';
}

/**
 * 转换和风天气预警级别为本地格式
 */
function mapWarningLevel(qweatherLevel: string): 'blue' | 'yellow' | 'orange' | 'red' {
  switch (qweatherLevel) {
    case '蓝色':
    case 'blue':
      return 'blue';
    case '黄色':
    case 'yellow':
      return 'yellow';
    case '橙色':
    case 'orange':
      return 'orange';
    case '红色':
    case 'red':
      return 'red';
    default:
      return 'blue';
  }
}

/**
 * 获取积涝风险评估（基于降水数据）
 */
export async function assessFloodRisk(): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  precipData: PrecipitationData | null;
  warnings: WeatherWarning[];
}> {
  const [precipData, warnings] = await Promise.all([
    fetchPrecipitationData(),
    fetchWeatherWarnings(),
  ]);

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let description = '积涝风险较低';

  // 根据降水量判断风险
  if (precipData) {
    if (precipData.precipitation >= 50) {
      riskLevel = 'high';
      description = '极端降水，积涝风险极高！';
    } else if (precipData.precipitation >= 25) {
      riskLevel = 'high';
      description = '强降水，积涝风险高';
    } else if (precipData.precipitation >= 10) {
      riskLevel = 'medium';
      description = '中等降水，积涝风险中等';
    } else if (precipData.precipitation > 0) {
      riskLevel = 'low';
      description = '小雨，积涝风险较低';
    }
  }

  // 根据预警信息调整风险
  if (warnings.length > 0) {
    const hasRedWarning = warnings.some(w => w.level === 'red');
    const hasOrangeWarning = warnings.some(w => w.level === 'orange');

    if (hasRedWarning) {
      riskLevel = 'high';
      description = '⚠️ 官方发布暴雨红色预警，积涝风险极高！';
    } else if (hasOrangeWarning) {
      riskLevel = 'high';
      description = '⚠️ 官方发布暴雨橙色预警，积涝风险高';
    }
  }

  return {
    riskLevel,
    description,
    precipData,
    warnings,
  };
}
