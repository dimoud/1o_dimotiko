/* Δοκιμές του Code.gs (χωρίς περιηγητή, χωρίς εξαρτήσεις): node ergaleia/dokimes/dokimes_diakomisti.js
 * Κάθε έλεγχος είναι κάτι που θα κάνει ένας εκπαιδευτικός ή η Διευθύντρια, ή κάτι που πήγε στραβά στο παρελθόν. */
'use strict';
const { neosPagkos, DASKALOI } = require('./pagkos');
const sporos = require('./sporos');

let N = 0; const LATHI = [];
function ok(onoma, c, extra) { N++; if (!c) LATHI.push(onoma + (extra ? '  [' + extra + ']' : '')); console.log((c ? 'ΟΚ    ' : 'ΛΑΘΟΣ ') + onoma + (!c && extra ? '  [' + extra + ']' : '')); }
function lathos(f) { try { f(); return ''; } catch (e) { return e.message; } }
function base(t, o) { return Object.assign({ id: '', imerominia: '2026-11-12', titlos: t, enotita: 'anakoinoseis', alles_enotites: [], taxeis: [], diktya: [], keimeno: 'Κείμενο.', fotografies: [], arxeia: [], video: '', syggrafeas: 'Μαρία Δοκιμή', synainesi: false }, o || {}); }

const g = neosPagkos(); sporos(g);
const D = g.syndesi('diefthynsi'), K = g.syndesi('syntaktis'), K2 = g.syndesi('syntaktis', DASKALOI[1].email);
const save = (tok, d, en) => g.call('apothikefsi', [tok, d, en]);
const fere = (tok, id) => g.call('fereAnartisi', [tok, id]);
const apof = (tok, id, p, sx) => g.call('apofasi', [tok, id, p, sx || '', fere(D, id).ekdosi]);

// ── Είσοδος
ok('είσοδος: λάθος κωδικός', /Λάθος|λάθος/.test(g.call('syndesi', ['xxxx', '']).minima));
ok('είσοδος: σωστός κωδικός Συντάκτη, email εκτός λίστας → σαφές μήνυμα', /δεν είναι στη λίστα/.test(g.call('syndesi', ['dokimi-syntaktis', 'agnostos@test.gr']).minima));
ok('είσοδος: σωστός κωδικός Συντάκτη, χωρίς email → ζητά email', /email/.test(g.call('syndesi', ['dokimi-syntaktis', '']).minima));
ok('είσοδος: email με κεφαλαία και κενά', g.call('syndesi', ['dokimi-syntaktis', ' Daskala1@TEST.gr ']).ok);

// ── Νέα ανάρτηση δασκάλου μόνο με κείμενο → έγκριση (λάθος 13/11: η έγκριση ζητούσε συγκατάθεση χωρίς φωτογραφίες)
let r = save(K, base('Ανακοίνωση μόνο με κείμενο'), 'egkrisi');
ok('δάσκαλος: αποστολή χωρίς φωτογραφίες', r.ok);
ok('η Διευθύντρια εγκρίνει ανάρτηση χωρίς φωτογραφίες', !lathos(() => apof(D, r.id, 'egkrisi')));
ok('δημοσιευμένη με ώρα πρώτης δημοσίευσης', fere(D, r.id).katastasi === 'Δημοσιευμένη' && !!g.grammi(r.id).dimosiefthike);

// ── Φωτογραφίες και συγκατάθεση
ok('φωτογραφίες χωρίς συγκατάθεση: δεν στέλνεται', /συγκατάθεση/.test(lathos(() => save(K, base('Με φωτογραφίες', { fotografies: [{ id: 'f1' }] }), 'egkrisi'))));
r = save(K, base('Με φωτογραφίες και συγκατάθεση', { fotografies: [{ id: 'f1', perigrafi: 'Λεζάντα' }], synainesi: true }), 'egkrisi');
ok('έγκριση με φωτογραφίες και συγκατάθεση', !lathos(() => apof(D, r.id, 'egkrisi')));
let p = save(D, base('Δημοσιευμένη με φωτό', { fotografies: [{ id: 'f2' }], synainesi: true }), 'dimosiefsi');
save(K, base('Πρόταση: πρόσθεσα φωτό χωρίς τικ', { id: p.id, ekdosi: fere(K, p.id).ekdosi, fotografies: [{ id: 'f2' }, { id: 'f3' }], synainesi: false }), 'proxeiro');
ok('πρόταση με νέα φωτό χωρίς συγκατάθεση: η έγκριση σταματά με οδηγία', /συγκατάθεσης/.test(lathos(() => apof(D, p.id, 'egkrisi'))));

