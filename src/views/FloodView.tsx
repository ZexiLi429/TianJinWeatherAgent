import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, MapPin, AlertCircle, List, Map as MapIcon, BarChart3, Navigation, 
  Droplets, TrendingUp, ChevronRight, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 类型定义 ---
interface FloodPoint {
  id: string;
  name: string;
  district: string;
  severity: 'high' | 'medium' | 'low';
  depth: number;
  predictedDepth: number;
  lat: number;
  lng: number;
  lastUpdate: string;
  history: { time: string; depth: number }[];
}

interface FloodViewProps {
  onBack: () => void;
}

// --- 天津16个区的坐标（用于地图可视化）---
const DISTRICT_INFO = [
  { name: '和平区', lat: 65, lng: 50, waterLevel: 'low' as const },
  { name: '河东区', lat: 68, lng: 55, waterLevel: 'low' as const },
  { name: '河西区', lat: 62, lng: 45, waterLevel: 'medium' as const },
  { name: '南开区', lat: 60, lng: 48, waterLevel: 'low' as const },
  { name: '河北区', lat: 70, lng: 48, waterLevel: 'low' as const },
  { name: '红桥区', lat: 72, lng: 50, waterLevel: 'medium' as const },
  { name: '东丽区', lat: 55, lng: 65, waterLevel: 'medium' as const },
  { name: '西青区', lat: 50, lng: 35, waterLevel: 'high' as const },
  { name: '北辰区', lat: 75, lng: 50, waterLevel: 'low' as const },
  { name: '津南区', lat: 45, lng: 50, waterLevel: 'medium' as const },
  { name: '宝坻区', lat: 80, lng: 65, waterLevel: 'low' as const },
  { name: '武清区', lat: 30, lng: 30, waterLevel: 'high' as const },
  { name: '宁河区', lat: 75, lng: 75, waterLevel: 'low' as const },
  { name: '蓟州区', lat: 85, lng: 45, waterLevel: 'medium' as const },
  { name: '滨海新区', lat: 38, lng: 85, waterLevel: 'high' as const },
  { name: '静海区', lat: 35, lng: 55, waterLevel: 'low' as const },
];

// --- 积水监测点数据 ---
const FLOOD_POINTS: FloodPoint[] = [
  {
    id: 'f1',
    name: '滨海新区蔡家堡码头下沉通道',
    district: '滨海新区',
    severity: 'high',
    depth: 34.1,
    predictedDepth: 42.0,
    lat: 38.95,
    lng: 117.85,
    lastUpdate: '14:32',
    history: [
      { time: '14:00', depth: 28 },
      { time: '14:15', depth: 30 },
      { time: '14:30', depth: 34.1 },
      { time: '14:45', depth: 38 },
    ]
  },
  {
    id: 'f2',
    name: '西青区地铁2号线曹庄停车场',
    district: '西青区',
    severity: 'high',
    depth: 22.5,
    predictedDepth: 25.0,
    lat: 39.00,
    lng: 117.00,
    lastUpdate: '14:31',
    history: [
      { time: '14:00', depth: 8 },
      { time: '14:15', depth: 15 },
      { time: '14:30', depth: 22.5 },
      { time: '14:45', depth: 23.5 },
    ]
  },
  {
    id: 'f3',
    name: '武清区郑家楼村铁路涵洞',
    district: '武清区',
    severity: 'high',
    depth: 28.4,
    predictedDepth: 31.0,
    lat: 39.40,
    lng: 117.00,
    lastUpdate: '14:28',
    history: [
      { time: '14:00', depth: 20 },
      { time: '14:15', depth: 22 },
      { time: '14:30', depth: 28.4 },
      { time: '14:45', depth: 29.5 },
    ]
  },
  {
    id: 'f4',
    name: '河西区应急管理局',
    district: '河西区',
    severity: 'medium',
    depth: 5.2,
    predictedDepth: 3.0,
    lat: 39.10,
    lng: 116.90,
    lastUpdate: '14:33',
    history: [
      { time: '14:00', depth: 8 },
      { time: '14:15', depth: 6 },
      { time: '14:30', depth: 5.2 },
      { time: '14:45', depth: 4.5 },
    ]
  },
  {
    id: 'f5',
    name: '东丽区湖滨路交汇口',
    district: '东丽区',
    severity: 'medium',
    depth: 12.8,
    predictedDepth: 14.0,
    lat: 39.00,
    lng: 117.35,
    lastUpdate: '14:30',
    history: [
      { time: '14:00', depth: 6 },
      { time: '14:15', depth: 9 },
      { time: '14:30', depth: 12.8 },
      { time: '14:45', depth: 13.5 },
    ]
  },
  {
    id: 'f6',
    name: '红桥区芦东路地下通道',
    district: '红桥区',
    severity: 'medium',
    depth: 8.5,
    predictedDepth: 10.2,
    lat: 39.18,
    lng: 117.10,
    lastUpdate: '14:29',
    history: [
      { time: '14:00', depth: 4 },
      { time: '14:15', depth: 6 },
      { time: '14:30', depth: 8.5 },
      { time: '14:45', depth: 9.2 },
    ]
  },
];

