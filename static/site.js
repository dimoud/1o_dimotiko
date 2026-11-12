/* 1ο Δημοτικό Σχολείο Πολίχνης — μενού κινητού (K11), ενεργό στοιχείο μενού, προβολή φωτογραφιών,
   βίντεο YouTube και χάρτης μόνο με πάτημα. Καμία αυτόματη κίνηση. */
(function () {
  'use strict';
  var body = document.body;
  var tog = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.nav-panel');
  var mq = window.matchMedia('(max-width: 1180px)');

  /* ── ενεργό στοιχείο μενού */
  var path = location.pathname.replace(/index\.html$/, '');
  var lis = document.querySelectorAll('.nav-list > li');
  lis.forEach(function (li, i) {
    var u = li.getAttribute('data-url');
    var anartisi = /\/anartiseis\//.test(path) && /\/zoi\/$/.test(u || '');
    if (u && (i === 0 ? path === u : (path.indexOf(u) === 0 || anartisi))) {
      li.classList.add('on');
      var a = li.querySelector('a');
      if (a) a.setAttribute('aria-current', 'page');
    }
  });

  /* ── μενού κινητού: πάνελ δεξιά, Χ, κλείνει με πάτημα/κύλιση έξω, σουάιπ, Esc */
  function open() { body.classList.add('nav-open'); tog.setAttribute('aria-expanded', 'true'); var c = panel.querySelector('.nav-close'); if (c) c.focus(); }
  function close(back) { if (!body.classList.contains('nav-open')) return; body.classList.remove('nav-open'); tog.setAttribute('aria-expanded', 'false'); if (back) tog.focus(); }
  if (tog && panel) {
    tog.addEventListener('click', function () { body.classList.contains('nav-open') ? close(true) : open(); });
    panel.querySelector('.nav-close').addEventListener('click', function () { close(true); });
    document.addEventListener('click', function (e) {
      if (body.classList.contains('nav-open') && !panel.contains(e.target) && !tog.contains(e.target)) close(false);
    });
    window.addEventListener('scroll', function () { if (mq.matches) close(false); }, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    var x0 = null, y0 = null;
    document.addEventListener('touchstart', function (e) { if (!body.classList.contains('nav-open')) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (x0 === null || !body.classList.contains('nav-open')) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) close(false);
      x0 = null;
    }, { passive: true });
    mq.addEventListener('change', function () { close(false); });
  }
  /* υπομενού: «▾» ανοίγει/κλείνει (κινητό) — στον υπολογιστή ανοίγει και με hover/εστίαση */
  document.querySelectorAll('.sub-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentNode, on = !li.classList.contains('open');
      document.querySelectorAll('.has-sub.open').forEach(function (o) { if (o !== li) { o.classList.remove('open'); o.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); } });
      li.classList.toggle('open', on); b.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-sub.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); });
  });

  /* ── ήπια εμφάνιση με την κύλιση: ξεκινά λίγο πριν μπει το στοιχείο στην οθόνη (ΜΗ-34) */
  var reveal = document.querySelectorAll('.rv');
  if (document.documentElement.classList.contains('anim-ready') && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ent) {
      ent.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sibs = e.target.parentNode ? Array.prototype.indexOf.call(e.target.parentNode.children, e.target) : 0;
        e.target.style.animationDelay = Math.min(sibs % 4, 3) * 70 + 'ms';
        e.target.classList.add('rv-in'); io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px 12% 0px', threshold: 0 });
    reveal.forEach(function (el) { io.observe(el); });
  } else reveal.forEach(function (el) { el.classList.add('rv-in'); });

  /* ── πρώτη οθόνη: αιωρούμενα γράμματα + αεροπλανάκι· παύση εκτός οθόνης (ΜΗ-37/42/47) */
  var hero = document.querySelector('.hero');
  var anim = document.documentElement.classList.contains('anim-ready');
  if (hero && anim) {
    var hio = new IntersectionObserver(function (e) { hero.classList.toggle('hero-off', !e[0].isIntersecting); }, { threshold: 0 });
    hio.observe(hero);
    document.addEventListener('visibilitychange', function () { hero.classList.toggle('hero-bg', document.hidden); });
    requestAnimationFrame(function () { hero.classList.add('hero-go'); });
    /* μετακίνηση με την κύλιση ΜΟΝΟ σε υπολογιστή (ΜΗ-35), ένα καρέ ανά κύλιση (ΜΗ-36) */
    var desk = window.matchMedia('(min-width: 1069px) and (hover: hover)');
    var hds = Array.prototype.slice.call(hero.querySelectorAll('.hd[data-p]'));
    var ticking = false, hh = hero.offsetHeight;
    function frame() {
      ticking = false;
      var y = Math.min(window.scrollY, hh);
      hds.forEach(function (el) { el.style.translate = '0 ' + (y * parseFloat(el.getAttribute('data-p'))).toFixed(1) + 'px'; });
    }
    window.addEventListener('scroll', function () {
      if (!desk.matches || ticking || window.scrollY > hh) return;
      ticking = true; requestAnimationFrame(frame);
    }, { passive: true });
    window.addEventListener('resize', function () { hh = hero.offsetHeight; }, { passive: true });
  }


  /* ── αεροπλανάκι στις διαδρομές ανάμεσα στις ενότητες.
     Υπολογιστής: ακολουθεί την κύλιση (θέσεις μετρημένες μία φορά, ένα καρέ ανά κύλιση).
     Κινητό: μία πτήση 1,8 s όταν η διαδρομή μπει στην οθόνη (ΜΗ-35). */
  var flights = Array.prototype.slice.call(document.querySelectorAll('.flight'));
  if (flights.length && anim) {
    var deskF = window.matchMedia('(min-width: 1069px) and (hover: hover)');
    var F = flights.map(function (el) {
      var path = el.querySelector('.fl-path'), L = path.getTotalLength();
      return { el: el, path: path, L: L, plane: el.querySelector('.fl-plane'), st: el.querySelectorAll('.fl-st'),
               flip: el.classList.contains('flight-r'), top: 0, h: 0, w: 0, done: false };
    });
    function measure() {
      F.forEach(function (f) { var r = f.el.getBoundingClientRect(); f.top = r.top + window.scrollY; f.h = r.height; f.w = r.width; });
    }
    function place(f, p) {
      p = Math.max(0, Math.min(1, p));
      var e = p * f.L, a = f.path.getPointAtLength(e), b = f.path.getPointAtLength(Math.min(f.L, e + 2));
      var sx = f.w / 1200, sy = f.h / 120;
      var x = a.x * sx, y = a.y * sy, ang = Math.atan2((b.y - a.y) * sy, (b.x - a.x) * sx) * 180 / Math.PI;
      if (f.flip) { x = f.w - x; ang = 180 - ang; }
      f.plane.style.opacity = p > 0.01 ? 1 : 0;
      f.plane.style.transform = 'translate(' + (x - 20).toFixed(1) + 'px,' + (y - 20).toFixed(1) + 'px) rotate(' + (ang + 22).toFixed(1) + 'deg)';
      var th = [0.28, 0.55, 0.8];
      for (var i = 0; i < f.st.length; i++) f.st[i].classList.toggle('on', p > (f.flip ? 1 - th[i] : th[i]));
    }
    measure();
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure);
    var tickF = false;
    function frameF() {
      tickF = false;
      var vh = window.innerHeight, y = window.scrollY;
      F.forEach(function (f) {
        var p = (y + vh - f.top) / (vh * 0.85 + f.h);
        if (p > -0.1 && p < 1.1) place(f, p);
      });
    }
    window.addEventListener('scroll', function () {
      if (!deskF.matches || tickF) return; tickF = true; requestAnimationFrame(frameF);
    }, { passive: true });
    if (deskF.matches) frameF();
    var fio = new IntersectionObserver(function (ent) {
      ent.forEach(function (en) {
        if (!en.isIntersecting || deskF.matches) return;
        var f = F[flights.indexOf(en.target)]; if (f.done) return; f.done = true; measure();
        var t0 = null;
        (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1800); place(f, 1 - Math.pow(1 - p, 2)); if (p < 1) requestAnimationFrame(step); })(performance.now());
        fio.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    flights.forEach(function (el) { fio.observe(el); });
  }

  /* ── υποσέλιδο: μολύβια και χαρταετός· ο χαρταετός ταλαντεύεται μόνο όσο φαίνεται */
  var fa = document.querySelector('.foot-art');
  if (fa && anim && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) fa.classList.add('in');
      fa.classList.toggle('live', e[0].isIntersecting);
    }, { rootMargin: '0px 0px 5% 0px' }).observe(fa);
  }

  /* ── προβολή φωτογραφιών (<dialog>), βελάκια πληκτρολογίου και σάρωση */
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lb]'));
  if (links.length && window.HTMLDialogElement) {
    var dlg = document.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Προβολή φωτογραφίας');
    dlg.innerHTML = '<figure class="lb-fig"><img alt=""></figure><p class="lb-c" aria-live="polite"></p>' +
      '<button class="lb-x" type="button" aria-label="Κλείσιμο">×</button>' +
      '<button class="lb-p" type="button" aria-label="Προηγούμενη φωτογραφία">‹</button>' +
      '<button class="lb-n" type="button" aria-label="Επόμενη φωτογραφία">›</button>';
    body.appendChild(dlg);
    var img = dlg.querySelector('img'), cap = dlg.querySelector('.lb-c'), i = 0, back = null;
    function show(k) {
      i = (k + links.length) % links.length;
      var a = links[i], th = a.querySelector('img');
      img.src = a.href; img.alt = th ? th.alt : '';
      cap.textContent = (i + 1) + ' / ' + links.length;
    }
    links.forEach(function (a, k) {
      a.addEventListener('click', function (e) { e.preventDefault(); back = a; show(k); dlg.showModal(); });
    });
    dlg.querySelector('.lb-x').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.lb-p').addEventListener('click', function () { show(i - 1); });
    dlg.querySelector('.lb-n').addEventListener('click', function () { show(i + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb-fig')) dlg.close(); });
    dlg.addEventListener('close', function () { img.removeAttribute('src'); if (back) back.focus(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
    var sx = null;
    dlg.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
      sx = null;
    }, { passive: true });
  }

  /* ── YouTube μόνο με πάτημα (καμία κλήση στην Google πριν) */
  document.querySelectorAll('.yt').forEach(function (box) {
    box.querySelector('button').addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.getAttribute('data-yt')) + '?autoplay=1&rel=0';
      f.title = 'Βίντεο YouTube';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      box.innerHTML = ''; box.appendChild(f); f.focus();
    });
  });

  /* ── χάρτης μόνο με πάτημα */
  document.querySelectorAll('.map[data-map]').forEach(function (box) {
    var b = box.querySelector('button');
    if (!b) return;
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-map');
      f.title = 'Χάρτης: θέση του σχολείου';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.innerHTML = ''; box.appendChild(f);
    });
  });
})();

