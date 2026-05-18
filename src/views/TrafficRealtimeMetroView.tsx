import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import MapContainer from '../components/MapContainer';
import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronLeft,
  Cloud,
  CloudRain,
  Loader2,
  MapPin,
  Search,
  ShieldAlert,
  Sun,
  Thermometer,
  Train,
  Wind,
} from 'lucide-react';
import {
  fetchTianjinMetroNetwork,
  fuzzySearchStations,
  MetroStationPoint,
  TIANJIN_METRO_LINES,
} from '../services/tianjinMetroService';
import {
  fetchCurrentWeatherByCoords,
  weatherCodeToText,
  windDirToText,
  windSpeedToLevel,
  aqiToText,
  CurrentWeather,
} from '../services/weatherService';
import { fetchLatestOfficialWarning, OfficialWarning } from '../services/officialWarningService';
import { fetchRealTimeTraffic, fetchTrafficIndex, getCongestionText } from '../services/aMapService';
import {
  HighwayPoint,
  HighwayRouteCard,
  TIANJIN_HIGHWAY_ROUTES,
  fetchTianjinHighwayDashboard,
  fetchTianjinHighwayRouteCard,
} from '../services/highwayService';

interface StationLiveData {
  weather: CurrentWeather;
  warning: OfficialWarning | null;
  advice: string[];
  trafficText: string;
}

type TrafficMode = 'metro' | 'highway';

interface Props {
  onBack: () => void;
}

function stationAdvice(weather: CurrentWeather): string[] {
  const tips: string[] = [];
  if (weather.weatherCode >= 51 && weather.weatherCode <= 99) {
    tips.push('站外可能有降雨，注意站口与换乘通道湿滑。');
  }
  if (weather.windSpeed >= 8) {
    tips.push('当前风力偏强，高架站和出入口注意横风。');
  }
  if (weather.temp >= 30) {
    tips.push('体感偏热，建议补水并避开长时间地面步行。');
  }
  if (weather.temp <= 8) {
    tips.push('体感偏冷，建议增加保暖层。');
  }
  if (tips.length === 0) {
    tips.push('天气平稳，按常规通勤节奏出行即可。');
  }
  return tips;
}

function weatherIcon(code: number) {
  if (code === 0) return <Sun className="w-4 h-4 text-amber-500" />;
  if (code >= 51) return <CloudRain className="w-4 h-4 text-sky-500" />;
  return <Cloud className="w-4 h-4 text-slate-500" />;
}

function createStationIcon(color: string, active: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${active ? 22 : 16}px;height:${active ? 22 : 16}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.25)"></div>`,
    iconSize: [active ? 22 : 16, active ? 22 : 16],
    iconAnchor: [active ? 11 : 8, active ? 11 : 8],
  });
}

