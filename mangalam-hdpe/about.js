/**
 * about.js — Mangalam HDPE | About Page Scripts
 * Handles: stats count-up, scroll-reveal (data-reveal / data-stagger)
 */
'use strict';

/* ================================================================
   1. COUNT-UP ANIMATION
   ================================================================ */
(function initCountUp() {
  const statEls = Array.from(document.querySelectorAll('.ab-stat-card__num[data-target]'));
  if (!statEls.length) return;

  let done = false;

  const run = () => {
    if (done) return;
    done = true;

    statEls.forEach((el) => {
      const target   = parseInt(el.dataset.target, 10);
      const suffix   = el.dataset.suffix || '';
      const DURATION = 1800;
      const start    = performance.now();

      const tick = (now) => {
        const t = Math.min((now - start) / DURATION, 1);
        const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
        el.textContent = Math.round(e * target).toLocaleString('en-IN') + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  };

  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) run(); },
    { threshold: 0.25 }
  );

  const section = document.querySelector('.ab-stats');
  if (section) observer.observe(section);
})();

/* ================================================================
   2. SCROLL REVEAL — [data-reveal] and [data-stagger]
   ================================================================ */
(function initReveal() {
  const targets = Array.from(
    document.querySelectorAll('[data-reveal], [data-stagger]')
  );
  if (!targets.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => io.observe(el));
})();

/* ================================================================
   3. SMOOTH SCROLL for in-page anchors
   ================================================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