/* ── Οριζόντιες σειρές καρτών: βελάκια, μπάρα προόδου, σύρσιμο με ποντίκι, πληκτρολόγιο (12/11/2026) */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-slider]').forEach(function (s) {
    var t = s.querySelector('.sl-track'), ctl = s.querySelector('.sl-ctl'), pr = s.querySelector('.sl-prev'), nx = s.querySelector('.sl-next'), bar = s.querySelector('.sl-bar span');
    if (!t || !ctl) return;
    s.classList.add('js-sl');
    var raf = 0;
    function upd() {
      raf = 0;
      var max = t.scrollWidth - t.clientWidth;
      if (max < 4) { ctl.hidden = true; return; }
      ctl.hidden = false;
      var w = t.clientWidth / t.scrollWidth, x = Math.max(0, Math.min(1, t.scrollLeft / max));
      bar.style.width = (w * 100).toFixed(2) + '%';
      bar.style.transform = 'translateX(' + (x * (1 / w - 1) * 100).toFixed(2) + '%)';
      pr.disabled = t.scrollLeft < 4; nx.disabled = t.scrollLeft > max - 4;
    }
    function bima() { var k = t.firstElementChild; if (!k) return t.clientWidth; return k.getBoundingClientRect().width + (parseFloat(getComputedStyle(t).columnGap) || 0); }
    function pame(d) { var b = bima(), g = parseFloat(getComputedStyle(t).columnGap) || 0, n = Math.max(1, Math.floor((t.clientWidth + g + 4) / b)); t.scrollBy({ left: d * b * n, behavior: reduce ? 'auto' : 'smooth' }); }
    pr.addEventListener('click', function () { pame(-1); });
    nx.addEventListener('click', function () { pame(1); });
    t.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    t.addEventListener('keydown', function (e) {
      if (e.target !== t) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); pame(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); pame(-1); }
    });
    /* σύρσιμο με το ποντίκι (στην αφή και στο touchpad η κύλιση είναι ήδη φυσική) */
    var dr = null;
    t.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; dr = { x: e.clientX, l: t.scrollLeft, m: false }; });
    window.addEventListener('pointermove', function (e) {
      if (!dr) return;
      var dx = e.clientX - dr.x;
      if (!dr.m && Math.abs(dx) > 6) { dr.m = true; t.classList.add('sl-drag'); }
      if (dr.m) t.scrollLeft = dr.l - dx;
    });
    t.addEventListener('dragstart', function (e) { e.preventDefault(); });   // αλλιώς ο περιηγητής «σηκώνει» τη φωτογραφία/σύνδεσμο και χάνεται το σύρσιμο
    function telos() {
      if (!dr) return; var m = dr.m; dr = null;
      if (m) { t.classList.remove('sl-drag'); var b = bima(); t.scrollTo({ left: Math.round(t.scrollLeft / b) * b, behavior: reduce ? 'auto' : 'smooth' });
        var st = function (e) { e.preventDefault(); e.stopPropagation(); }; t.addEventListener('click', st, true); setTimeout(function () { t.removeEventListener('click', st, true); }, 60);
        setTimeout(function () { t.classList.remove('sl-drag'); }, 0); }
    }
    window.addEventListener('pointerup', telos); window.addEventListener('pointercancel', telos);
    upd();
  });
})();

/* αριθμοί που μετρούν από το 0 όταν φανούν (μία φορά)· χωρίς JS ή με μειωμένη κίνηση: ο τελικός αριθμός */
(function () {
  var el = document.querySelectorAll('[data-count]');
  if (!el.length || !document.documentElement.classList.contains('anim-ready') || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (ent) {
    ent.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var b = e.target, n = +b.getAttribute('data-count') || 0, t0 = null, d = Math.min(1400, 500 + n * 60);
      setTimeout(function () {
        requestAnimationFrame(function step(now) {
          if (t0 === null) t0 = now;
          var x = Math.min(1, (now - t0) / d), k = 1 - Math.pow(1 - x, 3);
          b.textContent = String(Math.round(n * k));
          if (x < 1) requestAnimationFrame(step);
        });
      }, 250);
    });
  }, { threshold: 0.6 });
  el.forEach(function (b) { b.setAttribute('aria-label', b.textContent); b.textContent = '0'; io.observe(b); });
})();
