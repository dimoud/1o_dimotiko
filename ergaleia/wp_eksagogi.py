#!/usr/bin/env python3
"""Εξαγωγή αναρτήσεων/σελίδων >= 2024 από την εξαγωγή WordPress σε JSON.
Ίδια μορφή με τις γραμμές του Φύλλου Google (μία εγγραφή = μία ανάρτηση).
Χρήση (από τον φάκελο istotopos/): python3 ergaleia/wp_eksagogi.py ../palia-istoselida/1.WordPress.2026-09-08.xml periexomeno/
"""
import sys, os, re, json, html, unicodedata
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

WP = '{http://wordpress.org/export/1.2/}'
CE = '{http://purl.org/rss/1.0/modules/content/}'
BASE = 'http://1dim-polichn.thess.sch.gr/web-page/wp-content/uploads/'
APO = '2024-01-01'

# Νέες ενότητες (μενού «Σχολική Ζωή» της ΠΡΟΤΑΣΗΣ) — προτεραιότητα από πάνω προς τα κάτω
ENOTITES = [
    ('diagonismoi', 'Διαγωνισμοί και διακρίσεις', {'Διαγωνισμοί'}),
    ('perivallon', 'Περιβαλλοντικές δράσεις', {'Περιβαλλοντική', 'Περιβάλλον'}),
    ('episkepseis', 'Εκπαιδευτικές επισκέψεις', {'Επισκέψεις - Εκδρομές'}),
    ('giortes', 'Γιορτές και εκδηλώσεις', {'Εκδηλώσεις', 'Γιορτές', 'Πολιτιστικά', 'Παρουσιάσεις'}),
    ('dimiourgies', 'Μαθητικές δημιουργίες', {'Σκέψεις κείμενα και εικόνες'}),
    ('goneis', 'Ενημερώσεις γονέων', {'Σύλλογος γονέων'}),
    ('anakoinoseis', 'Ανακοινώσεις', {'Πίνακας Ανακοινώσεων', 'Ανακοινώσεις', 'Ενδοσχολικές επιμορφώσεις'}),
]
# εκτός λίστας: 'draseis' (Εκπαιδευτικές δράσεις, προεπιλογή), 'energos-politis' (από το κείμενο), 'synergasies' (χειροκίνητα)
TAXEIS = {"Α' τάξη": 'Α', "Β' τάξη": 'Β', "Γ' τάξη": 'Γ', "Δ' τάξη": 'Δ', "Ε' τάξη": 'Ε', "ΣΤ' τάξη": 'ΣΤ',
          'Τάξη Ένταξης': 'Ένταξη', 'Ολοήμερο': 'Ολοήμερο'}
# Δίκτυα/προγράμματα της ΠΡΟΤΑΣΗΣ §3–4: αυτόματη ετικέτα από λέξεις του κειμένου
DIKTYA = {
    'oikologika': ['οικολογικά σχολεία', 'eco-schools', 'ecoschools', 'δεύτερη ζωή', 're-battery'],
    'sima-aep': ['ση.μα', 'σημερινός μαθητής', 'αυριανός ενεργός πολίτης'],
    'thriving': ['thriving schools'],
    'laxanokipoi': ['λαχανόκηπ', 'σχολικός κήπος', 'σχολικοί λαχανόκηποι'],
    'asfaleia-diadiktyo': ['ασφάλεια στο διαδίκτυο', 'διαδικτυακ', 'ψηφιακή εποχή', 'isecurenet'],
    'kids-save-lives': ['kids save lives', 'σώζουν ζωές', 'καρπα', 'πρώτων βοηθειών', 'πρώτες βοήθειες'],
}

def orig(url):
    """URL εικόνας WordPress → σχετική διαδρομή του πρωτότυπου (χωρίς -WxH)."""
    if not url or BASE not in url.replace('https://', 'http://'):
        return None
    rel = url.replace('https://', 'http://').split(BASE, 1)[1].split('?')[0]
    return re.sub(r'-\d+x\d+(?=\.\w+$)', '', rel)

