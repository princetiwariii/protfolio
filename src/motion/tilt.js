/* ============================================================
   tilt.js — subtle 3D tilt on [data-tilt] cards/panels. Tracks
   the pointer for rotation and feeds --mx/--my to the CSS glow.
   Shared rAF, eased follow + return, idles when settled.
   ============================================================ */
import { env, lerp } from '../utils/env.js';

export function initTilt() {
  if (env.reducedMotion || !env.finePointer) return;

  const MAX = 7; // max rotation in degrees
  const items = Array.from(document.querySelectorAll('[data-tilt]')).map((el) => ({
    el,
    rx: 0, ry: 0, // target rotation
    crx: 0, cry: 0, // current rotation
  }));
  if (!items.length) return;

  let running = false;
  const tick = () => {
    let active = false;
    for (const it of items) {
      it.crx = lerp(it.crx, it.rx, 0.12);
      it.cry = lerp(it.cry, it.ry, 0.12);
      if (Math.abs(it.crx - it.rx) < 0.02 && Math.abs(it.cry - it.ry) < 0.02) {
        it.crx = it.rx;
        it.cry = it.ry;
      } else active = true;
      it.el.style.transform = `perspective(900px) rotateX(${it.crx}deg) rotateY(${it.cry}deg)`;
    }
    if (active) requestAnimationFrame(tick);
    else running = false;
  };
  const start = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };

  items.forEach((it) => {
    it.el.addEventListener('pointermove', (e) => {
      const r = it.el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height;
      it.ry = (px - 0.5) * 2 * MAX;
      it.rx = -(py - 0.5) * 2 * MAX;
      it.el.style.setProperty('--mx', `${px * 100}%`);
      it.el.style.setProperty('--my', `${py * 100}%`);
      start();
    });
    it.el.addEventListener('pointerleave', () => {
      it.rx = 0;
      it.ry = 0;
      start();
    });
  });
}
