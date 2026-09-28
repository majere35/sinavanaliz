import { motion } from 'framer-motion';
import { FIELDS } from '../domain/exams';
import type { Student, Track } from '../domain/types';

export interface GroupOption {
  key: string;
  label: string;
  filter(s: Student): boolean;
}

/** "Tümü" + mevcut şubeler + mevcut alanlar. */
export function groupOptions(students: Student[]): GroupOption[] {
  const sections = [...new Set(students.map((s) => s.section).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));
  const fields = FIELDS.filter((f) => students.some((s) => s.field === f.field));
  return [
    { key: 'all', label: 'Tüm grup', filter: () => true },
    ...sections.map((sec) => ({ key: `s:${sec}`, label: sec, filter: (s: Student) => s.section === sec })),
    ...(fields.length > 1 ? fields.map((f) => ({ key: `f:${f.field}`, label: f.label, filter: (s: Student) => s.field === f.field })) : []),
  ];
}

export function TrackPills({ track, onChange, id }: { track: Track; onChange(t: Track): void; id: string }) {
  return (
    <div className="pill-group">
      {(['TYT', 'AYT'] as Track[]).map((t) => (
        <button key={t} className={`pill ${track === t ? 'on' : ''}`} onClick={() => onChange(t)}>
          {track === t && <motion.div layoutId={`track-${id}`} className="pill-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span>{t}</span>
        </button>
      ))}
    </div>
  );
}

export function GroupChips({ options, value, onChange }: { options: GroupOption[]; value: string; onChange(k: string): void }) {
  if (options.length <= 1) return null;
  return (
    <div className="exam-chips">
      {options.map((o) => (
        <button key={o.key} className={`exam-chip group ${o.key === value ? 'on' : ''}`} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
