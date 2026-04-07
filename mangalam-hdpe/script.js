/**
 * script.js — Mangalam HDPE Pipes
 *
 * Handles:
 *  1. Sticky Header — appears when user scrolls past the first fold,
 *     disappears when scrolling back up. Uses IntersectionObserver for
 *     performance (no scroll event polling).
 *
 *  2. Product Image Carousel — prev/next navigation, dot/thumbnail sync,
 *     keyboard-accessible, auto-advance with pause on hover.
 *
 *  3. Carousel Zoom Preview — on hovering over a slide, tracks the mouse
 *     position and updates an inset zoom panel showing a magnified crop of
 *     the same image. Pure CSS magnification; JS drives the crop origin.
 *
 *  4. Applications Carousel — horizontally scrollable card strip with
 *     prev/next arrow controls and swipe support.
 *
 *  5. FAQ Accordion — accessible expand/collapse with smooth animation.
 *
 *  6. Toast Notification helper — shown on form submission.
 *
 *  All DOM queries are guarded; if an element is missing the script
 *  continues gracefully without throwing.
 */

'use strict';

/* ================================================================
   UTILITY: DOM helpers
   ================================================================ */

/**
 * Query a single element — returns null if not found.
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element|null}
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Query all matching elements as an Array.
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element[]}
 */
const $$ = (selector, ctx = document) =>
  Array.from(ctx.querySelectorAll(selector));

/* ================================================================
   1. STICKY HEADER
   ================================================================
   Strategy: observe a sentinel element (the nav bar itself).
   When the main-nav scrolls out of the viewport we show the
   sticky header above it. When the main-nav re-enters we hide it.
   This is more performant than listening to window.scroll.
   ================================================================ */
(function initStickyHeader() {
  const stickyHeader = $('#sticky-header');
  const mainNav      = $('#main-nav');

  if (!stickyHeader || !mainNav) return;

  /**
   * Track the last scroll position so we can detect scroll direction.
   * The header only appears when scrolling DOWN past the first fold.
   */
  let lastScrollY = window.scrollY;
  let stickyVisible = false;

  /** Show or hide the sticky header with the CSS class. */
  const setVisible = (visible) => {
    if (visible === stickyVisible) return;
    stickyVisible = visible;
    stickyHeader.classList.toggle('sticky-header--visible', visible);
  };

  /**
   * IntersectionObserver watches the main-nav.
   * isIntersecting = nav is in view → hide sticky.
   * !isIntersecting = nav scrolled out → show sticky.
   */
  const observer = new IntersectionObserver(
    ([entry]) => {
      const scrollingDown = window.scrollY > lastScrollY;
      lastScrollY = window.scrollY;

      if (!entry.isIntersecting) {
        // Nav scrolled off-screen — show sticky header
        setVisible(true);
      } else {
        // Nav back in view — hide sticky header
        setVisible(false);
      }
    },
    {
      rootMargin: '0px',
      threshold: 0,
    }
  );

  observer.observe(mainNav);

  // Fallback: also listen to scroll to update lastScrollY
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
  }, { passive: true });
})();

/* ================================================================
   2. PRODUCT IMAGE CAROUSEL
   ================================================================
   Features:
   - Slide by index (opacity transition via CSS)
   - Keyboard: ArrowLeft / ArrowRight when carousel is focused
   - Dot + thumbnail synchronisation
   - Auto-advance every 5s; paused on hover
   - Touch/swipe support
   ================================================================ */
