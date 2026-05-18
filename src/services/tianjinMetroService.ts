import { searchMetroStations } from './aMapService';
import { getCachedValue } from './cacheService';

export interface MetroLineMeta {
  id: string;
  name: string;
  color: string;
}

export interface MetroStationPoint {
  id: string;
  name: string;
  lineId: string;
  lineName: string;
  lineColor: string;
  lat: number;
  lng: number;
  district: string;
  address: string;
  seq: number;
}

interface AMapSubwayStationRaw {
  n: string;
  sl: string;
  sid: string;
  poiid?: string;
}

interface AMapSubwayLineRaw {
  ln: string;
  ls: string;
  cl?: string;
  st: AMapSubwayStationRaw[];
}

interface AMapSubwayDrwRaw {
  i: string;
  s: string;
  l: AMapSubwayLineRaw[];
}

export const TIANJIN_METRO_LINES: MetroLineMeta[] = [
  { id: 'l1', name: '1号线', color: '#e11d48' },
  { id: 'l2', name: '2号线', color: '#f59e0b' },
  { id: 'l3', name: '3号线', color: '#0284c7' },
  { id: 'l4', name: '4号线', color: '#14b8a6' },
  { id: 'l5', name: '5号线', color: '#22c55e' },
  { id: 'l6', name: '6号线', color: '#db2777' },
  { id: 'l7', name: '7号线', color: '#f43f5e' },
  { id: 'l8', name: '8号线', color: '#7c3aed' },
  { id: 'l9', name: '9号线', color: '#06b6d4' },
  { id: 'l10', name: '10号线', color: '#84cc16' },
  { id: 'l11', name: '11号线', color: '#ef4444' },
  { id: 'z4', name: 'Z4线', color: '#0ea5e9' },
  { id: 'jj', name: '津静线', color: '#10b981' },
];

const LINE_ID_BY_NAME: Record<string, string> = TIANJIN_METRO_LINES.reduce((acc, line) => {
  acc[line.name] = line.id;
  return acc;
}, {} as Record<string, string>);

const LINE_COLOR_BY_ID: Record<string, string> = TIANJIN_METRO_LINES.reduce((acc, line) => {
  acc[line.id] = line.color;
  return acc;
}, {} as Record<string, string>);

function normalizeLineId(lineName: string, fallbackLineCode: string): string {
  const normalizedName = String(lineName || '').replace(/\s+/g, '');

  if (LINE_ID_BY_NAME[normalizedName]) return LINE_ID_BY_NAME[normalizedName];
  if (normalizedName.includes('津静线')) return 'jj';
  if (/z\s*4/i.test(normalizedName)) return 'z4';

  const match = normalizedName.match(/(\d+)号线/);
  if (match) return `l${match[1]}`;

  return fallbackLineCode;
}

function parseLatLng(raw: string): { lat: number; lng: number } | null {
  const [lng, lat] = String(raw || '')
    .split(',')
    .map((item) => Number(item.trim()));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function orderStationsByPath(points: MetroStationPoint[]): MetroStationPoint[] {
  if (points.length <= 2) {
    return points.map((point, index) => ({ ...point, seq: index + 1 }));
  }

  const remaining = [...points].sort((a, b) => a.lng - b.lng || a.lat - b.lat);
  const ordered: MetroStationPoint[] = [];
  let current = remaining.shift()!;
  ordered.push(current);

  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const distance = distanceKm(current.lat, current.lng, candidate.lat, candidate.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    current = remaining.splice(nearestIndex, 1)[0];
    ordered.push(current);
  }

  return ordered.map((point, index) => ({ ...point, seq: index + 1 }));
}

export async function fetchTianjinMetroLineStations(line: MetroLineMeta): Promise<MetroStationPoint[]> {
  return getCachedValue(
    `metro:line:v2:${line.id}`,
    async () => {
      const places = await searchMetroStations(line.name, '天津');
      const dedup = new Map<string, MetroStationPoint>();

      for (const place of places) {
        const key = `${place.name}-${place.location.lat.toFixed(5)}-${place.location.lng.toFixed(5)}`;
        if (dedup.has(key)) continue;

        dedup.set(key, {
          id: `${line.id}-${place.id}`,
          name: place.name,
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
          lat: place.location.lat,
          lng: place.location.lng,
          district: place.district || '天津市',
          address: place.address || '',
          seq: 0,
        });
      }

      const points = Array.from(dedup.values());
      return orderStationsByPath(points);
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}

export async function fetchTianjinMetroNetwork(): Promise<Record<string, MetroStationPoint[]>> {
  return getCachedValue(
    'metro:tianjin:network:v2',
    async () => {
      try {
        const localRes = await fetch('/data/tianjin_metro_drw.json');
        const drw = (await localRes.json()) as AMapSubwayDrwRaw;

        if (!Array.isArray(drw?.l) || drw.l.length === 0) {
          throw new Error('empty subway dataset');
        }

        const result: Record<string, MetroStationPoint[]> = {};

        for (const rawLine of drw.l) {
          const lineName = rawLine.ln;
          const lineId = normalizeLineId(lineName, rawLine.ls || lineName);
          const fallbackColor = rawLine.cl ? `#${rawLine.cl}` : '#2563eb';
          const lineColor = LINE_COLOR_BY_ID[lineId] || fallbackColor;

          const stations = (rawLine.st || [])
            .map((rawStation, index) => {
              const coords = parseLatLng(rawStation.sl);
              if (!coords) return null;

              return {
                id: `${lineId}-${rawStation.sid || rawStation.poiid || index}`,
                name: rawStation.n,
                lineId,
                lineName,
                lineColor,
                lat: coords.lat,
                lng: coords.lng,
                district: '天津市',
                address: '',
                seq: index + 1,
              } satisfies MetroStationPoint;
            })
            .filter(Boolean) as MetroStationPoint[];

          if (!result[lineId]) {
            result[lineId] = stations;
          } else {
            const existing = result[lineId];
            const seen = new Set(existing.map((station) => `${station.name}-${station.lat.toFixed(6)}-${station.lng.toFixed(6)}`));
            for (const station of stations) {
              const key = `${station.name}-${station.lat.toFixed(6)}-${station.lng.toFixed(6)}`;
              if (!seen.has(key)) {
                existing.push({ ...station, seq: existing.length + 1 });
                seen.add(key);
              }
            }
          }
        }

        for (const line of TIANJIN_METRO_LINES) {
          if (!result[line.id]) result[line.id] = [];
        }

        return result;
      } catch {
        const fallback: Record<string, MetroStationPoint[]> = {};
        const all = await Promise.all(
          TIANJIN_METRO_LINES.map(async (line) => {
            try {
              const stations = await fetchTianjinMetroLineStations(line);
              return { lineId: line.id, stations };
            } catch {
              return { lineId: line.id, stations: [] as MetroStationPoint[] };
            }
          })
        );

        for (const item of all) fallback[item.lineId] = item.stations;
        return fallback;
      }
    },
    { ttlMs: 30 * 60 * 1000, refreshAheadMs: 5 * 60 * 1000 }
  );
}

export function fuzzySearchStations(stations: MetroStationPoint[], keyword: string): MetroStationPoint[] {
  const q = keyword.trim();
  if (!q) return [];

  const normalized = q.toLowerCase();
  return stations
    .filter((station) => {
      const target = `${station.name} ${station.lineName} ${station.district} ${station.address}`.toLowerCase();
      return target.includes(normalized);
    })
    .slice(0, 20);
}
