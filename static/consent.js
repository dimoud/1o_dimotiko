/* consent.js — Συγκατάθεση cookies (GDPR) με Google Consent Mode v2     — v2
 * ──────────────────────────────────────────────────────────────────────────
 * - Προεπιλογή: ΟΛΑ τα σήματα «denied» (γράφεται στο <head> του index).
 * - «Αποδοχή» δίνει ΜΟΝΟ analytics_storage — η μπάρα μιλά για cookies
 *   ανάλυσης· τα διαφημιστικά σήματα μένουν «denied» (δεν τα ζητήσαμε).
 * - Το GA4 κατεβαίνει μόνο μετά τη συγκατάθεση.
 * - Ανάκληση: κάθε στοιχείο με [data-cc-open] ξανανοίγει τη μπάρα
 *   (υποχρέωση GDPR: η ανάκληση όσο εύκολη όσο η παροχή — άρθρο 7§3).
 * - Αλλάζει γλώσσα με το συμβάν 'langchange' του i18n.js.
 * - Αυτόματα συμβάντα click_tel / click_email / book_call (μέσω ccEvent).
 * - Άρνηση ⇒ αδειάζει η ουρά· ανάκληση μετά από αποδοχή ⇒ ανανέωση σελίδας.
 * - Χωρίς GA_ID: καμία μπάρα, κρυμμένα τα [data-cc-open] (δεν υπάρχει τι να συναινέσεις).
 * - Όσο η μπάρα είναι ανοιχτή, το body παίρνει padding-bottom ίσο με το ύψος της.
 * - Ασφαλής αποθήκευση: αν το localStorage πετάει εξαίρεση, απλώς ξαναρωτά.
 * ────────────────────────────────────────────────────────────────────────── */
