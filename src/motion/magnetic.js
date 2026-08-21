/* ============================================================
   magnetic.js — magnetic buttons/links. While the pointer is
   near, the element eases toward it; on leave it springs home.
   A single shared rAF drives all elements and idles when settled.
   ============================================================ */
import { env, lerp } from '../utils/env.js';

export function initMagnetic() {
  if (env.reducedMotion || !env.finePointer) return;

  const items = Array.from(document.querySelectorAll('[data-magnetic]')).map(
    (el) => ({
      el,
      strength: parseFloat(el.dataset.magnetic) || 0.3,
      tx: 0, ty: 0, // target
      cx: 0, cy: 0, // current
    })
  );
  if (!items.length) return;

  let running = false;

  const tick = () => {
    let active = false;
    for (const it of items) {
      it.cx = lerp(it.cx, it.tx, 0.2);
      it.cy = lerp(it.cy, it.ty, 0.2);
      // Snap tiny residuals to exactly 0 so we can stop the loop.
      if (Math.abs(it.cx - it.tx) < 0.05 && Math.abs(it.cy - it.ty) < 0.05) {
        it.cx = it.tx;
        it.cy = it.ty;
      } else {
        active = true;
      }
      it.el.style.transform = `translate(${it.cx}px, ${it.cy}px)`;
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
    const pad = 24; // activation area beyond the element bounds
    it.el.addEventListener('pointermove', (e) => {
      const r = it.el.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      it.tx = relX * it.strength;
      it.ty = relY * it.strength;
      start();
    });
    it.el.addEventListener('pointerleave', () => {
      it.tx = 0;
      it.ty = 0;
      start();
    });
  });
}
