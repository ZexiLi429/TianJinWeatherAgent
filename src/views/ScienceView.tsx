import { motion } from 'framer-motion';
import { Newspaper, PlayCircle, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ScienceView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-20 px-4 space-y-8 pb-64"
    >
      <header className="flex justify-between items-center">
        <h2 className="font-headline text-2xl font-bold text-primary">防灾科普</h2>
        <Newspaper className="w-6 h-6 text-primary opacity-40" />
      </header>

      {/* Featured Video */}
      <section className="relative h-48 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
        <img 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuAKya7jd0hNc0sAXMhGXQNoLlKwGsX_SMfh9EmQIvSHICRQyxJa48KxvbBcGL3EEAQigU9c9uWdhk1spUYDi6KDgx-xfHQ-Zc-VTMsg5uaIdGC-ELi8kDqq3GJZr3M-5va9GXDYz4oe4Gc2uCTmYnh95IC04q73E_ZerrUqJnhcSIXFjtN5PMBFi0fy0XXJQV4l7B5e6cvPIozP8vvntDmwoNwwIVFpDZALO4z-my4S9LEyZdaeWgiSvGtSpDd5NiDzhfnF6enCQ"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
          <div className="flex items-center gap-2 mb-1">
            <PlayCircle className="w-6 h-6 text-white fill-primary" />
            <span className="text-white font-label text-xs uppercase tracking-widest">3:45</span>
          </div>
          <h3 className="text-white font-headline text-xl font-bold">三分钟读懂城市内涝逃生术</h3>
        </div>
      </section>

      {/* Interactive Q&A */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold">
          <HelpCircle className="w-5 h-5" />
          <h3 className="font-headline">预警知多少</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['🌀 台风蓝色', '⛈️ 雷雨大风', '🔥 高温橙色', '🌫️ 大雾预警'].map((tag, i) => (
            <span key={i} className={`px-4 py-1.5 rounded-full font-label text-xs shadow-sm border ${i === 1 ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-outline-variant'}`}>
              {tag}
            </span>
          ))}
        </div>
        <div className="p-4 rounded-2xl bg-primary-container/10 border border-primary/20 flex gap-4 items-start shadow-inner">
          <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0" />
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <strong className="text-primary block mb-1">雷雨大风黄色预警：</strong>
            6小时内可能受雷雨大风影响,平均风力可达8级以上。建议妥善安置易受大风影响的室外物品，远离高层建筑。
          </p>
        </div>
      </section>

      {/* Recommended Articles */}
      <section className="grid grid-cols-2 gap-4">
        {[
          { title: '闪电在身边？教你科学避雷', tag: '图文', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuGGkrcwsIN0lokpRrgxssDJptwNDC2nFWs6mlkCM8J3r3bk5wnySJsLsCgvDM91K4LZuP-Tfh1sz4Gyodvn8LZUvW625FJH4ks3fJsT-8lOupDNiCzMkGg_99kye-yEhtZDczSmw3o-cVJcWb1J_OiTV_UJfZ3Zc_8g_B8Zc3XSIuTxvXff-UepBgk0NQE3iZV_3tLlKrcrWHueZCkbGUom3RDZO5oytzrUKNpQAO1aDMPYGVIdDXdlyH-B3YAXOjGU3k5cSrTvQ' },
          { title: '热射病预警：伏天防暑必读', tag: '专栏', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2k_uCV3VhHtb49qu1BTmKu8xBlYyRAtahKAYiZxJ1giYEbkTxuCeehpGbEKPu4Xz4tdxo9rVbviNYz2Er6fuca959zZmfmUB6gOmQYGru9jrvcxQqSISGGJLwBs7WHI1VNj76HdMqqTAymg1GwSuWyIu7r1KMjN2ovRyI1eS6aRLNpNxDjVjDlos4HipzwwV8Zw9TWTWr0WzPuemiZv63xW8C9p0vDnStnHCMcW7DMffdiM0NcZBSZvuTOthBKVIWGoyiZAt9yLM' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-primary/5">
            <div className="h-28 relative">
              <img src={item.img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <span className="absolute top-2 right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md">{item.tag}</span>
            </div>
            <div className="p-3">
              <h4 className="font-bold text-xs text-on-surface line-clamp-2">{item.title}</h4>
            </div>
          </div>
        ))}
      </section>
      
      <div className="bg-secondary-container/20 p-4 rounded-2xl flex items-center gap-4 border border-secondary/10">
        <ShieldCheck className="w-8 h-8 text-secondary" />
        <div>
          <div className="font-bold text-sm text-secondary">安全第一</div>
          <p className="text-[10px] text-on-surface-variant">掌握防灾知识，守护生命安全</p>
        </div>
      </div>
    </motion.div>
  );
}
