import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Palette, Clock, ChevronRight, X,
  Send, Download, Loader2,
  Image as ImageIcon, Video, Mic, MicOff,
} from 'lucide-react';
import {
  KNOWLEDGE_BASE, CATEGORY_LIST, CATEGORY_ICONS, searchKnowledge,
  getRecommendedArticles, type KnowledgeArticle, type DisasterCategory,
} from '../data/weatherKnowledge';
import {
  detectIntent, generateWeatherPoster, startVideoGeneration,
  pollVideoResult, downloadMedia, type VideoTask,
} from '../services/aigcService';
import { chatWithAI } from '../services/aiService';

// ─── 快捷生成 Prompt ──────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '暴雨防涝海报', icon: '🌊', type: 'image' as const, prompt: '暴雨防涝安全提示海报，展示积水深度警示线和安全逃生路线' },
  { label: '雷电防护手册', icon: '⚡', type: 'image' as const, prompt: '雷电天气安全防护指南海报，包含户外避雷要点图示' },
  { label: '高温防暑提示', icon: '☀️', type: 'image' as const, prompt: '高温天气防暑降温提示海报，展示中暑急救步骤' },
  { label: '出行安全短视频', icon: '🎬', type: 'video' as const, prompt: '天津暴雨天气安全出行提醒短视频，30秒科普动画风格' },
  { label: '台风应急指南', icon: '🌀', type: 'image' as const, prompt: '台风来临防范指南海报，三阶段应对措施信息图' },
  { label: '寒潮防护提示', icon: '❄️', type: 'video' as const, prompt: '寒潮天气防护科普视频，冻伤预防和急救动画演示' },
];

// ─── Tab 类型 ─────────────────────────────────────────────
type ViewTab = 'recommend' | 'library' | 'aigc';

// ─── AIGC 消息类型 ────────────────────────────────────────
type MsgRole = 'user' | 'assistant';
interface AigcMessage {
  id: string;
  role: MsgRole;
  text: string;
  imageUrl?: string;
  videoTask?: VideoTask;
  loading?: boolean;
}

