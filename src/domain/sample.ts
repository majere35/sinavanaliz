import { examAppliesTo, templateSubjects } from './exams';
import type { AppData, Exam, ExamType, Field, Student } from './types';

// Deterministik sözde-rastgele: örnek veri her yüklemede aynı olsun.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const STUDENTS: [string, string, string, Field, number, number][] = [
  ['Elif Yıldız', '4528', '12 A', 'SAY', 95, 55],
  ['Mert Kaya', '4929', '12 A', 'SAY', 85, 45],
  ['Zeynep Arslan', '7457', '12 B', 'EA', 90, 50],
  ['Emir Demir', '9415', '12 B', 'EA', 80, 40],
  ['Defne Aydın', '10813', '12 SAY-4', 'SAY', 100, 65],
  ['Kerem Şahin', '11559', '12 SAY-4', 'SAY', 75, 35],
  ['Ayşe Çelik', '8097', '12 TM-1', 'EA', 85, 48],
  ['Yusuf Koç', '6120', '12 TM-1', 'EA', 70, 35],
  ['Ece Kurt', '5311', '12 C', 'SOZ', 80, 45],
  ['Baran Öztürk', '7702', '12 C', 'DIL', 75, 60],
];

export function sampleData(): AppData {
  const rand = rng(42);
  const students: Student[] = STUDENTS.map(([name, no, section, field, targetTyt, targetAyt], i) => ({
    id: `ornek-s${i + 1}`,
    name,
    no,
    grade: 12,
    section,
    field,
    targetTyt,
    targetAyt,
  }));

  const dates = ['2026-09-13', '2026-09-27', '2026-10-11'];
  const types: ExamType[] = ['TYT', 'AYT_SAY', 'AYT_EA', 'AYT_SOZ', 'YDT'];
  const exams: Exam[] = [];
  dates.forEach((date, k) => {
    for (const type of types) {
      const suffix = type === 'TYT' ? 'TYT' : type.replace('AYT_', 'AYT-').replace('SOZ', 'SÖZ');
      exams.push({ id: `ornek-e${k + 1}-${type}`, name: `12 YKS-0${k + 1} ${suffix}`, date, type, subjects: templateSubjects(type) });
    }
  });

  const results: AppData['results'] = {};
  students.forEach((st, si) => {
    const skill = 0.35 + (si % 5) * 0.1 + rand() * 0.1; // öğrencinin genel seviyesi
    const trend = rand() * 0.16 - 0.04; // sınavdan sınava eğilim (çoğunlukla artış)
    exams.forEach((exam) => {
      if (!examAppliesTo(exam.type, st.field)) return;
      const k = dates.indexOf(exam.date);
      const row: Record<string, { d: number; y: number }> = {};
      exam.subjects.forEach((sub) => {
        const level = Math.min(0.95, Math.max(0.05, skill + trend * k + (rand() - 0.5) * 0.25));
        const attempted = Math.round(sub.questions * Math.min(1, level + 0.2 + rand() * 0.1));
        const d = Math.min(attempted, Math.round(sub.questions * level));
        row[sub.id] = { d, y: attempted - d };
      });
      (results[exam.id] ??= {})[st.id] = row;
    });
  });

  return { version: 1, students, exams, results };
}
