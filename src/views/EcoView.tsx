import { motion } from 'framer-motion';
import { 
  Leaf, ChevronRight, BarChart3, CloudRain, Thermometer, 
  Map as MapIcon, Calendar, Tent, Wind, Info, PlayCircle, 
  ArrowRight, ShieldCheck, Sun
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import ecoImage1 from '../assets/avatars/1.png';
import ecoImage2 from '../assets/avatars/2.png';

const TEMP_30D = Array.from({ length: 30 }, (_, i) => ({
  day: `05/${String(i + 1).padStart(2, '0')}`,
  high: 24 + Math.sin(i * 0.5) * 5 + (Math.random() * 2),
  low: 15 + Math.sin(i * 0.5) * 3 + (Math.random() * 2),
}));

const RAIN_30D = Array.from({ length: 30 }, (_, i) => ({
  day: `05/${String(i + 1).padStart(2, '0')}`,
  prob: Math.random() > 0.8 ? Math.random() * 80 + 20 : 0,
}));

const DISTRICT_DATA = [
  { name: '蓟州', camping: '非常适宜', catkin: '4月14日', color: 'bg-green-500' },
  { name: '宝坻', camping: '适宜', catkin: '4月11日', color: 'bg-green-400' },
  { name: '武清', camping: '适宜', catkin: '4月10日', color: 'bg-green-400' },
  { name: '宁河', camping: '适宜', catkin: '4月13日', color: 'bg-green-400' },
  { name: '北辰', camping: '一般', catkin: '4月9日', color: 'bg-yellow-400' },
  { name: '市区', camping: '一般', catkin: '4月6日', color: 'bg-yellow-400' },
  { name: '静海', camping: '一般', catkin: '4月8日', color: 'bg-yellow-400' },
  { name: '滨海', camping: '不适宜', catkin: '4月10日', color: 'bg-orange-400' },
];

export default function EcoView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 px-4 space-y-8 pb-72 overflow-x-hidden"
    >
      {/* 1. 30天气候预测图 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            30天气候预测
          </h2>
          <span className="text-[10px] text-on-surface-variant font-medium">天津地区 05/11-06/10</span>
        </div>

        {/* Temperature Trend */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-on-surface/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-orange-500 italic">温暖</h3>
              <p className="text-[10px] text-on-surface-variant leading-relaxed max-w-[200px]">
                预计未来30天白天平均气温为 <span className="font-bold">28.8°C</span>；有1次升温，5月18日前后升温11.0°C。
              </p>
            </div>
            <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold border border-orange-100 italic">
              升温预测
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TEMP_30D} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#94a3b8' }} 
                  interval={6}
                />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={2000}
                />
                <Line 
                  type="monotone" 
                  dataKey="low" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
              <div className="w-3 h-1 bg-orange-500 rounded-full" /> 白天气温
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
              <div className="w-3 h-1 bg-blue-500 rounded-full" /> 夜间气温
            </div>
          </div>
        </div>

        {/* Precipitation Trend */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-on-surface/5 space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold text-on-surface-variant">预计未来30天将有</span>
            <span className="text-4xl font-black text-blue-500 italic">4</span>
            <span className="text-[11px] font-bold text-on-surface-variant">天有降水</span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RAIN_30D} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" hide />
                <Bar dataKey="prob" radius={[2, 2, 0, 0]}>
                  {RAIN_30D.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.prob > 0 ? '#3b82f6' : '#f1f5f9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center px-4">
            <span className="text-[10px] text-on-surface-variant font-bold">5月10日</span>
            <div className="flex gap-1">
              {Array.from({ length: 15 }).map((_, i) => (
                 <div key={i} className={`w-1 h-3 rounded-full ${i % 4 === 0 ? 'bg-blue-400' : 'bg-on-surface/5'}`} />
              ))}
            </div>
            <span className="text-[10px] text-on-surface-variant font-bold">6月10日</span>
          </div>
        </div>
      </section>

      {/* 2. 露营与康养产品 */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <Tent className="w-5 h-5 text-tertiary" />
            天津露营气象地图
          </h2>
          <span className="text-[10px] px-2 py-0.5 bg-tertiary/10 text-tertiary rounded-full font-bold">5月11日 发布</span>
        </div>

        <div className="bg-[#f2efe9] rounded-3xl p-6 shadow-xl border border-on-surface/5 relative overflow-hidden">
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
          
          <div className="relative flex gap-6">
            <div className="w-1/2 aspect-[3/4] relative">
              {/* Mock Map with Districts */}
              <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-lg">
                {/* Simplified Tianjin shape with district blocks */}
                <path d="M40 10 L60 10 L75 40 L70 80 L90 100 L85 140 L20 140 L10 80 L40 10 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                {DISTRICT_DATA.map((d, i) => {
                  // Mock positions
                  const pos = [
                    { x: 50, y: 30 }, { x: 55, y: 55 }, { x: 35, y: 50 },
                    { x: 70, y: 65 }, { x: 45, y: 75 }, { x: 45, y: 95 },
                    { x: 30, y: 110 }, { x: 70, y: 105 }
                  ][i];
                  return (
                    <circle key={i} cx={pos.x} cy={pos.y} r="5" className={`${d.camping === '非常适宜' ? 'fill-green-600' : d.camping === '适宜' ? 'fill-green-400' : d.camping === '一般' ? 'fill-yellow-400' : 'fill-orange-500'}`} />
                  );
                })}
              </svg>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="bg-yellow-400 px-3 py-1 rounded-full text-[10px] font-black italic inline-block shadow-sm">最佳时段: 上午和傍晚</div>
                <div className="bg-blue-400 px-3 py-1 rounded-full text-[10px] font-black italic inline-block text-white shadow-sm">推荐地点: 市郊和山区</div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase border-b border-on-surface/10 pb-1">详细评分</p>
                <div className="space-y-0.5">
                  {[
                    "① 舒适度: 气温24/15°C, 湿度40%",
                    "② 高影响: 风力较大, 午后显著",
                    "③ 空气质量: 良",
                    "④ 紫外线: 较弱",
                    "⑤ 花粉浓度: 较低"
                  ].map((text, i) => (
                    <p key={i} className="text-[9px] font-medium text-on-surface/70">{text}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/40">
             <h4 className="text-[11px] font-black text-on-surface flex items-center gap-1 mb-2">
               <Info className="w-3 h-3 text-primary" /> 个性化建议
             </h4>
             <p className="text-[10px] leading-relaxed text-on-surface-variant font-medium">
               沿海地区风力偏大，帐篷搭建稳定性受影响；建议选择山坳、林间等有自然挡风条件的区域。扎营时注意加固地钉。
             </p>
          </div>
        </div>
      </section>

      {/* 3. 杨柳絮预报 product */}
      <section className="space-y-4">
         <div className="flex justify-between items-center">
          <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <Wind className="w-5 h-5 text-primary" />
            杨柳絮始期预报
          </h2>
          <span className="text-[9px] font-bold text-on-surface-variant bg-on-surface/5 px-2 py-1 rounded-full">气候变迁产品</span>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-lg border border-on-surface/5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-2/5 aspect-[3/4] relative rounded-2xl overflow-hidden shadow-lg border border-orange-100">
               <img 
                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Cdefs%3E%3ClinearGradient id='skyGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23fef9e7;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23ffe5b4;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23skyGrad)' width='300' height='400'/%3E%3Cpath d='M0 250 Q75 200 150 220 T300 250 L300 400 L0 400 Z' fill='%2384a76d' opacity='0.8'/%3E%3Ccircle cx='80' cy='120' r='50' fill='%23f4d56f' opacity='0.9'/%3E%3Cpath d='M50 160 Q45 180 50 200 Q40 220 45 240' stroke='%23c9a968' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Cpath d='M70 160 Q65 185 70 210 Q60 230 65 250' stroke='%23c9a968' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Cpath d='M90 160 Q85 182 90 208 Q80 228 85 248' stroke='%23c9a968' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='50' cy='195' r='6' fill='%23e8d5b7'/%3E%3Ccircle cx='45' cy='210' r='5' fill='%23e8d5b7'/%3E%3Ccircle cx='52' cy='220' r='5' fill='%23e8d5b7'/%3E%3Ccircle cx='70' cy='210' r='6' fill='%23e8d5b7'/%3E%3Ccircle cx='65' cy='225' r='5' fill='%23e8d5b7'/%3E%3Ccircle cx='75' cy='235' r='5' fill='%23e8d5b7'/%3E%3Ccircle cx='90' cy='205' r='6' fill='%23e8d5b7'/%3E%3Ccircle cx='85' cy='220' r='5' fill='%23e8d5b7'/%3E%3Ccircle cx='95' cy='235' r='5' fill='%23e8d5b7'/%3E%3Ccircle cx='120' cy='100' r='2' fill='%23e8d5b7' opacity='0.6'/%3E%3Ccircle cx='150' cy='120' r='2' fill='%23e8d5b7' opacity='0.5'/%3E%3Ccircle cx='110' cy='140' r='2' fill='%23e8d5b7' opacity='0.6'/%3E%3Ccircle cx='160' cy='150' r='2' fill='%23e8d5b7' opacity='0.5'/%3E%3Ccircle cx='130' cy='170' r='2' fill='%23e8d5b7' opacity='0.6'/%3E%3Cpath d='M0 260 L10 240' stroke='%236b8e4e' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M25 260 L35 235' stroke='%236b8e4e' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M50 260 L60 238' stroke='%236b8e4e' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M100 265 L110 240' stroke='%236b8e4e' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M200 265 L210 235' stroke='%236b8e4e' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E" 
                 alt="Catkin Distribution Map"
                 className="w-full h-full object-cover"
               />
            </div>
            <div className="flex-1 space-y-3">
              {DISTRICT_DATA.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between border-b border-on-surface/5 pb-1">
                   <span className="text-xs font-bold text-on-surface">{d.name}区</span>
                   <span className="text-[10px] font-black text-orange-600">{d.catkin}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
             <div className="flex items-center gap-3">
               <div className="flex flex-col gap-1 shrink-0">
                  <div className="h-3 w-12 bg-orange-100 rounded-sm" />
                  <div className="h-3 w-12 bg-orange-300 rounded-sm" />
                  <div className="h-3 w-12 bg-orange-500 rounded-sm" />
               </div>
               <p className="text-[10px] leading-relaxed text-orange-900/70 font-medium">
                 预计今年天津中心城区杨柳絮始期较往年略早，请呼吸道敏感人群及过敏体质人群注意提前做好防护准备。
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* 4. 特色生态产品入口 */}
      <section className="space-y-4">
        <h2 className="font-headline text-lg font-bold text-on-surface">特色生态产品</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="group relative h-40 rounded-3xl overflow-hidden shadow-md">
            <img 
              src={ecoImage1}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              alt="Tianjin Forest"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <span className="text-white text-[9px] font-bold uppercase tracking-widest bg-emerald-500 px-2 py-0.5 rounded-full w-fit mb-1">年度精选</span>
              <h3 className="text-white font-bold text-sm">生态天津 · 森林氧吧</h3>
            </div>
          </div>
          <div className="group relative h-40 rounded-3xl overflow-hidden shadow-md">
            <img 
              src={ecoImage2}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              alt="Tianjin River Spring"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <span className="text-white text-[9px] font-bold uppercase tracking-widest bg-blue-500 px-2 py-0.5 rounded-full w-fit mb-1">专题报告</span>
              <h3 className="text-white font-bold text-sm">海河之春 · 气候解读</h3>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
