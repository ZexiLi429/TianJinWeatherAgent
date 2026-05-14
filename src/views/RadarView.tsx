import { motion } from 'framer-motion';
import { ChevronLeft, Play, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RAIN_ESTIMATION = [
  { time: '0', val: 0 },
  { time: '20', val: 0.1 },
  { time: '40', val: 0 },
  { time: '60', val: 0.2 },
  { time: '80', val: 0 },
  { time: '100', val: 0 },
  { time: '120', val: 0 },
];

export default function RadarView({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center px-4 bg-primary text-white shrink-0 shadow-lg relative z-10">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-bold text-lg">分钟级降水估测</h1>
        <div className="w-10" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col pt-0">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" 
            alt="Radar Background"
            className="w-full h-full object-cover grayscale opacity-30"
          />
        </div>

        {/* Rain Graph Over Map */}
        <div className="z-10 bg-white/90 backdrop-blur-md rounded-2xl m-4 p-4 shadow-xl border border-primary/10">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary mt-1" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">天津市河西区友谊路街道新世纪城</span>
              <span className="text-sm font-bold text-primary mt-1">未来两小时不会下雨，放心出门吧</span>
            </div>
          </div>

          <div className="h-24 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RAIN_ESTIMATION} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8 }}
                  label={{ value: '分钟', position: 'insideBottomRight', offset: -5, fontSize: 8 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRain)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1 items-end -mt-20 pr-1 select-none pointer-events-none opacity-40">
              <span className="text-[8px] font-bold">大雨</span>
              <span className="text-[8px] font-bold mt-2">中雨</span>
              <span className="text-[8px] font-bold mt-2">小雨</span>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="absolute bottom-8 left-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-full shadow-2xl flex items-center gap-4 border border-primary/10">
            <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
              <Play className="w-6 h-6 fill-current" />
            </button>
            <div className="flex-1 h-1.5 bg-surface-container-high rounded-full relative">
              <div className="absolute left-0 top-0 h-full w-2/3 bg-primary rounded-full group">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md" />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-primary">20:25</span>
          </div>
        </div>
      </div>
    </div>
  );
}
