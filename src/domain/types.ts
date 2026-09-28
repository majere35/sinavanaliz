export type ExamType = 'TYT' | 'AYT_SAY' | 'AYT_EA' | 'AYT_SOZ' | 'YDT';
export type Field = 'SAY' | 'EA' | 'SOZ' | 'DIL';
/** Karnede iki ayrı yolculuk çizilir: TYT ve alan sınavı (AYT/YDT). */
export type Track = 'TYT' | 'AYT';

export interface Subject {
  id: string;
  name: string;
  questions: number;
}

export interface Exam {
  id: string;
  name: string;
  /** ISO tarih (YYYY-MM-DD) */
  date: string;
  type: ExamType;
  subjects: Subject[];
}

export interface Student {
  id: string;
  name: string;
  no: string;
  grade: number;
  section: string;
  field: Field;
  targetTyt?: number;
  targetAyt?: number;
}

export interface Score {
  d: number;
  y: number;
}

/** results[examId][studentId][subjectId] */
export type Results = Record<string, Record<string, Record<string, Score>>>;

export interface AppData {
  version: 1;
  students: Student[];
  exams: Exam[];
  results: Results;
}

export const emptyData = (): AppData => ({ version: 1, students: [], exams: [], results: {} });
