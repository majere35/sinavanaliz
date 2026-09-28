import { motion } from 'framer-motion';
import { useState } from 'react';
import { byDate } from '../../domain/calc';
import { EXAM_TYPES, examAppliesTo, examTypeLabel, templateSubjects } from '../../domain/exams';
import { todayStamp } from '../../domain/io';
import type { Exam, ExamType } from '../../domain/types';
import { newId, useStore } from '../../store';
import { Modal, Seg } from '../common';
import { TYPE_COLORS } from '../util';

const blankExam = (): Exam => ({ id: newId(), name: '', date: todayStamp(), type: 'TYT', subjects: templateSubjects('TYT') });

export function ExamsPage({ onEnter }: { onEnter(examId: string): void }) {
  const { data, saveExam, deleteExam } = useStore();
  const [edit, setEdit] = useState<Exam | null>(null);
  const exams = data.exams.slice().sort(byDate).reverse();

  const remove = (e: Exam) => {
    if (confirm(`"${e.name}" sınavı ve girilen tüm sonuçları silinsin mi?`)) deleteExam(e.id);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Sınavlar</h1>
          <p>{data.exams.length} sınav · yeni deneme geldikçe ekleyin</p>
        </div>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setEdit(blankExam())}>
          ＋ Yeni sınav
        </button>
      </div>

      <div className="grid-cards">
        {exams.map((e, i) => {
          const eligible = data.students.filter((s) => examAppliesTo(e.type, s.field));
          const entered = eligible.filter((s) => Object.keys(data.results[e.id]?.[s.id] ?? {}).length > 0).length;
          const pct = eligible.length ? (entered / eligible.length) * 100 : 0;
          return (
            <motion.div key={e.id} className="card exam-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }}>
              <span className="type-badge" style={{ background: TYPE_COLORS[e.type] }}>
                {examTypeLabel(e.type)}
              </span>
              <div className="exam-name">{e.name}</div>
              <div className="stu-meta">
                {new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} · {e.subjects.length} ders ·{' '}
                {e.subjects.reduce((a, s) => a + s.questions, 0)} soru
              </div>
              <div className="stu-meta">
                Sonuç girilen: <b>{entered}</b> / {eligible.length} öğrenci
              </div>
              <div className="progress">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + i * 0.03, duration: 0.6 }} />
              </div>
              <div className="stu-actions">
                <button className="btn small primary" onClick={() => onEnter(e.id)}>
                  ✏️ Sonuç gir
                </button>
                <button className="btn small" onClick={() => setEdit(JSON.parse(JSON.stringify(e)) as Exam)}>
                  Düzenle
                </button>
                <button className="btn small danger" onClick={() => remove(e)}>
                  Sil
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)}>
        {edit && (
          <ExamForm
            initial={edit}
            isNew={!data.exams.some((x) => x.id === edit.id)}
            onCancel={() => setEdit(null)}
            onSave={(e) => {
              saveExam(e);
              setEdit(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function ExamForm({ initial, isNew, onCancel, onSave }: { initial: Exam; isNew: boolean; onCancel(): void; onSave(e: Exam): void }) {
  const [e, setE] = useState(initial);
  const valid = e.name.trim().length > 0 && e.subjects.length > 0 && e.subjects.every((s) => s.name.trim() && s.questions > 0);

  const setType = (type: ExamType) => {
    // Yeni sınavda tür değişince ders listesi şablondan gelir; mevcut sınavda sonuçlar bozulmasın diye yalnız onayla.
    if (!isNew && !confirm('Sınav türü değişirse ders listesi şablona döner. Devam edilsin mi?')) return;
    setE({ ...e, type, subjects: templateSubjects(type) });
  };

  const updateSubject = (i: number, patch: Partial<Exam['subjects'][number]>) =>
    setE({ ...e, subjects: e.subjects.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (valid) onSave({ ...e, name: e.name.trim() });
      }}
    >
      <h2>{isNew ? 'Yeni sınav' : 'Sınavı düzenle'}</h2>
      <div className="form-grid">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Tür</label>
          <Seg<ExamType> value={e.type} options={EXAM_TYPES.map((t) => ({ value: t.type, label: t.label }))} onChange={setType} />
        </div>
        <div className="field">
          <label>Sınav adı</label>
          <input className="input" autoFocus value={e.name} onChange={(ev) => setE({ ...e, name: ev.target.value })} placeholder="Örn. 12 YKS-04 TYT" />
        </div>
        <div className="field">
          <label>Tarih</label>
          <input className="input" type="date" value={e.date} onChange={(ev) => setE({ ...e, date: ev.target.value })} />
        </div>
      </div>

      <div className="section-title">Dersler ve soru sayıları</div>
      <table className="subj-table">
        <tbody>
          {e.subjects.map((s, i) => (
            <tr key={s.id}>
              <td>
                <input className="input" value={s.name} onChange={(ev) => updateSubject(i, { name: ev.target.value })} />
              </td>
              <td style={{ width: 110 }}>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={s.questions}
                  onChange={(ev) => updateSubject(i, { questions: Math.max(0, Math.floor(Number(ev.target.value) || 0)) })}
                />
              </td>
              <td style={{ width: 44 }}>
                <button type="button" className="btn small ghost danger" onClick={() => setE({ ...e, subjects: e.subjects.filter((_, k) => k !== i) })} title="Dersi çıkar">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn small" style={{ marginTop: 8 }} onClick={() => setE({ ...e, subjects: [...e.subjects, { id: newId(), name: '', questions: 10 }] })}>
        ＋ Ders ekle
      </button>

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Vazgeç
        </button>
        <button type="submit" className="btn primary" disabled={!valid}>
          Kaydet
        </button>
      </div>
    </form>
  );
}
