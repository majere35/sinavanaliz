import { trackOf } from './exams';
import type { AppData, Exam, Score, Student, Subject, Track } from './types';

/** 4 yanlış 1 doğruyu götürür. */
export const net = (s: Score) => s.d - s.y / 4;

export const blank = (questions: number, s: Score) => questions - s.d - s.y;

export type ScoreError = 'negative' | 'overflow' | null;

export function scoreError(questions: number, s: Score): ScoreError {
  if (s.d < 0 || s.y < 0 || !Number.isInteger(s.d) || !Number.isInteger(s.y)) return 'negative';
  if (s.d + s.y > questions) return 'overflow';
  return null;
}

/** Türkçe ondalık gösterim: 8.25 → "8,25", 12 → "12" */
export function fmt(n: number, digits = 2): string {
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  return r.toLocaleString('tr-TR', { maximumFractionDigits: digits });
}

export function fmtSigned(n: number): string {
  const s = fmt(Math.abs(n));
  if (Math.abs(n) < 0.005) return '0';
  return (n > 0 ? '+' : '−') + s;
}

export interface SubjectResult {
  subject: Subject;
  score: Score;
  blank: number;
  net: number;
  /** Başarı oranı 0..1 (net / soru, negatifse 0) */
  rate: number;
}

export interface ExamResult {
  exam: Exam;
  subjects: SubjectResult[];
  totalNet: number;
  totalQuestions: number;
}

export function hasResult(data: AppData, examId: string, studentId: string): boolean {
  const r = data.results[examId]?.[studentId];
  return !!r && Object.keys(r).length > 0;
}

export function examResult(data: AppData, exam: Exam, studentId: string): ExamResult | null {
  const r = data.results[exam.id]?.[studentId];
  if (!r || Object.keys(r).length === 0) return null;
  const subjects = exam.subjects.map((subject) => {
    const score = r[subject.id] ?? { d: 0, y: 0 };
    const n = net(score);
    return {
      subject,
      score,
      blank: blank(subject.questions, score),
      net: n,
      rate: subject.questions > 0 ? Math.max(0, n) / subject.questions : 0,
    };
  });
  return {
    exam,
    subjects,
    totalNet: subjects.reduce((a, s) => a + s.net, 0),
    totalQuestions: exam.subjects.reduce((a, s) => a + s.questions, 0),
  };
}

export const byDate = (a: Exam, b: Exam) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, 'tr');

/** Öğrencinin bir yoldaki (TYT / AYT) sonuç girilmiş sınavları, tarih sırasıyla. */
export function timeline(data: AppData, studentId: string, track: Track): ExamResult[] {
  return data.exams
    .filter((e) => trackOf(e.type) === track)
    .slice()
    .sort(byDate)
    .map((e) => examResult(data, e, studentId))
    .filter((r): r is ExamResult => r !== null);
}

export const targetFor = (st: Student, track: Track) => (track === 'TYT' ? st.targetTyt : st.targetAyt);

export interface SubjectDelta {
  current: SubjectResult;
  previous: SubjectResult | null;
  delta: number | null;
}

/** Ders adına göre eşleyerek bir önceki sınavla kıyaslar. */
export function compareSubjects(current: ExamResult, previous: ExamResult | null): SubjectDelta[] {
  return current.subjects.map((cur) => {
    const prev =
      previous?.subjects.find((p) => p.subject.id === cur.subject.id) ??
      previous?.subjects.find((p) => p.subject.name === cur.subject.name) ??
      null;
    return { current: cur, previous: prev, delta: prev ? cur.net - prev.net : null };
  });
}

/** En çok artan ders (yalnızca pozitif artış varsa). */
export function mostImproved(deltas: SubjectDelta[]): SubjectDelta | null {
  let best: SubjectDelta | null = null;
  for (const d of deltas) {
    if (d.delta !== null && d.delta > 0.001 && (!best || d.delta > (best.delta ?? 0))) best = d;
  }
  return best;
}

/** Son sınav, önceki tüm sınavlardan yüksekse rekor (en az 2 sınav). */
export function isRecord(line: ExamResult[], index: number): boolean {
  if (index < 1) return false;
  const cur = line[index].totalNet;
  return line.slice(0, index).every((r) => cur > r.totalNet + 0.001);
}
