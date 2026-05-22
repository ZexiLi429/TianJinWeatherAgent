/**
 * 天津气象灾害应急科普知识库
 * 模拟本地知识库：文章索引 + 语义检索
 */

export type DisasterCategory = '暴雨积涝' | '雷电防护' | '台风应对' | '高温防暑' | '大雾行车' | '寒潮防护' | '预警解读';

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: DisasterCategory;
  tags: string[];
  summary: string;
  content: string; // markdown 格式
  readTime: number; // 分钟
  coverGradient: string;
  icon: string;
  warningLevel?: '红色' | '橙色' | '黄色' | '蓝色';
  // 用于智能推荐匹配的关键词
  matchKeywords: string[];
}

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'flood-001',
    title: '暴雨积涝逃生完全手册',
    category: '暴雨积涝',
    tags: ['积水', '逃生', '地下空间', '行车'],
    summary: '暴雨来袭，积水迅速上涨时该怎么做？覆盖行人、驾驶员、地铁乘客三种场景的实用逃生指南。',
    content: `## 暴雨积涝逃生完全手册

### 🚶 行人遭遇积水
- 积水深度**超过踝关节**立即找高处撤退，不要强行涉水
- 避开**窨井盖**区域，涉水时用棍子探路，防止落入已开盖的窨井
- 禁止在**地下通道、立交桥下**避雨，这些是积水重灾区
- 看到**电线浸水**立即远离至少10米，防止触电

### 🚗 驾驶员遭遇积水路段  
- 积水深度**超过排气管**（约30cm）绝对不要强行通过
- 车辆进水**发动机切勿启动**，防止进水后液压顿锁损坏发动机
- 车门打不开时：**用安全锤击碎侧窗**（击打四角，非中心）立即逃生
- 逃出后**远离车辆**，避免水中电气短路

### 🚇 地铁乘客遭遇积水
- 发现站台积水立即**从最近出口疏散**，不要等候广播
- 若列车停在隧道：**不要开门**，等待专业人员引导
- 天津地铁A、B、C 口高度差最大，**优先选择标识为高处的出口**

### 📱 提前预防
1. 关注天津气象局暴雨预警，黄色及以上尽量减少外出
2. 提前了解居住附近的**历史积水点**（南开六纬路、红桥区西站等）
3. 家中备置**应急包**：手电筒、急救包、备用充电宝`,
    readTime: 4,
    coverGradient: 'from-blue-600 to-cyan-500',
    icon: '🌊',
    warningLevel: '橙色',
    matchKeywords: ['暴雨', '积水', '积涝', '洪水', '内涝', '大雨', '暴雨预警'],
  },
  {
    id: 'lightning-001',
    title: '雷电天气安全防护指南',
    category: '雷电防护',
    tags: ['雷击', '户外', '电子设备', '建筑'],
    summary: '雷雨季节，户外活动如何避雷？家中安全须知和雷击急救方法一次讲清。',
    content: `## 雷电天气安全防护指南

### ⚡ 户外避雷要点
- **室外立即撤回室内**，无法撤离时远离高大树木、金属构件
- **蹲下降低重心**，双脚并拢，用手捂耳减少雷声伤害
- 不要躲在**孤立建筑物、电话亭、岗亭**旁
- 山顶、丘陵、空旷球场是**高危区**，立即下山/离开

### 🏠 室内防雷
- 关好门窗，**拔掉不必要的电器插头**
- 不使用**固定电话**，手机不受影响可正常使用
- 远离**水管、暖气管道**等金属管道
- 不要在**阳台、屋顶**停留

### 🚗 车内避雷
- 车内相对安全，**关好车窗不下车**
- 不要接触**车门把手、方向盘等金属部件**
- 停在**空旷地带**，避免停在大树旁

### 🏥 雷击急救
1. **立即呼叫120**，雷击伤者通常无残余电荷，可安全施救
2. 检查意识呼吸，**心肺复苏优先**
3. 雷击可能造成心跳骤停，**立即开始CPR**`,
    readTime: 3,
    coverGradient: 'from-violet-600 to-purple-500',
    icon: '⚡',
    warningLevel: '黄色',
    matchKeywords: ['雷电', '雷击', '雷雨', '强对流', '雷暴', '打雷'],
  },
  {
    id: 'typhoon-001',
    title: '台风来临前后防范指南',
    category: '台风应对',
    tags: ['台风', '大风', '停课', '物资储备'],
    summary: '台风登陆前72小时、24小时、0小时应分别做什么？台风过后为什么还要防范？',
    content: `## 台风来临前后防范指南

### 📅 台风预警三阶段

**提前72小时（台风蓝色/黄色预警）**
- 检查家中**门窗是否牢固**，加固遮雨棚
- 储备3天以上**饮用水和食物**
- 为手机、充电宝**充满电**
- 将阳台物品**搬入室内**

**提前24小时（台风橙色预警）**
- 尽量**取消室外活动**，非必要不出门
- 停放车辆**远离大树和广告牌**区域
- 通知家人**告知位置和状态**

**台风登陆时（台风红色预警）**
- **不要外出**，即便短暂停风也可能是台风眼经过
- 远离**玻璃窗**，防止窗破飞碎
- 若遭遇洪水按积涝逃生指南执行

### ⚠️ 台风过后仍需警惕
- 地面**树木、电线可能倒伏**，行走绕行
- 积水中可能有**污染物和隐形障碍**
- 地质松软，**山区谨防滑坡**
- 供电、通讯可能**中断数小时**`,
    readTime: 4,
    coverGradient: 'from-slate-700 to-slate-500',
    icon: '🌀',
    warningLevel: '红色',
    matchKeywords: ['台风', '大风', '强风', '热带风暴', '龙卷风'],
  },
  {
    id: 'heat-001',
    title: '高温热浪防暑完全指南',
    category: '高温防暑',
    tags: ['中暑', '热射病', '老人儿童', '户外作业'],
    summary: '天津夏季高温频繁，热射病致死率超50%！如何辨别中暑类型并正确急救？',
    content: `## 高温热浪防暑完全指南

### 🌡️ 中暑的三个级别
**先兆中暑**：大量出汗、口渴、头晕 → 立即转阴凉处休息，补充淡盐水
**轻度中暑**：体温≤38°C，面色潮红，皮肤灼热 → 迅速降温，解开衣物散热
**热射病（重度）**：体温**超40°C**，意识模糊或昏迷 → **立即拨打120，这是急症**

### ❄️ 热射病急救要点
1. **立即搬离热环境**，转至空调房或阴凉通风处
2. **迅速物理降温**：冰袋置于颈部、腋下、腹股沟（大血管处）
3. **禁止给意识不清者喂水**，防止误吸
4. **持续降温**直至120到达，降温不可中断

### 👴 高危人群特别提示
- **老年人、婴幼儿**：体温调节差，需更频繁补水
- **心血管病患者**：高温加重心脏负担，减少室外活动
- **户外作业人员**：上午10点至下午3点避免高强度作业

### 🌞 日常防暑
- 外出涂抹**SPF50以上防晒**
- 每小时补充**250-500ml**淡盐水
- 穿**浅色宽松**透气衣物
- 避免**空腹**外出`,
    readTime: 4,
    coverGradient: 'from-orange-500 to-amber-400',
    icon: '☀️',
    warningLevel: '橙色',
    matchKeywords: ['高温', '热浪', '中暑', '热射病', '高温预警', '暑热'],
  },
  {
    id: 'fog-001',
    title: '大雾天气行车安全手册',
    category: '大雾行车',
    tags: ['能见度', '高速公路', '灯光使用', '跟车距离'],
    summary: '大雾天能见度不足50米时，高速封路标准是什么？哪些灯光组合最正确？',
    content: `## 大雾天气行车安全手册

### 🔦 正确灯光使用
**能见度200~500m**：开启**前后雾灯 + 近光灯**
**能见度50~200m**：**减速行驶，双闪+雾灯**，速度不超过60km/h
**能见度<50m**：**立即靠边停车**，打开双闪和示宽灯等待雾散

> ⚠️ 远光灯在雾中会形成**光幕反射**，能见度反而更低，绝对禁用

### 🛣️ 高速公路大雾
- 能见度**200m以下**：限速60km/h
- 能见度**100m以下**：封闭高速匝道，禁止上高速
- 能见度**50m以下**：全线封闭

**被困高速时**：立即打双闪→打开后备箱→在车后150m摆放三角警示牌→**所有人撤至护栏外**等待救援

### 🚗 跟车距离
正常天气100km/h跟车距离100m，大雾时**需加倍**
- 60km/h → 至少200m
- 40km/h → 至少150m`,
    readTime: 3,
    coverGradient: 'from-gray-500 to-slate-400',
    icon: '🌫️',
    warningLevel: '黄色',
    matchKeywords: ['大雾', '浓雾', '雾霾', '能见度', '雾天', '大雾预警'],
  },
  {
    id: 'cold-001',
    title: '寒潮大风防护要点',
    category: '寒潮防护',
    tags: ['冻伤', '供暖', '老年人', '出行'],
    summary: '寒潮来袭气温骤降超12°C，如何判断冻伤程度？哪些部位最需要保护？',
    content: `## 寒潮大风防护要点

### 🌡️ 寒潮标准与预警
- **寒潮**：24小时降温**≥8°C**，且最低温≤4°C
- **强寒潮**：24小时降温**≥12°C**
- 天津冬季寒潮频率高，蓟州区山区更为严重

### 🧊 冻伤处理
**一度冻伤**（皮肤红肿）：温水（37-40°C）浸泡，切勿揉搓
**二度冻伤**（出现水泡）：不要刺破水泡，保持干燥，就医处理
**三度冻伤**（皮肤变黑坏死）：立即就医，禁止自行处理

> ⚠️ 冻伤处严禁用**热水、火烤**，温度骤变会加重组织损伤

### 👴 老年人特别防护
- 室内温度保持**18°C以上**，防止心脑血管意外
- 外出佩戴**帽子手套**，减少热量散失
- 寒潮期间尽量**避免清晨出门**（气温最低时段）

### 🚗 寒潮出行
- 路面结冰时**减速慢行**，提前制动距离加倍
- 车辆预热**5分钟以上**再行驶
- 备置**沙袋或防滑链**以备应急`,
    readTime: 3,
    coverGradient: 'from-sky-600 to-blue-400',
    icon: '❄️',
    warningLevel: '蓝色',
    matchKeywords: ['寒潮', '大风', '降温', '结冰', '寒冷', '低温', '冻雨', '雨雪'],
  },
  {
    id: 'warning-001',
    title: '气象预警颜色等级全解析',
    category: '预警解读',
    tags: ['蓝色', '黄色', '橙色', '红色', '应对措施'],
    summary: '蓝黄橙红四色预警代表什么？收到预警后你应该做什么？一文弄懂中国气象预警体系。',
    content: `## 气象预警颜色等级全解析

### 🎨 四色预警体系
中国气象预警由低到高分为**蓝色→黄色→橙色→红色**四个等级

| 等级 | 含义 | 公众建议 |
|------|------|----------|
| 🔵 蓝色 | 一般气象灾害，影响较小 | 关注天气，正常出行留意变化 |
| 🟡 黄色 | 较强气象灾害，一定影响 | 减少外出，提前做好防范 |
| 🟠 橙色 | 严重气象灾害，较大影响 | 非必要不外出，做好应急准备 |
| 🔴 红色 | 特别严重，直接威胁生命 | 停止一切室外活动，撤离危险区域 |

### 📱 预警信息来源
1. **天津气象局官方APP**：最权威、最及时
2. **本平台实时推送**：集成天津气象局数据
3. **手机短信预警**：户外旅游必开
4. **电视广播滚动字幕**：停电时的重要信源

### ⚡ 不同灾害的预警对比
- **暴雨预警**：蓝色12h降雨≥50mm → 红色3h降雨≥100mm
- **大风预警**：蓝色风力6级 → 红色风力12级以上
- **高温预警**：黄色37°C以上 → 红色40°C以上持续

### 🏫 红色预警的联动响应
收到**红色预警**时：
- 中小学停课
- 大型户外活动停办
- 建筑工地停工
- 旅游景区临时关闭`,
    readTime: 4,
    coverGradient: 'from-red-500 to-orange-400',
    icon: '⚠️',
    matchKeywords: ['预警', '气象预警', '红色预警', '橙色预警', '黄色预警', '蓝色预警'],
  },
  {
    id: 'flood-city-001',
    title: '天津城市积涝点分布与避险',
    category: '暴雨积涝',
    tags: ['天津', '积水点', '立交桥', '地图', '路线'],
    summary: '天津历史易涝的16处重点区域在哪里？暴雨时如何规划安全路线绕行？',
    content: `## 天津城市积涝点分布与避险

### 🗺️ 天津主要历史积水点
**下穿立交隧道（高危）**
- 快速路红旗南路下穿隧道
- 中心桥下穿隧道  
- 复兴路下穿工程

**低洼路段**
- 南开区六纬路（历史积水严重）
- 红桥区西站附近
- 东丽区机场附近多处

**地铁出入口附近**
- 1号线南端几个高架站地面积水

### 📊 积水深度警戒线
| 积水深度 | 对应影响 | 建议 |
|---------|---------|------|
| < 15cm | 行人可缓慢通过 | 注意绕开窨井 |
| 15~30cm | 小型车辆需谨慎 | 低速通过，随时准备撤退 |
| 30~50cm | 大多数轿车危险 | 禁止通行，绕行 |
| > 50cm | 生命安全受威胁 | 立即撤离 |

### 🔔 本平台积涝监测
本平台实时监测天津16处积涝点水位，可在**暴雨积涝预警**模块查看实时水位地图，暴雨期间每5分钟更新一次。`,
    readTime: 3,
    coverGradient: 'from-teal-600 to-cyan-500',
    icon: '🗺️',
    warningLevel: '橙色',
    matchKeywords: ['天津积水', '积水点', '易涝', '城市积涝', '立交桥积水'],
  },
];

