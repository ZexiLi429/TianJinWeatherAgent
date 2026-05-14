import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, Compass, Route, Search, ChevronRight, 
  ChevronLeft, Info, Calendar, MapPin, Navigation, 
  Sun, Cloud, CloudRain, AlertTriangle, ArrowRightLeft,
  Wind
} from 'lucide-react';

const SCENIC_SPOTS = [
  { 
    id: 1, 
    name: '天津古文化街', 
    level: '5A', 
    x: '50%', y: '52%', 
    temp: '26°C', 
    desc: '天津古文化街位于南开区，以海河为邻，是一条具有传统建筑风格的步行街。',
    route: '建议乘坐地铁2号线至东南角站下车步行至此。',
    img: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 2, 
    name: '盘山风景区', 
    level: '5A', 
    x: '62%', y: '18%', 
    temp: '22°C',
    desc: '国家5A级景区，位于蓟州区，素有“京东第一山”之称。',
    route: '建议自驾，沿津蓟高速行驶至蓟州城区出口。',
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 3, 
    name: '五大道文化旅游区', 
    level: '4A', 
    x: '52%', y: '56%', 
    temp: '26°C',
    desc: '拥有上世纪二、三十年代建成的具有不同国家建筑风格的洋楼。',
    route: '建议乘坐观光巴士或共享单车慢行骑行。',
    img: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 4, 
    name: '滨海航母主题公园', 
    level: '4A', 
    x: '85%', y: '58%', 
    temp: '24°C',
    desc: '集航母观光、武备展示、主题演出、会务会展等为一体。',
    route: '建议从市区乘坐津滨轻轨9号线后转乘公交抵达。',
    img: 'https://images.unsplash.com/photo-1551046548-c9ca08355941?auto=format&fit=crop&q=80&w=800'
  },
];

interface TourismViewProps {
  onBack: () => void;
}

