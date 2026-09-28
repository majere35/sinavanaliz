import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { fmt } from '../../domain/calc';

/** Değer değişince eski değerden yenisine sayar (yarış barları için). */
export function AnimatedNumber({ value, duration = 0.9, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prev.current;
    prev.current = value;
    if (reduce) {
      el.textContent = fmt(value) + suffix;
      return;
    }
    const c = animate(from, value, { duration, ease: 'easeOut', onUpdate: (v) => (el.textContent = fmt(v) + suffix) });
    return () => c.stop();
  }, [value, duration, suffix, reduce]);

  return <span ref={ref}>{fmt(value) + suffix}</span>;
}
