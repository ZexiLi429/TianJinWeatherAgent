import { useState, useEffect } from 'react';
import { Sun, Leaf, AlertTriangle, Cloud, ShieldAlert, Luggage, Trees, Camera, Map as MapIcon, Waves, TrafficCone, Mountain, BookOpen, CloudRain, CloudSnow, Zap, CloudFog } from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewType } from '../App';
import { chatWithAI } from '../services/aiService';
import { fetchCurrentWeather, weatherCodeToText, windDirToText, windSpeedToLevel, aqiToText, CurrentWeather } from '../services/weatherService';
import { fetchLatestOfficialWarning, OfficialWarning } from '../services/officialWarningService';

interface WeatherHomeProps {
  onNavigate: (view: ViewType) => void;
  district?: string;
}

// 天气码对应的图标组件
function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0 || code === 1) return <Sun className={className} />;
  if (code === 2 || code === 3) return <Cloud className={className} />;
  if (code <= 49) return <CloudFog className={className} />;
  if (code <= 69) return <CloudRain className={className} />;
  if (code <= 79) return <CloudSnow className={className} />;
  if (code <= 84) return <CloudRain className={className} />;
  if (code <= 94) return <CloudSnow className={className} />;
  return <Zap className={className} />;
}

export default function WeatherHome({ onNavigate, district }: WeatherHomeProps) {
  const [suggestion, setSuggestion] = useState('正在获取今日建议…');
  const [sugLoading, setSugLoading] = useState(true);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [officialWarning, setOfficialWarning] = useState<OfficialWarning | null>(null);
  const [warningLoading, setWarningLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setWeatherLoading(true);
    setWeather(null);
    fetchCurrentWeather(district)
      .then((data) => { if (!cancelled) setWeather(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setWeatherLoading(false); });
    return () => { cancelled = true; };
  }, [district]);

  useEffect(() => {
    let cancelled = false;
    setWarningLoading(true);
    setOfficialWarning(null);

    fetchLatestOfficialWarning(district)
      .then((data) => {
        if (!cancelled) setOfficialWarning(data);
      })
      .catch(() => {
        if (!cancelled) setOfficialWarning(null);
      })
      .finally(() => {
        if (!cancelled) setWarningLoading(false);
      });

    return () => { cancelled = true; };
  }, [district]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const text = await chatWithAI(
          '请用30字以内，给天津市民一句今日天气生活小建议，语气轻松友好，不要标点符号以外多余格式。'
        );
        if (!cancelled) setSuggestion(text.replace(/\n/g, ' ').slice(0, 60));
      } catch {
        if (!cancelled) setSuggestion('天气晴好，适合户外运动，记得补水防晒哦。');
      } finally {
        if (!cancelled) setSugLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const menuItems = [
    { label: '常规天气', icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-50', view: 'conventional' as ViewType },
    { label: '健康气象', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50', view: 'health' as ViewType },
    { label: '旅游气象', icon: Luggage, color: 'text-orange-500', bg: 'bg-orange-50', view: 'tourism' as ViewType },
    { label: '气候生态', icon: Trees, color: 'text-emerald-600', bg: 'bg-emerald-50', view: 'eco' as ViewType },
    { label: '实景天气', icon: Camera, color: 'text-slate-600', bg: 'bg-slate-50', view: 'real' as ViewType },
    { label: '预警地图', icon: MapIcon, color: 'text-red-500', bg: 'bg-red-50', view: 'map' as ViewType },
    { label: '暴雨积涝', icon: Waves, color: 'text-blue-600', bg: 'bg-blue-50', view: 'flood' as ViewType },
    { label: '交通哨兵', icon: TrafficCone, color: 'text-slate-800', bg: 'bg-slate-100', view: 'traffic' as ViewType },
    { label: '山区哨兵', icon: Mountain, color: 'text-emerald-700', bg: 'bg-emerald-100', view: 'mountain' as ViewType },
    { label: '气象科普', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50', view: 'science' as ViewType },
  ];

  const isWarning = Boolean(officialWarning);
  const warningText = warningLoading
    ? '正在获取官方预警发布信息，请稍候。'
    : officialWarning
      ? `官方发布：${officialWarning.title}${officialWarning.publishTime ? `（${officialWarning.publishTime}）` : ''}`
      : `${district || '天津市'}当前暂无官方预警，天气平稳，祝你出行顺利。`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-14 pb-64 px-4"
    >
      {/* Weather Summary Section */}
      <section className="mt-6 py-8 text-center bg-atmospheric rounded-3xl">
        <div className="flex flex-col items-center">
          <div className="relative">
            {weatherLoading ? (
              <h1 className="font-display-temp text-7xl text-primary font-bold">--°C</h1>
            ) : (
              <h1 className="font-display-temp text-7xl text-primary font-bold">
                {weather ? `${weather.temp}°C` : '26°C'}
              </h1>
            )}
            <motion.div 
              animate={{ rotate: weather && (weather.weatherCode === 0 || weather.weatherCode === 1) ? 360 : 0 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={`absolute -top-4 -right-10 ${
                weather && weather.weatherCode <= 1 ? 'text-yellow-500' :
                weather && weather.weatherCode <= 3 ? 'text-slate-400' :
                weather && weather.weatherCode <= 69 ? 'text-blue-400' :
                weather && weather.weatherCode <= 79 ? 'text-sky-300' :
                'text-purple-400'
              }`}
            >
              <WeatherIcon
                code={weather?.weatherCode ?? 0}
                className="w-16 h-16 fill-current"
              />
            </motion.div>
          </div>
          {weatherLoading ? (
            <p className="font-body text-lg text-on-surface-variant mt-2 opacity-40">正在获取天气数据…</p>
          ) : (
            <p className="font-body text-lg text-on-surface-variant mt-2">
              {weather
                ? `体感 ${weather.feelsLike}°C · ${windDirToText(weather.windDirection)} ${windSpeedToLevel(weather.windSpeed)}级 · 湿度 ${weather.humidity}%`
                : '体感 28°C · 东南风 3级 · 湿度 45%'}
            </p>
          )}
          <div className="mt-4 px-4 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label text-xs inline-flex items-center gap-1 shadow-sm">
            <Leaf className="w-4 h-4 fill-current" />
            空气质量：{weather ? aqiToText(weather.aqi) : '优'}
          </div>
        </div>
      </section>

      {/* Warning Marquee */}
      <section className={`mt-6 rounded-lg overflow-hidden flex items-center h-10 shadow-sm ${
        isWarning
          ? 'bg-[#FFD700] border border-yellow-600/20'
          : 'bg-emerald-50 border border-emerald-600/20'
      }`}>
        <div className={`px-3 h-full flex items-center z-10 ${isWarning ? 'bg-error' : 'bg-emerald-600'}`}>
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="marquee-container flex-1">
          <div className={`marquee-content font-bold text-sm ${isWarning ? 'text-error' : 'text-emerald-700'}`}>
            {warningText}
          </div>
        </div>
      </section>

      {/* Suggestions Card */}
      <section className="mt-6">
        <div className="glass-card rounded-xl p-4 flex items-center justify-between overflow-hidden relative min-h-[140px] shadow-md border-white/50">
          <div className="z-10 w-[55%] pr-2">
            <h2 className="font-headline text-xl text-primary font-bold mb-1">今日建议</h2>
            {sugLoading ? (
              <div className="flex gap-1 mt-2">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-h-[4.5rem] overflow-y-auto overscroll-contain scrollbar-thin"
              >
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {suggestion}
                </p>
              </motion.div>
            )}
          </div>
          <img 
            alt="Weather Scene" 
            className="absolute -right-4 top-0 h-full w-1/2 object-cover opacity-80" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBopOulNJTjdcnFlpaIxQhym9j_wzA27PxVi05h-Llk5CGmVd-JFX_6IfoQG2p7XQC9xzI8xY-Qj3e81VzDTEmciMU6veWMXRAMzJh8_vciHvkbyJ7N5nsZcGBx8DEskJ0VUVvLtvgQjYjf1G2bL06m5nMbj9h846PPJhdakn55mU-1NJwvbpiZSwTV2iAueIEQL9cZpQgLa4SzULKLMHicQFw88UI2l7Qjynap5JtSBDRW6ttF7-6cL5qRyn-ZcsIJbczcXMrkoSs"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Grid Menu */}
      <section className="mt-8 grid grid-cols-5 gap-y-6 gap-x-2">
        {menuItems.map((item, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -2 }}
            onClick={() => onNavigate(item.view)}
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} shadow-sm border border-white/20`}>
              <item.icon className="w-7 h-7" />
            </div>
            <span className="font-label text-[10px] text-on-surface-variant text-center leading-tight whitespace-nowrap">{item.label}</span>
          </motion.div>
        ))}
      </section>
    </motion.div>
  );
}
