import { motion } from 'framer-motion';
import type { SubjectDelta } from '../../domain/calc';

const S = 400;
const C = S / 2;
const R = 130;

function shortName(n: string) {
  return n.replace('Türk Dili ve Edebiyatı', 'Edebiyat').replace('Din Kültürü', 'Din K.').replace('Felsefe Grubu', 'Felsefe');
}

/** Güçlü / zayıf dersler: başarı oranı (net/soru). Kesikli çizgi = önceki sınav. */
export function Radar({ rows, delay = 0.6 }: { rows: SubjectDelta[]; delay?: number }) {
  const n = rows.length;
  if (n < 3) return null;
  const ang = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pt = (i: number, r: number) => [C + Math.cos(ang(i)) * R * r, C + Math.sin(ang(i)) * R * r] as const;
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, Math.max(0.02, Math.min(1, v))).join(',')).join(' ');
  const cur = rows.map((r) => r.current.rate);
  const hasPrev = rows.some((r) => r.previous);
  const prev = rows.map((r) => r.previous?.rate ?? 0);

  return (
    <svg viewBox={`-70 -10 ${S + 140} ${S + 20}`} role="img" aria-label="Ders başarı radarı">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={poly(rows.map(() => f))} fill="none" stroke="rgba(255,255,255,0.1)" />
      ))}
      {rows.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" />;
      })}
      {hasPrev && (
        <motion.polygon
          points={poly(prev)}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="2"
          strokeDasharray="6 6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.9 }}
        />
      )}
      <motion.g
        style={{ transformOrigin: `${C}px ${C}px`, transformBox: 'view-box' }}
        initial={{ scale: 0, rotate: -40, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 90, damping: 13 }}
      >
        <polygon points={poly(cur)} fill="rgba(255,154,77,0.35)" stroke="#ff9a4d" strokeWidth="3" strokeLinejoin="round" />
        {cur.map((v, i) => {
          const [x, y] = pt(i, Math.max(0.02, Math.min(1, v)));
          return <circle key={i} cx={x} cy={y} r="5" fill="#fff" />;
        })}
      </motion.g>
      {rows.map((r, i) => {
        const [x, y] = pt(i, 1.22);
        const anchor = Math.abs(x - C) < 10 ? 'middle' : x > C ? 'start' : 'end';
        return (
          <motion.text
            key={i}
            x={x}
            y={y + 5}
            textAnchor={anchor}
            fill="rgba(255,255,255,0.85)"
            fontSize="15"
            fontWeight="800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 + i * 0.05 }}
          >
            {shortName(r.current.subject.name)} %{Math.round(r.current.rate * 100)}
          </motion.text>
        );
      })}
    </svg>
  );
}
