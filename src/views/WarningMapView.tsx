import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Map as MapIcon,
  List,
  BarChart3,
  AlertTriangle,
  Clock3,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Wind,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

type WarningLevel = '红色' | '橙色' | '黄色' | '蓝色';

interface WarningItem {
  id: string;
  district: string;
  districtId: string;
  type: string;
  level: WarningLevel;
  time: string;
  content: string;
  guideline: string[];
}

interface DistrictShape {
  id: string;
  name: string;
  d: string;
  labelX: number;
  labelY: number;
}

const WARNINGS: WarningItem[] = [
  {
    id: 'w-01',
    district: '滨海新区',
    districtId: 'binhaixinqu',
    type: '大风预警',
    level: '黄色',
    time: '2026-05-12 19:40',
    content: '预计未来12小时滨海新区沿海及空旷地带阵风可达8到9级，港区与高架路段通行风险上升。',
    guideline: ['减少临时搭建物附近停留', '货车与高车身车辆注意横风', '港区作业做好加固并关注调度通知'],
  },
  {
    id: 'w-02',
    district: '蓟州区',
    districtId: 'jizhouqu',
    type: '雷电预警',
    level: '橙色',
    time: '2026-05-12 18:55',
    content: '未来6小时蓟州山区对流发展较快，局地伴有短时强降雨和雷电，请注意山区道路与景区安全。',
    guideline: ['避免在山脊和孤立树木下停留', '景区临时关闭高风险步道', '驾车避开低洼及易落石路段'],
  },
  {
    id: 'w-03',
    district: '静海区',
    districtId: 'jinghaiqu',
    type: '暴雨预警',
    level: '蓝色',
    time: '2026-05-12 17:20',
    content: '预计夜间至明晨静海区部分乡镇有短时强降雨，低洼路段可能积水，早高峰出行请提前规划。',
    guideline: ['提前检查排水口周边', '尽量避开易积水下穿通道', '电动车与行人注意涉水安全'],
  },
];

const DISTRICTS: DistrictShape[] = [
  { id: 'jizhouqu', name: '蓟州区', d: 'M185 18 L245 26 L260 64 L228 88 L170 78 L160 42 Z', labelX: 210, labelY: 58 },
  { id: 'baodiqu', name: '宝坻区', d: 'M154 84 L232 92 L246 136 L196 164 L128 146 L122 106 Z', labelX: 182, labelY: 124 },
  { id: 'wuqingqu', name: '武清区', d: 'M84 76 L146 86 L116 150 L56 136 L42 98 Z', labelX: 92, labelY: 112 },
  { id: 'ninghequ', name: '宁河区', d: 'M242 88 L304 98 L322 156 L270 182 L236 144 Z', labelX: 278, labelY: 132 },
  { id: 'beichenqu', name: '北辰区', d: 'M108 152 L156 160 L146 198 L92 196 L76 170 Z', labelX: 118, labelY: 177 },
  { id: 'hongqiaoqu', name: '红桥区', d: 'M92 198 L112 198 L110 216 L90 218 Z', labelX: 101, labelY: 210 },
  { id: 'hebeiqu', name: '河北区', d: 'M114 196 L134 194 L136 214 L112 216 Z', labelX: 124, labelY: 208 },
  { id: 'hepingqu', name: '和平区', d: 'M98 220 L116 220 L114 236 L96 236 Z', labelX: 106, labelY: 231 },
  { id: 'nankaiqu', name: '南开区', d: 'M76 218 L96 218 L96 238 L74 238 Z', labelX: 86, labelY: 231 },
  { id: 'hexiqu', name: '河西区', d: 'M98 238 L118 238 L116 262 L96 262 Z', labelX: 108, labelY: 252 },
  { id: 'hedongqu', name: '河东区', d: 'M118 220 L146 218 L146 250 L116 250 Z', labelX: 132, labelY: 236 },
  { id: 'dongliqu', name: '东丽区', d: 'M148 196 L196 194 L206 252 L150 250 Z', labelX: 176, labelY: 222 },
  { id: 'xiqingqu', name: '西青区', d: 'M56 234 L96 238 L98 278 L48 282 L34 252 Z', labelX: 73, labelY: 258 },
  { id: 'jinnanqu', name: '津南区', d: 'M118 252 L158 252 L166 300 L124 304 L98 278 Z', labelX: 136, labelY: 280 },
  { id: 'jinghaiqu', name: '静海区', d: 'M34 286 L124 304 L126 354 L42 354 L18 320 Z', labelX: 78, labelY: 326 },
  { id: 'binhaixinqu', name: '滨海新区', d: 'M204 186 L292 174 L336 230 L324 352 L202 336 L170 286 Z', labelX: 264, labelY: 270 },
];

