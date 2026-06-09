/* =====================================================================
   APP — intro, carrusel, overlay de episodio, transiciones, typewriter
   ===================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EPS = window.EPISODIOS || [];
  var hasGSAP = typeof window.gsap !== "undefined";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ----------------------------------------------------------------
     REVEAL on scroll (IntersectionObserver — works in page + overlay)
  ---------------------------------------------------------------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); revealObserver.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  function observeReveals(root) {
    $$("[data-reveal]", root).forEach(function (el) {
      if (!el.classList.contains("is-in")) revealObserver.observe(el);
    });
  }

  /* ----------------------------------------------------------------
     TYPEWRITER
  ---------------------------------------------------------------- */
  function typewriter(el, text, speed, withCursor, done) {
    el.textContent = "";
    if (REDUCED) {
      el.textContent = text;
      if (done) done();
      return;
    }
    var i = 0, cursor = null;
    if (withCursor) {
      cursor = document.createElement("span");
      cursor.className = "tw-cursor";
      cursor.textContent = "▍";
      el.appendChild(cursor);
    }
    (function tick() {
      if (i < text.length) {
        var ch = document.createTextNode(text.charAt(i));
        if (cursor) el.insertBefore(ch, cursor); else el.appendChild(ch);
        i++;
        setTimeout(tick, speed + (text.charAt(i - 1) === " " ? 10 : Math.random() * 28));
      } else if (done) { done(); }
    })();
  }

  /* ----------------------------------------------------------------
     CINEMATIC WIPE — covers, runs midFn, uncovers
  ---------------------------------------------------------------- */
  var wipe = $("#wipe");
  var wipeMark = $(".wipe-mark", wipe);

  // meta = ep object → navegación de página (solo cubre, más dramático)
  // sin meta → transición in-page (cubre y descubre)
  function wipeTransition(midFn, meta) {
    return new Promise(function (resolve) {
      if (!hasGSAP || REDUCED) {
        if (midFn) midFn();
        resolve();
        return;
      }

      var wipeScan    = $(".wipe-scan",      wipe);
      var wipeNo      = $(".wipe-no",        wipe);
      var wipeTitle   = $(".wipe-title",     wipe);
      var wipeCorners = $$(".wipe-corners b", wipe);

      if (meta && wipeNo)    wipeNo.textContent    = "EP " + meta.no + " · " + meta.tipo;
      if (meta && wipeTitle) wipeTitle.textContent = meta.titulo;

      var tl = gsap.timeline({ onComplete: resolve });

      if (meta) {
        /* ── NAVEGACIÓN DE PÁGINA: cover-only con identidad del episodio ── */
        tl
          .set(wipe,        { transformOrigin: "bottom", scaleY: 0 })
          .set(wipeScan,    { top: "0%", opacity: 0 })
          .set(wipeCorners, { opacity: 0 })
          .set(wipeNo,      { opacity: 0, y: 8 })
          .set(wipeTitle,   { opacity: 0, scale: 1.05 })
          .set(wipeMark,    { opacity: 0 })

          /* scan line baja quemando la pantalla */
          .to(wipeScan,    { opacity: 1, duration: 0.04 }, 0)
          .to(wipeScan,    { top: "100%", opacity: 0, duration: 0.28, ease: "power1.in" }, 0.02)
          /* panel sube desde abajo */
          .to(wipe,        { scaleY: 1, duration: 0.42, ease: "power3.inOut" }, 0.04)
          /* esquinas del frame */
          .to(wipeCorners, { opacity: 1, stagger: 0.04, duration: 0.12 }, 0.38)
          /* identificación del episodio */
          .to(wipeNo,      { opacity: 1, y: 0, duration: 0.22 }, 0.44)
          .to(wipeTitle,   { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 0.48)
          .to(wipeMark,    { opacity: 0.5, duration: 0.22 }, 0.54)
          /* navegar — pausa para que el título se lea con comodidad */
          .add(function () { if (midFn) midFn(); }, 1.5);

      } else {
        /* ── TRANSICIÓN IN-PAGE: cover + uncover ── */
        tl
          .set(wipe,     { transformOrigin: "bottom", scaleY: 0 })
          .set(wipeMark, { opacity: 0 })
          .to(wipe,     { scaleY: 1, duration: 0.5, ease: "power3.inOut" })
          .to(wipeMark, { opacity: 1, duration: 0.2 }, "-=0.2")
          .add(function () { if (midFn) midFn(); })
          .to(wipeMark, { opacity: 0, duration: 0.2 }, "+=0.15")
          .set(wipe, { transformOrigin: "top" })
          .to(wipe,  { scaleY: 0, duration: 0.55, ease: "power3.inOut" }, "-=0.05");
      }
    });
  }

  /* ================================================================
     INTRO — créditos de cine
  ================================================================ */
  var intro = $("#intro");
  var topbar = $("#topbar");

  function buildCountdown() {
    var cd = $("#countdown");
    for (var i = 0; i < 8; i++) { var s = document.createElement("span"); cd.appendChild(s); }
    if (REDUCED || !hasGSAP) { $$("span", cd).forEach(function (s) { s.style.opacity = 0.3; }); return; }
    gsap.to($$("span", cd), { opacity: 1, stagger: 0.12, duration: 0.2, repeat: -1, yoyo: true, repeatDelay: 0.6 });
  }

  function runIntro() {
    buildCountdown();
    var present = $("#present");
    var t1 = $("#t1"), t2 = $("#t2");

    // letters for title (animated)
    function spell(el, word) {
      el.innerHTML = "";
      word.split("").forEach(function (ch) {
        var s = document.createElement("span");
        var inner = document.createElement("i");
        inner.textContent = ch === " " ? "\u00A0" : ch;
        s.appendChild(inner);
        el.appendChild(s);
      });
      return $$("i", el);
    }
    var L1 = spell(t1, "SERIES");
    var L2 = spell(t2, "AUDIOVISUALES");

    if (REDUCED || !hasGSAP) {
      present.textContent = "Universidad Anáhuac presenta";
      L1.concat(L2).forEach(function (i) { i.style.opacity = 1; i.style.transform = "none"; });
      $("#introPre").style.opacity = 1;
      $("#introMeta").style.opacity = 1;
      $("#enterBtn").style.opacity = 1;
      $("#skipBtn").style.opacity = 1;
      return;
    }

    typewriter(present, "Universidad Anáhuac presenta", 46, true);
    var tl = gsap.timeline({ delay: 1.25 });
    tl.to("#introPre", { opacity: 1, duration: 0.6 })
      .to(L1, { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: "power3.out" }, "-=0.1")
      .to(L2, { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: "power3.out" }, "-=0.45")
      .to("#introMeta", { opacity: 1, duration: 0.6 }, "-=0.2")
      .to("#enterBtn", { opacity: 1, duration: 0.6 }, "-=0.3")
      .to("#skipBtn", { opacity: 1, duration: 0.5 }, "-=0.4");
  }

  /* ================================================================
     FILM LEADER — secuencia de cuenta regresiva cinematográfica
  ================================================================ */
  function runFilmLeader(done) {
    var fl     = document.getElementById("fl");
    var flNum  = document.getElementById("flNum");
    var flRing = document.getElementById("flRing");
    if (!fl) { done(); return; }
    if (!hasGSAP || REDUCED) { fl.style.display = "none"; done(); return; }

    var CIRC = 2 * Math.PI * 108; // r = 108
    var DURATION = 3000;           // 3 segundos totales
    var t0 = performance.now();
    var done_ = false;

    // Animación continua del ring via rAF
    function raf(now) {
      if (done_) return;
      var pct = Math.min((now - t0) / DURATION, 1);
      if (flRing) flRing.style.strokeDashoffset = CIRC * (1 - pct);
      if (pct < 1) requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Cambio de número cada segundo + flash
    function tick(n) {
      var next = n - 1;
      if (next <= 0) {
        done_ = true;
        gsap.to(fl, {
          backgroundColor: "#d6cabb", duration: 0.06, ease: "none",
          onComplete: function () {
            gsap.to(fl, {
              opacity: 0, duration: 0.5, ease: "power2.in", delay: 0.05,
              onComplete: function () { fl.style.display = "none"; done(); }
            });
          }
        });
        return;
      }
      gsap.fromTo(fl,
        { backgroundColor: "rgba(235,226,210,0.5)" },
        { backgroundColor: "#070605", duration: 0.25, ease: "power2.out" }
      );
      flNum.textContent = next;
      setTimeout(function () { tick(next); }, 1000);
    }
    setTimeout(function () { tick(3); }, 1000);
  }

  function enterApp() {
    document.removeEventListener("keydown", onIntroKey);
    wipeTransition(function () {
      intro.style.display = "none";
      document.body.classList.remove("no-scroll");
      document.documentElement.classList.remove("no-scroll");
      topbar.setAttribute("aria-hidden", "false");
      window.scrollTo(0, 0);
      if (window.__heroEnter) window.__heroEnter();
    }).then(function () {
      store.set("sep_introSeen", "1");
    });
  }

  function onIntroKey(e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") { e.preventDefault(); enterApp(); }
  }

  $("#enterBtn").addEventListener("click", enterApp);
  $("#skipBtn").addEventListener("click", function (e) { e.stopPropagation(); enterApp(); });
  intro.addEventListener("click", function (e) {
    if (e.target === intro || e.target.closest(".intro-inner")) {
      if (!e.target.closest("button")) enterApp();
    }
  });
  document.addEventListener("keydown", onIntroKey);

  /* ================================================================
     CAROUSEL
  ================================================================ */
  var track = $("#track");
  var viewport = $("#viewport");
  var progressWrap = $("#ccProgress");
  var prevBtn = $("#prevBtn"), nextBtn = $("#nextBtn");
  var current = 0;

  function cardHTML(ep, i) {
    var thumbInner = ep.thumb
      ? '<img src="' + ep.thumb + '" alt="' + ep.titulo + '">'
      : '<div class="ph" data-ph="Fotograma · ' + ep.tipo + '"></div>';
    var goText = ep.href ? 'Ir a la actividad →' : 'Ver análisis →';
    var hrefAttr = ep.href ? ' href="' + ep.href + '"' : '';
    return '' +
      '<a class="ep-card" data-index="' + i + '"' + hrefAttr + '>' +
        '<div class="card-inner">' +
          '<div class="thumb">' +
            thumbInner +
            '<div class="thumb-scrim"></div>' +
            '<div class="thumb-top"><span class="ep-no">EP ' + ep.no + '</span><span class="badge">' + ep.tipo + '</span></div>' +
            '<div class="play"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg></div>' +
          '</div>' +
          '<div class="card-body">' +
            '<h3>' + ep.titulo + '</h3>' +
            '<p class="logline">' + ep.logline + '</p>' +
            '<div class="card-foot"><span>' + ep.semana + '</span><span class="go">' + goText + '</span></div>' +
          '</div>' +
        '</div>' +
      '</a>';
  }

  function renderCarousel() {
    track.innerHTML = EPS.map(cardHTML).join("");
    progressWrap.innerHTML = EPS.map(function () { return '<div class="seg"></div>'; }).join("");
    $$(".ep-card", track).forEach(function (card) {
      card.addEventListener("click", function (e) {
        e.preventDefault();
        var idx = parseInt(card.getAttribute("data-index"), 10);
        var ep  = EPS[idx];
        if (ep && ep.href) {
          wipeTransition(function () { window.location.href = ep.href; }, ep);
          return;
        }
        openEpisode(idx);
      });
    });
  }

  function cardTargetScroll(i) {
    var card = track.children[i];
    if (!card) return 0;
    return card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
  }

  function goToCard(i, smooth) {
    i = Math.max(0, Math.min(EPS.length - 1, i));
    current = i;
    viewport.scrollTo({ left: cardTargetScroll(i), behavior: smooth === false ? "auto" : "smooth" });
    updateActive();
  }

  function nearestIndex() {
    var center = viewport.scrollLeft + viewport.clientWidth / 2;
    var best = 0, bestD = Infinity;
    for (var i = 0; i < track.children.length; i++) {
      var c = track.children[i];
      var cc = c.offsetLeft + c.offsetWidth / 2;
      var d = Math.abs(cc - center);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function updateActive() {
    current = nearestIndex();
    $$(".seg", progressWrap).forEach(function (s, i) { s.classList.toggle("active", i <= current); });
    prevBtn.disabled = current <= 0;
    nextBtn.disabled = current >= EPS.length - 1;
  }

  prevBtn.addEventListener("click", function () { goToCard(current - 1); });
  nextBtn.addEventListener("click", function () { goToCard(current + 1); });

  var rafScroll;
  viewport.addEventListener("scroll", function () {
    if (rafScroll) cancelAnimationFrame(rafScroll);
    rafScroll = requestAnimationFrame(updateActive);
  });


  // keyboard arrows when hub is focused (not in intro/overlay)
  document.addEventListener("keydown", function (e) {
    if (intro.style.display === "none" && episode.hidden) {
      if (e.key === "ArrowRight") { goToCard(current + 1); }
      else if (e.key === "ArrowLeft") { goToCard(current - 1); }
    }
  });

  window.addEventListener("resize", function () { goToCard(current, false); });

  /* ================================================================
     EPISODE OVERLAY
  ================================================================ */
  var episode = $("#episode");

  function episodeHTML(ep) {
    var next = EPS[(EPS.indexOf(ep) + 1) % EPS.length];
    var ficha = Object.keys(ep.ficha).map(function (k) {
      return '<div class="cell"><div class="k">' + k + '</div><div class="v">' + ep.ficha[k] + '</div></div>';
    }).join("");
    var paras = ep.analisis.map(function (p, idx) {
      var first = idx === 0 ? '<span class="drop">' + ep.titulo.charAt(0) + '</span>' : '';
      return '<p data-reveal>' + first + p + '</p>';
    }).join("");
    return '' +
    '<div class="ep-topbar">' +
      '<button class="ep-back" id="epBack"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg> Volver a la temporada</button>' +
      '<span class="ep-id">EP ' + ep.no + ' · ' + ep.tipo + '</span>' +
    '</div>' +
    '<header class="ep-hero">' +
      '<div class="ep-hero-bg" data-epx="0.12"><div class="ph" data-ph="Imagen principal del episodio · 21:9"></div></div>' +
      '<div class="ep-hero-scrim"></div>' +
      '<div class="ep-watermark" data-epx="0.05">' + ep.no + '</div>' +
      '<div class="wrap ep-hero-content">' +
        '<div class="ep-tags"><span class="t gold">EP ' + ep.no + '</span><span class="t">' + ep.tipo + '</span><span class="t">' + ep.semana + '</span><span class="t">' + ep.duracion + '</span></div>' +
        '<h1>' + ep.titulo + '</h1>' +
        '<p class="ep-sub">' + ep.sub + '</p>' +
      '</div>' +
    '</header>' +
    '<div class="ep-body"><div class="wrap">' +
      '<section class="ep-section">' +
        '<div class="sec-label" data-reveal>Sinopsis</div>' +
        '<p class="synopsis" id="synopsis" data-syn="' + encodeURIComponent(ep.sinopsis) + '"></p>' +
      '</section>' +
      '<section class="ep-section">' +
        '<div class="sec-label" data-reveal>Ficha técnica</div>' +
        '<div class="ficha" data-reveal>' + ficha + '</div>' +
      '</section>' +
      '<section class="ep-section">' +
        '<div class="sec-label" data-reveal>El análisis</div>' +
        '<div class="analysis">' + paras +
          '<blockquote class="pullquote" data-reveal>' + ep.quote + '</blockquote>' +
        '</div>' +
      '</section>' +
      '<section class="ep-section">' +
        '<div class="sec-label" data-reveal>Fragmentos</div>' +
        '<div class="gallery">' +
          '<div class="g-item ph" data-reveal data-ph="Fotograma destacado"></div>' +
          '<div class="g-item ph" data-reveal data-ph="Fotograma 02"></div>' +
          '<div class="g-item ph" data-reveal data-ph="Fotograma 03"></div>' +
        '</div>' +
      '</section>' +
      '<section class="ep-section">' +
        '<div class="sec-label" data-reveal>Conclusión</div>' +
        '<p class="analysis" data-reveal style="display:block;max-width:62ch;color:var(--muted);font-size:18px;line-height:1.85">' + ep.conclusion + '</p>' +
      '</section>' +
      '<div class="ep-next" id="epNext">' +
        '<div><div class="nx-label">Siguiente episodio · EP ' + next.no + '</div><div class="nx-title">' + next.titulo + '</div></div>' +
        '<div class="nx-arrow">→</div>' +
      '</div>' +
    '</div></div>';
  }

  var openIndex = -1;

  function renderEpisode(ep) {
    episode.innerHTML = episodeHTML(ep);
    episode.hidden = false;
    episode.setAttribute("aria-hidden", "false");
    episode.scrollTop = 0;
    bindEpisode(ep);
    store.set("sep_openEp", ep.id);
    try { location.hash = ep.id; } catch (e) {}
    if (window.__epParallax) window.__epParallax(episode);
    observeReveals(episode);
  }

  function afterEpisode(ep, instant) {
    var syn = $("#synopsis", episode);
    if (syn) {
      var text = decodeURIComponent(syn.getAttribute("data-syn"));
      if (instant && REDUCED) { syn.textContent = text; }
      else setTimeout(function () { typewriter(syn, text, 24, true); }, instant ? 120 : 250);
    }
    if (hasGSAP && !REDUCED && !instant) {
      gsap.from(episode.querySelector(".ep-hero-content"), { y: 40, opacity: 0, duration: 0.9, ease: "power3.out" });
      gsap.from(episode.querySelector(".ep-tags"), { y: 20, opacity: 0, duration: 0.7, delay: 0.1 });
    }
  }

  function openEpisode(i, instant) {
    openIndex = i;
    var ep = EPS[i];
    document.body.classList.add("no-scroll");
    document.documentElement.classList.add("no-scroll");
    if (instant) {
      renderEpisode(ep);
      if (instant === "reveal") $$("[data-reveal]", episode).forEach(function (e) { e.classList.add("is-in"); });
      afterEpisode(ep, true);
      return;
    }
    wipeTransition(function () {
      renderEpisode(ep);
    }).then(function () { afterEpisode(ep, false); });
  }

  function bindEpisode(ep) {
    $("#epBack", episode).addEventListener("click", closeEpisode);
    var nx = $("#epNext", episode);
    if (nx) nx.addEventListener("click", function () {
      var nextIndex = (EPS.indexOf(ep) + 1) % EPS.length;
      closeToOpen(nextIndex);
    });
  }

  function closeEpisode() {
    wipeTransition(function () {
      episode.hidden = true;
      episode.setAttribute("aria-hidden", "true");
      episode.innerHTML = "";
      openIndex = -1;
      store.set("sep_openEp", "");
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      document.body.classList.remove("no-scroll");
      document.documentElement.classList.remove("no-scroll");
      goToCard(current, false);
    });
  }

  function closeToOpen(nextIndex) {
    wipeTransition(function () {
      var ep = EPS[nextIndex];
      episode.innerHTML = episodeHTML(ep);
      episode.scrollTop = 0;
      bindEpisode(ep);
      openIndex = nextIndex;
      store.set("sep_openEp", ep.id);
      if (window.__epParallax) window.__epParallax(episode);
      observeReveals(episode);
      current = nextIndex;
    }).then(function () {
      var syn = $("#synopsis", episode);
      if (syn) {
        var text = decodeURIComponent(syn.getAttribute("data-syn"));
        setTimeout(function () { typewriter(syn, text, 24, true); }, 200);
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!episode.hidden && e.key === "Escape") closeEpisode();
  });

  /* ================================================================
     NAV smooth-scroll links
  ================================================================ */
  $$('[data-scroll]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id && id.charAt(0) === "#") {
        e.preventDefault();
        var target = id === "#top" ? document.body : $(id);
        if (target) window.scrollTo({ top: id === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - 10, behavior: "smooth" });
      }
    });
  });

  /* ================================================================
     INIT (deferred so scroll.js has registered its globals)
  ================================================================ */
  function init() {
  renderCarousel();
  observeReveals(document);
  goToCard(0, false);

  var introSeen = store.get("sep_introSeen") === "1";
  // deep-link: #e0x opens an episode directly (and implies intro already seen)
  var hashId = (location.hash || "").replace("#", "");
  var hashIdx = EPS.map(function (e) { return e.id; }).indexOf(hashId);

  if (hashIdx >= 0) {
    // Deep-link: sin animaciones, abrir episodio directo
    intro.style.display = "none";
    document.body.classList.remove("no-scroll");
    document.documentElement.classList.remove("no-scroll");
    topbar.setAttribute("aria-hidden", "false");
    document.removeEventListener("keydown", onIntroKey);
    if (window.__heroEnter) window.__heroEnter(true);
    current = hashIdx; openEpisode(hashIdx, "reveal");
  } else if (introSeen) {
    // Visita de regreso: film leader → app directo
    runFilmLeader(function () {
      intro.style.display = "none";
      document.body.classList.remove("no-scroll");
      document.documentElement.classList.remove("no-scroll");
      topbar.setAttribute("aria-hidden", "false");
      document.removeEventListener("keydown", onIntroKey);
      if (window.__heroEnter) window.__heroEnter(true);
      var openId = store.get("sep_openEp");
      if (openId) {
        var idx = EPS.map(function (e) { return e.id; }).indexOf(openId);
        if (idx >= 0) { current = idx; openEpisode(idx, "reveal"); }
      }
    });
  } else {
    // Primera visita: film leader → intro completo
    runFilmLeader(runIntro);
  }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }

  // expose for scroll.js hero entrance fallback
  window.__observeReveals = observeReveals;

  // public API — deep-link / programmatic control
  window.SEP = {
    open: function (i) { openEpisode(i); },
    close: closeEpisode,
    goTo: function (i) { goToCard(i); }
  };
})();
