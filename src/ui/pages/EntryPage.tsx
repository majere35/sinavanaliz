import { useMemo, useState } from 'react';
import { blank, byDate, fmt, net, scoreError } from '../../domain/calc';
import { examAppliesTo, examTypeLabel } from '../../domain/exams';
import type { Exam, Score, Student } from '../../domain/types';
import { useStore } from '../../store';
import { avatarColor, initials } from '../util';

/** Tam sayıya çevirir; boş/geçersiz → undefined. */
const toInt = (s: string) => {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
};

export function EntryPage({ examId, onExamChange }: { examId: string | null; onExamChange(id: string): void }) {
  const { data, setScore } = useStore();
  const exams = data.exams.slice().sort(byDate).reverse();
  // Varsayılan: en son TYT (tüm öğrenciler girer)
  const exam = exams.find((e) => e.id === examId) ?? exams.find((e) => e.type === 'TYT') ?? exams[0];
  const [showAll, setShowAll] = useState(false);

  const students = useMemo(() => {
    if (!exam) return [];
    return data.students
      .filter((s) => showAll || examAppliesTo(exam.type, s.field))
      .sort((a, b) => (a.section || '').localeCompare(b.section || '', 'tr', { numeric: true }) || a.name.localeCompare(b.name, 'tr'));
  }, [data.students, exam, showAll]);

  if (!exam) {
    return (
      <div className="page">
        <div className="card empty">
          <h2>Önce bir sınav ekleyin</h2>
          <p>“Sınavlar” sekmesinden TYT veya AYT denemesi ekledikten sonra sonuçları buradan girebilirsiniz.</p>
        </div>
      </div>
    );
  }

  const move = (r: number, c: number) => {
    const el = document.querySelector<HTMLInputElement>(`[data-r="${r}"][data-c="${c}"]`);
    el?.focus();
    el?.select();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Sonuç girişi</h1>
          <p>Doğru ve yanlış sayısını girin — boş ve net kendiliğinden hesaplanır. Enter: alt satır · Tab: sağdaki hücre</p>
        </div>
        <div className="spacer" />
        <select className="select" style={{ width: 'auto', minWidth: 260 }} value={exam.id} onChange={(e) => onExamChange(e.target.value)}>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} — {examTypeLabel(e.type)}
            </option>
          ))}
        </select>
        <label className="chip" style={{ cursor: 'pointer', padding: '8px 12px' }}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Tüm öğrenciler
        </label>
      </div>

      <div className="card entry-wrap">
        <table className="entry">
          <thead>
            <tr>
              <th className="sticky">Öğrenci</th>
              {exam.subjects.map((s) => (
                <th key={s.id} className="subj-head">
                  <div className="subj-title">
                    {s.name} <span>({s.questions})</span>
                  </div>
                  <div className="dyb dyb-labels">
                    <span style={{ color: '#13924e' }}>D</span>
                    <span style={{ color: 'var(--red)' }}>Y</span>
                    <span>B</span>
                  </div>
                </th>
              ))}
              <th className="subj-head">Toplam net</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st, r) => (
              <Row key={st.id} r={r} exam={exam} student={st} scores={data.results[exam.id]?.[st.id] ?? {}} onScore={setScore} move={move} />
            ))}
          </tbody>
        </table>
        {!students.length && <div className="empty">Bu sınav türüne giren öğrenci yok. “Tüm öğrenciler” kutusunu işaretleyebilirsiniz.</div>}
      </div>
    </div>
  );
}

interface RowProps {
  r: number;
  exam: Exam;
  student: Student;
  scores: Record<string, Score>;
  onScore(examId: string, studentId: string, subjectId: string, score: Score | null): void;
  move(r: number, c: number): void;
}

function Row({ r, exam, student, scores, onScore, move }: RowProps) {
  const has = Object.keys(scores).length > 0;
  const total = exam.subjects.reduce((a, s) => a + (scores[s.id] ? net(scores[s.id]) : 0), 0);

  const update = (subjectId: string, which: 'd' | 'y', raw: string) => {
    const cur = scores[subjectId];
    const v = toInt(raw);
    const other = which === 'd' ? cur?.y : cur?.d;
    // Hücre silindi ve diğeri de boş/0 → bu dersin kaydı tamamen kalkar
    if (v === undefined && !other) return onScore(exam.id, student.id, subjectId, null);
    onScore(exam.id, student.id, subjectId, {
      d: which === 'd' ? v ?? 0 : cur?.d ?? 0,
      y: which === 'y' ? v ?? 0 : cur?.y ?? 0,
    });
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, c: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(r + 1, c);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(r - 1, c);
    }
  };

  return (
    <tr>
      <td className="sticky">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="avatar" style={{ background: avatarColor(student.id), width: 32, height: 32, fontSize: 12 }}>
            {initials(student.name)}
          </span>
          <div>
            <div style={{ fontWeight: 800 }}>{student.name}</div>
            <div className="stu-meta" style={{ fontSize: 12 }}>
              {student.section}
            </div>
          </div>
        </div>
      </td>
      {exam.subjects.map((s, k) => {
        const sc = scores[s.id];
        const err = sc ? scoreError(s.questions, sc) : null;
        const b = sc ? blank(s.questions, sc) : null;
        return (
          <td key={s.id} className="subj-head">
            <div className="dyb">
              <input
                className={`cell d ${err ? 'err' : ''}`}
                inputMode="numeric"
                data-r={r}
                data-c={k * 2}
                value={sc ? String(sc.d) : ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => update(s.id, 'd', e.target.value)}
                onKeyDown={(e) => onKey(e, k * 2)}
                aria-label={`${student.name} ${s.name} doğru`}
              />
              <input
                className={`cell y ${err ? 'err' : ''}`}
                inputMode="numeric"
                data-r={r}
                data-c={k * 2 + 1}
                value={sc ? String(sc.y) : ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => update(s.id, 'y', e.target.value)}
                onKeyDown={(e) => onKey(e, k * 2 + 1)}
                aria-label={`${student.name} ${s.name} yanlış`}
              />
              <span className={`bcell ${err ? 'err' : ''}`} title={err === 'overflow' ? `D + Y, ${s.questions} soruyu aşıyor` : undefined}>
                {b === null ? '' : err ? '!' : b}
              </span>
            </div>
          </td>
        );
      })}
      <td className="netcell subj-head">{has ? fmt(total) : '—'}</td>
    </tr>
  );
}
