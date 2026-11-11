#!/usr/bin/env python3
"""
Φέρνει το περιεχόμενο από τον Πίνακα διαχείρισης (Φύλλο Google, μέσω Apps Script) πριν από την παραγωγή.

  python3 build/fere_apo_fyllo.py --url "$DEDOMENA_URL" --kleidi "$DEDOMENA_KLEIDI" \
         --dedomena _dedomena --meson .cache/meson

Γράφει:
  _dedomena/anartiseis.json, _dedomena/selides.json   (ίδια μορφή με την εξαγωγή WordPress)
  .cache/meson/fotografies/drive/<id>-{800,1600}.webp + diastaseis.json
  .cache/meson/arxeia/drive/<id>/<όνομα>
Οι φωτογραφίες και τα αρχεία κατεβαίνουν μία φορά (κρυφή μνήμη του Actions).
Ασφάλεια: αν το Φύλλο δεν επιστρέψει καμία ανάρτηση, σταματά με κωδικό 3 και η παραγωγή
γίνεται από τα δεδομένα του αποθετηρίου (δεν «αδειάζει» ποτέ ο ιστότοπος).
"""
import argparse, base64, io, json, os, re, shutil, sys, threading, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageOps

RIZA = Path(__file__).resolve().parent.parent


def fere(url, params, prospatheies=4):
    q = url + ('&' if '?' in url else '?') + urllib.parse.urlencode(params)
    for i in range(prospatheies):
        try:
            with urllib.request.urlopen(q, timeout=120) as r:
                d = json.loads(r.read().decode('utf-8'))
            if d.get('sfalma'):
                raise RuntimeError(d['sfalma'])
            return d
        except Exception as e:
            if i == prospatheies - 1:
                raise
            print(f'  ξαναδοκιμή ({e})', file=sys.stderr)
            time.sleep(3 * (i + 1))


