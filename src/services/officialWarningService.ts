import { getCachedValue } from './cacheService';

export interface OfficialWarning {
  title: string;
  level: '红色' | '橙色' | '黄色' | '蓝色' | '未知';
  detailUrl: string;
  publishTime?: string;
}

function parseWarningLevel(title: string): OfficialWarning['level'] {
  if (title.includes('红色')) return '红色';
  if (title.includes('橙色')) return '橙色';
  if (title.includes('黄色')) return '黄色';
  if (title.includes('蓝色')) return '蓝色';
  return '未知';
}

function districtKeywords(district?: string): string[] {
  if (!district) return ['天津'];
  const base = district.replace('区', '').replace('市', '');
  return [district, base, '天津'];
}

export async function fetchLatestOfficialWarning(district?: string): Promise<OfficialWarning | null> {
  return getCachedValue(
    `warning:${district || '天津'}`,
    async () => {
      try {
        const res = await fetch('/api/nmc/publish/alarm.html', {
          headers: { Accept: 'text/html' },
        });

        if (!res.ok) {
          return null;
        }

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href*="/publish/alarm/"]'));

        if (!links.length) return null;

        const keywords = districtKeywords(district);
        const items = links
          .map((link) => {
            const title = (link.textContent || '').trim();
            const href = link.getAttribute('href') || '';
            const rowText = (link.parentElement?.textContent || '').replace(/\s+/g, ' ').trim();
            const timeMatch = rowText.match(/\d{4}\/\d{2}\/\d{2}\s*\d{2}:\d{2}/);
            return {
              title,
              detailUrl: href.startsWith('http') ? href : `https://www.nmc.cn${href}`,
              publishTime: timeMatch?.[0],
            };
          })
          .filter((item) => item.title.length > 0);

        const matched = items.find((item) => keywords.some((key) => item.title.includes(key)));
        if (!matched) return null;

        return {
          ...matched,
          level: parseWarningLevel(matched.title),
        };
      } catch (error) {
        console.error('官方预警获取失败:', error);
        return null;
      }
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}
