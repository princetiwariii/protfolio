/* ============================================================
   featured.js — the large featured project. Hovering activates
   a cinematic state (background, typography and rings shift via
   CSS) and the decorative visual parallaxes toward the cursor.
   ============================================================ */
import { env } from '../utils/env.js';

export function initFeatured() {
  const featured = document.querySelector('[data-featured]');
  const visual = document.querySelector('[data-featured-visual]');
  if (!featured) return;

  featured.addEventListener('pointerenter', () =>
    featured.classList.add('is-active')
  );
  featured.addEventListener('pointerleave', () => {
    featured.classList.remove('is-active');
    if (visual) visual.style.transform = '';
  });

  if (env.finePointer && !env.reducedMotion && visual) {
    featured.addEventListener('pointermove', (e) => {
      const r = featured.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      visual.style.transform = `translate(${nx * 44}px, ${ny * 44}px)`;
    });
  }
}
