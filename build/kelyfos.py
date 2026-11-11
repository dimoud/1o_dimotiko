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
   <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><rect x="3" y="15" width="34" height="22" rx="3"/><path d="M1 17L20 4l19 13"/><rect x="16" y="24" width="8" height="13" rx="1.5"/></svg></span>
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
    email = f'<li><a href="mailto:{esc(r["email"])}">{esc(r["email"])}</a></li>' if r.get('email') else ''
    return f'''<footer class="site-foot">
 <div class="wrap foot-grid">
  <div>
   <p class="foot-name">{esc(r['onoma'])}</p>
   <ul class="foot-list">
    <li>{esc(r['dieythynsi'])}</li>
    <li>Τηλέφωνο <a href="tel:{esc(r['tilefono'].replace(' ', ''))}">{esc(r['tilefono'])}</a></li>
    <li>Fax {esc(r['fax'])}</li>{email}
   </ul>
  </div>
  <div>
   <p class="foot-h">Γρήγορα</p>
   <ul class="foot-list">
    <li><a href="/zoi/anakoinoseis/">Ανακοινώσεις</a></li>
    <li><a href="/arxeio/">Αρχείο ανά σχολικό έτος</a></li>
    <li><a href="/goneis/">Γονείς και κηδεμόνες</a></li>
    <li><a href="/epikoinonia/">Επικοινωνία και χάρτης</a></li>
   </ul>
  </div>
  <div>
   <p class="foot-h">Πληροφορίες</p>
   <ul class="foot-list">
    <li><a href="/prosvasimotita/">Δήλωση προσβασιμότητας</a></li>
    <li><a href="/aporrito/">Απόρρητο και cookies</a></li>
    <li><a href="/anazitisi/">Αναζήτηση</a></li>
   </ul>
  </div>
 </div>
 <div class="wrap foot-base">
  <p>© {etos} {esc(r['onoma'])}. Τα κείμενα και οι φωτογραφίες ανήκουν στη σχολική μονάδα· η αναδημοσίευση φωτογραφιών μαθητών δεν επιτρέπεται.</p>
  <p class="credit">Σχεδιασμός <a href="https://expertease.eu/webdesign/" target="_blank" rel="noopener">Expertease Designs<span class="sr-only"> (ανοίγει σε νέα καρτέλα)</span></a></p>
 </div>
</footer>'''


def selida(*, r, nav_html, titlos, perigrafi, path, soma, h1_titlos=None, ld=None, og_eikona='',
           diadromi=None, etos=2026, extra_head='', robots='index,follow', lorida=''):
    """Πλήρης σελίδα HTML. path: σχετική διεύθυνση π.χ. /zoi/anakoinoseis/."""
    tomeas = r['tomeas'].rstrip('/')
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
<html lang="el">
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
{extra_head}{lds}</head>
<body>
{kefalida(r, nav_html)}
<main id="kyrio" tabindex="-1">
{crumbs}
{soma}
</main>
{f'<aside class="net-strip" aria-label="Τα Δίκτυα και τα Προγράμματά μας"><div class="wrap"><p class="ns-h">Τα Δίκτυα και τα Προγράμματά μας</p><ul>{lorida}</ul></div></aside>' if lorida else ''}
{ypo(r, etos)}
<script src="/static/site.js?v={{V}}" defer></script>
</body>
</html>
'''