// ─── 文章阅读弹窗 ────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: KnowledgeArticle; onClose: () => void }) {
  const renderLine = (line: string, i: number) => {
    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-black text-slate-800 mt-4 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-slate-700 mt-3 mb-1.5">{line.slice(4)}</h3>;
    if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-amber-400 pl-3 py-1 bg-amber-50 rounded-r text-xs text-amber-800 my-1.5">{line.slice(2)}</blockquote>;
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const bold = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <li key={i} className="text-sm text-slate-600 leading-relaxed ml-3 mb-0.5" dangerouslySetInnerHTML={{ __html: `• ${bold}` }} />;
    }
    if (/^\d+\./.test(line)) {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <li key={i} className="text-sm text-slate-600 leading-relaxed ml-3 mb-0.5" dangerouslySetInnerHTML={{ __html: bold }} />;
    }
    if (line.startsWith('| ')) return null;
    if (!line.trim()) return <div key={i} className="h-1" />;
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <p key={i} className="text-sm text-slate-600 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: bold }} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-h-[85vh] bg-white rounded-t-3xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${article.coverGradient} px-5 pt-5 pb-6 shrink-0`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-white/80 text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">{article.category}</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="text-3xl mb-2">{article.icon}</div>
          <h2 className="text-white font-black text-xl leading-tight">{article.title}</h2>
          <div className="flex items-center gap-3 mt-2 text-white/70 text-xs">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 阅读约 {article.readTime} 分钟</span>
            {article.warningLevel && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full">{article.warningLevel}预警</span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {article.content.split('\n').map((line, i) => renderLine(line, i))}
          <div className="h-8" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 主视图 ──────────────────────────────────────────────
export default function ScienceView() {
  const [tab, setTab] = useState<ViewTab>('recommend');
  const [selectedCategory, setSelectedCategory] = useState<DisasterCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [recommendedArticles, setRecommendedArticles] = useState<KnowledgeArticle[]>([]);
  const [weatherContext, setWeatherContext] = useState<{ label: string; icon: string; color: string } | null>(null);

  // AIGC Studio 状态
  const [aigcInput, setAigcInput] = useState('');
  const [aigcMessages, setAigcMessages] = useState<AigcMessage[]>([]);
  const [aigcMode, setAigcMode] = useState<'image' | 'video' | 'qa'>('qa');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化：获取实时天气并推荐文章
  useEffect(() => {
    (async () => {
      try {
        // 通过 QWeather 天气状况文字推断推荐内容
        const resp = await fetch('/api/qweather/v7/weather/now?location=101030100&lang=zh', {
          headers: { 'X-QW-Api-Key': import.meta.env.VITE_QWEATHER_API_KEY || '' },
        });
        if (resp.ok) {
          const data = await resp.json();
          const cond: string = data?.now?.text ?? '';
          const temp = parseFloat(data?.now?.temp ?? '20');
          setRecommendedArticles(getRecommendedArticles({ condition: cond, temp }));
          if (cond.includes('雷') || cond.includes('暴雨') || temp > 35) {
            setWeatherContext({
              label: `当前天津：${cond}，${temp}°C — 已为您推荐相关防护知识`,
              icon: cond.includes('雷') ? '⚡' : cond.includes('雨') ? '🌧️' : '🌡️',
              color: cond.includes('雷') ? 'from-violet-600 to-purple-500' : cond.includes('雨') ? 'from-blue-600 to-cyan-500' : 'from-orange-500 to-amber-400',
            });
          }
        } else {
          setRecommendedArticles(getRecommendedArticles({}));
        }
      } catch {
        setRecommendedArticles(getRecommendedArticles({}));
      }
    })();
  }, []);

  // 语音输入初始化
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.lang = 'zh-CN';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (e: any) => {
        setAigcInput(e.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const addMessage = useCallback((msg: Omit<AigcMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setAigcMessages(prev => [...prev, { ...msg, id }]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<AigcMessage>) => {
    setAigcMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }, []);

  const handleSend = async () => {
    const text = aigcInput.trim();
    if (!text || isGenerating) return;
    setAigcInput('');
    setIsGenerating(true);

    addMessage({ role: 'user', text });
    const loadingId = addMessage({ role: 'assistant', text: '', loading: true });
    scrollToBottom();

    try {
      const intent = detectIntent(text);

      if (intent === 'image') {
        updateMessage(loadingId, { text: '🎨 正在生成图片，大约需要 15 秒...' });
        const result = await generateWeatherPoster(text);
        updateMessage(loadingId, {
          text: '✅ 图片已生成！点击下方按钮保存到本地。',
          imageUrl: result.url,
          loading: false,
        });
        setIsGenerating(false);
      } else if (intent === 'video') {
        updateMessage(loadingId, { text: '🎬 视频生成任务已提交，通常需要 1~3 分钟，请稍候...' });
        const taskId = await startVideoGeneration(text);
        let elapsed = 0;
        pollingRef.current = setInterval(async () => {
          elapsed += 5;
          try {
            const result = await pollVideoResult(taskId);
            if (result.status === 'SUCCESS' && result.videoUrl) {
              clearInterval(pollingRef.current!);
              updateMessage(loadingId, { text: '✅ 视频已生成！点击下方按钮预览或下载。', videoTask: result, loading: false });
              setIsGenerating(false);
            } else if (result.status === 'FAIL') {
              clearInterval(pollingRef.current!);
              updateMessage(loadingId, { text: '❌ 视频生成失败，请稍后重试或修改描述。', loading: false });
              setIsGenerating(false);
            } else {
              updateMessage(loadingId, { text: `🎬 视频生成中... 已等待 ${elapsed} 秒，请耐心等待。` });
            }
          } catch {
            clearInterval(pollingRef.current!);
            updateMessage(loadingId, { text: '❌ 轮询状态失败，请稍后重试。', loading: false });
            setIsGenerating(false);
          }
        }, 5000);
        return;
      } else {
        // RAG + GLM 智能问答
        const relevant = searchKnowledge(text).slice(0, 2);
        const context = relevant.length > 0
          ? `\n\n参考知识库：\n${relevant.map(a => `【${a.title}】${a.summary}\n${a.content.slice(0, 300)}`).join('\n\n')}`
          : '';
        const answer = await chatWithAI(
          `你是天津气象科普助手，请简洁专业地回答以下问题（500字以内，用分点列举）：${text}${context}`
        );
        updateMessage(loadingId, { text: answer, loading: false });
        setIsGenerating(false);
      }
    } catch (err: any) {
      updateMessage(loadingId, { text: `❌ 生成失败：${err?.message || '请检查网络或稍后重试'}`, loading: false });
      setIsGenerating(false);
    }
    scrollToBottom();
  };

  const handleQuickPrompt = (p: typeof QUICK_PROMPTS[0]) => {
    setAigcInput(p.prompt);
    setAigcMode(p.type === 'image' ? 'image' : 'video');
    setTab('aigc');
  };

  const filteredArticles = searchKnowledge(searchQuery, selectedCategory ?? undefined);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-[60px] pb-40 min-h-screen bg-slate-50"
    >
      {/* ── 顶部标题栏 ── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pt-5 pb-16">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="text-blue-300 text-xs font-semibold tracking-widest uppercase">AIGC · 智能科普平台</span>
        </div>
        <h1 className="text-white font-black text-2xl leading-tight">气象灾害应急科普</h1>
        <p className="text-slate-400 text-xs mt-1">实时天气驱动 · 知识库检索 · AI 海报视频生成</p>
        {weatherContext && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 bg-gradient-to-r ${weatherContext.color} rounded-xl px-3 py-2 flex items-center gap-2`}
          >
            <span className="text-lg">{weatherContext.icon}</span>
            <p className="text-white text-xs font-semibold leading-snug flex-1">{weatherContext.label}</p>
            <span className="text-white/70 text-[10px] shrink-0">智能推荐已更新</span>
          </motion.div>
        )}
      </div>

      {/* ── Tab 导航 ── */}
      <div className="mx-4 -mt-8 bg-white rounded-2xl shadow-lg border border-slate-100 flex overflow-hidden z-10 relative">
        {([
          { id: 'recommend', label: '智能推荐', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'library',   label: '知识库',   icon: <BookOpen className="w-4 h-4" /> },
          { id: 'aigc',      label: 'AIGC创作', icon: <Palette className="w-4 h-4" /> },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-all ${
              tab === t.id
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500'
                : 'text-slate-500'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">

          {/* ══ Tab 1: 智能推荐 ══ */}
          {tab === 'recommend' && (
            <motion.div key="recommend" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-blue-500 rounded-full" />
                  <h2 className="font-black text-sm text-slate-800">基于当前气象的推荐阅读</h2>
                </div>
                <div className="space-y-3">
                  {recommendedArticles.map((article, i) => (
                    <motion.button
                      key={article.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex items-stretch text-left"
                    >
                      <div className={`w-2 bg-gradient-to-b ${article.coverGradient} shrink-0`} />
                      <div className="p-3 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{article.icon}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{article.category}</span>
                          {article.warningLevel && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              article.warningLevel === '红色' ? 'bg-red-100 text-red-600' :
                              article.warningLevel === '橙色' ? 'bg-orange-100 text-orange-600' :
                              article.warningLevel === '黄色' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>{article.warningLevel}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-slate-800 leading-snug">{article.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{article.summary}</p>
                      </div>
                      <div className="flex items-center pr-3">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-purple-500 rounded-full" />
                  <h2 className="font-black text-sm text-slate-800">一键 AIGC 生成</h2>
                  <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-semibold">文生图 · 文生视频</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_PROMPTS.map((p, i) => (
                    <motion.button
                      key={p.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => handleQuickPrompt(p)}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col items-center gap-1.5 text-center active:scale-95 transition-transform"
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <span className="text-[10px] font-semibold text-slate-700 leading-tight">{p.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        p.type === 'image' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>{p.type === 'image' ? '图片' : '视频'}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ Tab 2: 知识库 ══ */}
          {tab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索：暴雨逃生、雷电防护..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    !selectedCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >全部</button>
                {CATEGORY_LIST.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>{CATEGORY_ICONS[cat]}</span>{cat}
                  </button>
                ))}
              </div>
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">没有找到相关文章</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredArticles.map((article, i) => (
                    <motion.button
                      key={article.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedArticle(article)}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-left flex flex-col active:scale-95 transition-transform"
                    >
                      <div className={`h-20 bg-gradient-to-br ${article.coverGradient} flex items-center justify-center`}>
                        <span className="text-4xl">{article.icon}</span>
                      </div>
                      <div className="p-2.5">
                        <span className="text-[9px] text-slate-400 font-semibold">{article.category}</span>
                        <h3 className="text-xs font-bold text-slate-800 leading-snug mt-0.5 line-clamp-2">{article.title}</h3>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                          <Clock className="w-2.5 h-2.5" />{article.readTime}分钟
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ Tab 3: AIGC 创作 ══ */}
          {tab === 'aigc' && (
            <motion.div key="aigc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* 模式选择 */}
              <div className="flex gap-2 mb-3">
                {([
                  { id: 'qa',    label: '智能问答', icon: <Sparkles className="w-3.5 h-3.5" />, desc: 'RAG检索+GLM回答' },
                  { id: 'image', label: '生成海报', icon: <ImageIcon className="w-3.5 h-3.5" />, desc: 'CogView文生图' },
                  { id: 'video', label: '生成视频', icon: <Video className="w-3.5 h-3.5" />,     desc: 'CogVideoX文生视频' },
                ] as const).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setAigcMode(m.id)}
                    className={`flex-1 rounded-xl border py-2 px-1 text-center transition-all ${
                      aigcMode === m.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      {m.icon}
                      <span className="text-xs font-bold">{m.label}</span>
                    </div>
                    <span className={`text-[9px] ${aigcMode === m.id ? 'text-blue-200' : 'text-slate-400'}`}>{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* 对话区 */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '420px' }}>
                <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '360px' }}>
                  {aigcMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                      {aigcMode === 'qa' && <><Sparkles className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm font-semibold text-slate-600">智能气象问答</p><p className="text-xs mt-1">基于知识库检索，结合 GLM-4 回答</p></>}
                      {aigcMode === 'image' && <><ImageIcon className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm font-semibold text-slate-600">生成气象科普海报</p><p className="text-xs mt-1">输入描述，CogView-3 为你生成高清图片</p></>}
                      {aigcMode === 'video' && <><Video className="w-10 h-10 mb-2 opacity-30" /><p className="text-sm font-semibold text-slate-600">生成气象科普视频</p><p className="text-xs mt-1">输入描述，CogVideoX 异步生成短视频</p></>}
                    </div>
                  )}
                  {aigcMessages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[82%] ${msg.role === 'user' ? '' : 'flex-1'}`}>
                        {msg.role === 'user' ? (
                          <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl rounded-br-sm text-sm">{msg.text}</div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-sm px-3 py-2.5">
                            {msg.loading ? (
                              <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {msg.text || '生成中...'}
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                {msg.imageUrl && (
                                  <div className="mt-2">
                                    <img src={msg.imageUrl} alt="AIGC生成" className="rounded-xl w-full object-cover border border-slate-200" />
                                    <button
                                      onClick={() => downloadMedia(msg.imageUrl!, `weather-poster-${Date.now()}.png`)}
                                      className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl"
                                    >
                                      <Download className="w-3.5 h-3.5" />下载图片
                                    </button>
                                  </div>
                                )}
                                {msg.videoTask?.status === 'SUCCESS' && msg.videoTask.videoUrl && (
                                  <div className="mt-2">
                                    <video src={msg.videoTask.videoUrl} controls className="rounded-xl w-full border border-slate-200" poster={msg.videoTask.coverUrl} />
                                    <button
                                      onClick={() => downloadMedia(msg.videoTask!.videoUrl!, `weather-video-${Date.now()}.mp4`)}
                                      className="mt-2 w-full flex items-center justify-center gap-2 bg-purple-600 text-white text-xs font-semibold py-2 rounded-xl"
                                    >
                                      <Download className="w-3.5 h-3.5" />下载视频
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* 输入区 */}
                <div className="border-t border-slate-100 p-2.5">
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2">
                    {QUICK_PROMPTS
                      .filter(p => aigcMode === 'image' ? p.type === 'image' : aigcMode === 'video' ? p.type === 'video' : true)
                      .map(p => (
                        <button
                          key={p.label}
                          onClick={() => setAigcInput(p.prompt)}
                          className="shrink-0 flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        >
                          <span>{p.icon}</span>{p.label}
                        </button>
                      ))}
                  </div>
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={aigcInput}
                      onChange={e => setAigcInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={
                        aigcMode === 'image' ? '描述你想生成的海报，如：暴雨防涝安全提示海报...' :
                        aigcMode === 'video' ? '描述你想生成的视频，如：暴雨出行安全科普短视频...' :
                        '问我任何气象问题，如：暴雨积水多深会有危险？'
                      }
                      rows={2}
                      className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex flex-col gap-1.5">
                      {recognitionRef.current && (
                        <button
                          onClick={() => {
                            if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
                            else { recognitionRef.current.start(); setIsListening(true); }
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={handleSend}
                        disabled={!aigcInput.trim() || isGenerating}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          aigcMode === 'image' ? 'bg-blue-600 disabled:bg-slate-300' :
                          aigcMode === 'video' ? 'bg-purple-600 disabled:bg-slate-300' :
                          'bg-slate-900 disabled:bg-slate-300'
                        } text-white`}
                      >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 能力说明 */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: <Sparkles className="w-4 h-4 text-blue-500 mx-auto mb-1" />, title: '知识库检索', desc: 'RAG精准匹配' },
                  { icon: <ImageIcon className="w-4 h-4 text-cyan-500 mx-auto mb-1" />, title: 'CogView-3', desc: '文生图·可下载' },
                  { icon: <Video className="w-4 h-4 text-purple-500 mx-auto mb-1" />, title: 'CogVideoX', desc: '文生视频·异步' },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 py-2.5 px-2 shadow-sm">
                    {item.icon}
                    <p className="text-[10px] font-bold text-slate-700">{item.title}</p>
                    <p className="text-[9px] text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 文章阅读弹窗 */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
