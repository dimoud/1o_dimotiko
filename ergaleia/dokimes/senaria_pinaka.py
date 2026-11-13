"""Σενάρια από άκρη σε άκρη στον ΠΡΑΓΜΑΤΙΚΟ Πίνακα (Index.html + Code.gs στον πάγκο), σε πραγματικό περιηγητή.

Προϋποθέσεις: node, python3, `pip install playwright` και `python -m playwright install chromium`.
Εκτέλεση:   python ergaleia/dokimes/senaria_pinaka.py
(ξεκινά μόνο του τον διακομιστή δοκιμών στη θύρα 8788 και τον σταματά στο τέλος)

Κάθε σενάριο είναι κάτι που θα κάνει πραγματικά ένας εκπαιδευτικός ή η Διευθύντρια.
"""
import io
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ED = Path(__file__).resolve().parent
PORT = int(os.environ.get('PORT', 8788))
BASE = f'http://localhost:{PORT}/'
APOT = {'ok': 0, 'lathi': []}


def ok(onoma, synthiki, extra=''):
    if synthiki:
        APOT['ok'] += 1
        print('ΟΚ    ' + onoma)
    else:
        APOT['lathi'].append(onoma + (f'  [{extra}]' if extra else ''))
        print('ΛΑΘΟΣ ' + onoma + (f'  [{extra}]' if extra else ''))


def katastasi():
    return json.load(urllib.request.urlopen(BASE + '_state'))


def grammi(titlos=None, id_=None):
    for a in katastasi()['anartiseis']:
        if (id_ and str(a['id']) == id_) or (titlos and a['titlos'] == titlos):
            return a
    return None


def reset():
    urllib.request.urlopen(urllib.request.Request(BASE + '_reset', method='POST')).read()


def jpg():
    try:
        from PIL import Image
        b = io.BytesIO()
        Image.new('RGB', (1200, 800), (90, 140, 200)).save(b, 'JPEG')
        p = ED / '_dokimi.jpg'
        p.write_bytes(b.getvalue())
        return str(p)
    except ImportError:   # ελάχιστο έγκυρο JPEG
        p = ED / '_dokimi.jpg'
        p.write_bytes(bytes.fromhex('ffd8ffe000104a46494600010100000100010000ffdb004300') + b'\x08' * 64 + bytes.fromhex('ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda0008010100003f00d2cf20ffd9'))
        return str(p)


class Pinakas:
    def __init__(self, browser):
        self.ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, locale='el-GR', timezone_id='Europe/Athens')
        self.pg = self.ctx.new_page()
        self.lathi_js = []
        self.pg.on('pageerror', lambda e: self.lathi_js.append(str(e)))
        self.pg.on('dialog', lambda d: d.accept())

    def anoixe(self):
        self.pg.goto(BASE)
        self.pg.wait_for_timeout(300)

    def eisodos(self, rolos, email='daskala1@test.gr'):
        self.anoixe()
        if rolos == 'syntaktis':
            self.pg.fill('#lemail', email)
        self.pg.fill('#kod', 'dokimi-syntaktis' if rolos == 'syntaktis' else 'dokimi-dieythynsi')
        self.pg.click('#bLogin')
        self.pg.wait_for_selector('#tiles .tile', timeout=5000)
        self.pg.wait_for_timeout(300)

    def dlg_ok(self, keimeno=None):
        self.pg.wait_for_selector('#dlgOk', state='visible', timeout=3000)
        if keimeno is not None:
            self.pg.fill('#dlgV', keimeno)
        self.pg.click('#dlgOk')
        self.pg.wait_for_timeout(500)

    def msg(self, el):
        return self.pg.inner_text('#' + el) if self.pg.query_selector('#' + el) else ''

    def lista(self, f='all'):
        self.pg.evaluate(f"home()")
        self.pg.wait_for_timeout(400)
        self.pg.evaluate(f"openList('{f}')")
        self.pg.wait_for_timeout(400)

    def anoixe_anartisi(self, titlos, f='all'):
        self.lista(f)
        self.pg.click(f'#list .post:has-text("{titlos}")')
        self.pg.wait_for_timeout(700)

    def kleise(self):
        self.ctx.close()


