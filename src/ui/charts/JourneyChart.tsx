import { motion } from 'framer-motion';
import { useId } from 'react';
import { fmt, fmtSigned, type ExamResult } from '../../domain/calc';

interface Props {
  line: ExamResult[];
  target?: number;
  selected: number;
  onSelect(i: number): void;
}

const W = 1000;
const H = 300;
const PAD = { l: 56, r: 40, t: 46, b: 64 };

/** Yumuşak eğri (Catmull-Rom → Bezier). */
function smoothPath(pts: [number, number][]): string {
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** "Net yolculuğu": sınavlar durak, çizgi kalemle çiziliyormuş gibi ilerler. */
export function JourneyChart({ line, target, selected, onSelect }: Props) {
  const uid = useId().replace(/:/g, '');
  const nets = line.map((r) => r.totalNet);
  const lo = Math.min(0, ...nets);
  const hiRaw = Math.max(...nets, target ?? 0, 10);
  const hi = hiRaw * 1.12;
  const n = line.length;
  const innerW = W - PAD.l - PAD.r;
  const x = (i: number) => (n === 1 ? PAD.l + innerW / 2 : PAD.l + (innerW * i) / (n - 1));
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - lo) / (hi - lo));
  const pts = nets.map((v, i) => [x(i), y(v)] as [number, number]);
  const path = smoothPath(pts);
  const area = n > 1 ? `${path} L${pts[n - 1][0]},${y(lo)} L${pts[0][0]},${y(lo)} Z` : '';
  const drawDur = 0.4 + n * 0.3;
  const pointDelay = (i: number) => 0.15 + (n === 1 ? 0 : (drawDur * i) / (n - 1));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + (hiRaw - lo) * f);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Net yolculuğu grafiği">
      <defs>
        <linearGradient id={`ln${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6ea0ff" />
          <stop offset="100%" stopColor="#ff9a4d" />
        </linearGradient>
        <linearGradient id={`ar${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6ea0ff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6ea0ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.07)" />
          <text x={PAD.l - 12} y={y(t) + 5} textAnchor="end" fill="rgba(255,255,255,0.45)" fontSize="14" fontWeight="700">
            {fmt(t, 0)}
          </text>
        </g>
      ))}

      {target !== undefined && target > 0 && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <line className="target-line" x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke="#f6bd2f" strokeWidth="2.5" strokeDasharray="12 12" />
          <rect x={PAD.l + 6} y={y(target) - 30} width="118" height="24" rx="12" fill="#f6bd2f" />
          <text x={PAD.l + 65} y={y(target) - 13} textAnchor="middle" fill="#3a1d00" fontSize="14" fontWeight="800">
            🎯 Hedef {fmt(target)}
          </text>
        </motion.g>
      )}

      {area && (
        <motion.path d={area} fill={`url(#ar${uid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: drawDur * 0.7, duration: 0.8 }} />
      )}
      {n > 1 && (
        <motion.path
          d={path}
          fill="none"
          stroke={`url(#ln${uid})`}
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: drawDur, ease: 'easeInOut', delay: 0.15 }}
          style={{ filter: 'drop-shadow(0 6px 14px rgba(110,160,255,0.45))' }}
        />
      )}

      {/* Duraklar arası değişim rozetleri */}
      {pts.slice(1).map((p, k) => {
        const i = k + 1;
        const dv = nets[i] - nets[i - 1];
        const mx = (pts[i - 1][0] + p[0]) / 2;
        const my = (pts[i - 1][1] + p[1]) / 2 + 30;
        const up = dv >= 0;
        return (
          <motion.g key={`d${i}`} initial={{ opacity: 0, y: up ? 12 : -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pointDelay(i) + 0.15, type: 'spring', stiffness: 300, damping: 16 }}>
            <rect x={mx - 40} y={my - 15} width="80" height="28" rx="14" fill={up ? 'rgba(34,192,106,0.9)' : 'rgba(229,57,74,0.92)'} />
            <text x={mx} y={my + 5} textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">
              {up ? '▲' : '▼'} {fmtSigned(dv)}
            </text>
          </motion.g>
        );
      })}

      {pts.map((p, i) => {
        const on = i === selected;
        return (
          <motion.g
            key={i}
            style={{ cursor: 'pointer', transformOrigin: `${p[0]}px ${p[1]}px`, transformBox: 'view-box' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: pointDelay(i), type: 'spring', stiffness: 420, damping: 14 }}
            onClick={() => onSelect(i)}
          >
            {on && (
              <motion.circle
                cx={p[0]}
                cy={p[1]}
                r="22"
                fill="none"
                stroke="#ff9a4d"
                strokeWidth="3"
                animate={{ r: [18, 28, 18], opacity: [0.9, 0.2, 0.9] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <circle cx={p[0]} cy={p[1]} r="30" fill="transparent" />
            <circle cx={p[0]} cy={p[1]} r={on ? 12 : 9} fill={on ? '#ff9a4d' : '#fff'} stroke={on ? '#fff' : '#6ea0ff'} strokeWidth="4" />
            <text x={p[0]} y={p[1] - 22} textAnchor="middle" fill="#fff" fontSize={on ? 24 : 19} fontWeight="800">
              {fmt(nets[i])}
            </text>
            <text x={p[0]} y={H - 32} textAnchor="middle" fill={on ? '#ff9a4d' : 'rgba(255,255,255,0.75)'} fontSize="15" fontWeight="800">
              {line[i].exam.name}
            </text>
            <text x={p[0]} y={H - 12} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="13" fontWeight="700">
              {new Date(line[i].exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
