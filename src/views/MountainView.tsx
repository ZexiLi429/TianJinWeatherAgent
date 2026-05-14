import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MapContainer from '../components/MapContainer';
import {
  ChevronLeft,
  Mountain,
  ShieldAlert,
  Flame,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Clock3,
  Navigation,
  Share2,
} from 'lucide-react';

interface MountainStation {
  id: string;
  name: string;
  temp: number;
  rain: number;
  wind: string;
  lat: number;
  lng: number;
}

interface HazardPoint {
  id: string;
  name: string;
  type: '崩塌' | '滑坡' | '泥石流' | '地面塌陷';
  risk: 'low' | 'med' | 'high' | 'extreme';
  rain24h: number;
  rainPred6h: number;
  historicLevel: 'normal' | 'history_hit';
  lat: number;
  lng: number;
}

interface MountainViewProps {
  onBack: () => void;
}

const STATIONS: MountainStation[] = [
  { id: 's1', name: '盘山风景区', temp: 22.4, rain: 0.0, wind: '北风 2级', lat: 60, lng: 20 },
  { id: 's2', name: '罗庄子镇', temp: 21.8, rain: 0.0, wind: '东北风 1级', lat: 45, lng: 45 },
  { id: 's3', name: '梨木台', temp: 19.5, rain: 1.5, wind: '微风', lat: 30, lng: 60 },
  { id: 's4', name: '八仙山', temp: 18.2, rain: 2.1, wind: '北风 4级', lat: 25, lng: 75 },
  { id: 's5', name: '蓟州城区', temp: 23.5, rain: 0.0, wind: '南风 1级', lat: 75, lng: 55 },
];

const HAZARD_POINTS: HazardPoint[] = [
  { id: 'h1', name: '官庄镇西后子峪村崩塌', type: '崩塌', risk: 'high', rain24h: 42.5, rainPred6h: 15, historicLevel: 'history_hit', lat: 55, lng: 25 },
  { id: 'h2', name: '下营镇小港村滑坡点', type: '滑坡', risk: 'med', rain24h: 28.1, rainPred6h: 8, historicLevel: 'normal', lat: 35, lng: 50 },
  { id: 'h3', name: '穿芳峪镇泥石流隐患道', type: '泥石流', risk: 'extreme', rain24h: 58.2, rainPred6h: 30, historicLevel: 'history_hit', lat: 40, lng: 70 },
  { id: 'h4', name: '罗庄子镇地面塌陷点 24', type: '地面塌陷', risk: 'low', rain24h: 5.2, rainPred6h: 2, historicLevel: 'normal', lat: 48, lng: 35 },
];

const FIRE_ALERTS = [
  {
    level: '高',
    title: '森林火险三级预警',
    content: '蓟州山区持续干燥，西北风4-5级，极易发生森林火灾，严禁野外用火。',
  },
];

