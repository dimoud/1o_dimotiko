"""Κέλυφος σελίδας: <head>, κεφαλίδα, μενού, υποσέλιδο — ΜΙΑ πηγή για όλες τις σελίδες (κανόνες 12–13)."""
import html
import json
import re
import unicodedata

esc = lambda s: html.escape(str(s or ''), quote=True)

MINES = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου',
         'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
MINES_SYNT = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ']

ENOTITES = {
    'anakoinoseis': 'Ανακοινώσεις',
    'draseis': 'Εκπαιδευτικές δράσεις',
    'episkepseis': 'Εκπαιδευτικές επισκέψεις',
    'giortes': 'Γιορτές και εκδηλώσεις',
    'dimiourgies': 'Μαθητικές δημιουργίες',
    'synergasies': 'Συνεργασίες με φορείς',
    'perivallon': 'Περιβαλλοντικές δράσεις',
    'kipos': 'Σχολικός κήπος',
    'energos-politis': 'Δράσεις Ενεργού Πολίτη',
    'diagonismoi': 'Διαγωνισμοί και διακρίσεις',
    'goneis': 'Ενημερώσεις γονέων',
}


def url_enotitas(k):
    if k == 'diagonismoi':
        return '/diagonismoi/'
    if k == 'goneis':
        return '/goneis/enimeroseis/'
    return f'/zoi/{k}/'


def imerominia(d, plires=True):
    y, m, dd = int(d[:4]), int(d[5:7]), int(d[8:10])
    return f'{dd} {MINES[m - 1]} {y}' if plires else f'{dd} {MINES_SYNT[m - 1]}'


_TR = {'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k',
       'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't',
       'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o'}


