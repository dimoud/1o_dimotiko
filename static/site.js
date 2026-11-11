/* 1ο Δημοτικό Σχολείο Πολίχνης — μενού κινητού (K11), ενεργό στοιχείο μενού, προβολή φωτογραφιών,
   βίντεο YouTube και χάρτης μόνο με πάτημα. Καμία αυτόματη κίνηση. */
(function () {
  'use strict';
  var body = document.body;
  var tog = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.nav-panel');
  var mq = window.matchMedia('(max-width: 1180px)');

  /* ── ενεργό στοιχείο μενού */
  var path = location.pathname;
  document.querySelectorAll('.nav-list > li').forEach(function (li) {
    var u = li.getAttribute('data-url');
    if (u && (u === '/' ? path === '/' : path.indexOf(u) === 0)) {
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