function riskClass(risk: HazardPoint['risk']): string {
  if (risk === 'extreme') return 'bg-red-50 text-red-700 border-red-200';
  if (risk === 'high') return 'bg-orange-50 text-orange-700 border-orange-200';
  if (risk === 'med') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function riskColor(risk: HazardPoint['risk']): string {
  if (risk === 'extreme') return '#dc2626';
  if (risk === 'high') return '#f97316';
  if (risk === 'med') return '#f59e0b';
  return '#22c55e';
}

export default function MountainView({ onBack }: MountainViewProps) {
  const [activeMode, setActiveMode] = useState<'routine' | 'hazard' | 'fire'>('routine');
  const [selectedPoint, setSelectedPoint] = useState<HazardPoint | null>(null);

  const routineStats = useMemo(() => {
    const avgTemp = STATIONS.reduce((sum, s) => sum + s.temp, 0) / STATIONS.length;
    const rainStations = STATIONS.filter((s) => s.rain > 0).length;
    return { avgTemp: avgTemp.toFixed(1), rainStations };
  }, []);

  const hazardStats = useMemo(() => {
    const extreme = HAZARD_POINTS.filter((h) => h.risk === 'extreme').length;
    const high = HAZARD_POINTS.filter((h) => h.risk === 'high').length;
    return { extreme, high, total: HAZARD_POINTS.length };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background text-on-surface">
      <header className="h-16 shrink-0 border-b border-on-surface/10 bg-white/90 backdrop-blur px-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-primary truncate">山区哨兵</h1>
          <p className="text-[11px] text-on-surface-variant truncate">蓟州山区监测 · 地灾预警 · 森林防火</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-on-surface-variant">最新更新</p>
          <p className="text-xs font-semibold text-primary">12:40</p>
        </div>
      </header>

      <div className="px-4 pt-3 shrink-0">
        <div className="bg-white rounded-2xl p-1 border border-on-surface/10 flex gap-1">
          {[
            { id: 'routine', icon: Mountain, label: '日常气象' },
            { id: 'hazard', icon: ShieldAlert, label: '地灾监控' },
            { id: 'fire', icon: Flame, label: '森林防火' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id as 'routine' | 'hazard' | 'fire')}
              className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeMode === tab.id ? 'bg-primary text-white' : 'text-on-surface-variant'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-4">
        <AnimatePresence mode="wait">
          {(activeMode === 'routine' || activeMode === 'hazard') && (
            <motion.section
              key={`map-${activeMode}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-2xl bg-white border border-on-surface/10 p-3 shadow-sm">
                  <p className="text-[11px] text-on-surface-variant">监测站点</p>
                  <p className="text-lg font-bold text-primary mt-1">{STATIONS.length}</p>
                </div>
                <div className="rounded-2xl bg-white border border-on-surface/10 p-3 shadow-sm">
                  <p className="text-[11px] text-on-surface-variant">平均气温</p>
                  <p className="text-lg font-bold text-primary mt-1">{routineStats.avgTemp}°C</p>
                </div>
                <div className="rounded-2xl bg-white border border-on-surface/10 p-3 shadow-sm">
                  <p className="text-[11px] text-on-surface-variant">高危地灾</p>
                  <p className="text-lg font-bold text-red-600 mt-1">{hazardStats.extreme + hazardStats.high}</p>
                </div>
                <div className="rounded-2xl bg-white border border-on-surface/10 p-3 shadow-sm">
                  <p className="text-[11px] text-on-surface-variant">降雨站点</p>
                  <p className="text-lg font-bold text-sky-600 mt-1">{routineStats.rainStations}</p>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-primary flex items-center gap-2 text-sm">
                    <Navigation className="w-4 h-4" />
                    蓟州山区监测地图
                  </h2>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                    {activeMode === 'routine' ? '气象监测模式' : '地灾巡检模式'}
                  </span>
                </div>

                <div className="rounded-2xl border border-sky-100 overflow-hidden h-[430px] bg-sky-50">
                  <MapContainer center={[40.046, 117.406]} zoom={10} mapTypeId="satellite">
                    {activeMode === 'routine' &&
                      STATIONS.map((station) => {
                        const icon = L.divIcon({
                          className: '',
                          html: `<div style="width:32px;height:32px;border-radius:12px;background:rgba(59,130,246,.18);backdrop-filter:blur(4px);border:1px solid rgba(59,130,246,.45);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.25)">${station.temp}°</div>`,
                          iconSize: [32, 32],
                          iconAnchor: [16, 16],
                        });

                        return (
                          <Marker
                            key={station.id}
                            position={[40.1 - station.lat / 200, 117.3 + station.lng / 200]}
                            icon={icon}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-semibold text-slate-700">{station.name}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  气温 {station.temp}°C · 降雨 {station.rain}mm · {station.wind}
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}

                    {activeMode === 'hazard' &&
                      HAZARD_POINTS.map((point) => {
                        const color = riskColor(point.risk);
                        const icon = L.divIcon({
                          className: '',
                          html: `<div style="position:relative;width:22px;height:22px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.28)"></div>`,
                          iconSize: [22, 22],
                          iconAnchor: [11, 11],
                        });

                        return (
                          <Marker
                            key={point.id}
                            position={[40.05 - point.lat / 200, 117.35 + point.lng / 200]}
                            icon={icon}
                            eventHandlers={{ click: () => setSelectedPoint(point) }}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-semibold text-slate-700">{point.name}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {point.type} · 24h雨量 {point.rain24h}mm
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                  </MapContainer>
                </div>

                {activeMode === 'hazard' && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-red-700">极高风险 {hazardStats.extreme}</div>
                    <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2 text-orange-700">高风险 {hazardStats.high}</div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-600">总隐患点 {hazardStats.total}</div>
                  </div>
                )}
              </div>

              {activeMode === 'routine' && (
                <div className="space-y-2">
                  {STATIONS.map((station) => (
                    <div key={station.id} className="rounded-2xl bg-white border border-on-surface/10 p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{station.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">山区自动监测站</p>
                        </div>
                        <p className="text-lg font-bold text-primary">{station.temp}°</p>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-sky-50 border border-sky-100 px-2 py-2 text-sky-700 flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5" />
                          降雨 {station.rain} mm
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-2 py-2 text-slate-600 flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5" />
                          {station.wind}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeMode === 'hazard' && (
                <div className="space-y-2">
                  {HAZARD_POINTS.map((point) => (
                    <button
                      key={point.id}
                      onClick={() => setSelectedPoint(point)}
                      className="w-full text-left rounded-2xl bg-white border border-on-surface/10 p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{point.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{point.type}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${riskClass(point.risk)}`}>
                          {point.risk === 'extreme' ? '极高风险' : point.risk === 'high' ? '高风险' : point.risk === 'med' ? '中风险' : '低风险'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {activeMode === 'fire' && (
            <motion.section
              key="fire"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {FIRE_ALERTS.map((alert) => (
                <div key={alert.title} className="rounded-3xl bg-orange-50 border border-orange-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] px-2 py-1 rounded-full bg-orange-600 text-white font-semibold">{alert.level}级火险</span>
                    <div className="h-px flex-1 bg-orange-200" />
                  </div>
                  <h3 className="text-lg font-bold text-orange-700">{alert.title}</h3>
                  <p className="text-sm text-orange-700/90 mt-2 leading-relaxed">{alert.content}</p>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-sm">
                  <h4 className="text-sm font-semibold text-primary mb-2">巡护状态</h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <p className="flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5 text-slate-500" /> 今日巡护里程：38.6 km</p>
                    <p className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 火源风险区域：2 处</p>
                    <p className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-orange-500" /> 地表温度峰值：31.8°C</p>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-4 border border-white/60 shadow-sm">
                  <h4 className="text-sm font-semibold text-primary mb-2">应急建议</h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <p className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-sky-500" /> 重点巡查林区进山口和道路交汇点。</p>
                    <p className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-emerald-500" /> 禁止野外明火，作业先报备。</p>
                    <p className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" /> 干热大风时段提前布控力量。</p>
                  </div>
                </div>
              </div>

              <button className="w-full h-11 rounded-2xl bg-primary text-white text-sm font-semibold shadow-sm">
                一键启动山区应急联动
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedPoint && (
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
                <p className="text-sm font-bold text-on-surface">{selectedPoint.name}</p>
                <p className="text-xs text-on-surface-variant mt-1">{selectedPoint.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-3">
                <p className="text-[11px] text-sky-700">24h雨量</p>
                <p className="text-lg font-bold text-sky-700 mt-1">{selectedPoint.rain24h}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
                <p className="text-[11px] text-indigo-700">未来6h</p>
                <p className="text-lg font-bold text-indigo-700 mt-1">{selectedPoint.rainPred6h}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                <p className="text-[11px] text-amber-700">历史影响</p>
                <p className="text-sm font-bold text-amber-700 mt-2">
                  {selectedPoint.historicLevel === 'history_hit' ? '命中' : '正常'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-primary">响应建议</p>
              <p className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 该隐患点建议 30 分钟一次复核。</p>
              <p className="flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5 text-slate-500" /> 强降雨时段加密巡查并同步上报。</p>
              <p className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-emerald-500" /> 立即通知周边村镇预防次生灾害。</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}