export default function TourismView({ onBack }: TourismViewProps) {
  const [activeTab, setActiveTab] = useState<'spots' | 'route'>('spots');
  const [selectedSpot, setSelectedSpot] = useState<typeof SCENIC_SPOTS[0] | null>(null);
  const [routeQuery, setRouteQuery] = useState({ start: '南开区', end: '' });
  const [showRouteResult, setShowRouteResult] = useState(false);

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-32">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-primary to-primary-container h-24 pt-4 px-4 flex items-center justify-between sticky top-14 z-30 shadow-md">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          {activeTab === 'spots' ? <MapIcon className="w-5 h-5" /> : <Route className="w-5 h-5" />}
          {activeTab === 'spots' ? '景点推荐' : '路线规划'}
        </h2>
        <div className="flex bg-white/20 backdrop-blur-md rounded-full p-1">
          <button 
            onClick={() => { setActiveTab('spots'); setShowRouteResult(false); }}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${activeTab === 'spots' ? 'bg-white text-primary shadow-sm' : 'text-white/60'}`}
          >
            景点
          </button>
          <button 
            onClick={() => setActiveTab('route')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${activeTab === 'route' ? 'bg-white text-primary shadow-sm' : 'text-white/60'}`}
          >
            规划
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {activeTab === 'spots' && !selectedSpot && (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input 
                type="text" 
                placeholder="请输入景点名称"
                className="w-full bg-white rounded-2xl py-3 pl-11 pr-4 shadow-sm border border-on-surface/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              />
            </div>

            {/* Map View */}
            <section className="bg-white rounded-3xl shadow-xl overflow-hidden border border-primary/10">
              <div className="p-4 border-b border-on-surface/5 flex justify-between items-center">
                <span className="text-xs font-bold text-primary">天津A级景区气象分布图</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-600 font-bold">天气良好</span>
                </div>
              </div>
              <div className="relative aspect-[4/5] bg-surface-container-low">
                <img 
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" 
                  className="w-full h-full object-cover grayscale opacity-20"
                  alt="Tianjin Map"
                />
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                
                {SCENIC_SPOTS.map((spot) => (
                  <div 
                    key={spot.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ left: spot.x, top: spot.y }}
                    onClick={() => setSelectedSpot(spot)}
                  >
                    <div className="bg-white p-1 rounded-lg shadow-lg border border-primary/20 flex items-center gap-1 animate-in zoom-in duration-300">
                      <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-primary font-bold text-[8px]">
                        {spot.level}
                      </div>
                      <div className="px-1 text-[10px] font-bold text-on-surface whitespace-nowrap">{spot.name} | {spot.temp}</div>
                    </div>
                    <div className="w-2 h-2 bg-primary rounded-full border-2 border-white shadow-sm mt-1 mx-auto" />
                  </div>
                ))}

                {/* Legend Toggle */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <button className="bg-white/80 backdrop-blur p-2 rounded-xl shadow-md border border-white"><Navigation className="w-4 h-4 text-primary" /></button>
                   <button className="bg-white/80 backdrop-blur p-2 rounded-xl shadow-md border border-white"><Info className="w-4 h-4 text-primary" /></button>
                </div>
              </div>
            </section>

            {/* List Recommended */}
            <section className="space-y-4">
              <h3 className="font-bold text-on-surface px-2 italic">为您推荐</h3>
              <div className="space-y-3">
                {SCENIC_SPOTS.map(spot => (
                  <div 
                    key={spot.id}
                    onClick={() => setSelectedSpot(spot)}
                    className="bg-white rounded-2xl p-3 flex gap-4 shadow-sm border border-on-surface/5 active:scale-98 transition-transform"
                  >
                    <img src={spot.img} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-on-surface">{spot.name}</h4>
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-bold uppercase">{spot.level}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1">{spot.desc}</p>
                      </div>
                      <div className="flex items-center gap-3 text-primary">
                        <div className="flex items-center gap-1 font-bold text-xs"><Sun className="w-3 h-3" /> {spot.temp} 晴</div>
                        <div className="flex items-center gap-1 font-bold text-xs"><Compass className="w-3 h-3" /> 点击详情</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Selected Spot Details */}
        <AnimatePresence>
          {selectedSpot && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setSelectedSpot(null)}
                className="flex items-center gap-2 text-primary font-bold text-sm mb-2"
              >
                <ChevronLeft className="w-4 h-4" /> 返回列表
              </button>

              <div className="relative h-64 rounded-3xl overflow-hidden shadow-2xl">
                <img src={selectedSpot.img} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded font-bold">{selectedSpot.level}</span>
                    <span className="text-white/80 text-xs font-medium">天津附近景点推荐</span>
                  </div>
                  <h1 className="text-white text-3xl font-black">{selectedSpot.name}</h1>
                </div>
              </div>

              <div className="bg-primary text-white p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter">26°</span>
                    <span className="text-lg font-bold opacity-80">晴</span>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 justify-end opacity-80 font-bold text-sm">
                      <Wind className="w-4 h-4" /> 西南风1级
                    </div>
                    <div className="flex items-center gap-2 justify-end opacity-80 font-bold text-sm">
                      <CloudRain className="w-4 h-4" /> 湿度 22%
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-2xl p-3 text-center text-xs font-bold">
                  空气质量优，户外没有紫外线，不需要采取防护措施
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg border border-on-surface/5 space-y-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-on-surface flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" /> 景点简介
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{selectedSpot.desc}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-on-surface flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" /> 出行建议
                  </h4>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-on-surface/5">
                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                      {selectedSpot.route}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'route' && (
          <div className="space-y-8 mt-12">
            {!showRouteResult ? (
              <div className="relative px-8 py-20 bg-primary/5 rounded-[40px] overflow-hidden border border-primary/10">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full animate-bounce" />
                </div>
                <div className="absolute bottom-10 left-10 opacity-20">
                    <Compass className="w-32 h-32 rotate-12" />
                </div>

                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-primary ml-4 mb-1 block uppercase tracking-widest">出发城市</label>
                      <input 
                        value={routeQuery.start}
                        onChange={(e) => setRouteQuery({...routeQuery, start: e.target.value})}
                        className="w-full bg-surface-container-low rounded-2xl p-4 text-sm font-bold border border-on-surface/5 focus:outline-none"
                      />
                      <button className="absolute right-[-15px] top-1/2 -translate-y-1/2 bg-white shadow-lg p-2 rounded-full border border-on-surface/5 z-20">
                        <ArrowRightLeft className="w-4 h-4 text-primary rotate-90" />
                      </button>
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-bold text-primary ml-4 mb-1 block uppercase tracking-widest">到达城市</label>
                      <input 
                        placeholder="请输入目的地"
                        value={routeQuery.end}
                        onChange={(e) => setRouteQuery({...routeQuery, end: e.target.value})}
                        className="w-full bg-surface-container-low rounded-2xl p-4 text-sm font-bold border border-on-surface/5 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">出发时间</span>
                    <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> 2026.05.11 14:44
                    </span>
                  </div>

                  <button 
                    onClick={() => setShowRouteResult(true)}
                    className="w-full bg-primary py-4 rounded-2xl text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" /> 查看沿途天气
                  </button>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                   <button 
                    onClick={() => setShowRouteResult(false)}
                    className="flex items-center gap-2 text-primary font-bold text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> 修改路线
                  </button>
                  <span className="text-xs font-bold text-on-surface-variant">{routeQuery.start} - {routeQuery.end || '济南'}</span>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xl border border-on-surface/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-on-surface/5 pb-4">
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-on-surface">沧县</h4>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase">到达时间: 11日 21:56 晴</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-primary italic">晴</span>
                      <p className="text-[10px] text-on-surface-variant font-bold">12-22°C 西风微风</p>
                    </div>
                  </div>

                  <div className="relative h-64 bg-surface-container-low rounded-2xl overflow-hidden flex items-center justify-center">
                    {/* Simulated route map */}
                    <svg viewBox="0 0 100 200" className="w-full h-full p-10 opacity-60">
                      <path d="M 50 180 Q 80 140 50 100 T 50 20" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 8" />
                      <circle cx="50" cy="180" r="4" fill="#3b82f6" />
                      <circle cx="50" cy="20" r="4" fill="#3b82f6" />
                    </svg>
                    
                    {/* Markers on path */}
                    {[
                      { y: '80%', icon: Sun },
                      { y: '50%', icon: Cloud },
                      { y: '20%', icon: Sun }
                    ].map((m, i) => (
                      <div key={i} className="absolute transform -translate-x-1/2" style={{ left: '50%', top: m.y }}>
                         <div className="bg-white p-2 rounded-full shadow-lg border-2 border-primary/20">
                            <m.icon className="w-4 h-4 text-primary" />
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex bg-surface-container-high rounded-xl p-1 gap-1">
                    <button className="flex-1 py-2 text-[10px] font-bold bg-white text-primary rounded-lg shadow-sm">最少时间</button>
                    <button className="flex-1 py-2 text-[10px] font-bold text-on-surface-variant">最短距离</button>
                    <button className="flex-1 py-2 text-[10px] font-bold text-on-surface-variant">避开高速</button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-on-surface italic">3小时41分钟</span>
                      <span className="text-[10px] font-bold text-on-surface-variant">327.8公里</span>
                    </div>
                    <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-bold border border-green-100 flex items-center gap-2">
                      <Sun className="w-4 h-4" /> 天气不错
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