// ── Δικαιώματα
ok('ο δάσκαλος δεν δημοσιεύει', /Μόνο η Διεύθυνση/.test(lathos(() => save(K, base('Θέλω δημοσίευση'), 'dimosiefsi'))));
let pr = save(K, base('Πρόχειρο δασκάλου'), 'proxeiro');
ok('ο δάσκαλος δεν εγκρίνει/αποσύρει', !!lathos(() => apof(K, pr.id, 'aposyrsi')) && !!lathos(() => apof(K, pr.id, 'egkrisi')));
ok('ο δάσκαλος δεν βλέπει/αλλάζει σελίδες και ρυθμίσεις', !!lathos(() => g.call('listaSelidon', [K])) && !!lathos(() => g.call('rythmiseis', [K])) && !!lathos(() => g.call('allagiKodikou', [K, 'syntaktis', '12345678'])));
ok('δεύτερος δάσκαλος διορθώνει πρόχειρο συναδέλφου', !lathos(() => save(K2, base('Πρόχειρο δασκάλου (διόρθωση)', { id: pr.id, ekdosi: fere(K2, pr.id).ekdosi }), 'egkrisi')));

// ── Θέσεις: ενότητες και σελίδες
r = save(K, base('Γενική συνέλευση Συλλόγου', { enotita: 's:syllogos-goneon', alles_enotites: ['goneis', 's:syllogos-goneon', 's:proxeiri-selida', 'agnosti'] }), 'egkrisi');
ok('κύρια θέση σε σελίδα (Σύλλογος Γονέων)', r.ok);
ok('επιπλέον θέσεις: μόνο οι έγκυρες', g.grammi(r.id).alles_enotites === 'goneis', g.grammi(r.id).alles_enotites);
ok('αδημοσίευτη σελίδα δεν δέχεται αναρτήσεις', /Διαλέξτε/.test(lathos(() => save(K, base('Σε πρόχειρη σελίδα', { enotita: 's:proxeiri-selida' }), 'egkrisi'))));
const O = g.call('epiloges_', []).enotites.map(e => e[0]);
ok('επιλογές: όλες οι ενότητες + δημοσιευμένες σελίδες, όχι πρόχειρες, όχι διπλός κήπος', O.includes('s:syllogos-goneon') && O.includes('s:edy') && !O.includes('s:proxeiri-selida') && !O.includes('s:kipos') && O.includes('kipos'));

// ── Τίτλοι, ημερομηνίες, κείμενα
ok('τίτλος 4 γραμμάτων: μήνυμα', /τουλάχιστον 5/.test(lathos(() => save(K, base('Άβγα'), 'egkrisi'))));
ok('ημερομηνία πριν από το 2024: μήνυμα', /2024/.test(lathos(() => save(K, base('Παλιά γιορτή', { imerominia: '2023-12-20' }), 'egkrisi'))));
ok('μελλοντική ημερομηνία, emoji, εισαγωγικά, <b>', !lathos(() => save(K, base('Γιορτή 25ης Μαρτίου 🇬🇷 «Χρόνια πολλά» & "φίλοι" <b>', { imerominia: '2027-03-25' }), 'egkrisi')));
ok('χωρίς κείμενο και χωρίς φωτογραφίες: μήνυμα', /κείμενο/.test(lathos(() => save(K, base('Τελείως άδεια', { keimeno: '  ' }), 'egkrisi'))));
ok('δάσκαλος χωρίς όνομα: μήνυμα', /Ποιος/.test(lathos(() => save(K, base('Χωρίς συγγραφέα', { syggrafeas: ' ' }), 'egkrisi'))));
r = save(K, base('=1+1 τύπος στον τίτλο', { keimeno: '- λίστα\n+30 2310\n@όνομα' }), 'proxeiro');
ok('κείμενο που μοιάζει με τύπο του Excel μένει κείμενο', fere(D, r.id).titlos === '=1+1 τύπος στον τίτλο' && fere(D, r.id).keimeno === '- λίστα\n+30 2310\n@όνομα');
ok('πολύ μεγάλο κείμενο: μήνυμα, όχι σπασμένο κελί', !!lathos(() => save(K, base('Τεράστιο', { keimeno: 'α'.repeat(46000) }), 'proxeiro')));
ok('βίντεο εκτός YouTube: μήνυμα', /YouTube/.test(lathos(() => save(K, base('Βίντεο Facebook', { video: 'https://www.facebook.com/watch?v=1' }), 'egkrisi'))));
ok('βίντεο YouTube (και live)', !lathos(() => save(K, base('Βίντεο YouTube', { video: 'https://youtu.be/dQw4w9WgXcQ https://www.youtube.com/live/abcDEF12345' }), 'egkrisi')));