def katharo(onoma):
    return re.sub(r'[^\w.\-]+', '_', onoma, flags=re.U).strip('_') or 'arxeio'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    ap.add_argument('--kleidi', required=True)
    ap.add_argument('--dedomena', default='_dedomena')
    ap.add_argument('--meson', default='.cache/meson')
    a = ap.parse_args()
    dd, mm = Path(a.dedomena), Path(a.meson)
    dd.mkdir(parents=True, exist_ok=True)
    (mm / 'fotografies' / 'drive').mkdir(parents=True, exist_ok=True)
    (mm / 'arxeia' / 'drive').mkdir(parents=True, exist_ok=True)
    # λογότυπα δικτύων: πάντα από το αποθετήριο
    if (RIZA / 'meson' / 'logotypa').exists():
        shutil.copytree(RIZA / 'meson' / 'logotypa', mm / 'logotypa', dirs_exist_ok=True)

    d = fere(a.url, {'api': 'dedomena', 'k': a.kleidi})
    an = d.get('anartiseis', [])
    if not an:
        print('Το Φύλλο δεν έδωσε αναρτήσεις· η παραγωγή γίνεται από τα δεδομένα του αποθετηρίου.', file=sys.stderr)
        sys.exit(3)

    dims_p = mm / 'fotografies' / 'diastaseis.json'
    dims = json.load(open(dims_p)) if dims_p.exists() else {}
    nea = 0

    def foto(fid):
        nonlocal nea
        rel = f'drive/{fid}.jpg'
        if (mm / 'fotografies' / f'drive/{fid}-1600.webp').exists() and rel in dims:
            return rel
        x = fere(a.url, {'api': 'arxeio', 'id': fid, 'k': a.kleidi})
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(base64.b64decode(x['data'])))).convert('RGB')
        for w in (1600, 800):
            c = im.copy()
            c.thumbnail((w, w * 2))
            c.save(mm / 'fotografies' / f'drive/{fid}-{w}.webp', 'WEBP', quality=82, method=6)  # χωρίς EXIF
            if w == 1600:
                dims[rel] = list(c.size)
        nea += 1
        return rel

    def arxeio(f):
        onoma = katharo(f.get('onoma') or f['id'])
        rel = f'drive/{f["id"]}/{onoma}'
        p = mm / 'arxeia' / rel
        if not p.exists():
            x = fere(a.url, {'api': 'arxeio', 'id': f['id'], 'k': a.kleidi})
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(base64.b64decode(x['data']))
        return rel

    # Προφόρτωση όλων των νέων φωτογραφιών παράλληλα (πρώτη φορά: εκατοντάδες, μία-μία θα έπαιρνε ~40΄)
    kleidaria = threading.Lock()
    ola = [f['id'] for r in an for f in (r.get('fotografies') or [])]
    ola += [x['id'] for s in d.get('selides', []) for x in (s.get('fotografies') or [])]
    leipoun = []
    for i in dict.fromkeys(ola):
        w1600 = mm / 'fotografies' / f'drive/{i}-1600.webp'
        if w1600.exists() and (mm / 'fotografies' / f'drive/{i}-800.webp').exists():
            if f'drive/{i}.jpg' not in dims:          # η κρυφή μνήμη έχει την εικόνα αλλά όχι τις διαστάσεις
                try:
                    with Image.open(w1600) as im0:
                        dims[f'drive/{i}.jpg'] = list(im0.size)
                except Exception:
                    leipoun.append(i)
            continue
        leipoun.append(i)
    yparxoun = len(list((mm / 'fotografies' / 'drive').glob('*-1600.webp')))
    print(f'Φωτογραφίες: {len(set(ola))} συνολικά, {yparxoun} ήδη στην κρυφή μνήμη, {len(leipoun)} νέες για λήψη.', flush=True)

    def proforosi(fid):
        try:
            x = fere(a.url, {'api': 'arxeio', 'id': fid, 'k': a.kleidi})
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(base64.b64decode(x['data'])))).convert('RGB')
            for w in (1600, 800):
                c = im.copy()
                c.thumbnail((w, w * 2))
                c.save(mm / 'fotografies' / f'drive/{fid}-{w}.webp', 'WEBP', quality=82, method=4)  # χωρίς EXIF
                if w == 1600:
                    with kleidaria:
                        dims[f'drive/{fid}.jpg'] = list(c.size)
        except Exception as e:
            print(f'  φωτογραφία {fid}: {e}', file=sys.stderr, flush=True)
    with ThreadPoolExecutor(8) as ex:
        for n, _ in enumerate(ex.map(proforosi, leipoun), 1):
            if n % 25 == 0:
                print(f'  {n}/{len(leipoun)}', flush=True)

    out = []
    for r in an:
        try:
            out.append({
                'id': r['id'], 'imerominia': str(r['imerominia'])[:10], 'titlos': r['titlos'], 'keimeno': r.get('keimeno') or '',
                'fotografies': [{'arxeio': foto(f['id']), 'perigrafi': f.get('perigrafi', '')} for f in r.get('fotografies') or []],
                'arxeia': [arxeio(f) for f in r.get('arxeia') or []],
                'video': r.get('video') or [], 'syggrafeas': r.get('syggrafeas') or '', 'enotita': r['enotita'],
                'taxeis': r.get('taxeis') or [], 'diktya': r.get('diktya') or [], 'katastasi': 'Δημοσιευμένη'})
        except Exception as e:
            print(f'  παράλειψη ανάρτησης {r.get("id")}: {e}', file=sys.stderr)
    json.dump(out, open(dd / 'anartiseis.json', 'w', encoding='utf-8'), ensure_ascii=False)

    # Σελίδες: βάση το periexomeno/selides.json (δομή, ομάδες, δίκτυα)· από το Φύλλο τα κείμενα και τα αρχεία
    base = json.load(open(RIZA / 'periexomeno' / 'selides.json', encoding='utf-8'))
    apo = {s['id']: s for s in d.get('selides', [])}
    for s in base:
        f = apo.get(s['id'])
        if not f:
            continue
        for k in ('titlos', 'perigrafi', 'keimeno', 'simeiosi', 'katastasi'):
            if f.get(k) not in (None, ''):
                s[k] = f[k]
        s['fotografies'] = [{'arxeio': foto(x['id']), 'perigrafi': x.get('perigrafi', '')} for x in f.get('fotografies') or []]
        s['arxeia'] = [arxeio(x) for x in f.get('arxeia') or []]
        s.pop('apo_wp', None)
    if (RIZA / 'periexomeno' / 'selides-wp.json').exists():
        shutil.copy2(RIZA / 'periexomeno' / 'selides-wp.json', dd / 'selides-wp.json')
    json.dump(base, open(dd / 'selides.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(dims_p, 'w') as fh:
        json.dump(dims, fh)
    print(f'Από το Φύλλο: {len(out)} αναρτήσεις, {len(apo)} σελίδες, {nea} νέες φωτογραφίες.')


if __name__ == '__main__':
    main()
