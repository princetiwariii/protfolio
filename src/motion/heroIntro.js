/* ============================================================
   heroIntro.js — the page-load timeline. Eyebrow, then the big
   name revealed character-by-character, then supporting lines.
   ============================================================ */
import { animate, stagger } from 'motion';
import { env } from '../utils/env.js';
import { splitChars } from './text.js';

const EASE = [0.22, 1, 0.36, 1];

export function heroIntro() {
  const title = document.querySelector('.hero__title[data-splt]');
  const chars = title ? splitChars(title) : [];
  const fades = Array.from(document.querySelectorAll('.hero [data-hero-fade]'));
  const nav = document.querySelector('[data-nav]');
  const eyebrow = fades[0];
  const rest = fades.slice(1);

  // Reduced motion: everything is already visible — do nothing.
  if (env.reducedMotion) return;

  // Pre-hide to avoid a flash before the timeline starts.
  chars.forEach((c) => (c.style.opacity = '0'));
  fades.forEach((f) => (f.style.opacity = '0'));
  if (nav) nav.style.opacity = '0';

  if (nav) animate(nav, { opacity: [0, 1] }, { duration: 0.8, delay: 0.1, ease: EASE });

  if (eyebrow)
    animate(eyebrow, { opacity: [0, 1], y: [16, 0] }, { duration: 0.7, delay: 0.15, ease: EASE });

  if (chars.length)
    animate(
      chars,
      { opacity: [0, 1], y: [60, 0] },
      { duration: 0.9, delay: stagger(0.045, { startDelay: 0.3 }), ease: EASE }
    );

  if (rest.length)
    animate(
      rest,
      { opacity: [0, 1], y: [24, 0] },
      { duration: 0.8, delay: stagger(0.09, { startDelay: 0.75 }), ease: EASE }
    );
}
