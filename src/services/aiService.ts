import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

function getGeminiApiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY || "";
}

function getGeminiClient(): GoogleGenAI | null {
  if (geminiClient) return geminiClient;

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
}

const SYSTEM_INSTRUCTION = `你是一位专业的交通与旅游气象专家，名叫"津小晴"或"津小天"。你致力于为天津市民提供最精准的地铁、高速以及蓟州山区的气象导航建议。

【天津交通气象哨兵系统】掌握实时数据：
- 地铁运营：1、3、6、9号线覆盖全市
- 高速监控：秦滨、京哈、津滨高速
- 山区哨兵：盘山、梨木台、八仙山等实时气象
- 地质灾害监控：244个隐患点实时预警

用户可能的提问包括：天气预报、交通建议、登山建议、穿衣建议、地灾预警等。请根据实时数据给出专业建议。`;

export interface GLMWarningCard {
  title: string;
  level: '红色' | '橙色' | '黄色' | '蓝色' | '未知';
  publishTime?: string;
  source?: string;
  area?: string;
  summary?: string;
  url?: string;
}

function normalizeWarningLevel(text: string): GLMWarningCard['level'] {
  if (text.includes('红')) return '红色';
  if (text.includes('橙')) return '橙色';
  if (text.includes('黄')) return '黄色';
  if (text.includes('蓝')) return '蓝色';
  return '未知';
}

function safeParseGLMWarning(raw: string): GLMWarningCard | null {
  const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
  try {
    const data = JSON.parse(jsonText);
    if (!data?.title) return null;
    return {
      title: String(data.title),
      level: normalizeWarningLevel(String(data.level || data.title || '')),
      publishTime: data.publishTime ? String(data.publishTime) : undefined,
      source: data.source ? String(data.source) : 'GLM查询',
      area: data.area ? String(data.area) : '天津',
      summary: data.summary ? String(data.summary) : undefined,
      url: data.url ? String(data.url) : undefined,
    };
  } catch {
    return null;
  }
}

export async function fetchLatestWarningByGLM(): Promise<GLMWarningCard | null> {
  const apiKey = import.meta.env.VITE_GLM_API_KEY;
  if (!apiKey) return null;

  const prompt = `请查询天津气象局最新发布的预警信息，并只返回一个JSON对象，不要输出任何额外文字。
字段要求：
title: 预警标题
level: 红色/橙色/黄色/蓝色/未知
publishTime: 发布时间（如 2026-05-12 15:20）
source: 信息来源（如 天津气象局）
area: 影响区域
summary: 30字以内风险提示
url: 原文链接（没有可留空字符串）`;

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        temperature: 0.1,
        top_p: 0.7,
        messages: [
          { role: 'system', content: '你是气象信息抽取助手，只输出JSON。' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;

    return safeParseGLMWarning(content);
  } catch {
    return null;
  }
}

// 与 Gemini 对话
async function chatWithGemini(message: string): Promise<string> {
  const client = getGeminiClient();
  
  if (!client) {
    return "Gemini 服务未配置";
  }

  try {
    const response = await client.generateContent({
      systemInstruction: SYSTEM_INSTRUCTION,
      contents: [{ role: "user", parts: [{ text: message }] }],
    });

    const text = response.content.parts[0]?.text;
    return text || "无法生成回复，请稍后重试。";
  } catch (error) {
    console.error("Gemini API 错误:", error);
    return "抱歉，Gemini 服务暂时无法使用。";
  }
}

// 与 GLM 对话（智谱清言）
async function chatWithGLM(message: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GLM_API_KEY;
  
  if (!apiKey) {
    return "GLM 服务未配置";
  }

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          {
            role: "system",
            content: SYSTEM_INSTRUCTION,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        top_p: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`GLM API 错误: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    return text || "无法生成回复，请稍后重试。";
  } catch (error) {
    console.error("GLM API 错误:", error);
    return "抱歉，GLM 服务暂时无法使用。";
  }
}

// 导出聊天函数
export const chatWithAI = async (message: string): Promise<string> => {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const glmKey = import.meta.env.VITE_GLM_API_KEY;
  const preferGLM = import.meta.env.VITE_PREFER_GLM === "true";

  // 根据配置选择 AI 服务
  if (preferGLM && glmKey) {
    const response = await chatWithGLM(message);
    if (response !== "GLM 服务未配置") {
      return response;
    }
  }

  if (geminiKey) {
    const response = await chatWithGemini(message);
    if (response !== "Gemini 服务未配置") {
      return response;
    }
  }

  if (glmKey) {
    return chatWithGLM(message);
  }

  return "AI 服务未配置。请在项目根目录 .env 中设置：\n- VITE_GEMINI_API_KEY（Google Gemini）\n- VITE_GLM_API_KEY（智谱清言）\n- VITE_PREFER_GLM=true（可选，优先使用 GLM）";
};

export { chatWithGemini, chatWithGLM };
