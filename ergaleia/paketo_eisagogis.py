#!/usr/bin/env python3
"""
Ετοιμάζει τον φάκελο «Εισαγωγή» για τη μεταφορά του σημερινού περιεχομένου στον Πίνακα διαχείρισης.

  python ergaleia/paketo_eisagogis.py            (από τον φάκελο istotopos)

Βγάζει τον φάκελο  _eisagogi/Εισαγωγή/  με:
  eisagogi.json                  όλες οι αναρτήσεις (από 2024) και οι σελίδες με τα κείμενά τους
  fotografies/<διαδρομή>-1600.webp
  arxeia/<διαδρομή>
Τα περιεχόμενα του φακέλου ανεβαίνουν (σύρσιμο) στο Drive, στον φάκελο
«Ιστοσελίδα σχολείου – Αρχεία / Εισαγωγή», και μετά: Φύλλο → Ιστοσελίδα → 4. Εισαγωγή.
"""
import json, shutil
from pathlib import Path

RIZA = Path(__file__).resolve().parent.parent
P, M = RIZA / 'periexomeno', RIZA / 'meson'
OUT = RIZA / '_eisagogi' / 'Εισαγωγή'


def main():
    j = lambda p: json.load(open(p, encoding='utf-8'))
    an = [a for a in j(P / 'anartiseis.json') if a['imerominia'] >= '2024-01-01' and a.get('katastasi', 'Δημοσιευμένη') == 'Δημοσιευμένη']
    wp = {r['slug']: r for r in j(P / 'selides-wp.json')} if (P / 'selides-wp.json').exists() else {}
    sel = j(P / 'selides.json')
    for s in sel:
        w = wp.get(s.get('apo_wp') or '')
        if w and not s.get('keimeno'):
            s['keimeno'] = w['keimeno']
            s.setdefault('fotografies', w.get('fotografies', []))
            s.setdefault('arxeia', w.get('arxeia', []))
    OUT.mkdir(parents=True, exist_ok=True)
    leipoun, nf, na = [], 0, 0
    for x in an + sel:
        for f in x.get('fotografies') or []:
            base = f['arxeio'].rsplit('.', 1)[0]
            src = M / 'fotografies' / (base + '-1600.webp')
            if not src.exists():
                leipoun.append(f['arxeio']); continue
            dst = OUT / 'fotografies' / (base + '-1600.webp')
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not dst.exists():
                shutil.copy2(src, dst); nf += 1
        for rel in x.get('arxeia') or []:
            src = M / 'arxeia' / rel
            if not src.exists():
                leipoun.append(rel); continue
            dst = OUT / 'arxeia' / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not dst.exists():
                shutil.copy2(src, dst); na += 1
    pedia = ['id', 'slug', 'imerominia', 'titlos', 'enotita', 'taxeis', 'diktya', 'keimeno', 'fotografies', 'arxeia', 'video']
    out = {'anartiseis': [{k: a.get(k) for k in pedia} for a in an],
           'selides': [{k: s.get(k) for k in ('id', 'omada', 'seira', 'titlos', 'perigrafi', 'keimeno', 'simeiosi', 'katastasi', 'fotografies', 'arxeia')} for s in sel]}
    json.dump(out, open(OUT / 'eisagogi.json', 'w', encoding='utf-8'), ensure_ascii=False)
    print('Έτοιμο:', OUT)
    print('Αναρτήσεις', len(an), '· σελίδες', len(sel), '· φωτογραφίες', nf, '· αρχεία', na)
    if leipoun:
        print('Λείπουν', len(leipoun), 'αρχεία, π.χ.', leipoun[:3])


if __name__ == '__main__':
    main()
