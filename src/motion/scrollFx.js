/* ============================================================
   scrollFx.js — scroll progress indicator and hero parallax,
   both scroll-linked via Motion's scroll(). Parallax is skipped
   under reduced motion; the progress bar stays (it's passive).
   ============================================================ */
import { scroll } from 'motion';
import { env } from '../utils/env.js';

export function initScrollFX() {
  /* ---- Scroll progress bar ---- */
  const bar = document.querySelector('[data-progress]');
  if (bar) {
    scroll((progress) => {
      bar.style.transform = `scaleX(${progress})`;
    });
  }

  if (env.reducedMotion) return;

  /* ---- Hero parallax: content drifts up & fades as you scroll past ---- */
  const hero = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero__inner');
  const heroCanvas = document.querySelector('[data-hero-canvas]');
  if (hero && heroInner) {
    scroll(
      (p) => {
        heroInner.style.transform = `translateY(${p * 90}px)`;
        heroInner.style.opacity = `${Math.max(0, 1 - p * 0.9)}`;
        if (heroCanvas) heroCanvas.style.transform = `translateY(${p * 45}px)`;
      },
      { target: hero, offset: ['start start', 'end start'] }
    );
  }
}
