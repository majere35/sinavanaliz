import { byDate, examResult, targetFor, type ExamResult, type SubjectResult } from './calc';
import { trackOf } from './exams';
import type { AppData, Exam, Student, Track } from './types';

/** Aynı tarihteki sınavlar tek "deneme turu"dur (AYT'de her alan kendi sınavına girer). */
export interface Round {
  index: number;
  date: string;
  label: string;
  exams: Exam[];
}

export function rounds(data: AppData, track: Track): Round[] {
  const byDay = new Map<string, Exam[]>();
  for (const e of data.exams.filter((x) => trackOf(x.type) === track).sort(byDate)) {
    const arr = byDay.get(e.date);
    if (arr) arr.push(e);
    else byDay.set(e.date, [e]);
  }
  return [...byDay.entries()].map(([date, exams], index) => ({
    index,
    date,
    label: exams.length === 1 ? exams[0].name : `${index + 1}. Deneme`,
    exams,
  }));
}

export function roundResult(data: AppData, studentId: string, round: Round): ExamResult | null {
  for (const e of round.exams) {
    const r = examResult(data, e, studentId);
    if (r) return r;
  }
  return null;
}

export type Metric = 'net' | 'target' | 'growth';

export interface RaceEntry {
  student: Student;
  value: number;
  /** Bu turda sonucu yok, önceki değer taşındı */
  carried: boolean;
}

export interface RaceFrame {
  round: Round;
  entries: RaceEntry[];
}

/** Yarış kareleri: her tur için öğrencilerin değeri, büyükten küçüğe. Sonucu olmayan tura önceki değer taşınır. */
export function raceFrames(data: AppData, students: Student[], track: Track, metric: Metric): RaceFrame[] {
  const rs = rounds(data, track);
  const last = new Map<string, number>();
  const first = new Map<string, number>();
  return rs.map((round) => {
    const entries: RaceEntry[] = [];
    for (const st of students) {
      const r = roundResult(data, st.id, round);
      let value: number | null = null;
      if (r) {
        if (!first.has(st.id)) first.set(st.id, r.totalNet);
        const target = targetFor(st, track);
        value =
          metric === 'net' ? r.totalNet : metric === 'growth' ? r.totalNet - first.get(st.id)! : target ? (Math.max(0, r.totalNet) / target) * 100 : null;
        if (value !== null) last.set(st.id, value);
        entries.push(...(value !== null ? [{ student: st, value, carried: false }] : []));
      } else if (last.has(st.id)) {
        entries.push({ student: st, value: last.get(st.id)!, carried: true });
      }
    }
    entries.sort((a, b) => b.value - a.value || a.student.name.localeCompare(b.student.name, 'tr'));
    return { round, entries };
  });
}

export interface StudentDelta {
  student: Student;
  net: number;
  delta: number;
}

export interface GroupStats {
  count: number;
  avg: number | null;
  prevAvg: number | null;
  /** Hem bu hem önceki turda sonucu olanlar */
  deltas: StudentDelta[];
  improved: number;
  reached: number;
  withTarget: number;
  star: StudentDelta | null;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function groupStats(data: AppData, students: Student[], track: Track, rs: Round[], idx: number): GroupStats {
  const round = rs[idx];
  const prev = idx > 0 ? rs[idx - 1] : null;
  const nets: number[] = [];
  const prevNets: number[] = [];
  const deltas: StudentDelta[] = [];
  let reached = 0;
  let withTarget = 0;
  for (const st of students) {
    const r = round ? roundResult(data, st.id, round) : null;
    const p = prev ? roundResult(data, st.id, prev) : null;
    if (r) {
      nets.push(r.totalNet);
      const t = targetFor(st, track);
      if (t) {
        withTarget++;
        if (r.totalNet >= t) reached++;
      }
    }
    if (p) prevNets.push(p.totalNet);
    if (r && p) deltas.push({ student: st, net: r.totalNet, delta: r.totalNet - p.totalNet });
  }
  deltas.sort((a, b) => b.delta - a.delta);
  return {
    count: nets.length,
    avg: mean(nets),
    prevAvg: mean(prevNets),
    deltas,
    improved: deltas.filter((d) => d.delta > 0.001).length,
    reached,
    withTarget,
    star: deltas.length && deltas[0].delta > 0.001 ? deltas[0] : null,
  };
}

/** Tur tur grup ortalaması (yalnız sonucu olanlar). */
export function averageLine(data: AppData, students: Student[], rs: Round[]): { round: Round; avg: number }[] {
  return rs
    .map((round) => ({ round, avg: mean(students.map((s) => roundResult(data, s.id, round)).filter((r): r is ExamResult => !!r).map((r) => r.totalNet)) }))
    .filter((x): x is { round: Round; avg: number } => x.avg !== null);
}

export interface Heatmap {
  subjects: string[];
  rows: { student: Student; cells: (number | null)[] }[];
}

/** Öğrenci × ders başarı oranı (net/soru). AYT'de alanlar farklı dersler alır; olmayan hücre null. */
export function heatmap(data: AppData, students: Student[], round: Round): Heatmap {
  const subjects: string[] = [];
  const results = students.map((s) => ({ student: s, r: roundResult(data, s.id, round) }));
  for (const { r } of results) for (const sr of r?.subjects ?? []) if (!subjects.includes(sr.subject.name)) subjects.push(sr.subject.name);
  return {
    subjects,
    rows: results
      .filter((x) => x.r)
      .map(({ student, r }) => ({ student, cells: subjects.map((name) => r!.subjects.find((s) => s.subject.name === name)?.rate ?? null) })),
  };
}

export interface MatrixRow {
  result: ExamResult;
  cells: (SubjectResult | null)[];
  deltas: (number | null)[];
  totalDelta: number | null;
}

/** Öğrenci karşılaştırma tablosu: satır = sınav (eskiden yeniye), sütun = ders (ada göre birleşik). */
export function examMatrix(line: ExamResult[]): { subjects: { name: string; questions: number }[]; rows: MatrixRow[] } {
  const subjects: { name: string; questions: number }[] = [];
  for (const r of line.slice().reverse())
    for (const s of r.subjects) if (!subjects.some((x) => x.name === s.subject.name)) subjects.push({ name: s.subject.name, questions: s.subject.questions });
  const rows: MatrixRow[] = line.map((result, i) => {
    const cells = subjects.map((sub) => result.subjects.find((s) => s.subject.name === sub.name) ?? null);
    const prev = i > 0 ? line[i - 1] : null;
    const deltas = cells.map((c, k) => {
      const p = prev?.subjects.find((s) => s.subject.name === subjects[k].name);
      return c && p ? c.net - p.net : null;
    });
    return { result, cells, deltas, totalDelta: prev ? result.totalNet - prev.totalNet : null };
  });
  return { subjects, rows };
}
