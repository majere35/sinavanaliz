import { motion } from 'framer-motion';
import type { SubjectDelta } from '../../domain/calc';
import { CountUp } from './CountUp';
import { Delta } from './Delta';

/** Ders ders Doğru / Yanlış / Boş yığın barları; sırayla uzar. */
export function SubjectBars({ rows, baseDelay = 0.4 }: { rows: SubjectDelta[]; baseDelay?: number }) {
  return (
    <div className={`bars ${rows.length <= 6 ? 'few' : ''}`}>
      {rows.map((r, i) => {
        const { subject, score, blank, net } = r.current;
        const q = subject.questions || 1;
        const segs = [
          { cls: 'seg-d', v: score.d, title: 'Doğru' },
          { cls: 'seg-y', v: score.y, title: 'Yanlış' },
          { cls: 'seg-b', v: Math.max(0, blank), title: 'Boş' },
        ];
        const d0 = baseDelay + i * 0.07;
        return (
          <motion.div
            key={subject.id}
            className="bar-row"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: d0, duration: 0.4, ease: 'easeOut' }}
          >
            <div className="bar-name" title={subject.name}>
              {subject.name}
              <small>{subject.questions} soru</small>
            </div>
            <div className="bar-track">
              {segs.map((s, k) =>
                s.v > 0 ? (
                  <motion.div
                    key={s.cls}
                    className={s.cls}
                    title={`${s.title}: ${s.v}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.v / q) * 100}%` }}
                    transition={{ delay: d0 + 0.15 + k * 0.18, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {s.v / q >= 0.07 ? s.v : ''}
                  </motion.div>
                ) : null,
              )}
            </div>
            <div className="bar-net">
              <CountUp value={net} delay={d0 + 0.2} duration={0.9} />
            </div>
            <div className="bar-delta">
              <Delta value={r.delta} delay={d0 + 0.6} suffix="" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
