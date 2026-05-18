import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import MapContainer from '../components/MapContainer';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Car,
  ChevronLeft,
  Cloud,
  CloudRain,
  Droplets,
  Eye,
  Filter,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  Thermometer,
  Train,
  Wind,
  X,
} from 'lucide-react';
import { fetchCurrentWeather, getNearestDistrictName, weatherCodeToText, windDirToText, windSpeedToLevel, aqiToText, CurrentWeather, fetchTemperatureTrend } from '../services/weatherService';
import { fetchLatestOfficialWarning, OfficialWarning } from '../services/officialWarningService';
import { fetchTrafficIndex, smartSearchPlaces, searchMetroStations } from '../services/aMapService';
import { HIGHWAY_NODES, METRO_LINES, METRO_STATIONS } from './TrafficView';
import { ResponsiveContainer, AreaChart, Area, XAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

type Segment = 'metro' | 'highway';

type MetroStation = (typeof METRO_STATIONS)[number] & {
  source: 'fallback' | 'amap';
  district: string;
};

type HighwayNode = (typeof HIGHWAY_NODES)[number] & {
  district: string;
};

type SearchTarget =
  | { kind: 'metro'; id: string; name: string; lineName: string; lineColor: string; lat: number; lng: number }
  | { kind: 'highway'; id: string; name: string; route: string; lat: number; lng: number };

interface DistrictLiveInfo {
  weather: CurrentWeather;
  warning: OfficialWarning | null;
}

const fallbackWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="h-4 w-4 text-amber-500" />;
  if (code === 1 || code === 2) return <Cloud className="h-4 w-4 text-slate-500" />;
  if (code === 3) return <Cloud className="h-4 w-4 text-slate-600" />;
  if (code >= 51 && code <= 67) return <CloudRain className="h-4 w-4 text-sky-500" />;
  if (code >= 80 && code <= 99) return <CloudRain className="h-4 w-4 text-sky-600" />;
  return <Cloud className="h-4 w-4 text-slate-500" />;
};

const lineStationIcon = (color: string, selected = false, glow = false) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${selected ? 28 : 22}px;height:${selected ? 28 : 22}px;display:flex;align-items:center;justify-content:center;">
        ${glow ? `<span style="position:absolute;inset:-6px;border-radius:999px;background:${color};opacity:.18;animation:pulse 1.8s infinite;"></span>` : ''}
        <span style="width:${selected ? 18 : 14}px;height:${selected ? 18 : 14}px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 8px 18px rgba(15,23,42,.22);"></span>
      </div>
      <style>@keyframes pulse {0%{transform:scale(.8);opacity:.24}70%{transform:scale(1.15);opacity:.06}100%{transform:scale(.8);opacity:.24}}</style>
    `,
    iconSize: [selected ? 28 : 22, selected ? 28 : 22],
    iconAnchor: [selected ? 14 : 11, selected ? 14 : 11],
  });

const highwayIcon = (risk: 'low' | 'medium' | 'high', selected = false) => {
  const color = risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#10b981';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${selected ? 30 : 24}px;height:${selected ? 30 : 24}px;display:flex;align-items:center;justify-content:center;">
        <span style="width:${selected ? 20 : 16}px;height:${selected ? 20 : 16}px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 8px 18px rgba(15,23,42,.22);"></span>
      </div>
    `,
    iconSize: [selected ? 30 : 24, selected ? 30 : 24],
    iconAnchor: [selected ? 15 : 12, selected ? 15 : 12],
  });
};

function lineWeatherLabel(weather: CurrentWeather) {
  const wind = windSpeedToLevel(weather.windSpeed);
  return `${weather.temp}° · ${weatherCodeToText(weather.weatherCode)} · ${windDirToText(weather.windDirection)} ${wind}级`;
}

function summarizeAdvice(weather: CurrentWeather) {
  const tips: string[] = [];
  if (weather.weatherCode >= 51 && weather.weatherCode <= 99) tips.push('当前有降水或对流，出站请备伞并注意地面湿滑');
  if (weather.windSpeed >= 8) tips.push('风力偏强，高架和站口换乘注意横风');
  if (weather.temp >= 30) tips.push('体感偏热，地面换乘注意补水和防晒');
  if (weather.temp <= 8) tips.push('体感偏冷，早晚换乘建议加件外套');
  if (tips.length === 0) tips.push('当前天气较平稳，适合通勤出行');
  return tips;
}

