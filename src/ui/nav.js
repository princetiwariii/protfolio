/* ============================================================
   nav.js — floating navigation: scroll state, hide-on-scroll-down,
   active section highlighting, and the mobile full-screen menu.
   ============================================================ */

export function initNav() {
  const nav = document.querySelector('[data-nav]');
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-menu]');
  const links = Array.from(document.querySelectorAll('.nav__link'));
  if (!nav) return;

  /* ---- Scroll state: shadow + hide on scroll down, show on up ---- */
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);

    // Don't hide while the mobile menu is open.
    if (!menu?.classList.contains('is-open')) {
      const goingDown = y > lastY && y > 240;
      nav.classList.toggle('is-hidden', goingDown);
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  /* ---- Active link via IntersectionObserver on sections ---- */
  const sections = links
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          links.forEach((l) =>
            l.classList.toggle('is-active', l.getAttribute('href') === id)
          );
        });
      },
      // "Active" when a section occupies the middle band of the viewport.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- Mobile menu ---- */
  const closeMenu = () => {
    menu?.classList.remove('is-open');
    menu?.setAttribute('aria-hidden', 'true');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    menu?.classList.add('is-open');
    menu?.setAttribute('aria-hidden', 'false');
    burger?.setAttribute('aria-expanded', 'true');
    burger?.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
    // Stagger the links in.
    menu?.querySelectorAll('[data-menu-link]').forEach((el, i) => {
      el.style.transitionDelay = `${0.08 + i * 0.06}s`;
    });
  };

  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    open ? closeMenu() : openMenu();
  });

  menu?.querySelectorAll('[data-menu-link]').forEach((link) =>
    link.addEventListener('click', closeMenu)
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}
