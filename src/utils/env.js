/* ============================================================
   env.js — device, motion & performance capabilities + shared
   pointer state and small math helpers used across modules.
   ============================================================ */

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const fineQuery = window.matchMedia('(pointer: fine) and (hover: hover)');
const mobileQuery = window.matchMedia('(max-width: 820px)');

export const env = {
  /** User asked the OS to minimise motion. Read live — it can change. */
  get reducedMotion() {
    return reducedQuery.matches;
  },
  /** Precise pointer + real hover (i.e. a mouse, not touch). */
  get finePointer() {
    return fineQuery.matches;
  },
  get isMobile() {
    return mobileQuery.matches;
  },
};

/**
 * Coarse device performance tier, used to scale 3D work (particle
 * counts, pixel ratio). Deliberately conservative so mid/low laptops
 * and phones stay smooth.
 */
export function getPerfTier() {
  const mem = navigator.deviceMemory || 4; // GB (Chrome only; falls back to 4)
  const cores = navigator.hardwareConcurrency || 4;
  const minSide = Math.min(window.innerWidth, window.innerHeight);

  if (env.isMobile || mem <= 2 || cores <= 2 || minSide < 500) return 'low';
  if (mem <= 4 || cores <= 4 || minSide < 800) return 'mid';
  return 'high';
}

/** Cap devicePixelRatio so retina phones don't render 3× the pixels. */
export function dprCap() {
  return getPerfTier() === 'high' ? 2 : 1.5;
}

/* ---- Shared, throttled pointer state (one global listener) ---- */
export const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  nx: 0, // normalised -1..1
  ny: 0,
  moved: false,
};

window.addEventListener(
  'pointermove',
  (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.moved = true;
  },
  { passive: true }
);

/* ---- Math helpers ---- */
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Frame-rate independent damping (t = smoothing, dt = delta seconds). */
export const damp = (a, b, smoothing, dt) =>
  lerp(a, b, 1 - Math.exp(-smoothing * dt));
