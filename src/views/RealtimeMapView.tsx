import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Map as MapIcon,
  MapPin,
  AlertTriangle,
  Train,
  Zap,
  Droplets,
  Navigation,
  Filter,
  Info,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRealTimeTraffic, fetchTrafficIndex, fetchFloodWarnings, getCongestionColor } from '../services/aMapService';
import { fetchPollenIndex, fetchUVIndex } from '../services/ecologyService';

interface MapViewProps {
  onBack?: () => void;
}

interface DataPoint {
  id: string;
  type: 'traffic' | 'flood' | 'metro' | 'pollen' | 'uv';
  lat: number;
  lng: number;
  title: string;
  description: string;
  level?: string;
  data?: any;
}

export default function RealtimeMapView({ onBack }: MapViewProps) {
  const mapRef = useRef(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [trafficIndex, setTrafficIndex] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    traffic: true,
    flood: true,
    metro: true,
    pollen: false,
    uv: false,
  });

  // 天津地铁线路数据
  const METRO_LINES = [
    {
      name: '1号线',
      color: '#EE3F3F',
      coords: [[39.1325, 117.1516], [39.1325, 117.1956], [39.1285, 117.2405]],
    },
    {
      name: '2号线',
      color: '#0066CC',
      coords: [[39.0576, 117.2119], [39.1050, 117.2119], [39.1482, 117.2119]],
    },
    {
      name: '3号线',
      color: '#00AA44',
      coords: [[39.1408, 117.0086], [39.1408, 117.1508], [39.1408, 117.2405]],
    },
  ];

  useEffect(() => {
    loadMapData();
  }, [activeFilters]);

  async function loadMapData() {
    setLoading(true);
    const points: DataPoint[] = [];

    try {
      // 获取交通指数
      const ti = await fetchTrafficIndex('天津');
      setTrafficIndex(ti);

      // 获取实时路况
      if (activeFilters.traffic) {
        const traffic = await fetchRealTimeTraffic();
        traffic.slice(0, 5).forEach((item, idx) => {
          points.push({
            id: `traffic-${idx}`,
            type: 'traffic',
            lat: 39.1 + Math.random() * 0.1,
            lng: 117.2 + Math.random() * 0.1,
            title: item.roadName,
            description: `${item.speed} km/h - ${item.congestionLevel}`,
            level: item.congestionLevel,
          });
        });
      }

      // 获取积水预警
      if (activeFilters.flood) {
        const floods = await fetchFloodWarnings();
        floods.forEach((item) => {
          points.push({
            id: `flood-${item.id}`,
            type: 'flood',
            lat: item.lat,
            lng: item.lng,
            title: item.location,
            description: item.description,
            level: item.level,
            data: item,
          });
        });
      }

      // 添加地铁线路数据（固定位置）
      if (activeFilters.metro) {
        METRO_LINES.forEach((line) => {
          line.coords.forEach((coord, idx) => {
            points.push({
              id: `metro-${line.name}-${idx}`,
              type: 'metro',
              lat: coord[0],
              lng: coord[1],
              title: `${line.name} 站点`,
              description: '运营正常',
              level: 'normal',
            });
          });
        });
      }

      // 获取花粉指数
      if (activeFilters.pollen) {
        const pollen = await fetchPollenIndex();
        points.push({
          id: 'pollen-tianjin',
          type: 'pollen',
          lat: 39.1,
          lng: 117.2,
          title: '天津花粉指数',
          description: `${pollen.levelText} - ${pollen.mainPollen}`,
          level: `level-${pollen.level}`,
          data: pollen,
        });
      }

      // 获取 UV 指数
      if (activeFilters.uv) {
        const uv = await fetchUVIndex();
        points.push({
          id: 'uv-tianjin',
          type: 'uv',
          lat: 39.15,
          lng: 117.25,
          title: '天津紫外线指数',
          description: `${uv.levelText} - ${uv.level}`,
          level: `level-${uv.level}`,
          data: uv,
        });
      }

      setDataPoints(points);
    } catch (error) {
      console.error('地图数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  }

  // 获取点的图标
  function getMarkerIcon(type: string, level?: string) {
    let color = '#666';
    let icon = MapPin;

    switch (type) {
      case 'traffic':
        if (level === 'smooth') color = '#00b050';
        else if (level === 'slow') color = '#ffb000';
        else if (level === 'congested') color = '#ff6600';
        else color = '#cc0000';
        icon = Navigation;
        break;
      case 'flood':
        color = level === 'high' ? '#ff0000' : level === 'medium' ? '#ff9900' : '#0099ff';
        icon = Droplets;
        break;
      case 'metro':
        color = '#0066cc';
        icon = Train;
        break;
      case 'pollen':
        color = '#ffaa00';
        icon = AlertTriangle;
        break;
      case 'uv':
        color = '#ff6600';
        icon = Zap;
        break;
    }

    return L.divIcon({
      html: `<div style="background-color: ${color}; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">●</div>`,
      iconSize: [30, 30],
      className: 'custom-marker',
    });
  }

  const filteredPoints = dataPoints.filter(
    (p) => activeFilters[p.type as keyof typeof activeFilters]
  );

  return (
    <div className="fixed inset-0 bg-surface flex flex-col z-40">
      {/* Header */}
      <div className="bg-surface-variant text-on-surface-variant px-4 py-3 flex items-center justify-between border-b border-outline/30">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-black/10 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">实时地图</h2>
        </div>
        <div className="text-xs bg-secondary-container text-on-secondary-container px-2 py-1 rounded">
          交通指数：{trafficIndex?.level || '加载中'}
        </div>
      </div>

      {/* 过滤器按钮栏 */}
      <div className="bg-surface px-3 py-2 flex gap-2 overflow-x-auto border-b border-outline/20">
        {[
          { key: 'traffic', label: '路况', icon: Navigation },
          { key: 'metro', label: '地铁', icon: Train },
          { key: 'flood', label: '积水', icon: Droplets },
          { key: 'pollen', label: '花粉', icon: AlertTriangle },
          { key: 'uv', label: 'UV', icon: Zap },
        ].map((filter) => (
          <motion.button
            key={filter.key}
            onClick={() =>
              setActiveFilters((prev) => ({
                ...prev,
                [filter.key]: !prev[filter.key as keyof typeof prev],
              }))
            }
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
              activeFilters[filter.key as keyof typeof activeFilters]
                ? 'bg-primary text-on-primary'
                : 'bg-outline/20 text-on-surface-variant'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* 地图容器 */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          center={[39.1255, 117.1901]}
          zoom={11}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 地铁线路 */}
          {activeFilters.metro &&
            METRO_LINES.map((line) => (
              <Polyline
                key={`line-${line.name}`}
                positions={line.coords as any}
                color={line.color}
                weight={3}
                opacity={0.7}
              />
            ))}

          {/* 数据点 */}
          {filteredPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={getMarkerIcon(point.type, point.level)}
              eventHandlers={{
                click: () => setSelectedPoint(point),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{point.title}</p>
                  <p className="text-xs text-gray-600">{point.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-surface rounded-lg px-4 py-3 text-sm">加载中...</div>
          </div>
        )}
      </div>

      {/* 详情面板 */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-surface border-t border-outline/30 rounded-t-3xl shadow-lg max-h-[40vh] overflow-y-auto"
          >
            <div className="px-4 py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">
                    {selectedPoint.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {selectedPoint.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="p-1 hover:bg-outline/20 rounded"
                >
                  ✕
                </button>
              </div>

              {/* 类型特定的详情 */}
              {selectedPoint.type === 'traffic' && (
                <div className="space-y-2 text-sm">
                  <p className="text-on-surface-variant">
                    ⚠️ 点击地图上的其他路段查看更多路况信息
                  </p>
                </div>
              )}

              {selectedPoint.type === 'flood' && selectedPoint.data && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">风险等级：</span>
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold text-white"
                      style={{
                        backgroundColor:
                          selectedPoint.data.level === 'high'
                            ? '#ff0000'
                            : selectedPoint.data.level === 'medium'
                              ? '#ff9900'
                              : '#0099ff',
                      }}
                    >
                      {selectedPoint.data.level === 'high'
                        ? '高风险'
                        : selectedPoint.data.level === 'medium'
                          ? '中风险'
                          : '低风险'}
                    </span>
                  </div>
                  <p className="text-on-surface-variant">
                    {selectedPoint.data.description}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    更新时间：{new Date(selectedPoint.data.updateTime).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}

              {selectedPoint.type === 'pollen' && selectedPoint.data && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">花粉等级：</span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-900">
                      {selectedPoint.data.levelText}
                    </span>
                  </div>
                  <p>主要花粉：{selectedPoint.data.mainPollen}</p>
                  <p className="text-on-surface-variant">💡 {selectedPoint.data.advise}</p>
                </div>
              )}

              {selectedPoint.type === 'uv' && selectedPoint.data && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">紫外线等级：</span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-900">
                      {selectedPoint.data.levelText}
                    </span>
                  </div>
                  <p className="text-on-surface-variant">💡 {selectedPoint.data.advise}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