(function initProductCarousel() {
  const track      = $('#carousel-track');
  const slides     = $$('.carousel__slide', track || document);
  const prevBtn    = $('#carousel-prev');
  const nextBtn    = $('#carousel-next');
  const dots       = $$('.carousel__dot');
  const thumbs     = $$('.thumbnail');
  const carouselEl = $('#main-carousel');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  let autoTimer    = null;
  const TOTAL      = slides.length;
  const AUTO_MS    = 5000; // auto-advance interval

  /**
   * Navigate to a specific slide index.
   * Updates: slides, dots, thumbnails (by data-thumb match).
   * @param {number} index
   */
  const goTo = (index) => {
    // Wrap index
    const next = ((index % TOTAL) + TOTAL) % TOTAL;

    // Deactivate current slide
    slides[currentIndex]?.classList.remove('active');
    dots[currentIndex]?.classList.remove('active');
    dots[currentIndex]?.setAttribute('aria-selected', 'false');

    currentIndex = next;

    // Activate new slide
    slides[currentIndex]?.classList.add('active');
    dots[currentIndex]?.classList.add('active');
    dots[currentIndex]?.setAttribute('aria-selected', 'true');

    // Sync thumbnails that match the current index
    thumbs.forEach((thumb) => {
      const isCurrent = parseInt(thumb.dataset.thumb, 10) === currentIndex;
      thumb.classList.toggle('active', isCurrent);
      thumb.setAttribute('aria-pressed', String(isCurrent));
    });
  };

  /** Start the auto-advance timer. */
  const startAuto = () => {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(currentIndex + 1), AUTO_MS);
  };

  /** Stop the auto-advance timer. */
  const stopAuto = () => clearInterval(autoTimer);

  // Arrow buttons
  prevBtn?.addEventListener('click', () => { goTo(currentIndex - 1); startAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(currentIndex + 1); startAuto(); });

  // Dot navigation
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.dot, 10));
      startAuto();
    });
  });

  // Thumbnail navigation
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      goTo(parseInt(thumb.dataset.thumb, 10));
      startAuto();
    });
  });

  // Keyboard navigation (when carousel element is focused)
  carouselEl?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(currentIndex - 1); startAuto(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { goTo(currentIndex + 1); startAuto(); e.preventDefault(); }
  });

  // Pause on hover
  carouselEl?.addEventListener('mouseenter', stopAuto);
  carouselEl?.addEventListener('mouseleave', startAuto);

  // Touch / swipe support
  let touchStartX = 0;
  carouselEl?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  carouselEl?.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 40) {
      goTo(delta < 0 ? currentIndex + 1 : currentIndex - 1);
      startAuto();
    }
  }, { passive: true });

  // Initialise
  goTo(0);
  startAuto();
})();

/* ================================================================
   3. CAROUSEL ZOOM PREVIEW
   ================================================================
   On mousemove over a carousel slide, we update css custom
   properties (--zoom-x, --zoom-y) on the zoom preview image
   so the magnified crop follows the cursor.

   The zoom preview element is already shown via CSS :hover selector;
   JS just refines the crop origin.
   ================================================================ */
(function initCarouselZoom() {
  const slides = $$('.carousel__slide');

  slides.forEach((slide) => {
    const zoomImg = slide.querySelector('.zoom-preview__img');
    if (!zoomImg) return;

    /**
     * On mouse move, compute cursor position as a percentage
     * relative to the slide's bounding box, then set it as the
     * object-position on the magnified image.
     */
    slide.addEventListener('mousemove', (e) => {
      const rect = slide.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;

      // Clamp to a reasonable range so the zoom doesn't go completely off-edge
      const cx = Math.min(Math.max(x, 10), 90);
      const cy = Math.min(Math.max(y, 10), 90);

      // Update CSS custom properties — the CSS uses these for object-position
      zoomImg.style.setProperty('--zoom-x', `${cx}%`);
      zoomImg.style.setProperty('--zoom-y', `${cy}%`);

      // Direct style update (more reliable than custom properties on object-position)
      zoomImg.style.objectPosition = `${cx}% ${cy}%`;
    });
  });
})();

/* ================================================================
   4. APPLICATION CARDS CAROUSEL (horizontal scroll track)
   ================================================================
   A free-scrolling horizontal strip of cards. The prev/next
   buttons scroll the track by one card width. Includes:
   - Button-based navigation
   - Touch/swipe scrolling (natural browser behaviour)
   - Keyboard (Left/Right arrow when track is focused)
   ================================================================ */
