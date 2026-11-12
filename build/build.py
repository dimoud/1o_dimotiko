#!/usr/bin/env python3
"""Γεννήτρια του ιστότοπου του 1ου Δημοτικού Σχολείου Πολίχνης.

    python3 build/build.py                     (προεπιλογές: periexomeno/ → meson/ → _site/)

--dedomena : anartiseis.json (+ selides-wp.json, κείμενα σελίδων από το παλιό WordPress). Προεπιλογή periexomeno/.
             Στο δεύτερο βήμα (διαχείριση από το σχολείο) τον γράφει σενάριο από το Φύλλο Google.
--meson    : fotografies/<διαδρομή>-{800,1600}.webp + fotografies/diastaseis.json + arxeia/<διαδρομή>. Προεπιλογή meson/.
--out      : ο έτοιμος ιστότοπος (στατικό HTML). Δεν μπαίνει στο git· τον χτίζει το GitHub Actions σε κάθε push.
Τα σταθερά κείμενα (σελίδες, δίκτυα, σύνδεσμοι, ρυθμίσεις) είναι στο periexomeno/ — ίδια μορφή με τις καρτέλες του Φύλλου.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
from collections import OrderedDict, defaultdict
from pathlib import Path

import md
from kelyfos import ENOTITES, esc, imerominia, selida, slug, url_enotitas, menou

RIZA = Path(__file__).resolve().parent.parent
APO = '2024-01-01'          # κανόνας πελάτη: τίποτα πριν από το 2024
DIMOSIEYMENI = 'Δημοσιευμένη'


def fortose(dedomena, periexomeno):
    j = lambda p: json.load(open(p, encoding='utf-8'))
    dd, pp = Path(dedomena), Path(periexomeno)
    pick = lambda name: dd / name if (dd / name).exists() else pp / name
    an = j(dd / 'anartiseis.json')
    wp = {r['slug']: r for r in j(dd / 'selides-wp.json')} if (dd / 'selides-wp.json').exists() else {}
    sel = j(pick('selides.json'))
    for s in sel:
        if s.get('apo_wp') and s['apo_wp'] in wp and not s.get('keimeno'):
            w = wp[s['apo_wp']]
            s['keimeno'] = w['keimeno']
            s.setdefault('fotografies', w['fotografies'])
            s.setdefault('arxeia', w['arxeia'])
    return an, sel, j(pick('diktya.json')), j(pick('syndesmoi.json')), j(pick('rythmiseis.json'))


class Meson:
    """Φωτογραφίες/αρχεία: αντιγράφει ΜΟΝΟ όσα χρησιμοποιούνται και δίνει διαδρομές + διαστάσεις."""

    def __init__(self, meson, out):
        self.m, self.out = Path(meson), Path(out)
        d = self.m / 'fotografies' / 'diastaseis.json'
        self.dims = json.load(open(d)) if d.exists() else {}
        self.leipoun = []

    def eikona(self, rel):
        base = os.path.splitext(rel)[0]
        srcs = {}
        for w in (800, 1600):
            src = self.m / 'fotografies' / f'{base}-{w}.webp'
            if not src.exists():
                self.leipoun.append(rel)
                return None
            dst = self.out / 'fotografies' / f'{base}-{w}.webp'
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not dst.exists():
                shutil.copy2(src, dst)
            srcs[w] = f'/fotografies/{base}-{w}.webp'
        w, h = self.dims.get(rel, [1600, 1067])
        return {'800': srcs[800], '1600': srcs[1600], 'w': w, 'h': h}

    def arxeio(self, rel):
        src = self.m / 'arxeia' / rel
        if not src.exists():
            self.leipoun.append(rel)
            return None
        dst = self.out / 'arxeia' / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if not dst.exists():
            shutil.copy2(src, dst)
        return {'url': f'/arxeia/{rel}', 'megethos': src.stat().st_size}


def img_tag(e, alt, cls='', sizes='(max-width: 734px) 100vw, 400px', lazy=True, fetchprio=''):
    if not e:
        return ''
    fp = f' fetchpriority="{fetchprio}"' if fetchprio else ''
    lz = ' loading="lazy"' if lazy else ''
    cl = f' class="{cls}"' if cls else ''
    return (f'<img src="{e["800"]}" srcset="{e["800"]} 800w, {e["1600"]} 1600w" sizes="{sizes}" '
            f'width="{e["w"]}" height="{e["h"]}" alt="{esc(alt)}"{lz} decoding="async"{fp}{cl}>')


HERO_ROT_JS = (
    "(function(){var r=document.currentScript.previousElementSibling,S=r.querySelectorAll('.hr-s'),D=r.querySelectorAll('.hr-dot'),P=r.querySelector('.hr-p'),i=0,t=null,"
    "stop=matchMedia('(prefers-reduced-motion: reduce)').matches,paused=stop,hover=false,vis=true;"
    "function go(n){S[i].classList.remove('on');S[i].setAttribute('tabindex','-1');S[i].setAttribute('aria-hidden','true');D[i].classList.remove('on');D[i].removeAttribute('aria-current');"
    "i=(n+S.length)%S.length;S[i].classList.add('on');S[i].removeAttribute('tabindex');S[i].removeAttribute('aria-hidden');D[i].classList.add('on');D[i].setAttribute('aria-current','true');"
    "var im=S[i].querySelector('img');if(im&&im.loading==='lazy')im.loading='eager';var nx=S[(i+1)%S.length].querySelector('img');if(nx)nx.loading='eager';}"
    "function arm(){clearInterval(t);t=null;if(!paused&&!hover&&vis&&!document.hidden)t=setInterval(function(){go(i+1)},6000);}"
    "D.forEach(function(d,n){d.onclick=function(){go(n);arm();};});"
    "P.onclick=function(){paused=!paused;P.setAttribute('aria-pressed',String(paused));P.setAttribute('aria-label',paused?'Συνέχεια της εναλλαγής':'Παύση της εναλλαγής');r.classList.toggle('hr-paused',paused);arm();};"
    "if(stop){P.setAttribute('aria-pressed','true');P.setAttribute('aria-label','Συνέχεια της εναλλαγής');r.classList.add('hr-paused');}"
    "r.addEventListener('mouseenter',function(){hover=true;arm();});r.addEventListener('mouseleave',function(){hover=false;arm();});"
    "r.addEventListener('focusin',function(){hover=true;arm();});r.addEventListener('focusout',function(){hover=false;arm();});"
    "document.addEventListener('visibilitychange',arm);"
    "if('IntersectionObserver'in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;arm();}).observe(r);"
    "setTimeout(function(){var nx=S[1]&&S[1].querySelector('img');if(nx)nx.loading='eager';},2500);arm();})();")


def ora(p):
    """Ώρα πρώτης δημοσίευσης (ΩΩ:ΛΛ), αν την έχει καταγράψει ο Πίνακας (από 12/11/2026)."""
    d = p.get('dimosiefthike') or ''
    return d[11:16] if len(d) >= 16 else ''


def anevike(p):
    """«στις 10:42» αν ανέβηκε την ημερομηνία της ανάρτησης, αλλιώς «14 Νοεμβρίου 2026, 10:42»."""
    o = ora(p)
    if not o:
        return ''
    d = p['dimosiefthike'][:10]
    return f'<time datetime="{p["dimosiefthike"][:16]}">' + (f'στις {o}' if d == p['imerominia'] else f'{imerominia(d)}, {o}') + '</time>'


def imerologio(d):
    return (f'<time class="cal" datetime="{d}"><span class="cal-d">{int(d[8:10])}</span>'
            f'<span class="cal-m">{imerominia(d, False).split(" ")[1]}</span><span class="sr-only"> {d[:4]}</span></time>')


class Istotopos:
    def __init__(self, a):
        self.out = Path(a.out)
        if self.out.exists():
            shutil.rmtree(self.out)
        self.out.mkdir(parents=True)
        an, sel, diktya, syndesmoi, r = fortose(a.dedomena, a.periexomeno)
        self.r, self.diktya, self.syndesmoi = r, sorted(diktya, key=lambda x: x['seira']), syndesmoi
        self.sel = [s for s in sel if s.get('katastasi') == DIMOSIEYMENI]
        self.meson = Meson(a.meson, self.out)
        self.base = (a.base or '').rstrip('/')
        if a.tomeas:
            r['tomeas'] = a.tomeas.rstrip('/')
        self.sitemap = []
        self.search = []
        self.etos = 2026
        # Αναρτήσεις: μόνο δημοσιευμένες, από 01/01/2024
        posts = [p for p in an if p.get('katastasi', DIMOSIEYMENI) == DIMOSIEYMENI and p['imerominia'] >= APO]
        for p in posts:   # αναρτήσεις από τον Πίνακα: το σχολικό έτος βγαίνει από την ημερομηνία (1/9–31/8)
            if not p.get('sxoliko_etos'):
                y, m = int(p['imerominia'][:4]), int(p['imerominia'][5:7])
                p['sxoliko_etos'] = f'{y}-{y + 1}' if m >= 9 else f'{y - 1}-{y}'
            p.setdefault('diktya', []); p.setdefault('taxeis', []); p.setdefault('fotografies', []); p.setdefault('arxeia', [])
        posts.sort(key=lambda p: (p['imerominia'], p.get('id', '')), reverse=True)
        seen = set()
        for p in posts:
            s = slug(p['titlos'])
            base, n = s, 2
            while (p['imerominia'][:4], s) in seen:
                s, n = f'{base}-{n}', n + 1
            seen.add((p['imerominia'][:4], s))
            p['url'] = f'/anartiseis/{p["imerominia"][:4]}/{s}/'
        self.posts = posts
        self.etos = max(int(p['imerominia'][:4]) for p in posts) if posts else 2026
        self.ana_enotita = defaultdict(list)
        for p in posts:   # μία κύρια ενότητα (διεύθυνση, διαδρομή) + όσες ακόμα επέλεξε ο συντάκτης (εμφάνιση και εκεί)
            p['alles_enotites'] = [k for k in OrderedDict.fromkeys(p.get('alles_enotites') or []) if k in ENOTITES and k != p['enotita']]
            for k in [p['enotita']] + p['alles_enotites']:
                self.ana_enotita[k].append(p)
        self.ana_diktyo = defaultdict(list)
        for p in posts:
            for d in p.get('diktya', []):
                self.ana_diktyo[d].append(p)
        self.ana_etos = OrderedDict()
        for p in posts:
            self.ana_etos.setdefault(p['sxoliko_etos'], []).append(p)
        self.nav = menou(self.domi())
        self.lorida = ''

    # ── δομή μενού από τα δεδομένα (καμία κενή ενότητα στο μενού)
    def domi(self):
        sx = [(s['titlos'], f'/sxoleio/{s["id"]}/') for s in sorted(self.sel, key=lambda x: x['seira']) if s['omada'] == 'sxoleio']
        zoi_mon = {s['id'] for s in self.sel if s['omada'] == 'zoi'}
        zoi = [(ENOTITES[k], url_enotitas(k)) for k in ENOTITES if k not in ('diagonismoi', 'goneis') and k not in zoi_mon and self.ana_enotita.get(k)] + \
              [(s['titlos'], f'/zoi/{s["id"]}/') for s in sorted(self.sel, key=lambda x: x['seira']) if s['omada'] == 'zoi']
        dk = [(d['titlos'], f'/diktya/{d["id"]}/') for d in self.diktya]
        gon = ([('Ενημερώσεις γονέων', '/goneis/enimeroseis/')] if self.ana_enotita.get('goneis') else []) + \
              [(s['titlos'], f'/goneis/{s["id"]}/') for s in sorted(self.sel, key=lambda x: x['seira']) if s['omada'] == 'goneis']
        return [('Αρχική', '/', []), ('Το Σχολείο μας', '/sxoleio/', sx), ('Σχολική Ζωή', '/zoi/', zoi),
                ('Δίκτυα και Προγράμματα', '/diktya/', dk), ('Διαγωνισμοί και Βραβεία', '/diagonismoi/', []),
                ('Γονείς και Κηδεμόνες', '/goneis/', gon), ('Χρήσιμοι Σύνδεσμοι', '/syndesmoi/', []),
                ('Επικοινωνία', '/epikoinonia/', [])]

    def grapse(self, path, k='', **kw):
        if not path.startswith('/404'):
            kw['soma'] = kw['soma'] + self.epikoinonia_html('h2')
            kw['extra_tail'] = kw.get('extra_tail', '') + '<script src="/static/contact-form.js?v={V}" defer></script>\n'
        page = selida(r=self.r, nav_html=self.nav, path=path, etos=self.etos, lorida=self.lorida if path != '/' else '', **kw)
        f = self.out / path.strip('/') / 'index.html' if path.endswith('/') else self.out / path
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(page, encoding='utf-8')
        if kw.get('robots', 'index,follow').startswith('index'):
            self.sitemap.append(path)
            self.search.append({'u': path, 'l': 'el', 't': kw['titlos'], 'd': kw['perigrafi'], 'k': k})

    # ── κομμάτια
    def karta(self, p, heading='h3', megali=False):
        fot = p.get('fotografies') or []
        e = self.meson.eikona(fot[0]['arxeio']) if fot else None
        eik = (f'<div class="card-img">{img_tag(e, "", sizes="(max-width: 734px) 100vw, 380px")}</div>' if e
               else '<div class="card-img card-img-none" aria-hidden="true"></div>')
        return (f'<article class="card rv{" card-lg" if megali else ""}">{eik}<div class="card-body">'
                f'<p class="card-meta"><time datetime="{p["imerominia"]}">{imerominia(p["imerominia"])}</time>'
                + (f'<span class="ora">, {ora(p)}</span>' if ora(p) and p['dimosiefthike'][:10] == p['imerominia'] else '') +
                f' · {esc(ENOTITES.get(p["enotita"], ""))}</p>'
                f'<{heading} class="card-t"><a href="{p["url"]}">{esc(p["titlos"])}</a></{heading}></div></article>')

    def lista(self, posts, heading='h3'):
        return '<div class="cards">' + ''.join(self.karta(p, heading) for p in posts) + '</div>'

    def slider(self, posts, etiketa, heading='h3'):
        """Κάρτες σε οριζόντια σειρά που κυλά (σάρωμα, βελάκια, πληκτρολόγιο). Χωρίς JS: απλή οριζόντια κύλιση.
        Έως 3 κάρτες: το κανονικό πλέγμα."""
        if len(posts) <= 3:
            return self.lista(posts, heading)
        return (f'<div class="slider" data-slider><div class="sl-track" tabindex="0" role="region" aria-label="{esc(etiketa)}">'
                + ''.join(self.karta(p, heading) for p in posts) + '</div>'
                '<div class="sl-ctl" hidden><button type="button" class="sl-b sl-prev" aria-label="Προηγούμενες">‹</button>'
                '<span class="sl-bar" aria-hidden="true"><span></span></span>'
                '<button type="button" class="sl-b sl-next" aria-label="Επόμενες">›</button></div></div>')

    def lista_ana_etos(self, posts):
        if not posts:
            return '<p class="keno">Δεν υπάρχουν ακόμη αναρτήσεις σε αυτή την ενότητα.</p>'
        omades = OrderedDict()
        for p in posts:
            omades.setdefault(p['sxoliko_etos'], []).append(p)
        out = []
        for et, ps in omades.items():
            out.append(f'<section class="year-group" aria-labelledby="et-{et}"><h2 id="et-{et}" class="h-sec rv">Σχολικό έτος {et.replace("-", "–")}</h2>'
                       f'{self.lista(ps)}</section>')
        return ''.join(out)

    def kefali(self, etiketa, titlos, eisagogi=''):
        et = f'<p class="label">{esc(etiketa)}</p>' if etiketa else ''
        ei = f'<p class="lead">{eisagogi}</p>' if eisagogi else ''
        return f'<div class="page-band"><header class="page-head wrap">{et}<h1>{esc(titlos)}</h1>{ei}</header></div>'

    def gallery(self, fotos, titlos):
        items = []
        for i, f in enumerate(fotos):
            e = self.meson.eikona(f['arxeio'])
            if not e:
                continue
            per = (f.get('perigrafi') or '').strip()
            if re.fullmatch(r'[\w.\-]+', per) and re.search(r'[\d_-]', per):
                per = ''          # όνομα αρχείου από το παλιό WordPress, όχι λεζάντα
            alt = per or f'{titlos}: φωτογραφία {i + 1}'
            cap = f'<figcaption>{esc(per)}</figcaption>' if per else ''
            items.append(f'<figure class="rv"><a href="{e["1600"]}" data-lb data-w="{e["w"]}" data-h="{e["h"]}">'
                         f'{img_tag(e, alt, sizes="(max-width: 734px) 50vw, 300px")}</a>{cap}</figure>')
        if not items:
            return ''
        return (f'<section class="gallery-wrap" aria-label="Φωτογραφίες"><h2 class="h-sec rv">Φωτογραφίες <span class="count">({len(items)})</span></h2>'
                f'<div class="gallery">{"".join(items)}</div></section>')

    def arxeia(self, rels, titlos='Έγγραφα'):
        li = []
        for rel in rels:
            a = self.meson.arxeio(rel)
            if not a:
                continue
            onoma = os.path.basename(rel)
            ext = onoma.rsplit('.', 1)[-1].upper()
            if ext == 'MP4':
                li.append(f'<li class="vid-local"><video controls preload="none" src="{a["url"]}"></video></li>')
                continue
            kb = a['megethos'] / 1024
            meg = f'{kb / 1024:.1f} MB'.replace('.', ',') if kb > 1024 else f'{kb:.0f} KB'
            li.append(f'<li><a class="doc" href="{a["url"]}"><span class="doc-ext">{ext}</span>'
                      f'<span>{esc(onoma_arxeiou(onoma))}<span class="doc-size"> · {meg}</span></span></a></li>')
        return f'<section class="docs"><h2 class="h-sec rv">{titlos}</h2><ul class="doc-list">{"".join(li)}</ul></section>' if li else ''

    def video(self, vids):
        out = []
        for v in vids or []:
            if v.get('eidos') == 'youtube':
                out.append(f'<div class="yt" data-yt="{esc(v["id"])}"><button type="button" class="yt-btn">'
                           f'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
                           f'<span>Αναπαραγωγή βίντεο</span><small>Φορτώνει από το YouTube (youtube-nocookie.com)</small></button></div>')
        return f'<section class="videos"><h2 class="h-sec rv">Βίντεο</h2>{"".join(out)}</section>' if out else ''

    # ── σελίδες
    def anartisi(self, p, i):
        r = self.r
        fot = p.get('fotografies') or []
        tags = [f'<a class="tag" href="{url_enotitas(k)}">{esc(ENOTITES.get(k, ""))}</a>' for k in [p["enotita"]] + p.get("alles_enotites", [])]
        tags += [f'<span class="tag tag-g">{esc(t if t in ("Ένταξη", "Ολοήμερο") else t + "΄ τάξη")}</span>' for t in p.get('taxeis', [])]
        dk = {d['id']: d for d in self.diktya}
        tags += [f'<a class="tag tag-g" href="/diktya/{d}/">{esc(dk[d]["titlos"])}</a>' for d in p.get('diktya', []) if d in dk]
        keim = md.pros_html(p.get('keimeno', ''))
        prev = self.posts[i + 1] if i + 1 < len(self.posts) else None
        nxt = self.posts[i - 1] if i > 0 else None
        nav = '<div class="post-nav" role="navigation" aria-label="Προηγούμενη και επόμενη ανάρτηση">'
        if prev:
            nav += f'<a class="pn-prev" href="{prev["url"]}"><span>Προηγούμενη</span>{esc(prev["titlos"])}</a>'
        if nxt:
            nav += f'<a class="pn-next" href="{nxt["url"]}"><span>Επόμενη</span>{esc(nxt["titlos"])}</a>'
        nav += '</div>'
        sxet = [x for x in self.ana_enotita[p['enotita']] if x is not p][:8]
        sxet_html = (f'<section class="related wrap" aria-labelledby="sx"><h2 id="sx" class="h-sec rv">Από την ίδια ενότητα</h2>{self.slider(sxet, "Από την ίδια ενότητα")}</section>'
                     if sxet else '')
        e0 = self.meson.eikona(fot[0]['arxeio']) if fot else None
        dk_html = ''.join(f'<li><a href="/diktya/{d}/">{esc(dk[d]["titlos"])}</a></li>' for d in p.get('diktya', []) if d in dk)
        tax = ', '.join(t if t in ('Ένταξη', 'Ολοήμερο') else t + '΄' for t in p.get('taxeis', []))
        side = (f'<aside class="side"><div class="side-card rv"><p class="side-h">Στοιχεία</p><dl class="facts">'
                f'<dt>Ημερομηνία</dt><dd>{imerominia(p["imerominia"])}</dd>'
                + (f'<dt>Ανέβηκε</dt><dd>{imerominia(p["dimosiefthike"][:10])}, {ora(p)}</dd>' if ora(p) else '') +
                f'<dt>Σχολικό έτος</dt><dd><a href="/arxeio/{p["sxoliko_etos"]}/">{p["sxoliko_etos"].replace("-", "–")}</a></dd>'
                f'<dt>{"Ενότητες" if p.get("alles_enotites") else "Ενότητα"}</dt><dd>' + ', '.join(f'<a href="{url_enotitas(k)}">{esc(ENOTITES.get(k, ""))}</a>' for k in [p["enotita"]] + p.get("alles_enotites", [])) + '</dd>'
                + (f'<dt>Τάξεις</dt><dd>{esc(tax)}</dd>' if tax else '') + '</dl>'
                + (f'<p class="side-h">Δίκτυα</p><ul class="side-list">{dk_html}</ul>' if dk_html else '') + '</div>'
                + (f'<div class="side-card rv"><p class="side-h">Από την ίδια ενότητα</p><ul class="side-list">'
                   + ''.join(f'<li><a href="{x["url"]}">{esc(x["titlos"])}</a><span>{imerominia(x["imerominia"])}</span></li>' for x in sxet[:3])
                   + '</ul></div>' if sxet else '') + '</aside>')
        soma = f'''<article class="post">
<div class="page-band"><header class="page-head wrap"><p class="post-date">{imerologio(p["imerominia"])}<span>{imerominia(p["imerominia"])} · Σχολικό έτος {p["sxoliko_etos"].replace("-", "–")}{" · ανέβηκε " + anevike(p) if ora(p) else ""}</span></p>
<h1>{esc(p["titlos"])}</h1><p class="tags">{"".join(tags)}</p></header></div>
<div class="wrap page-grid"><div class="main"><div class="prose">{keim}</div>{self.arxeia(p.get("arxeia", []))}{self.video(p.get("video"))}</div>{side}</div>
<div class="wrap post-body">{self.gallery(fot, p["titlos"])}{nav}</div>
</article>'''
        perig = md.keimeno_xoris_morfi(p.get('keimeno', ''))[:155].rsplit(' ', 1)[0] + '…' if len(p.get('keimeno', '')) > 155 else md.keimeno_xoris_morfi(p.get('keimeno', '')) or p['titlos']
        ld = [{'@context': 'https://schema.org', '@type': 'Article', 'headline': p['titlos'][:110], 'datePublished': p['imerominia'],
               'inLanguage': 'el', 'author': {'@type': 'EducationalOrganization', 'name': r['onoma']},
               'publisher': {'@type': 'EducationalOrganization', 'name': r['onoma']}, 'mainEntityOfPage': r['tomeas'].rstrip('/') + p['url'],
               **({'image': r['tomeas'].rstrip('/') + e0['1600']} if e0 else {})}]
        self.grapse(p['url'], titlos=p['titlos'], perigrafi=perig, soma=soma, ld=ld, og_eikona=e0['1600'] if e0 else '',
                    diadromi=[('Σχολική Ζωή', '/zoi/'), (ENOTITES.get(p['enotita'], ''), url_enotitas(p['enotita']))],
                    k=md.keimeno_xoris_morfi(p.get('keimeno', ''))[:400])

    def enotita(self, k):
        posts = self.ana_enotita.get(k, [])
        if not posts:
            return
        if any(s['id'] == k and s['omada'] == 'zoi' for s in self.sel):
            return   # π.χ. Σχολικός κήπος: οι αναρτήσεις μπαίνουν κάτω από τη μόνιμη σελίδα /zoi/kipos/
        path = url_enotitas(k)
        tit = ENOTITES[k]
        perig = f'{tit} του 1ου Δημοτικού Σχολείου Πολίχνης, ανά σχολικό έτος, από το 2024.'
        dr = [('Γονείς και Κηδεμόνες', '/goneis/')] if k == 'goneis' else ([] if k == 'diagonismoi' else [('Σχολική Ζωή', '/zoi/')])
        self.grapse(path, titlos=tit, perigrafi=perig, diadromi=dr,
                    soma=self.kefali('Σχολική Ζωή' if k not in ('diagonismoi', 'goneis') else '', tit, f'{len(posts)} αναρτήσεις') +
                    f'<div class="wrap">{self.lista_ana_etos(posts)}</div>')

    def zoi(self):
        blocks = []
        for k in ENOTITES:
            ps = self.ana_enotita.get(k)
            if not ps or k in ('goneis',):
                continue
            blocks.append(f'<section class="zone" aria-labelledby="z-{k}"><div class="zone-head"><h2 id="z-{k}" class="h-sec rv">{esc(ENOTITES[k])}</h2>'
                          f'<a class="more" href="{url_enotitas(k)}">Όλες ({len(ps)})<span aria-hidden="true"> ›</span></a></div>{self.lista(ps[:3])}</section>')
        # μόνιμες σελίδες της Σχολικής Ζωής (π.χ. Σχολικός κήπος): σελίδα + πλακίδιο στην κορυφή + ανακατεύθυνση από /sxoleio/
        mon = [x for x in sorted(self.sel, key=lambda x: x['seira']) if x['omada'] == 'zoi']
        sx_ids = {x['id'] for x in self.sel if x['omada'] == 'sxoleio'}
        for x in mon:
            self.stathera(x, '/zoi/', 'Σχολική Ζωή')
            if x['id'] not in sx_ids:
                f = self.out / 'sxoleio' / x['id'] / 'index.html'
                f.parent.mkdir(parents=True, exist_ok=True)
                f.write_text(f'<!DOCTYPE html><html lang="el"><head><meta charset="utf-8"><title>{esc(x["titlos"])}</title>'
                             f'<meta name="robots" content="noindex"><link rel="canonical" href="{self.r["tomeas"].rstrip("/")}/zoi/{x["id"]}/">'
                             f'<meta http-equiv="refresh" content="0; url=/zoi/{x["id"]}/"></head><body><p><a href="/zoi/{x["id"]}/">{esc(x["titlos"])}</a></p></body></html>', encoding='utf-8')
        if mon:
            blocks.insert(0, '<section class="zone"><ul class="tiles">' + ''.join(
                f'<li class="rv"><a class="tile c{n % 5 + 1}" href="/zoi/{x["id"]}/"><span class="tile-t">{esc(x["titlos"])}</span>'
                f'<span class="tile-d">{esc(x.get("perigrafi", ""))}</span></a></li>' for n, x in enumerate(mon, 2)) + '</ul></section>')
        self.grapse('/zoi/', titlos='Σχολική Ζωή', perigrafi='Ανακοινώσεις, δράσεις, επισκέψεις, γιορτές και δημιουργίες των μαθητών του 1ου Δημοτικού Σχολείου Πολίχνης.',
                    soma=self.kefali('', 'Σχολική Ζωή', 'Ό,τι συμβαίνει στο σχολείο μας, ανά ενότητα.') + f'<div class="wrap">{"".join(blocks)}</div>')

    def stathera(self, s, omada_url, omada_titlos):
        path = f'{omada_url}{s["id"]}/'
        sim = f'<p class="note">{esc(s["simeiosi"])}</p>' if s.get('simeiosi') else ''
        sxet = ''
        if s['omada'] == 'zoi' and s['id'] in ENOTITES and self.ana_enotita.get(s['id']):   # αναρτήσεις της ομώνυμης ενότητας
            ps = self.ana_enotita[s['id']]
            sxet = f'<section class="related"><h2 class="h-sec rv">Αναρτήσεις ({len(ps)})</h2>{self.lista_ana_etos(ps)}</section>'
        elif s.get('diktyo_sxetika') and self.ana_diktyo.get(s['diktyo_sxetika']):
            sxet = f'<section class="related"><h2 class="h-sec rv">Σχετικές αναρτήσεις</h2>{self.lista(self.ana_diktyo[s["diktyo_sxetika"]][:6])}</section>'
        adelfes = [x for x in sorted(self.sel, key=lambda x: x['seira']) if x['omada'] == s['omada']]
        side = ('<aside class="side"><div class="side-card rv"><p class="side-h">' + esc(omada_titlos) + '</p><ul class="side-list side-nav">'
                + ''.join(('<li class="on"><a aria-current="page" ' if x is s else '<li><a ') + f'href="{omada_url}{x["id"]}/">{esc(x["titlos"])}</a></li>' for x in adelfes)
                + '</ul></div>' + '</aside>')
        fot = s.get('fotografies', []) or []
        banner, gal = '', fot
        if len(fot) == 1:   # μία εικόνα: μπαίνει πάνω από το κείμενο, όχι ως «Φωτογραφίες (1)»
            e1 = self.meson.eikona(fot[0]['arxeio'])
            if e1:
                banner = (f'<figure class="page-banner rv">{img_tag(e1, fot[0].get("perigrafi") or s["titlos"], sizes="(max-width: 734px) 100vw, 760px")}</figure>')
                gal = []
        soma = (self.kefali(omada_titlos, s['titlos'], esc(s.get('perigrafi', ''))) +
                f'<div class="wrap page-grid"><div class="main">{banner}<div class="prose">{sim}{md.pros_html(s.get("keimeno", ""))}</div>'
                f'{self.arxeia(s.get("arxeia", []))}</div>{side}</div>'
                f'<div class="wrap post-body">{self.gallery(gal, s["titlos"])}{sxet}</div>')
        self.grapse(path, titlos=s['titlos'], perigrafi=s['perigrafi'], soma=soma, diadromi=[(omada_titlos, omada_url)],
                    k=md.keimeno_xoris_morfi(s.get('keimeno', ''))[:400])

    def omada(self, kod, url, titlos, eisagogi, extra=''):
        items = [s for s in sorted(self.sel, key=lambda x: x['seira']) if s['omada'] == kod]
        for s in items:
            self.stathera(s, url, titlos)
        li = ''.join(f'<li class="rv"><a class="tile c{n % 5 + 1}" href="{url}{s["id"]}/"><span class="tile-t">{esc(s["titlos"])}</span>'
                     f'<span class="tile-d">{esc(s["perigrafi"])}</span></a></li>' for n, s in enumerate(items, 1))
        self.grapse(url, titlos=titlos, perigrafi=eisagogi, soma=self.kefali('', titlos, esc(eisagogi)) +
                    f'<div class="wrap"><ul class="tiles">{extra}{li}</ul></div>')

    def diktya_selides(self):
        tiles = []
        for n, d in enumerate(self.diktya):
            cc = f'c{n % 5 + 1}'
            path = f'/diktya/{d["id"]}/'
            ps = self.ana_diktyo.get(d['id'], [])
            logo = self.logotypo(d)
            yp = f'<p class="lead">{esc(d["ypotitlos"])}</p>' if d.get('ypotitlos') else ''
            ext = (f'<p><a class="btn" href="{esc(d["syndesmos"])}" target="_blank" rel="noopener">Επίσημη σελίδα του φορέα'
                   f'<span class="sr-only"> (ανοίγει σε νέα καρτέλα)</span></a></p>') if d.get('syndesmos') else ''
            rel = (f'<section class="related"><h2 class="h-sec rv">Οι δράσεις μας</h2>{self.lista(ps)}</section>' if ps else '')
            soma = (f'<div class="page-band"><header class="page-head wrap net-head {cc}"><div class="net-logo">{logo}</div><div><p class="label">{esc(d["eidos"])}</p>'
                    f'<h1>{esc(d["titlos"])}</h1>{yp}</div></header></div>'
                    f'<div class="wrap post-body"><div class="prose"><p>{esc(d["perigrafi"])}</p>{ext}</div>{rel}</div>')
            self.grapse(path, titlos=d['titlos'], perigrafi=f'{d["eidos"]}: {d["perigrafi"]}'[:158], soma=soma,
                        diadromi=[('Δίκτυα και Προγράμματα', '/diktya/')])
            tiles.append(f'<li class="rv"><a class="net-tile {cc}" href="{path}"><span class="net-logo">{logo}</span>'
                         f'<span class="net-t">{esc(d["titlos"])}</span><span class="net-d">{esc(d["eidos"])}</span></a></li>')
        self.grapse('/diktya/', titlos='Τα Δίκτυα και τα Προγράμματά μας',
                    perigrafi='Τα διεθνή, ευρωπαϊκά και περιφερειακά δίκτυα και προγράμματα στα οποία συμμετέχει το 1ο Δημοτικό Σχολείο Πολίχνης.',
                    soma=self.kefali('', 'Τα Δίκτυα και τα Προγράμματά μας') + f'<div class="wrap"><ul class="nets">{"".join(tiles)}</ul></div>')
        return tiles

    def logotypo(self, d):
        for ext in ('svg', 'png', 'webp', 'jpg', 'jpeg'):
            src = self.meson.m / 'logotypa' / f'{d["id"]}.{ext}'
            if src.exists():
                dst = self.out / 'logotypa' / src.name
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
                wh = ''
                if ext != 'svg':
                    try:
                        from PIL import Image
                        with Image.open(src) as im:
                            wh = f' width="{im.width}" height="{im.height}"'
                    except Exception:
                        pass
                return f'<img src="/logotypa/{src.name}"{wh} alt="Λογότυπο: {esc(d["titlos"])}" loading="lazy" decoding="async">'
        il = RIZA / 'static' / 'eikones' / 'diktya' / f'{d["id"]}.webp'
        if il.exists():
            try:
                from PIL import Image
                with Image.open(il) as im:
                    w, h = im.size
            except Exception:
                w, h = 240, 240
            return f'<img class="net-il" src="/static/eikones/diktya/{d["id"]}.webp" width="{w}" height="{h}" alt="" loading="lazy" decoding="async">'
        arxika = ''.join(w[0] for w in re.findall(r'[A-Za-zΑ-Ωα-ωά-ώ]+', d['titlos'])[:3]).upper()
        return f'<span class="logo-ph" aria-hidden="true">{esc(arxika)}</span>'

    def arxeio_selides(self):
        li = []
        for et, ps in self.ana_etos.items():
            path = f'/arxeio/{et}/'
            omades = OrderedDict()
            for k in ENOTITES:
                xs = [p for p in ps if p['enotita'] == k]
                if xs:
                    omades[k] = xs
            body = ''.join(f'<section class="zone"><h2 class="h-sec rv">{esc(ENOTITES[k])}</h2>{self.lista(xs)}</section>' for k, xs in omades.items())
            self.grapse(path, titlos=f'Σχολικό έτος {et.replace("-", "–")}', perigrafi=f'Όλες οι αναρτήσεις του 1ου Δημοτικού Σχολείου Πολίχνης για το σχολικό έτος {et}.',
                        soma=self.kefali('Αρχείο', f'Σχολικό έτος {et.replace("-", "–")}', f'{len(ps)} αναρτήσεις') + f'<div class="wrap">{body}</div>',
                        diadromi=[('Αρχείο', '/arxeio/')])
            li.append(f'<li><a class="tile" href="{path}"><span class="tile-t">Σχολικό έτος {et.replace("-", "–")}</span><span class="tile-d">{len(ps)} αναρτήσεις</span></a></li>')
        self.grapse('/arxeio/', titlos='Αρχείο ανά σχολικό έτος', perigrafi='Οι αναρτήσεις του 1ου Δημοτικού Σχολείου Πολίχνης οργανωμένες ανά σχολικό έτος, από το 2024.',
                    soma=self.kefali('', 'Αρχείο ανά σχολικό έτος') + f'<div class="wrap"><ul class="tiles">{"".join(li)}</ul></div>')

    def epikoinonia_mikro(self):
        r = self.r
        return (f'<div class="side-card side-contact rv"><p class="side-h">Επικοινωνία</p>'
                f'<p><a href="tel:{r["tilefono"].replace(" ", "")}">{esc(r["tilefono"])}</a><br>'
                + (f'<a href="mailto:{esc(r["email"])}">{esc(r["email"])}</a><br>' if r.get('email') else '')
                + f'{esc(r["dieythynsi"])}</p></div>')

    def syndesmoi_html(self, mono_kyrioi=False):
        ICON = {'book': '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16"/>',
                'screen': '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
                'building': '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
                'shield': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'}
        omades = OrderedDict()
        for s in self.syndesmoi:
            if mono_kyrioi and not s.get('kyrios'):
                continue
            omades.setdefault(s['omada'], []).append(s)

        def li(s):
            dom = re.sub(r'^https?://(www\.)?', '', s['url']).rstrip('/')
            return (f'<li class="rv"><a class="link-tile" href="{esc(s["url"])}" target="_blank" rel="noopener">'
                    f'<svg aria-hidden="true" viewBox="0 0 24 24">{ICON.get(s["eikonidio"], ICON["screen"])}</svg>'
                    f'<span><span class="lt-t">{esc(s["titlos"])}</span><span class="lt-d">{esc(dom)}</span></span>'
                    f'<span class="sr-only"> (ανοίγει σε νέα καρτέλα)</span></a></li>')
        if mono_kyrioi:
            return '<ul class="links">' + ''.join(li(s) for v in omades.values() for s in v) + '</ul>'
        return ''.join(f'<section class="zone"><h2 class="h-sec rv">{esc(o)}</h2><ul class="links">{"".join(li(s) for s in v)}</ul></section>' for o, v in omades.items())

    def arxiki(self, net_tiles):
        r = self.r
        anak = self.ana_enotita.get('anakoinoseis', [])[:5]
        anak_html = ''.join(f'<li class="rv"><a class="notice" href="{p["url"]}">{imerologio(p["imerominia"])}'
                            f'<span class="notice-body"><span class="notice-t">{esc(p["titlos"])}</span>'
                            f'<span class="notice-m">{imerominia(p["imerominia"])}{", " + ora(p) if ora(p) and p["dimosiefthike"][:10] == p["imerominia"] else ""} · Σχολικό έτος {p["sxoliko_etos"].replace("-", "–")}</span></span>'
                            f'<span class="notice-go" aria-hidden="true">›</span></a></li>' for p in anak)
        zoi = [p for p in self.posts if p['enotita'] not in ('anakoinoseis', 'goneis') and p.get('fotografies')][:10]
        diak = self.ana_enotita.get('diagonismoi', [])[:9]
        hero_e = self.meson.eikona(r['fotografia_kentriki']) if r.get('fotografia_kentriki') else None
        if not hero_e:
            for p in self.posts:  # προσωρινά: η πρώτη οριζόντια φωτογραφία, έως ότου έρθει φωτογραφία του κτιρίου
                for f in p.get('fotografies', []):
                    e = self.meson.eikona(f['arxeio'])
                    if e and e['w'] > e['h'] * 1.3:
                        hero_e = e
                        break
                if hero_e:
                    break
        hero_img = img_tag(hero_e, r['fotografia_kentriki_perigrafi'], cls='hero-img', sizes='(max-width: 734px) 100vw, 560px', lazy=False, fetchprio='high')
        # Εξώφυλλο που εναλλάσσει τις πιο πρόσφατες δράσεις (φωτογραφία + τίτλος + σύνδεσμος)· αν δεν υπάρχουν, η σταθερή φωτογραφία
        slides = []
        # (α) εξώφυλλο που όρισε το σχολείο (rythmiseis.json → exofyllo): φωτογραφίες με λεζάντα και σύνδεσμο σε ανάρτηση
        ana_titlo = {p['titlos']: p for p in self.posts}
        for x in r.get('exofyllo') or []:
            e = self.meson.eikona(x.get('arxeio', ''))
            if e:
                p = ana_titlo.get(x.get('anartisi', ''))
                slides.append(({'url': p['url'] if p else '', 'titlos': x.get('titlos', ''), 'epikefalida': x.get('epikefalida', '')}, e))
        for p in ([] if slides else self.posts):
            if p['enotita'] in ('anakoinoseis', 'goneis'):
                continue
            for f in (p.get('fotografies') or [])[:3]:
                e = self.meson.eikona(f['arxeio'])
                if e and e['w'] >= e['h']:
                    slides.append((p, e))
                    break
            if len(slides) == 6:
                break
        slides = slides[:16]
        if len(slides) >= 2:
            sl = []
            for n, (p, e) in enumerate(slides):
                im = img_tag(e, p['titlos'], cls='hero-img', sizes='(max-width: 734px) 100vw, 560px', lazy=n > 0, fetchprio='high' if n == 0 else '')
                tag, href = ('a', f' href="{p["url"]}"') if p.get('url') else ('div', '')
                sl.append(f'<{tag} class="hr-s{" on" if n == 0 else ""}"{href}{"" if n == 0 else " tabindex=\"-1\" aria-hidden=\"true\""}>{im}'
                          f'<span class="hr-cap"><span class="hr-d">{esc(p["epikefalida"]) if p.get("epikefalida") else imerominia(p["imerominia"])}</span><span class="hr-t">{esc(p["titlos"])}</span></span></{tag}>')
            dots = ''.join(f'<button type="button" class="hr-dot{" on" if n == 0 else ""}" aria-label="Δράση {n + 1}: {esc(p["titlos"])}"{" aria-current=\"true\"" if n == 0 else ""}></button>'
                           for n, (p, e) in enumerate(slides))
            hero_img = (f'<div class="hero-rot" role="region" aria-roledescription="εναλλαγή" aria-label="Πρόσφατες δράσεις του σχολείου">{"".join(sl)}'
                        f'<div class="hr-ctl"><button type="button" class="hr-p" aria-label="Παύση της εναλλαγής" aria-pressed="false"><span aria-hidden="true"></span></button>{dots}</div></div>'
                        '<script>' + HERO_ROT_JS + '</script>')
        sel = {s['id']: s for s in self.sel}
        IC = {'vivliothiki': '<path d="M4 19V5a2 2 0 012-2h12v18H6a2 2 0 01-2-2zm0 0a2 2 0 012-2h12"/>',
              'kipos': '<path d="M12 21v-8M12 13c0-4 3-7 7-7 0 4-3 7-7 7zM12 13c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5"/>',
              'ksl': '<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/><path d="M8 11h2l1-2 2 4 1-2h2"/>',
              'aed': '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M13 8l-3 5h4l-3 4"/>'}
        CC = {'vivliothiki': 'c1', 'kipos': 'c2', 'ksl': 'c4', 'aed': 'c3'}
        def kef(id_, titlos, keim, url):
            art = {'vivliothiki': 'spot_vivliothiki', 'kipos': 'spot_kipos', 'ksl': 'spot_ygeia', 'aed': 'spot_aed'}[id_]
            if (RIZA / 'static' / 'eikones' / f'{art}.webp').exists():
                ic = f'<span class="ch-art" aria-hidden="true"><img src="/static/eikones/{art}.webp" width="320" height="320" alt="" loading="lazy" decoding="async"></span>'
            else:
                ic = f'<span class="ch-ic" aria-hidden="true"><svg viewBox="0 0 24 24">{IC[id_]}</svg></span>'
            return (f'<li class="rv"><a class="chapter {CC[id_]}" href="{url}">{ic}'
                    f'<span class="ch-t">{esc(titlos)}</span><span class="ch-d">{esc(keim)}</span>'
                    f'<span class="more" aria-hidden="true">Περισσότερα ›</span></a></li>')
        chapters = ''
        if 'vivliothiki' in sel:
            chapters += kef('vivliothiki', 'Σχολική βιβλιοθήκη', 'Δανεισμός βιβλίων Δευτέρα, Πέμπτη και Παρασκευή, δράσεις φιλαναγνωσίας.', '/sxoleio/vivliothiki/')
        if 'kipos' in sel:
            chapters += kef('kipos', 'Σχολικός κήπος', 'Ο λαχανόκηπος που φυτεύουν και φροντίζουν οι μαθητές μας.',
                            '/zoi/kipos/' if sel['kipos'].get('omada') == 'zoi' else '/sxoleio/kipos/')
        chapters += kef('ksl', 'KIDS SAVE LIVES', 'Πρώτες βοήθειες και ΚΑΡΠΑ για όλη τη σχολική κοινότητα.', '/diktya/kids-save-lives/')
        chapters += kef('aed', 'Υγεία και ασφάλεια', 'Το σχολείο διαθέτει αυτόματο εξωτερικό απινιδωτή (AED).',
                        '/sxoleio/ygeia-asfaleia/' if 'ygeia-asfaleia' in sel else '/diktya/kids-save-lives/')
        deco = ('<div class="hero-deco" aria-hidden="true">'
                '<span class="hd hd1" data-p="0.18">Α</span><span class="hd hd2" data-p="-0.12">β</span>'
                '<span class="hd hd3" data-p="0.25">1</span><span class="hd hd4" data-p="-0.2">2</span>'
                '<span class="hd hd5" data-p="0.1">+</span><span class="hd hd6" data-p="-0.16">Γ</span>'
                '<svg class="hd hd-star" data-p="0.22" viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg>'
                '<svg class="hd hd-pencil" data-p="-0.1" viewBox="0 0 64 16"><rect x="8" y="3" width="44" height="10" rx="2"/><path d="M52 3l10 5-10 5z"/><rect x="2" y="3" width="8" height="10" rx="2"/></svg>'
                '<svg class="plane" viewBox="0 0 1200 400" preserveAspectRatio="none"><path class="plane-trail" d="M-40 330 C 200 300, 300 120, 520 170 S 820 330, 1010 120 S 1180 60, 1260 40"/></svg>'
                '<svg class="plane-ico" viewBox="0 0 48 48"><path d="M3 22L45 4 33 44 23 28z" fill="#fff"/><path d="M23 28L45 4 15 25z" fill="#cfe2f6"/><path d="M3 22L45 4 33 44 23 28z" fill="none" stroke="#1e64a8" stroke-width="2.4" stroke-linejoin="round"/></svg>'
                '</div>')
        soma = f'''<section class="hero">
 {deco}
 <div class="wrap hero-grid">
  <div class="hero-txt">
   <p class="label">{esc(r['periochi'])}</p>
   <h1>{esc(r['onoma'])}</h1>
   <p class="lead"><strong>{esc(r['kalosorisma_titlos'])}</strong> {esc(r['kalosorisma'])}</p>
   <p class="ctas"><a class="btn" href="/zoi/anakoinoseis/">Ανακοινώσεις</a> <a class="btn btn-ghost" href="tel:{r['tilefono'].replace(' ', '')}">Τηλέφωνο {esc(r['tilefono'])}</a></p>
  </div>
  <div class="hero-pic">{hero_img}</div>
 </div>
</section>
<div class="flight" aria-hidden="true"><svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path class="fl-path" d="M-10 92 C 180 18, 330 112, 520 64 S 840 4, 1000 52 S 1120 96, 1170 34"/></svg><svg class="fl-plane" viewBox="0 0 48 48"><path d="M3 22L45 4 33 44 23 28z" fill="#fff"/><path d="M23 28L45 4 15 25z" fill="#cfe2f6"/><path d="M3 22L45 4 33 44 23 28z" fill="none" stroke="#1e64a8" stroke-width="2.6" stroke-linejoin="round"/></svg><span class="fl-st s1"></span><span class="fl-st s2"></span><span class="fl-st s3"></span></div>
<section class="sec sec-nets" aria-labelledby="h-net"><div class="wrap">
 <div class="zone-head zone-art"><img class="zone-pic" src="/static/eikones/spot_diktya.webp" width="320" height="320" alt="" aria-hidden="true" loading="lazy" decoding="async"><h2 id="h-net" class="h-sec rv">Τα Δίκτυα και τα Προγράμματά μας</h2><a class="more" href="/diktya/">Όλα τα δίκτυα<span aria-hidden="true"> ›</span></a></div>
 <ul class="nets">{"".join(net_tiles)}</ul>
</div></section>
<section class="band" aria-labelledby="h-anak"><div class="wrap">
 <div class="zone-head"><h2 id="h-anak" class="h-sec rv">Τελευταίες ανακοινώσεις</h2><a class="more" href="/zoi/anakoinoseis/">Όλες οι ανακοινώσεις<span aria-hidden="true"> ›</span></a></div>
 <ul class="notices">{anak_html}</ul>
</div></section>
<section class="sec band-g" aria-labelledby="h-zoi"><div class="wrap">
 <div class="zone-head"><h2 id="h-zoi" class="h-sec rv">Η σχολική μας ζωή</h2><a class="more" href="/zoi/">Όλη η Σχολική Ζωή<span aria-hidden="true"> ›</span></a></div>
 {self.slider(zoi, 'Η σχολική μας ζωή: πρόσφατες δράσεις')}
</div></section>
{f"""<section class="sec" aria-labelledby="h-diak"><div class="wrap">
 <div class="zone-head"><h2 id="h-diak" class="h-sec rv">Διαγωνισμοί, διακρίσεις, βραβεία</h2><a class="more" href="/diagonismoi/">Όλες οι διακρίσεις<span aria-hidden="true"> ›</span></a></div>
 {self.slider(diak, 'Διαγωνισμοί και διακρίσεις')}
