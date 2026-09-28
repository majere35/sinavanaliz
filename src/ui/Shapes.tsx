import type { CSSProperties } from 'react';

// Okul banner'larındaki üçgen / nokta / halka motiflerinden türetilmiş süzülen şekiller.
const SHAPES: { kind: 'tri' | 'dots' | 'ring' | 'sq'; color: string; x: string; y: string; s: number; dur: number; dx: number; dy: number; rot: number; op: number }[] = [
  { kind: 'tri', color: '#f07a2b', x: '6%', y: '12%', s: 120, dur: 16, dx: 40, dy: 30, rot: 30, op: 0.22 },
  { kind: 'ring', color: '#6ea0ff', x: '82%', y: '8%', s: 160, dur: 18, dx: -30, dy: 40, rot: 0, op: 0.2 },
  { kind: 'dots', color: '#ffffff', x: '70%', y: '70%', s: 150, dur: 20, dx: 30, dy: -30, rot: 15, op: 0.14 },
  { kind: 'sq', color: '#f6bd2f', x: '14%', y: '72%', s: 70, dur: 14, dx: 30, dy: -40, rot: 60, op: 0.2 },
  { kind: 'tri', color: '#e5394a', x: '90%', y: '52%', s: 90, dur: 15, dx: -40, dy: -20, rot: -35, op: 0.18 },
  { kind: 'dots', color: '#6ea0ff', x: '38%', y: '4%', s: 110, dur: 22, dx: -20, dy: 30, rot: -10, op: 0.16 },
  { kind: 'ring', color: '#f07a2b', x: '44%', y: '84%', s: 90, dur: 17, dx: 40, dy: -20, rot: 0, op: 0.16 },
];

function Shape({ kind, color }: { kind: string; color: string }) {
  switch (kind) {
    case 'tri':
      return <polygon points="0,100 50,0 100,100" fill={color} />;
    case 'ring':
      return <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10" />;
    case 'sq':
      return <rect x="10" y="10" width="80" height="80" rx="8" fill={color} />;
    default:
      return (
        <g fill={color}>
          {Array.from({ length: 25 }, (_, i) => (
            <circle key={i} cx={10 + (i % 5) * 20} cy={10 + Math.floor(i / 5) * 20} r="4" />
          ))}
        </g>
      );
  }
}

export function Shapes() {
  return (
    <div className="shapes" aria-hidden>
      {SHAPES.map((s, i) => (
        <svg
          key={i}
          className="shape"
          viewBox="0 0 100 100"
          width={s.s}
          height={s.s}
          style={{ left: s.x, top: s.y, '--dur': `${s.dur}s`, '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--rot': `${s.rot}deg`, '--op': s.op } as CSSProperties}
        >
          <Shape kind={s.kind} color={s.color} />
        </svg>
      ))}
    </div>
  );
}
