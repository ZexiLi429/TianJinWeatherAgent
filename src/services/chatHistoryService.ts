// 对话历史管理服务
export type ChatMessage = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  visual?: {
    type: 'tempTrend';
    title: string;
    points: Array<{ label: string; max: number; min: number; weatherCode: number }>;
  } | {
    type: 'warningCard';
    title: string;
    level: '红色' | '橙色' | '黄色' | '蓝色' | '未知';
    publishTime?: string;
    source?: string;
    area?: string;
    summary?: string;
    url?: string;
  };
};

const STORAGE_KEY = 'weather_chat_history';

export const chatHistoryService = {
  // 获取对话历史
  getHistory(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // 添加新消息
  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const messages = this.getHistory();
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    messages.push(newMessage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return newMessage;
  },

  // 清空历史
  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  // 开始新对话（清空历史）
  startNewConversation(): void {
    this.clearHistory();
  },
};
