/**
 * AIGC Service — CogView-3 图片生成 + CogVideoX 视频生成
 * 基于智谱 AI 开放平台
 */

const GLM_BASE = 'https://open.bigmodel.cn/api/paas/v4';

function getApiKey(): string {
  return import.meta.env.VITE_GLM_API_KEY || '';
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

// ─── 意图识别 ────────────────────────────────────────────
export type AIGCIntent = 'image' | 'video' | 'qa';

const IMAGE_KEYWORDS = ['海报', '图片', '图', '生成图', '画一张', '画张', '做张', '配图', 'poster', '图像'];
const VIDEO_KEYWORDS = ['视频', '短片', '动画', '短视频', '做个视频', '生成视频', '拍摄', 'video'];

export function detectIntent(input: string): AIGCIntent {
  const lower = input.toLowerCase();
  if (VIDEO_KEYWORDS.some(k => lower.includes(k))) return 'video';
  if (IMAGE_KEYWORDS.some(k => lower.includes(k))) return 'image';
  return 'qa';
}

// ─── 文生图 ──────────────────────────────────────────────
export interface GeneratedImage {
  url: string;
  prompt: string;
  revisedPrompt?: string;
}

export async function generateWeatherPoster(prompt: string): Promise<GeneratedImage> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('未配置 GLM API Key');

  // 增强 prompt：加入气象主题风格引导
  const enhancedPrompt = `天津气象科普海报风格，${prompt}，高清，扁平插画风格，中文字体，配色以蓝色和橙色为主，专业气象图表元素`;

  const res = await fetch(`${GLM_BASE}/images/generations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: 'cogview-3-flash',
      prompt: enhancedPrompt,
      size: '1024x1024',
      n: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CogView 生成失败: ${err}`);
  }

  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) throw new Error('未获取到图片 URL');

  return { url, prompt: enhancedPrompt, revisedPrompt: data?.data?.[0]?.revised_prompt };
}

// ─── 文生视频（异步任务）────────────────────────────────

export interface VideoTask {
  taskId: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAIL';
  videoUrl?: string;
  coverUrl?: string;
}

export async function startVideoGeneration(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('未配置 GLM API Key');

  const enhancedPrompt = `气象科普短视频，${prompt}，天津城市背景，专业气象播报风格，动态天气效果`;

  const res = await fetch(`${GLM_BASE}/videos/generations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: 'cogvideox-flash',
      prompt: enhancedPrompt,
      quality: 'speed',
      with_audio: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CogVideoX 任务创建失败: ${err}`);
  }

  const data = await res.json();
  const taskId = data?.id;
  if (!taskId) throw new Error('未获取到任务 ID');
  return taskId;
}

export async function pollVideoResult(taskId: string): Promise<VideoTask> {
  const res = await fetch(`${GLM_BASE}/async-result/${taskId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error('轮询视频状态失败');

  const data = await res.json();
  const status: VideoTask['status'] = data?.task_status ?? 'PROCESSING';

  return {
    taskId,
    status,
    videoUrl: data?.video_result?.[0]?.url,
    coverUrl: data?.video_result?.[0]?.cover_image_url,
  };
}

// ─── 辅助：下载文件 ──────────────────────────────────────
export async function downloadMedia(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    // 降级：直接在新标签页打开
    window.open(url, '_blank');
  }
}
