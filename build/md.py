"""Ελαφρύ Markdown → HTML για τα κείμενα του Φύλλου.

Ό,τι γράφει ένας εκπαιδευτικός χωρίς να ξέρει Markdown πρέπει να βγαίνει σωστά:
κενή γραμμή = νέα παράγραφος, «- » = λίστα. Επιπλέον: **έντονα**, *πλάγια*,
[κείμενο](https://…), ### υπότιτλος, γραμμές «| α | β |» = πίνακας,
δύο κενά στο τέλος γραμμής = αλλαγή γραμμής. Γυμνές διευθύνσεις και email γίνονται σύνδεσμοι.
Όλο το HTML του χρήστη διαφεύγει: ποτέ ακατέργαστο HTML από το Φύλλο στη σελίδα.
"""
import html
import re

_URL = re.compile(r'(?<![\("\w])(https?://[^\s<>"\')\]]+[^\s<>"\')\].,;:!?«»])')
_MAIL = re.compile(r'(?<![\w/:.\-])([\w.+-]+@[\w-]+\.[\w.-]*\w)')


def _syndesmos(url, keimeno):
    eksoterikos = url.startswith('http')
    attr = ' target="_blank" rel="noopener"' if eksoterikos else ''
    sr = '<span class="sr-only"> (ανοίγει σε νέα καρτέλα)</span>' if eksoterikos else ''
    return f'<a href="{url}"{attr}>{keimeno}{sr}</a>'


def inline(s):
    s = html.escape(s, quote=False)
    kratimena = []

    def krata(x):
        kratimena.append(x)
        return f'\x00{len(kratimena) - 1}\x00'

    s = re.sub(r'\[([^\]]+)\]\(((?:https?://|mailto:|/)[^)\s]+)\)',
               lambda m: krata(_syndesmos(html.escape(m.group(2), quote=True), m.group(1))), s)
    s = _URL.sub(lambda m: krata(_syndesmos(m.group(1), m.group(1).split('//', 1)[1].rstrip('/'))), s)
    s = _MAIL.sub(lambda m: krata(f'<a href="mailto:{m.group(1)}">{m.group(1)}</a>'), s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
    s = s.replace('  \n', '<br>\n')
    s = re.sub(r'\x00(\d+)\x00', lambda m: kratimena[int(m.group(1))], s)
    return s


def _pinakas(grammes):
    rows = [[c.strip() for c in g.strip().strip('|').split('|')] for g in grammes]
    rows = [r for r in rows if any(c and not re.fullmatch(r'[-:. ]*', c) for c in r)]
    if not rows:
        return ''
    n = max(len(r) for r in rows)
    kef = rows[0]
    bold_kef = all(re.fullmatch(r'\*\*.*\*\*', c) or c.isupper() for c in kef if c)
    out = ['<div class="pinakas"><table>']
    if bold_kef or len(rows) > 2:
        out.append('<thead><tr>' + ''.join(f'<th scope="col">{inline(c.strip("*"))}</th>' for c in kef + [''] * (n - len(kef))) + '</tr></thead>')
        rows = rows[1:]
    out.append('<tbody>')
    for r in rows:
        r = r + [''] * (n - len(r))
        out.append('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>')
    out.append('</tbody></table></div>')
    return ''.join(out)


def pros_html(keimeno, epipedo_titlou=2):
    """Κείμενο Markdown → HTML. epipedo_titlou: σε ποιο h ξεκινούν τα ### (h2 στη σελίδα ανάρτησης)."""
    if not keimeno:
        return ''
    grammes = keimeno.replace('\r\n', '\n').split('\n')
    out, para, lista, pinakas = [], [], None, []

    def kleise_para():
        if para:
            out.append('<p>' + inline('\n'.join(para)).replace('\n', ' ') + '</p>')
            para.clear()

    def kleise_lista():
        nonlocal lista
        if lista:
            tag = lista[0]
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(x)}</li>' for x in lista[1]) + f'</{tag}>')
            lista = None

    def kleise_pinaka():
        if pinakas:
            out.append(_pinakas(pinakas))
            pinakas.clear()

    for g in grammes:
        gs = g.strip()
        if gs.startswith('|'):
            kleise_para(); kleise_lista(); pinakas.append(gs); continue
        kleise_pinaka()
        if not gs:
            kleise_para(); kleise_lista(); continue
        m = re.match(r'^(#{1,4})\s+(.*)', gs)
        if m:
            kleise_para(); kleise_lista()
            h = min(6, epipedo_titlou + max(0, len(m.group(1)) - 3))
            out.append(f'<h{h}>{inline(m.group(2).strip("* "))}</h{h}>')
            continue
        m = re.match(r'^(?:[-•·*]|(\d+)[.)])\s+(.*)', gs)
        if m and not gs.startswith('**'):
            kleise_para()
            tag = 'ol' if m.group(1) else 'ul'
            if not lista or lista[0] != tag:
                kleise_lista(); lista = (tag, [])
            lista[1].append(m.group(2))
            continue
        kleise_lista()
        para.append(g.rstrip(' ') + ('  ' if g.endswith('  ') else ''))
    kleise_para(); kleise_lista(); kleise_pinaka()
    return '\n'.join(out)


def keimeno_xoris_morfi(keimeno):
    """Για περιγραφές/ευρετήριο: χωρίς σύμβολα Markdown."""
    s = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', keimeno or '')
    s = re.sub(r'[*#|]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()
