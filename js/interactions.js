/**
 * ============================================================
 *  Alan's Blog — Slate & Tech 交互引擎
 *  Modern tech blog, clean interactions, card-based layout
 *  ============================================================
 */
(function () {
  'use strict';

  function throttle(fn, limit) {
    var inThrottle = false;
    return function () {
      var ctx = this, args = arguments;
      if (!inThrottle) { fn.apply(ctx, args); inThrottle = true; setTimeout(function () { inThrottle = false; }, limit); }
    };
  }

  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }',
      '.reveal.revealed { opacity: 1; transform: translateY(0); }',
      '.stagger { opacity: 0; transform: translateY(16px); }',
      '.stagger-in { animation: staggerFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards; }',
      '@keyframes staggerFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }',
      '.course-card.tilt-active,.article-card.tilt-active { transition: transform 0.1s ease-out; }',
      '.course-card.tilt-reset,.article-card.tilt-reset { transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }',
      'img.lazy-img { opacity: 0; transform: translateY(8px); transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }',
      'img.lazy-img.loaded { opacity: 1; transform: translateY(0); }',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* --- Reading Progress --- */
  function initReadingProgress() {
    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    document.body.prepend(bar);
    window.addEventListener('scroll', throttle(function () {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) + '%' : '0%';
    }, 16), { passive: true });
  }

  /* --- Scroll Reveal --- */
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* --- Navbar Scroll --- */
  function initNavbarScroll() {
    var header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', throttle(function () { header.classList.toggle('header-scrolled', window.scrollY > 40); }, 16), { passive: true });
  }

  /* --- Terminal Typing --- */
  function initTerminalTyping() {
    var body = document.querySelector('.terminal-body');
    if (!body) return;
    var lines = body.querySelectorAll('p');
    lines.forEach(function (l) { l.style.opacity = '0'; l.style.transform = 'translateX(-6px)'; l.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; });
    var base = 250;
    lines.forEach(function (l, i) { setTimeout(function () { l.style.opacity = '1'; l.style.transform = 'translateX(0)'; }, base + i * 450); });
  }

  /* --- Back to Top --- */
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', throttle(function () { btn.classList.toggle('visible', window.scrollY > 400); }, 100), { passive: true });
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* --- Card Tilt --- */
  function initCardTilt() {
    if (isTouchDevice()) return;
    var cards = document.querySelectorAll('.course-card, .article-card');
    cards.forEach(function (card) {
      card.classList.add('tilt-active');
      card.addEventListener('mouseenter', function () { card.classList.remove('tilt-reset'); });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(600px) rotateX(' + (-y * 3) + 'deg) rotateY(' + (x * 3) + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.classList.add('tilt-reset'); card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)'; });
    });
  }

  /* --- Code Copy --- */
  function initCodeCopy() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.copy-btn');
      if (!btn || btn.dataset.copying === 'true') return;
      var block = btn.closest('.code-block') || btn.closest('.inline-code-block');
      if (!block) return;
      var code = block.querySelector('pre code');
      if (!code) return;
      var text = code.textContent || '';
      btn.dataset.copying = 'true';
      function done() {
        var orig = btn.textContent;
        btn.textContent = 'Copied!'; btn.classList.add('copied');
        setTimeout(function () { btn.textContent = orig; btn.classList.remove('copied'); btn.dataset.copying = 'false'; }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
    function fallbackCopy(text) {
      var ta = document.createElement('textarea'); ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  /* --- Stagger Animation --- */
  function initStaggerAnimation() {
    var sels = ['.course-card', '.article-card', '.section-title', '.hero-title', '.terminal', '.article-meta', '.article-title'];
    sels.forEach(function (sel) {
      var els = document.querySelectorAll(sel);
      els.forEach(function (el, i) { if (!el.classList.contains('stagger')) { el.classList.add('stagger'); el.style.animationDelay = (i * 0.06) + 's'; } });
    });
    var staggers = document.querySelectorAll('.stagger');
    if (!staggers.length) return;
    requestAnimationFrame(function () { staggers.forEach(function (el) { el.classList.add('stagger-in'); }); });
  }

  /* --- Lazy Images --- */
  function initLazyImages() {
    var imgs = document.querySelectorAll('.article-body img');
    if (!imgs.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('loaded'); obs.unobserve(e.target); } });
    }, { threshold: 0.05, rootMargin: '60px' });
    imgs.forEach(function (img) { if (img.complete) { img.classList.add('loaded'); } else { img.classList.add('lazy-img'); obs.observe(img); } });
  }

  /* --- Init --- */
  function init() {
    injectStyles();
    initReadingProgress();
    initScrollReveal();
    initNavbarScroll();
    initTerminalTyping();
    initBackToTop();
    initCardTilt();
    initCodeCopy();
    initStaggerAnimation();
    initLazyImages();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();