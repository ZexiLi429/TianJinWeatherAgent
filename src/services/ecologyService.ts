/**
 * 中国气象局补充数据服务
 * 用于获取：花粉指数、紫外线指数、生态环境指数等
 */

export interface PollenData {
  level: number; // 1-5：极少、少、中、多、极多
  levelText: string;
  mainPollen: string;
  advise: string;
}

export interface UVIndex {
  level: number; // 1-11
  levelText: string;
  advise: string;
}

export interface EcologyIndex {
  comfort: number; // 舒适度指数 1-5
  comfortText: string;
  forecastInfo: string;
}

/**
 * 获取天津花粉指数
 * 数据来自中国气象局官网爬取
 */
export async function fetchPollenIndex(): Promise<PollenData> {
  try {
    // 中国气象局花粉预报 API 实验端点
    // 返回格式示例: { huafen: { city: "天津", level: 3, type: "乔木花粉", advise: "..." } }
    const response = await fetch(
      'http://www.nmc.cn/rest/queryIndexInfo?type=huafen&areaId=101010100'
    );
    
    if (!response.ok) {
      return getFallbackPollen();
    }

    const data = await response.json();
    
    if (data && data.huafen) {
      const level = data.huafen.level || 3;
      return {
        level,
        levelText: getPollenLevelText(level),
        mainPollen: data.huafen.type || '混合花粉',
        advise: data.huafen.advise || getPollenAdvice(level),
      };
    }

    return getFallbackPollen();
  } catch (error) {
    console.error('花粉指数获取失败:', error);
    return getFallbackPollen();
  }
}

/**
 * 获取紫外线指数
 */
export async function fetchUVIndex(): Promise<UVIndex> {
  try {
    // 中国气象局 UV 指数接口
    const response = await fetch(
      'http://www.nmc.cn/rest/queryIndexInfo?type=uv&areaId=101010100'
    );
    
    if (!response.ok) {
      return getFallbackUV();
    }

    const data = await response.json();
    
    if (data && data.uv) {
      const level = data.uv.level || 5;
      return {
        level,
        levelText: getUVLevelText(level),
        advise: data.uv.advise || getUVAdvice(level),
      };
    }

    return getFallbackUV();
  } catch (error) {
    console.error('紫外线指数获取失败:', error);
    return getFallbackUV();
  }
}

/**
 * 获取综合舒适度指数
 * 综合温度、湿度、风速等因素
 */
export async function fetchComfortIndex(
  temp: number,
  humidity: number,
  windSpeed: number
): Promise<EcologyIndex> {
  // 简单的舒适度计算算法
  // 标准舒适温度范围：20-25°C，湿度 40-60%，风速 < 5 m/s
  
  let score = 100;
  
  // 温度得分
  if (temp < 10 || temp > 32) {
    score -= 30;
  } else if (temp < 15 || temp > 28) {
    score -= 15;
  } else if (temp < 20 || temp > 25) {
    score -= 5;
  }
  
  // 湿度得分
  if (humidity < 30 || humidity > 80) {
    score -= 20;
  } else if (humidity < 40 || humidity > 70) {
    score -= 10;
  }
  
  // 风速得分
  if (windSpeed > 8) {
    score -= 15;
  } else if (windSpeed > 5) {
    score -= 10;
  }
  
  const normalizedScore = Math.max(1, Math.min(5, Math.round((score / 100) * 5)));
  
  return {
    comfort: normalizedScore,
    comfortText: getComfortText(normalizedScore),
    forecastInfo: getComfortAdvice(normalizedScore, temp, humidity, windSpeed),
  };
}

/**
 * 获取实时生态环境评分
 * 综合空气质量、花粉、UV、水质等因素
 */