function createHighwayIcon(risk: HighwayPoint['risk']) {
  const color = risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#10b981';
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.25)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function riskBadgeClass(risk: HighwayPoint['risk']): string {
  if (risk === 'high') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (risk === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function highwaySuggestion(node: HighwayPoint): string[] {
  const tips: string[] = [];
  if (node.risk === 'high') tips.push('当前为高风险路段，建议减速并保持更大车距。');
  if (node.risk === 'medium') tips.push('路况波动明显，建议提前规划替代路线。');
  if (node.type === '桥梁' || node.type === '互通立交' || node.type === '匝道') tips.push('桥梁、互通和匝道更容易出现急变道与横风影响。');
  if (node.weather.weatherCode >= 51) tips.push(`当前天气：${weatherCodeToText(node.weather.weatherCode)}，雨天注意积水与制动距离。`);
  if (node.weather.windSpeed >= 8) tips.push('风力偏大，桥梁和高架段注意横风。');
  if (node.trafficSpeed !== null && node.trafficSpeed < 20) tips.push('周边路况偏慢，建议错峰或改走替代路线。');
  if (tips.length === 0) tips.push('整体较平稳，保持正常车速即可。');
  return tips;
}

function routeStatusText(route: HighwayRouteCard): string {
  return route.trafficText || '暂无实时路况';
}

export default function TrafficRealtimeMetroView({ onBack }: Props) {
  const [activeMode, setActiveMode] = useState<TrafficMode>('metro');
  const [network, setNetwork] = useState<Record<string, MetroStationPoint[]>>({});
  const [networkLoading, setNetworkLoading] = useState(true);
  const [selectedLineId, setSelectedLineId] = useState('l1');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [liveMap, setLiveMap] = useState<Record<string, StationLiveData>>({});
  const [lineLoading, setLineLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [center, setCenter] = useState<[number, number]>([39.1255, 117.1901]);
  const [zoom, setZoom] = useState(11);
  const [trafficIndex, setTrafficIndex] = useState<{ index: number; level: string; description: string } | null>(null);
  const [highwayLoading, setHighwayLoading] = useState(false);
  const [highwayRoutes, setHighwayRoutes] = useState<HighwayRouteCard[]>([]);
  const [selectedHighwayRouteId, setSelectedHighwayRouteId] = useState<'all' | string>('all');
  const [selectedHighwayPointId, setSelectedHighwayPointId] = useState<string | null>(null);
  const [highwayOnlyHighRisk, setHighwayOnlyHighRisk] = useState(false);
  const [highwayPanels, setHighwayPanels] = useState({
    routeCards: true,
    floodPoints: true,
    accidentTips: true,
  });

  const lineMeta = TIANJIN_METRO_LINES.find((line) => line.id === selectedLineId) || TIANJIN_METRO_LINES[0];
  const selectedLineStations = network[selectedLineId] || [];
  const selectedHighwayRoute = useMemo(
    () => highwayRoutes.find((route) => route.id === selectedHighwayRouteId) || null,
    [highwayRoutes, selectedHighwayRouteId]
  );

  const routeCatalog = useMemo(() => {
    if (highwayRoutes.length > 0) return highwayRoutes;
    return TIANJIN_HIGHWAY_ROUTES.map((route) => ({
      id: route.id,
      routeName: route.name,
      routeColor: route.color,
      points: [],
      trafficText: '实时数据加载中',
      risk: 'low' as const,
      floodWatchPoints: [],
      accidentTips: ['实时接口稍后加载，先查看路线结构。'],
    }));
  }, [highwayRoutes]);

  const allStations = useMemo(() => Object.values(network).flat(), [network]);
  const suggestions = useMemo(() => fuzzySearchStations(allStations, search), [allStations, search]);

  const allHighwayPoints = useMemo(() => highwayRoutes.flatMap((route) => route.points), [highwayRoutes]);

  const filteredHighwayPoints = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const routePoints = selectedHighwayRouteId === 'all'
      ? allHighwayPoints
      : (highwayRoutes.find((route) => route.id === selectedHighwayRouteId)?.points || []);

    return routePoints.filter((point) => {
      const searchHit = !keyword || `${point.name} ${point.routeName} ${point.address} ${point.type}`.toLowerCase().includes(keyword);
      const riskHit = !highwayOnlyHighRisk || point.risk === 'high';
      return searchHit && riskHit;
    });
  }, [allHighwayPoints, highwayRoutes, highwayOnlyHighRisk, search, selectedHighwayRouteId]);

  const currentHighwayPoints = filteredHighwayPoints;

  const mapHighwayPoints = useMemo(() => {
    if (selectedHighwayRouteId !== 'all') return currentHighwayPoints;
    return currentHighwayPoints
      .filter((point) => point.risk !== 'low' || point.type === '收费站' || point.type === '服务区')
      .slice(0, 42);
  }, [currentHighwayPoints, selectedHighwayRouteId]);

  const highwayStats = useMemo(() => {
    const high = highwayRoutes.reduce((sum, route) => sum + route.points.filter((point) => point.risk === 'high').length, 0);
    const medium = highwayRoutes.reduce((sum, route) => sum + route.points.filter((point) => point.risk === 'medium').length, 0);
    const low = highwayRoutes.reduce((sum, route) => sum + route.points.filter((point) => point.risk === 'low').length, 0);
    return { high, medium, low };
  }, [highwayRoutes]);

  const selectedHighwayPoint = useMemo(
    () => allHighwayPoints.find((point) => point.id === selectedHighwayPointId) || null,
    [allHighwayPoints, selectedHighwayPointId]
  );

  const filteredRouteCards = useMemo(() => {
    const routeList = selectedHighwayRouteId === 'all'
      ? highwayRoutes
      : highwayRoutes.filter((route) => route.id === selectedHighwayRouteId);
    if (!highwayOnlyHighRisk) return routeList;
    return routeList.filter((route) => route.risk === 'high' || route.points.some((point) => point.risk === 'high'));
  }, [highwayRoutes, highwayOnlyHighRisk, selectedHighwayRouteId]);

  const floodRiskPoints = useMemo(() => {
    return currentHighwayPoints.filter((point) => {
      const hasFloodType = point.type.includes('积水');
      const hasFloodReason = point.riskReasons.some((reason) => reason.includes('积水') || reason.includes('排水'));
      const hasRainRisk = point.weather.weatherCode >= 51 && (point.type === '桥梁' || point.type === '匝道' || point.type === '服务区');
      return hasFloodType || hasFloodReason || hasRainRisk;
    });
  }, [currentHighwayPoints]);

  const accidentFocusTips = useMemo(() => {
    const baseTips = selectedHighwayRoute?.accidentTips || [
      '收费站、服务区出入口注意并线。',
      '桥面和匝道注意横风与制动距离。',
      '降雨时低洼路段优先减速慢行。',
    ];

    const highRiskNodes = currentHighwayPoints.filter((point) => point.risk === 'high').slice(0, 4);
    const nodeTips = highRiskNodes.map((point) => `${point.routeName}${point.name}：${point.riskReasons[0] || '风险波动偏大，建议减速通行。'}`);

    return [...baseTips, ...nodeTips].slice(0, 8);
  }, [currentHighwayPoints, selectedHighwayRoute]);

  const toggleHighwayPanel = (key: 'routeCards' | 'floodPoints' | 'accidentTips') => {
    setHighwayPanels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedStation = useMemo(
    () => allStations.find((station) => station.id === selectedStationId) || null,
    [allStations, selectedStationId]
  );

  const linePath = useMemo(
    () => [...selectedLineStations].sort((a, b) => a.seq - b.seq).map((station) => [station.lat, station.lng] as [number, number]),
    [selectedLineStations]
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setNetworkLoading(true);
      let net: Record<string, MetroStationPoint[]> = {};
      try {
        net = await fetchTianjinMetroNetwork();
      } catch {
        net = {};
      }

      let cityTraffic: { index: number; level: string; description: string } | null = null;
      try {
        cityTraffic = await fetchTrafficIndex('天津');
      } catch {
        cityTraffic = null;
      }

      if (cancelled) return;

      setNetwork(net);
      setTrafficIndex(cityTraffic);

      const firstLine = TIANJIN_METRO_LINES.find((line) => (net[line.id] || []).length > 0);
      if (firstLine) {
        setSelectedLineId(firstLine.id);
        const firstStation = net[firstLine.id][0];
        if (firstStation) {
          setCenter([firstStation.lat, firstStation.lng]);
          setZoom(11);
        }
      }

      setNetworkLoading(false);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeMode !== 'highway') return;

    let cancelled = false;
    const loadHighwayDashboard = async () => {
      setHighwayLoading(true);

      const order = new Map(TIANJIN_HIGHWAY_ROUTES.map((route, index) => [route.id, index]));
      let completed = 0;
      const total = TIANJIN_HIGHWAY_ROUTES.length;

      const mergeRoute = (card: HighwayRouteCard) => {
        setHighwayRoutes((prev) => {
          const next = prev.filter((item) => item.id !== card.id);
          next.push(card);
          next.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
          return next;
        });
      };

      for (const route of TIANJIN_HIGHWAY_ROUTES) {
        void fetchTianjinHighwayRouteCard(route.id)
          .then((card) => {
            if (cancelled || !card) return;
            mergeRoute(card);

            const firstHighRiskPoint = card.points.find((point) => point.risk === 'high') || card.points[0];
            if (firstHighRiskPoint) {
              setSelectedHighwayPointId((current) => {
                if (current) return current;
                setCenter([firstHighRiskPoint.lat, firstHighRiskPoint.lng]);
                setZoom(10);
                return firstHighRiskPoint.id;
              });
            }

            setSelectedHighwayRouteId((current) => (current === 'all' ? card.id : current));
          })
          .finally(() => {
            completed += 1;
            if (!cancelled && (completed >= 2 || completed === total)) {
              setHighwayLoading(false);
            }
          });
      }

      // Warm the aggregate cache in background without blocking the first paint.
      void fetchTianjinHighwayDashboard();

      if (completed === 0) {
        setSelectedHighwayRouteId((current) => (current === 'all' ? TIANJIN_HIGHWAY_ROUTES[0]?.id || 'all' : current));
        setHighwayLoading(false);
      }
    };

    void loadHighwayDashboard();
    return () => {
      cancelled = true;
    };
  }, [activeMode]);

  useEffect(() => {
    let cancelled = false;

    const loadLineRealtime = async () => {
      if (!selectedLineStations.length) return;
      setLineLoading(true);

      const batchSize = 6;
      for (let index = 0; index < selectedLineStations.length; index += batchSize) {
        const batch = selectedLineStations.slice(index, index + batchSize);
        const entries = await Promise.allSettled(
          batch.map(async (station) => {
            const [weather, warning, trafficList] = await Promise.all([
              fetchCurrentWeatherByCoords(station.lat, station.lng),
              fetchLatestOfficialWarning(station.district),
              fetchRealTimeTraffic({
                sw: { lat: station.lat - 0.02, lng: station.lng - 0.02 },
                ne: { lat: station.lat + 0.02, lng: station.lng + 0.02 },
              }),
            ]);

            const trafficText = trafficList.length
              ? `${getCongestionText(trafficList[0].congestionLevel)} · ${Math.round(trafficList[0].speed)}km/h`
              : '暂无附近路况数据';

            return [
              station.id,
              {
                weather,
                warning,
                advice: stationAdvice(weather),
                trafficText,
              } satisfies StationLiveData,
            ] as const;
          })
        );

        if (cancelled) return;

        const patch: Record<string, StationLiveData> = {};
        for (const entry of entries) {
          if (entry.status === 'fulfilled') {
            const [id, data] = entry.value;
            patch[id] = data;
          }
        }

        setLiveMap((prev) => ({ ...prev, ...patch }));
        if (index + batchSize < selectedLineStations.length) {
          await Promise.resolve();
        }
      }

      setLineLoading(false);
    };

    void loadLineRealtime();
    return () => {
      cancelled = true;
    };
  }, [selectedLineId, selectedLineStations.length]);

  const pickLine = (lineId: string) => {
    setSelectedLineId(lineId);
    setSelectedStationId(null);
    const first = (network[lineId] || [])[0];
    if (first) {
      setCenter([first.lat, first.lng]);
      setZoom(11);
    }
  };

  const pickStation = (station: MetroStationPoint) => {
    setSelectedStationId(station.id);
    setCenter([station.lat, station.lng]);
    setZoom(13);
    setShowSuggest(false);
  };

  const pickHighwayNode = (point: HighwayPoint) => {
    const route = highwayRoutes.find((item) => item.routeName === point.routeName);
    if (route) {
      setSelectedHighwayRouteId(route.id);
    }
    setSelectedHighwayPointId(point.id);
    setCenter([point.lat, point.lng]);
    setZoom(10);
    setShowSuggest(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 text-slate-900">
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur px-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold truncate">天津交通实时气象地图</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500">交通指数</p>
          <p className="text-sm font-bold">{trafficIndex ? `${trafficIndex.index}/10` : '--'}</p>
        </div>
      </header>

      <div className="px-4 py-3 border-b border-slate-200 bg-white space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveMode('metro')}
            className={`h-10 rounded-xl text-sm font-semibold border ${
              activeMode === 'metro'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            地铁
          </button>
          <button
            onClick={() => setActiveMode('highway')}
            className={`h-10 rounded-xl text-sm font-semibold border ${
              activeMode === 'highway'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            高速
          </button>
        </div>

        <div className="relative">
          <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              placeholder={activeMode === 'metro' ? '输入站名关键词，如：天津、营口、文化中心' : '输入高速或路段，如：京哈、秦滨、静海'}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>

          {activeMode === 'metro' && showSuggest && search.trim() && suggestions.length > 0 && (
            <div className="absolute z-40 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
              {suggestions.map((station) => (
                <button
                  key={station.id}
                  onClick={() => {
                    setSelectedLineId(station.lineId);
                    pickStation(station);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold">{station.name}</p>
                  <p className="text-xs text-slate-500">{station.lineName} · {station.district}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {activeMode === 'metro' ? (
          <div className="flex gap-2 overflow-x-auto">
            {TIANJIN_METRO_LINES.map((line) => (
              <button
                key={line.id}
                onClick={() => pickLine(line.id)}
                className={`shrink-0 px-3 h-8 rounded-full text-xs font-semibold border ${
                  selectedLineId === line.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {line.name}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedHighwayRouteId('all')}
                className={`shrink-0 px-3 h-8 rounded-full text-xs font-semibold border ${
                  selectedHighwayRouteId === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                全部高速
              </button>
              {routeCatalog.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedHighwayRouteId(route.id)}
                  className={`shrink-0 px-3 h-8 rounded-full text-xs font-semibold border ${
                    selectedHighwayRouteId === route.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {route.routeName}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar text-[11px] text-slate-500">
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">收费站</span>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">服务区</span>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">互通立交</span>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">高架桥段</span>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">易积水点</span>
            </div>
          </>
        )}
      </div>

      <div className={`flex-1 min-h-0 grid gap-4 p-4 ${activeMode === 'highway' ? 'grid-cols-1 overflow-y-auto' : 'lg:grid-cols-[1.35fr_1fr] overflow-y-auto'}`}>
        <AnimatePresence mode="wait">
          {activeMode === 'metro' ? (
            <motion.section key="metro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] items-start pb-6">
              <section className="min-h-0 rounded-2xl border border-slate-200 bg-white p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Train className="w-4 h-4 text-indigo-600" />
                    {lineMeta.name} · 站点 {(selectedLineStations || []).length} 个
                  </div>
                  {(networkLoading || lineLoading) && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                </div>

                <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-slate-700">
                  提示：左侧看线路与地图，右侧可向下滚动查看全部站点；点击任意站点后，地图和详情会同步定位。
                </div>

                <div className="h-[42vh] min-h-[360px] rounded-xl overflow-hidden border border-slate-200">
                  <MapContainer center={center} zoom={zoom} mapTypeId="roadmap" className="h-full w-full">
                    {linePath.length > 1 && (
                      <Polyline positions={linePath} pathOptions={{ color: lineMeta.color, weight: 4, opacity: 0.85 }} />
                    )}

                    {selectedLineStations.map((station) => {
                      const active = selectedStationId === station.id;
                      const live = liveMap[station.id];
                      return (
                        <Marker
                          key={station.id}
                          position={[station.lat, station.lng]}
                          icon={createStationIcon(lineMeta.color, active)}
                          eventHandlers={{ click: () => pickStation(station) }}
                        >
                          <Popup>
                            <div className="text-sm min-w-[180px]">
                              <p className="font-semibold">{station.name}</p>
                              <p className="text-xs text-slate-500">{station.lineName} · {station.district}</p>
                              {live ? (
                                <p className="text-xs mt-1 text-slate-700">
                                  {weatherCodeToText(live.weather.weatherCode)} · {live.weather.temp}°C
                                </p>
                              ) : (
                                <p className="text-xs mt-1 text-slate-500">实时天气加载中...</p>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </section>

              <section className="min-h-0 rounded-2xl border border-slate-200 bg-white p-3 flex flex-col overflow-hidden lg:max-h-[calc(100vh-14rem)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    站点实时信息
                  </div>
                  <span className="text-xs text-slate-500">向下滚动可看全部站点</span>
                </div>

                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  友好提示：先点上方线路按钮切换线路，再点站点卡片查看实时天气、路况和预警；当前列表支持竖向滚动。
                </div>

                <div className="overflow-y-auto pr-1 space-y-3 max-h-[calc(100vh-24rem)]">
                  {selectedLineStations.map((station) => {
                    const live = liveMap[station.id];
                    const active = selectedStationId === station.id;
                    return (
                      <button
                        key={station.id}
                        onClick={() => pickStation(station)}
                        className={`w-full text-left rounded-xl border p-3 transition ${
                          active ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{station.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{station.lineName} · {station.district}</p>
                          </div>
                          {live ? weatherIcon(live.weather.weatherCode) : <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        </div>

                        {live ? (
                          <div className="mt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg bg-slate-50 px-2 py-1.5 flex items-center gap-1.5">
                                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                                {live.weather.temp}°C / 体感 {live.weather.feelsLike}°C
                              </div>
                              <div className="rounded-lg bg-slate-50 px-2 py-1.5 flex items-center gap-1.5">
                                <Wind className="w-3.5 h-3.5 text-sky-500" />
                                {windDirToText(live.weather.windDirection)} {windSpeedToLevel(live.weather.windSpeed)}级
                              </div>
                              <div className="rounded-lg bg-slate-50 px-2 py-1.5 col-span-2 flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-emerald-500" />
                                周边路况：{live.trafficText}
                              </div>
                            </div>

                            <div className="rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-2 text-xs text-slate-700">
                              <p className="font-semibold mb-1">该站注意事项</p>
                              {live.advice.map((tip) => (
                                <p key={tip} className="leading-5">• {tip}</p>
                              ))}
                            </div>

                            {live.warning ? (
                              <div className="rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-2 text-xs text-rose-900">
                                <p className="font-semibold flex items-center gap-1">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  官方预警
                                </p>
                                <p className="mt-1 font-semibold">{live.warning.title}</p>
                                <p className="mt-1 text-rose-700">发布时间：{live.warning.publishTime || '刚刚发布'}</p>
                              </div>
                            ) : (
                              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2 text-xs text-emerald-800 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                当前该站暂无新的官方预警
                              </div>
                            )}

                            <div className="text-[11px] text-slate-500">
                              天气：{weatherCodeToText(live.weather.weatherCode)} · 空气质量：{aqiToText(live.weather.aqi)}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-500">正在拉取该站实时天气和路况...</div>
                        )}
                      </button>
                    );
                  })}

                  {!selectedLineStations.length && !networkLoading && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      当前线路未检索到站点，请切换线路或检查高德 Key 配置。
                    </div>
                  )}
                </div>
              </section>
            </motion.section>
          ) : (
            <motion.section key="highway" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 pb-6">
              <section className="min-h-0 rounded-2xl border border-slate-200 bg-white p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Car className="w-4 h-4 text-indigo-600" />
                    天津高速实时气象地图
                  </div>
                  {(highwayLoading || networkLoading) && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                </div>

                <div className="h-[44vh] min-h-[360px] rounded-xl overflow-hidden border border-slate-200">
                  <MapContainer center={center} zoom={zoom} mapTypeId="roadmap" className="h-full w-full">
                    {routeCatalog
                      .filter((route) => selectedHighwayRouteId === 'all' || route.id === selectedHighwayRouteId)
                      .map((route) => {
                        const positions = [...route.points]
                          .sort((a, b) => a.lng - b.lng || a.lat - b.lat)
                          .map((point) => [point.lat, point.lng] as [number, number]);

                        if (positions.length < 2) return null;

                        const selected = selectedHighwayRouteId === route.id;
                        return (
                          <Polyline
                            key={`route-line-${route.id}`}
                            positions={positions}
                            pathOptions={{
                              color: route.routeColor,
                              weight: selected ? 6 : 3,
                              opacity: selected ? 0.95 : 0.45,
                            }}
                          />
                        );
                      })}

                    {mapHighwayPoints.map((point) => {
                      const active = selectedHighwayPointId === point.id;
                      return (
                        <Marker
                          key={point.id}
                          position={[point.lat, point.lng]}
                          icon={createHighwayIcon(point.risk)}
                          eventHandlers={{ click: () => pickHighwayNode(point) }}
                        >
                          <Popup>
                            <div className="text-sm min-w-[180px]">
                              <p className="font-semibold">{point.name}</p>
                              <p className="text-xs text-slate-500">{point.routeName} · {point.type}</p>
                              <p className="text-xs mt-1 text-slate-700">{point.weather.temp}°C · {point.trafficText}</p>
                              <p className="text-xs mt-1 text-slate-500">{active ? '当前已选中' : '点击查看详情'}</p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>

                <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-slate-700">
                  地图仅展示重点风险与当前路线点位，完整点位信息请看下方列表，不会遮挡地图。
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {routeCatalog.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => {
                        setSelectedHighwayRouteId(route.id);
                        const firstPoint = route.points[0];
                        if (firstPoint) {
                          setSelectedHighwayPointId(firstPoint.id);
                          setCenter([firstPoint.lat, firstPoint.lng]);
                          setZoom(10);
                        }
                      }}
                      className={`min-w-[180px] rounded-xl border p-3 text-left shrink-0 transition ${
                        selectedHighwayRouteId === route.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{route.routeName}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${riskBadgeClass(route.risk)}`}>
                          {route.risk === 'high' ? '高风险' : route.risk === 'medium' ? '中风险' : '低风险'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{routeStatusText(route)}</p>
                      <p className="text-[11px] text-slate-500 mt-1">监测点 {route.points.length} 个</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="min-h-0 rounded-2xl border border-slate-200 bg-white p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    高速重点监测点
                  </div>
                  <span className="text-xs text-slate-500">收费站、服务区、互通立交、桥梁、匝道</span>
                </div>

                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-600">下方列表可折叠，演示时可逐组展开。</p>
                  <button
                    onClick={() => setHighwayOnlyHighRisk((prev) => !prev)}
                    className={`h-8 px-3 rounded-full text-xs font-semibold border transition ${
                      highwayOnlyHighRisk
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {highwayOnlyHighRisk ? '仅看高风险: 开' : '仅看高风险: 关'}
                  </button>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3">
                    <p className="text-[11px] text-rose-600">高风险</p>
                    <p className="text-xl font-bold text-rose-600 mt-1">{highwayStats.high}</p>
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

                {selectedHighwayPoint && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 mb-3">
                    <p className="text-sm font-semibold text-indigo-900">当前选中：{selectedHighwayPoint.name}</p>
                    <p className="text-xs text-indigo-700 mt-1">{selectedHighwayPoint.routeName} · {selectedHighwayPoint.type} · {selectedHighwayPoint.trafficText}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div className="rounded-lg bg-white/80 border border-indigo-100 px-2 py-1.5">
                        路温 {selectedHighwayPoint.weather.temp}°C
                      </div>
                      <div className="rounded-lg bg-white/80 border border-indigo-100 px-2 py-1.5">
                        风力 {windSpeedToLevel(selectedHighwayPoint.weather.windSpeed)}级
                      </div>
                      <div className="rounded-lg bg-white/80 border border-indigo-100 px-2 py-1.5">
                        车速 {selectedHighwayPoint.trafficSpeed ?? '--'}km/h
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <button
                      onClick={() => toggleHighwayPanel('routeCards')}
                      className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-50 border-b border-slate-200"
                    >
                      <span className="text-sm font-semibold text-slate-900">高速路段卡片</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition ${highwayPanels.routeCards ? 'rotate-180' : ''}`} />
                    </button>
                    {highwayPanels.routeCards && (
                      <div className="p-3 space-y-2">
                        {filteredRouteCards.length > 0 ? filteredRouteCards.map((route) => {
                          const highlighted = selectedHighwayRouteId === route.id;
                          return (
                            <button
                              key={`route-card-panel-${route.id}`}
                              onClick={() => {
                                setSelectedHighwayRouteId(route.id);
                                const routeFirstHigh = route.points.find((point) => point.risk === 'high') || route.points[0];
                                if (routeFirstHigh) {
                                  pickHighwayNode(routeFirstHigh);
                                }
                              }}
                              className={`w-full rounded-xl border p-3 text-left transition ${
                                highlighted ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">{route.routeName}</p>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${riskBadgeClass(route.risk)}`}>
                                  {route.risk === 'high' ? '高风险' : route.risk === 'medium' ? '中风险' : '低风险'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{routeStatusText(route)}</p>
                              <p className="text-[11px] text-slate-500 mt-1">监测点 {route.points.length} 个</p>
                            </button>
                          );
                        }) : routeCatalog.map((route) => (
                          <button
                            key={`route-placeholder-${route.id}`}
                            onClick={() => setSelectedHighwayRouteId(route.id)}
                            className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">{route.routeName}</p>
                              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-white text-slate-500 border-slate-200">加载中</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">实时路段点位正在抓取，先展示路线结构。</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <button
                      onClick={() => toggleHighwayPanel('floodPoints')}
                      className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-50 border-b border-slate-200"
                    >
                      <span className="text-sm font-semibold text-slate-900">易积水点清单</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition ${highwayPanels.floodPoints ? 'rotate-180' : ''}`} />
                    </button>
                    {highwayPanels.floodPoints && (
                      <div className="p-3 space-y-2">
                        {floodRiskPoints.length > 0 ? floodRiskPoints.map((point) => {
                          const active = selectedHighwayPointId === point.id;
                          return (
                            <button
                              key={`flood-point-${point.id}`}
                              onClick={() => pickHighwayNode(point)}
                              className={`w-full rounded-xl border p-3 text-left transition ${
                                active ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">{point.name}</p>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${riskBadgeClass(point.risk)}`}>
                                  {point.risk === 'high' ? '高风险' : point.risk === 'medium' ? '中风险' : '低风险'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{point.routeName} · {point.type} · {point.trafficText}</p>
                              <p className="text-xs text-slate-500 mt-1">提示：{point.riskReasons[0] || '雨天注意低洼积水与制动距离。'}</p>
                            </button>
                          );
                        }) : (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                            当前未识别到明显易积水风险点，可继续关注实时降雨变化。
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <button
                      onClick={() => toggleHighwayPanel('accidentTips')}
                      className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-50 border-b border-slate-200"
                    >
                      <span className="text-sm font-semibold text-slate-900">事故高发提示</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition ${highwayPanels.accidentTips ? 'rotate-180' : ''}`} />
                    </button>
                    {highwayPanels.accidentTips && (
                      <div className="p-3 space-y-2">
                        {accidentFocusTips.map((tip) => (
                          <p key={tip} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            • {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-3 py-2.5 flex items-center justify-between bg-slate-50 border-b border-slate-200">
                      <span className="text-sm font-semibold text-slate-900">全部监测点</span>
                      <span className="text-xs text-slate-500">{currentHighwayPoints.length} 个</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {currentHighwayPoints.length > 0 ? currentHighwayPoints.map((point) => {
                        const active = selectedHighwayPointId === point.id;
                        return (
                          <button
                            key={point.id}
                            onClick={() => pickHighwayNode(point)}
                            className={`w-full text-left rounded-xl border p-3 transition ${
                              active ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                            } ${point.risk === 'high' ? 'ring-1 ring-rose-200' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">{point.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{point.routeName} · {point.type}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${riskBadgeClass(point.risk)}`}>
                                {point.risk === 'high' ? '高风险' : point.risk === 'medium' ? '中风险' : '低风险'}
                              </span>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg bg-slate-50 px-2 py-1.5 flex items-center gap-1.5">
                                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                                {point.weather.temp}°C / 体感 {point.weather.feelsLike}°C
                              </div>
                              <div className="rounded-lg bg-slate-50 px-2 py-1.5 flex items-center gap-1.5">
                                <Wind className="w-3.5 h-3.5 text-sky-500" />
                                {windDirToText(point.weather.windDirection)} {windSpeedToLevel(point.weather.windSpeed)}级
                              </div>
                              <div className="rounded-lg bg-slate-50 px-2 py-1.5 col-span-2 flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-emerald-500" />
                                路况：{point.trafficText}
                              </div>
                              <div className="rounded-lg bg-slate-50 px-2 py-1.5 col-span-2 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                预警提示：{point.riskReasons.slice(0, 2).join('，') || '当前暂无明显风险叠加'}
                              </div>
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                          当前高速真实点位正在加载，若网络较慢可稍等片刻。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
