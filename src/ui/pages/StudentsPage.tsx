import { motion } from 'framer-motion';
import { useState } from 'react';
import { fmt, timeline } from '../../domain/calc';
import { FIELDS, fieldLabel } from '../../domain/exams';
import type { Field, Student } from '../../domain/types';
import { newId, useStore } from '../../store';
import { Modal, Seg, parseNum } from '../common';
import { avatarColor, groupBy, initials, last } from '../util';

const blankStudent = (): Student => ({ id: newId(), name: '', no: '', grade: 12, section: '12 ', field: 'SAY' });

export function StudentsPage({ onOpenReport }: { onOpenReport(id: string): void }) {
  const { data, saveStudent, deleteStudent } = useStore();
  const [edit, setEdit] = useState<Student | null>(null);
  const groups = groupBy(data.students.slice().sort((a, b) => a.name.localeCompare(b.name, 'tr')), (s) => s.section || 'Şubesiz');
  let n = 0;

  const remove = (s: Student) => {
    if (confirm(`${s.name} ve tüm sınav sonuçları silinsin mi?`)) deleteStudent(s.id);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Öğrenciler</h1>
          <p>{data.students.length} danışan öğrenci · şubeye göre gruplu</p>
        </div>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setEdit(blankStudent())}>
          ＋ Öğrenci ekle
        </button>
      </div>

      {groups.map(([section, list]) => (
        <div key={section}>
          <div className="section-title">{section}</div>
          <div className="grid-cards">
            {list.map((s) => {
              const lastTyt = last(timeline(data, s.id, 'TYT'));
              const lastAyt = last(timeline(data, s.id, 'AYT'));
              return (
                <motion.div
                  key={s.id}
                  className="card stu-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: n++ * 0.03 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="stu-top">
                    <div className="avatar" style={{ background: avatarColor(s.id) }}>
                      {initials(s.name)}
                    </div>
                    <div>
                      <div className="stu-name">{s.name}</div>
                      <div className="stu-meta">
                        {s.no && `No ${s.no} · `}
                        <span className="chip">{fieldLabel(s.field)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="stu-stats">
                    <div className="stu-stat">
                      <small>Son TYT</small>
                      <b>{lastTyt ? fmt(lastTyt.totalNet) : '—'}</b>
                    </div>
                    <div className="stu-stat">
                      <small>Son {s.field === 'DIL' ? 'YDT' : 'AYT'}</small>
                      <b>{lastAyt ? fmt(lastAyt.totalNet) : '—'}</b>
                    </div>
                  </div>
                  <div className="stu-actions">
                    <button className="btn small primary" onClick={() => onOpenReport(s.id)}>
                      📊 Karne
                    </button>
                    <button className="btn small" onClick={() => setEdit({ ...s })}>
                      Düzenle
                    </button>
                    <button className="btn small danger" onClick={() => remove(s)}>
                      Sil
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      <Modal open={!!edit} onClose={() => setEdit(null)}>
        {edit && <StudentForm initial={edit} isNew={!data.students.some((s) => s.id === edit.id)} onCancel={() => setEdit(null)} onSave={(s) => (saveStudent(s), setEdit(null))} />}
      </Modal>
    </div>
  );
}

function StudentForm({ initial, isNew, onCancel, onSave }: { initial: Student; isNew: boolean; onCancel(): void; onSave(s: Student): void }) {
  const [s, setS] = useState(initial);
  const [tyt, setTyt] = useState(initial.targetTyt?.toString() ?? '');
  const [ayt, setAyt] = useState(initial.targetAyt?.toString() ?? '');
  const valid = s.name.trim().length > 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave({ ...s, name: s.name.trim(), section: s.section.trim(), no: s.no.trim(), targetTyt: parseNum(tyt), targetAyt: parseNum(ayt) });
  };

  return (
    <form onSubmit={submit}>
      <h2>{isNew ? 'Yeni öğrenci' : 'Öğrenciyi düzenle'}</h2>
      <div className="form-grid">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Ad Soyad</label>
          <input className="input" autoFocus value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} placeholder="Örn. Ahmet Yılmaz" />
        </div>
        <div className="field">
          <label>Öğrenci No</label>
          <input className="input" value={s.no} onChange={(e) => setS({ ...s, no: e.target.value })} placeholder="Örn. 4528" />
        </div>
        <div className="field">
          <label>Sınıf / Şube</label>
          <input className="input" value={s.section} onChange={(e) => setS({ ...s, section: e.target.value })} placeholder="Örn. 12 A, 12 SAY-4" />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Alan</label>
          <Seg<Field> value={s.field} options={FIELDS.map((f) => ({ value: f.field, label: f.label }))} onChange={(field) => setS({ ...s, field })} />
        </div>
        <div className="field">
          <label>Hedef TYT net</label>
          <input className="input" inputMode="decimal" value={tyt} onChange={(e) => setTyt(e.target.value)} placeholder="Örn. 90" />
        </div>
        <div className="field">
          <label>Hedef {s.field === 'DIL' ? 'YDT' : 'AYT'} net</label>
          <input className="input" inputMode="decimal" value={ayt} onChange={(e) => setAyt(e.target.value)} placeholder="Örn. 50" />
        </div>
      </div>
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
