"""Έλεγχος ΠΡΙΝ ανέβει η νέα έκδοση της ιστοσελίδας. Αν αποτύχει, η δημοσίευση σταματά και μένει online η προηγούμενη (σωστή) έκδοση.

Ελέγχει: (1) υπάρχουν οι βασικές σελίδες και δεν είναι άδειες, (2) οι αναρτήσεις δεν μειώθηκαν απότομα σε σχέση
με τη ζωντανή ιστοσελίδα (π.χ. από 126 σε 20, όταν δεν διαβάστηκε σωστά το Φύλλο).
Χρήση: python3 build/elegxos_dimosiefsis.py _site --live https://1dim-polichnis.gr [--xoris-sygkrisi]
"""
import argparse
import re
import sys
import urllib.request
from pathlib import Path

BASIKES = ['index.html', 'zoi/index.html', 'goneis/index.html', 'sxoleio/index.html', 'epikoinonia/index.html', 'sitemap.xml']


def anartiseis(xml):
    return len(set(re.findall(r'<loc>[^<]*/anartiseis/\d{4}/[^<]+</loc>', xml)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('site')
    ap.add_argument('--live', default='')
    ap.add_argument('--xoris-sygkrisi', action='store_true')
    a = ap.parse_args()
    site, lathi = Path(a.site), []
    for f in BASIKES:
        p = site / f
        if not p.exists():
            lathi.append(f'λείπει η σελίδα {f}')
        elif p.stat().st_size < (300 if f.endswith('.xml') else 3000):
            lathi.append(f'η σελίδα {f} είναι σχεδόν άδεια ({p.stat().st_size} bytes)')
    nea = anartiseis((site / 'sitemap.xml').read_text(encoding='utf-8')) if (site / 'sitemap.xml').exists() else 0
    print(f'Αναρτήσεις στη νέα έκδοση: {nea}')
    if a.live and not a.xoris_sygkrisi:
        try:
            with urllib.request.urlopen(a.live.rstrip('/') + '/sitemap.xml', timeout=20) as r:
                palia = anartiseis(r.read().decode('utf-8', 'replace'))
            print(f'Αναρτήσεις στη ζωντανή ιστοσελίδα: {palia}')
            if palia >= 20 and nea < palia * 0.8 and palia - nea > 5:
                lathi.append(f'οι αναρτήσεις μειώθηκαν απότομα ({palia} → {nea}). Πιθανόν δεν διαβάστηκε σωστά το Φύλλο. '
                             'Αν η μείωση είναι σκόπιμη, ξεκινήστε τη δημοσίευση με την επιλογή «Χωρίς σύγκριση».')
        except Exception as e:
            print(f'(η ζωντανή ιστοσελίδα δεν διαβάστηκε για σύγκριση: {e})')
    if lathi:
        for l in lathi:
            print(f'::error::Η νέα έκδοση ΔΕΝ ανεβαίνει: {l}')
        sys.exit(1)
    print('Όλα εντάξει: η νέα έκδοση ανεβαίνει.')


if __name__ == '__main__':
    main()