// ── Παλιές αναρτήσεις WordPress (wpNNNN)
ok('η Διευθύντρια διορθώνει παλιά χωρίς συγγραφέα', !lathos(() => save(D, Object.assign(fere(D, 'wp5900'), { titlos: 'Αγιασμός νέας σχολικής χρονιάς 2024', syggrafeas: '' }), 'dimosiefsi')));
const w = fere(K, 'wp6511');
save(K, Object.assign({}, w, { keimeno: w.keimeno + ' Μπράβο!', syggrafeas: 'Μαρία Δοκιμή', alles_enotites: String(w.alles_enotites).split(',').filter(String), taxeis: String(w.taxeis).split(',').filter(String), diktya: String(w.diktya).split(',').filter(String) }), 'egkrisi');
ok('πρόταση δασκάλου σε παλιά: η ζωντανή μένει ίδια', !/Μπράβο/.test(g.grammi('wp6511').keimeno) && !!g.grammi('wp6511').protasi);
apof(D, 'wp6511', 'egkrisi');
const w2 = g.grammi('wp6511');
ok('μετά την έγκριση η παλιά κρατά φωτογραφίες, λεζάντα, θέσεις, τάξη, δίκτυο', /Μπράβο/.test(w2.keimeno) && JSON.parse(w2.fotografies).length === 2 && /Στην αυλή/.test(w2.fotografies) && w2.alles_enotites === 'perivallon' && w2.taxeis === 'ΣΤ' && w2.diktya === 'oikologika', JSON.stringify({ a: w2.alles_enotites, t: w2.taxeis, d: w2.diktya }));

// ── Επιστροφή, ξανά αποστολή, απόσυρση, επαναφορά
r = save(K, base('Θα επιστραφεί'), 'egkrisi'); apof(D, r.id, 'epistrofi', 'Διορθώστε την ημερομηνία');
let c = fere(K, r.id);
ok('ο δάσκαλος βλέπει την επιστροφή με το σχόλιο', c.katastasi === 'Επιστράφηκε' && c.sxolio === 'Διορθώστε την ημερομηνία');
save(K, base('Θα επιστραφεί (διορθωμένη)', { id: r.id, ekdosi: c.ekdosi }), 'egkrisi');
ok('ξανά αποστολή μετά από επιστροφή', fere(D, r.id).katastasi === 'Προς έγκριση');
apof(D, r.id, 'egkrisi'); apof(D, r.id, 'aposyrsi');
ok('απόσυρση στον κάδο', fere(D, r.id).katastasi === 'Αποσυρμένη');
apof(D, r.id, 'epanafora');
ok('επαναφορά', fere(D, r.id).katastasi === 'Δημοσιευμένη');
// λάθος 13/11: επιστραμμένη ή πρόχειρη δεν αφαιρούνταν· και η επαναφορά τη δημοσίευε κατά λάθος
r = save(K, base('Επιστραμμένη για αφαίρεση'), 'egkrisi'); apof(D, r.id, 'epistrofi', 'δεν θα ανέβει');
let d0 = g.dispatches.length;
ok('η Διευθύντρια αφαιρεί επιστραμμένη ανάρτηση (στον κάδο)', !lathos(() => apof(D, r.id, 'aposyrsi')) && fere(D, r.id).katastasi === 'Αποσυρμένη' && fere(D, r.id).prin_kado === 'Επιστράφηκε');
ok('αφαίρεση μη δημοσιευμένης: δεν ξεκινά δημοσίευση', g.dispatches.length === d0);
apof(D, r.id, 'epanafora');
ok('επαναφορά επιστραμμένης: γυρνά «Επιστράφηκε», δεν δημοσιεύεται', fere(D, r.id).katastasi === 'Επιστράφηκε' && g.dispatches.length === d0);
pr = save(D, base('Πρόχειρο για αφαίρεση'), 'proxeiro'); apof(D, pr.id, 'aposyrsi'); apof(D, pr.id, 'epanafora');
ok('πρόχειρο: αφαίρεση και επαναφορά ως πρόχειρο', fere(D, pr.id).katastasi === 'Πρόχειρο');
ok('διπλή αφαίρεση: μήνυμα', (apof(D, pr.id, 'aposyrsi'), /ήδη στον κάδο/.test(lathos(() => apof(D, pr.id, 'aposyrsi')))));

