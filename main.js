/**
 * North Scottsdale Med Spa — Premium Homepage JS
 * Handles: Scroll animations, Hero slider, Before/After slider,
 *          Testimonial carousel, Tab switching, FAQ accordion,
 *          Count-up animations, Mobile nav, Header scroll effect.
 */

// ================================================================
// 1. UTILITIES
// ================================================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ================================================================
// 2. HEADER — SCROLL EFFECT
// ================================================================

function initHeader() {
  const header = $('#site-header');
  if (!header) return;

  const handleScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// ================================================================
// 3. MOBILE NAVIGATION
// ================================================================

function initMobileNav() {
  const toggle  = $('#menu-toggle');
  const overlay = $('#mobile-nav-overlay');
  const close   = $('#mobile-nav-close');

  if (!toggle || !overlay) return;

  const openNav = () => {
    overlay.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeNav = () => {
    overlay.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', openNav);
  close?.addEventListener('click', closeNav);

  $$('.mobile-nav-link', overlay).forEach(link => {
    link.addEventListener('click', closeNav);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeNav();
  });
}

// ================================================================
// 4. HERO BACKGROUND SLIDER
// ================================================================

function initHeroSlider() {
  const slides = $$('.hero-slide');
  const dots   = $$('.slide-dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  const goTo = (idx) => {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  };

  const autoPlay = () => {
    timer = setTimeout(() => {
      goTo(current + 1);
      autoPlay();
    }, 6000);
  };

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearTimeout(timer);
      goTo(+dot.dataset.slide);
      autoPlay();
    });
  });

  autoPlay();
}

// ================================================================
// 5. SCROLL-TRIGGERED ANIMATIONS
// ================================================================

function initScrollAnimations() {
  // Signal to CSS that JS animations are active.
  // This enables the hidden initial state for all .fade-up / .reveal-image
  document.documentElement.classList.add('js-animations');

  // ── Step 1: Scope stagger indices to their parent containers ──
  $$('.treatment-list, .why-pillars').forEach(container => {
    $$('.stagger-child', container).forEach((el, i) => {
      el.style.setProperty('--stagger-index', i);
      el.classList.add('fade-up');
    });
  });

  // ── Step 2: Animate hero elements immediately (they're in viewport on load) ──
  const heroEls = $$('.hero .fade-up, .hero .reveal-image');
  if (heroEls.length) {
    // Small rAF delay so the CSS transition applies after the hidden state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroEls.forEach(el => el.classList.add('animated'));
      });
    });
  }

  // ── Step 3: IntersectionObserver for all other elements ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    // Trigger slightly before the element is 100% in view
    rootMargin: '0px 0px -60px 0px'
  });

  // Observe all animated elements except hero ones (already handled above)
  $$('.fade-up, .reveal-image').forEach(el => {
    if (!el.closest('.hero')) {
      observer.observe(el);
    }
  });
}

// ================================================================
// 6. BEFORE / AFTER SLIDER
// ================================================================

function createSlider(container, afterEl, divider) {
  if (!container || !afterEl || !divider) return null;

  let dragging = false;
  let pct = 50;

  const setPct = (percent) => {
    pct = Math.max(5, Math.min(95, percent));
    divider.style.left = `${pct}%`;
    afterEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  };

  const updateFromCoords = (x) => {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (x - rect.left) / rect.width;
    setPct(ratio * 100);
  };

  // Mouse
  container.addEventListener('mousedown', (e) => {
    dragging = true;
    updateFromCoords(e.clientX);
    container.style.cursor = 'col-resize';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    updateFromCoords(e.clientX);
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      container.style.cursor = 'col-resize';
    }
  });

  // Touch
  container.addEventListener('touchstart', (e) => {
    dragging = true;
    updateFromCoords(e.touches[0].clientX);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    updateFromCoords(e.touches[0].clientX);
  }, { passive: true });

  document.addEventListener('touchend', () => { dragging = false; });

  setPct(50);

  return {
    reset: () => setPct(50),
    update: () => setPct(pct)
  };
}

function initBeforeAfter() {
  const container = $('#ba-container');
  const afterEl   = $('#ba-after');
  const divider   = $('#ba-divider');
  createSlider(container, afterEl, divider);
}

// ================================================================
// 7. TREATMENTS TAB SWITCHER
// ================================================================