function riskFromWeather(weather: CurrentWeather): 'low' | 'medium' | 'high' {
  if (weather.weatherCode >= 80 || weather.windSpeed >= 8 || weather.temp <= 5 || weather.temp >= 33) return 'high';
  if (weather.weatherCode >= 51 || weather.windSpeed >= 5) return 'medium';
  return 'low';
}

function buildFallbackMetroByLine(): Record<string, MetroStation[]> {
  const base: Record<string, MetroStation[]> = {};
  for (const line of METRO_LINES) {
    base[line.id] = METRO_STATIONS.filter((station) => station.lineId === line.id).map((station) => ({
      ...station,
      district: getNearestDistrictName(station.lat, station.lng),
      source: 'fallback',
    }));
  }
  return base;
}

export default function TrafficWorkbenchView({ onBack }: { onBack: () => void }) {
  const [segment, setSegment] = useState<Segment>('metro');
  const [selectedLineId, setSelectedLineId] = useState<string>('all');
  const [selectedMetroId, setSelectedMetroId] = useState<string | null>(null);
  const [selectedHighwayId, setSelectedHighwayId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.1255, 117.1901]);
  const [mapZoom, setMapZoom] = useState(11);
  const [searchText, setSearchText] = useState('');
  const [smartResults, setSmartResults] = useState<SearchTarget[]>([]);
  const [smartSearching, setSmartSearching] = useState(false);
  const [districtLive, setDistrictLive] = useState<Record<string, DistrictLiveInfo>>({});
  const [trafficIndex, setTrafficIndex] = useState<{ index: number; level: string; description: string } | null>(null);
  const [metroByLine, setMetroByLine] = useState<Record<string, MetroStation[]>>(() => buildFallbackMetroByLine());
  const [loadingLineIds, setLoadingLineIds] = useState<Record<string, boolean>>({});

  const highwayNodes = useMemo<HighwayNode[]>(() =>
    HIGHWAY_NODES.map((node) => ({
      ...node,
      district: getNearestDistrictName(node.lat, node.lng),
    })) as HighwayNode[],
  []);

  const metroStations = useMemo(() => {
    const selected = selectedLineId === 'all'
      ? Object.values(metroByLine).flat()
      : metroByLine[selectedLineId] || [];

    const filtered = searchText.trim()
      ? selected.filter((station) => {
          const q = searchText.trim();
          return station.name.includes(q) || station.lineName.includes(q) || station.district.includes(q);
        })
      : selected;

    return filtered;
  }, [metroByLine, selectedLineId, searchText]);

  const selectedMetro = metroStations.find((station) => station.id === selectedMetroId) || null;
  const selectedHighway = highwayNodes.find((node) => node.id === selectedHighwayId) || null;

  const selectedLineStations = useMemo(() => {
    if (selectedLineId === 'all') return metroStations;
    return metroByLine[selectedLineId] || [];
  }, [metroByLine, selectedLineId, metroStations]);

  const selectedLine = METRO_LINES.find((line) => line.id === selectedLineId) || null;

  const metroPaths = useMemo(() => {
    const grouped = (selectedLineId === 'all' ? Object.values(metroByLine).flat() : metroByLine[selectedLineId] || []).reduce<Record<string, MetroStation[]>>((acc, station) => {
      acc[station.lineId] ||= [];
      acc[station.lineId].push(station);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((stations) => stations.sort((a, b) => (a.seq || 0) - (b.seq || 0)))
      .filter((stations) => stations.length >= 2)
      .map((stations) => ({
        lineId: stations[0].lineId,
        color: stations[0].lineColor,
        positions: stations.map((station) => [station.lat, station.lng] as [number, number]),
      }));
  }, [metroByLine, selectedLineId]);

  const selectedLineWeather = useMemo(() => {
    const weatherList = selectedLineStations
      .map((station) => districtLive[station.district]?.weather)
      .filter(Boolean) as CurrentWeather[];
    return weatherList;
  }, [districtLive, selectedLineStations]);

  const lineRiskSummary = useMemo(() => {
    if (!selectedLineWeather.length) return { high: 0, medium: 0, low: 0 };
    return selectedLineWeather.reduce((acc, weather) => {
      const risk = riskFromWeather(weather);
      acc[risk] += 1;
      return acc;
    }, { high: 0, medium: 0, low: 0 });
  }, [selectedLineWeather]);

  const searchSuggestions = useMemo(() => {
    const q = searchText.trim();
    if (!q) return [] as SearchTarget[];

    const metroLocal = (selectedLineId === 'all' ? Object.values(metroByLine).flat() : metroByLine[selectedLineId] || [])
      .filter((station) => station.name.includes(q) || station.lineName.includes(q) || station.district.includes(q))
      .slice(0, 8)
      .map((station) => ({
        kind: 'metro' as const,
        id: station.id,
        name: station.name,
        lineName: station.lineName,
        lineColor: station.lineColor,
        lat: station.lat,
        lng: station.lng,
      }));

    const highwayLocal = highwayNodes
      .filter((node) => node.name.includes(q) || node.route.includes(q) || node.district.includes(q))
      .slice(0, 6)
      .map((node) => ({
        kind: 'highway' as const,
        id: node.id,
        name: node.name,
        route: node.route,
        lat: node.lat,
        lng: node.lng,
      }));

    return [...metroLocal, ...highwayLocal];
  }, [searchText, highwayNodes, metroByLine, selectedLineId]);

  useEffect(() => {
    const loadTrafficIndex = async () => {
      const data = await fetchTrafficIndex('天津');
      setTrafficIndex(data);
    };

    const districts = new Set<string>();
    METRO_STATIONS.forEach((station) => districts.add(getNearestDistrictName(station.lat, station.lng)));
    highwayNodes.forEach((node) => districts.add(node.district));

    const loadDistrictLive = async () => {
      const entries = await Promise.all(
        [...districts].map(async (district) => {
          const [weather, warning] = await Promise.all([
            fetchCurrentWeather(district),
            fetchLatestOfficialWarning(district),
          ]);
          return [district, { weather, warning }] as const;
        })
      );

      const next: Record<string, DistrictLiveInfo> = {};
      for (const [district, info] of entries) next[district] = info;
      setDistrictLive(next);
    };

    void loadTrafficIndex();
    void loadDistrictLive();
    void Promise.all(METRO_LINES.map((line) => loadLine(line.id, line.name, line.color))).catch(() => undefined);
  }, []);

  const loadLine = async (lineId: string, lineName: string, lineColor: string) => {
    if (loadingLineIds[lineId]) return;
    setLoadingLineIds((prev) => ({ ...prev, [lineId]: true }));

    try {
      const remoteStations = await searchMetroStations(lineName);
        const metroRemote = remoteStations.map((place, index) => ({
          id: `amap-${lineId}-${place.id}-${index}`,
          name: place.name,
          lineId,
          lineName,
          lineColor,
          seq: index + 100,
          weather: 'cloudy' as const,
          temp: 0,
          tip: place.address || '高德地图实时检索结果',
          lat: place.location.lat,
          lng: place.location.lng,
          source: 'amap' as const,
          district: getNearestDistrictName(place.location.lat, place.location.lng),
        }));

      setMetroByLine((prev) => {
        const fallback = prev[lineId] || [];
        const merged = [...fallback];
        const seen = new Set<string>(fallback.map((item) => `${item.name}-${item.lat.toFixed(4)}-${item.lng.toFixed(4)}`));

        for (const item of metroRemote) {
          const key = `${item.name}-${item.lat.toFixed(4)}-${item.lng.toFixed(4)}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        }

        merged.sort((a, b) => a.seq - b.seq || a.name.localeCompare(b.name, 'zh-CN'));
        return { ...prev, [lineId]: merged };
      });
    } catch {
      // 保留 fallback
    } finally {
      setLoadingLineIds((prev) => ({ ...prev, [lineId]: false }));
    }
  };

  const openMetro = (station: MetroStation) => {
    const district = station.district;
    const weather = districtLive[district]?.weather;
    if (weather) {
      setMapCenter([station.lat, station.lng]);
      setMapZoom(13);
      setSegment('metro');
      setSelectedLineId(station.lineId);
      setSelectedMetroId(station.id);
      setSelectedHighwayId(null);
    }
  };

  const openHighway = (node: HighwayNode) => {
    setMapCenter([node.lat, node.lng]);
    setMapZoom(10);
    setSegment('highway');
    setSelectedHighwayId(node.id);
    setSelectedMetroId(null);
  };

  const runSmartSearch = async () => {
    const q = searchText.trim();
    if (!q) return;
    setSmartSearching(true);
    try {
      const remote = await smartSearchPlaces(q);
      const mapped: SearchTarget[] = remote.slice(0, 12).map((place) => {
        const isMetro = /地铁|站/.test(place.name + place.address + place.type);
        if (isMetro) {
          const line = METRO_LINES.find((item) => q.includes(item.name) || place.name.includes(item.name)) || METRO_LINES[0];
          return {
            kind: 'metro',
            id: place.id,
            name: place.name,
            lineName: line.name,
            lineColor: line.color,
            lat: place.location.lat,
            lng: place.location.lng,
          };
        }

        return {
          kind: 'highway',
          id: place.id,
          name: place.name,
          route: place.address || q,
          lat: place.location.lat,
          lng: place.location.lng,
        };
      });

      setSmartResults(mapped.length ? mapped : searchSuggestions);
    } finally {
      setSmartSearching(false);
    }
  };

  const selectSuggestion = (target: SearchTarget) => {
    setSearchText(target.name);
    setSmartResults([]);
    if (target.kind === 'metro') {
      const line = METRO_LINES.find((item) => item.name === target.lineName) || METRO_LINES[0];
      setSegment('metro');
      setSelectedLineId(line.id);
      setSelectedMetroId(target.id);
      setSelectedHighwayId(null);
      setMapCenter([target.lat, target.lng]);
      setMapZoom(13);
    } else {
      setSegment('highway');
      setSelectedHighwayId(target.id);
      setSelectedMetroId(null);
      setMapCenter([target.lat, target.lng]);
      setMapZoom(10);
    }
  };

  const lineOverviewWarnings = useMemo(() => {
    const warnings = selectedLineStations
      .map((station) => districtLive[station.district]?.warning)
      .filter(Boolean) as OfficialWarning[];
    const seen = new Set<string>();
    return warnings.filter((warning) => {
      const key = `${warning.title}-${warning.publishTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [districtLive, selectedLineStations]);

  const selectedLineAdvice = selectedLineStations.length
    ? summarizeAdvice(selectedLineWeather[0] || districtLive[selectedLineStations[0].district]?.weather)
    : [];

  const mapMarkers = segment === 'metro'
    ? metroStations.map((station) => {
        const weather = districtLive[station.district]?.weather;
        const risk = weather ? riskFromWeather(weather) : 'low';
        const selected = selectedMetroId === station.id;
        return (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={lineStationIcon(station.lineColor, selected, risk === 'high')}
            eventHandlers={{ click: () => openMetro(station) }}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1 text-sm">
                <p className="font-semibold text-slate-800">{station.name}</p>
                <p className="text-xs text-slate-500">{station.lineName}</p>
                {weather ? <p className="text-xs text-slate-700">{lineWeatherLabel(weather)}</p> : <p className="text-xs text-slate-500">加载天气中...</p>}
              </div>
            </Popup>
          </Marker>
        );
      })
    : highwayNodes.map((node) => {
        const weather = districtLive[node.district]?.weather;
        const selected = selectedHighwayId === node.id;
        const risk = weather ? riskFromWeather(weather) : node.risk;
        return (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={highwayIcon(risk, selected)}
            eventHandlers={{ click: () => openHighway(node) }}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1 text-sm">
                <p className="font-semibold text-slate-800">{node.name}</p>
                <p className="text-xs text-slate-500">{node.route}</p>
                {weather ? <p className="text-xs text-slate-700">{lineWeatherLabel(weather)}</p> : <p className="text-xs text-slate-500">加载天气中...</p>}
              </div>
            </Popup>
          </Marker>
        );
      });

  const selectedMetroWeather = selectedMetro ? districtLive[selectedMetro.district]?.weather : null;
  const selectedMetroWarning = selectedMetro ? districtLive[selectedMetro.district]?.warning : null;
  const selectedHighwayWeather = selectedHighway ? districtLive[selectedHighway.district]?.weather : null;
  const selectedHighwayWarning = selectedHighway ? districtLive[selectedHighway.district]?.warning : null;

  const trafficBins = useMemo(() => {
    if (segment === 'metro') {
      return [
        { name: '高风险', value: lineRiskSummary.high, fill: '#ef4444' },
        { name: '中风险', value: lineRiskSummary.medium, fill: '#f59e0b' },
        { name: '低风险', value: lineRiskSummary.low, fill: '#10b981' },
      ];
    }

    const highwayRisk = highwayNodes.reduce(
      (acc, node) => {
        acc[node.risk] += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    return [
      { name: '高风险', value: highwayRisk.high, fill: '#ef4444' },
      { name: '中风险', value: highwayRisk.medium, fill: '#f59e0b' },
      { name: '低风险', value: highwayRisk.low, fill: '#10b981' },
    ];
  }, [highwayNodes, lineRiskSummary.high, lineRiskSummary.low, lineRiskSummary.medium, segment]);

  const lineTrend = useMemo(() => {
    const weather = selectedMetroWeather || selectedHighwayWeather || null;
    return weather ? [{ time: '当前', value: weather.temp }, { time: '体感', value: weather.feelsLike }] : [];
  }, [selectedHighwayWeather, selectedMetroWeather]);

  useEffect(() => {
    if (!selectedLineStations.length) return;
    const first = selectedLineStations[0];
    if (!selectedMetroId || !selectedLineStations.some((station) => station.id === selectedMetroId)) {
      setMapCenter([first.lat, first.lng]);
    }
  }, [selectedLineStations, selectedMetroId]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[radial-gradient(circle_at_top,_rgba(99,102,241,.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_42%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo-700">天津交通哨兵</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-sky-700">高德地图 + 实时天气</span>
            </div>
            <h1 className="mt-2 text-xl font-black tracking-tight text-slate-900">交通出行工作台</h1>
            <p className="mt-1 text-sm text-slate-500">地铁线路、天津高速、站点天气、预警区域、智能搜索，一屏完成出行判断。</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-slate-500">城市交通指数</p>
            <p className="text-lg font-black text-slate-900">{trafficIndex ? `${trafficIndex.index}/10` : '...'}</p>
            <p className="text-[11px] text-slate-500">{trafficIndex?.level || '加载中'}</p>
          </div>
        </div>
      </header>

      <div className="border-b border-white/70 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSmartSearch()}
              placeholder="搜索站点 / 高速 / 线路，例如：天津站、1号线、津滨高速"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              onClick={runSmartSearch}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {smartSearching ? '搜索中' : '智能搜索'}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:justify-end">
            <button
              onClick={() => setSegment('metro')}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-sm ${segment === 'metro' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
            >
              <Train className="h-4 w-4" />
              地铁地图
            </button>
            <button
              onClick={() => setSegment('highway')}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-sm ${segment === 'highway' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
            >
              <Car className="h-4 w-4" />
              高速地图
            </button>
          </div>
        </div>

        <AnimatePresence>
          {((searchSuggestions.length > 0) || (smartResults.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="max-h-48 overflow-y-auto">
                {(smartResults.length > 0 ? smartResults : searchSuggestions).map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onClick={() => selectSuggestion(item)}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {item.kind === 'metro' ? `${item.lineName}` : item.route}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1 overflow-hidden px-4 py-4">
        <div className="grid h-full gap-4 lg:grid-cols-[1.4fr_.9fr]">
          <section className="flex min-h-0 flex-col gap-4">
            <div className="rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900">{segment === 'metro' ? '天津地铁实时站点图' : '天津高速实时风险图'}</h2>
                  <p className="text-xs text-slate-500">点击站点或路段，查看对应区县天气与官方预警。</p>
                </div>
                <div className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white">
                  {segment === 'metro' ? `站点 ${metroStations.length} · 线路 ${selectedLineId === 'all' ? '全部' : selectedLine?.name}` : `监测点 ${highwayNodes.length}`}
                </div>
              </div>

              {segment === 'metro' && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => { setSelectedLineId('all'); setSelectedMetroId(null); }}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${selectedLineId === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    全部线路
                  </button>
                  {METRO_LINES.map((line) => (
                    <button
                      key={line.id}
                      onClick={() => { setSelectedLineId(line.id); setSelectedMetroId(null); setSelectedHighwayId(null); setSegment('metro'); }}
                      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${selectedLineId === line.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                      {line.name}
                      {loadingLineIds[line.id] && <span className="text-[10px] opacity-70">加载中</span>}
                    </button>
                  ))}
                </div>
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 h-[62vh] min-h-[460px]">
                <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" mapTypeId="roadmap">
                  {segment === 'metro' && metroPaths.map((path) => (
                    <Polyline key={path.lineId} positions={path.positions} pathOptions={{ color: path.color, weight: 4, opacity: 0.8 }} />
                  ))}
                  {mapMarkers}
                </MapContainer>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900">风险分布</h3>
                </div>
                <div className="mt-3 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficBins}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-sky-600" />
                  <h3 className="text-sm font-black text-slate-900">当前天气趋势</h3>
                </div>
                <div className="mt-3 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineTrend}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="url(#tempGradient)" strokeWidth={2.4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto pb-4 pr-1">
            <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <h3 className="text-sm font-black text-slate-900">线路安全建议</h3>
              </div>
              <div className="mt-3 space-y-3">
                {segment === 'metro' ? (
                  <>
                    <div className="rounded-2xl bg-indigo-50 p-3 text-sm text-slate-700">
                      <p className="font-semibold text-indigo-700">{selectedLine ? selectedLine.name : '请选择线路'}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-600">
                        {selectedLineStations.length
                          ? `当前线路覆盖 ${selectedLineStations.length} 个站点，${lineRiskSummary.high} 个站点受强风/降水影响，${lineRiskSummary.medium} 个站点需要关注湿滑和换乘延迟。`
                          : '选择线路后，这里会自动显示“应该注意什么”和对应预警区。'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">重点关注区县</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[...new Set(selectedLineStations.map((station) => station.district))].slice(0, 6).map((district) => (
                          <span key={district} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">{district}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                      <p className="font-semibold">出行提示</p>
                      <ul className="mt-2 space-y-1.5">
                        {selectedLineAdvice.map((tip) => <li key={tip}>• {tip}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs leading-6 text-rose-900">
                      <p className="font-semibold">官方预警</p>
                      {lineOverviewWarnings.length ? (
                        <div className="mt-2 space-y-2">
                          {lineOverviewWarnings.map((warning) => (
                            <div key={`${warning.title}-${warning.publishTime}`} className="rounded-xl bg-white/90 p-3 shadow-sm">
                              <p className="font-semibold text-rose-700">{warning.title}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{warning.publishTime || '刚刚发布'}</p>
                              <p className="mt-1 text-slate-700">{warning.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-slate-600">当前线路涉及区县暂无新的官方预警，通勤可保持常规关注。</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl bg-slate-900 p-3 text-sm text-white">
                      <p className="font-semibold">{selectedHighway ? selectedHighway.name : '请选择高速监测点'}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-300">
                        {selectedHighway
                          ? `这里是 ${selectedHighway.route} 的实时天气风险参考点，适合查看能见度、风力和降水影响。`
                          : '点击高速节点后，下面会同步显示路段天气与预警区。'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-700">
                      <p className="font-semibold text-slate-900">建议关注</p>
                      <ul className="mt-2 space-y-1.5">
                        <li>• 风力增强时，高架、收费站和桥面易受影响。</li>
                        <li>• 降雨后请优先关注积水点和临近立交。</li>
                        <li>• 能见度低于 5km 时建议降低车速并拉大车距。</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-xs leading-6 text-cyan-900">
                      <p className="font-semibold">预警区域</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[...new Set(highwayNodes.map((node) => node.district))].slice(0, 6).map((district) => (
                          <span key={district} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">{district}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs leading-6 text-rose-900">
                      <p className="font-semibold">官方预警</p>
                      {selectedHighwayWarning ? (
                        <div className="mt-2 rounded-xl bg-white/90 p-3 shadow-sm">
                          <p className="font-semibold text-rose-700">{selectedHighwayWarning.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{selectedHighwayWarning.publishTime || '刚刚发布'}</p>
                          <p className="mt-1 text-slate-700">{selectedHighwayWarning.content}</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-slate-600">当前高速节点对应区县暂无新预警。</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-black text-slate-900">实时详情</h3>
              </div>
              <div className="mt-3 space-y-3">
                {segment === 'metro' ? (
                  selectedMetro ? (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs text-slate-500">站点</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{selectedMetro.name}</p>
                        <p className="text-xs text-slate-500">{selectedMetro.lineName} · {selectedMetro.district}</p>
                      </div>
                      {selectedMetroWeather && (
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-sky-700">当前天气</p>
                              <p className="text-2xl font-black text-slate-900">{selectedMetroWeather.temp}°C</p>
                            </div>
                            <div className="rounded-2xl bg-white p-2 shadow-sm">{fallbackWeatherIcon(selectedMetroWeather.weatherCode)}</div>
                          </div>
                          <p className="mt-2 text-xs text-slate-600">{weatherCodeToText(selectedMetroWeather.weatherCode)} · {windDirToText(selectedMetroWeather.windDirection)} {windSpeedToLevel(selectedMetroWeather.windSpeed)}级 · AQI {aqiToText(selectedMetroWeather.aqi)}</p>
                          <p className="mt-2 text-xs leading-6 text-slate-700">{lineWeatherLabel(selectedMetroWeather)}</p>
                          {selectedMetroWarning && (
                            <div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-700 shadow-sm">
                              <p className="font-semibold text-rose-700">{selectedMetroWarning.title}</p>
                              <p className="mt-1 text-slate-600">{selectedMetroWarning.content}</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <p className="font-semibold">这站附近要注意</p>
                        <ul className="mt-2 space-y-1.5">
                          {selectedMetroWeather ? summarizeAdvice(selectedMetroWeather).map((tip) => <li key={tip}>• {tip}</li>) : <li>• 正在加载天气详情</li>}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">点击任意站点，右侧会显示站点天气、预警和出行建议。</div>
                  )
                ) : selectedHighway ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">路段</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{selectedHighway.name}</p>
                      <p className="text-xs text-slate-500">{selectedHighway.route} · {selectedHighway.district}</p>
                    </div>
                    {selectedHighwayWeather && (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
                        <p className="text-xs text-cyan-700">当前天气参考</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{selectedHighwayWeather.temp}°C</p>
                        <p className="mt-2 text-xs text-slate-600">{weatherCodeToText(selectedHighwayWeather.weatherCode)} · {windDirToText(selectedHighwayWeather.windDirection)} {windSpeedToLevel(selectedHighwayWeather.windSpeed)}级 · AQI {aqiToText(selectedHighwayWeather.aqi)}</p>
                        <p className="mt-2 text-xs leading-6 text-slate-700">{selectedHighwayWeather.windSpeed >= 8 ? '横风偏强，桥面和匝道更需减速。' : '当前风力可控，建议继续关注天气变化。'}</p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <p className="font-semibold">高速通行建议</p>
                      <ul className="mt-2 space-y-1.5">
                        <li>• 区分桥面/匝道/主线，先慢后稳。</li>
                        <li>• 若后续出现降雨，先关注积水与制动距离。</li>
                        <li>• 请结合导航与官方路况，必要时改走地面道路。</li>
                      </ul>
                    </div>
                    {selectedHighwayWarning ? (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs leading-6 text-rose-900">
                        <p className="font-semibold">预警</p>
                        <p className="mt-1">{selectedHighwayWarning.title}</p>
                        <p className="mt-1 text-slate-700">{selectedHighwayWarning.content}</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">点击地图上的高速节点，右侧会展示当前天气、风险提示和官方预警。</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {smartResults.length > 0 && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-[80] rounded-[28px] border border-white/80 bg-white/95 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl md:left-auto md:right-4 md:w-[420px]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">智能搜索结果</p>
                <p className="text-xs text-slate-500">点击任意结果，地图会自动定位并高亮。</p>
              </div>
              <button onClick={() => setSmartResults([])} className="rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
              {smartResults.map((item) => (
                <button key={`${item.kind}-${item.id}`} onClick={() => selectSuggestion(item)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left hover:bg-white">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="truncate text-xs text-slate-500">{item.kind === 'metro' ? item.lineName : item.route}</p>
                  </div>
                  <MapPin className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