def shortcodes(raw, synimmena):
    """Shortcodes του WordPress (Shortcodes Ultimate, Symple, caption, video) → απλό HTML."""
    def attr(tag, k):
        m = re.search(k + r'\s*=\s*["\u201c\u201d\']([^"\u201c\u201d\']+)', tag)
        return m.group(1) if m else ''
    def cap(m):
        inner = m.group(1)
        txt = re.sub(r'<[^>]+>', '', inner).strip()
        return re.sub(r'<img', '<img data-cap="%s"' % html.escape(txt, quote=True), inner, count=1) if txt else inner
    raw = re.sub(r'\[caption[^\]]*\](.*?)\[/caption\]', cap, raw, flags=re.S)
    raw = re.sub(r'\[su_document[^\]]*\]', lambda m: '<a href="%s">έγγραφο</a>' % attr(m.group(0), 'url'), raw)
    raw = re.sub(r'\[su_youtube[^\]]*\]', lambda m: '<iframe src="https://www.youtube.com/embed/%s"></iframe>'
                 % re.split(r'[/=]', attr(m.group(0), 'url').rstrip('/'))[-1].split('&')[0], raw)
    raw = re.sub(r'\[video[^\]]*\](\[/video\])?', lambda m: '<a href="%s">βίντεο</a>' % attr(m.group(0), 'mp4'), raw)
    def car(m):
        ids = re.findall(r'\d+', attr(m.group(0), 'source'))
        return ''.join('<img src="%s" width="999">' % (BASE + synimmena[i]) for i in ids if synimmena.get(i))
    raw = re.sub(r'\[su_image_carousel[^\]]*\]', car, raw)
    raw = re.sub(r'\[gallery[^\]]*\]', lambda m: car(type('M', (), {'group': lambda s, i=0: m.group(0).replace('ids', 'source')})()), raw)
    raw = re.sub(r'\[symple_button[^\]]*\](.*?)\[/symple_button\]',
                 lambda m: '<p><a href="%s">%s</a></p>' % (attr(m.group(0), 'url'), m.group(1)), raw, flags=re.S)
    raw = re.sub(r'\[/?(su_\w+|symple_\w+|mail|embed)[^\]]*\]', ' ', raw)
    return raw

def sxoliko_etos(d):
    y, m = int(d[:4]), int(d[5:7])
    a = y if m >= 9 else y - 1
    return f'{a}-{a + 1}'

