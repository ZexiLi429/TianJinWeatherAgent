import { getCachedValue } from './cacheService';

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
  riskLevel: string;
}

interface FloodApiResponse {
  code: string;
  msg: string;
  data?: {
    warnings?: FloodWarning[];
    updateTime?: string;
    statistics?: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

/**
 * 从真实API获取天津市积涝预警数据
 * 支持天津市防洪部门或气象部门的积涝预警接口
 */
export async function fetchFloodWarnings(): Promise<FloodWarning[]> {
  return getCachedValue(
    'flood:warnings:tianjin',
    async () => {
      try {
        // 尝试从本地代理的官方API获取积涝数据
        // 这里支持多种可能的端点：防洪部门API、气象部门API等
        const res = await fetch('/api/flood/warnings', {
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          console.warn('官方积涝API不可用，尝试备用源...');
          return await fetchFloodWarningsFromAlternative();
        }

        const data = (await res.json()) as FloodApiResponse;

        if (data.code === '0' || data.code === '00000') {
          const warnings = data.data?.warnings || [];
          console.log(`成功获取 ${warnings.length} 条积涝预警数据`);
          return warnings;
        }

        // 如果响应格式不对，尝试备用源
        console.warn('积涝API返回格式异常，尝试备用源...');
        return await fetchFloodWarningsFromAlternative();
      } catch (error) {
        console.error('获取积涝预警失败:', error);
        return await fetchFloodWarningsFromAlternative();
      }
    },
    { ttlMs: 10 * 60 * 1000, refreshAheadMs: 2 * 60 * 1000 } // 10分钟缓存，2分钟提前刷新
  );
}

/**
 * 备用源：尝试从气象部门或其他API获取
 */
async function fetchFloodWarningsFromAlternative(): Promise<FloodWarning[]> {
  try {
    // 备用方案1：尝试通过天津气象局接口
    const res = await fetch('/api/weather/flood-warnings', {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data.data && Array.isArray(data.data)) return data.data;
    }
  } catch {
    // 继续往下
  }

  // 备用方案2：返回空数组（将由FloodView使用降级数据）
  console.log('所有积涝预警数据源均不可用，将使用本地降级数据');
  return [];
}

/**
 * 获取指定区的积涝预警
 */
export async function fetchFloodWarningsByDistrict(district: string): Promise<FloodWarning[]> {
  const all = await fetchFloodWarnings();
  return all.filter(warning => warning.district === district);
}

/**
 * 获取积涝预警统计
 */
export async function fetchFloodStatistics(): Promise<{ high: number; medium: number; low: number; total: number }> {
  const warnings = await fetchFloodWarnings();
  return {
    high: warnings.filter(w => w.severity === 'high').length,
    medium: warnings.filter(w => w.severity === 'medium').length,
    low: warnings.filter(w => w.severity === 'low').length,
    total: warnings.length,
  };
}
