// 简单的markdown格式处理
export const renderMarkdownText = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // 分割文本，处理各种markdown格式
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // 正则表达式匹配 markdown 格式
  const patterns = [
    // 加粗：**text** 或 __text__
    { regex: /\*\*(.+?)\*\*|__(.+?)__/g, type: 'bold' },
    // 斜体：*text* 或 _text_
    { regex: /\*(.+?)\*|_(.+?)_/g, type: 'italic' },
    // 代码：`code`
    { regex: /`(.+?)`/g, type: 'code' },
    // 删除线：~~text~~
    { regex: /~~(.+?)~~/g, type: 'strikethrough' },
  ];

  // 创建匹配项的对象
  const matches: Array<{ start: number; end: number; type: string; content: string }> = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      const content = match[1] || match[2] || match[0];
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: pattern.type,
        content: content,
      });
    }
  }

  // 按位置排序匹配项
  matches.sort((a, b) => a.start - b.start);

  let currentIndex = 0;
  for (const match of matches) {
    if (match.start > currentIndex) {
      // 添加未匹配的文本
      parts.push(text.substring(currentIndex, match.start));
    }

    // 添加格式化的文本
    switch (match.type) {
      case 'bold':
        parts.push(
          <strong key={`${match.start}-bold`} className="font-bold text-on-surface">
            {match.content}
          </strong>
        );
        break;
      case 'italic':
        parts.push(
          <em key={`${match.start}-italic`} className="italic">
            {match.content}
          </em>
        );
        break;
      case 'code':
        parts.push(
          <code
            key={`${match.start}-code`}
            className="bg-surface-dim rounded px-1.5 py-0.5 font-mono text-xs text-on-surface"
          >
            {match.content}
          </code>
        );
        break;
      case 'strikethrough':
        parts.push(
          <del key={`${match.start}-strike`} className="line-through opacity-60">
            {match.content}
          </del>
        );
        break;
    }

    currentIndex = match.end;
  }

  // 添加剩余文本
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
};

// 处理换行和缩进
export const formatMessageContent = (text: string): string => {
  // 标准化换行
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .trim();
};
