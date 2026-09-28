import confetti from 'canvas-confetti';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { raceFrames, type Metric } from '../domain/group';
import type { AppData, Track } from '../domain/types';
import { AnimatedNumber } from './charts/AnimatedNumber';
import { GroupChips, TrackPills, groupOptions } from './GroupFilter';
import { avatarColor, initials } from './util';

const STEP_MS = 2600;
const METRICS: { key: Metric; label: string; suffix: string }[] = [
  { key: 'net', label: '🏁 Net', suffix: '' },
  { key: 'target', label: '🎯 Hedefe yakınlık', suffix: '%' },
  { key: 'growth', label: '🚀 Gelişim', suffix: '' },
];
const MEDALS = ['🥇', '🥈', '🥉'];

export function RaceBoard({ data }: { data: AppData }) {
  const reduce = useReducedMotion();
  const [track, setTrack] = useState<Track>('TYT');
  const [metric, setMetric] = useState<Metric>('net');
  const [groupKey, setGroupKey] = useState('all');
  const options = useMemo(() => groupOptions(data.students), [data.students]);
  const group = options.find((o) => o.key === groupKey) ?? options[0];
  const students = useMemo(() => data.students.filter(group.filter), [data.students, group]);
  const frames = useMemo(() => raceFrames(data, students, track, metric), [data, students, track, metric]);

  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cur = frames[Math.min(frame, frames.length - 1)];
  const finished = !playing && frames.length > 0 && frame === frames.length - 1;
  const meta = METRICS.find((m) => m.key === metric)!;
  // Beraberlikte aynı sıra: 1, 1, 3 …
  const ranks = cur ? cur.entries.map((e) => cur.entries.findIndex((x) => Math.abs(x.value - e.value) < 0.001)) : [];
  const leaders = cur ? cur.entries.filter((_, i) => ranks[i] === 0) : [];

  // Ölçek tüm karelere göre sabit: büyüme gözle görülsün
  const all = frames.reduce<number[]>((acc, f) => acc.concat(f.entries.map((e) => e.value)), []);
  const hi = Math.max(1, ...all);
  const lo = Math.min(0, ...all);

  const reset = () => {
    setFrame(0);
    setPlaying(false);
  };

  useEffect(reset, [track, metric, groupKey]);

  useEffect(() => {
    if (!playing) return;
    if (frame >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setFrame((f) => f + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, frame, frames.length]);

  useEffect(() => {
    if (!finished || reduce || frames.length < 2) return;
    const colors = ['#f07a2b', '#f6bd2f', '#2f63d1', '#22c06a', '#ffffff'];
    const t = setTimeout(() => {
      confetti({ particleCount: 160, spread: 100, origin: { x: 0.5, y: 0.3 }, colors, disableForReducedMotion: true });
    }, 900);
    return () => clearTimeout(t);
  }, [finished, reduce, frames.length]);

  const play = () => {
    if (frame >= frames.length - 1) setFrame(0);
    setPlaying(true);
  };

  return (
    <div className="rc">
      <div className="rc-bar">
        <TrackPills id="race" track={track} onChange={setTrack} />
        <div className="pill-group">
          {METRICS.map((m) => (
            <button key={m.key} className={`pill ${metric === m.key ? 'on' : ''}`} onClick={() => setMetric(m.key)}>
              {metric === m.key && <motion.div layoutId="race-metric" className="pill-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <GroupChips options={options} value={group.key} onChange={setGroupKey} />
        </div>
      </div>

      {!cur ? (
        <div className="glass rc-empty">Bu grup için {track} sonucu yok.</div>
      ) : (
        <div className="glass race">
          <div className="race-head">
            <AnimatePresence mode="wait">
              <motion.div
                key={cur.round.date}
                className="race-round"
                initial={{ y: 40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <small>
                  Tur {frame + 1} / {frames.length} · {new Date(cur.round.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </small>
                {cur.round.label}
              </motion.div>
            </AnimatePresence>
            <div className="race-controls">
              {playing ? (
                <button className="btn on-dark" onClick={() => setPlaying(false)}>
                  ⏸ Duraklat
                </button>
              ) : (
                <button className="btn orange race-play" onClick={play}>
                  {frame >= frames.length - 1 && frames.length > 1 ? '↻ Yeniden başlat' : '▶ Yarışı başlat'}
                </button>
              )}
              <button className="btn on-dark" onClick={() => setFrame((f) => Math.min(frames.length - 1, f + 1))} disabled={frame >= frames.length - 1}>
                ⏭ Sonraki tur
              </button>
              <button className="btn on-dark" onClick={reset}>
                ⏮ Başa dön
              </button>
            </div>
          </div>

          <div className="race-progress">
            {frames.map((f, i) => (
              <button key={f.round.date} className={`race-dot ${i <= frame ? 'done' : ''} ${i === frame ? 'now' : ''}`} onClick={() => (setPlaying(false), setFrame(i))} title={f.round.label}>
                {i + 1}
              </button>
            ))}
          </div>

          <div className="race-bars">
            {cur.entries.map((e, rank) => {
              const w = ((e.value - lo) / (hi - lo)) * 100;
              const color = avatarColor(e.student.id);
              return (
                <motion.div key={e.student.id} layout transition={{ layout: { type: 'spring', stiffness: 170, damping: 24 } }} className={`race-row ${e.carried ? 'carried' : ''}`}>
                  <span className="race-rank">{finished && ranks[rank] < 3 ? MEDALS[ranks[rank]] : ranks[rank] + 1}</span>
                  <span className="race-name">
                    {ranks[rank] === 0 && (
                      <motion.span className="crown" initial={{ y: -12, rotate: -30, opacity: 0 }} animate={{ y: 0, rotate: -12, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
                        👑
                      </motion.span>
                    )}
                    {e.student.name}
                    {e.carried && <small> · girmedi</small>}
                  </span>
                  <div className="race-track">
                    <motion.div
                      className="race-bar"
                      style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, w)}%` }}
                      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="race-avatar" style={{ background: color }}>
                        {initials(e.student.name)}
                      </span>
                    </motion.div>
                    <span className="race-val">
                      {metric === 'growth' && e.value > 0 ? '+' : ''}
                      <AnimatedNumber value={e.value} suffix={meta.suffix} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {finished && frames.length > 1 && leaders.length > 0 && (
              <motion.div className="race-winner" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6, type: 'spring', stiffness: 220, damping: 14 }}>
                🏆 {metric === 'growth' ? 'En çok gelişen' : metric === 'target' ? 'Hedefine en yakın' : leaders.length > 1 ? 'Ortak birinciler' : 'Birinci'}:{' '}
                <b>{leaders.map((e) => e.student.name).join(' & ')}</b>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