def nea(p, titlos, keimeno, thesi='anakoinoseis', alles=(), taxeis=(), diktya=(), foto=None, synainesi=False, video=''):
    p.pg.evaluate('edit(null)')
    p.pg.wait_for_timeout(300)
    p.pg.fill('#f-titl', titlos)
    p.pg.click('#rte')
    p.pg.keyboard.type(keimeno)
    if foto:
        p.pg.set_input_files('#f-foto', foto)
        p.pg.wait_for_function('BUSY === 0', timeout=8000)
    if synainesi:
        p.pg.check('#f-syn')
    p.pg.click(f'.sec-btn[data-v="{thesi}"]')
    for a in alles:
        p.pg.check(f'#f-alles input[value="{a}"]')
    for t in taxeis:
        p.pg.check(f'#f-tax input[value="{t}"]')
    for d in diktya:
        p.pg.check(f'#f-dik input[value="{d}"]')
    if video:
        p.pg.fill('#f-vid', video)


def senaria(browser):
    foto = jpg()

    # ── 1. Ο δάσκαλος γράφει νέα ανάρτηση με όλα τα πεδία και τη στέλνει
    reset()
    d = Pinakas(browser); d.eisodos('syntaktis')
    ok('ο δάσκαλος βλέπει μόνο τα δικά του πλακίδια', d.pg.eval_on_selector_all('#tiles .tile b', 'e=>e.map(x=>x.textContent)') == ['Νέα ανάρτηση', 'Οι αναρτήσεις', 'Οδηγίες χρήσης'])
    nea(d, 'Επίσκεψη στο Μουσείο Φυσικής Ιστορίας', 'Οι μαθητές της Γ΄ τάξης επισκέφθηκαν το μουσείο.', thesi='episkepseis',
        alles=['s:syllogos-goneon'], taxeis=['Γ'], diktya=['oikologika'], foto=foto, synainesi=True, video='https://youtu.be/dQw4w9WgXcQ')
    d.pg.click('text=Αποστολή στη Διευθύντρια'); d.pg.wait_for_timeout(900)
    a = grammi('Επίσκεψη στο Μουσείο Φυσικής Ιστορίας')
    ok('1. η ανάρτηση στάλθηκε για έγκριση', a and a['katastasi'] == 'Προς έγκριση', a and a['katastasi'])
    if a:
        f = json.loads(a['fotografies'] or '[]')
        ok('1. φωτογραφία ανέβηκε και κρατήθηκε', len(f) == 1 and f[0].get('id'), a['fotografies'])
        ok('1. θέσεις, τάξη, δίκτυο, βίντεο, συγγραφέας', a['enotita'] == 'episkepseis' and a['alles_enotites'] == 's:syllogos-goneon' and a['taxeis'] == 'Γ'
           and a['diktya'] == 'oikologika' and 'youtu.be' in a['video'] and a['syggrafeas'], json.dumps({k: a[k] for k in ('enotita', 'alles_enotites', 'taxeis', 'diktya', 'syggrafeas')}, ensure_ascii=False))
        ok('1. συγκατάθεση αποθηκεύτηκε', a['synainesi'] in (True, 'TRUE', 'true'), a['synainesi'])
    ok('1. η Διεύθυνση πήρε email ειδοποίησης', any('Μουσείο' in json.dumps(m, ensure_ascii=False) for m in katastasi()['mail']))

    # ── 2. Η Διευθύντρια την εγκρίνει από το «Περιμένουν έγκριση»
    D = Pinakas(browser); D.eisodos('diefthynsi')
    D.pg.wait_for_timeout(600)
    ok('2. ο μετρητής «Περιμένουν έγκριση» δείχνει 1', D.pg.inner_text('#waitN').strip() == '1', D.pg.inner_text('#waitN'))
    D.anoixe_anartisi('Επίσκεψη στο Μουσείο', 'wait')
    ok('2. ανοίγει ο έλεγχος (όχι ο επεξεργαστής)', D.pg.is_visible('#v-review'))
    D.pg.click('#v-review >> text=Δημοσίευση στην ιστοσελίδα'); D.dlg_ok()
    a = grammi('Επίσκεψη στο Μουσείο Φυσικής Ιστορίας')
    ok('2. δημοσιεύτηκε, με ώρα πρώτης δημοσίευσης', a['katastasi'] == 'Δημοσιευμένη' and a.get('dimosiefthike'), a['katastasi'])
    ok('2. ξεκίνησε η δημοσίευση στο GitHub', katastasi()['dispatches'] >= 1)

    # ── 3. Ο δάσκαλος διορθώνει τη δημοσιευμένη: γίνεται πρόταση, η ιστοσελίδα μένει ίδια ως την έγκριση
    d.anoixe_anartisi('Επίσκεψη στο Μουσείο')
    ok('3. ο δάσκαλος ανοίγει τη δημοσιευμένη στον επεξεργαστή', d.pg.is_visible('#v-edit'))
    d.pg.fill('#f-titl', 'Επίσκεψη στο Μουσείο Φυσικής Ιστορίας Θεσσαλονίκης')
    d.pg.click('text=Αποστολή στη Διευθύντρια'); d.pg.wait_for_timeout(900)
    a = grammi(id_=a['id'])
    ok('3. ο τίτλος στην ιστοσελίδα δεν άλλαξε ακόμα', a['titlos'] == 'Επίσκεψη στο Μουσείο Φυσικής Ιστορίας' and a['katastasi'] == 'Δημοσιευμένη', a['titlos'])
    ok('3. η πρόταση κρατήθηκε', 'Θεσσαλονίκης' in str(a.get('protasi') or ''), str(a.get('protasi'))[:80])
    D.anoixe_anartisi('Επίσκεψη στο Μουσείο', 'wait')
    ok('3. η Διευθύντρια βλέπει «πρότεινε αλλαγή»', 'πρότεινε αλλαγή' in D.pg.inner_text('#rvSub'))
    D.pg.click('#v-review >> text=Δημοσίευση στην ιστοσελίδα'); D.dlg_ok()
    a = grammi(id_=a['id'])
    ok('3. μετά την έγκριση: νέος τίτλος, ίδια φωτογραφία, ίδιες θέσεις', a['titlos'].endswith('Θεσσαλονίκης') and len(json.loads(a['fotografies'])) == 1
       and a['alles_enotites'] == 's:syllogos-goneon' and not a.get('protasi'), a['titlos'])

    # ── 4. Παλιά ανάρτηση του WordPress: ο δάσκαλος αλλάζει μόνο το κείμενο
    d.anoixe_anartisi('Μικροί μεγάλοι εν δράσει')
    ok('4. η παλιά ανοίγει με τις 2 φωτογραφίες της', d.pg.eval_on_selector_all('#photos .ph', 'e=>e.length') == 2)
    ok('4. και με τις θέσεις/τάξη/δίκτυο της', d.pg.is_checked('#f-alles input[value="perivallon"]') and d.pg.is_checked('#f-tax input[value="ΣΤ"]')
       and d.pg.is_checked('#f-dik input[value="oikologika"]') and d.pg.get_attribute('.sec-btn.on', 'data-v') == 'draseis')
    d.pg.click('#rte'); d.pg.keyboard.press('Control+End'); d.pg.keyboard.type(' Συγχαρητήρια σε όλους!')
    d.pg.click('text=Αποστολή στη Διευθύντρια'); d.pg.wait_for_timeout(900)
    D.anoixe_anartisi('Μικροί μεγάλοι εν δράσει', 'wait')
    D.pg.click('#v-review >> text=Δημοσίευση στην ιστοσελίδα'); D.dlg_ok()
    a = grammi(id_='wp6511')
    ok('4. μετά την έγκριση η παλιά κράτησε φωτογραφίες, λεζάντα, θέσεις, τάξη, δίκτυο', len(json.loads(a['fotografies'])) == 2 and 'Στην αυλή' in a['fotografies']
       and a['alles_enotites'] == 'perivallon' and a['taxeis'] == 'ΣΤ' and a['diktya'] == 'oikologika' and 'Συγχαρητήρια' in a['keimeno'], json.dumps({k: a[k] for k in ('alles_enotites', 'taxeis', 'diktya')}, ensure_ascii=False))
    ok('4. η λίστα στο κείμενο έμεινε λίστα', '- πρώτο\n- δεύτερο' in a['keimeno'], a['keimeno'][-80:])

    # ── 5. Η Διευθύντρια μεταφέρει παλιά ανάρτηση στον Σύλλογο Γονέων και τη δημοσιεύει απευθείας
    D.anoixe_anartisi('Χριστουγεννιάτικη γιορτή')
    D.pg.click('.sec-btn[data-v="s:syllogos-goneon"]')
    D.pg.click('#edActions >> text=Δημοσίευση στην ιστοσελίδα'); D.dlg_ok()
    a = grammi(id_='wp6100')
    ok('5. νέα κύρια θέση, παλιά τάξεις και φωτογραφία μένουν', a['enotita'] == 's:syllogos-goneon' and a['taxeis'] == 'Α,Β' and len(json.loads(a['fotografies'])) == 1, a['enotita'])

    # ── 6. Επιστροφή με σχόλιο και ξανά αποστολή
    nea(d, 'Γιορτή του φθινοπώρου', 'Τραγούδια για το φθινόπωρο.', thesi='giortes')
    d.pg.click('text=Αποστολή στη Διευθύντρια'); d.pg.wait_for_timeout(900)
    D.anoixe_anartisi('Γιορτή του φθινοπώρου', 'wait')
    D.pg.click('#v-review >> text=Επιστροφή στον συντάκτη'); D.dlg_ok('Προσθέστε μία φωτογραφία, παρακαλώ.')
    a = grammi('Γιορτή του φθινοπώρου')
    ok('6. επιστράφηκε με σχόλιο', a['katastasi'] == 'Επιστράφηκε' and 'φωτογραφία' in a['sxolio'], a['katastasi'])
    d.pg.evaluate('home()'); d.pg.wait_for_timeout(700)
    ok('6. ο δάσκαλος βλέπει μήνυμα επιστροφής στην αρχή', 'επιστράφηκαν' in d.msg('homeMsg'), d.msg('homeMsg'))
    d.anoixe_anartisi('Γιορτή του φθινοπώρου')
    ok('6. βλέπει το σχόλιο μέσα στην ανάρτηση', 'φωτογραφία' in d.pg.inner_text('#v-edit'))
    d.pg.set_input_files('#f-foto', foto); d.pg.wait_for_function('BUSY === 0', timeout=8000); d.pg.check('#f-syn')
    d.pg.click('text=Αποστολή στη Διευθύντρια'); d.pg.wait_for_timeout(900)
    a = grammi('Γιορτή του φθινοπώρου')
    ok('6. ξαναστάλθηκε με φωτογραφία', a['katastasi'] == 'Προς έγκριση' and len(json.loads(a['fotografies'])) == 1, a['katastasi'])

    # ── 7. Πρόχειρο που χάνεται (κλείσιμο χωρίς αποθήκευση) και επαναφορά
    nea(d, 'Ανακοίνωση για την εκδρομή', 'Η εκδρομή θα γίνει την Παρασκευή.', thesi='anakoinoseis')
    d.pg.wait_for_timeout(2500)
    d.pg.reload(); d.pg.wait_for_timeout(1200)
    d.pg.evaluate('edit(null)'); d.pg.wait_for_timeout(500)
    proteinei = d.pg.is_visible('#dlgOk')
    if proteinei:
        d.dlg_ok()
    ok('7. μετά από ανανέωση της σελίδας προτείνεται το χαμένο κείμενο', proteinei and d.pg.input_value('#f-titl') == 'Ανακοίνωση για την εκδρομή', d.pg.input_value('#f-titl'))
    d.pg.evaluate('home()')

    # ── 8. Φίλτρα και αναζήτηση στη λίστα
    D.lista('all')
    th = D.pg.eval_on_selector_all('#fThema button', 'e=>e.map(x=>x.textContent)')
    ok('8. στη Θεματολογία εμφανίζεται ο Σύλλογος (έχει αναρτήσεις)', any('Σύλλογος' in x for x in th), str(th)[:200])
    ok('8. δεν εμφανίζονται σελίδες χωρίς αναρτήσεις', not any('Ε.Δ.Υ.' in x for x in th))
    D.pg.fill('#q', 'αγιασμός'); D.pg.wait_for_timeout(300)
    ok('8. αναζήτηση με λέξη (πεζά, χωρίς τόνο στη θέση του)', D.pg.eval_on_selector_all('#list .post', 'e=>e.length') == 1, D.pg.eval_on_selector_all('#list .post', 'e=>e.length'))
    for q in ('αγιασμος', 'ΑΓΙΑΣΜΟΣ', 'Αγιασμός νέας'):
        D.pg.fill('#q', q); D.pg.wait_for_timeout(250)
        ok(f'8. αναζήτηση «{q}»', D.pg.eval_on_selector_all('#list .post', 'e=>e.length') == 1)
    D.pg.fill('#q', '')

    # ── 9. Δεύτερος δάσκαλος βλέπει και διορθώνει ανάρτηση του πρώτου (κοινός κωδικός Συντάκτη)
    d2 = Pinakas(browser); d2.eisodos('syntaktis', 'daskalos2@test.gr')
    d2.anoixe_anartisi('Γιορτή του φθινοπώρου')
    ok('9. δεύτερος δάσκαλος ανοίγει ανάρτηση συναδέλφου', d2.pg.is_visible('#v-edit'))
    d2.kleise()

    # ── 10. Πολλές αναρτήσεις: η λίστα δεν κρύβει τις παλιότερες
    D.pg.evaluate("ALL = ALL.concat(Array.from({length: 120}, (_, i) => ({id: 'x' + i, titlos: 'Παλιά ' + i, katastasi: 'Δημοσιευμένη', imerominia: '2024-10-01', enotita: 'anakoinoseis', arithmos: 500 + i}))); drawList();")
    D.pg.wait_for_timeout(300)
    n = D.pg.eval_on_selector_all('#list .post', 'e=>e.length')
    more = D.pg.query_selector('#list .list-more, #listMore')
    ok('10. με 120+ αναρτήσεις υπάρχει τρόπος να φανούν όλες', more is not None or n >= 120, f'{n} εμφανίζονται')
    if more:
        while D.pg.query_selector('#listMore'):
            D.pg.click('#listMore'); D.pg.wait_for_timeout(150)
        ok('10. με «Περισσότερες» φαίνονται όλες', D.pg.eval_on_selector_all('#list .post', 'e=>e.length') >= 120 + 4)

    # ── 12. Αναφορά προβλήματος: κουμπί ορατό παντού, στέλνει με τα στοιχεία της οθόνης
    for v, js in (('αρχική', 'home()'), ('λίστα', "openList('all')"), ('επεξεργαστής', 'edit(null)')):
        d.pg.evaluate(js); d.pg.wait_for_timeout(300)
        ok(f'12. κουμπί «Αναφορά προβλήματος» ορατό ({v})', d.pg.is_visible('#bugBtn'))
    d.pg.fill('#f-titl', 'Δοκιμή αναφοράς')
    m0 = len(katastasi()['mail'])
    if d.pg.is_visible('#dlg'): d.pg.keyboard.press('Escape'); d.pg.wait_for_timeout(200)
    d.pg.click('#bugBtn'); d.pg.wait_for_selector('#bugDlg:not(.hidden)', timeout=3000)
    ok('12. μεγάλο παράθυρο αναφοράς με ερωτήσεις', d.pg.is_visible('#bugTi') and d.pg.is_visible('#bugEg') and d.pg.is_visible('#bugDrop')
       and d.pg.evaluate("document.querySelector('#bugDlg .box').getBoundingClientRect().width") >= 700)
    d.pg.click('#bugOk'); d.pg.wait_for_timeout(200)
    ok('12. χωρίς «τι έγινε» δεν στέλνει', 'Γράψτε στο 2' in d.pg.inner_text('#bugMsg') and len(katastasi()['mail']) == m0)
    d.pg.fill('#bugTi', 'Ήθελα να στείλω ανάρτηση.'); d.pg.fill('#bugEg', 'Πάτησα Αποστολή και βγήκε κόκκινο μήνυμα.')
    d.pg.check('input[name=bugVar][value="Δεν μπορώ να συνεχίσω"]', force=True); d.pg.check('input[name=bugEp][value="Ναι, κάθε φορά"]', force=True)
    d.pg.set_input_files('#bugFile', foto); d.pg.wait_for_selector('#bugThumbs img', timeout=4000)
    ok('12. η εικόνα φαίνεται ως μικρογραφία', d.pg.eval_on_selector_all('#bugThumbs img', 'e=>e.length') == 1)
    d.pg.click('#bugOk'); d.pg.wait_for_timeout(1200)
    mm = katastasi()['mail'][m0:]
    body = mm[0].get('body', '') if mm else ''
    ok('12. η αναφορά στάλθηκε με email', len(mm) == 1 and 'κόκκινο μήνυμα' in body and 'Ήθελα να στείλω' in body and 'Δεν μπορώ να συνεχίσω' in body
       and 'Ναι, κάθε φορά' in body and 'edit' in body and 'Δοκιμή αναφοράς' in body, str(mm)[:200])
    ok('12. η εικόνα πήγε συνημμένη', bool(mm) and len(mm[0].get('attachments') or []) == 1 and mm[0]['attachments'][0]['mime'] == 'image/jpeg', str(mm[0].get('attachments') if mm else None))
    ok('12. επιβεβαίωση «Στάλθηκε» στον εκπαιδευτικό', 'Στάλθηκε' in d.pg.inner_text('#dlgT'))
    d.pg.click('#dlgOk')
    lg = browser.new_context(viewport={'width': 1280, 'height': 900}).new_page(); lg.goto(BASE); lg.wait_for_timeout(300)
    ok('12. κουμπί ΚΡΥΦΟ πριν από τη σύνδεση', not lg.is_visible('#bugBtn')); lg.context.close()
    d.pg.evaluate('logout()'); d.pg.wait_for_timeout(200)
    ok('12. κουμπί κρύβεται μετά την αποσύνδεση', not d.pg.is_visible('#bugBtn'))

    # ── 13. Σημεία στίξης: ό,τι γράφει ο εκπαιδευτικός μένει ίδιο σε Φύλλο, επεξεργαστή και ιστοσελίδα
    K13 = ('Παρ. 3 & 4 του άρθρου 5. «Εισαγωγικά» “διπλά” ‘μονά’ \'απλά\' "διπλά". 5 < 7 > 2, 50% ~ 1/2. Ερωτηματικό; Άνω τελεία· Θαυμαστικό! '
           '- – — (παρενθέσεις) [αγκύλες] {άγκιστρα}. a+b@test.gr 10€ $5 #ετικέτα @χρήστης ^ ` | ϊ ΰ Ϊ. 7 * 8. Τέλος…')
    T13 = 'Στίξη: «Σ.Ε.Π.» & γονείς – 3/4 (Α΄ τάξη) “x”'
    ok('12. κανένα σφάλμα JavaScript στην αναφορά', not d.lathi_js, '; '.join(d.lathi_js)[:300])
    d.kleise(); d = Pinakas(browser); d.eisodos('syntaktis')
    nea(d, T13, K13); d.pg.click('text=Αποστολή στη Διευθύντρια')
    d.pg.wait_for_timeout(900)
    a = grammi(T13)
    ok('13. τίτλος και κείμενο αποθηκεύτηκαν αυτούσια', bool(a) and a['keimeno'] == K13 and a['titlos'] == T13, repr(a and a['keimeno'])[:160])
    d.anoixe_anartisi('Στίξη:')
    ok('13. ξανανοίγει ίδιο στον επεξεργαστή', d.pg.inner_text('#rte').strip() == K13 and d.pg.input_value('#f-titl') == T13, repr(d.pg.inner_text('#rte'))[:160])
    import sys as _s; _s.path.insert(0, str(ED.parent.parent / 'build')); import md as _md, html as _h, re as _re
    ok('13. η ιστοσελίδα δείχνει ακριβώς το ίδιο', _h.unescape(_re.sub(r'<[^>]+>', '', _md.pros_html(K13))).strip() == K13)
    ok('13. παλιό «&amp;» (WordPress) βγαίνει ως «&»', _h.unescape(_re.sub(r'<[^>]+>', '', _md.pros_html('3 &amp; 4 &amp;amp; 5'))).strip() == '3 & 4 & 5')

    # ── 11. Κινητό: καμία οριζόντια κύλιση σε καμία οθόνη του Πίνακα (λάθος 13/11: η κεφαλίδα ξεχείλιζε 100 px)
    for w in (360, 390):
        m = browser.new_context(viewport={'width': w, 'height': 800}, is_mobile=True, has_touch=True).new_page()
        m.goto(BASE); m.fill('#lemail', 'daskala1@test.gr'); m.fill('#kod', 'dokimi-syntaktis'); m.click('#bLogin'); m.wait_for_selector('#tiles .tile')
        for v, js in (('αρχική', 'home()'), ('λίστα', "openList('all')"), ('επεξεργαστής', 'edit(null)'), ('οδηγίες', "nav('odigies')")):
            m.evaluate(js); m.wait_for_timeout(400)
            sw = m.evaluate('document.documentElement.scrollWidth')
            ok(f'11. κινητό {w}px, {v}: χωρίς οριζόντια κύλιση', sw <= w, f'{sw}px')
        m.context.close()

    for p, ονομα in ((d, 'δάσκαλος'), (D, 'Διευθύντρια')):
        ok(f'κανένα σφάλμα JavaScript ({ονομα})', not p.lathi_js, '; '.join(p.lathi_js)[:300])
    d.kleise(); D.kleise()


def main():
    srv = subprocess.Popen(['node', str(ED / 'diakomistis.js'), str(PORT)], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        for _ in range(40):
            try:
                urllib.request.urlopen(BASE, timeout=1)
                break
            except Exception:
                time.sleep(0.2)
        with sync_playwright() as pw:
            b = pw.chromium.launch()
            senaria(b)
            b.close()
    finally:
        srv.terminate()
        (ED / '_dokimi.jpg').unlink(missing_ok=True)
    print(f"\n{APOT['ok']} σωστά, {len(APOT['lathi'])} λάθη")
    for l in APOT['lathi']:
        print('  - ' + l)
    sys.exit(1 if APOT['lathi'] else 0)


if __name__ == '__main__':
    main()
