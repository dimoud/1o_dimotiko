/**
 * site-search.js - αναζήτηση στον ιστότοπο, χωρίς εξωτερική υπηρεσία
 * ════════════════════════════════════════════════════════════════════════════
 * Προέλευση: moudiotis.github.io/search.js (10/2026). Γενικεύτηκε:
 *   • η διεύθυνση του ευρετηρίου από data-index (όχι καρφωμένο '/search-index.json'),
 *   • το μήνυμα «καμία απάντηση» από data-empty-el / data-empty-en,
 *   • σημασιολογία combobox (role, aria-expanded, aria-activedescendant,
 *     listbox/option) και ανακοίνωση πλήθους σε aria-live,
 *   • ένας χειριστής click στο document, όχι ένας ανά πλαίσιο.
 * Η μηχανή βαθμολόγησης μένει ίδια με το πρωτότυπο.
 *
 * ΣΗΜΑΝΣΗ
 *   <form class="nav-search" role="search" data-site-search
 *         data-index="search-index.json"
 *         data-empty-el="Δεν βρέθηκε κάτι. Καλέστε μας: 210 000 0000"
 *         data-empty-en="No results. Call us: +30 210 000 0000">
 *     <input type="search" class="nav-search-in" aria-label="Αναζήτηση στον ιστότοπο">
 *     <div class="nav-search-res" hidden></div>
 *     <p class="visually-hidden" aria-live="polite" data-search-status></p>
 *   </form>
 *   Προαιρετικά: <button class="search-toggle" aria-controls="siteSearch"> και
 *   ένα #siteSearch[hidden] που περιέχει τη φόρμα (αναδυόμενο πάνελ).
 *
 * ΕΥΡΕΤΗΡΙΟ: το παράγει το build_search_index.py από τα HTML του ιστότοπου.
 *   [{ u: "/selida/", l: "el"|"en", t: "τίτλος", d: "περιγραφή", k: "επικεφαλίδες · …" }]
 *   Χωρίς γεννήτρια το εξάρτημα δεν ξαναχρησιμοποιείται — γι' αυτό ταξιδεύουν μαζί.
 *
 * ΚΑΘΟΛΙΚΟ: window.SiteSearch = { search(q, lang) } (για δοκιμές)
 * ════════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-site-search]'));
    var MAX = 6;
    var cache = {};            /* ανά διεύθυνση ευρετηρίου */
    var uid = 0;

    function lang() { return (document.documentElement.lang || 'el').slice(0, 2) === 'en' ? 'en' : 'el'; }

    /* Αναδίπλωση: πεζά, χωρίς τόνους ΚΑΙ διαλυτικά (NFD + αφαίρεση U+0300–U+036F),
       τελικό σίγμα = σίγμα. «Κοτόπουλο», «κοτοπουλο», «ΚΟΤΌΠΟΥΛΟ» ταιριάζουν. */
    function norm(s) {
        return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ');
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    function load(url) {
        if (cache[url] && cache[url].data) return Promise.resolve(cache[url].data);
        if (!cache[url]) {
            cache[url] = { p: fetch(url, { cache: 'no-cache' })
                .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(function (d) {
                    var data = d.map(function (p) { return { p: p, t: norm(p.t), d: norm(p.d), k: norm(p.k) }; });
                    cache[url].data = data;
                    return data;
                })
                .catch(function () { delete cache[url]; return []; }) };
        }
        return cache[url].p;
    }

    /* Βαθμολόγηση (αυτούσια από το πρωτότυπο):
       τίτλος 8 · ρίζα στον τίτλο 6 · ρίζα στην περιγραφή 3 · ρίζα στις επικεφαλίδες 2.
       «Ρίζα» = η λέξη χωρίς το τελευταίο γράμμα, αν έχει > 4 γράμματα.
       ΚΑΘΕ λέξη πρέπει να βρεθεί κάπου (λογικό ΚΑΙ). Μικρότερος τίτλος κερδίζει ισοπαλία. */
    function rank(idx, q, l) {
        var words = norm(q).split(/[^0-9a-zα-ω.]+/).filter(function (w) { return w.length > 1; });
        if (!words.length) return [];
        return idx.filter(function (x) { return x.p.l === l; }).map(function (x) {
            var s = 0;
            for (var i = 0; i < words.length; i++) {
                var w = words[i], stem = w.length > 4 ? w.slice(0, -1) : w, hit = 0;
                if (x.t.indexOf(w) >= 0) hit = 8;
                else if (x.t.indexOf(stem) >= 0) hit = 6;
                else if (x.d.indexOf(stem) >= 0) hit = 3;
                else if (x.k.indexOf(stem) >= 0) hit = 2;
                if (!hit) return null;
                s += hit;
            }
            return { p: x.p, s: s - x.t.length / 100 };
        }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, MAX);
    }

    boxes.forEach(function (box) {
        var inp = box.querySelector('input');
        var res = box.querySelector('.nav-search-res');
        var live = box.querySelector('[data-search-status]');
        if (!inp || !res) return;
        var url = box.getAttribute('data-index') || 'search-index.json';
        var id = 'ss' + (++uid);
        var sel = -1, cur = [];

        res.id = res.id || id + '-list';
        res.setAttribute('role', 'listbox');
        inp.setAttribute('role', 'combobox');
        inp.setAttribute('aria-autocomplete', 'list');
        inp.setAttribute('aria-controls', res.id);
        inp.setAttribute('aria-expanded', 'false');

        function close() {
            res.hidden = true; box.classList.remove('has-res');
            inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant');
        }
        function empty() {
            return box.getAttribute('data-empty-' + lang()) ||
                   (lang() === 'en' ? 'No results.' : 'Δεν βρέθηκε κάτι.');
        }
        function render() {
            var q = inp.value.trim();
            if (q.length < 2) { close(); if (live) live.textContent = ''; return; }
            load(url).then(function (idx) {
                if (inp.value.trim() !== q) return;          /* έφτασε παλιά απάντηση */
                cur = rank(idx, q, lang()); sel = -1;
                res.innerHTML = cur.length ? cur.map(function (r, i) {
                    var d = r.p.d || '';
                    return '<a role="option" id="' + id + '-o' + i + '" aria-selected="false" href="' + esc(r.p.u) + '">' +
                           '<b>' + esc(r.p.t) + '</b><span>' + esc(d.slice(0, 110)) + (d.length > 110 ? '…' : '') + '</span></a>';
                }).join('') : '<p class="nav-search-none">' + esc(empty()) + '</p>';
                res.hidden = false; box.classList.add('has-res');
                inp.setAttribute('aria-expanded', cur.length ? 'true' : 'false');
                if (live) live.textContent = cur.length
                    ? (lang() === 'en' ? cur.length + ' results' : cur.length + ' αποτελέσματα')
                    : empty();
            });
        }
        function mark() {
            Array.prototype.forEach.call(res.querySelectorAll('[role="option"]'), function (a, i) {
                var on = i === sel;
                a.classList.toggle('is-sel', on);
                a.setAttribute('aria-selected', on ? 'true' : 'false');
                if (on) { inp.setAttribute('aria-activedescendant', a.id); a.scrollIntoView({ block: 'nearest' }); }
            });
        }
        inp.addEventListener('focus', function () { load(url); });
        inp.addEventListener('input', render);
        inp.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' && cur.length) { sel = Math.min(sel + 1, cur.length - 1); mark(); e.preventDefault(); }
            else if (e.key === 'ArrowUp' && cur.length) { sel = Math.max(sel - 1, 0); mark(); e.preventDefault(); }
            else if (e.key === 'Enter') { var r = cur[sel >= 0 ? sel : 0]; if (r) location.href = r.p.u; e.preventDefault(); }
            else if (e.key === 'Escape') { inp.value = ''; close(); }
        });
        box.addEventListener('submit', function (e) { e.preventDefault(); });
        /* μέσα στο συρτάρι κινητού: το άγγιγμα στην αναζήτηση να μην κλείνει το μενού */
        box.addEventListener('click', function (e) { e.stopPropagation(); });
        box.__close = close;
    });

    document.addEventListener('click', function (e) {
        boxes.forEach(function (b) { if (b.__close && !b.contains(e.target)) b.__close(); });
    });

    /* Προαιρετικό αναδυόμενο πάνελ: κουμπί-μεγεθυντικός + #siteSearch */
    var tg = document.querySelector('.search-toggle');
    var panel = tg && document.getElementById(tg.getAttribute('aria-controls') || 'siteSearch');
    if (tg && panel) {
        var pin = panel.querySelector('input');
        var url0 = (panel.querySelector('[data-site-search]') || {}).getAttribute
            ? panel.querySelector('[data-site-search]').getAttribute('data-index') || 'search-index.json' : 'search-index.json';
        var setP = function (on) {
            panel.hidden = !on;
            tg.setAttribute('aria-expanded', on ? 'true' : 'false');
            tg.classList.toggle('is-on', on);
            if (on) { load(url0); setTimeout(function () { if (pin) pin.focus(); }, 30); }
        };
        tg.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); setP(panel.hidden); });
        document.addEventListener('click', function (e) {
            if (!panel.hidden && !panel.contains(e.target) && !tg.contains(e.target)) setP(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hidden) { setP(false); tg.focus(); }
        });
    }

    window.SiteSearch = {
        search: function (q, l, url) {
            return load(url || 'search-index.json').then(function (idx) { return rank(idx, q, l || lang()); });
        },
        norm: norm
    };
})();
