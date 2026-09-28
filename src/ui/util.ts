const AVATAR_COLORS = ['#2f63d1', '#f07a2b', '#22a3a0', '#8e44ad', '#e5394a', '#3b38a6', '#d4892a', '#1f9e5a', '#c2185b', '#0277bd'];

export function avatarColor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toLocaleUpperCase('tr-TR');
}

export const TYPE_COLORS: Record<string, string> = {
  TYT: '#2f63d1',
  AYT_SAY: '#f07a2b',
  AYT_EA: '#8e44ad',
  AYT_SOZ: '#22a3a0',
  YDT: '#e5394a',
};

/** Şubeye göre gruplar (Türkçe sıralı). */
export function groupBy<T>(items: T[], key: (t: T) => string): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'tr', { numeric: true }));
}

export const last = <T,>(arr: T[]): T | undefined => arr[arr.length - 1];
