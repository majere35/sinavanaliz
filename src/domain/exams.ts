import type { ExamType, Field, Subject, Track } from './types';

export const EXAM_TYPES: { type: ExamType; label: string; short: string }[] = [
  { type: 'TYT', label: 'TYT', short: 'TYT' },
  { type: 'AYT_SAY', label: 'AYT Sayısal (MF)', short: 'AYT-SAY' },
  { type: 'AYT_EA', label: 'AYT Eşit Ağırlık (TM)', short: 'AYT-EA' },
  { type: 'AYT_SOZ', label: 'AYT Sözel (TS)', short: 'AYT-SÖZ' },
  { type: 'YDT', label: 'YDT Yabancı Dil', short: 'YDT' },
];

export const FIELDS: { field: Field; label: string }[] = [
  { field: 'SAY', label: 'Sayısal' },
  { field: 'EA', label: 'Eşit Ağırlık' },
  { field: 'SOZ', label: 'Sözel' },
  { field: 'DIL', label: 'Dil' },
];

export const examTypeLabel = (t: ExamType) => EXAM_TYPES.find((e) => e.type === t)?.label ?? t;
export const examTypeShort = (t: ExamType) => EXAM_TYPES.find((e) => e.type === t)?.short ?? t;
export const fieldLabel = (f: Field) => FIELDS.find((e) => e.field === f)?.label ?? f;

type Tpl = [id: string, name: string, questions: number][];

const TEMPLATES: Record<ExamType, Tpl> = {
  TYT: [
    ['turkce', 'Türkçe', 40],
    ['tarih', 'Tarih', 5],
    ['cografya', 'Coğrafya', 5],
    ['felsefe', 'Felsefe', 5],
    ['din', 'Din Kültürü', 5],
    ['matematik', 'Matematik', 30],
    ['geometri', 'Geometri', 10],
    ['fizik', 'Fizik', 7],
    ['kimya', 'Kimya', 7],
    ['biyoloji', 'Biyoloji', 6],
  ],
  AYT_SAY: [
    ['matematik', 'Matematik', 30],
    ['geometri', 'Geometri', 10],
    ['fizik', 'Fizik', 14],
    ['kimya', 'Kimya', 13],
    ['biyoloji', 'Biyoloji', 13],
  ],
  AYT_EA: [
    ['matematik', 'Matematik', 30],
    ['geometri', 'Geometri', 10],
    ['edebiyat', 'Türk Dili ve Edebiyatı', 24],
    ['tarih1', 'Tarih-1', 10],
    ['cografya1', 'Coğrafya-1', 6],
  ],
  AYT_SOZ: [
    ['edebiyat', 'Türk Dili ve Edebiyatı', 24],
    ['tarih1', 'Tarih-1', 10],
    ['cografya1', 'Coğrafya-1', 6],
    ['tarih2', 'Tarih-2', 11],
    ['cografya2', 'Coğrafya-2', 11],
    ['felsefe', 'Felsefe Grubu', 12],
    ['din', 'Din Kültürü', 6],
  ],
  YDT: [['yabancidil', 'Yabancı Dil', 80]],
};

export const templateSubjects = (t: ExamType): Subject[] =>
  TEMPLATES[t].map(([id, name, questions]) => ({ id, name, questions }));

export const trackOf = (t: ExamType): Track => (t === 'TYT' ? 'TYT' : 'AYT');

/** Öğrenci bu sınav türüne girer mi? TYT herkes; AYT/YDT alana göre. */
export function examAppliesTo(t: ExamType, f: Field): boolean {
  switch (t) {
    case 'TYT':
      return true;
    case 'AYT_SAY':
      return f === 'SAY';
    case 'AYT_EA':
      return f === 'EA';
    case 'AYT_SOZ':
      return f === 'SOZ';
    case 'YDT':
      return f === 'DIL';
  }
}

export const fieldExamType = (f: Field): ExamType =>
  ({ SAY: 'AYT_SAY', EA: 'AYT_EA', SOZ: 'AYT_SOZ', DIL: 'YDT' } as const)[f];