(function initApplicationsCarousel() {
  const track   = $('#applications-track');
  const prevBtn = $('#app-prev');
  const nextBtn = $('#app-next');

  if (!track) return;

  // Card width + gap (matches CSS: width 260px, gap 16px)
  const SCROLL_AMOUNT = 276; // 260 + 16

  const scrollBy = (amount) => {
    track.scrollBy({ left: amount, behavior: 'smooth' });
  };

  prevBtn?.addEventListener('click', () => scrollBy(-SCROLL_AMOUNT));
  nextBtn?.addEventListener('click', () => scrollBy(SCROLL_AMOUNT));

  // Allow keyboard scrolling when track is focused
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { scrollBy(-SCROLL_AMOUNT); e.preventDefault(); }
    if (e.key === 'ArrowRight') { scrollBy(SCROLL_AMOUNT);  e.preventDefault(); }
  });

  // Also override the track to use overflow-x: auto for smooth native scrolling
  track.style.overflowX = 'auto';
  track.style.scrollSnapType = 'x mandatory';
  track.style.scrollbarWidth = 'none'; // Firefox hide scrollbar
  track.style.msOverflowStyle = 'none'; // IE hide scrollbar

  // Hide webkit scrollbar via a stylesheet rule
  const style = document.createElement('style');
  style.textContent = '#applications-track::-webkit-scrollbar { display: none; }';
  document.head.appendChild(style);

  // Add scroll-snap to each card
  $$('.app-card', track).forEach((card) => {
    card.style.scrollSnapAlign = 'start';
  });
})();

/* ================================================================
   5. APPLICATION CARD ZOOM PREVIEW
   ================================================================
   Same principle as the carousel zoom — track mouse position over
   each app card and update the zoom preview image's object-position.
   ================================================================ */
(function initAppCardZoom() {
  const cards = $$('.app-card');

  cards.forEach((card) => {
    const zoomImg = card.querySelector('.app-zoom-preview__img');
    if (!zoomImg) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      const cx = Math.min(Math.max(x, 15), 85);
      const cy = Math.min(Math.max(y, 15), 85);
      zoomImg.style.objectPosition = `${cx}% ${cy}%`;
    });
  });
})();

/* ================================================================
   6. FAQ ACCORDION
   ================================================================
   Accessible: uses aria-expanded on the button and
   aria-controls linking to the answer panel. Smooth
   collapse via CSS max-height transition.
   ================================================================ */
(function initFAQ() {
  const questions = $$('.faq-question');

  questions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const answerId   = btn.getAttribute('aria-controls');
      const answer     = answerId ? document.getElementById(answerId) : null;

      if (!answer) return;

      // Close all other open items first (accordion behaviour)
      questions.forEach((otherBtn) => {
        if (otherBtn === btn) return;
        const otherExpanded = otherBtn.getAttribute('aria-expanded') === 'true';
        if (otherExpanded) {
          const otherId  = otherBtn.getAttribute('aria-controls');
          const otherAns = otherId ? document.getElementById(otherId) : null;
          otherBtn.setAttribute('aria-expanded', 'false');

          // Rotate icon: swap to collapsed state
          const otherIcon = otherBtn.querySelector('.faq-icon');
          if (otherIcon) otherIcon.innerHTML = '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

          otherAns?.classList.add('faq-answer--hidden');
        }
      });

      // Toggle the clicked item
      const nextState = !isExpanded;
      btn.setAttribute('aria-expanded', String(nextState));

      const icon = btn.querySelector('.faq-icon');
      if (icon) {
        icon.innerHTML = nextState
          ? '<path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'  // up arrow (open)
          : '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'; // down arrow (closed)
      }

      answer.classList.toggle('faq-answer--hidden', !nextState);
    });
  });
})();