function initTreatmentTabs() {
  const tabs   = $$('.tab-btn');
  const panels = $$('.tab-panel');
  if (!tabs.length) return;

  const triggerPanelStagger = (panel) => {
    $$('.stagger-child', panel).forEach((el, i) => {
      el.style.setProperty('--stagger-index', i);
      el.classList.remove('animated');
      // Use rAF to ensure the removed class is applied before re-adding
      requestAnimationFrame(() => {
        setTimeout(() => el.classList.add('animated'), i * 80);
      });
    });
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const panel = $(`#panel-${target}`);
      if (panel) {
        panel.classList.add('active');
        triggerPanelStagger(panel);
      }
    });
  });

  // Trigger stagger on initial active panel with slight delay so CSS applies
  const initialPanel = $('.tab-panel.active');
  if (initialPanel) {
    setTimeout(() => triggerPanelStagger(initialPanel), 300);
  }
}

// ================================================================
// 8. TESTIMONIALS SLIDER
// ================================================================

function initTestimonials() {
  const track  = $('#testimonials-track');
  const dots   = $$('.t-dot');
  const prevBtn = $('#testimonial-prev');
  const nextBtn = $('#testimonial-next');

  if (!track) return;

  const cards  = $$('.testimonial-card', track);
  let current  = 0;
  let autoTimer;

  const goTo = (idx) => {
    current = (idx + cards.length) % cards.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  };

  const autoPlay = () => {
    autoTimer = setInterval(() => goTo(current + 1), 5500);
  };

  const resetAuto = () => {
    clearInterval(autoTimer);
    autoPlay();
  };

  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.idx); resetAuto(); }));

  // Swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { goTo(dx > 0 ? current + 1 : current - 1); resetAuto(); }
  });

  autoPlay();
}

// ================================================================
// 9. COUNT-UP ANIMATION
// ================================================================

function initCountUp() {
  const counters = $$('.count-up');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target   = +el.dataset.target;
    const duration = 2000;
    const start    = performance.now();

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const update = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);
      el.textContent = value.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString();
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 60px 0px' });

  counters.forEach(c => observer.observe(c));
}

// ================================================================
// 10. FAQ ACCORDION
// ================================================================

function initFAQ() {
  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const answer = btn.nextElementSibling;

      // Close all
      $$('.faq-question').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        b.nextElementSibling?.classList.remove('open');
      });

      // Toggle current
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        answer?.classList.add('open');
      }
    });
  });
}

// ================================================================
// 11. SMOOTH SCROLL FOR ANCHOR LINKS
// ================================================================

function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();
      const headerHeight = $('#site-header')?.offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ================================================================
// 12. PARALLAX EFFECT (Hero orbs)
// ================================================================

