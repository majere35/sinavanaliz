import { motion } from 'framer-motion';
import { fmtSigned } from '../../domain/calc';

/** ▲ yeşil artış / ▼ kırmızı düşüş rozeti; ok yönüne doğru zıplayarak girer. */
export function Delta({ value, delay = 0, suffix = ' net' }: { value: number | null; delay?: number; suffix?: string }) {
  if (value === null) return null;
  const kind = value > 0.001 ? 'up' : value < -0.001 ? 'down' : 'flat';
  const arrow = kind === 'up' ? '▲' : kind === 'down' ? '▼' : '●';
  return (
    <motion.span
      className={`delta ${kind}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 380, damping: 18 }}
    >
      <motion.span
        className="arrow"
        initial={{ y: kind === 'up' ? 10 : kind === 'down' ? -10 : 0 }}
        animate={{ y: 0 }}
        transition={{ delay: delay + 0.1, type: 'spring', stiffness: 500, damping: 10 }}
      >
        {arrow}
      </motion.span>
      {fmtSigned(value)}
      {suffix}
    </motion.span>
  );
}
