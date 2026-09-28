import { describe, expect, it } from 'vitest';
import { blank, compareSubjects, examResult, fmt, fmtSigned, isRecord, mostImproved, net, scoreError, timeline } from './calc';
import { templateSubjects } from './exams';
import type { AppData } from './types';

const data: AppData = {
  version: 1,
  students: [{ id: 's1', name: 'Taha', no: '8097', grade: 12, section: '12 SAY-4', field: 'SAY', targetAyt: 40 }],
  exams: [
    { id: 'e2', name: 'AYT-02', date: '2026-10-20', type: 'AYT_SAY', subjects: templateSubjects('AYT_SAY') },
    { id: 'e1', name: 'AYT-01', date: '2026-10-01', type: 'AYT_SAY', subjects: templateSubjects('AYT_SAY') },
    { id: 't1', name: 'TYT-01', date: '2026-10-05', type: 'TYT', subjects: templateSubjects('TYT') },
  ],
  results: {
    e1: { s1: { matematik: { d: 9, y: 3 }, fizik: { d: 9, y: 4 } } },
    e2: { s1: { matematik: { d: 14, y: 2 }, fizik: { d: 8, y: 4 } } },
  },
};

describe('net & boş', () => {
  it('4 yanlış 1 doğruyu götürür', () => {
    expect(net({ d: 9, y: 3 })).toBe(8.25);
    expect(net({ d: 0, y: 1 })).toBe(-0.25);
  });
  it('boş = soru - D - Y', () => expect(blank(25, { d: 9, y: 3 })).toBe(13));
  it('taşma ve negatif hatası', () => {
    expect(scoreError(10, { d: 8, y: 3 })).toBe('overflow');
    expect(scoreError(10, { d: -1, y: 0 })).toBe('negative');
    expect(scoreError(10, { d: 7, y: 3 })).toBeNull();
  });
});

describe('biçim', () => {
  it('Türkçe ondalık', () => {
    expect(fmt(8.25)).toBe('8,25');
    expect(fmt(12)).toBe('12');
    expect(fmtSigned(4.5)).toBe('+4,5');
    expect(fmtSigned(-0.75)).toBe('−0,75');
  });
});

describe('sınav sonucu ve kıyas', () => {
  it('girilmemiş ders 0 sayılır, toplam net doğru', () => {
    const r = examResult(data, data.exams[1], 's1')!;
    expect(r.totalNet).toBe(8.25 + 8);
    expect(r.subjects.find((s) => s.subject.id === 'kimya')!.blank).toBe(13);
  });
  it('sonucu olmayan sınav null', () => expect(examResult(data, data.exams[2], 's1')).toBeNull());
  it('timeline tarihe göre sıralı ve yola göre filtreli', () => {
    const line = timeline(data, 's1', 'AYT');
    expect(line.map((r) => r.exam.id)).toEqual(['e1', 'e2']);
    expect(timeline(data, 's1', 'TYT')).toEqual([]);
  });
  it('ders farkları ve en çok gelişen', () => {
    const line = timeline(data, 's1', 'AYT');
    const d = compareSubjects(line[1], line[0]);
    expect(d.find((x) => x.current.subject.id === 'matematik')!.delta).toBe(13.5 - 8.25);
    expect(d.find((x) => x.current.subject.id === 'fizik')!.delta).toBe(-1);
    expect(mostImproved(d)!.current.subject.id).toBe('matematik');
    expect(isRecord(line, 1)).toBe(true);
    expect(isRecord(line, 0)).toBe(false);
  });
});