</div></section>""" if diak else ""}
<div class="flight flight-r" aria-hidden="true"><svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path class="fl-path" d="M-10 92 C 180 18, 330 112, 520 64 S 840 4, 1000 52 S 1120 96, 1170 34"/></svg><svg class="fl-plane" viewBox="0 0 48 48"><path d="M3 22L45 4 33 44 23 28z" fill="#fff"/><path d="M23 28L45 4 15 25z" fill="#cfe2f6"/><path d="M3 22L45 4 33 44 23 28z" fill="none" stroke="#1e64a8" stroke-width="2.6" stroke-linejoin="round"/></svg><span class="fl-st s1"></span><span class="fl-st s2"></span><span class="fl-st s3"></span></div>
<section class="sec band" aria-labelledby="h-ch"><div class="wrap">
 <h2 id="h-ch" class="h-sec rv">Στο σχολείο μας</h2>
 <ul class="chapters">{chapters}</ul>
</div></section>
<section class="sec" aria-labelledby="h-lnk"><div class="wrap">
 <div class="zone-head"><h2 id="h-lnk" class="h-sec rv">Χρήσιμοι σύνδεσμοι</h2><a class="more" href="/syndesmoi/">Όλοι οι σύνδεσμοι<span aria-hidden="true"> ›</span></a></div>
 {self.syndesmoi_html(True)}
</div></section>'''
        ld = [{'@context': 'https://schema.org', '@type': ['EducationalOrganization', 'ElementarySchool'], 'name': r['onoma'],
               'alternateName': r['onoma_epiftimo'], 'url': r['tomeas'], 'telephone': '+30' + r['tilefono'].replace(' ', ''),
               'address': {'@type': 'PostalAddress', 'streetAddress': 'Σχολείου 1', 'postalCode': '56533', 'addressLocality': 'Πολίχνη',
                           'addressRegion': 'Θεσσαλονίκη', 'addressCountry': 'GR'},
               'geo': {'@type': 'GeoCoordinates', 'latitude': r['xartis_lat'], 'longitude': r['xartis_lng']}}]
        self.grapse('/', titlos=f'{r["onoma"]} | Θεσσαλονίκη',
                    perigrafi=f'Η ιστοσελίδα του {r["onoma"]}: ανακοινώσεις, σχολική ζωή, δίκτυα και προγράμματα, πληροφορίες για γονείς και επικοινωνία.',
                    soma=soma, ld=ld, og_eikona=hero_e['1600'] if hero_e else '')

    def epikoinonia_html(self, h='h2'):
        r = self.r
        q = f'{r["xartis_lat"]},{r["xartis_lng"]}'
        ic = {
            'dieythynsi': '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
            'tilefono': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
            'email': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
            'ypagogi': '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
        }
        def li(k, label, value):
            return (f'<li><span class="ci-ic" aria-hidden="true"><svg viewBox="0 0 24 24">{ic[k]}</svg></span>'
                    f'<span class="ci-t"><span class="ci-l">{label}</span><span class="ci-v">{value}</span></span></li>')
        rows = [li('dieythynsi', 'Διεύθυνση', esc(r['dieythynsi'])),
                li('tilefono', 'Τηλέφωνο', f'<a href="tel:{r["tilefono"].replace(" ", "")}">{esc(r["tilefono"])}</a>')]
        if r.get('email'):
            rows.append(li('email', 'Email', f'<a class="nw" href="mailto:{esc(r["email"])}">{esc(r["email"])}</a>'))
        rows.append(li('ypagogi', 'Υπαγωγή', esc(r['ypagogi'])))
        return f'''<section class="sec band epik" aria-labelledby="h-epik"><div class="wrap">
 <div class="contact">
  <div class="contact-info"><{h} id="h-epik" class="h-sec rv">Επικοινωνία</{h}>
   <ul class="contact-list">{"".join(rows)}</ul>
   <p class="form-note">Για κάτι επείγον καλέστε στο <a href="tel:{r['tilefono'].replace(' ', '')}">{esc(r['tilefono'])}</a>. Μην γράφετε στη φόρμα ευαίσθητα στοιχεία μαθητών (π.χ. θέματα υγείας).</p>
  </div>
  <div class="contact-form"><h3 class="cf-h">Στείλτε μας μήνυμα</h3>{self.forma_html()}</div>
 </div>
 <div class="map map-wide"><iframe src="https://www.google.com/maps?q={q}&amp;z=16&amp;output=embed" title="Χάρτης: θέση του σχολείου" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
 <p class="map-link"><a class="link-more" href="https://www.google.com/maps/dir/?api=1&amp;destination={q}" target="_blank" rel="noopener">Οδηγίες στο Google Maps<span class="sr-only"> (ανοίγει σε νέα καρτέλα)</span><span aria-hidden="true"> ›</span></a></p>
</div></section>'''

    def forma_html(self):
        r = self.r
        epiloges = ['Γενική ερώτηση', 'Εγγραφές μαθητών', 'Βεβαιώσεις και έγγραφα', 'Θέμα γονέων και κηδεμόνων', 'Συνεργασία ή πρόταση', 'Ιστοσελίδα']
        opts = '<option value="">Διαλέξτε…</option>' + ''.join(f'<option>{esc(o)}</option>' for o in epiloges)
        return f'''<form id="clientContactForm" class="cform" novalidate data-endpoint="{esc(r.get('forma_url', ''))}">
  <input type="hidden" name="_to" value="{esc(r['email'])}">
  <input type="hidden" name="_key" value="{esc(r.get('forma_kleidi', ''))}">
  <input type="text" name="_hp" value="" autocomplete="off" tabindex="-1" aria-hidden="true" style="display:none;position:absolute;left:-9999px">
  <div class="cf-row"><div class="cf-f"><label for="f-name">Ονοματεπώνυμο</label><input id="f-name" name="name" type="text" autocomplete="name" required></div>
   <div class="cf-f"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div></div>
  <div class="cf-row"><div class="cf-f"><label for="f-phone">Τηλέφωνο <span class="opt">(προαιρετικό)</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
   <div class="cf-f"><label for="serviceSelect">Θέμα</label><select id="serviceSelect" name="subject">{opts}</select></div></div>
  <div class="cf-f"><label for="f-message">Μήνυμα</label><textarea id="f-message" name="message" rows="5" required></textarea></div>
  <p class="cf-gdpr">Το μήνυμα φτάνει στο email του σχολείου και λαμβάνετε αντίγραφο. Τα στοιχεία χρησιμοποιούνται μόνο για την απάντηση (<a href="/aporrito/">απόρρητο</a>).</p>
  <button type="submit" class="btn">Αποστολή</button>
  <p id="formStatus" role="status" aria-live="polite"></p>
 </form>'''

    def mikres(self):
        r = self.r
        self.grapse('/syndesmoi/', titlos='Χρήσιμοι Σύνδεσμοι', perigrafi='Ψηφιακά βιβλία, εκπαιδευτικές πλατφόρμες, φορείς και ασφάλεια στο διαδίκτυο: χρήσιμοι σύνδεσμοι για μαθητές και γονείς.',
                    soma=self.kefali('', 'Χρήσιμοι Σύνδεσμοι', 'Οι σύνδεσμοι ανοίγουν σε νέα καρτέλα.') + f'<div class="wrap">{self.syndesmoi_html()}</div>')
        self.grapse('/epikoinonia/', titlos='Επικοινωνία', perigrafi=f'Διεύθυνση, τηλέφωνο και χάρτης του {r["onoma"]}: {r["dieythynsi"]}, τηλ. {r["tilefono"]}.',
                    soma=self.kefali('', 'Επικοινωνία και χάρτης'))
        self.grapse('/anazitisi/', titlos='Αναζήτηση', perigrafi='Αναζήτηση σε όλες τις αναρτήσεις και σελίδες του 1ου Δημοτικού Σχολείου Πολίχνης.',
                    soma=self.kefali('', 'Αναζήτηση') + f'''<div class="wrap">
<form class="search" role="search" data-site-search data-index="/search-index.json" data-empty-el="Δεν βρέθηκε κάτι. Δοκιμάστε άλλη λέξη ή καλέστε στο {esc(r['tilefono'])}.">
 <label for="q">Τι ψάχνετε;</label><input id="q" type="search" class="nav-search-in" autocomplete="off" placeholder="π.χ. εγγραφές, λαχανόκηπος, αγιασμός">
 <div class="nav-search-res" hidden></div><p class="sr-only" aria-live="polite" data-search-status></p>
</form></div>''', extra_head='<script src="/static/site-search.js?v={V}" defer></script>\n')
        d = r['imerominia_aksiologisis_prosvasimotitas']
        self.grapse('/prosvasimotita/', titlos='Δήλωση προσβασιμότητας', perigrafi='Δήλωση προσβασιμότητας του ιστότοπου του 1ου Δημοτικού Σχολείου Πολίχνης κατά την ΚΥΑ 2418/Δ3/2026 και τον ν. 4727/2020.',
                    soma=self.kefali('', 'Δήλωση προσβασιμότητας') + f'''<div class="wrap post-body"><div class="prose">
<p>Το {esc(r['onoma'])} δεσμεύεται να κάνει τον ιστότοπό του προσβάσιμο, σύμφωνα με τον ν. 4727/2020 (άρθρα 36–45) και την ΚΥΑ 2418/Δ3/2026 (ΦΕΚ Β' 111/15-01-2026). Η δήλωση αφορά τον ιστότοπο {esc(r['tomeas'])}.</p>
<h2>Κατάσταση συμμόρφωσης</h2>
<p>Ο ιστότοπος είναι <strong>μερικώς συμμορφούμενος</strong> με το πρότυπο EN 301 549 v3.2.1 και τις οδηγίες WCAG 2.1, επίπεδο ΑΑ, λόγω των εξαιρέσεων που αναφέρονται παρακάτω.</p>
<h2>Μη προσβάσιμο περιεχόμενο</h2>
<ul><li>Ορισμένα έγγραφα PDF (ανακοινώσεις, προσκλήσεις, αφίσες) είναι σαρωμένες εικόνες χωρίς κείμενο που διαβάζεται από αναγνώστη οθόνης.</li>
<li>Ορισμένες παλαιότερες φωτογραφίες έχουν γενική περιγραφή αντί για αναλυτική.</li>
<li>Τα βίντεο από το YouTube δεν έχουν πάντα υπότιτλους.</li></ul>
<h2>Κατάρτιση της δήλωσης</h2>
<p>Η δήλωση καταρτίστηκε στις {imerominia(d)} με αυτοαξιολόγηση: αυτόματοι έλεγχοι (axe-core, Lighthouse) και έλεγχος με πληκτρολόγιο. Επανεξετάζεται τουλάχιστον μία φορά τον χρόνο.</p>
<h2>Επικοινωνία</h2>
<p>Αν συναντήσετε δυσκολία στην πρόσβαση σε κάποιο περιεχόμενο, επικοινωνήστε με τη Διεύθυνση του σχολείου στο <a href="tel:{r['tilefono'].replace(' ', '')}">{esc(r['tilefono'])}</a>. Θα σας στείλουμε το περιεχόμενο σε προσβάσιμη μορφή.</p>
</div></div>''')
        if r.get('ga4'):
            stat_html = ('<p>Ο ιστότοπος δεν χρησιμοποιεί διαφημιστικά cookies. Με τη συγκατάθεσή σας, και μόνο αν πατήσετε «Αποδοχή» στη μπάρα cookies, '
                         'χρησιμοποιούμε το Google Analytics (μέσω Google Tag Manager) για ανώνυμα στατιστικά επισκεψιμότητας. Αν πατήσετε «Απόρριψη», '
                         'δεν φορτώνεται κανένα εργαλείο στατιστικών. Μπορείτε να αλλάξετε την επιλογή σας όποτε θέλετε από το «Ρυθμίσεις cookies» στο κάτω μέρος της σελίδας. '
                         'Οι γραμματοσειρές φορτώνουν από τον ίδιο τον ιστότοπο.</p>')
        else:
            stat_html = '<p>Ο ιστότοπος δεν χρησιμοποιεί δικά του cookies ούτε εργαλεία στατιστικών ή διαφημίσεων. Οι γραμματοσειρές φορτώνουν από τον ίδιο τον ιστότοπο.</p>'
        self.grapse('/aporrito/', titlos='Απόρρητο και cookies', perigrafi='Πώς ο ιστότοπος του 1ου Δημοτικού Σχολείου Πολίχνης προστατεύει τα προσωπικά δεδομένα μαθητών, γονέων και επισκεπτών.',
                    soma=self.kefali('', 'Απόρρητο και cookies') + f'''<div class="wrap post-body"><div class="prose">
<h2>Υπεύθυνος επεξεργασίας</h2>
<p>Υπεύθυνη για το περιεχόμενο του ιστότοπου είναι η σχολική μονάδα {esc(r['onoma_epiftimo'])}, {esc(r['dieythynsi'])}, τηλ. {esc(r['tilefono'])}.</p>
<h2>Τι δεν συλλέγουμε</h2>
{stat_html}
<h2>Περιεχόμενο τρίτων</h2>
<p>Στο τέλος κάθε σελίδας εμφανίζεται ενσωματωμένος χάρτης Google Maps· η Google μπορεί να ορίσει δικά της cookies και ισχύουν οι όροι της. Τα βίντεο (YouTube, σε λειτουργία περιορισμένων cookies) φορτώνουν μόνο αν τα πατήσετε.</p>
<h2>Φόρμα επικοινωνίας</h2>
<p>Όσα γράφετε στη φόρμα (όνομα, email, τηλέφωνο, μήνυμα) στέλνονται με email στο σχολείο μέσω υπηρεσίας της Google και χρησιμοποιούνται μόνο για την απάντηση. Δεν αποθηκεύονται στον ιστότοπο.</p>
<h2>Φωτογραφίες μαθητών</h2>
<p>Δημοσιεύουμε φωτογραφίες από σχολικές δράσεις μόνο με τη συγκατάθεση των κηδεμόνων και χωρίς ονοματεπώνυμα μαθητών. Από τις φωτογραφίες αφαιρούνται τα μεταδεδομένα (π.χ. θέση λήψης). Ζητάμε από τις μηχανές αναζήτησης να μην τις ευρετηριάζουν και από τα ρομπότ τεχνητής νοημοσύνης να μην τις χρησιμοποιούν.</p>
<p>Ο κηδεμόνας που θέλει να αφαιρεθεί μια φωτογραφία ή να ανακαλέσει τη συγκατάθεσή του επικοινωνεί με τη Διεύθυνση· η φωτογραφία αφαιρείται χωρίς καθυστέρηση. Η αναδημοσίευση φωτογραφιών μαθητών από τον ιστότοπο δεν επιτρέπεται.</p>
<h2>Φιλοξενία</h2>
<p>Ο ιστότοπος φιλοξενείται στην υπηρεσία GitHub Pages (GitHub Inc.). Ο πάροχος καταγράφει τεχνικά στοιχεία πρόσβασης (π.χ. διεύθυνση IP) για λόγους ασφάλειας.</p>
</div></div>''')
        (self.out / '404.html').write_text(selida(r=r, nav_html=self.nav, path='/404.html', etos=self.etos, titlos='Η σελίδα δεν βρέθηκε',
                                                  perigrafi='Η σελίδα δεν βρέθηκε.', robots='noindex,follow',
                                                  soma=self.kefali('', 'Η σελίδα δεν βρέθηκε', 'Ίσως μετακινήθηκε. Δοκιμάστε την <a href="/anazitisi/">αναζήτηση</a> ή την <a href="/">αρχική σελίδα</a>.')),
                                           encoding='utf-8')

    def telika(self):
        tomeas = self.r['tomeas'].rstrip('/')
        self.sitemap.sort(key=lambda p: (p.count('/'), p))
        (self.out / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                                              ''.join(f'<url><loc>{tomeas}{p}</loc></url>\n' for p in self.sitemap) + '</urlset>\n', encoding='utf-8')
        (self.out / 'robots.txt').write_text(
            'User-agent: *\nAllow: /\nDisallow: /fotografies/\nDisallow: /diaxeirisi/\n\n'
            '# Φωτογραφίες μαθητών: όχι αναζήτηση εικόνων, όχι εκπαίδευση μοντέλων ΤΝ\n'
            'User-agent: Googlebot-Image\nDisallow: /\n\n'
            'User-agent: GPTBot\nDisallow: /\n\nUser-agent: Google-Extended\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\n'
            'User-agent: ClaudeBot\nDisallow: /fotografies/\n\nUser-agent: anthropic-ai\nDisallow: /\n\n'
            'User-agent: Bytespider\nDisallow: /\n\nUser-agent: meta-externalagent\nDisallow: /\n\n'
            f'Sitemap: {tomeas}/sitemap.xml\n', encoding='utf-8')
        json.dump(self.search, open(self.out / 'search-index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        st = self.out / 'static'
        shutil.copytree(RIZA / 'static', st)
        self.pinakas()
        h = hashlib.sha1(b''.join(p.read_bytes() for p in sorted(st.rglob('*')) if p.is_file())).hexdigest()[:8]
        base = self.base
        for f in self.out.rglob('*.html'):
            t = f.read_text(encoding='utf-8').replace('{V}', h)
            if base:   # δημοσίευση σε υποφάκελο (π.χ. λογαριασμός.github.io/1o_dimotiko/) πριν από τον δικό του τομέα
                t = re.sub(r'((?:href|src|data-index|data-url|action)=")/(?!/)', r'\1' + base + '/', t)
                t = re.sub(r'(srcset="[^"]*")', lambda m: re.sub(r'(^|, |")/(?!/)', r'\1' + base + '/', m.group(1)), t)
            f.write_text(t, encoding='utf-8')
        if base:
            for p in self.search:
                p['u'] = base + p['u']
            json.dump(self.search, open(self.out / 'search-index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        shutil.copy2(RIZA / 'static' / 'favicon.svg', self.out / 'favicon.svg')
        shutil.copy2(RIZA / 'static' / 'email-logo.png', self.out / 'email-logo.png')
        if self.r.get('cname'):
            (self.out / 'CNAME').write_text(self.r['cname'] + '\n')
        (self.out / '.nojekyll').write_text('')

    def ola(self):
        self.lorida = ''.join(f'<li><a href="/diktya/{d["id"]}/"><span class="nl-logo">{self.logotypo(d)}</span><span>{esc(d["titlos"])}</span></a></li>' for d in self.diktya)
        for i, p in enumerate(self.posts):
            self.anartisi(p, i)
        for k in ENOTITES:
            self.enotita(k)
        self.zoi()
        self.omada('sxoleio', '/sxoleio/', 'Το Σχολείο μας', 'Η ιστορία, η Διεύθυνση και το προσωπικό, ο κανονισμός, οι χώροι και η βιβλιοθήκη του 1ου Δημοτικού Σχολείου Πολίχνης.')
        enim = ('<li><a class="tile" href="/goneis/enimeroseis/"><span class="tile-t">Ενημερώσεις γονέων</span>'
                '<span class="tile-d">Ανακοινώσεις και επιμορφώσεις για τους γονείς και κηδεμόνες.</span></a></li>') if self.ana_enotita.get('goneis') else ''
        self.omada('goneis', '/goneis/', 'Γονείς και Κηδεμόνες', 'Ενημερώσεις, ώρες συνεργασίας, έντυπα και ο Σύλλογος Γονέων και Κηδεμόνων του σχολείου.', extra=enim)
        tiles = self.diktya_selides()
        self.arxeio_selides()
        self.mikres()
        self.arxiki(tiles)
        self.telika()
        return self


    def pinakas(self):
        """Ο Πίνακας διαχείρισης ως σελίδα του ιστότοπου (/diaxeirisi/): ίδιο Index.html με το Apps Script,
        με γέφυρα fetch αντί για google.script.run. Χωρίς ευρετηρίαση, εκτός sitemap."""
        api = self.r.get('forma_url', '')
        src = RIZA / 'diaxeirisi' / 'Index.html'
        if not api or not src.exists():
            return
        t = src.read_text(encoding='utf-8').replace('<base target="_top">\n', '').replace('<base target="_top">', '')
        t = t.replace('<html lang="el">', '<html lang="el" data-api="' + esc(api) + '">', 1)
        t = t.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">\n<title>Διαχείριση ιστοσελίδας · '
                      + esc(self.r['onoma']) + '</title>\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n'
                      '<script src="/static/pinakas-gefyra.js?v={V}"></script>', 1)
        d = self.out / 'diaxeirisi'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(t, encoding='utf-8')
        # Οι οδηγίες ΔΕΝ δημοσιεύονται: τις σερβίρει το Apps Script μόνο σε συνδεδεμένους (Odigies.gs).


def onoma_arxeiou(f):
    s = os.path.splitext(f)[0]
    s = re.sub(r'[-_]+', ' ', s)
    return s[:1].upper() + s[1:]



def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dedomena', default=str(RIZA / 'periexomeno'))
    ap.add_argument('--periexomeno', default=str(RIZA / 'periexomeno'))
    ap.add_argument('--meson', default=str(RIZA / 'meson'))
    ap.add_argument('--out', default=str(RIZA / '_site'))
    ap.add_argument('--base', default='', help='υποφάκελος δημοσίευσης, π.χ. /1o_dimotiko (GitHub Pages χωρίς δικό τομέα)')
    ap.add_argument('--tomeas', default='', help='πλήρης διεύθυνση ιστότοπου· αλλιώς από periexomeno/rythmiseis.json')
    a = ap.parse_args()
    s = Istotopos(a).ola()
    n = sum(1 for _ in Path(a.out).rglob('*.html'))
    print(f'{n} σελίδες · {len(s.posts)} αναρτήσεις · σχολικά έτη: {", ".join(s.ana_etos)}')
    if s.meson.leipoun:
        print(f'ΠΡΟΣΟΧΗ: λείπουν {len(set(s.meson.leipoun))} αρχεία μέσων, π.χ. {sorted(set(s.meson.leipoun))[:3]}')


if __name__ == '__main__':
    main()