(function () {
    if (window.__PRERENDER) return;              /* το prerender.py δεν «φωτογραφίζει» τη μπάρα */

    var STORAGE_KEY = 'dim1pol_consent';
    var GA_ID       = document.documentElement.getAttribute('data-ga') || '';

    /* Χωρίς αναγνωριστικό μέτρησης δεν υπάρχει τίποτα να συναινέσει κανείς: καμία
       μπάρα, και οι σύνδεσμοι «Ρυθμίσεις cookies» κρύβονται (από vaiosliapis, 10/2026).
       Μπάρα για cookies που δεν υπάρχουν είναι θόρυβος και κάνει τον ιστότοπο να
       μοιάζει ότι παρακολουθεί. Το ccEvent μένει, ώστε τα άλλα σενάρια να μη σπάνε. */
    if (!GA_ID) {
        window.ccEvent = function () {};
        window.ccOpen  = function () {};
        var hideLinks = function () {
            Array.prototype.forEach.call(document.querySelectorAll('[data-cc-open]'), function (el) { el.hidden = true; });
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideLinks); else hideLinks();
        return;
    }

    function sget()  { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } }
    function sset(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* μη διαθέσιμο */ } }
    function lang()  { var l = (document.documentElement.lang || 'el').substring(0, 2); return l === 'en' ? 'en' : 'el'; }

    var copy = {
        el: { title: 'Χρησιμοποιούμε cookies',
              body:  'Με τη συγκατάθεσή σας χρησιμοποιούμε cookies ανάλυσης (Google Analytics) για να δούμε πώς χρησιμοποιείται ο ιστότοπος. Δεν χρησιμοποιούμε διαφημιστικά cookies. Μπορείτε να αλλάξετε γνώμη όποτε θέλετε από το «Ρυθμίσεις cookies» στο κάτω μέρος της σελίδας.',
              short: 'Cookies ανάλυσης (Google Analytics) μόνο με τη συγκατάθεσή σας· αλλάζει από το «Ρυθμίσεις cookies».',
              accept: 'Αποδοχή', reject: 'Απόρριψη' },
        en: { title: 'We use cookies',
              body:  'With your consent we use analytics cookies (Google Analytics) to see how the site is used. We do not use advertising cookies. You can change your mind at any time via “Cookie settings” at the bottom of the page.',
              short: 'Analytics cookies (Google Analytics) only with your consent; change it via “Cookie settings”.',
              accept: 'Accept', reject: 'Decline' },
    };

    var css =
        '#cc-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#0f172a;color:#f8faff;' +
        'font-family:inherit,sans-serif;font-size:14px;line-height:1.5;padding:18px 24px;display:flex;gap:16px;' +
        'align-items:center;flex-wrap:wrap;box-shadow:0 -2px 16px rgba(0,0,0,.35)}' +
        '#cc-banner[hidden]{display:none}#cc-text{flex:1;min-width:200px}' +
        '#cc-text strong{display:block;font-size:15px;margin-bottom:4px;color:#fff}' +
        '#cc-btns{display:flex;gap:10px;flex-shrink:0}' +
        '#cc-accept,#cc-reject{min-height:44px;padding:10px 22px;border-radius:4px;font-size:14px;font-weight:600;cursor:pointer}' +
        /* Ίση βαρύτητα στα δύο κουμπιά — όχι «σκοτεινό μοτίβο» υπέρ της αποδοχής */
        '#cc-accept{background:#f8faff;color:#0f172a;border:1px solid #f8faff}' +
        '#cc-reject{background:#f8faff;color:#0f172a;border:1px solid #f8faff}' +
        '#cc-accept:hover,#cc-reject:hover{opacity:.85}' +
        '.cc-short{display:none}' +
        /* v2.11 (ΜΗ-03): στο κινητό η μπάρα είναι ΣΥΜΠΑΓΗΣ — μικρότερη από το κείμενο του hero,
           ώστε να μη γίνεται αυτή το LCP και να μη σκεπάζει το κουμπί κλήσης */
        '@media(max-width:768px){#cc-banner{padding:10px 14px;gap:10px;font-size:13px;line-height:1.4}' +
        '#cc-text strong{display:none}.cc-long{display:none}.cc-short{display:inline}' +
        '#cc-btns{width:100%}#cc-accept,#cc-reject{flex:1;padding:8px 12px}}';
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var banner = document.createElement('div');
    banner.id = 'cc-banner';
    banner.setAttribute('role', 'region');
    banner.hidden = true;
    document.body.appendChild(banner);

    function render() {
        var t = copy[lang()];
        banner.setAttribute('aria-label', t.title);
        banner.innerHTML =
            '<div id="cc-text"><strong>' + t.title + '</strong><span class="cc-long">' + t.body +
            '</span><span class="cc-short">' + t.short + '</span></div>' +
            '<div id="cc-btns"><button type="button" id="cc-reject">' + t.reject + '</button>' +
            '<button type="button" id="cc-accept">' + t.accept + '</button></div>';
        document.getElementById('cc-accept').onclick = function () { choose('granted'); };
        document.getElementById('cc-reject').onclick = function () { choose('denied'); };
    }
    document.addEventListener('langchange', render);

    function update(granted) {
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                analytics_storage:  granted ? 'granted' : 'denied',
                ad_storage:         'denied',
                ad_user_data:       'denied',
                ad_personalization: 'denied',
            });
        }
        if (granted && GA_ID && !document.getElementById('ga4-script')) {
            var s = document.createElement('script');
            s.id = 'ga4-script'; s.async = true;
            if (GA_ID.indexOf('GTM-') === 0) {        /* Google Tag Manager: το GA4 ρυθμίζεται μέσα στο container */
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GA_ID;
                document.head.appendChild(s);
                gtag('js', new Date());
            } else {
                s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
                document.head.appendChild(s);
                gtag('js', new Date());
                gtag('config', GA_ID);             /* το anonymize_ip δεν κάνει τίποτα στο GA4 */
            }
            flush();
        }
    }

    var queue = [];
    function flush() {
        if (typeof gtag !== 'function') return;
        queue.forEach(function (ev) { gtag('event', ev.name, ev.params); });
        queue = [];
    }
    window.ccEvent = function (name, params) {
        var st = sget();
        if (st === 'granted' && typeof gtag === 'function') gtag('event', name, params || {});
        else if (st !== 'denied') queue.push({ name: name, params: params || {} });
    };

    function choose(v) {
        var before = sget();
        sset(v);
        banner.hidden = true;
        pad();
        if (v === 'denied') queue = [];           /* ό,τι μαζεύτηκε πριν την άρνηση πετιέται */
        update(v === 'granted');
        /* Ανάκληση μετά από αποδοχή: το GA έχει ήδη φορτώσει — ανανέωση για καθαρή κατάσταση */
        if (before === 'granted' && v === 'denied' && document.getElementById('ga4-script')) location.reload();
    }
    /* Η μπάρα είναι position:fixed: χωρίς χώρο στο κάτω μέρος σκεπάζει το υποσέλιδο
       και την μπάρα κλήσης στο κινητό (από vaiosliapis, 10/2026). */
    function pad() { document.body.style.paddingBottom = banner.hidden ? '' : banner.offsetHeight + 'px'; }
    window.addEventListener('resize', function () { if (!banner.hidden) pad(); });
    document.addEventListener('langchange', function () { if (!banner.hidden) pad(); });
    function open() { render(); banner.hidden = false; pad(); }
    window.ccOpen = open;
    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest('[data-cc-open]');
        if (el) { e.preventDefault(); open(); }
    });

    /* Αυτόματα συμβάντα επαφής (από malliaris/consent.js, 10/2026). Περνούν από
       το ccEvent, άρα σέβονται τη συγκατάθεση. Μετρούν ό,τι πληρώνει ο πελάτης:
       κλήσεις, email, κρατήσεις ραντεβού. */
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (href.indexOf('tel:') === 0)            window.ccEvent('click_tel',   { link_url: href, page_path: location.pathname });
        else if (href.indexOf('mailto:') === 0)    window.ccEvent('click_email', { page_path: location.pathname });
        else if (href.indexOf('calendly.com') !== -1) window.ccEvent('book_call', { page_path: location.pathname });
    }, { passive: true });

    var stored = sget();
    if (stored === 'granted') update(true);
    else if (stored === 'denied') update(false);
    else open();
})();
