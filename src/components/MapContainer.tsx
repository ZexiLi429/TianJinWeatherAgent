import React, { useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// 修正 Leaflet 在某些环境下图标不显示的问题
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapContainerProps {
  children?: React.ReactNode;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  className?: string;
  mapTypeId?: 'roadmap' | 'satellite';
}

// 动态调整地图中心的组件
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapContainer({ 
  children, 
  center = [39.1255, 117.1901], // 天津中心
  zoom = 11,
  className = 'w-full h-full',
  mapTypeId = 'roadmap'
}: MapContainerProps) {
  const [isReady, setIsReady] = useState(false);
  const [tileStatus, setTileStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  
  // 使用 Esri 的免费卫星图服务作为实景图
  const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  // 使用 OpenStreetMap 作为普通街区图
  const streetUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className={className + " relative z-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_45%,#eef2ff_100%)]"}>
      <LeafletMap 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#0b0c1b' }}
        whenReady={() => setIsReady(true)}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; Esri'
          url={mapTypeId === 'satellite' ? satelliteUrl : streetUrl}
          eventHandlers={{
            load: () => setTileStatus('ready'),
            tileerror: () => setTileStatus('failed'),
          }}
        />
        {children}
      </LeafletMap>

      {(tileStatus !== 'ready' || !isReady) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b0c1b]/75 backdrop-blur-sm text-white">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium">
            {tileStatus === 'failed' ? '底图暂不可用，已保留监测点结构' : '地图加载中...'}
          </div>
        </div>
      )}
    </div>
  );
}
