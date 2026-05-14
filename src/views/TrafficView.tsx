import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import MapContainer from '../components/MapContainer';
import {
  ChevronLeft,
  Train,
  Car,
  Map as MapIcon,
  List,
  Search,
  Sun,
  Cloud,
  CloudRain,
  AlertTriangle,
  Thermometer,
  Eye,
  Route,
  Activity,
  Clock3,
  Navigation,
  ShieldAlert,
  Droplets,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

type MetroWeather = 'sunny' | 'cloudy' | 'rainy';
type RiskLevel = 'low' | 'medium' | 'high';

interface MetroStation {
  id: string;
  name: string;
  lineId: string;
  lineName: string;
  lineColor: string;
  seq: number;
  weather: MetroWeather;
  temp: number;
  tip: string;
  lat: number;
  lng: number;
}

interface HighwayNode {
  id: string;
  name: string;
  route: string;
  roadTemp: number;
  visibility: number;
  rainDepth: number;
  windLevel: number;
  risk: RiskLevel;
  lat: number;
  lng: number;
  history: { time: string; visibility: number; roadTemp: number }[];
}

interface TrafficViewProps {
  onBack: () => void;
}

const METRO_LINES = [
  { id: 'l1', name: '1号线', color: '#e11d48' },
  { id: 'l2', name: '2号线', color: '#f59e0b' },
  { id: 'l3', name: '3号线', color: '#0284c7' },
  { id: 'l4', name: '4号线', color: '#14b8a6' },
  { id: 'l5', name: '5号线', color: '#22c55e' },
  { id: 'l6', name: '6号线', color: '#db2777' },
  { id: 'l7', name: '7号线', color: '#f43f5e' },
  { id: 'l8', name: '8号线', color: '#7c3aed' },
  { id: 'l9', name: '9号线', color: '#06b6d4' },
  { id: 'l10', name: '10号线', color: '#84cc16' },
  { id: 'l11', name: '11号线', color: '#ef4444' },
  { id: 'z4', name: 'Z4线', color: '#0ea5e9' },
  { id: 'jj', name: '津静线', color: '#10b981' },
];

const METRO_STATIONS: MetroStation[] = [
  {
    id: 'm1',
    name: '刘园',
    lineId: 'l1',
    lineName: '1号线',
    lineColor: '#e11d48',
    seq: 1,
    weather: 'sunny',
    temp: 24,
    tip: '地面站日照较强，出站后注意补水。',
    lat: 39.208,
    lng: 117.102,
  },
  {
    id: 'm2',
    name: '营口道',
    lineId: 'l1',
    lineName: '1号线',
    lineColor: '#e11d48',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '商圈换乘客流偏高，建议错峰通行。',
    lat: 39.123,
    lng: 117.195,
  },
  {
    id: 'm3',
    name: '双桥河',
    lineId: 'l1',
    lineName: '1号线',
    lineColor: '#e11d48',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '临水路段空气湿度偏高，注意防滑。',
    lat: 39.006,
    lng: 117.420,
  },
  {
    id: 'm4',
    name: '曹庄',
    lineId: 'l2',
    lineName: '2号线',
    lineColor: '#f59e0b',
    seq: 1,
    weather: 'sunny',
    temp: 23,
    tip: '站外通勤车流密集，建议地铁换乘优先。',
    lat: 39.145,
    lng: 117.060,
  },
  {
    id: 'm5',
    name: '天津站',
    lineId: 'l2',
    lineName: '2号线',
    lineColor: '#f59e0b',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '枢纽客流持续偏高，建议预留换乘时间。',
    lat: 39.136,
    lng: 117.212,
  },
  {
    id: 'm6',
    name: '滨海国际机场',
    lineId: 'l2',
    lineName: '2号线',
    lineColor: '#f59e0b',
    seq: 3,
    weather: 'rainy',
    temp: 21,
    tip: '机场一带有阵雨，行李转运注意防雨。',
    lat: 39.124,
    lng: 117.352,
  },
  {
    id: 'm7',
    name: '天津南站',
    lineId: 'l3',
    lineName: '3号线',
    lineColor: '#0284c7',
    seq: 1,
    weather: 'sunny',
    temp: 23,
    tip: '站前广场风速偏大，体感略凉。',
    lat: 39.033,
    lng: 117.012,
  },
  {
    id: 'm8',
    name: '天津大学',
    lineId: 'l3',
    lineName: '3号线',
    lineColor: '#0284c7',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '能见度良好，校园周边通行顺畅。',
    lat: 39.108,
    lng: 117.170,
  },
  {
    id: 'm9',
    name: '和平路',
    lineId: 'l3',
    lineName: '3号线',
    lineColor: '#0284c7',
    seq: 3,
    weather: 'cloudy',
    temp: 22,
    tip: '地面出口湿度偏高，注意电子设备防潮。',
    lat: 39.125,
    lng: 117.199,
  },
  {
    id: 'm10',
    name: '小街',
    lineId: 'l4',
    lineName: '4号线',
    lineColor: '#14b8a6',
    seq: 1,
    weather: 'cloudy',
    temp: 21,
    tip: '北部早晚温差较大，注意增减衣物。',
    lat: 39.255,
    lng: 117.143,
  },
  {
    id: 'm11',
    name: '西站',
    lineId: 'l4',
    lineName: '4号线',
    lineColor: '#14b8a6',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '换乘步行距离较长，注意脚下湿滑区域。',
    lat: 39.156,
    lng: 117.163,
  },
  {
    id: 'm12',
    name: '新兴村',
    lineId: 'l4',
    lineName: '4号线',
    lineColor: '#14b8a6',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '东部降雨概率偏高，出站请携带雨具。',
    lat: 39.180,
    lng: 117.330,
  },
  {
    id: 'm13',
    name: '北辰科技园北',
    lineId: 'l5',
    lineName: '5号线',
    lineColor: '#22c55e',
    seq: 1,
    weather: 'cloudy',
    temp: 22,
    tip: '园区路段有侧风，请注意步行安全。',
    lat: 39.263,
    lng: 117.180,
  },
  {
    id: 'm14',
    name: '文化中心',
    lineId: 'l5',
    lineName: '5号线',
    lineColor: '#22c55e',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '核心区湿度适中，通行条件稳定。',
    lat: 39.090,
    lng: 117.210,
  },
  {
    id: 'm15',
    name: '京华东道',
    lineId: 'l5',
    lineName: '5号线',
    lineColor: '#22c55e',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '市域联络段有短时降雨，注意防滑。',
    lat: 39.022,
    lng: 116.910,
  },
  {
    id: 'm16',
    name: '南孙庄',
    lineId: 'l6',
    lineName: '6号线',
    lineColor: '#db2777',
    seq: 1,
    weather: 'cloudy',
    temp: 21,
    tip: '东丽段风速稍高，注意保暖。',
    lat: 39.205,
    lng: 117.350,
  },
  {
    id: 'm17',
    name: '南翠屏',
    lineId: 'l6',
    lineName: '6号线',
    lineColor: '#db2777',
    seq: 2,
    weather: 'cloudy',
    temp: 21,
    tip: '公园侧风力较大，雨伞注意防翻。',
    lat: 39.071,
    lng: 117.145,
  },
  {
    id: 'm18',
    name: '天津宾馆',
    lineId: 'l6',
    lineName: '6号线',
    lineColor: '#db2777',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '降水概率较高，建议优先走地下连廊。',
    lat: 39.093,
    lng: 117.212,
  },
  {
    id: 'm19',
    name: '鼓楼',
    lineId: 'l7',
    lineName: '7号线',
    lineColor: '#f43f5e',
    seq: 1,
    weather: 'cloudy',
    temp: 22,
    tip: '老城区域游客较多，注意客流组织。',
    lat: 39.143,
    lng: 117.177,
  },
  {
    id: 'm20',
    name: '外院附中',
    lineId: 'l7',
    lineName: '7号线',
    lineColor: '#f43f5e',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '午后局地对流增强，建议关注站内提示。',
    lat: 39.178,
    lng: 117.168,
  },
  {
    id: 'm21',
    name: '赛达路',
    lineId: 'l7',
    lineName: '7号线',
    lineColor: '#f43f5e',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '西南段有阵雨，早高峰通行速度下降。',
    lat: 39.010,
    lng: 117.040,
  },
  {
    id: 'm22',
    name: '中北',
    lineId: 'l8',
    lineName: '8号线',
    lineColor: '#7c3aed',
    seq: 1,
    weather: 'cloudy',
    temp: 21,
    tip: '西部通勤强度高，建议错峰出行。',
    lat: 39.158,
    lng: 117.020,
  },
  {
    id: 'm23',
    name: '绿水公园',
    lineId: 'l8',
    lineName: '8号线',
    lineColor: '#7c3aed',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '公园周边能见度良好，步行舒适。',
    lat: 39.120,
    lng: 117.090,
  },
  {
    id: 'm24',
    name: '咸水沽西',
    lineId: 'l8',
    lineName: '8号线',
    lineColor: '#7c3aed',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '津南区降雨偏强，请注意站外积水。',
    lat: 38.990,
    lng: 117.390,
  },
  {
    id: 'm25',
    name: '天津站',
    lineId: 'l9',
    lineName: '9号线',
    lineColor: '#06b6d4',
    seq: 1,
    weather: 'cloudy',
    temp: 22,
    tip: '城际与地铁换乘需求高，建议分流。',
    lat: 39.136,
    lng: 117.212,
  },
  {
    id: 'm26',
    name: '塘沽',
    lineId: 'l9',
    lineName: '9号线',
    lineColor: '#06b6d4',
    seq: 2,
    weather: 'cloudy',
    temp: 21,
    tip: '滨海段海风明显，体感偏凉。',
    lat: 39.013,
    lng: 117.648,
  },
  {
    id: 'm27',
    name: '东海路',
    lineId: 'l9',
    lineName: '9号线',
    lineColor: '#06b6d4',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '临海路段风雨叠加，建议减速通行。',
    lat: 39.002,
    lng: 117.780,
  },
  {
    id: 'm28',
    name: '于台',
    lineId: 'l10',
    lineName: '10号线',
    lineColor: '#84cc16',
    seq: 1,
    weather: 'cloudy',
    temp: 21,
    tip: '南部地面温度较高，注意补水。',
    lat: 39.025,
    lng: 117.116,
  },
  {
    id: 'm29',
    name: '财经大学',
    lineId: 'l10',
    lineName: '10号线',
    lineColor: '#84cc16',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '高校片区客流稳定，通行效率较高。',
    lat: 39.092,
    lng: 117.255,
  },
  {
    id: 'm30',
    name: '屿东城',
    lineId: 'l10',
    lineName: '10号线',
    lineColor: '#84cc16',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '东部阵雨影响能见度，请注意安全。',
    lat: 39.183,
    lng: 117.318,
  },
  {
    id: 'm31',
    name: '水上公园西路',
    lineId: 'l11',
    lineName: '11号线',
    lineColor: '#ef4444',
    seq: 1,
    weather: 'cloudy',
    temp: 22,
    tip: '公园周边湿度偏高，注意地面积水。',
    lat: 39.100,
    lng: 117.140,
  },
  {
    id: 'm32',
    name: '文化中心',
    lineId: 'l11',
    lineName: '11号线',
    lineColor: '#ef4444',
    seq: 2,
    weather: 'cloudy',
    temp: 22,
    tip: '核心商务区通行稳定，风力中等。',
    lat: 39.090,
    lng: 117.210,
  },
  {
    id: 'm33',
    name: '东丽六经路',
    lineId: 'l11',
    lineName: '11号线',
    lineColor: '#ef4444',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '东丽片区有短时雨，建议备伞出行。',
    lat: 39.140,
    lng: 117.410,
  },
  {
    id: 'm34',
    name: '寨上',
    lineId: 'z4',
    lineName: 'Z4线',
    lineColor: '#0ea5e9',
    seq: 1,
    weather: 'cloudy',
    temp: 21,
    tip: '北部海风明显，体感偏凉。',
    lat: 39.230,
    lng: 117.800,
  },
  {
    id: 'm35',
    name: '汉沽',
    lineId: 'z4',
    lineName: 'Z4线',
    lineColor: '#0ea5e9',
    seq: 2,
    weather: 'cloudy',
    temp: 21,
    tip: '滨海北部湿度偏高，注意设备防潮。',
    lat: 39.250,
    lng: 117.830,
  },
  {
    id: 'm36',
    name: '北塘',
    lineId: 'z4',
    lineName: 'Z4线',
    lineColor: '#0ea5e9',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '沿海路段有阵雨大风，建议慢行。',
    lat: 39.190,
    lng: 117.710,
  },
  {
    id: 'm37',
    name: '京华东道',
    lineId: 'jj',
    lineName: '津静线',
    lineColor: '#10b981',
    seq: 1,
    weather: 'cloudy',
    temp: 21,
    tip: '市域换乘站点客流平稳。',
    lat: 39.022,
    lng: 116.910,
  },
  {
    id: 'm38',
    name: '团泊东区',
    lineId: 'jj',
    lineName: '津静线',
    lineColor: '#10b981',
    seq: 2,
    weather: 'cloudy',
    temp: 21,
    tip: '区域通勤线风力适中，通行顺畅。',
    lat: 38.980,
    lng: 117.000,
  },
  {
    id: 'm39',
    name: '团泊医学园',
    lineId: 'jj',
    lineName: '津静线',
    lineColor: '#10b981',
    seq: 3,
    weather: 'rainy',
    temp: 20,
    tip: '终点区域降雨偏强，请注意路面积水。',
    lat: 38.935,
    lng: 116.960,
  },
];

const HIGHWAY_NODES: HighwayNode[] = [
  {
    id: 'h1',
    name: 'G1 京哈高速 宝坻段',
    route: 'G1 京哈高速',
    roadTemp: 27.3,
    visibility: 4.8,
    rainDepth: 1.2,
    windLevel: 4,
    risk: 'low',
    lat: 39.743,
    lng: 117.312,
    history: [
      { time: '11:30', visibility: 5.2, roadTemp: 25.1 },
      { time: '12:00', visibility: 5.0, roadTemp: 26.0 },
      { time: '12:30', visibility: 4.8, roadTemp: 27.3 },
    ],
  },
  {
    id: 'h2',
    name: 'S40 津滨高速 空港段',
    route: 'S40 津滨高速',
    roadTemp: 30.6,
    visibility: 2.2,
    rainDepth: 6.4,
    windLevel: 6,
    risk: 'medium',
    lat: 39.152,
    lng: 117.406,
    history: [
      { time: '11:30', visibility: 3.1, roadTemp: 28.2 },
      { time: '12:00', visibility: 2.7, roadTemp: 29.4 },
      { time: '12:30', visibility: 2.2, roadTemp: 30.6 },
    ],
  },
  {
    id: 'h3',
    name: 'G0111 秦滨高速 南港段',
    route: 'G0111 秦滨高速',
    roadTemp: 31.2,
    visibility: 1.1,
    rainDepth: 11.8,
    windLevel: 7,
    risk: 'high',
    lat: 38.926,
    lng: 117.706,
    history: [
      { time: '11:30', visibility: 2.4, roadTemp: 29.5 },
      { time: '12:00', visibility: 1.8, roadTemp: 30.1 },
      { time: '12:30', visibility: 1.1, roadTemp: 31.2 },
    ],
  },
  {
    id: 'h4',
    name: 'G25 长深高速 静海段',
    route: 'G25 长深高速',
    roadTemp: 28.9,
    visibility: 1.6,
    rainDepth: 8.3,
    windLevel: 6,
    risk: 'high',
    lat: 38.941,
    lng: 116.914,
    history: [
      { time: '11:30', visibility: 2.3, roadTemp: 27.4 },
      { time: '12:00', visibility: 2.0, roadTemp: 28.1 },
      { time: '12:30', visibility: 1.6, roadTemp: 28.9 },
    ],
  },
];

function weatherIcon(type: MetroWeather) {
  if (type === 'sunny') return <Sun className="w-4 h-4 text-amber-500" />;
  if (type === 'rainy') return <CloudRain className="w-4 h-4 text-sky-500" />;
  return <Cloud className="w-4 h-4 text-slate-500" />;
}

function riskBadgeClass(risk: RiskLevel): string {
  if (risk === 'high') return 'bg-red-50 text-red-600 border-red-200';
  if (risk === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function markerColor(risk: RiskLevel): string {
  if (risk === 'high') return '#ef4444';
  if (risk === 'medium') return '#f59e0b';
  return '#10b981';
}

export default function TrafficView({ onBack }: TrafficViewProps) {
  const [activeSegment, setActiveSegment] = useState<'metro' | 'highway'>('metro');
  const [metroMode, setMetroMode] = useState<'map' | 'list'>('map');
  const [highwayMode, setHighwayMode] = useState<'map' | 'list'>('map');
  const [selectedLineId, setSelectedLineId] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedNode, setSelectedNode] = useState<HighwayNode | null>(null);

  const metroStations = useMemo(() => {
    const byLine =
      selectedLineId === 'all'
        ? METRO_STATIONS
        : METRO_STATIONS.filter((station) => station.lineId === selectedLineId);

    if (!searchText.trim()) return byLine;
    return byLine.filter((station) => station.name.includes(searchText.trim()));
  }, [selectedLineId, searchText]);

  const metroLinePaths = useMemo(() => {
    const baseStations =
      selectedLineId === 'all'
        ? METRO_STATIONS
        : METRO_STATIONS.filter((station) => station.lineId === selectedLineId);

    const grouped = baseStations.reduce<Record<string, MetroStation[]>>((acc, station) => {
      if (!acc[station.lineId]) {
        acc[station.lineId] = [];
      }
      acc[station.lineId].push(station);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((stations) => stations.sort((a, b) => a.seq - b.seq))
      .filter((stations) => stations.length >= 2)
      .map((stations) => ({
        lineId: stations[0].lineId,
        lineColor: stations[0].lineColor,
        positions: stations.map((station) => [station.lat, station.lng] as [number, number]),
      }));
  }, [selectedLineId]);

  const highwayStats = useMemo(() => {
    const high = HIGHWAY_NODES.filter((n) => n.risk === 'high').length;
    const medium = HIGHWAY_NODES.filter((n) => n.risk === 'medium').length;
    const low = HIGHWAY_NODES.filter((n) => n.risk === 'low').length;
    return { high, medium, low };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background text-on-surface">
      <header className="h-16 shrink-0 border-b border-on-surface/10 bg-white/90 backdrop-blur px-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-primary truncate">交通哨兵</h1>
          <p className="text-[11px] text-on-surface-variant truncate">地铁气象 · 高速风险 · 实时路况感知</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-on-surface-variant">最新更新</p>
          <p className="text-xs font-semibold text-primary">12:30</p>
        </div>
      </header>

      <div className="px-4 pt-3 shrink-0 space-y-3">
        <div className="bg-white rounded-2xl p-1 border border-on-surface/10 flex gap-1">
          {[
            { id: 'metro', icon: Train, label: '地铁气象' },
            { id: 'highway', icon: Car, label: '高速天气' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSegment(item.id as 'metro' | 'highway')}
              className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeSegment === item.id ? 'bg-primary text-white' : 'text-on-surface-variant'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {activeSegment === 'metro' && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
            <div className="bg-white rounded-xl border border-on-surface/10 h-10 px-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-on-surface-variant" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索站点"
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-on-surface-variant"
              />
            </div>
            <div className="bg-white rounded-xl border border-on-surface/10 p-1 flex gap-1">
              <button
                onClick={() => setMetroMode('map')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  metroMode === 'map' ? 'bg-primary text-white' : 'text-on-surface-variant'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />地图
              </button>
              <button
                onClick={() => setMetroMode('list')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  metroMode === 'list' ? 'bg-primary text-white' : 'text-on-surface-variant'
                }`}
              >
                <List className="w-3.5 h-3.5" />列表
              </button>
            </div>
          </div>
        )}

        {activeSegment === 'highway' && (
          <div className="bg-white rounded-xl border border-on-surface/10 p-1 flex gap-1 w-fit">
            <button
              onClick={() => setHighwayMode('map')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                highwayMode === 'map' ? 'bg-primary text-white' : 'text-on-surface-variant'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />地图
            </button>
            <button
              onClick={() => setHighwayMode('list')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                highwayMode === 'list' ? 'bg-primary text-white' : 'text-on-surface-variant'
              }`}
            >
              <List className="w-3.5 h-3.5" />列表
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-4">
        <AnimatePresence mode="wait">
          {activeSegment === 'metro' ? (
            <motion.section key="metro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedLineId('all')}
                  className={`h-8 px-3 rounded-full text-xs font-semibold border shrink-0 ${
                    selectedLineId === 'all'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-white text-on-surface-variant border-on-surface/10'
                  }`}
                >
                  全部线路
                </button>
                {METRO_LINES.map((line) => (
                  <button
                    key={line.id}
                    onClick={() => setSelectedLineId(line.id)}
                    className={`h-8 px-3 rounded-full text-xs font-semibold border shrink-0 flex items-center gap-2 ${
                      selectedLineId === line.id
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-white text-on-surface-variant border-on-surface/10'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
                    {line.name}
                  </button>
                ))}
              </div>

              {metroMode === 'map' ? (
                <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-primary text-sm flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      地铁站点气象分布
                    </h2>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                      线路 {metroLinePaths.length} 条 · 站点 {metroStations.length} 个
                    </span>
                  </div>
                  <div className="rounded-2xl border border-sky-100 overflow-hidden h-[360px] bg-sky-50">
                    <MapContainer center={[39.1255, 117.1901]} zoom={11} mapTypeId="roadmap">
                      {metroLinePaths.map((line) => (
                        <Polyline
                          key={line.lineId}
                          positions={line.positions}
                          pathOptions={{ color: line.lineColor, weight: 4, opacity: 0.75 }}
                        />
                      ))}

                      {metroStations.map((station) => {
                        const stationIcon = L.divIcon({
                          className: '',
                          html: `<div style="width:20px;height:20px;border-radius:999px;background:${station.lineColor};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10],
                        });

                        return (
                          <Marker key={station.id} position={[station.lat, station.lng]} icon={stationIcon}>
                            <Popup>
                              <div className="text-sm">
                                <p className="font-semibold text-slate-700">{station.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{station.lineName} · {station.temp}°C</p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {metroStations.map((station) => (
                    <div key={station.id} className="rounded-2xl bg-white border border-on-surface/10 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{station.name}</p>
                          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: station.lineColor }} />
                            {station.lineName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{station.temp}°</p>
                          <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                            {weatherIcon(station.weather)}
                            {station.weather === 'sunny' ? '晴' : station.weather === 'rainy' ? '雨' : '多云'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2 text-xs text-slate-700">
                        {station.tip}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          ) : (
            <motion.section key="highway" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-red-50 border border-red-100 p-3">
                  <p className="text-[11px] text-red-600">高风险</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{highwayStats.high}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                  <p className="text-[11px] text-amber-700">中风险</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">{highwayStats.medium}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[11px] text-emerald-700">低风险</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{highwayStats.low}</p>
                </div>
              </div>

              {highwayMode === 'map' ? (
                <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-primary text-sm flex items-center gap-2">
                      <Route className="w-4 h-4" />
                      高速气象风险图
                    </h2>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                      监测点 {HIGHWAY_NODES.length}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-sky-100 overflow-hidden h-[360px] bg-sky-50">
                    <MapContainer center={[39.12, 117.2]} zoom={9} mapTypeId="roadmap">
                      {HIGHWAY_NODES.map((node) => {
                        const color = markerColor(node.risk);
                        const icon = L.divIcon({
                          className: '',
                          html: `<div style="width:24px;height:24px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.25)"></div>`,
                          iconSize: [24, 24],
                          iconAnchor: [12, 12],
                        });
                        return (
                          <Marker
                            key={node.id}
                            position={[node.lat, node.lng]}
                            icon={icon}
                            eventHandlers={{ click: () => setSelectedNode(node) }}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-semibold text-slate-700">{node.name}</p>
                                <p className="text-xs text-slate-500 mt-1">能见度 {node.visibility}km · 路温 {node.roadTemp}°C</p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {HIGHWAY_NODES.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="w-full rounded-2xl bg-white border border-on-surface/10 p-4 shadow-sm text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{node.name}</p>
                          <p className="text-xs text-on-surface-variant mt-1">{node.route}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${riskBadgeClass(node.risk)}`}>
                          {node.risk === 'high' ? '高风险' : node.risk === 'medium' ? '中风险' : '低风险'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 px-2 py-2 flex items-center gap-1.5 text-slate-600">
                          <Eye className="w-3.5 h-3.5" />
                          {node.visibility}km
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 flex items-center gap-1.5 text-slate-600">
                          <Thermometer className="w-3.5 h-3.5" />
                          {node.roadTemp}°C
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 flex items-center gap-1.5 text-slate-600">
                          <Droplets className="w-3.5 h-3.5" />
                          {node.rainDepth}mm
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-md">
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4" />
                  路段风险分布
                </h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: '高风险', value: highwayStats.high, fill: '#ef4444' },
                        { name: '中风险', value: highwayStats.medium, fill: '#f59e0b' },
                        { name: '低风险', value: highwayStats.low, fill: '#10b981' },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-[90] rounded-t-3xl bg-white border-t border-on-surface/10 shadow-[0_-10px_40px_rgba(15,23,42,0.14)] px-4 pt-4 pb-6 max-h-[78vh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 rounded-full bg-slate-200 mx-auto mb-4" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-on-surface">{selectedNode.name}</p>
                <p className="text-xs text-on-surface-variant mt-1">{selectedNode.route}</p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3">
                <p className="text-[11px] text-orange-700">路温</p>
                <p className="text-lg font-bold text-orange-700 mt-1">{selectedNode.roadTemp}°</p>
              </div>
              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-3">
                <p className="text-[11px] text-sky-700">能见度</p>
                <p className="text-lg font-bold text-sky-700 mt-1">{selectedNode.visibility}km</p>
              </div>
              <div className="rounded-2xl bg-cyan-50 border border-cyan-100 p-3">
                <p className="text-[11px] text-cyan-700">积水</p>
                <p className="text-lg font-bold text-cyan-700 mt-1">{selectedNode.rainDepth}mm</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-on-surface/10 p-3">
              <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2">
                <Clock3 className="w-3.5 h-3.5" />
                近一小时变化
              </h4>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedNode.history}>
                    <defs>
                      <linearGradient id="visibilityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="visibility" stroke="#3b82f6" strokeWidth={2.5} fill="url(#visibilityGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-sky-50 border border-sky-100 p-3 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                出行建议
              </p>
              <p className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 高风险路段建议限速并拉大车距。</p>
              <p className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-sky-500" /> 避开桥面横风区，优先选择替代路线。</p>
              <p className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-cyan-500" /> 雨后路面附着力下降，避免急刹急转。</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}