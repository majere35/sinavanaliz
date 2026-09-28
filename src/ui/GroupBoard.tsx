import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { fmt, fmtSigned, type ExamResult } from '../domain/calc';
import { averageLine, groupStats, heatmap, rounds } from '../domain/group';
import type { AppData, Track } from '../domain/types';
import { CountUp } from './charts/CountUp';
import { Delta } from './charts/Delta';
import { JourneyChart } from './charts/JourneyChart';
import { GroupChips, TrackPills, groupOptions } from './GroupFilter';
import { avatarColor, initials } from './util';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
});

const FIELD_ORDER = ['SAY', 'EA', 'SOZ', 'DIL'];

/** Başarı oranı → kırmızı (0) · sarı · yeşil (1) */
const heat = (r: number) => `hsl(${Math.round(Math.max(0, Math.min(1, r)) * 135)}, 72%, ${42 + r * 4}%)`;

function shortSubject(n: string) {
  return n.replace('Türk Dili ve Edebiyatı', 'Edebiyat').replace('Din Kültürü', 'Din K.').replace('Felsefe Grubu', 'Felsefe').replace('Yabancı Dil', 'Y. Dil');
}

export function GroupBoard({ data }: { data: AppData }) {
  const [track, setTrack] = useState<Track>('TYT');
  const [groupKey, setGroupKey] = useState('all');
  const options = useMemo(() => groupOptions(data.students), [data.students]);
  const group = options.find((o) => o.key === groupKey) ?? options[0];
  const students = useMemo(() => data.students.filter(group.filter), [data.students, group]);
  const rs = useMemo(() => rounds(data, track), [data, track]);
  const [sel, setSel] = useState<number | null>(null);
  const idx = sel === null || sel >= rs.length ? rs.length - 1 : sel;

  const stats = useMemo(() => (rs.length ? groupStats(data, students, track, rs, idx) : null), [data, students, track, rs, idx]);
  const avgLine = useMemo(() => averageLine(data, students, rs), [data, students, rs]);
  // AYT'de alanlar farklı derslere girer: alana göre sıralayınca sütunlar blok halinde toplanır
  const hm = useMemo(() => {
    if (!rs[idx]) return null;
    const sorted = students.slice().sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field) || a.name.localeCompare(b.name, 'tr'));
    return heatmap(data, sorted, rs[idx]);
  }, [data, students, rs, idx]);

  // Ortalama çizgisini JourneyChart'ın beklediği biçime çevir
  const pseudo: ExamResult[] = avgLine.map(({ round, avg }) => ({
    exam: { id: round.date, name: round.label, date: round.date, type: 'TYT', subjects: [] },
    subjects: [],
    totalNet: avg,
    totalQuestions: 0,
  }));
  const pseudoIdx = Math.max(0, avgLine.findIndex((x) => x.round.index === idx));
  const maxAbs = Math.max(1, ...(stats?.deltas.map((d) => Math.abs(d.delta)) ?? [1]));
  const key = `${track}-${groupKey}-${idx}`;

  return (
    <div className="rc">
      <motion.div className="rc-bar" {...rise(0)}>
        <TrackPills
          id="group"
          track={track}
          onChange={(t) => {
            setTrack(t);
            setSel(null);
          }}
        />
        <div className="exam-chips">
          {rs.map((r) => (
            <button key={r.date} className={`exam-chip ${r.index === idx ? 'on' : ''}`} onClick={() => setSel(r.index)}>
              {r.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <GroupChips options={options} value={group.key} onChange={setGroupKey} />
        </div>
      </motion.div>

      {!stats || !stats.count ? (
        <motion.div className="glass rc-empty" {...rise(0.1)}>
          Bu grup için {track} sonucu yok.
        </motion.div>
      ) : (
        <motion.div key={key} className="rc" style={{ padding: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="kpis">
            <motion.div className="glass kpi" {...rise(0.05)}>
              <small>Grup ortalaması</small>
              <b>
                <CountUp value={stats.avg ?? 0} delay={0.2} duration={1.2} />
              </b>
              {stats.prevAvg !== null && idx > 0 ? <Delta value={(stats.avg ?? 0) - stats.prevAvg} delay={1.1} /> : <span className="delta flat">{stats.count} öğrenci</span>}
            </motion.div>
            <motion.div className="glass kpi" {...rise(0.12)}>
              <small>Netini artıran</small>
              <b>
                <CountUp value={stats.improved} delay={0.3} duration={0.8} />
                <span className="kpi-of"> / {stats.deltas.length}</span>
              </b>
              <span className="kpi-sub">{stats.deltas.length ? 'önceki denemeye göre' : 'karşılaştırma için bir deneme daha gerekli'}</span>
            </motion.div>
            <motion.div className="glass kpi" {...rise(0.19)}>
              <small>Hedefine ulaşan</small>
              <b>
                <CountUp value={stats.reached} delay={0.4} duration={0.8} />
                <span className="kpi-of"> / {stats.withTarget}</span>
              </b>
              <span className="kpi-sub">hedefi girilmiş öğrenci</span>
            </motion.div>
            <motion.div className="glass kpi star" {...rise(0.26)}>
              <small>⭐ Grubun yıldızı</small>
              {stats.star ? (
                <>
                  <motion.b className="kpi-name" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, type: 'spring', stiffness: 300, damping: 12 }}>
                    {stats.star.student.name}
                  </motion.b>
                  <Delta value={stats.star.delta} delay={1.4} />
                </>
              ) : (
                <span className="kpi-sub">—</span>
              )}
            </motion.div>
          </div>

          <div className="rc-grid group-grid">
            <div className="rc-col">
              <motion.div className="glass panel-pad journey" {...rise(0.2)}>
                <div className="glass-title">🚀 Grup ortalaması yolculuğu</div>
                <JourneyChart line={pseudo} selected={pseudoIdx} onSelect={(i) => setSel(avgLine[i].round.index)} />
              </motion.div>
              <motion.div className="glass panel-pad" {...rise(0.3)}>
                <div className="glass-title">📈 Gelişim sıralaması · önceki denemeye göre</div>
                {stats.deltas.length ? (
                  <div className="diverge">
                    {stats.deltas.map((d, i) => {
                      const w = (Math.abs(d.delta) / maxAbs) * 50;
                      const up = d.delta >= 0;
                      return (
                        <motion.div key={d.student.id} className="dv-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}>
                          <span className="dv-name">{d.student.name}</span>
                          <div className="dv-track">
                            <motion.div
                              className={`dv-bar ${up ? 'up' : 'down'}`}
                              style={up ? { left: '50%' } : { right: '50%' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${w}%` }}
                              transition={{ delay: 0.6 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                          <span className={`dv-val ${up ? 'up' : 'down'}`}>{fmtSigned(d.delta)}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="kpi-sub">İlk deneme — karşılaştırma bir sonraki denemede başlayacak.</p>
                )}
              </motion.div>
            </div>
            <motion.div className="glass panel-pad" {...rise(0.25)}>
              <div className="glass-title">🔥 Ders ısı haritası · başarı yüzdesi</div>
              {hm && (
                <div className="heat-wrap">
                  <table className="heat">
                    <thead>
                      <tr>
                        <th />
                        {hm.subjects.map((s) => (
                          <th key={s}>
                            <span>{shortSubject(s)}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hm.rows.map((row, ri) => (
                        <tr key={row.student.id}>
                          <th>
                            <span className="avatar mini" style={{ background: avatarColor(row.student.id) }}>
                              {initials(row.student.name)}
                            </span>
                            {row.student.name}
                          </th>
                          {row.cells.map((c, ci) => (
                            <td key={ci}>
                              {c === null ? (
                                <span className="heat-cell none" />
                              ) : (
                                <motion.span
                                  className="heat-cell"
                                  style={{ background: heat(c) }}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: 0.4 + (ri + ci) * 0.025, type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                  {fmt(c * 100, 0)}
                                </motion.span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
