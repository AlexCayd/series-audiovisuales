/* =====================================================================
   SCROLL — parallax, entrada del hero, profundidad del overlay
   ===================================================================== */
(function () {
  "use strict";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Parallax (page-level, rAF) ---------- */
  var pElems = $$("[data-parallax]").map(function (el) {
    return { el: el, f: parseFloat(el.getAttribute("data-parallax")) || 0 };
  });
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      pElems.forEach(function (p) {
        p.el.style.transform = "translate3d(0," + (y * p.f) + "px,0)";
      });
      // hide scroll cue
      var cue = $(".scroll-cue");
      if (cue) cue.style.opacity = y > 120 ? "0" : "1";
      ticking = false;
    });
  }
  if (!REDUCED) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Hero entrance ---------- */
  window.__heroEnter = function (instant) {
    var els = $$('[data-hero]');
    if (!hasGSAP || REDUCED || instant) {
      els.forEach(function (e) { e.style.opacity = 1; e.style.transform = "none"; });
      return;
    }
    gsap.set(els, { opacity: 0, y: 46 });
    gsap.to(els, {
      opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
      stagger: 0.12, delay: 0.15
    });
    // subtle glow pulse
    var glow = $(".hero-glow");
    if (glow) gsap.fromTo(glow, { opacity: 0.4 }, { opacity: 1, duration: 2, ease: "sine.inOut" });
  };

  /* ---------- Episode overlay parallax (internal scroll) ---------- */
  window.__epParallax = function (overlay) {
    if (REDUCED) return;
    var items = $$("[data-epx]", overlay).map(function (el) {
      return { el: el, f: parseFloat(el.getAttribute("data-epx")) || 0 };
    });
    if (!items.length) return;
    var t = false;
    overlay.addEventListener("scroll", function () {
      if (t) return; t = true;
      requestAnimationFrame(function () {
        var y = overlay.scrollTop;
        items.forEach(function (p) { p.el.style.transform = "translate3d(0," + (y * p.f) + "px,0)"; });
        t = false;
      });
    }, { passive: true });
  };
})();
