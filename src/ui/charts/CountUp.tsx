import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { fmt } from '../../domain/calc';

/** Sayıyı 0'dan hedefe doğru sayarak gösterir. */
export function CountUp({ value, delay = 0, duration = 1.1 }: { value: number; delay?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = fmt(value);
      return;
    }
    el.textContent = fmt(0);
    const c = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = fmt(v)),
    });
    return () => c.stop();
  }, [value, delay, duration, reduce]);

  return <span ref={ref}>{fmt(value)}</span>;
}
