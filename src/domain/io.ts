import type { AppData } from './types';

const DATA_TAG_ID = 'sa-data';

export function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function isValidData(x: unknown): x is AppData {
  const d = x as AppData;
  return !!d && d.version === 1 && Array.isArray(d.students) && Array.isArray(d.exams) && typeof d.results === 'object';
}

/** Sunum dosyasına gömülü veri (varsa). Varsa uygulama salt-okunur sunum modunda açılır. */
export function readEmbeddedData(): AppData | null {
  const el = document.getElementById(DATA_TAG_ID);
  if (!el?.textContent) return null;
  try {
    const parsed = JSON.parse(el.textContent);
    return isValidData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const canBuildPresentation = () => !import.meta.env.DEV && !!window.__APP_HTML__ && !!window.__APP_MARK__;

/** Uygulamanın kendi HTML'ine veriyi gömerek tek başına çalışan sunum dosyası üretir. */
export function buildPresentationHtml(data: AppData): string {
  const html = window.__APP_HTML__;
  const mark = window.__APP_MARK__;
  if (!html || !mark) throw new Error('Uygulama HTML kopyası bulunamadı');
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const tag = `<script id="${DATA_TAG_ID}" type="application/json">${json}</script>`;
  return html.split(mark).join(tag);
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file, 'utf-8');
  });
}