const MONTH_STATS = [
  { month: '1月', count: 88 },
  { month: '2月', count: 95 },
  { month: '3月', count: 132 },
  { month: '4月', count: 126 },
  { month: '5月', count: 118 },
  { month: '6月', count: 182 },
  { month: '7月', count: 231 },
  { month: '8月', count: 248 },
  { month: '9月', count: 104 },
  { month: '10月', count: 113 },
  { month: '11月', count: 120 },
  { month: '12月', count: 90 },
];

const LEVEL_COLORS: Record<WarningLevel, string> = {
  红色: '#ef4444',
  橙色: '#f97316',
  黄色: '#f59e0b',
  蓝色: '#3b82f6',
};

function levelBadgeClass(level: WarningLevel): string {
  if (level === '红色') return 'bg-red-50 text-red-600 border-red-200';
  if (level === '橙色') return 'bg-orange-50 text-orange-600 border-orange-200';
  if (level === '黄色') return 'bg-yellow-50 text-yellow-700 border-yellow-300';
  return 'bg-blue-50 text-blue-600 border-blue-200';
}

interface WarningMapViewProps {
  onBack: () => void;
}

export default function WarningMapView({ onBack }: WarningMapViewProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats'>('map');
  const [selectedWarning, setSelectedWarning] = useState<WarningItem | null>(null);

  const warningByDistrict = useMemo(() => {
    return WARNINGS.reduce<Record<string, WarningItem>>((acc, item) => {
      acc[item.districtId] = item;
      return acc;
    }, {});
  }, []);

  const levelStats = useMemo(() => {
    const map: Record<WarningLevel, number> = { 红色: 0, 橙色: 0, 黄色: 0, 蓝色: 0 };
    WARNINGS.forEach((item) => {
      map[item.level] += 1;
    });
    return [
      { name: '红色', value: map.红色, color: LEVEL_COLORS.红色 },
      { name: '橙色', value: map.橙色, color: LEVEL_COLORS.橙色 },
      { name: '黄色', value: map.黄色, color: LEVEL_COLORS.黄色 },
      { name: '蓝色', value: map.蓝色, color: LEVEL_COLORS.蓝色 },
    ].filter((item) => item.value > 0);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background text-on-surface">
      <header className="h-16 shrink-0 border-b border-on-surface/10 bg-white/90 backdrop-blur px-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-primary">天津预警地图</h1>
          <p className="text-[11px] text-on-surface-variant">预警总览 · 区域分布 · 风险态势</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant">最新更新</p>
          <p className="text-xs font-semibold text-primary">2026-05-12 20:10</p>
        </div>
      </header>

      <div className="px-4 pt-3 shrink-0">
        <div className="bg-white rounded-2xl p-1 border border-on-surface/10 flex gap-1">
          {[
            { id: 'map', icon: MapIcon, label: '地图总览' },
            { id: 'list', icon: List, label: '预警列表' },
            { id: 'stats', icon: BarChart3, label: '数据统计' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'map' | 'list' | 'stats')}
              className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === tab.id ? 'bg-primary text-white' : 'text-on-surface-variant'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {activeTab === 'map' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-primary flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  天津市各区预警分布图
                </h2>
                <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  当前预警 {WARNINGS.length} 条
                </span>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 p-2">
                <svg viewBox="0 0 360 380" className="w-full h-auto">
                  {DISTRICTS.map((district) => {
                    const warning = warningByDistrict[district.id];
                    const fill = warning ? `${LEVEL_COLORS[warning.level]}33` : '#e2ecf8';
                    const stroke = warning ? LEVEL_COLORS[warning.level] : '#9fb7d1';
                    return (
                      <g
                        key={district.id}
                        className="cursor-pointer"
                        onClick={() => warning && setSelectedWarning(warning)}
                      >
                        <path d={district.d} fill={fill} stroke={stroke} strokeWidth="1.5" />
                        <text
                          x={district.labelX}
                          y={district.labelY}
                          textAnchor="middle"
                          className="fill-slate-700"
                          style={{ fontSize: 10, fontWeight: 700 }}
                        >
                          {district.name.replace('区', '')}
                        </text>
                        {warning && (
                          <circle cx={district.labelX + 18} cy={district.labelY - 10} r="4" fill={LEVEL_COLORS[warning.level]} />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['红色', '橙色', '黄色', '蓝色'] as WarningLevel[]).map((level) => (
                  <div key={level} className="rounded-xl bg-white px-3 py-2 border border-on-surface/10 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LEVEL_COLORS[level] }} />
                    <span className="text-xs text-on-surface-variant">{level}预警</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WARNINGS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedWarning(item)}
                  className="text-left rounded-2xl bg-white border border-on-surface/10 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{item.district} · {item.type}</p>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{item.content}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${levelBadgeClass(item.level)}`}>{item.level}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-3 flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    {item.time}
                  </p>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {activeTab === 'list' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {WARNINGS.map((item) => (
              <div key={item.id} className="rounded-3xl bg-white p-4 border border-on-surface/10 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold">{item.district} · {item.type}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border ${levelBadgeClass(item.level)}`}>{item.level}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant mt-2">{item.content}</p>
                    <button
                      onClick={() => setSelectedWarning(item)}
                      className="mt-3 text-xs text-primary font-semibold inline-flex items-center gap-1"
                    >
                      查看详情
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.section>
        )}

        {activeTab === 'stats' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-3xl bg-white p-4 border border-on-surface/10 shadow-sm">
              <h3 className="font-semibold text-primary mb-2">月度预警趋势</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTH_STATS}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {MONTH_STATS.map((item, index) => (
                        <Cell key={item.month} fill={index >= 5 && index <= 8 ? '#3b82f6' : '#93c5fd'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-4 border border-on-surface/10 shadow-sm">
              <h3 className="font-semibold text-primary mb-2">预警等级构成</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={levelStats} dataKey="value" nameKey="name" outerRadius={85} innerRadius={40}>
                      {levelStats.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {levelStats.map((item) => (
                  <div key={item.name} className="rounded-xl bg-slate-50 px-3 py-2 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}预警
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-blue-50 border border-blue-100 p-4">
              <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                风险提示
              </h3>
              <p className="text-sm text-blue-700/80 leading-relaxed">
                当前预警主要集中在沿海和山区，建议滨海新区重点关注阵风影响，蓟州区重点关注强对流天气，夜间出行注意短时强降雨造成的低洼积水。
              </p>
            </div>
          </motion.section>
        )}
      </main>

      <AnimatePresence>
        {selectedWarning && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[1px] flex items-end"
            onClick={() => setSelectedWarning(null)}
          >
            <div
              className="w-full max-h-[82vh] overflow-y-auto rounded-t-[2rem] bg-white p-5 border-t border-on-surface/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 rounded-full bg-on-surface/20 mx-auto mb-4" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-primary">{selectedWarning.district} · {selectedWarning.type}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    发布时间 {selectedWarning.time}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${levelBadgeClass(selectedWarning.level)}`}>
                  {selectedWarning.level}
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm leading-relaxed text-on-surface">{selectedWarning.content}</p>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-on-surface flex items-center gap-2">
                  <Wind className="w-4 h-4 text-primary" />
                  防御建议
                </h4>
                <div className="space-y-2">
                  {selectedWarning.guideline.map((text, index) => (
                    <div key={`${selectedWarning.id}-${index}`} className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800/90">
                      {index + 1}. {text}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedWarning(null)}
                className="mt-5 w-full h-10 rounded-xl bg-primary text-white font-semibold"
              >
                关闭详情
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
