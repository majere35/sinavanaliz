import { motion } from 'framer-motion';
import { fmt, fmtSigned, type ExamResult } from '../domain/calc';
import { examMatrix } from '../domain/group';
import { CountUp } from './charts/CountUp';

function DeltaMini({ v }: { v: number | null }) {
  if (v === null) return null;
  const kind = v > 0.001 ? 'up' : v < -0.001 ? 'down' : 'flat';
  return (
    <span className={`mx-delta ${kind}`}>
      {kind === 'up' ? '▲' : kind === 'down' ? '▼' : '●'}
      {kind === 'flat' ? '' : fmtSigned(v).replace(/^[+−]/, '')}
    </span>
  );
}

/** Tüm sınavlar alt alta: satır = sınav, sütun = ders; her hücrede D / Y / B ve net. */
export function ExamMatrix({ line }: { line: ExamResult[] }) {
  const { subjects, rows } = examMatrix(line);
  // Her dersin en yüksek neti (en az 2 sınav varsa yıldızlanır)
  // Yıldız yalnız öne çıkan sınava: en yüksek net ve en az bir sınavdan daha iyi
  const colNets = subjects.map((_, k) => rows.map((r) => r.cells[k]?.net).filter((n): n is number => n !== undefined));
  const best = colNets.map((ns) => (ns.length > 1 && Math.min(...ns) < Math.max(...ns) ? Math.max(...ns) : Infinity));
  const totals = rows.map((r) => r.result.totalNet);
  const bestTotal = Math.min(...totals) < Math.max(...totals) ? Math.max(...totals) : Infinity;

  return (
    <div className="mx-wrap">
      <table className="mx">
        <thead>
          <tr>
            <th className="mx-exam">Sınav</th>
            {subjects.map((s, k) => (
              <motion.th key={s.name} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.03 }}>
                {s.name}
                <small>{s.questions} soru</small>
              </motion.th>
            ))}
            <th className="mx-total">Toplam net</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.result.exam.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <th className="mx-exam">
                {row.result.exam.name}
                <small>{new Date(row.result.exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</small>
              </th>
              {row.cells.map((c, k) => {
                const d = row.deltas[k];
                const tone = d === null ? '' : d > 0.001 ? 'up' : d < -0.001 ? 'down' : '';
                const star = !!c && c.net === best[k] && c.net > 0;
                return (
                  <td key={k}>
                    {c ? (
                      <div className={`mx-cell ${tone} ${star ? 'best' : ''}`}>
                        <div className="mx-net">
                          <CountUp value={c.net} delay={0.35 + i * 0.12} duration={0.8} />
                          <DeltaMini v={d} />
                        </div>
                        <div className="mx-dyb">
                          <i className="d">{c.score.d}</i>
                          <i className="y">{c.score.y}</i>
                          <i className="b">{Math.max(0, c.blank)}</i>
                        </div>
                      </div>
                    ) : (
                      <div className="mx-cell empty">—</div>
                    )}
                  </td>
                );
              })}
              <td>
                <div className={`mx-cell total ${row.totalDelta === null ? '' : row.totalDelta > 0.001 ? 'up' : row.totalDelta < -0.001 ? 'down' : ''} ${row.result.totalNet === bestTotal ? 'best' : ''}`}>
                  <div className="mx-net">
                    <CountUp value={row.result.totalNet} delay={0.4 + i * 0.12} duration={1} />
                  </div>
                  <DeltaMini v={row.totalDelta} />
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      <div className="mx-legend">
        <span>
          <i className="d">D</i> Doğru
        </span>
        <span>
          <i className="y">Y</i> Yanlış
        </span>
        <span>
          <i className="b">B</i> Boş
        </span>
        <span>▲▼ önceki sınava göre net değişimi</span>
        <span className="best-key">⭐ dersteki en iyi sınav</span>
        <span>Başarı: %{fmt((Math.max(0, rows[rows.length - 1].result.totalNet) / rows[rows.length - 1].result.totalQuestions) * 100, 0)} (son sınav)</span>
      </div>
    </div>
  );
}