// ── Ταυτόχρονη επεξεργασία
r = save(D, base('Δύο ταυτόχρονα'), 'proxeiro');
const A = fere(D, r.id), B = fere(K, r.id);
save(D, base('Δύο ταυτόχρονα (Α)', { id: r.id, ekdosi: A.ekdosi }), 'proxeiro');
ok('δεύτερη αποθήκευση με παλιά έκδοση → σύγκρουση, όχι σιωπηλή αντικατάσταση', /SYGKROUSI/.test(lathos(() => save(K, base('Δύο ταυτόχρονα (Β)', { id: r.id, ekdosi: B.ekdosi }), 'proxeiro'))));

// ── Ειδοποιήσεις και δημοσίευση
ok('η Διεύθυνση παίρνει email για νέα προς έγκριση', g.mail.some(m => /Ανακοίνωση μόνο με κείμενο/.test(JSON.stringify(m))));
ok('κάθε δημοσίευση ξεκινά τη δημοσίευση στο GitHub', g.dispatches.length >= 5, String(g.dispatches.length));

// ── Αναφορά προβλήματος (κουμπί 🐞)
g.props.DEV_EMAIL = 'developer@test.gr';
let m0 = g.mail.length;
ok('αναφορά από εκπαιδευτικό: email στον υπεύθυνο, με «Απάντηση» στον εκπαιδευτικό', g.call('anaforaSfalmatos', [K, 'Πάτησα Αποστολή και δεν έγινε τίποτα.', JSON.stringify({ othoni: 'edit', lathi: 'edMsg: κάτι' })]).ok
   && g.mail.length === m0 + 1 && g.mail[m0].to === 'developer@test.gr' && g.mail[m0].replyTo === 'daskala1@test.gr' && /Πάτησα Αποστολή/.test(g.mail[m0].body) && /edMsg: κάτι/.test(g.mail[m0].body));
ok('αναφορά χωρίς σύνδεση: δεν δέχεται (το κουμπί φαίνεται μόνο μετά τη σύνδεση)', /σύνδεση/.test(lathos(() => g.call('anaforaSfalmatos', ['', 'Δεν μπορώ να μπω με τον κωδικό μου.', '{}']))));
ok('αναφορά χωρίς περιγραφή: μήνυμα', /Γράψτε/.test(lathos(() => g.call('anaforaSfalmatos', [K, '  ', '{}']))));
m0 = g.mail.length;
ok('αναφορά με στιγμιότυπο οθόνης: συνημμένη εικόνα στο email', g.call('anaforaSfalmatos', [K, 'Τι έγινε: κόλλησε η λίστα.', '{}', [{ onoma: 'a.jpg', b64: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==' }, { onoma: 'x.txt', b64: Buffer.from('<script>').toString('base64') }]]).ok
   && g.mail.length === m0 + 1 && (g.mail[m0].attachments || []).length === 1 && /Συνημμένες εικόνες: 1/.test(g.mail[m0].body), JSON.stringify((g.mail[m0] || {}).attachments || null).slice(0, 120));
for (let i = 0; i < 8; i++) { try { g.call('anaforaSfalmatos', [K, 'επανάληψη ' + i, '{}']); } catch (e) {} }
ok('όριο αναφορών (10 την ώρα)', /αρκετές/.test(lathos(() => g.call('anaforaSfalmatos', [K, 'πολλές', '{}']))));
ok('το email του υπεύθυνου δεν είναι στον κώδικα (δημόσιο αποθετήριο)', !/moudiotis|gmail\.com/.test(require('fs').readFileSync(require('path').join(require('./pagkos').RIZA, process.env.CODE_GS || 'diaxeirisi/Code.gs'), 'utf8')));

console.log('\n' + (N - LATHI.length) + '/' + N + ' σωστά');
if (LATHI.length) { LATHI.forEach(l => console.log('  - ' + l)); process.exit(1); }
