import { useState } from 'react';
import { motion } from 'framer-motion';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Video, Thermometer, Play, Clock, MapPin, Wind, Droplets, Maximize2 } from 'lucide-react';
import MapContainer from '../components/MapContainer';

type LivePoint = {
  name: string;
  temp: string;
  time: string;
  status: string;
  lat: number;
  lng: number;
  wind: string;
  humidity: string;
};

export default function LiveWeatherView() {
  const [mode, setMode] = useState<'map' | 'stream'>('map');

  const livePoints: LivePoint[] = [
    { name: '天津海河广场', temp: '24°C', time: '10:30', status: 'LIVE', lat: 39.117, lng: 117.203, wind: '东南风 3级', humidity: '45%' },
    { name: '解放桥枢纽', temp: '23°C', time: '10:28', status: 'LIVE', lat: 39.123, lng: 117.208, wind: '东风 2级', humidity: '48%' },
    { name: '南京路商业街', temp: '25°C', time: '10:25', status: 'LIVE', lat: 39.126, lng: 117.215, wind: '南风 2级', humidity: '43%' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 px-4 pb-24 overflow-hidden"
    >
      <div className="flex justify-center mb-4">
        <div className="bg-surface-container-high p-1 rounded-full flex items-center w-full max-w-[280px]">
          <button
            onClick={() => setMode('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full shadow-sm font-bold transition-all ${mode === 'map' ? 'bg-white text-primary' : 'text-on-surface-variant'}`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs">地图点位</span>
          </button>
          <button
            onClick={() => setMode('stream')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-bold transition-all ${mode === 'stream' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
          >
            <Video className="w-4 h-4" />
            <span className="text-xs">视频流</span>
          </button>
        </div>
      </div>

      {mode === 'map' ? (
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#081019] shadow-2xl w-full h-[clamp(360px,58vh,560px)]">
            <MapContainer center={[39.123, 117.207]} zoom={13} mapTypeId="satellite">
              {livePoints.map((point) => (
                <Marker
                  key={point.name}
                  position={[point.lat, point.lng]}
                  icon={L.divIcon({
                    className: '',
                    html: `<div class="relative flex flex-col items-center cursor-pointer">
                      <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_18px_rgba(34,211,238,0.8)] animate-pulse"></div>
                      <div class="mt-1 px-2 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-bold border border-white/10 whitespace-nowrap">${point.temp}</div>
                    </div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                  })}
                >
                  <Popup>
                    <div className="bg-black/90 text-white p-3 rounded-2xl min-w-[160px] border border-white/10">
                      <div className="font-black text-[10px] uppercase text-cyan-400">{point.name}</div>
                      <div className="mt-2 text-[10px] space-y-1 text-white/80">
                        <div className="flex items-center gap-2"><Thermometer className="w-3 h-3" /> {point.temp}</div>
                        <div className="flex items-center gap-2"><Wind className="w-3 h-3" /> {point.wind}</div>
                        <div className="flex items-center gap-2"><Droplets className="w-3 h-3" /> 湿度 {point.humidity}</div>
                        <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {point.time} 更新</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 pointer-events-none">
              <div className="max-w-[60%] bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 text-white">
                <div className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-300">实时地图点位</div>
                <div className="text-[11px] text-white/80 mt-1">海河广场、解放桥、南京路已接入实时地图</div>
              </div>
              <div className="shrink-0 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 text-white text-right">
                <div className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-300">Live</div>
                <div className="text-[11px] text-white/80 mt-1">天津市区气温 24°C</div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 text-white max-h-[120px] overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">
                <span>节点状态</span>
                <span>Satellite_Online</span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {livePoints.map((point) => (
                  <div key={point.name} className="min-w-[130px] rounded-xl bg-black/30 border border-white/10 px-3 py-2">
                    <div className="text-xs font-bold truncate">{point.name}</div>
                    <div className="text-[10px] text-white/60 mt-1 flex items-center gap-2"><Maximize2 className="w-3 h-3" /> {point.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {livePoints.map((feed, idx) => {
            // Colorful placeholder images for video stream
            const imageUrls = [
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=1200', // Mountain landscape
              'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1200', // City sunset
              'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?auto=format&fit=crop&q=80&w=1200', // Urban colorful
            ];
            return (
            <motion.div
              key={idx}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-2xl overflow-hidden glass-card shadow-lg ${idx === 0 ? 'aspect-video' : 'aspect-[4/3]'}`}
            >
              <img src={imageUrls[idx]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="bg-error px-2 py-0.5 rounded-sm text-[10px] font-bold text-white flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> {feed.status}
                  </span>
                  <div className="bg-black/30 backdrop-blur-md rounded-lg px-2 py-1 text-white flex items-center gap-1 text-[10px]">
                    <Thermometer className="w-3 h-3" /> {feed.temp}
                  </div>
                </div>
                <div className="text-white">
                  <h3 className={`font-bold ${idx === 0 ? 'text-lg' : 'text-md'}`}>{feed.name}</h3>
                  <p className="text-[10px] opacity-80 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {feed.time} 更新
                  </p>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                <Play className="w-6 h-6 fill-current" />
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
