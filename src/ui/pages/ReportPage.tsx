import type { AppData } from '../../domain/types';
import { ReportCard } from '../ReportCard';
import { Shapes } from '../Shapes';

interface Props {
  data: AppData;
  studentId: string | null;
  onStudentChange(id: string): void;
  onPresent(id: string): void;
}

export function ReportPage({ data, studentId, onStudentChange, onPresent }: Props) {
  const students = data.students.slice().sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const student = students.find((s) => s.id === studentId) ?? students[0];

  if (!student) {
    return (
      <div className="page">
        <div className="card empty">
          <h2>Henüz öğrenci yok</h2>
          <p>Karne görmek için önce “Öğrenciler” sekmesinden öğrenci ekleyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Öğrenci karnesi</h1>
          <p>Önizleme — tahtada tam ekran için “Sunumda aç”.</p>
        </div>
        <div className="spacer" />
        <select className="select" style={{ width: 'auto', minWidth: 240 }} value={student.id} onChange={(e) => onStudentChange(e.target.value)}>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.section}
            </option>
          ))}
        </select>
        <button className="btn orange" onClick={() => onPresent(student.id)}>
          ▶ Sunumda aç
        </button>
      </div>
      <div className="stage panel-stage">
        <Shapes />
        <ReportCard key={student.id} data={data} student={student} />
      </div>
    </div>
  );
}