function initParallax() {
  const orb1 = $('.hero-orb-1');
  const orb2 = $('.hero-orb-2');

  if (!orb1 && !orb2) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (orb1) orb1.style.transform = `translate(0, ${y * 0.15}px)`;
        if (orb2) orb2.style.transform = `translate(0, ${-y * 0.12}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ================================================================
// 13. TRUST BAR — Pause on Hover
// ================================================================

function initTrustBar() {
  const track = $('#trust-track');
  if (!track) return;

  track.addEventListener('mouseenter', () => {
    track.style.animationPlayState = 'paused';
  });
  track.addEventListener('mouseleave', () => {
    track.style.animationPlayState = 'running';
  });
}

// ================================================================
// 14. GALLERY LIGHTBOX / MODAL
// ================================================================

const GALLERY_DATA = [
  {
    id: 1,
    title: "Botox Cosmetic Treatment",
    category: "Injectables",
    description: "FDA-approved neuromodulator treatment to relax forehead frown lines, smoothing dynamic wrinkles while maintaining natural expression.",
    before: "assets/images/10054.webp",
    after: "assets/images/10056.webp",
    treatment: "Botox Cosmetic"
  },
  {
    id: 2,
    title: "Restylane Lip Filler",
    category: "Injectables",
    description: "Hyaluronic acid dermal filler designed to restore lip volume, define borders, and correct asymmetrical contours for a natural, soft contour.",
    before: "assets/images/10055.webp",
    after: "assets/images/10057.webp",
    treatment: "Lip Filler"
  },
  {
    id: 3,
    title: "SkinPen Microneedling",
    category: "Facials",
    description: "Minimally invasive collagen-induction therapy using SkinPen. Micro-needling stimulates self-healing and enhances cell renewal for smoother, brighter skin.",
    before: "assets/images/10058.webp",
    after: "assets/images/10059.webp",
    treatment: "SkinPen"
  },
  {
    id: 4,
    title: "Sciton BBL Photofacial",
    category: "Lasers",
    description: "High-intensity Broad Band Light therapy targeting solar lentigines, redness, and broken capillaries to achieve a clear, uniform, radiant complexion.",
    before: "assets/images/10009.webp",
    after: "assets/images/10010.webp",
    treatment: "BBL Photofacial"
  },
  {
    id: 5,
    title: "Dysport Injections",
    category: "Injectables",
    description: "Neuromodulator smoothing of dynamic wrinkles (frown lines between eyebrows). Delivers fast, natural results within 2-4 days post-treatment.",
    before: "assets/images/10001.png",
    after: "assets/images/10032.png",
    treatment: "Dysport"
  },
  {
    id: 6,
    title: "CO2 Resurfacing Laser",
    category: "Lasers",
    description: "Rohrer Phoenix fractional CO2 laser resurfacing. Smooths fine wrinkles, acne scars, and uneven texture by vaporizing epidermal cells and inducing deep collagen remodelling.",
    before: "assets/images/10012.webp",
    after: "assets/images/10014.webp",
    treatment: "CO2 Laser"
  },
  {
    id: 7,
    title: "Moxi Skin Revitalization",
    category: "Lasers",
    description: "Fractional non-ablative laser skin treatment, ideal for pre-juvenation, treating sun damage, melasma, and fine wrinkles with virtually zero downtime.",
    before: "assets/images/10013.webp",
    after: "assets/images/10061.webp",
    treatment: "Moxi Laser"
  }
];

function initGalleryModal() {
  const modal       = $('#gallery-modal');
  const openBtn     = $('#view-gallery-btn');
  const closeBtn    = $('#modal-close');
  const backdrop    = $('#modal-backdrop');

  if (!modal) return;

  const modalBeforeImg      = $('#modal-before-img');
  const modalAfterImg       = $('#modal-after-img');
  const modalTitle          = $('#modal-title');
  const modalCategory       = $('#modal-category');
  const modalDescription    = $('#modal-description');
  const modalMetaTreatment  = $('#modal-meta-treatment');
  const thumbnailsContainer = $('#modal-thumbnails');

  let activeSliderInstance = null;

  const modalContainer = $('#modal-ba-container');
  const modalAfterEl   = $('#modal-ba-after');
  const modalDivider   = $('#modal-ba-divider');

  const loadTreatment = (idx) => {
    const item = GALLERY_DATA[idx];

    modalTitle.textContent           = item.title;
    modalCategory.textContent        = item.category;
    modalDescription.textContent     = item.description;
    modalMetaTreatment.textContent   = item.treatment;

    modalBeforeImg.src = item.before;
    modalBeforeImg.alt = `Before — ${item.title}`;
    modalAfterImg.src  = item.after;
    modalAfterImg.alt  = `After — ${item.title}`;

    if (activeSliderInstance) {
      activeSliderInstance.reset();
    } else {
      activeSliderInstance = createSlider(modalContainer, modalAfterEl, modalDivider);
    }

    $$('.thumb-card', thumbnailsContainer).forEach((card, i) => {
      card.classList.toggle('active', i === idx);
    });
  };

  const renderThumbnails = () => {
    thumbnailsContainer.innerHTML = '';
    GALLERY_DATA.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'thumb-card';
      card.innerHTML = `<img src="${item.before}" alt="${item.treatment} thumbnail" loading="lazy" />`;
      card.addEventListener('click', () => loadTreatment(idx));
      thumbnailsContainer.appendChild(card);
    });
  };

  const openModal = (startIdx = 0) => {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    loadTreatment(startIdx);
  };

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  renderThumbnails();

  $$('.result-card').forEach((card) => {
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.galleryIndex) - 1;
      openModal(index);
    });
  });

  openBtn?.addEventListener('click', () => openModal(0));
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

// ================================================================
// 15. INITIALIZE ALL
// ================================================================

function initAll() {
  initHeader();
  initMobileNav();
  initHeroSlider();
  initScrollAnimations();
  initBeforeAfter();
  initTreatmentTabs();
  initTestimonials();
  initCountUp();
  initFAQ();
  initSmoothScroll();
  initParallax();
  initTrustBar();
  initGalleryModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
