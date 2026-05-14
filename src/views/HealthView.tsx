import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Sun, Wind, AlertCircle, Thermometer, 
  Wind as AirIcon, Zap, Flame, ShieldAlert, Calendar, 
  UserCircle, Heart, PlayCircle, BookOpen, Volume2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import doctorAvatar from '../assets/avatars/3.png';
import { chatWithAI } from '../services/aiService';
import { fetchCurrentWeather, weatherCodeToText, windDirToText, windSpeedToLevel, aqiToText } from '../services/weatherService';

interface HealthViewProps {
  district?: string;
}

function buildLifestyleFallback(params: {
  district?: string;
  weatherText: string;
  temp: number;
  humidity: number;
  windDir: string;
  windLevel: number;
  aqiText: string;
}) {
  const { district, weatherText, temp, humidity, windDir, windLevel, aqiText } = params;
  const place = district || '天津市';

  const wear = temp >= 30
    ? '衣：轻薄透气为主，外出配遮阳帽'
    : temp <= 10
      ? '衣：建议洋葱式穿搭，早晚加外套'
      : '衣：长袖或薄外套即可，注意昼夜温差';

  const food = humidity < 35
    ? '食：多饮水，搭配汤粥和高纤蔬果'
    : humidity > 75
      ? '食：饮食清淡少油腻，注意肠胃负担'
      : '食：三餐规律，优先清淡与蛋白搭配';

  const home = aqiText === '差' || aqiText === '很差' || aqiText === '极差'
    ? '住：建议减少开窗时长，外出回家及时清洁'
    : '住：早晚短时通风，保持室内干爽整洁';

  const travel = windLevel >= 6
    ? '行：风力偏大，尽量避开高空坠物风险路段'
    : weatherText.includes('雨') || weatherText.includes('雪')
      ? '行：路面湿滑，建议慢行并预留通勤时间'
      : '行：天气总体平稳，适合步行和公共交通出行';

  return `${place}今日${weatherText}，${temp}°C，${windDir}${windLevel}级，空气${aqiText}。${wear}；${food}；${home}；${travel}。`;
}

function parseHealthIndexStatuses(raw: string): string[] | null {
  const text = raw.replace(/```json|```/g, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as { indexes?: Array<{ status?: string }> };
    if (!Array.isArray(obj.indexes) || obj.indexes.length !== INDEX_META.length) return null;
    const statuses = obj.indexes.map((item) => (item.status || '').trim().slice(0, 8));
    if (statuses.some((s) => !s)) return null;
    return statuses;
  } catch {
    return null;
  }
}