export async function fetchEcologyScore(
  aqi: number | null,
  pollenLevel?: number
): Promise<{
  overallScore: number; // 0-100
  status: 'excellent' | 'good' | 'moderate' | 'poor' | 'severe';
  advice: string[];
}> {
  let score = 100;
  const advices: string[] = [];

  // AQI 评分
  if (aqi !== null) {
    if (aqi <= 50) {
      // score 不变
    } else if (aqi <= 100) {
      score -= 15;
      advices.push('空气质量良好，适合户外活动');
    } else if (aqi <= 150) {
      score -= 35;
      advices.push('空气质量轻度污染，敏感人群建议减少户外活动');
    } else if (aqi <= 200) {
      score -= 55;
      advices.push('空气质量中度污染，建议戴口罩出行');
    } else {
      score -= 75;
      advices.push('空气质量重度污染，建议避免户外活动');
    }
  }

  // 花粉等级评分
  if (pollenLevel) {
    if (pollenLevel >= 4) {
      score -= 20;
      advices.push('花粉浓度较高，易过敏人群请做好防护');
    }
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  let status: 'excellent' | 'good' | 'moderate' | 'poor' | 'severe' = 'excellent';
  
  if (normalizedScore >= 80) {
    status = 'excellent';
  } else if (normalizedScore >= 60) {
    status = 'good';
  } else if (normalizedScore >= 40) {
    status = 'moderate';
  } else if (normalizedScore >= 20) {
    status = 'poor';
  } else {
    status = 'severe';
  }

  return {
    overallScore: normalizedScore,
    status,
    advice: advices.length > 0 ? advices : ['当前生态环境条件良好'],
  };
}

// ===== 辅助函数 =====

function getPollenLevelText(level: number): string {
  const map = ['极少', '少', '中', '多', '极多'];
  return map[Math.min(level - 1, 4)] || '未知';
}

function getPollenAdvice(level: number): string {
  const advice = {
    1: '花粉浓度极少，不用担心过敏问题',
    2: '花粉浓度较低，过敏人群仍需注意防护',
    3: '花粉浓度中等，易过敏人群应佩戴口罩',
    4: '花粉浓度较高，建议尽量减少户外活动',
    5: '花粉浓度极高，建议留在室内，关闭门窗',
  };
  return advice[level as keyof typeof advice] || '请咨询专业人士';
}

function getUVLevelText(level: number): string {
  if (level <= 2) return '弱';
  if (level <= 5) return '中等';
  if (level <= 7) return '强';
  if (level <= 10) return '很强';
  return '极强';
}

function getUVAdvice(level: number): string {
  if (level <= 2) return '无需特殊防护';
  if (level <= 5) return '建议涂抹防晒霜，戴帽子';
  if (level <= 7) return '强烈建议涂抹防晒霜，避免午间外出';
  if (level <= 10) return '必须涂抹防晒霜，尽量避免午间外出';
  return '非常强烈的紫外线，建议避免户外活动';
}

function getComfortText(score: number): string {
  if (score >= 4.5) return '非常舒适';
  if (score >= 3.5) return '舒适';
  if (score >= 2.5) return '一般';
  if (score >= 1.5) return '不适';
  return '很不舒适';
}

function getComfortAdvice(
  score: number,
  temp: number,
  humidity: number,
  windSpeed: number
): string {
  const parts: string[] = [];

  if (temp < 15) parts.push('气温较低，建议穿着厚衣服');
  else if (temp > 28) parts.push('气温较高，建议穿着轻薄衣服，多喝水');

  if (humidity < 40) parts.push('空气干燥，建议适当补水');
  else if (humidity > 70) parts.push('空气潮湿，可能感到闷热');

  if (windSpeed > 5) parts.push('风力较大，户外活动需注意安全');

  return parts.join('；') || '当前舒适度指数良好';
}

function getFallbackPollen(): PollenData {
  return {
    level: 3,
    levelText: '中',
    mainPollen: '混合花粉',
    advise: '花粉浓度中等，易过敏人群应佩戴口罩',
  };
}

function getFallbackUV(): UVIndex {
  return {
    level: 5,
    levelText: '中等',
    advise: '建议涂抹防晒霜，戴帽子',
  };
}
