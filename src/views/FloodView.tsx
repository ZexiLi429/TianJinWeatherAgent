import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, MapPin, AlertCircle, List, Map as MapIcon, BarChart3, Navigation, 
  Droplets, TrendingUp, ChevronRight, Info, Loader
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchFloodWarnings } from '../services/floodWarningService';
import { fetchWeatherWarnings, fetchPrecipitationData, assessFloodRisk } from '../services/qweatherService';

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
  description?: string;
  history?: { time: string; depth: number }[];
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
  const [floodPoints, setFloodPoints] = useState<FloodPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [weatherWarnings, setWeatherWarnings] = useState<any[]>([]);
  const [precipData, setPrecipData] = useState<any | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // 默认降级数据（当API不可用时使用）
  const DEFAULT_FLOOD_POINTS: FloodPoint[] = [
    // 滨海新区 (2个)
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
      description: '高风险积水点，需要加强排水',
      history: [
        { time: '14:00', depth: 28 },
        { time: '14:15', depth: 30 },
        { time: '14:30', depth: 34.1 },
        { time: '14:45', depth: 38 },
      ]
    },
    {
      id: 'f1b',
      name: '滨海新区塘沽海河南路立交',
      district: '滨海新区',
      severity: 'high',
      depth: 31.5,
      predictedDepth: 38.0,
      lat: 39.00,
      lng: 117.73,
      lastUpdate: '14:30',
      description: '立交低洼处',
      history: [
        { time: '14:00', depth: 25 },
        { time: '14:15', depth: 28 },
        { time: '14:30', depth: 31.5 },
        { time: '14:45', depth: 35 },
      ]
    },
    // 西青区 (2个)
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
      description: '地下停车场易积水',
      history: [
        { time: '14:00', depth: 8 },
        { time: '14:15', depth: 15 },
        { time: '14:30', depth: 22.5 },
        { time: '14:45', depth: 23.5 },
      ]
    },
    {
      id: 'f2b',
      name: '西青区中北镇李家屋村',
      district: '西青区',
      severity: 'medium',
      depth: 18.2,
      predictedDepth: 20.0,
      lat: 38.95,
      lng: 116.85,
      lastUpdate: '14:29',
      description: '低洼农田',
      history: [
        { time: '14:00', depth: 12 },
        { time: '14:15', depth: 15 },
        { time: '14:30', depth: 18.2 },
        { time: '14:45', depth: 19.5 },
      ]
    },
    // 武清区 (2个)
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
      description: '铁路涵洞低洼地势',
      history: [
        { time: '14:00', depth: 20 },
        { time: '14:15', depth: 22 },
        { time: '14:30', depth: 28.4 },
        { time: '14:45', depth: 29.5 },
      ]
    },
    {
      id: 'f3b',
      name: '武清区城关镇新华路',
      district: '武清区',
      severity: 'medium',
      depth: 15.3,
      predictedDepth: 17.5,
      lat: 39.38,
      lng: 116.90,
      lastUpdate: '14:27',
      description: '路面低洼',
      history: [
        { time: '14:00', depth: 10 },
        { time: '14:15', depth: 12 },
        { time: '14:30', depth: 15.3 },
        { time: '14:45', depth: 16.2 },
      ]
    },
    // 河西区 (2个)
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
      description: '监测点，水位逐渐下降',
      history: [
        { time: '14:00', depth: 8 },
        { time: '14:15', depth: 6 },
        { time: '14:30', depth: 5.2 },
        { time: '14:45', depth: 4.5 },
      ]
    },
    {
      id: 'f4b',
      name: '河西区梅江道下沉广场',
      district: '河西区',
      severity: 'low',
      depth: 2.8,
      predictedDepth: 1.5,
      lat: 39.08,
      lng: 117.00,
      lastUpdate: '14:34',
      description: '广场积水即将排干',
      history: [
        { time: '14:00', depth: 6 },
        { time: '14:15', depth: 4 },
        { time: '14:30', depth: 2.8 },
        { time: '14:45', depth: 1.5 },
      ]
    },
    // 东丽区 (2个)
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
      description: '路口低洼处',
      history: [
        { time: '14:00', depth: 6 },
        { time: '14:15', depth: 9 },
        { time: '14:30', depth: 12.8 },
        { time: '14:45', depth: 13.5 },
      ]
    },
    {
      id: 'f5b',
      name: '东丽区军粮城地铁站',
      district: '东丽区',
      severity: 'low',
      depth: 3.5,
      predictedDepth: 2.0,
      lat: 39.05,
      lng: 117.45,
      lastUpdate: '14:31',
      description: '地铁站出入口',
      history: [
        { time: '14:00', depth: 8 },
        { time: '14:15', depth: 6 },
        { time: '14:30', depth: 3.5 },
        { time: '14:45', depth: 2.0 },
      ]
    },
    // 红桥区 (2个)
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
      description: '地下通道易积水',
      history: [
        { time: '14:00', depth: 4 },
        { time: '14:15', depth: 6 },
        { time: '14:30', depth: 8.5 },
        { time: '14:45', depth: 9.2 },
      ]
    },
    {
      id: 'f6b',
      name: '红桥区三条石路高架',
      district: '红桥区',
      severity: 'low',
      depth: 4.2,
      predictedDepth: 2.0,
      lat: 39.20,
      lng: 117.15,
      lastUpdate: '14:32',
      description: '高架下积水',
      history: [
        { time: '14:00', depth: 9 },
        { time: '14:15', depth: 7 },
        { time: '14:30', depth: 4.2 },
        { time: '14:45', depth: 2.0 },
      ]
    },
    // 南开区 (2个)
    {
      id: 'f7',
      name: '南开区广开四马路',
      district: '南开区',
      severity: 'low',
      depth: 1.2,
      predictedDepth: 0.5,
      lat: 39.08,
      lng: 117.13,
      lastUpdate: '14:33',
      description: '轻微积水',
      history: [
        { time: '14:00', depth: 3 },
        { time: '14:15', depth: 2 },
        { time: '14:30', depth: 1.2 },
        { time: '14:45', depth: 0.5 },
      ]
    },
    {
      id: 'f7b',
      name: '南开区鼓楼广场',
      district: '南开区',
      severity: 'low',
      depth: 0.8,
      predictedDepth: 0.0,
      lat: 39.10,
      lng: 117.08,
      lastUpdate: '14:34',
      description: '积水即将完全排干',
      history: [
        { time: '14:00', depth: 2 },
        { time: '14:15', depth: 1 },
        { time: '14:30', depth: 0.8 },
        { time: '14:45', depth: 0.0 },
      ]
    },
    // 河东区 (1个)
    {
      id: 'f8',
      name: '河东区世纪广场地下停车场',
      district: '河东区',
      severity: 'medium',
      depth: 11.5,
      predictedDepth: 12.0,
      lat: 39.12,
      lng: 117.22,
      lastUpdate: '14:30',
      description: '地下停车场',
      history: [
        { time: '14:00', depth: 8 },
        { time: '14:15', depth: 10 },
        { time: '14:30', depth: 11.5 },
        { time: '14:45', depth: 12.0 },
      ]
    },
    // 河北区 (1个)
    {
      id: 'f9',
      name: '河北区金狮广场',
      district: '河北区',
      severity: 'low',
      depth: 2.3,
      predictedDepth: 1.0,
      lat: 39.17,
      lng: 117.18,
      lastUpdate: '14:32',
      description: '广场低洼处',
      history: [
        { time: '14:00', depth: 5 },
        { time: '14:15', depth: 4 },
        { time: '14:30', depth: 2.3 },
        { time: '14:45', depth: 1.0 },
      ]
    },
    // 和平区 (1个)
    {
      id: 'f10',
      name: '和平区南京路下沉广场',
      district: '和平区',
      severity: 'low',
      depth: 0.5,
      predictedDepth: 0.0,
      lat: 39.05,
      lng: 117.20,
      lastUpdate: '14:35',
      description: '轻微积水即将排干',
      history: [
        { time: '14:00', depth: 2 },
        { time: '14:15', depth: 1 },
        { time: '14:30', depth: 0.5 },
        { time: '14:45', depth: 0.0 },
      ]
    },
    // 北辰区 (1个)
    {
      id: 'f11',
      name: '北辰区辰阳路高架',
      district: '北辰区',
      severity: 'low',
      depth: 6.8,
      predictedDepth: 5.0,
      lat: 39.28,
      lng: 117.12,
      lastUpdate: '14:28',
      description: '高架下积水',
      history: [
        { time: '14:00', depth: 12 },
        { time: '14:15', depth: 10 },
        { time: '14:30', depth: 6.8 },
        { time: '14:45', depth: 5.0 },
      ]
    },
    // 津南区 (1个)
    {
      id: 'f12',
      name: '津南区小站路低洼地',
      district: '津南区',
      severity: 'medium',
      depth: 19.5,
      predictedDepth: 21.0,
      lat: 38.92,
      lng: 117.15,
      lastUpdate: '14:29',
      description: '农业灌溉区低洼',
      history: [
        { time: '14:00', depth: 14 },
        { time: '14:15', depth: 16 },
        { time: '14:30', depth: 19.5 },
        { time: '14:45', depth: 21.0 },
      ]
    },
    // 宝坻区 (1个)
    {
      id: 'f13',
      name: '宝坻区城北部新城',
      district: '宝坻区',
      severity: 'low',
      depth: 7.2,
      predictedDepth: 5.5,
      lat: 39.52,
      lng: 117.35,
      lastUpdate: '14:31',
      description: '开发区低洼',
      history: [
        { time: '14:00', depth: 14 },
        { time: '14:15', depth: 11 },
        { time: '14:30', depth: 7.2 },
        { time: '14:45', depth: 5.5 },
      ]
    },
    // 静海区 (1个)
    {
      id: 'f14',
      name: '静海区独流镇',
      district: '静海区',
      severity: 'medium',
      depth: 16.8,
      predictedDepth: 18.5,
      lat: 38.70,
      lng: 117.18,
      lastUpdate: '14:30',
      description: '镇区道路',
      history: [
        { time: '14:00', depth: 12 },
        { time: '14:15', depth: 14 },
        { time: '14:30', depth: 16.8 },
        { time: '14:45', depth: 18.5 },
      ]
    },
    // 蓟州区 (1个)
    {
      id: 'f15',
      name: '蓟州区县城主干道',
      district: '蓟州区',
      severity: 'low',
      depth: 9.5,
      predictedDepth: 8.0,
      lat: 40.00,
      lng: 117.42,
      lastUpdate: '14:32',
      description: '山区县城',
      history: [
        { time: '14:00', depth: 18 },
        { time: '14:15', depth: 14 },
        { time: '14:30', depth: 9.5 },
        { time: '14:45', depth: 8.0 },
      ]
    },
    // 宁河区 (1个)
    {
      id: 'f16',
      name: '宁河区滨河新城',
      district: '宁河区',
      severity: 'low',
      depth: 5.2,
      predictedDepth: 3.5,
      lat: 39.42,
      lng: 117.50,
      lastUpdate: '14:33',
      description: '城市积涝点',
      history: [
        { time: '14:00', depth: 10 },
        { time: '14:15', depth: 8 },
        { time: '14:30', depth: 5.2 },
        { time: '14:45', depth: 3.5 },
      ]
    },
  ];

  // 加载真实数据
  useEffect(() => {
    const loadFloodData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 并行获取三种数据
        const [floodData, weatherWarns, riskAssess] = await Promise.all([
          fetchFloodWarnings(),
          fetchWeatherWarnings(),
          assessFloodRisk(),
        ]);
        
        // 处理积涝数据
        if (floodData && floodData.length > 0) {
          setFloodPoints(floodData);
          console.log(`✅ 积涝监测：${floodData.length} 个预警点`);
        } else {
          setFloodPoints(DEFAULT_FLOOD_POINTS);
          console.log('⚠️ 积涝数据不可用，使用本地数据');
        }
        
        // 处理天气预警数据
        if (weatherWarns && weatherWarns.length > 0) {
          setWeatherWarnings(weatherWarns);
          console.log(`✅ 气象预警：${weatherWarns.length} 条暴雨预警`);
        }
        
        // 处理降水数据
        if (riskAssess?.precipData) {
          setPrecipData(riskAssess.precipData);
          setRiskLevel(riskAssess.riskLevel);
          console.log(`✅ 降水监测：${riskAssess.precipData.precipitation}mm，风险等级${riskAssess.riskLevel}`);
        }
        
        // 更新时间戳
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('数据加载失败，使用本地数据');
        setFloodPoints(DEFAULT_FLOOD_POINTS);
      } finally {
        setLoading(false);
      }
    };

    loadFloodData();
  }, []);

  // 计算统计数据
  const stats = useMemo(() => {
    const high = floodPoints.filter(p => p.severity === 'high').length;
    const medium = floodPoints.filter(p => p.severity === 'medium').length;
    const low = floodPoints.filter(p => p.severity === 'low').length;
    return { high, medium, low, total: floodPoints.length };
  }, [floodPoints]);

  // 初始化Leaflet地图
  useEffect(() => {
    if (activeTab !== 'map') {
      // 当切换离开地图时，清理地图实例
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }
    
    // 如果地图容器不存在，返回
    const mapContainer = document.getElementById('flood-map');
    if (!mapContainer) return;

    // 如果地图已经存在，不需要重新创建
    if (mapRef.current) return;

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
    floodPoints.forEach((point) => {
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

    // 清理函数：离开地图时清理
    return () => {
      // 不在这里删除地图，让useEffect的开头来处理
    };
  }, [activeTab, floodPoints]);

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
          <p className="text-xs font-semibold text-primary">{lastUpdate || '加载中...'}</p>
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
        {/* 数据源提示 */}
        {!loading && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              {floodPoints.length > 0 ? (
                error ? '使用本地数据 (API 不可用)' : '实时数据已加载'
              ) : '无积涝预警数据'}
            </p>
          </div>
        )}
        
        {/* 和风天气数据显示 */}
        {!loading && (precipData || weatherWarnings.length > 0) && (
          <div className="mt-2 space-y-2">
            {/* 实时降水数据 */}
            {precipData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${
                  riskLevel === 'high'
                    ? 'bg-red-50 border-red-200'
                    : riskLevel === 'medium'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <Droplets
                  className={`w-4 h-4 shrink-0 ${
                    riskLevel === 'high'
                      ? 'text-red-600'
                      : riskLevel === 'medium'
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      riskLevel === 'high'
                        ? 'text-red-700'
                        : riskLevel === 'medium'
                        ? 'text-orange-700'
                        : 'text-green-700'
                    }`}
                  >
                    降水量: {precipData.precipitation.toFixed(1)}mm · {precipData.intensity === 'extreme' ? '极端' : precipData.intensity === 'heavy' ? '强' : precipData.intensity === 'moderate' ? '中' : '弱'}降水
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* 气象预警信息 */}
            {weatherWarnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-2 rounded-xl bg-red-50 border border-red-200"
              >
                <p className="text-xs font-semibold text-red-700">
                  ⚠️ 气象预警: {weatherWarnings.length} 条
                </p>
                <div className="mt-1 space-y-1">
                  {weatherWarnings.slice(0, 2).map((w, idx) => (
                    <p key={idx} className="text-xs text-red-600 line-clamp-1">
                      {w.title}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-sm text-on-surface-variant">加载积涝预警数据中...</p>
            </div>
          </div>
        )}
        {!loading && floodPoints.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-2">
              <Droplets className="w-12 h-12 text-on-surface-variant/30 mx-auto" />
              <p className="text-sm text-on-surface-variant">暂无积涝预警数据</p>
            </div>
          </div>
        )}
        {!loading && floodPoints.length > 0 && (
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
                {floodPoints.filter(p => p.severity === 'high').map((point) => (
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
              {floodPoints.map((point, idx) => (
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
        )}
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
              {selectedPoint.history && selectedPoint.history.length > 0 && (
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
