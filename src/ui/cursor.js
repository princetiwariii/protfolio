/* ============================================================
   cursor.js — custom cursor (desktop / fine-pointer only).
   A small dot that tracks tightly and a larger ring that trails
   with smooth interpolation and expands over interactive targets.
   ============================================================ */
import { env, pointer, lerp } from '../utils/env.js';

export function initCursor() {
  // Never on touch devices, and pointless with reduced motion off? still fine.
  if (!env.finePointer) return;

  const root = document.querySelector('.cursor');
  const dot = document.querySelector('[data-cursor-dot]');
  const ring = document.querySelector('[data-cursor-ring]');
  const label = document.querySelector('[data-cursor-label]');
  if (!root || !dot || !ring) return;

  document.body.classList.add('has-custom-cursor');

  // Positions we interpolate toward pointer each frame.
  let dx = pointer.x, dy = pointer.y; // dot
  let rx = pointer.x, ry = pointer.y; // ring
  let scale = 1, targetScale = 1;
  let visible = false;

  const render = () => {
    // Dot tracks tightly, ring trails softly for a premium feel.
    dx = lerp(dx, pointer.x, 0.35);
    dy = lerp(dy, pointer.y, 0.35);
    rx = lerp(rx, pointer.x, 0.18);
    ry = lerp(ry, pointer.y, 0.18);
    scale = lerp(scale, targetScale, 0.2);

    dot.style.transform = `translate(${dx}px, ${dy}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) scale(${scale})`;
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  // Reveal the cursor only once the pointer actually moves in-window.
  window.addEventListener(
    'pointermove',
    () => {
      if (!visible) {
        visible = true;
        root.style.opacity = '1';
      }
    },
    { passive: true }
  );
  document.addEventListener('mouseleave', () => (root.style.opacity = '0'));
  document.addEventListener('mouseenter', () => (root.style.opacity = '1'));

  // Hover / press states via event delegation (works for dynamic nodes too).
  const onOver = (e) => {
    const target = e.target.closest('[data-cursor]');
    if (!target) return;
    root.classList.add('is-hover');
    targetScale = parseFloat(target.dataset.cursorScale) || 2.2;
    if (label) label.textContent = target.dataset.cursorLabel || '';
  };
  const onOut = (e) => {
    if (!e.target.closest('[data-cursor]')) return;
    // Only reset if we're not entering another cursor target.
    const to = e.relatedTarget && e.relatedTarget.closest?.('[data-cursor]');
    if (to) return;
    root.classList.remove('is-hover');
    targetScale = 1;
    if (label) label.textContent = '';
  };

  document.addEventListener('pointerover', onOver);
  document.addEventListener('pointerout', onOut);
  document.addEventListener('pointerdown', () => root.classList.add('is-down'));
  document.addEventListener('pointerup', () => root.classList.remove('is-down'));
}