// --- 统计数据 ---
const STATISTICS = [
  { name: '14:00', 高: 85, 中: 45, 低: 12 },
  { name: '14:15', 高: 92, 中: 52, 低: 15 },
  { name: '14:30', 高: 105, 中: 68, 低: 18 },
  { name: '14:45', 高: 118, 中: 75, 低: 20 },
];

export default function FloodView({ onBack }: FloodViewProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats'>('map');
  const [selectedPoint, setSelectedPoint] = useState<FloodPoint | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // 计算统计数据
  const stats = useMemo(() => {
    const high = FLOOD_POINTS.filter(p => p.severity === 'high').length;
    const medium = FLOOD_POINTS.filter(p => p.severity === 'medium').length;
    const low = FLOOD_POINTS.filter(p => p.severity === 'low').length;
    return { high, medium, low, total: FLOOD_POINTS.length };
  }, []);

  // 初始化Leaflet地图
  useEffect(() => {
    if (activeTab !== 'map') return;
    
    // 如果地图已经初始化过，就不再创建
    if (mapRef.current) return;

    const mapContainer = document.getElementById('flood-map');
    if (!mapContainer) return;

    // 天津中心坐标
    const tianjinCenter: [number, number] = [39.0842, 117.2008];

    // 初始化地图
    const map = L.map('flood-map', {
      center: tianjinCenter,
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // 添加OpenStreetMap图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // 清空之前的标记
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // 获取风险颜色
    const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
      if (severity === 'high') return '#ef4444';
      if (severity === 'medium') return '#f59e0b';
      return '#22c55e';
    };

    // 添加监测点标记
    FLOOD_POINTS.forEach((point) => {
      const iconColor = getSeverityColor(point.severity);

      // 创建自定义图标HTML
      const iconHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: white;
          border: 3px solid ${iconColor};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          font-weight: bold;
          font-size: 18px;
        ">
          💧
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        iconSize: [36, 36],
        className: 'custom-marker',
      });

      const marker = L.marker([point.lat, point.lng], { icon })
        .bindPopup(
          `<div style="font-family: system-ui; width: 200px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #333;">${point.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">区域: ${point.district}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">现状: <span style="color: ${iconColor}; font-weight: 600;">${point.depth} cm</span></div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">预测: <span style="font-weight: 600;">${point.predictedDepth} cm</span></div>
            <div style="font-size: 11px; color: #999;">更新: ${point.lastUpdate}</div>
          </div>`
        )
        .addTo(map);

      markersRef.current[point.id] = marker;

      // 点击标记时更新侧栏
      marker.on('click', () => {
        setSelectedPoint(point);
      });
    });

    mapRef.current = map;

    // 清理函数
    return () => {
      if (mapRef.current) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, [activeTab]);

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col overflow-hidden font-sans">
      {/* 头部 */}
      <header className="h-16 shrink-0 border-b border-on-surface/10 bg-white/90 backdrop-blur px-4 flex items-center gap-3">
        <button 
          onClick={onBack} 
          className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-primary">暴雨积涝监测</h1>
          <p className="text-[11px] text-on-surface-variant">实时水位监测 · 风险预警</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant">最新更新</p>
          <p className="text-xs font-semibold text-primary">14:32</p>
        </div>
      </header>

      <div className="px-4 pt-3 shrink-0">
        <div className="bg-white rounded-2xl p-1 border border-on-surface/10 flex gap-1">
          {[
            { id: 'map', icon: MapIcon, label: '地图总览' },
            { id: 'list', icon: List, label: '积水列表' },
            { id: 'stats', icon: BarChart3, label: '数据统计' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* 地图视图 */}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* 地图卡片 */}
              <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h2 className="font-bold text-primary flex items-center gap-2 text-sm">
                    <MapIcon className="w-4 h-4" />
                    天津市各区水位分布
                  </h2>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                    当前 {stats.high} 高风险
                  </span>
                </div>

                {/* Leaflet地图容器 */}
                <div 
                  id="flood-map" 
                  className="rounded-2xl border border-sky-100 flex-1 min-h-80 bg-sky-50 z-0"
                  style={{ minHeight: '320px' }}
                />

                {/* 图例 */}
                <div className="mt-3 grid grid-cols-3 gap-2 flex-shrink-0">
                  <div className="rounded-xl bg-white px-3 py-2 border border-on-surface/10 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-on-surface-variant">高风险</span>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 border border-on-surface/10 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs text-on-surface-variant">中风险</span>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 border border-on-surface/10 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs text-on-surface-variant">低风险</span>
                  </div>
                </div>
              </div>

              {/* 高风险积水点卡片 */}
              <div className="space-y-2">
                {FLOOD_POINTS.filter(p => p.severity === 'high').map((point) => (
                  <motion.button
                    key={point.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedPoint(point)}
                    className="w-full text-left rounded-2xl bg-white border border-on-surface/10 p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-on-surface">{point.district}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{point.name}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full border bg-red-50 text-red-600 border-red-200 font-semibold">高风险</span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs">
                      <span className="text-primary font-semibold">{point.depth} cm</span>
                      <span className="text-on-surface-variant">预测 {point.predictedDepth} cm</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 列表视图 */}
          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {FLOOD_POINTS.map((point, idx) => (
                <motion.button
                  key={point.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedPoint(point)}
                  className="w-full text-left rounded-3xl bg-white border border-on-surface/10 p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      point.severity === 'high' ? 'bg-red-50 text-red-600' :
                      point.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-on-surface">{point.district} · {point.name}</p>
                          <p className="text-xs text-on-surface-variant mt-1">{point.lastUpdate} 更新</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          point.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                          point.severity === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-green-50 text-green-600 border-green-200'
                        } font-semibold`}>
                          {point.severity === 'high' ? '🔴 高风险' : point.severity === 'medium' ? '🟡 中风险' : '🟢 低风险'}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-4 text-xs">
                        <span className="text-primary font-semibold">{point.depth} cm 现状</span>
                        <span className="text-on-surface-variant">{point.predictedDepth} cm 预测</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* 统计视图 */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* 概览卡片 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white border border-on-surface/10 p-3 text-center">
                  <p className="text-xs text-on-surface-variant mb-1.5">高风险</p>
                  <p className="text-2xl font-bold text-red-600">{stats.high}</p>
                </div>
                <div className="rounded-2xl bg-white border border-on-surface/10 p-3 text-center">
                  <p className="text-xs text-on-surface-variant mb-1.5">中风险</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.medium}</p>
                </div>
                <div className="rounded-2xl bg-white border border-on-surface/10 p-3 text-center">
                  <p className="text-xs text-on-surface-variant mb-1.5">低风险</p>
                  <p className="text-2xl font-bold text-green-600">{stats.low}</p>
                </div>
              </div>

              {/* 趋势图表 */}
              <div className="rounded-3xl bg-white border border-on-surface/10 p-4 shadow-sm">
                <h3 className="font-semibold text-primary text-sm mb-3">水位趋势（过去1小时）</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={STATISTICS}>
                      <defs>
                        <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.6)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.6)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="高" stroke="#ef4444" fill="url(#gradHigh)" />
                      <Area type="monotone" dataKey="中" stroke="#f59e0b" fill="url(#gradMed)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 风险分布柱状图 */}
              <div className="rounded-3xl bg-white border border-on-surface/10 p-4 shadow-sm">
                <h3 className="font-semibold text-primary text-sm mb-3">风险等级分布</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: '高风险', value: stats.high },
                      { name: '中风险', value: stats.medium },
                      { name: '低风险', value: stats.low }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.6)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.6)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 防灾建议 */}
              <div className="rounded-3xl bg-white border border-on-surface/10 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">防灾建议</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      当前监测到 {stats.high} 个高风险积水点，{stats.medium} 个中风险点。建议相关部门加强排水泵站运行，疏导交通，并向公众发布绕行提示。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 详情侧栏 */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed inset-y-0 right-0 w-96 bg-white border-l border-on-surface/10 shadow-lg z-50 flex flex-col overflow-hidden"
          >
            {/* 详情头部 */}
            <header className="shrink-0 border-b border-on-surface/10 bg-white/90 backdrop-blur px-6 h-16 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="font-semibold text-on-surface text-sm">{selectedPoint.name}</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{selectedPoint.district}</p>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </header>

            {/* 详情内容 */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* 水位数据 */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border ${
                  selectedPoint.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : selectedPoint.severity === 'medium'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <p className="text-xs text-on-surface-variant mb-2">现状水深</p>
                  <p className={`text-2xl font-bold ${
                    selectedPoint.severity === 'high' ? 'text-red-600' :
                    selectedPoint.severity === 'medium' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>{selectedPoint.depth}</p>
                  <p className="text-xs text-on-surface-variant mt-1">厘米</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <p className="text-xs text-on-surface-variant mb-2">预测水深</p>
                  <p className="text-2xl font-bold text-primary">{selectedPoint.predictedDepth}</p>
                  <p className="text-xs text-on-surface-variant mt-1">未来1小时</p>
                </div>
              </div>

              {/* 历史数据图 */}
              {selectedPoint.history.length > 0 && (
                <div className="rounded-2xl bg-white border border-on-surface/10 p-4">
                  <h3 className="text-xs font-semibold text-on-surface mb-3 uppercase tracking-wide">水位演变</h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedPoint.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.5)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="depth" stroke="#3b82f6" fill="url(#waterGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 信息卡片 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-on-surface/5 rounded-lg">
                  <span className="text-xs text-on-surface-variant">风险等级</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    selectedPoint.severity === 'high' ? 'bg-red-100 text-red-700' :
                    selectedPoint.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedPoint.severity === 'high' ? '🔴 高风险' : selectedPoint.severity === 'medium' ? '🟡 中风险' : '🟢 低风险'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-on-surface/5 rounded-lg">
                  <span className="text-xs text-on-surface-variant">最后更新</span>
                  <span className="text-xs font-semibold text-on-surface">{selectedPoint.lastUpdate}</span>
                </div>
              </div>

              {/* 防灾提示 */}
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-semibold mb-1">防灾提示</p>
                  <p className="leading-relaxed">
                    该区域正处于{selectedPoint.severity === 'high' ? '高风险' : selectedPoint.severity === 'medium' ? '中风险' : '低风险'}状态。建议行人和驾驶者避免通过该区域，等待排水完成。请关注官方实时预警。
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <button className="w-full flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/15 text-primary rounded-2xl font-semibold transition-colors text-sm">
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  查看绕行路线
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