def slug(keimeno, mikos=70):
    """Ελληνικά → λατινικά (ΕΛΟΤ 743 απλοποιημένο), για διευθύνσεις που δεν σπάνε σε κανένα πρόγραμμα."""
    s = unicodedata.normalize('NFD', keimeno.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('ου', 'ou').replace('μπ', 'b').replace('ντ', 'nt').replace('γγ', 'ng')
    s = ''.join(_TR.get(c, c) for c in s)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    if len(s) > mikos:
        s = s[:mikos].rsplit('-', 1)[0]
    return s or 'selida'


def menou(dom):
    """dom: λίστα (τίτλος, url, [(τίτλος, url)]) — από τα δεδομένα, ώστε άδειες ενότητες να μη φαίνονται."""
    items = []
    for i, (titlos, url, paidia) in enumerate(dom):
        if paidia:
            sub = ''.join(f'<li><a href="{esc(u)}">{esc(t)}</a></li>' for t, u in paidia)
            items.append(
                f'<li class="has-sub" data-url="{esc(url)}"><a href="{esc(url)}">{esc(titlos)}</a>'
                f'<button class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub{i}">'
                f'<span class="sr-only">Υπομενού: {esc(titlos)}</span><svg aria-hidden="true" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4"/></svg></button>'
                f'<ul class="sub" id="sub{i}">{sub}</ul></li>')
        else:
            items.append(f'<li data-url="{esc(url)}"><a href="{esc(url)}">{esc(titlos)}</a></li>')
    return ''.join(items)


def kefalida(r, nav_html):
    return f'''<a class="skip" href="#kyrio">Μετάβαση στο περιεχόμενο</a>
<header class="site-head">
 <div class="head-top wrap">
  <a class="brand" href="/" aria-label="{esc(r['onoma'])}, αρχική σελίδα">
   <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><defs><linearGradient id="bmG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a8fd6"/><stop offset="1" stop-color="#1e64a8"/></linearGradient></defs><circle cx="32" cy="32" r="31" fill="url(#bmG)"/><circle cx="32" cy="32" r="27.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/><g stroke="#ffc94d" stroke-width="2.2" stroke-linecap="round"><path d="M14.5 20.5l3 1.2M49.5 20.5l-3 1.2M18.5 11.5l2 2.6M45.5 11.5l-2 2.6"/></g><path d="M29.6 9.2h5.6v26.3h-5.6V15.6l-4.6 2.5-1.6-4.4z" fill="#fff"/><circle cx="41.6" cy="13.2" r="3.3" fill="none" stroke="#ffc94d" stroke-width="2.3"/><path d="M32 40c-6-4-13-4.6-20-2.6v12.4c7-2 14-1.4 20 2.6z" fill="#f08a6c"/><path d="M32 40c6-4 13-4.6 20-2.6v12.4c-7-2-14-1.4-20 2.6z" fill="#4fb36a"/><path d="M32 37.5c-5.6-3.8-12-4.4-18.5-2.6v11.6c6.5-1.8 12.9-1.2 18.5 2.6z" fill="#fff"/><path d="M32 37.5c5.6-3.8 12-4.4 18.5-2.6v11.6c-6.5-1.8-12.9-1.2-18.5 2.6z" fill="#f3f8ff"/><path d="M32 37.5v11.6" stroke="#1e64a8" stroke-width="1.2"/><path d="M18 39.4c3.6-.7 7-.3 10 1M18 43c3.6-.7 7-.3 10 1M36 40.4c3-1.3 6.4-1.7 10-1M36 44c3-1.3 6.4-1.7 10-1" stroke="#9fb8d3" stroke-width="1.1" stroke-linecap="round" fill="none"/></svg>
</span>
   <span class="brand-txt"><span class="brand-name">{esc(r['onoma'])}</span><span class="brand-sub">{esc(r['periochi'])}</span></span>
  </a>
  <div class="head-tools">
   <a class="head-search" href="/anazitisi/" aria-label="Αναζήτηση"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg><span>Αναζήτηση</span></a>
   <a class="head-tel" href="tel:{esc(r['tilefono'].replace(' ', ''))}" aria-label="Τηλέφωνο σχολείου {esc(r['tilefono'])}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg><span>{esc(r['tilefono'])}</span></a>
   <button id="hamburger" class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav" aria-label="Μενού"><span class="bars" aria-hidden="true"></span><span class="nav-toggle-txt">Μενού</span></button>
  </div>
 </div>
 <nav id="nav" aria-label="Κύριο μενού">
  <div class="nav-panel" id="navLinks">
   <div class="nav-panel-head"><span>Μενού</span><button class="nav-close" type="button" aria-label="Κλείσιμο μενού">×</button></div>
   <ul class="nav-list wrap">{nav_html}</ul>
  </div>
 </nav>
</header>'''


def ypo(r, etos):
    cookies = ' · <a class="foot-admin" href="#" data-cc-open>Ρυθμίσεις cookies</a>' if r.get('ga4') else ''
    admin = ('\n  <p><a class="foot-admin" href="/diaxeirisi/" rel="nofollow" title="Διαχείριση ιστοσελίδας" aria-label="Διαχείριση ιστοσελίδας" style="display:inline-block;padding:10px 12px;margin:-10px -12px;text-decoration:none"><span aria-hidden="true">🔒</span></a>' + cookies + '</p>') if r.get('forma_url') else ''
    email = f'<li><a href="mailto:{esc(r["email"])}">{esc(r["email"])}</a></li>' if r.get('email') else ''
    return f'''<footer class="site-foot">
 <div class="foot-art" aria-hidden="true">
  <div class="wrap foot-art-in">
   <div class="pencils">{"".join(f'<svg class="pc pc{i}" viewBox="0 0 20 90"><path d="M2 14h16v74H2z"/><path class="pc-w" d="M2 14L10 0l8 14z"/><path class="pc-t" d="M7 5.5L10 0l3 5.5z"/><path class="pc-e" d="M2 80h16v8H2z"/></svg>' for i in range(1,7))}</div>
   <svg class="kite" viewBox="0 0 120 170"><g class="kite-b"><path d="M60 4L94 52 60 92 26 52z" fill="#f2b233"/><path d="M60 4L94 52H60z" fill="#e2663f"/><path d="M60 92L26 52h34z" fill="#3fa35a"/><path d="M60 4v88M26 52h68" stroke="#14324f" stroke-width="1.6"/><path class="kite-tail" d="M60 92c-10 16 10 24 0 40s8 22 2 34" fill="none" stroke="#e7eef6" stroke-width="1.6"/><path d="M52 112l8 4-8 4zM68 128l-8 4 8 4zM53 146l8 4-8 4z" fill="#5aa9ee"/></g></svg>
  </div>
 </div>
 <div class="wrap foot-grid">
  <div>
   <p class="foot-name">{esc(r['onoma'])}</p>
   <ul class="foot-list">
    <li>{esc(r['dieythynsi'])}</li>
    <li>Τηλέφωνο <a href="tel:{esc(r['tilefono'].replace(' ', ''))}">{esc(r['tilefono'])}</a></li>{email}
   </ul>
  </div>
  <div>
   <ul class="foot-list">
    <li><a href="/zoi/anakoinoseis/">Ανακοινώσεις</a></li>
    <li><a href="/arxeio/">Αρχείο ανά σχολικό έτος</a></li>
    <li><a href="/goneis/">Γονείς και κηδεμόνες</a></li>
    <li><a href="/epikoinonia/">Επικοινωνία και χάρτης</a></li>
   </ul>
  </div>
  <div>
   <ul class="foot-list">
    <li><a href="/prosvasimotita/">Δήλωση προσβασιμότητας</a></li>
    <li><a href="/aporrito/">Απόρρητο και cookies</a></li>
    <li><a href="/anazitisi/">Αναζήτηση</a></li>
   </ul>
  </div>
 </div>
 <div class="wrap foot-base">
  <p>Τα κείμενα και οι φωτογραφίες ανήκουν στη σχολική μονάδα· η αναδημοσίευση φωτογραφιών μαθητών δεν επιτρέπεται.</p>{admin}
 </div>
 <hr class="ec-rule">
 <div class="expertease-credit">
  <div class="ec-layer ec-layer--credit">
   <span class="ec-copy">© {etos} · Με επιφύλαξη παντός δικαιώματος</span>
   <span class="ec-divider"></span>
   <a href="https://expertease.eu/webdesign" target="_blank" rel="noopener" class="ec-brand">
    <span class="ec-label">Designed by</span>
    <img src="/static/logo_expertease.png" alt="" class="ec-logo" width="20" height="20">
    <span class="ec-name">Expertease Designs</span><span class="sr-only"> (ανοίγει σε νέα καρτέλα)</span>
   </a>
  </div>
  <div class="ec-layer ec-layer--ad" aria-hidden="true">
   <div class="ec-ad-ring"><div class="ec-ad-logo"><img src="/static/logo_expertease.png" alt=""></div></div>
   <div class="ec-ad-text">
    <span class="ec-ad-question">Like this site?</span>
    <a href="https://expertease.eu/webdesign" target="_blank" rel="noopener" class="ec-ad-cta" tabindex="-1">Let's build yours
     <span class="ec-ad-arrow"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="6.5" x2="11" y2="6.5"/><polyline points="7,2.5 11,6.5 7,10.5"/></svg></span></a>
   </div>
  </div>
 </div>
</footer>'''


def omada_xromatos(path):
    """Χρώμα ενότητας: ίδια σειρά παντού (γαλάζιο · πράσινο · ήλιος · κοραλλί · λιλά)."""
    for pre, c in (('/sxoleio/', 'g1'), ('/zoi/', 'g2'), ('/anartiseis/', 'g2'), ('/arxeio/', 'g2'), ('/diktya/', 'g3'),
                   ('/goneis/', 'g4'), ('/diagonismoi/', 'g5'), ('/syndesmoi/', 'g1'), ('/epikoinonia/', 'g2')):
        if path.startswith(pre):
            return c
    return 'g1'


GA_HEAD = ("<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
           "gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});</script>\n")


def selida(*, r, nav_html, titlos, perigrafi, path, soma, h1_titlos=None, ld=None, og_eikona='', extra_tail='',
           diadromi=None, etos=2026, extra_head='', robots='index,follow', lorida=''):
    """Πλήρης σελίδα HTML. path: σχετική διεύθυνση π.χ. /zoi/anakoinoseis/."""
    tomeas = r['tomeas'].rstrip('/')
    ga_attr = ' data-ga="' + esc(r['ga4']) + '"' if r.get('ga4') else ''
    ga_head = GA_HEAD if r.get('ga4') else ''
    ga_tail = '<script src="/static/consent.js?v={V}" defer></script>\n' if r.get('ga4') else ''
    titlos_tab = titlos if path == '/' else f'{titlos} | {r["onoma"]}'
    crumbs = ''
    if diadromi:
        li = ''.join(f'<li><a href="{esc(u)}">{esc(t)}</a></li>' for t, u in diadromi)
        crumbs = f'<div class="crumbs wrap" role="navigation" aria-label="Διαδρομή"><ol><li><a href="/">Αρχική</a></li>{li}</ol></div>'
    lds = ''
    for x in (ld or []):
        lds += '<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>\n'
    og = f'<meta property="og:image" content="{esc(tomeas + og_eikona)}">' if og_eikona else ''
    return f'''<!DOCTYPE html>
<html lang="el"{ga_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(titlos_tab)}</title>
<meta name="description" content="{esc(perigrafi)}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{esc(tomeas + path)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="el_GR">
<meta property="og:site_name" content="{esc(r['onoma'])}">
<meta property="og:title" content="{esc(titlos)}">
<meta property="og:description" content="{esc(perigrafi)}">
<meta property="og:url" content="{esc(tomeas + path)}">
{og}
<meta name="theme-color" content="#1e64a8">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/static/fonts/commissioner-greek-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/static/fonts/commissioner-greek-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/static/site.css?v={{V}}">
<link rel="stylesheet" href="/static/expertease-credit.css?v={{V}}">
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('anim-ready');setTimeout(function(){{document.documentElement.classList.add('rv-fallback')}},2500)</script>
{ga_head}{extra_head}{lds}</head>
<body class="{omada_xromatos(path)}">
<div class="read-pencil" aria-hidden="true"></div>
{kefalida(r, nav_html)}
<main id="kyrio" tabindex="-1">
{crumbs}
{soma}
</main>
{f'<aside class="net-strip" aria-label="Τα Δίκτυα και τα Προγράμματά μας"><div class="wrap"><p class="ns-h">Τα Δίκτυα και τα Προγράμματά μας</p><ul>{lorida}</ul></div></aside>' if lorida else ''}
{ypo(r, etos)}
<script src="/static/site.js?v={{V}}" defer></script>
{ga_tail}{extra_tail}</body>
</html>
'''
