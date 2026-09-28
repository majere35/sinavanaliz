import { motion } from 'framer-motion';
import { CountUp } from './CountUp';

interface Props {
  value: number;
  target: number;
  delay?: number;
}

/** Hedefe ulaşma yüzdesi — halka dolar; %100'e ulaşınca nabız gibi atar. */
export function TargetRing({ value, target, delay = 0.3 }: Props) {
  const pct = target > 0 ? Math.max(0, (value / target) * 100) : 0;
  const reached = pct >= 100;
  const fill = Math.min(1, pct / 100);
  const color = reached ? '#22c06a' : pct >= 75 ? '#f6bd2f' : '#ff9a4d';

  return (
    <motion.div
      className="ring-wrap"
      animate={reached ? { scale: [1, 1.06, 1] } : undefined}
      transition={reached ? { delay: delay + 1.4, duration: 1.2, repeat: Infinity, repeatDelay: 0.6 } : undefined}
    >
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: fill }}
          transition={{ delay, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="ring-center">
        <div>
          <b>
            %<CountUp value={Math.round(pct)} delay={delay} duration={1.3} />
          </b>
          <small>hedef {target}</small>
        </div>
      </div>
    </motion.div>
  );
}
