import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import boyAvatar from '../assets/avatars/boy.png';
import girlAvatar from '../assets/avatars/girl.png';
import { chatWithAI } from '../services/aiService';

const CHARACTERS = [
  {
    name: '津小天',
    avatarUrl: boyAvatar,
  },
  {
    name: '津小晴',
    avatarUrl: girlAvatar,
  }
];

function getGreetingText(name: string) {
  return name === '津小天'
    ? '我是津小天，请问有什么可以帮您？'
    : '我是津小晴，请问有什么可以帮您？';
}

interface AIAssistantProps {
  initialMessage?: string;
  onOpenChat?: (initialInput?: string, assistantName?: string) => void;
}

export default function AIAssistant({ 
  initialMessage = '有什么可以帮您？',
  onOpenChat
}: AIAssistantProps) {
  const character = useMemo(() => {
    const randomIdx = Math.floor(Math.random() * CHARACTERS.length);
    return CHARACTERS[randomIdx];
  }, []);
  const [showBubble, setShowBubble] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [assistantReply, setAssistantReply] = useState(() => (initialMessage && initialMessage !== '有什么可以帮您？' ? initialMessage : getGreetingText(character.name)));
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const randomBubbleTimerRef = useRef<number | null>(null);
  const dragBoundsRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const startHideTimer = () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setShowBubble(false);
      }, 2000);
    };

    const scheduleRandomBubble = () => {
      if (randomBubbleTimerRef.current) {
        window.clearTimeout(randomBubbleTimerRef.current);
      }

      const delay = 12000 + Math.floor(Math.random() * 8000);
      randomBubbleTimerRef.current = window.setTimeout(() => {
        setAssistantReply(getGreetingText(character.name));
        setShowBubble(true);
        startHideTimer();
        scheduleRandomBubble();
      }, delay);
    };

    setAssistantReply(getGreetingText(character.name));
    setShowBubble(true);
    startHideTimer();
    scheduleRandomBubble();

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      if (randomBubbleTimerRef.current) {
        window.clearTimeout(randomBubbleTimerRef.current);
      }
    };
  }, [character.name]);

  const popBubble = () => {
    setShowBubble(true);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setShowBubble(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const query = inputValue.trim();
    setInputValue('');

    // 有输入内容时，跳转到对话页并携带初始问题
    if (onOpenChat) {
      onOpenChat(query, character.name);
      return;
    }

    setIsSending(true);
    try {
      const response = await chatWithAI(query);
      setAssistantReply(response);
      setShowBubble(true);
      popBubble();
    } finally {
      setIsSending(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setAssistantReply('当前浏览器不支持语音输入，请直接打字。');
      setShowBubble(true);
      popBubble();
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInputValue(transcript);
      }
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div ref={dragBoundsRef} className="pointer-events-none fixed inset-0 z-[55]">
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={dragBoundsRef}
        className="absolute right-3 bottom-[92px] md:right-5 md:bottom-[100px] pointer-events-none cursor-grab active:cursor-grabbing"
      >
        <div className="relative pointer-events-auto select-none">
          <AnimatePresence>
            {showBubble && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-2 -top-12 whitespace-nowrap bg-white text-[#1f2937] text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg border border-slate-200"
              >
                {assistantReply}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => onOpenChat?.(undefined, character.name)}
            whileTap={{ scale: 0.96 }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-transparent border-none p-0"
            aria-label={`${character.name}助手`}
          >
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="block w-24 md:w-28 h-auto max-w-none select-none drop-shadow-[0_12px_32px_rgba(0,0,0,0.24)]"
              draggable={false}
            />
          </motion.button>
        </div>
      </motion.div>

      <div className="fixed left-1/2 bottom-3 z-[55] w-[min(92vw,760px)] -translate-x-1/2 pointer-events-auto">
        <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.16)] px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${isListening ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              aria-label="语音输入"
            >
              <Mic className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入天气、交通、旅游问题"
                className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 text-white disabled:opacity-50"
              aria-label="发送"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

