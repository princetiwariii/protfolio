/* ============================================================
   skills.js — interactive skill pills. On hover/focus a pill
   scales, moves toward the cursor and updates a shared caption
   describing the skill. Movement is desktop-only; the caption
   also works via keyboard focus for accessibility.
   ============================================================ */
import { env } from '../utils/env.js';

export function initSkills() {
  const pills = Array.from(document.querySelectorAll('.pill'));
  const caption = document.querySelector('.skills__hint');
  if (!pills.length) return;

  const DEFAULT = caption ? caption.textContent : '';
  const canMove = env.finePointer && !env.reducedMotion;

  pills.forEach((pill) => {
    const desc = pill.dataset.skill || '';

    const activate = () => {
      if (caption) {
        caption.textContent = desc;
        caption.classList.add('is-active');
      }
    };
    const deactivate = () => {
      if (caption) {
        caption.textContent = DEFAULT;
        caption.classList.remove('is-active');
      }
    };

    pill.addEventListener('pointerenter', activate);
    pill.addEventListener('focus', activate);
    pill.addEventListener('pointerleave', () => {
      deactivate();
      pill.style.transform = '';
    });
    pill.addEventListener('blur', deactivate);

    if (canMove) {
      pill.addEventListener('pointermove', (e) => {
        const r = pill.getBoundingClientRect();
        const relX = e.clientX - (r.left + r.width / 2);
        const relY = e.clientY - (r.top + r.height / 2);
        // CSS transitions the transform → gives a smooth trailing pull.
        pill.style.transform = `translate(${relX * 0.3}px, ${relY * 0.3}px) scale(1.08)`;
      });
    }
  });
}
