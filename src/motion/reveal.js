/* ============================================================
   reveal.js — scroll-triggered reveals using Motion's inView:
   masked line headings, fade/slide/blur-to-sharp blocks, and
   counting number statistics. All play once and respect
   prefers-reduced-motion (content stays visible either way).
   ============================================================ */
import { animate, inView, stagger } from 'motion';
import { env } from '../utils/env.js';
import { splitLines } from './text.js';

const EASE = [0.22, 1, 0.36, 1];

export function initReveals() {
  const reduced = env.reducedMotion;

  /* ---- Generic fade + slide + blur-to-sharp reveals ---- */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (reduced) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.filter = 'blur(6px)';

    const stop = inView(
      el,
      () => {
        animate(
          el,
          { opacity: [0, 1], y: [28, 0], filter: ['blur(6px)', 'blur(0px)'] },
          { duration: 0.85, ease: EASE }
        ).finished.then(() => {
          // Clear inline props so hover transforms (tilt) aren't blocked.
          el.style.filter = '';
          el.style.transform = '';
        });
        stop?.();
      },
      { amount: 0.2 }
    );
  });

  /* ---- Counting statistics ---- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduced) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const stop = inView(
      el,
      () => {
        animate(0, target, {
          duration: 1.6,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (v) => (el.textContent = `${Math.round(v)}${suffix}`),
        });
        stop?.();
      },
      { amount: 0.6 }
    );
  });
}

/**
 * Masked line-by-line heading reveals. Split separately (and after
 * fonts are ready) because line detection depends on final metrics.
 */
export function initLineReveals() {
  const reduced = env.reducedMotion;
  document.querySelectorAll('[data-splt-lines]').forEach((el) => {
    const inners = splitLines(el); // splitting is safe with reduced motion too
    if (reduced) return;
    inners.forEach((i) => (i.style.transform = 'translateY(110%)'));

    const stop = inView(
      el,
      () => {
        animate(
          inners,
          { y: ['110%', '0%'] },
          { duration: 0.9, delay: stagger(0.08), ease: EASE }
        );
        stop?.();
      },
      { amount: 0.35 }
    );
  });
}
