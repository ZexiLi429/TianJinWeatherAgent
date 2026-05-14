import { MapPin, Info, CloudRain, Wind, AlertCircle, X, ChevronRight, Activity, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function MapView() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>('滨海新区');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-screen pt-14 pb-64 overflow-hidden bg-[#e5e9f0]"
    >
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover opacity-90" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH93VOJReKCVAnE-o9Ga16GLds45DWgL11Vv25q-s3gZ8ZGN86q_ODn-WkKJf91zH84CfBu16MX01EGcuEwEAE8CyX3QWegG0o3U5UVpUttGEm6LlXDNIpYyjSESJ38nJbt9qfOeW1ZsP2IE0yJigrM58ByJdtWcfAwjBGOCYl5-28MwjV4lasc5g7iPm-MqfzYVXMZGEWeCHLaCl4AmxqIBzOKv7DxUvhlHJa8dlG7ood6HeUB4QJvIAv2Nlv5qXANdJD30H0b6U"
          referrerPolicy="no-referrer"
        />
        
        {/* Map Markers */}
        <div className="absolute inset-0 z-10">
          {/* Binhai */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-[42%] right-[22%] cursor-pointer flex flex-col items-center group pointer-events-auto"
            onClick={() => setSelectedDistrict('滨海新区')}
          >
            <div className="w-14 h-14 bg-error/20 border-2 border-error/50 rounded-full flex items-center justify-center text-error backdrop-blur-md shadow-lg relative">
              <CloudRain className="w-6 h-6" />
              <div className="absolute inset-0 rounded-full border-2 border-error animate-ping opacity-50" />
            </div>
            <div className="mt-2 px-3 py-1 bg-white/80 backdrop-blur-xl border border-white/60 text-error font-bold text-[10px] rounded-lg shadow-sm">
              滨海: 红色暴雨
            </div>
          </motion.div>

          {/* Jizhou */}
          <div className="absolute top-[18%] left-[48%] cursor-pointer flex flex-col items-center pointer-events-auto">
            <div className="w-12 h-12 bg-tertiary/20 border-2 border-tertiary/50 rounded-full flex items-center justify-center text-tertiary backdrop-blur-md shadow-lg">
              <Wind className="w-6 h-6" />
            </div>
            <div className="mt-2 px-3 py-1 bg-white/80 backdrop-blur-md border border-white/60 text-tertiary font-bold text-[10px] rounded-lg shadow-sm">
              蓟州: 橙色大风
            </div>
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute top-20 right-4 z-20 bg-white/70 backdrop-blur-xl p-3 rounded-2xl flex flex-col gap-2 border border-white/60 shadow-lg">
        {[
          { color: 'bg-error', label: '红色' },
          { color: 'bg-tertiary', label: '橙色' },
          { color: 'bg-yellow-400', label: '黄色' },
          { color: 'bg-primary', label: '蓝色' },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${item.color} shadow-sm`} />
            <span className="text-[10px] font-medium text-on-surface">{item.label}</span>
          </div>
        ))}
      </div>

      {/* District Detail Pop-up */}
      <AnimatePresence>
        {selectedDistrict && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute top-[35%] left-[5%] right-[5%] z-30 max-w-sm mx-auto bg-white/80 backdrop-blur-2xl p-6 rounded-3xl border border-white/80 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="px-3 py-1 bg-error/10 text-error rounded-full text-[11px] font-bold tracking-wider border border-error/20">
                  暴雨红色预警
                </span>
                <h2 className="font-headline text-2xl mt-2 text-on-surface font-bold">{selectedDistrict}</h2>
              </div>
              <button 
                onClick={() => setSelectedDistrict(null)}
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              滨海新区南部将有100毫米以上的强降水。已启动I级防汛应急响应。
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/40 p-3 rounded-2xl border border-white/60 shadow-sm">
                <span className="text-[11px] text-outline block mb-1 uppercase font-bold">降水量</span>
                <span className="font-bold text-lg text-primary">124mm</span>
              </div>
              <div className="bg-white/40 p-3 rounded-2xl border border-white/60 shadow-sm">
                <span className="text-[11px] text-outline block mb-1 uppercase font-bold">响应级别</span>
                <span className="font-bold text-lg text-error">I级响应</span>
              </div>
            </div>
            <button className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
              进入防汛指挥中心 <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Stats Drawer (Mock) */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-white/70 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-white/60">
        <div className="w-10 h-1.5 bg-on-surface/10 rounded-full mx-auto my-5" />
        <div className="px-4 pb-24">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              2024 年度预警分析
            </h3>
            <span className="text-xs text-primary font-bold">查看详情</span>
          </div>
          <div className="bg-white/40 p-4 rounded-3xl border border-white/60 flex items-center justify-between shadow-sm">
            <div className="w-24 h-24 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[6px] border-primary/10" />
              <div className="absolute inset-0 rounded-full border-[6px] border-error border-t-transparent border-r-transparent rotate-45" />
              <div className="flex flex-col items-center">
                <span className="font-bold text-2xl">142</span>
                <span className="text-[10px] text-outline">总计</span>
              </div>
            </div>
            <div className="flex-1 ml-6 space-y-2">
              {[
                { color: 'bg-error', label: '暴雨强对流', count: '64次' },
                { color: 'bg-tertiary', label: '极端高温', count: '35次' },
                { color: 'bg-primary', label: '寒潮大风', count: '43次' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Float Overlay (Compact) */}
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-white/60 backdrop-blur-2xl rounded-3xl p-3 flex items-center gap-3 border border-white/40 shadow-lg">
        <div className="w-12 h-12 flex-shrink-0 bg-primary-fixed rounded-full overflow-hidden shadow-sm">
          <img 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida/ADBb0ui19Bu5IZHJ9K-sEiD6eaHNBEQyBNXV28Ap6NsmVhqLk0ZaJ0jHC0weEAHDBW5tVeMyeuTY0Fb1hAP74NkuJNVCP-MZ93HkXNSgdcFNQe5ErIatCMl3LF3mdlZZwgOIpj0EWYivk8uM_Z4OUKnj-kdx-X_POv4rFBJKfK9axXidzQKGK9rn8cTsSFrMh8U3slTDOb1kI-roT0atBiT7NOYXWMsQ3l3ay_3xecO_PzOZgjcRa4VFwx3Rez6aexGiwl5wQF7hm9th"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-grow overflow-hidden">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">智能建议</p>
          <p className="text-xs truncate font-medium">当前滨海新区正在降水，建议您室内避险</p>
        </div>
        <button className="bg-primary/10 p-2 rounded-full text-primary">
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
