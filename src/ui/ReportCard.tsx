import confetti from 'canvas-confetti';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { compareSubjects, fmt, isRecord, mostImproved, targetFor, timeline } from '../domain/calc';
import { fieldLabel } from '../domain/exams';
import type { AppData, Student, Track } from '../domain/types';
import { CountUp } from './charts/CountUp';
import { Delta } from './charts/Delta';
import { JourneyChart } from './charts/JourneyChart';
import { Radar } from './charts/Radar';
import { SubjectBars } from './charts/SubjectBars';
import { TargetRing } from './charts/TargetRing';
import { avatarColor, initials } from './util';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
});

function celebrate() {
  const colors = ['#f07a2b', '#f6bd2f', '#2f63d1', '#22c06a', '#ffffff'];
  confetti({ particleCount: 120, spread: 80, origin: { x: 0.25, y: 0.35 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { x: 0.75, y: 0.35 }, colors, disableForReducedMotion: true }), 250);
}

export function ReportCard({ data, student }: { data: AppData; student: Student }) {
  const reduce = useReducedMotion();
  const tyt = useMemo(() => timeline(data, student.id, 'TYT'), [data, student.id]);
  const ayt = useMemo(() => timeline(data, student.id, 'AYT'), [data, student.id]);

  const defaultTrack: Track = !ayt.length ? 'TYT' : !tyt.length ? 'AYT' : ayt[ayt.length - 1].exam.date > tyt[tyt.length - 1].exam.date ? 'AYT' : 'TYT';
  const [track, setTrack] = useState<Track>(defaultTrack);
  const line = track === 'TYT' ? tyt : ayt;
  const [sel, setSel] = useState(line.length - 1);
  const idx = Math.min(Math.max(sel, 0), line.length - 1);

  const switchTrack = (t: Track) => {
    setTrack(t);
    setSel((t === 'TYT' ? tyt : ayt).length - 1);
  };

  const current = line[idx];
  const previous = idx > 0 ? line[idx - 1] : null;
  const deltas = useMemo(() => (current ? compareSubjects(current, previous) : []), [current, previous]);
  const star = mostImproved(deltas);
  const target = targetFor(student, track);
  const record = isRecord(line, idx);
  const reached = !!current && !!target && current.totalNet >= target;

  useEffect(() => {
    if (reduce || !(record || reached)) return;
    const t = setTimeout(celebrate, 1700);
    return () => clearTimeout(t);
  }, [record, reached, reduce, track, idx, student.id]);

  const aytLabel = student.field === 'DIL' ? 'YDT' : 'AYT';
  const totals = current
    ? current.subjects.reduce((a, s) => ({ d: a.d + s.score.d, y: a.y + s.score.y, b: a.b + Math.max(0, s.blank) }), { d: 0, y: 0, b: 0 })
    : null;

  return (
    <div className="rc">
      <motion.div className="rc-bar" {...rise(0)}>
        <div className="pill-group">
          {(['TYT', 'AYT'] as Track[]).map((t) => (
            <button key={t} className={`pill ${track === t ? 'on' : ''}`} onClick={() => switchTrack(t)}>
              {track === t && <motion.div layoutId={`pill-${student.id}`} className="pill-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span>{t === 'TYT' ? 'TYT' : aytLabel}</span>
            </button>
          ))}
        </div>
        <div className="exam-chips">
          {line.map((r, i) => (
            <button key={r.exam.id} className={`exam-chip ${i === idx ? 'on' : ''}`} onClick={() => setSel(i)}>
              {r.exam.name}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div className="glass hero" {...rise(0.08)}>
        <motion.div
          className="hero-avatar"
          style={{ background: avatarColor(student.id) }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 16 }}
        >
          {initials(student.name)}
        </motion.div>
        <div>
          <div className="hero-name">{student.name}</div>
          <div className="hero-meta">
            <span>{student.section}</span>
            <span className="dot" />
            <span>{fieldLabel(student.field)}</span>
            {student.no && (
              <>
                <span className="dot" />
                <span>No {student.no}</span>
              </>
            )}
          </div>
          <div className="badges">
            {record && (
              <motion.span className="badge gold" initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} transition={{ delay: 1.5, duration: 0.5 }}>
                🏆 Yeni rekor!
              </motion.span>
            )}
            {reached && (
              <motion.span className="badge green" initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} transition={{ delay: 1.7, duration: 0.5 }}>
                🎯 Hedefe ulaştı!
              </motion.span>
            )}
          </div>
        </div>
        {current && (
          <div className="hero-net">
            <small>{current.exam.name} · Toplam net</small>
            <div className="big">
              <CountUp value={current.totalNet} delay={0.3} duration={1.4} />
            </div>
            <div className="of">{current.totalQuestions} soru üzerinden</div>
            <div style={{ marginTop: '0.5em' }}>{previous ? <Delta value={current.totalNet - previous.totalNet} delay={1.3} /> : <span className="delta flat">İlk sınav</span>}</div>
          </div>
        )}
        {current && target ? <TargetRing value={current.totalNet} target={target} /> : <div />}
      </motion.div>

      {!current ? (
        <motion.div className="glass rc-empty" {...rise(0.2)}>
          Bu öğrenci için henüz {track === 'TYT' ? 'TYT' : aytLabel} sonucu girilmemiş.
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={`${track}-${idx}`} className="rc-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="rc-col">
              <motion.div className="glass panel-pad journey" {...rise(0.2)}>
                <div className="glass-title">🚀 Net yolculuğu</div>
                <JourneyChart line={line} target={target} selected={idx} onSelect={setSel} />
              </motion.div>
              <div className="side-cards">
                <motion.div className="glass panel-pad radar" {...rise(0.35)}>
                  <div className="glass-title">🧭 Güçlü / zayıf dersler</div>
                  <Radar rows={deltas} delay={0.9} />
                </motion.div>
                <motion.div className="glass star-card" {...rise(0.45)}>
                  <div className="glass-title" style={{ marginBottom: 0 }}>
                    ⭐ En çok gelişen
                  </div>
                  {star ? (
                    <>
                      <motion.div
                        className="big"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.6, type: 'spring', stiffness: 300, damping: 12 }}
                      >
                        {star.current.subject.name}
                      </motion.div>
                      <div>
                        <Delta value={star.delta} delay={1.8} />
                      </div>
                    </>
                  ) : (
                    <p>{previous ? 'Bu sınavda artış olan ders yok — bir sonrakinde!' : 'Karşılaştırma için bir sınav daha gerekli.'}</p>
                  )}
                  {totals && (
                    <div style={{ marginTop: 'auto' }}>
                      <div className="mini-stat">
                        <span>✅ Doğru</span>
                        <b style={{ color: '#5ff0a0' }}>{totals.d}</b>
                      </div>
                      <div className="mini-stat">
                        <span>❌ Yanlış</span>
                        <b style={{ color: '#ff8a96' }}>{totals.y}</b>
                      </div>
                      <div className="mini-stat">
                        <span>⚪ Boş</span>
                        <b>{totals.b}</b>
                      </div>
                      <div className="mini-stat">
                        <span>Başarı</span>
                        <b>%{fmt((Math.max(0, current.totalNet) / current.totalQuestions) * 100, 0)}</b>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
            <motion.div className="glass panel-pad" {...rise(0.25)}>
              <div className="glass-title">
                📚 Ders ders sonuçlar
                <span className="legend">
                  <span>
                    <i style={{ background: '#22c06a' }} />
                    Doğru
                  </span>
                  <span>
                    <i style={{ background: '#e5394a' }} />
                    Yanlış
                  </span>
                  <span>
                    <i style={{ background: 'rgba(170,179,204,0.6)' }} />
                    Boş
                  </span>
                </span>
              </div>
              <SubjectBars rows={deltas} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
