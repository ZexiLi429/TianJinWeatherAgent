import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Thermometer, Droplets, ChevronRight, Map as MapIcon, BarChart2, List } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const FORECAST_DATA = [
  { date: '05/07', day: '今天', text: '晴', high: 24, low: 13, icon: Sun },
  { date: '05/08', day: '明天', text: '多云', high: 28, low: 17, icon: Cloud },
  { date: '05/09', day: '周六', text: '多云', high: 31, low: 20, icon: Cloud },
  { date: '05/10', day: '周日', text: '晴', high: 32, low: 21, icon: Sun },
  { date: '05/11', day: '周一', text: '多云', high: 32, low: 21, icon: Cloud },
  { date: '05/12', day: '周二', text: '多云', high: 34, low: 23, icon: Cloud },
  { date: '05/13', day: '周三', text: '晴', high: 33, low: 20, icon: Sun },
];

export default function ConventionalWeatherView({ onShowRadar }: { onShowRadar: () => void }) {
  const [forecastMode, setForecastMode] = useState<'trend' | 'list'>('trend');
  const [weatherType, setWeatherType] = useState<'rain' | 'temp' | 'max' | 'min'>('rain');

  return (
    <div className="pt-14 pb-32 flex flex-col space-y-6">
      {/* Top Tabs - Matching Image Style */}
      <div className="bg-gradient-to-b from-primary to-primary-container px-4 pt-4 pb-8 -mt-2">
        <div className="flex bg-white/20 backdrop-blur-md rounded-xl p-1 shadow-inner">
          {[
            { id: 'rain', label: '雨量' },
            { id: 'temp', label: '温度' },
            { id: 'max', label: '高温' },
            { id: 'min', label: '低温' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setWeatherType(tab.id as any)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${weatherType === tab.id ? 'bg-white text-primary shadow-md' : 'text-white/60'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-6 -mt-6">
        {/* 1. 基于地图的天气实况查询 */}
        <section>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-primary/10">
            <div className="p-4 border-b border-on-surface/5 flex justify-between items-center">
              <h2 className="font-bold text-primary flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                天津{weatherType === 'rain' ? '雨量' : weatherType === 'temp' ? '实况' : weatherType === 'max' ? '最高气温' : '最低气温'}实况
              </h2>
              <span className="text-[10px] text-on-surface-variant font-bold">05/11 20:00</span>
            </div>
            
            <div className="relative aspect-[4/3] bg-surface-container-low">
              <img 
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" 
                alt="Tianjin Map"
                className="w-full h-full object-cover grayscale opacity-40"
              />
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              
              {/* Mock Map Markers for Districts */}
              {[
                { name: '南开', x: '45%', y: '50%', val: weatherType === 'rain' ? '0.0mm' : '26°C' },
                { name: '河西', x: '55%', y: '55%', val: weatherType === 'rain' ? '0.0mm' : '26°C' },
                { name: '滨海', x: '80%', y: '60%', val: weatherType === 'rain' ? '0.2mm' : '24°C' },
                { name: '蓟州', x: '60%', y: '20%', val: weatherType === 'rain' ? '1.2mm' : '21°C' },
                { name: '武清', x: '35%', y: '30%', val: weatherType === 'rain' ? '0.0mm' : '25°C' },
                { name: '西青', x: '38%', y: '55%', val: weatherType === 'rain' ? '0.0mm' : '26°C' },
                { name: '津南', x: '62%', y: '65%', val: weatherType === 'rain' ? '0.0mm' : '25°C' },
              ].map((m, i) => (
                <div 
                  key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: m.x, top: m.y }}
                >
                  <div className="bg-primary/90 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm font-bold whitespace-nowrap border border-white/20">
                    {m.val}
                  </div>
                </div>
              ))}

              <div className="absolute bottom-4 left-4 right-4 bg-white/70 backdrop-blur-md p-2 rounded-xl shadow-lg border border-primary/10">
                <div className="flex flex-col gap-1">
                  <div className={`h-1.5 w-full bg-gradient-to-r rounded-full ${weatherType === 'rain' ? 'from-green-100 via-blue-500 to-purple-600' : 'from-blue-200 via-yellow-400 to-red-500'}`} />
                  <div className="flex justify-between text-[7px] text-on-surface-variant px-1 font-bold">
                    {weatherType === 'rain' ? (
                      <><span>0.1</span><span>1.0</span><span>10</span><span>25</span><span>50</span><span>100</span></>
                    ) : (
                      <><span>10°</span><span>15°</span><span>20°</span><span>25°</span><span>30°</span><span>35°+</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* 强对流天气提示语 - 点击进去后显示雷达图 */}
      <section>
        <button 
          onClick={onShowRadar}
          className="w-full bg-surface-container shadow-sm border border-primary/5 rounded-2xl p-4 flex items-center justify-between group active:scale-95 transition-all overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-error/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 z-10">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error animate-pulse">
              <CloudLightning className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-on-surface">强对流天气追踪</h3>
              <p className="text-sm text-on-surface-variant">未来2小时暂无雷电活动，点击查看实时回波图</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* 2. 基于位置的未来7天预报图 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline font-bold text-lg text-primary flex items-center gap-2">
            <AreaChart className="w-5 h-5" />
            7天天气预报
          </h2>
          <div className="flex bg-surface-container-high rounded-full p-0.5 border border-primary/5">
            <button 
              onClick={() => setForecastMode('trend')}
              className={`p-1.5 px-3 rounded-full transition-all ${forecastMode === 'trend' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'}`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setForecastMode('list')}
              className={`p-1.5 px-3 rounded-full transition-all ${forecastMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-surface-container rounded-3xl p-6 shadow-sm border border-primary/5">
          {forecastMode === 'trend' ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={FORECAST_DATA} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                    dy={10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="high" 
                    stroke="#FF7E5F" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#FF7E5F', strokeWidth: 2, stroke: '#fff' }} 
                    label={{ position: 'top', fontSize: 12, fill: '#FF7E5F', fontWeight: 'bold' }}
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="low" 
                    stroke="#4facfe" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#4facfe', strokeWidth: 2, stroke: '#fff' }}
                    label={{ position: 'bottom', fontSize: 12, fill: '#4facfe', fontWeight: 'bold' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-1 mt-4">
                {FORECAST_DATA.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <item.icon className="w-5 h-5 text-primary/60" />
                    <span className="text-[10px] text-on-surface-variant font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {FORECAST_DATA.map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-on-surface/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 w-1/4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">{item.day}</span>
                      <span className="text-[10px] text-on-surface-variant font-medium">{item.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-center w-1/3">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-on-surface">{item.text}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end w-1/4 font-mono">
                    <span className="text-lg font-bold text-[#FF7E5F]">{item.high}°</span>
                    <span className="text-lg font-bold text-[#4facfe]">{item.low}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Additional Stats Section */}
      <section className="grid grid-cols-2 gap-4">
        {[
          { label: '湿度', val: '45%', icon: Droplets, color: 'text-blue-500' },
          { label: '感温', val: '28°C', icon: Thermometer, color: 'text-orange-500' },
          { label: '能见度', val: '15km', icon: Sun, color: 'text-yellow-500' },
          { label: '风力', val: '3级', icon: Wind, color: 'text-teal-500' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-primary/5">
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${s.color} shadow-sm`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-on-surface-variant font-medium">{s.label}</div>
              <div className="text-lg font-bold text-on-surface">{s.val}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  </div>
  );
}