const INDEX_META = [
  { label: '负氧离子', defaultStatus: '较清新', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: '晨练指数', defaultStatus: '较适宜', icon: UserCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: '紫外线', defaultStatus: '减少室外', icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { label: '火险等级', defaultStatus: '高火险', icon: Flame, color: 'text-error', bg: 'bg-red-50' },
  { label: '花粉浓度', defaultStatus: '避免外出', icon: Wind, color: 'text-primary', bg: 'bg-primary/5' },
  { label: '洗车指数', defaultStatus: '适宜洗车', icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: '呼吸道病', defaultStatus: '发病率低', icon: Heart, color: 'text-blue-400', bg: 'bg-blue-50' },
  { label: '一氧化碳', defaultStatus: '中毒风险低', icon: ShieldAlert, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: '尾号限行', defaultStatus: '5 和 0', icon: AlertCircle, color: 'text-primary', bg: 'bg-primary/5' },
  { label: '空气污染', defaultStatus: '利于扩散', icon: AirIcon, color: 'text-teal-500', bg: 'bg-teal-50' },
];

const POLLEN_TREND = [
  { day: '05/04', val: 56 },
  { day: '05/05', val: 240 },
  { day: '05/06', val: 80 },
  { day: '05/07', val: 120 },
  { day: '05/08', val: 180 },
  { day: '05/09', val: 210 },
  { day: '05/10', val: 195 },
];

function getTodayCacheKey(district?: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `health-daily-advice:${district || '天津市'}:${today}`;
}

export default function HealthView({ district }: HealthViewProps) {
  const [dailyAdvice, setDailyAdvice] = useState(() => {
    if (typeof window === 'undefined') return '正在生成今日衣食住行建议…';
    return window.localStorage.getItem(getTodayCacheKey(district)) || '正在生成今日衣食住行建议…';
  });
  const [indexData, setIndexData] = useState(
    INDEX_META.map((item) => ({ ...item, status: item.defaultStatus }))
  );

  useEffect(() => {
    let cancelled = false;
    const cacheKey = getTodayCacheKey(district);
    const cachedAdvice = window.localStorage.getItem(cacheKey);

    if (cachedAdvice) {
      setDailyAdvice(cachedAdvice);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const weather = await fetchCurrentWeather(district);
        const weatherText = weatherCodeToText(weather.weatherCode);
        const windDir = windDirToText(weather.windDirection);
        const windLevel = windSpeedToLevel(weather.windSpeed);
        const aqiText = aqiToText(weather.aqi);

        const prompt = [
          '请基于以下今日天气，生成一段衣食住行建议，中文，80-120字，口吻友好实用，不要分点，不要标题。',
          `地区：${district || '天津市'}`,
          `天气：${weatherText}`,
          `气温：${weather.temp}°C，体感：${weather.feelsLike}°C`,
          `湿度：${weather.humidity}%`,
          `风况：${windDir}${windLevel}级`,
          `空气质量：${aqiText}`,
        ].join('\n');

        const aiText = await chatWithAI(prompt);
        const cleaned = aiText.replace(/\s+/g, ' ').trim();

        const indexPrompt = [
          '请根据今日天气生成10个生活指数状态，严格返回JSON，不要额外文字。',
          'JSON格式：{"indexes":[{"label":"负氧离子","status":"较清新"}, ...共10项]}',
          'status要求：2-8字，简洁可读。label必须按以下顺序：',
          INDEX_META.map((item) => item.label).join('、'),
          `地区：${district || '天津市'}`,
          `天气：${weatherText}`,
          `气温：${weather.temp}°C，体感：${weather.feelsLike}°C`,
          `湿度：${weather.humidity}%`,
          `风况：${windDir}${windLevel}级`,
          `空气质量：${aqiText}`,
        ].join('\n');

        const indexAIText = await chatWithAI(indexPrompt);
        const parsedStatuses = parseHealthIndexStatuses(indexAIText);
        if (!cancelled) {
          setIndexData(
            INDEX_META.map((item, i) => ({
              ...item,
              status: parsedStatuses?.[i] || item.defaultStatus,
            }))
          );
        }
        const fallback = buildLifestyleFallback({
          district,
          weatherText,
          temp: weather.temp,
          humidity: weather.humidity,
          windDir,
          windLevel,
          aqiText,
        });

        const finalText = (
          !cleaned ||
          cleaned.includes('服务未配置') ||
          cleaned.includes('暂时无法使用') ||
          cleaned.includes('AI 服务未配置')
        )
          ? fallback
          : cleaned;

        if (!cancelled) {
          setDailyAdvice(finalText);
          window.localStorage.setItem(cacheKey, finalText);
        }
      } catch {
        if (!cancelled) {
          const fallbackAdvice = '今日建议：衣着以舒适分层为主，饮食清淡多补水，居家保持通风与湿度平衡，出行注意查看实时路况并预留机动时间。';
          setDailyAdvice(fallbackAdvice);
          window.localStorage.setItem(cacheKey, fallbackAdvice);
          setIndexData(INDEX_META.map((item) => ({ ...item, status: item.defaultStatus })));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [district]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 px-4 space-y-8 pb-72 overflow-x-hidden"
    >
      {/* 1. 生活气象提示语 - AI 医生角色 */}
      <section className="relative">
        <div className="bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-3xl p-5 border border-white/40 shadow-xl relative backdrop-blur-sm">
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 shrink-0 relative mt-[-10px] ml-[-10px]">
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative w-24 h-24">
                  <motion.img 
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    src={doctorAvatar}
                    className="w-full h-full object-cover filter drop-shadow-md"
                    alt="Health Assistant"
                  />
                  {/* Decorative Sparkle for Doc role */}
                  <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-bold text-primary shadow-sm border border-primary/20">🩺</div>
                 </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-white/80 rounded-2xl rounded-tl-none p-4 shadow-sm relative border border-white">
                <p className="text-[12px] leading-relaxed text-on-surface font-medium">
                  {dailyAdvice}
                </p>
                <div className="mt-2 flex justify-end">
                  <button className="bg-primary/10 text-primary p-1.5 rounded-full hover:bg-primary/20 transition-colors">
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 生活指数网格 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            生活指数
          </h2>
          <span className="text-[10px] text-on-surface-variant font-medium">2026-05-11 14:00 更新</span>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border border-on-surface/5 grid grid-cols-3 divide-x divide-y divide-on-surface/5 overflow-hidden">
          {indexData.map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-4 gap-2 hover:bg-primary/5 transition-colors">
              <div className={`p-2 rounded-xl ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-on-surface-variant mb-0.5">{item.label}</p>
                <p className="text-[10px] text-on-surface-variant opacity-60 leading-tight">{item.status}</p>
              </div>
            </div>
          ))}
          <div className="p-4 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-primary/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold mt-2">万年历</p>
            <p className="text-[10px] text-primary">三月廿三</p>
          </div>
        </div>
      </section>

      {/* 3. 花粉季特别快报 */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <Wind className="w-5 h-5 text-primary" />
            天津花粉播报
          </h2>
          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">4级预报</span>
        </div>
        
        <div className="bg-white rounded-3xl shadow-lg p-5 border border-on-surface/5 space-y-6">
          <div className="flex justify-between items-end border-b border-on-surface/5 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">昨日浓度</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-primary">375</span>
                <span className="text-[10px] text-on-surface-variant font-bold">粒/千平方毫米</span>
              </div>
            </div>
            <div className="text-right space-y-1">
               <p className="text-[11px] font-bold text-on-surface-variant">昨日种类</p>
               <p className="text-sm font-bold text-primary">豚草, 藜科, 葎草</p>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={POLLEN_TREND} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                  dy={5}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {POLLEN_TREND.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#3b82f6' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-primary text-white p-4 rounded-2xl shadow-md text-center transform scale-105">
             <p className="text-xs text-white/80 mb-1">明日（05/12）花粉过敏气象指数预报</p>
             <div className="text-2xl font-black mb-1 italic tracking-widest">4 级 (高风险)</div>
             <p className="text-[10px] text-white/90">易敏人群请尽量减少户外活动，加强防护</p>
          </div>
        </div>
      </section>

      {/* 4. 中暑/流感风险 (根据季节模拟展示) */}
      <section className="space-y-4">
        <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-error" />
          中暑气象风险等级预报
        </h2>
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-on-surface/5 relative aspect-[4/5]">
          <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover grayscale opacity-20"
            alt="Risk Map"
          />
          {/* Overlay Map Regions with Colors using SVG/Clips if real, here we mock with absolute divs */}
          <div className="absolute inset-0 bg-yellow-400/20" />
          <div className="absolute top-[40%] left-[30%] w-[40%] h-[30%] bg-red-500/30 rounded-full blur-3xl animate-pulse" />
          
          <div className="absolute top-4 left-4 font-bold text-xs bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-white shadow-sm">
             2026-06-10 08时~20时
          </div>

          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white space-y-2">
             {[
               { color: 'bg-[#98e600]', label: '中暑风险低' },
               { color: 'bg-[#ffff00]', label: 'IV 可能发生' },
               { color: 'bg-[#ffa500]', label: 'III 较易发生' },
               { color: 'bg-[#ff0000]', label: 'II 易发生' },
               { color: 'bg-[#800000]', label: 'I 极易发生' },
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className={`w-4 h-4 rounded-sm shadow-sm ${item.color}`} />
                 <span className="text-[10px] font-bold text-on-surface">{item.label}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 5. 儿童流感预报 (模拟冬季视图) */}
      <section className="space-y-4">
        <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-500" />
          儿童流感气象风险预报
        </h2>
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-on-surface/5 space-y-4">
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <p className="text-[11px] leading-relaxed text-indigo-900 font-medium">
              受冷空气影响，预计未来3天我市将出现降温过程，最低气温下降 4-6°C，诱发儿童流感传播风险上升。预计风险等级为 <span className="font-bold text-indigo-600">4级中低风险</span>，建议加强防护。
            </p>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { day: '05/11', v: 3 },
                { day: '05/12', v: 3.5 },
                { day: '05/13', v: 4 },
                { day: '05/14', v: 4.5 },
                { day: '05/15', v: 5 },
                { day: '05/16', v: 5.5 },
              ]}>
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                   {[3, 3.5, 4, 4.5, 5, 5.5].map((v, i) => (
                     <Cell key={i} fill={v >= 5 ? '#eab308' : '#22c55e'} />
                   ))}
                </Bar>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 6. 健康气象科普 / 节气养生 */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-500" />
            科普与养生
          </h2>
          <span className="text-xs text-primary font-bold">更多内容</span>
        </div>
        
        <div className="space-y-4">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="group relative h-48 rounded-3xl overflow-hidden shadow-lg border border-on-surface/5"
          >
            <img 
              src="https://images.unsplash.com/photo-1540331547168-8b63109225b7?auto=format&fit=crop&q=80&w=800" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="w-6 h-6 text-white/90" />
                <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">01:46</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">爬山VS休息：方法不对难养生</h3>
              <p className="text-white/60 text-[10px] mt-1 font-medium">专家深度解析节气运动关键点</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-on-surface/5">
              <div className="h-32 relative">
                <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[9px] font-bold rounded-lg shadow-md">四季小厨</div>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-sm mb-1 text-on-surface leading-tight">立夏 · 樱桃糕</h4>
                <p className="text-[10px] text-on-surface-variant font-medium">传统美食中的健康智慧</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-on-surface/5">
              <div className="h-32 relative">
                <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[9px] font-bold rounded-lg shadow-md">养生图解</div>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-sm mb-1 text-on-surface leading-tight">初夏防暑指南</h4>
                <p className="text-[10px] text-on-surface-variant font-medium">多图看懂流感防治要点</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