/* ================================================================
   7. FORM SUBMISSIONS (Catalogue + Contact)
   ================================================================
   Intercepts form submits, validates, shows a toast.
   Replace with real fetch() calls to your backend as needed.
   ================================================================ */

/** Show a toast notification. */
function showToast(message, type = 'success') {
  // Remove any existing toast
  const existing = document.querySelector('.toast');
  existing?.remove();

  const icon = type === 'success'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>';

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `${icon}<span>${message}</span>`;
  document.body.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

/* ── Catalogue form ────────────────────────────────────────────── */
(function initCatalogueForm() {
  const form  = $('#catalogue-form');
  const input = $('#catalogue-email');
  const btn   = $('#catalogue-submit-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = input?.value?.trim();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      input?.focus();
      return;
    }

    // Simulate sending (replace with real API call)
    btn && (btn.textContent = 'Sending…');
    btn && (btn.disabled = true);

    setTimeout(() => {
      showToast('Catalogue request sent! We\'ll email you shortly.', 'success');
      form.reset();
      btn && (btn.textContent = 'Request Catalogue');
      btn && (btn.disabled = false);
    }, 900);
  });
})();

/* ── Contact form ──────────────────────────────────────────────── */
(function initContactForm() {
  const form = $('#contact-form');
  const btn  = $('#contact-submit-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = $('#contact-name')?.value?.trim();
    const email   = $('#contact-email')?.value?.trim();
    const message = $('#contact-message')?.value?.trim();

    if (!name) {
      showToast('Please enter your name.', 'error');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!message) {
      showToast('Please enter a message.', 'error');
      return;
    }

    // Simulate sending (replace with real API call)
    btn && (btn.textContent = 'Sending…');
    btn && (btn.disabled = true);

    setTimeout(() => {
      showToast('Enquiry sent successfully! Our team will contact you soon.', 'success');
      form.reset();
      btn && (btn.textContent = 'Send Enquiry');
      btn && (btn.disabled = false);
    }, 1000);
  });
})();

/* ================================================================
   8. GENERAL SMOOTH SCROLL for anchor links
   ================================================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ================================================================
   9. NAV LINK ACTIVE STATE on scroll
   ================================================================
   Highlights the correct nav link as the user scrolls through sections.
   ================================================================ */
(function initScrollSpy() {
  const sections = $$('section[id], div[id]')
    .filter((el) => el.id); // only elements with IDs

  const allNavLinks = $$('.nav-link, .sticky-nav__link');

  if (sections.length === 0 || allNavLinks.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          allNavLinks.forEach((link) => {
            const href = link.getAttribute('href');
            const isActive = href === `#${id}`;
            link.style.color = isActive ? 'var(--clr-primary)' : '';
          });
        }
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));
})();

/* ================================================================
   10. ABOUT US — STATS COUNT-UP ANIMATION
   ================================================================
   When the .about-stats section scrolls into view, each number
   animates from 0 to its target value. Runs only once.
   ================================================================ */
(function initStatsCountUp() {
  const statsEl = document.querySelector('.about-stats');
  if (!statsEl) return;

  const numbers = Array.from(statsEl.querySelectorAll('.about-stat__number'));
  let hasRun = false;

  /**
   * Animate a single number element from 0 to its target.
   * Handles suffixes like '+' or plain integers.
   * @param {HTMLElement} el
   */
  const animateNumber = (el) => {
    const raw    = el.textContent.trim();       // e.g. "30+", "1200+", "28"
    const suffix = raw.replace(/[\d,]/g, '');   // everything that isn't a digit or comma
    const target = parseInt(raw.replace(/\D/g, ''), 10); // numeric target
    const DURATION = 1600; // ms
    const start    = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease out cubic: decelerates as it approaches target
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(eased * target);

      el.textContent = current.toLocaleString() + suffix;

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // Observe the stats block; fire once when it enters the viewport
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasRun) {
        hasRun = true;
        numbers.forEach((el) => animateNumber(el));
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(statsEl);
})();
