import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, ArrowLeft, Trash2, Plus, Sun, Cloud, CloudFog, CloudRain, CloudSnow, Zap } from 'lucide-react';
import { chatWithAI } from '../services/aiService';
import { chatHistoryService, ChatMessage } from '../services/chatHistoryService';
import { fetchTemperatureTrend } from '../services/weatherService';
import { fetchLatestOfficialWarning } from '../services/officialWarningService';
import boyAvatar from '../assets/avatars/boy.png';
import girlAvatar from '../assets/avatars/girl.png';

type ChatPageProps = {
  onClose: () => void;
  initialInput?: string;
  assistantName?: string;
};

// 快捷问题列表
const QUICK_QUESTIONS = [
  { label: '最新预警', emoji: '🚨', color: 'bg-red-50 border-red-200 text-red-700' },
  { label: '明天穿衣建议', emoji: '👗', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { label: '本周温度趋势', emoji: '📈', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { label: '今天风力如何', emoji: '🌬️', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { label: '今天降雨概率', emoji: '🌧️', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { label: '地铁天气状况', emoji: '🚇', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { label: '山区出行安全', emoji: '⛰️', color: 'bg-green-50 border-green-200 text-green-700' },
  { label: '空气质量预报', emoji: '🌿', color: 'bg-teal-50 border-teal-200 text-teal-700' },
];

function shouldShowTempTrend(query: string): boolean {
  const q = query.toLowerCase();
  return (
    (q.includes('温度') || q.includes('气温')) &&
    (q.includes('最近') || q.includes('近几') || q.includes('这周') || q.includes('本周') || q.includes('趋势') || q.includes('变化') || q.includes('折线'))
  );
}

function shouldShowLatestWarning(query: string): boolean {
  const q = query.toLowerCase();
  return q.includes('最新预警') || (q.includes('预警') && (q.includes('天津') || q.includes('气象局') || q.includes('最新')));
}

function warningLevelClass(level: '红色' | '橙色' | '黄色' | '蓝色' | '未知'): string {
  if (level === '红色') return 'bg-red-50 border-red-200 text-red-700';
  if (level === '橙色') return 'bg-orange-50 border-orange-200 text-orange-700';
  if (level === '黄色') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  if (level === '蓝色') return 'bg-blue-50 border-blue-200 text-blue-700';
  return 'bg-slate-50 border-slate-200 text-slate-700';
}

function warningLevelAccent(level: '红色' | '橙色' | '黄色' | '蓝色' | '未知'): string {
  if (level === '红色') return 'from-red-500 to-rose-500';
  if (level === '橙色') return 'from-orange-500 to-amber-500';
  if (level === '黄色') return 'from-yellow-500 to-amber-400';
  if (level === '蓝色') return 'from-blue-500 to-cyan-500';
  return 'from-slate-500 to-slate-400';
}

function warningAdvice(level: '红色' | '橙色' | '黄色' | '蓝色' | '未知'): string[] {
  if (level === '红色') return ['建议暂停非必要外出', '避开低洼和高风险路段', '保持手机和应急电源可用'];
  if (level === '橙色') return ['减少长距离通勤', '提前规划绕行路线', '关注后续升级通报'];
  if (level === '黄色') return ['出行前关注实时雷达', '地铁与公交优先', '山区与河道附近谨慎活动'];
  if (level === '蓝色') return ['保持常规出行警惕', '雨具与防滑装备随身', '留意短时临近预报'];
  return ['持续关注官方预警更新', '根据实时天气调整行程'];
}

function warningImpact(level: '红色' | '橙色' | '黄色' | '蓝色' | '未知'): { traffic: string[]; mountain: string[] } {
  if (level === '红色') {
    return {
      traffic: ['建议暂停非必要跨区通勤', '地铁优先，减少高架和下穿通道通行'],
      mountain: ['暂停山区徒步和露营活动', '远离沟谷、陡坡和临崖路段'],
    };
  }
  if (level === '橙色') {
    return {
      traffic: ['尽量错峰出行，预留通勤时间', '重点关注积水点和拥堵路段'],
      mountain: ['避免进入地质灾害隐患点周边', '景区路线优先选择低风险步道'],
    };
  }
  if (level === '黄色') {
    return {
      traffic: ['出门前查看雷达与路况更新', '优先公共交通，避免长时间骑行'],
      mountain: ['山区活动建议结伴并报备行程', '避开午后对流活跃时段上山'],
    };
  }
  if (level === '蓝色') {
    return {
      traffic: ['保持常规通勤警惕，注意防滑', '携带雨具，注意能见度变化'],
      mountain: ['关注短时阵雨，备防风外套', '沿既定线路活动，避免野路穿行'],
    };
  }
  return {
    traffic: ['当前无高级别预警，按常规天气出行', '持续关注官方临近预报和路况更新'],
    mountain: ['山区活动前查看实时降雨与风力', '根据景区公告动态调整路线'],
  };
}

function parsePublishTimeToDate(publishTime?: string): Date | null {
  if (!publishTime) return null;
  const normalized = publishTime.replace(/\//g, '-').replace(/\s+/g, ' ').trim();
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const match = normalized.match(/(\d{4})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
}

function elapsedSincePublishText(publishTime?: string, nowTs: number = Date.now()): string {
  const published = parsePublishTimeToDate(publishTime);
  if (!published) return '距发布时间：时间待更新';
  const diffMs = Math.max(0, nowTs - published.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `距发布时间：${days}天${hours}小时`;
  if (hours > 0) return `距发布时间：${hours}小时${minutes}分钟`;
  return `距发布时间：${minutes}分钟`;
}

function WarningCard({
  data,
}: {
  data: {
    title: string;
    level: '红色' | '橙色' | '黄色' | '蓝色' | '未知';
    publishTime?: string;
    source?: string;
    area?: string;
    summary?: string;
    url?: string;
  };
}) {
  const [nowTs, setNowTs] = useState(Date.now());
  const impacts = warningImpact(data.level);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`mt-3 rounded-2xl border p-0 overflow-hidden ${warningLevelClass(data.level)}`}>
      <div className={`h-1.5 bg-gradient-to-r ${warningLevelAccent(data.level)}`} />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs px-2 py-1 rounded-full border border-current/30 font-semibold">天津气象局 · {data.level}预警</span>
          <span className="text-[11px] opacity-80">{data.publishTime || '时间待更新'}</span>
        </div>
        <p className="mt-1 text-[11px] opacity-80">{elapsedSincePublishText(data.publishTime, nowTs)}</p>
        <p className="mt-2 text-sm font-bold leading-snug">{data.title}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg bg-white/70 border border-current/15 px-2 py-1.5">来源：{data.source || '天津气象局'}</div>
          <div className="rounded-lg bg-white/70 border border-current/15 px-2 py-1.5">区域：{data.area || '天津市'}</div>
        </div>
        {data.summary && <p className="mt-2 text-xs leading-relaxed">{data.summary}</p>}
        <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px]">
          {warningAdvice(data.level).map((item) => (
            <div key={item} className="rounded-lg bg-white/70 border border-current/15 px-2 py-1.5">{item}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg bg-white/70 border border-current/15 p-2">
            <p className="font-semibold mb-1">交通影响</p>
            <div className="space-y-1">
              {impacts.traffic.map((item) => (
                <p key={item} className="leading-snug">• {item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-white/70 border border-current/15 p-2">
            <p className="font-semibold mb-1">山区影响</p>
            <div className="space-y-1">
              {impacts.mountain.map((item) => (
                <p key={item} className="leading-snug">• {item}</p>
              ))}
            </div>
          </div>
        </div>
        {data.url && (
          <a href={data.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs underline underline-offset-2">
            查看原文链接
          </a>
        )}
      </div>
    </div>
  );
}

function weatherIconByCode(code: number) {
  if (code === 0 || code === 1) return <Sun className="w-3.5 h-3.5 text-amber-500" />;
  if (code === 2 || code === 3) return <Cloud className="w-3.5 h-3.5 text-slate-500" />;
  if (code <= 49) return <CloudFog className="w-3.5 h-3.5 text-slate-400" />;
  if (code <= 69) return <CloudRain className="w-3.5 h-3.5 text-sky-500" />;
  if (code <= 84) return <CloudSnow className="w-3.5 h-3.5 text-cyan-500" />;
  return <Zap className="w-3.5 h-3.5 text-violet-500" />;
}

function TemperatureTrendCard({
  title,
  points,
}: {
  title: string;
  points: Array<{ label: string; max: number; min: number; weatherCode: number }>;
}) {
  if (!points.length) return null;

  const values = points.flatMap((p) => [p.max, p.min]);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = Math.max(1, maxVal - minVal);

  const width = 320;
  const height = 130;
  const padX = 20;
  const padY = 18;
  const stepX = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;

  const yFor = (v: number) => padY + (height - padY * 2) * (1 - (v - minVal) / range);
  const xFor = (idx: number) => padX + stepX * idx;

  const maxPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.max)}`)
    .join(' ');
  const minPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.min)}`)
    .join(' ');

  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-3">
      <p className="text-xs font-semibold text-blue-700 mb-2">{title}</p>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="block min-w-[320px]">
          {[0, 1, 2].map((k) => {
            const y = padY + ((height - padY * 2) * k) / 2;
            return <line key={k} x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />;
          })}

          <path d={minPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
          <path d={maxPath} fill="none" stroke="#f97316" strokeWidth="2.5" />

          {points.map((p, i) => (
            <g key={`${p.label}-${i}`}>
              <circle cx={xFor(i)} cy={yFor(p.max)} r="3" fill="#f97316" />
              <circle cx={xFor(i)} cy={yFor(p.min)} r="3" fill="#38bdf8" />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 最高温</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /> 最低温</span>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {points.map((p) => (
          <div key={p.label} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600">
            <p className="font-semibold text-slate-700">{p.label}</p>
            <div className="mt-0.5 inline-flex items-center gap-1">
              {weatherIconByCode(p.weatherCode)}
              <span>{p.min}~{p.max}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 解析 markdown 文字为 React 节点（加粗/行内代码）
function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={key++} className="font-bold">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<code key={key++} className="bg-black/8 rounded px-1 text-xs font-mono">{match[2]}</code>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// 将 AI 回复渲染成图标卡片形式
function AssistantMessage({ content }: { content: string }) {
  // 将内容按段落/条目拆分成卡片
  const lines = content.split('\n').filter(l => l.trim());

  // 条目卡片颜色循环
  const cardColors = [
    'bg-blue-50 border-blue-100',
    'bg-purple-50 border-purple-100',
    'bg-cyan-50 border-cyan-100',
    'bg-green-50 border-green-100',
    'bg-orange-50 border-orange-100',
    'bg-pink-50 border-pink-100',
    'bg-teal-50 border-teal-100',
    'bg-indigo-50 border-indigo-100',
  ];

  // 分析行类型
  type RenderedLine =
    | { kind: 'heading'; text: string }
    | { kind: 'bullet'; text: string; colorIdx: number }
    | { kind: 'numbered'; num: string; text: string; colorIdx: number }
    | { kind: 'para'; text: string };

  let bulletCount = 0;
  const rendered: RenderedLine[] = lines.map((line): RenderedLine => {
    const trimmed = line.trim();
    // 标题行：# / ## / ###
    const headingMatch = trimmed.match(/^#{1,3}\s+(.*)/);
    if (headingMatch) return { kind: 'heading', text: headingMatch[1] };
    // 有序列表
    const numberedMatch = trimmed.match(/^(\d+)[.、)]\s+(.*)/);
    if (numberedMatch) return { kind: 'numbered', num: numberedMatch[1], text: numberedMatch[2], colorIdx: bulletCount++ % cardColors.length };
    // 无序列表
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) return { kind: 'bullet', text: bulletMatch[1], colorIdx: bulletCount++ % cardColors.length };
    // 普通段落
    return { kind: 'para', text: trimmed };
  });

  return (
    <div className="space-y-2 w-full max-w-sm">
      {rendered.map((item, i) => {
        if (item.kind === 'heading') {
          return (
            <div key={i} className="text-sm font-black text-on-surface pt-1 pb-0.5 border-b border-black/8">
              {parseInline(item.text)}
            </div>
          );
        }
        if (item.kind === 'bullet') {
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-2 px-3 py-2 rounded-xl border ${cardColors[item.colorIdx]} text-sm`}
            >
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
              <span className="leading-snug">{parseInline(item.text)}</span>
            </motion.div>
          );
        }
        if (item.kind === 'numbered') {
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border ${cardColors[item.colorIdx]} text-sm`}
            >
              <span className="shrink-0 w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-[10px] font-black leading-none">
                {item.num}
              </span>
              <span className="leading-snug">{parseInline(item.text)}</span>
            </motion.div>
          );
        }
        // 普通段落
        return (
          <p key={i} className="text-sm leading-relaxed text-on-surface">
            {parseInline(item.text)}
          </p>
        );
      })}
    </div>
  );
}

export default function ChatPage({ onClose, initialInput, assistantName = '津小晴' }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const initialSentRef = useRef(false);

  useEffect(() => {
    const history = chatHistoryService.getHistory();
    setMessages(history);
    scrollToBottom();

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'zh-CN';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
          setIsListening(false);
        };
        recognitionRef.current.onerror = () => setIsListening(false);
      }
    }

    // 如果携带初始问题，自动发送
    if (initialInput && !initialSentRef.current) {
      initialSentRef.current = true;
      // 用 setTimeout 让组件先渲染再触发
      setTimeout(() => handleSendMessage(initialInput), 100);
    }
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  const handleSendMessage = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;

    const userMessage = chatHistoryService.addMessage({ type: 'user', content: query });
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (shouldShowLatestWarning(query)) {
        const official = await fetchLatestOfficialWarning('天津');
        if (official) {
          const fallbackMessage = chatHistoryService.addMessage({
            type: 'assistant',
            content: '根据天津气象局最新发布，当前预警如下：',
            visual: {
              type: 'warningCard',
              title: official.title,
              level: official.level,
              publishTime: official.publishTime,
              source: '天津气象局（官方发布）',
              area: '天津市',
              summary: '请根据预警等级合理安排出行，避免前往高风险区域。',
              url: official.detailUrl,
            },
          });
          setMessages((prev) => [...prev, fallbackMessage]);
          setIsLoading(false);
          scrollToBottom();
          return;
        }

        const advice = await chatWithAI('天津气象局当前暂无预警。请给出3条简短的天津出行与生活建议，分点列出。');
        const noWarningAdviceMessage = chatHistoryService.addMessage({
          type: 'assistant',
          content: `根据天津气象局最新发布，当前暂无预警。以下是常规出行建议：\n${advice}`,
        });
        setMessages((prev) => [...prev, noWarningAdviceMessage]);
        setIsLoading(false);
        scrollToBottom();
        return;
      }

      if (shouldShowTempTrend(query)) {
        const trend = await fetchTemperatureTrend(undefined, 7);
        const points = trend.map((p) => ({
          label: p.date.slice(5).replace('-', '/'),
          max: p.max,
          min: p.min,
          weatherCode: p.weatherCode,
        }));

        const maxTemp = Math.max(...points.map((p) => p.max));
        const minTemp = Math.min(...points.map((p) => p.min));
        const summary = `已为你生成近7日温度趋势图：最高温 ${maxTemp}°C，最低温 ${minTemp}°C。若需要，我还可以继续按区县细分。`;

        const chartMessage = chatHistoryService.addMessage({
          type: 'assistant',
          content: summary,
          visual: {
            type: 'tempTrend',
            title: '天津近7日温度趋势',
            points,
          },
        });

        setMessages((prev) => [...prev, chartMessage]);
        setIsLoading(false);
        scrollToBottom();
        return;
      }

      const response = await chatWithAI(query);
      const assistantMessage = chatHistoryService.addMessage({ type: 'assistant', content: response });
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage = chatHistoryService.addMessage({ type: 'assistant', content: '抱歉，我暂时无法回答。请检查网络连接或稍后重试。' });
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleNewConversation = () => {
    if (window.confirm('开启新对话会清空历史记录，确定吗？')) {
      chatHistoryService.startNewConversation();
      setMessages([]);
      setInput('');
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[70] bg-[#f5f7fa] flex flex-col overflow-hidden"
    >
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shadow-sm shrink-0 pt-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">返回</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-black text-slate-800">{assistantName}助手</h1>
          <span className="text-[10px] text-slate-400 leading-none">天津交通气象哨兵</span>
        </div>
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">新对话</span>
        </button>
      </div>

      {/* ── 快捷问题区（始终显示在消息列表顶部） ── */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">常见问题 · 点击直接询问</p>
        <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-2 overflow-x-auto pb-1">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q.label}
              onClick={() => handleSendMessage(q.label)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap w-max ${q.color}`}
            >
              <span>{q.emoji}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 对话内容区 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 text-center"
            >
              <img
                src={assistantName === '津小天' ? boyAvatar : girlAvatar}
                alt={assistantName}
                className="w-24 h-auto mb-3 drop-shadow-lg"
              />
              <h2 className="text-base font-black text-slate-700 mb-1">你好！我是{assistantName}</h2>
              <p className="text-xs text-slate-400 max-w-[220px]">点击上方快捷按钮，或在下方输入问题</p>
            </motion.div>
          ) : (
            <>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'assistant' && (
                    <img
                      src={assistantName === '津小天' ? boyAvatar : girlAvatar}
                      alt={assistantName}
                      className="shrink-0 w-9 h-9 rounded-full object-cover border-2 border-white shadow-md mt-0.5"
                    />
                  )}
                  <div className={`max-w-[85%] ${message.type === 'user' ? '' : ''}`}>
                    {message.type === 'user' ? (
                      <div className="bg-blue-500 text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed">
                        {message.content}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                        <AssistantMessage content={message.content} />
                        {message.visual?.type === 'tempTrend' && (
                          <TemperatureTrendCard title={message.visual.title} points={message.visual.points} />
                        )}
                        {message.visual?.type === 'warningCard' && <WarningCard data={message.visual} />}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 text-slate-400 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-black mt-1">
                      我
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <img
                    src={assistantName === '津小天' ? boyAvatar : girlAvatar}
                    alt={assistantName}
                    className="shrink-0 w-9 h-9 rounded-full object-cover border-2 border-white shadow-md mt-0.5"
                  />
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5 items-center h-5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── 底部输入区 ── */}
      <div className="shrink-0 bg-white border-t border-slate-100 px-4 py-3">
        <div className="flex gap-2 max-w-4xl mx-auto items-center">
          <button
            onClick={handleVoiceInput}
            disabled={isLoading}
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isListening ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入天气、交通、旅游问题..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-all disabled:opacity-50"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-40 disabled:bg-slate-300"
          >
            <Send className="w-4 h-4" />
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleNewConversation}
              disabled={isLoading}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all disabled:opacity-40"
              title="清空对话"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
