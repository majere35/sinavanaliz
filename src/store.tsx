import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readEmbeddedData } from './domain/io';
import { emptyData, type AppData, type Exam, type Score, type Student } from './domain/types';

const STORAGE_KEY = 'sinav-analiz-v1';
const BACKUP_KEY = 'sinav-analiz-degisiklik';
/** Bu kadar değişiklikten sonra yedek hatırlatması gösterilir. */
export const BACKUP_REMIND_AFTER = 5;

function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    /* bozuk veri → boş başla */
  }
  return emptyData();
}

function loadChanges(): number {
  try {
    return Number(localStorage.getItem(BACKUP_KEY)) || 0;
  } catch {
    return 0;
  }
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

interface Store {
  data: AppData;
  /** Sunum dosyasından açıldıysa true: düzenleme yok, kalıcı kayıt yok. */
  readOnly: boolean;
  changesSinceBackup: number;
  saveStudent(s: Student): void;
  deleteStudent(id: string): void;
  saveExam(e: Exam): void;
  deleteExam(id: string): void;
  setScore(examId: string, studentId: string, subjectId: string, score: Score | null): void;
  replaceAll(d: AppData): void;
  markBackedUp(): void;
}

const Ctx = createContext<Store | null>(null);

const embedded = readEmbeddedData();

export function StoreProvider({ children }: { children: ReactNode }) {
  const readOnly = embedded !== null;
  const [data, setData] = useState<AppData>(() => embedded ?? loadLocal());
  const [changesSinceBackup, setChanges] = useState(loadChanges);

  useEffect(() => {
    if (readOnly) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* depolama dolu/engelli */
    }
  }, [data, readOnly]);

  useEffect(() => {
    if (readOnly) return;
    try {
      localStorage.setItem(BACKUP_KEY, String(changesSinceBackup));
    } catch {
      /* yoksay */
    }
  }, [changesSinceBackup, readOnly]);

  const mutate = useCallback((fn: (d: AppData) => AppData) => {
    setData(fn);
    setChanges((c) => c + 1);
  }, []);

  const store = useMemo<Store>(
    () => ({
      data,
      readOnly,
      changesSinceBackup,
      saveStudent: (s) =>
        mutate((d) => ({
          ...d,
          students: d.students.some((x) => x.id === s.id) ? d.students.map((x) => (x.id === s.id ? s : x)) : [...d.students, s],
        })),
      deleteStudent: (id) =>
        mutate((d) => {
          const results = { ...d.results };
          for (const eid of Object.keys(results)) {
            if (results[eid][id]) {
              const { [id]: _, ...rest } = results[eid];
              results[eid] = rest;
            }
          }
          return { ...d, students: d.students.filter((x) => x.id !== id), results };
        }),
      saveExam: (e) =>
        mutate((d) => ({
          ...d,
          exams: d.exams.some((x) => x.id === e.id) ? d.exams.map((x) => (x.id === e.id ? e : x)) : [...d.exams, e],
        })),
      deleteExam: (id) =>
        mutate((d) => {
          const { [id]: _, ...results } = d.results;
          return { ...d, exams: d.exams.filter((x) => x.id !== id), results };
        }),
      setScore: (examId, studentId, subjectId, score) =>
        mutate((d) => {
          const exam = { ...(d.results[examId] ?? {}) };
          const row = { ...(exam[studentId] ?? {}) };
          if (score) row[subjectId] = score;
          else delete row[subjectId];
          if (Object.keys(row).length) exam[studentId] = row;
          else delete exam[studentId];
          return { ...d, results: { ...d.results, [examId]: exam } };
        }),
      replaceAll: (next) => {
        setData(next);
        setChanges(0);
      },
      markBackedUp: () => setChanges(0),
    }),
    [data, readOnly, changesSinceBackup, mutate],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider eksik');
  return s;
}
