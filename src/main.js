/* ============================================================
   main.js — entry point. Wires UI, animation and 3D modules and
   coordinates the load sequence:
     1. hide + fade the page in (page-load animation)
     2. init UI + generic reveals immediately
     3. run the hero intro
     4. after fonts: line-split heading reveals
     5. after first idle: lazy-load the (heavier) Three.js scenes
   Keeping 3D behind an idle callback protects first paint.
   ============================================================ */
import './styles/main.css';
import { animate } from 'motion';

import { env } from './utils/env.js';
import { initCursor } from './ui/cursor.js';
import { initNav } from './ui/nav.js';
import { initSkills } from './ui/skills.js';
import { initFeatured } from './ui/featured.js';
import { initReveals, initLineReveals } from './motion/reveal.js';
import { heroIntro } from './motion/heroIntro.js';
import { initMagnetic } from './motion/magnetic.js';
import { initTilt } from './motion/tilt.js';
import { initScrollFX } from './motion/scrollFx.js';

// Start hidden for a clean fade-in (only affects things once JS runs).
document.body.style.opacity = '0';

const scenes = [];

function initUI() {
  initCursor();
  initNav();
  initSkills();
  initFeatured();
  initMagnetic();
  initTilt();
  initScrollFX();
}

function fadeInPage() {
  if (env.reducedMotion) {
    document.body.style.opacity = '1';
    return;
  }
  animate(document.body, { opacity: [0, 1] }, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
}

async function initLineText() {
  // Wait for web fonts so line wrapping is measured correctly.
  try {
    await document.fonts.ready;
  } catch (e) {
    /* fonts API unsupported — proceed anyway */
  }
  initLineReveals();
}

async function initThree() {
  const heroEl = document.querySelector('[data-hero-canvas]');
  const labEl = document.querySelector('[data-lab-canvas]');
  try {
    const [{ createHeroScene }, { createCreativeLab }] = await Promise.all([
      import('./three/HeroScene.js'),
      import('./three/CreativeLab.js'),
    ]);
    if (heroEl) scenes.push(createHeroScene(heroEl));
    if (labEl) scenes.push(createCreativeLab(labEl));
  } catch (e) {
    console.warn('3D scenes failed to load — the site still works without them.', e);
  }
}

function boot() {
  initUI();
  heroIntro(); // synchronous so hero text is hidden before the page fades in
  initReveals();
  fadeInPage();
  initLineText();

  // Defer the heavy 3D work until the browser is idle.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initThree(), { timeout: 1200 });
  } else {
    setTimeout(initThree, 250);
  }
}

// Clean up GPU resources if the page is torn down.
window.addEventListener('pagehide', () => scenes.forEach((s) => s?.destroy?.()));

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
