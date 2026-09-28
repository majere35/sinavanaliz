import { describe, expect, it } from 'vitest';
import { timeline } from './calc';
import { templateSubjects } from './exams';
import { averageLine, examMatrix, groupStats, heatmap, raceFrames, rounds } from './group';
import type { AppData } from './types';

const data: AppData = {
  version: 1,
  students: [
    { id: 'a', name: 'Ali', no: '1', grade: 12, section: '12 A', field: 'SAY', targetAyt: 40 },
    { id: 'b', name: 'Banu', no: '2', grade: 12, section: '12 A', field: 'EA', targetAyt: 20 },
  ],
  exams: [
    { id: 's1', name: 'D1 SAY', date: '2026-09-01', type: 'AYT_SAY', subjects: templateSubjects('AYT_SAY') },
    { id: 'e1', name: 'D1 EA', date: '2026-09-01', type: 'AYT_EA', subjects: templateSubjects('AYT_EA') },
    { id: 's2', name: 'D2 SAY', date: '2026-09-15', type: 'AYT_SAY', subjects: templateSubjects('AYT_SAY') },
    { id: 'e2', name: 'D2 EA', date: '2026-09-15', type: 'AYT_EA', subjects: templateSubjects('AYT_EA') },
  ],
  results: {
    s1: { a: { matematik: { d: 10, y: 4 } } }, // 9
    e1: { b: { matematik: { d: 6, y: 0 } } }, // 6
    s2: { a: { matematik: { d: 20, y: 0 } } }, // 20
    e2: {}, // Banu 2. denemeye girmedi
  },
};

describe('turlar', () => {
  it('aynı tarihli AYT sınavları tek tur', () => {
    const rs = rounds(data, 'AYT');
    expect(rs.map((r) => r.exams.length)).toEqual([2, 2]);
    expect(rs[0].label).toBe('1. Deneme');
  });
});

describe('yarış', () => {
  it('net: sıralı, eksik tura önceki değer taşınır', () => {
    const f = raceFrames(data, data.students, 'AYT', 'net');
    expect(f[0].entries.map((e) => [e.student.id, e.value])).toEqual([
      ['a', 9],
      ['b', 6],
    ]);
    expect(f[1].entries.find((e) => e.student.id === 'b')).toMatchObject({ value: 6, carried: true });
  });
  it('hedef yüzdesi ve gelişim', () => {
    const t = raceFrames(data, data.students, 'AYT', 'target');
    expect(t[1].entries[0]).toMatchObject({ value: 50 }); // 20/40
    const g = raceFrames(data, data.students, 'AYT', 'growth');
    expect(g[1].entries[0]).toMatchObject({ value: 11 });
  });
});

describe('grup istatistiği', () => {
  it('ortalama, fark ve yıldız', () => {
    const rs = rounds(data, 'AYT');
    const s = groupStats(data, data.students, 'AYT', rs, 1);
    expect(s.count).toBe(1);
    expect(s.avg).toBe(20);
    expect(s.prevAvg).toBe(7.5);
    expect(s.deltas).toHaveLength(1);
    expect(s.star?.student.id).toBe('a');
    expect(averageLine(data, data.students, rs).map((x) => x.avg)).toEqual([7.5, 20]);
  });
  it('ısı haritası: alanlar farklı dersler → null hücre', () => {
    const h = heatmap(data, data.students, rounds(data, 'AYT')[0]);
    expect(h.subjects).toContain('Fizik');
    expect(h.subjects).toContain('Tarih-1');
    const banu = h.rows.find((r) => r.student.id === 'b')!;
    expect(banu.cells[h.subjects.indexOf('Fizik')]).toBeNull();
  });
});

describe('karşılaştırma tablosu', () => {
  it('satır sınav, ders farkı önceki sınava göre', () => {
    const m = examMatrix(timeline(data, 'a', 'AYT'));
    expect(m.rows).toHaveLength(2);
    const k = m.subjects.findIndex((s) => s.name === 'Matematik');
    expect(m.rows[0].deltas[k]).toBeNull();
    expect(m.rows[1].deltas[k]).toBe(11);
    expect(m.rows[1].totalDelta).toBe(11);
  });
});