// ─── 知识库检索（简单关键词匹配 + 分类过滤）──────────────

export function searchKnowledge(query: string, category?: DisasterCategory): KnowledgeArticle[] {
  const lower = query.toLowerCase();
  let results = KNOWLEDGE_BASE;

  if (category) {
    results = results.filter(a => a.category === category);
  }

  if (!query) return results;

  return results
    .map(article => {
      let score = 0;
      // 标题匹配权重最高
      if (article.title.toLowerCase().includes(lower)) score += 10;
      // tags 匹配
      if (article.tags.some(t => lower.includes(t) || t.includes(lower))) score += 5;
      // 关键词匹配
      if (article.matchKeywords.some(k => lower.includes(k) || k.includes(lower))) score += 8;
      // summary 匹配
      if (article.summary.toLowerCase().includes(lower)) score += 3;
      return { article, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.article);
}

// ─── 根据天气状况推荐文章 ────────────────────────────────

export function getRecommendedArticles(weatherContext: {
  warningType?: string;
  condition?: string;
  temp?: number;
}): KnowledgeArticle[] {
  const text = `${weatherContext.warningType || ''} ${weatherContext.condition || ''}`.toLowerCase();

  if (text.includes('暴雨') || text.includes('大雨') || text.includes('积涝')) {
    return KNOWLEDGE_BASE.filter(a => a.category === '暴雨积涝').slice(0, 2);
  }
  if (text.includes('雷') || text.includes('强对流')) {
    return KNOWLEDGE_BASE.filter(a => a.category === '雷电防护').slice(0, 2);
  }
  if (text.includes('台风') || text.includes('大风')) {
    return KNOWLEDGE_BASE.filter(a => a.category === '台风应对').slice(0, 1)
      .concat(KNOWLEDGE_BASE.filter(a => a.category === '暴雨积涝').slice(0, 1));
  }
  if (text.includes('高温') || (weatherContext.temp !== undefined && weatherContext.temp > 35)) {
    return KNOWLEDGE_BASE.filter(a => a.category === '高温防暑').slice(0, 2);
  }
  if (text.includes('雾') || text.includes('霾')) {
    return KNOWLEDGE_BASE.filter(a => a.category === '大雾行车').slice(0, 2);
  }
  if (text.includes('寒潮') || text.includes('大风') || (weatherContext.temp !== undefined && weatherContext.temp < 0)) {
    return KNOWLEDGE_BASE.filter(a => a.category === '寒潮防护').slice(0, 2);
  }

  // 默认推荐：预警解读 + 暴雨
  return [
    KNOWLEDGE_BASE.find(a => a.id === 'warning-001')!,
    KNOWLEDGE_BASE.find(a => a.id === 'flood-001')!,
  ];
}

export const CATEGORY_LIST: DisasterCategory[] = [
  '暴雨积涝', '雷电防护', '台风应对', '高温防暑', '大雾行车', '寒潮防护', '预警解读',
];

export const CATEGORY_ICONS: Record<DisasterCategory, string> = {
  '暴雨积涝': '🌊',
  '雷电防护': '⚡',
  '台风应对': '🌀',
  '高温防暑': '☀️',
  '大雾行车': '🌫️',
  '寒潮防护': '❄️',
  '预警解读': '⚠️',
};