class ProsMarkdown(HTMLParser):
    """Απλό HTML → ελαφρύ Markdown (ό,τι θα γράφουν και οι εκπαιδευτικοί στο Φύλλο)."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.href, self.imgs, self.files, self.embeds = [], [], [], [], []
        self.li = []
    def handle_starttag(self, t, a):
        a = dict(a)
        if t == 'tr':
            self.out.append('\n|')
        elif t == 'table':
            self.out.append('\n\n')
        elif t in ('p', 'div', 'br'):
            if getattr(self, 'cell', False):
                self.out.append(' ')
            else:
                self.out.append('\n\n' if t != 'br' else '\n')
        elif t in ('h1', 'h2', 'h3', 'h4'):
            self.out.append('\n\n### ')
        elif t in ('strong', 'b'):
            self.out.append('**')
        elif t in ('em', 'i'):
            self.out.append('*')
        elif t in ('ul', 'ol'):
            self.li.append(t); self.out.append('\n')
        elif t == 'li':
            self.out.append('\n- ' if (self.li and self.li[-1] == 'ul') or not self.li else '\n1. ')
        elif t in ('td', 'th'):
            self.cell = True; self.out.append(' ')
        elif t == 'a':
            h = a.get('href') or ''
            o = orig(h)
            if o and re.search(r'\.(pdf|docx?|xlsx?|pptx?|mp4|zip)$', o, re.I):
                self.files.append(o); self.href.append(None); return
            self.href.append(h if not (o and re.search(r'\.(jpe?g|png|gif|webp)$', o, re.I)) else None)
            if self.href[-1]:
                self.out.append('[')
        elif t == 'img':
            o = orig(a.get('src'))
            w = int(a.get('width') or 999)
            if o and w > 40 and o not in [x['arxeio'] for x in self.imgs]:
                self.imgs.append({'arxeio': o, 'perigrafi': html.unescape(a.get('data-cap') or a.get('alt') or '').strip()})
        elif t == 'iframe':
            s = a.get('src') or ''
            m = re.search(r'youtube(?:-nocookie)?\.com/embed/([\w-]{6,})', s)
            if m:
                self.embeds.append({'eidos': 'youtube', 'id': m.group(1)})
            else:
                fm = re.search(r'url=([^&]+\.pdf)', s)
                if fm and orig(fm.group(1)):
                    self.files.append(orig(fm.group(1)))
    def handle_endtag(self, t):
        if t in ('strong', 'b'):
            self.out.append('**')
        elif t in ('em', 'i'):
            self.out.append('*')
        elif t in ('ul', 'ol') and self.li:
            self.li.pop(); self.out.append('\n')
        elif t == 'a' and self.href:
            h = self.href.pop()
            if h:
                self.out.append(f']({h})')
        elif t in ('td', 'th'):
            self.cell = False; self.out.append(' |')
        elif t == 'table':
            self.out.append('\n\n')
        elif t in ('p', 'h2', 'h3', 'h4', 'div'):
            if not getattr(self, 'cell', False):
                self.out.append('\n\n')
    def handle_data(self, d):
        self.out.append(d)
    def keimeno(self):
        s = ''.join(self.out).replace('\xa0', ' ')
        s = re.sub(r'\*\*\s*\*\*|\*\s*\*(?!\*)', '', s)          # κενές εμφάσεις
        s = re.sub(r'\*{3,}', '**', s)
        s = re.sub(r'\[\s*\]\([^)]*\)', '', s)                   # κενοί σύνδεσμοι
        s = re.sub(r'\|[^\n|]*(?:\n(?!\|)[^\n|]*)*', lambda m: m.group(0).replace('\n', ' ') if m.group(0).count('\n') < 3 else m.group(0), s)
        s = re.sub(r'[ \t]+', ' ', s)
        s = re.sub(r' *\n *', '\n', s)
        s = re.sub(r'(?m)^\s*(βίντεο|έγγραφο)\s*$', '', s)
        s = re.sub(r'\n{3,}', '\n\n', s)
        return s.strip()

def katharo_slug(s):
    s = unicodedata.normalize('NFC', html.unescape(re.sub(r'%[0-9a-fA-F]{2}', lambda m: m.group(0), s)))
    try:
        from urllib.parse import unquote
        s = unquote(s)
    except Exception:
        pass
    return s.strip('-')[:90]

def main(xmlp, out):
    ch = ET.parse(xmlp).getroot().find('channel')
    items = ch.findall('item')
    synimmena = {}
    for it in items:
        if it.findtext(WP + 'post_type') == 'attachment':
            synimmena[it.findtext(WP + 'post_id')] = orig(it.findtext(WP + 'attachment_url'))
    anart, selides = [], []
    for it in items:
        typ, st, d = it.findtext(WP + 'post_type'), it.findtext(WP + 'status'), it.findtext(WP + 'post_date')
        if st != 'publish' or typ not in ('post', 'services'):
            continue
        p = ProsMarkdown()
        p.feed(shortcodes(it.findtext(CE + 'encoded') or '', synimmena))
        meta = {m.findtext(WP + 'meta_key'): m.findtext(WP + 'meta_value') for m in it.findall(WP + 'postmeta')}
        thumb = synimmena.get(meta.get('_thumbnail_id') or '')
        imgs = p.imgs[:]
        if thumb and thumb not in [x['arxeio'] for x in imgs] and re.search(r'\.(jpe?g|png|webp)$', thumb, re.I):
            imgs.insert(0, {'arxeio': thumb, 'perigrafi': ''})
        rec = {
            'id': it.findtext(WP + 'post_id'),
            'slug': katharo_slug(it.findtext(WP + 'post_name') or ''),
            'imerominia': d[:10],
            'titlos': html.unescape((it.findtext('title') or '').strip()),
            'keimeno': p.keimeno(),
            'fotografies': imgs,
            'arxeia': list(dict.fromkeys(p.files)),
            'video': p.embeds,
            'syggrafeas': it.findtext('{http://purl.org/dc/elements/1.1/}creator') or '',
        }
        if typ == 'post':
            if d < APO:
                continue
            palies = [c.text for c in it.findall('category') if c.get('domain') == 'category']
            low = (rec['titlos'] + ' ' + rec['keimeno']).lower()
            tl = rec['titlos'].lower()
            enot = 'draseis'
            for k, _, sk in ENOTITES:
                if not (sk & set(palies)):
                    continue
                if k == 'giortes' and not re.search(r'γιορτ|εκδήλωσ|παράστασ|θεατρ|αποφοίτ|κάλαντ|επέτει|25ης|28ης|πολυτεχν|χριστούγ|πάσχα|τελετ|συναυλ|μουσικ', tl):
                    continue
                enot = k; break
            if re.search(r'ενεργ\w* πολίτ', low) and enot in ('draseis', 'giortes'):
                enot = 'energos-politis'
            rec.update({
                'enotita': enot,
                'taxeis': [TAXEIS[c] for c in palies if c in TAXEIS],
                'diktya': [k for k, lex in DIKTYA.items() if any(l in low for l in lex)],
                'sxoliko_etos': sxoliko_etos(d),
                'palies_katigories': palies,
                'katastasi': 'Δημοσιευμένη',
                'synainesi_fotografion': 'από παλιό ιστότοπο',
            })
            anart.append(rec)
        else:
            rec['palia_imerominia'] = rec.pop('imerominia')
            selides.append(rec)
    anart.sort(key=lambda r: r['imerominia'], reverse=True)
    os.makedirs(out, exist_ok=True)
    json.dump(anart, open(os.path.join(out, 'anartiseis.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(selides, open(os.path.join(out, 'selides-wp.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(anart), 'αναρτήσεις ·', len(selides), 'σελίδες')
    from collections import Counter
    print(Counter(r['enotita'] for r in anart))
    print(Counter(x for r in anart for x in r['diktya']))
    print(Counter(r['sxoliko_etos'] for r in anart))
    print('φωτογραφίες:', sum(len(r['fotografies']) for r in anart), '· αρχεία:', sum(len(r['arxeia']) for r in anart),
          '· βίντεο:', sum(len(r['video']) for r in anart))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
