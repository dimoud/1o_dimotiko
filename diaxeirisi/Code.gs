/**
 * Πίνακας διαχείρισης — ιστοσελίδα 1ου Δημοτικού Σχολείου Πολίχνης
 *
 * Ζει δεμένο στο Φύλλο «Ιστοσελίδα σχολείου – Διαχείριση», στον λογαριασμό Google του σχολείου.
 * Ανάπτυξη: Εφαρμογή ιστού · Εκτέλεση ως: εγώ (λογαριασμός σχολείου) · Πρόσβαση: οποιοσδήποτε.
 * Η πρόσβαση ελέγχεται σε ΚΑΘΕ κλήση, στον διακομιστή: Διεύθυνση με τον κωδικό της· εκπαιδευτικοί με τον κωδικό
 * Συντάκτη ΚΑΙ email που υπάρχει στη λίστα της Διεύθυνσης.
 *
 * Τα μυστικά ζουν στις Ιδιότητες σεναρίου (ποτέ στο Φύλλο, ποτέ στον περιηγητή):
 *   SALT, HASH_SYNTAKTI, HASH_DIEYTHYNSIS, API_KEY, GITHUB_TOKEN, GITHUB_REPO, NOTIFY_EMAIL, ROOT_ID
 */

var FYLLA = {
  anartiseis: ['id', 'katastasi', 'imerominia', 'titlos', 'enotita', 'taxeis', 'diktya', 'keimeno',
               'fotografies', 'arxeia', 'video', 'syggrafeas', 'synainesi', 'sxolio', 'url_slug',
               'protasi', 'dimiourgia', 'tropopoiisi', 'arithmos'],
  selides: ['id', 'omada', 'seira', 'titlos', 'perigrafi', 'keimeno', 'fotografies', 'arxeia', 'simeiosi', 'katastasi', 'tropopoiisi'],
  istoriko: ['xronos', 'rolos', 'onoma', 'energeia', 'id', 'titlos']
};
// Επικεφαλίδες στηλών στο Φύλλο (ελληνικά). Ο κώδικας δουλεύει με τα λατινικά κλειδιά.
var ETIKETES = { id: 'Κωδικός', katastasi: 'Κατάσταση', imerominia: 'Ημερομηνία', titlos: 'Τίτλος', enotita: 'Ενότητα',
  taxeis: 'Τάξεις', diktya: 'Δίκτυα', keimeno: 'Κείμενο', fotografies: 'Φωτογραφίες', arxeia: 'Αρχεία', video: 'Βίντεο',
  syggrafeas: 'Συντάκτης', synainesi: 'Συγκατάθεση κηδεμόνων', sxolio: 'Σχόλιο Διεύθυνσης', url_slug: 'Διεύθυνση σελίδας',
  protasi: 'Πρόταση αλλαγής', dimiourgia: 'Δημιουργία', tropopoiisi: 'Τελευταία αλλαγή', omada: 'Ομάδα', seira: 'Σειρά',
  perigrafi: 'Περιγραφή', simeiosi: 'Σημείωση', arithmos: 'Α/Α', xronos: 'Χρόνος', rolos: 'Ρόλος', onoma: 'Όνομα', energeia: 'Ενέργεια' };
function etiketa_(k) { return ETIKETES[k] || k; }
function kleidi_(h) { for (var k in ETIKETES) if (ETIKETES[k] === h) return k; return h; }

var ONOMATA_FYLLON = { anartiseis: 'Αναρτήσεις', selides: 'Σελίδες', istoriko: 'Ιστορικό' };
var KATASTASEIS = ['Πρόχειρο', 'Προς έγκριση', 'Επιστράφηκε', 'Δημοσιευμένη', 'Αποσυρμένη'];
var ENOTITES = [
  ['anakoinoseis', 'Ανακοινώσεις'], ['draseis', 'Εκπαιδευτικές δράσεις'], ['episkepseis', 'Εκπαιδευτικές επισκέψεις'],
  ['giortes', 'Γιορτές και εκδηλώσεις'], ['dimiourgies', 'Μαθητικές δημιουργίες'], ['synergasies', 'Συνεργασίες με φορείς'],
  ['perivallon', 'Περιβαλλοντικές δράσεις'], ['energos-politis', 'Δράσεις Ενεργού Πολίτη'],
  ['diagonismoi', 'Διαγωνισμοί και διακρίσεις'], ['goneis', 'Ενημερώσεις γονέων']];
var TAXEIS = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ', 'Ένταξη', 'Ολοήμερο'];
var DIKTYA = [['asfaleia-diadiktyo', 'Ασφάλεια στο Διαδίκτυο'], ['sima-aep', 'ΣΗ.ΜΑ.-Α.Ε.Π.'], ['oikologika', 'Οικολογικά Σχολεία'],
  ['thriving', 'Thriving Schools'], ['laxanokipoi', 'Σχολικοί Λαχανόκηποι'], ['kids-save-lives', 'KIDS SAVE LIVES']];
var SYNEDRIA_ORES = 6, MEGISTES_APOTYXIES = 8, KADOS_MERES = 40;

var P = function () { return PropertiesService.getScriptProperties(); };

/* ═══════════════ Μενού στο Φύλλο (μόνο για τον κάτοχο του λογαριασμού) ═══════════════ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Ιστοσελίδα')
    .addItem('🔒 Άνοιγμα Πίνακα διαχείρισης', 'anoigmaPinaka')
    .addItem('🚀 Δημοσίευση αλλαγών του Φύλλου στην ιστοσελίδα', 'dimosiefsiTora')
    .addItem('📖 Οδηγίες χρήσης (πλήρεις, στην ιστοσελίδα)', 'anoigmaOdigion')
    .addItem('📄 Ανανέωση καρτέλας «Οδηγίες» στο Φύλλο', 'odigiesFyllou')
    .addSeparator()
    .addItem('1. Αρχικοποίηση (μία φορά)', 'arxikopoiisi')
    .addItem('2. Ορισμός κωδικών Συντάκτη και Διεύθυνσης', 'orismosKodikon')
    .addItem('3. Κλειδί GitHub', 'orismosGithub')
    .addItem('4. Μεταφορά περιεχομένου από την ιστοσελίδα', 'eisagogiGithub')
    .addSeparator()
    .addItem('Αντίγραφο ασφαλείας τώρα', 'antigrafo')
    .addItem('Εμφάνιση κλειδιού API (για το GitHub)', 'deiksiApi')
    .addToUi();
  // Η καρτέλα «Οδηγίες» δημιουργείται μόνη της την πρώτη φορά, για όποιον ανοίξει το Φύλλο
  try { if (!SpreadsheetApp.getActive().getSheetByName('Οδηγίες')) odigiesFyllou(true); } catch (e) {}
}

var PINAKAS_URL = 'https://1dim-polichnis.gr/diaxeirisi/';
var ODIGIES_URL = 'https://1dim-polichnis.gr/diaxeirisi/#odigies';   // μόνο μετά από σύνδεση

function anoigmaOdigion() {
  var h = HtmlService.createHtmlOutput(
    '<div style="font:15px system-ui;line-height:1.5"><p>Οι οδηγίες ανοίγουν σε νέα καρτέλα. Αν δεν άνοιξαν, πατήστε:</p>' +
    '<p><a href="' + ODIGIES_URL + '" target="_blank" style="font-size:17px;font-weight:700">' + ODIGIES_URL + '</a></p></div>' +
    '<script>window.open("' + ODIGIES_URL + '","_blank");</script>').setWidth(480).setHeight(150);
  SpreadsheetApp.getUi().showModalDialog(h, 'Οδηγίες χρήσης');
}

function anoigmaPinaka() {
  var h = HtmlService.createHtmlOutput(
    '<div style="font:15px system-ui;line-height:1.5">' +
    '<p>Ο Πίνακας ανοίγει σε νέα καρτέλα. Αν δεν άνοιξε, πατήστε:</p>' +
    '<p><a href="' + PINAKAS_URL + '" target="_blank" style="font-size:17px;font-weight:700">' + PINAKAS_URL + '</a></p>' +
    '<p style="color:#52606d">Εκπαιδευτικοί: email (από τη λίστα της Διεύθυνσης) και κωδικός Συντάκτη. Διεύθυνση: μόνο ο κωδικός της.</p></div>' +
    '<script>window.open("' + PINAKAS_URL + '","_blank");</script>').setWidth(460).setHeight(190);
  SpreadsheetApp.getUi().showModalDialog(h, 'Πίνακας διαχείρισης');
}

function dimosiefsiTora() {
  var r = ksekinaDimosiefsi_(), ui = SpreadsheetApp.getUi();
  if (r.ok) ui.alert('Η δημοσίευση ξεκίνησε', 'Μέσα σε μισή ώρα η ιστοσελίδα θα δείχνει ό,τι υπάρχει τώρα στο Φύλλο.\n\n' +
    'Δημοσιεύονται μόνο οι γραμμές με Κατάσταση «Δημοσιευμένη».', ui.ButtonSet.OK);
  else ui.alert('Η δημοσίευση δεν ξεκίνησε', r.minima, ui.ButtonSet.OK);
}

function odigiesFyllou(siopi) {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName('Οδηγίες') || ss.insertSheet('Οδηγίες', 0);
  sh.clear();
  var g = [
    ['Πώς σχετίζεται αυτό το Φύλλο με την ιστοσελίδα 1dim-polichnis.gr'],
    [''],
    [''],
    [''],
    ['1. Το Φύλλο είναι η «αποθήκη» της ιστοσελίδας. Κάθε γραμμή της καρτέλας «Αναρτήσεις» είναι μία ανάρτηση της ιστοσελίδας.'],
    ['2. Στην ιστοσελίδα εμφανίζονται ΜΟΝΟ οι γραμμές με Κατάσταση «Δημοσιευμένη». «Πρόχειρο», «Προς έγκριση», «Επιστράφηκε», «Αποσυρμένη» δεν φαίνονται.'],
    ['3. Η ιστοσελίδα ενημερώνεται όταν γίνει δημοσίευση: αυτόματα όταν η Διεύθυνση πατά «Δημοσίευση» στον Πίνακα, ή χειροκίνητα από το μενού Ιστοσελίδα → «🚀 Δημοσίευση αλλαγών του Φύλλου». Χρόνος: έως μισή ώρα.'],
    ['4. Συνιστάται όλες οι αλλαγές να γίνονται από τον Πίνακα διαχείρισης (μενού Ιστοσελίδα → «🔒 Άνοιγμα Πίνακα», ή ' + PINAKAS_URL + '). Εκεί φαίνονται οι φωτογραφίες, ανεβαίνουν αρχεία και γίνεται έλεγχος πριν από τη δημοσίευση.'],
    ['5. Οι στήλες «Φωτογραφίες» και «Αρχεία» είναι τεχνικές (λίστα αρχείων του Drive). Μην τις αλλάζετε με το χέρι: προσθήκη, αφαίρεση, σειρά και εξώφυλλο γίνονται από τον Πίνακα.'],
    ['6. Διόρθωση κειμένου ή τίτλου μπορεί να γίνει και εδώ στο Φύλλο. Μετά: μενού Ιστοσελίδα → «🚀 Δημοσίευση αλλαγών του Φύλλου».'],
    ['7. Για να φύγει μια ανάρτηση από την ιστοσελίδα χωρίς να χαθεί: Κατάσταση «Αποσυρμένη» (ή «Αφαίρεση» από τον Πίνακα) και δημοσίευση.'],
    ['8. Κάθε αλλαγή καταγράφεται στην καρτέλα «Ιστορικό». Αντίγραφο ασφαλείας: μενού Ιστοσελίδα → «Αντίγραφο ασφαλείας τώρα».']
  ];
  sh.getRange(1, 1, g.length, 1).setValues(g).setWrap(true).setVerticalAlignment('top');
  sh.setColumnWidth(1, 900);
  sh.getRange(1, 1).setFontSize(15).setFontWeight('bold');
  sh.getRange(5, 1, g.length - 4, 1).setFontSize(12);
  sh.getRange(2, 1).setFormula('=HYPERLINK("' + ODIGIES_URL + '","📖  ΠΛΗΡΕΙΣ ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ (πατήστε εδώ)")');
  sh.getRange(3, 1).setFormula('=HYPERLINK("' + PINAKAS_URL + '","🔒  ΠΙΝΑΚΑΣ ΔΙΑΧΕΙΡΙΣΗΣ: εδώ γίνεται η καθημερινή δουλειά (πατήστε εδώ)")');
  sh.getRange(2, 1, 2, 1).setFontSize(14).setFontWeight('bold').setBackground('#e8f1fa');
  sh.setRowHeights(2, 2, 34);
  sh.setFrozenRows(3);
  sh.setTabColor('#1e64a8');
  ['anartiseis', 'selides'].forEach(function (k) {
    var f = fyllo_(k); if (!f || f.getLastColumn() < 1) return;
    var hd = f.getRange(1, 1, 1, f.getLastColumn()).getValues()[0];
    hd.forEach(function (h, i) {
      var key = kleidi_(h);
      if (key === 'fotografies' || key === 'arxeia') {
        f.getRange(1, i + 1).setNote('Τεχνική στήλη: αλλάζει μόνο από τον Πίνακα διαχείρισης (' + PINAKAS_URL + ').');
        f.setColumnWidth(i + 1, 110);
        if (f.getLastRow() > 1) f.getRange(2, i + 1, f.getLastRow() - 1, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setFontColor('#9aa5b1');
      }
      if (key === 'katastasi') f.getRange(1, i + 1).setNote('Στην ιστοσελίδα φαίνονται μόνο οι «Δημοσιευμένη».');
    });
  });
  if (!siopi) ss.setActiveSheet(sh);
}

function arxikopoiisi() {
  var ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive(), p = P();
  Object.keys(FYLLA).forEach(function (k) {
    var sh = ss.getSheetByName(ONOMATA_FYLLON[k]) || ss.insertSheet(ONOMATA_FYLLON[k]);
    if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() === 'id' || sh.getRange(1, 1).getValue() === 'xronos') {
      sh.getRange(1, 1, 1, FYLLA[k].length).setValues([FYLLA[k].map(etiketa_)]).setFontWeight('bold').setBackground('#eef5fc');
      sh.setFrozenRows(1);
    }
    sh.protect().setDescription('Αλλαγές μόνο από τον Πίνακα διαχείρισης').setWarningOnly(true);
  });
  var s1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Φύλλο1');
  if (s1 && ss.getSheets().length > 1 && s1.getLastRow() === 0) ss.deleteSheet(s1);
  if (!p.getProperty('ROOT_ID')) {
    var parent = DriveApp.getFileById(ss.getId()).getParents();
    var base = parent.hasNext() ? parent.next() : DriveApp.getRootFolder();
    var root = base.createFolder('Ιστοσελίδα σχολείου – Αρχεία');
    ['Φωτογραφίες', 'Έγγραφα', 'Αντίγραφα ασφαλείας', 'Εισαγωγή'].forEach(function (n) { root.createFolder(n); });
    p.setProperty('ROOT_ID', root.getId());
  }
  if (!p.getProperty('SALT')) p.setProperty('SALT', Utilities.getUuid());
  if (!p.getProperty('API_KEY')) p.setProperty('API_KEY', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  if (!p.getProperty('GITHUB_REPO')) p.setProperty('GITHUB_REPO', 'dimoud/1o_dimotiko');
  if (!p.getProperty('NOTIFY_EMAIL')) p.setProperty('NOTIFY_EMAIL', 'mail@1dim-polichn.thess.sch.gr');
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'antigrafo') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('antigrafo').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create();
  ui.alert('Έτοιμο', 'Δημιουργήθηκαν οι καρτέλες, ο φάκελος «Ιστοσελίδα σχολείου – Αρχεία» και το εβδομαδιαίο αντίγραφο ασφαλείας.\n\nΕπόμενο: «2. Ορισμός κωδικών».', ui.ButtonSet.OK);
}

function orismosKodikon() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Κωδικός ΣΥΝΤΑΚΤΗ', 'Τον ξέρουν οι εκπαιδευτικοί που γράφουν αναρτήσεις (τουλάχιστον 8 χαρακτήρες).', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var b = ui.prompt('Κωδικός ΔΙΕΥΘΥΝΣΗΣ', 'Μόνο για τη Διεύθυνση: εγκρίνει και δημοσιεύει (τουλάχιστον 10 χαρακτήρες, διαφορετικός).', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK) return;
  var s = a.getResponseText().trim(), d = b.getResponseText().trim();
  if (s.length < 8 || d.length < 10 || s === d) { ui.alert('Οι κωδικοί δεν δεκτοί: μήκος 8 και 10 χαρακτήρες, και διαφορετικοί μεταξύ τους.'); return; }
  P().setProperty('HASH_SYNTAKTI', hash_(s));
  P().setProperty('HASH_DIEYTHYNSIS', hash_(d));
  akyrosiSynedrion_();
  katagrafi_('διεύθυνση', 'Κάτοχος λογαριασμού', 'Ορισμός κωδικών', '', '');
  ui.alert('Οι κωδικοί ορίστηκαν. Όσοι ήταν συνδεδεμένοι αποσυνδέθηκαν.');
}

function orismosGithub() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Κλειδί GitHub', 'Επικολλήστε το κλειδί (fine-grained token) που επιτρέπει μόνο «Actions: Read and write» στο αποθετήριο της ιστοσελίδας.', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var t = a.getResponseText().trim();
  if (!/^github_pat_|^ghp_/.test(t)) { ui.alert('Αυτό δεν μοιάζει με κλειδί GitHub.'); return; }
  P().setProperty('GITHUB_TOKEN', t);
  P().setProperty('GITHUB_TOKEN_DATE', new Date().toISOString());
  ui.alert('Αποθηκεύτηκε. Θα χρειαστεί ανανέωση πριν λήξει (ο Πίνακας θα σας το θυμίσει).');
}

function deiksiApi() {
  SpreadsheetApp.getUi().alert('Κλειδί API', 'Αντιγράψτε το στο GitHub: Settings → Secrets and variables → Actions → DEDOMENA_KLEIDI\n\n' + P().getProperty('API_KEY'), SpreadsheetApp.getUi().ButtonSet.OK);
}

/* ═══════════════ Εφαρμογή ιστού: Πίνακας (σελίδα) ή API για τη δημοσίευση ═══════════════ */

function doGet(e) {
  e = e || { parameter: {} };
  if (e.parameter.api) return api_(e.parameter);
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Διαχείριση ιστοσελίδας')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function api_(q) {
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  if (!q.k || q.k !== P().getProperty('API_KEY')) return out({ sfalma: 'άκυρο κλειδί' });
  if (q.api === 'dedomena') {
    var an = diavase_('anartiseis').filter(function (r) { return r.katastasi === 'Δημοσιευμένη'; });
    var sel = diavase_('selides');
    return out({ anartiseis: an.map(gia_dimosiefsi_), selides: sel.map(gia_dimosiefsi_), xronos: new Date().toISOString() });
  }
  if (q.api === 'arxeio' && q.id) {
    if (!epitreptoArxeio_(q.id)) return out({ sfalma: 'μη δημοσιευμένο αρχείο' });
    var f = DriveApp.getFileById(q.id), blob = f.getBlob();
    return out({ id: q.id, onoma: f.getName(), mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) });
  }
  return out({ sfalma: 'άγνωστη κλήση' });
}

/* ═══════════════ Πίνακας μέσα στην ιστοσελίδα (1dim-polichnis.gr/diaxeirisi/) ═══════════════
 * Η σελίδα στέλνει POST text/plain {fn, args}· απαντάμε {r} ή {sfalma}.
 * Μόνο οι παρακάτω συναρτήσεις· όλες ελέγχουν μόνες τους τη συνεδρία (token).          */
function rpc_(b) {
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  var F = { syndesi: syndesi, listaAnartiseon: listaAnartiseon, fereAnartisi: fereAnartisi, apothikefsi: apothikefsi,
            apofasi: apofasi, anevasma: anevasma, mikrografia: mikrografia, mikrografies: mikrografies,
            afairesiFotografias: afairesiFotografias, listaSelidon: listaSelidon, apothikefsiSelidas: apothikefsiSelidas,
            rythmiseis: rythmiseis, allagiKodikou: allagiKodikou, allagiEmail: allagiEmail,
            katastasiDimosiefsis: katastasiDimosiefsis, odigies: odigies, odigosPdf: odigosPdf,
            emailSyntakton: emailSyntakton, apothikefsiEmailSyntakton: apothikefsiEmailSyntakton };
  if (!b || !F[b.fn]) return out({ sfalma: 'άγνωστη κλήση' });
  try {
    var r = F[b.fn].apply(null, b.args || []);
    return out({ r: r === undefined ? null : r });
  } catch (e) {
    return out({ sfalma: (e && e.message) || String(e) });
  }
}

function gia_dimosiefsi_(r) {
  var o = {};
  Object.keys(r).forEach(function (k) {
    if (k === '_row' || k === 'protasi') return;
    o[k] = /^(fotografies|arxeia)$/.test(k) ? json_(r[k], []) : r[k];
  });
  o.taxeis = (r.taxeis || '').toString().split(',').map(function (x) { return x.trim(); }).filter(String);
  o.diktya = (r.diktya || '').toString().split(',').map(function (x) { return x.trim(); }).filter(String);
  o.video = (r.video || '').toString().split(/\s+/).map(youtubeId_).filter(String).map(function (id) { return { eidos: 'youtube', id: id }; });
  if (r.imerominia instanceof Date) o.imerominia = Utilities.formatDate(r.imerominia, 'Europe/Athens', 'yyyy-MM-dd');
  return o;
}

function epitreptoArxeio_(id) {
  var ok = false;
  diavase_('anartiseis').concat(diavase_('selides')).forEach(function (r) {
    if (r.katastasi && r.katastasi !== 'Δημοσιευμένη') return;
    json_(r.fotografies, []).concat(json_(r.arxeia, [])).forEach(function (f) { if (f.id === id) ok = true; });
  });
  return ok;
}

/* ═══════════════ Σύνδεση με κωδικό ═══════════════ */

/* Εκπαιδευτικοί: εκτός από τον κωδικό Συντάκτη, το email τους πρέπει να είναι στη λίστα της Διεύθυνσης.
 * Η Διεύθυνση μπαίνει μόνο με τον δικό της κωδικό. Η λίστα: Script Properties → EMAILS_SYNTAKTON (JSON). */
function emailNorm_(e) { return String(e || '').trim().toLowerCase(); }
function listaEmail_() { try { return JSON.parse(P().getProperty('EMAILS_SYNTAKTON') || '[]'); } catch (e) { return []; } }
function vresEmail_(e) { e = emailNorm_(e); return listaEmail_().filter(function (x) { return x.email === e; })[0] || null; }

function syndesi(kodikos, email) {
  var c = CacheService.getScriptCache(), p = P();
  var fails = Number(c.get('apotyxies') || 0);
  if (fails >= MEGISTES_APOTYXIES) return { ok: false, minima: 'Πολλές λάθος προσπάθειες. Δοκιμάστε ξανά σε 15 λεπτά.' };
  if (!p.getProperty('HASH_SYNTAKTI')) return { ok: false, minima: 'Δεν έχουν οριστεί κωδικοί. Ρωτήστε τη Διεύθυνση.' };
  var h = hash_((kodikos || '').trim()), rolos = null;
  if (h === p.getProperty('HASH_DIEYTHYNSIS')) rolos = 'diefthynsi';
  var melos = null;
  if (!rolos && h === p.getProperty('HASH_SYNTAKTI')) {
    melos = vresEmail_(email);
    if (melos) rolos = 'syntaktis';
  }
  if (!rolos) {
    c.put('apotyxies', String(fails + 1), 900);
    if (fails + 1 >= MEGISTES_APOTYXIES && !c.get('eidopoiisi_kleidoma')) {   // μία ειδοποίηση ανά κλείδωμα
      c.put('eidopoiisi_kleidoma', '1', 900);
      try {
        eidopoiisi_('Προειδοποίηση: κλείδωσε η είσοδος στον Πίνακα διαχείρισης',
          'Έγιναν ' + MEGISTES_APOTYXIES + ' αποτυχημένες προσπάθειες σύνδεσης με λάθος κωδικό στον Πίνακα διαχείρισης της ιστοσελίδας ' +
          '(ώρα ' + Utilities.formatDate(new Date(), 'Europe/Athens', 'dd/MM/yyyy HH:mm') + ').\n\n' +
          'Η είσοδος κλείδωσε για 15 λεπτά για όλους.\n\n' +
          'Αν δεν ήταν κάποιος από εσάς που ξέχασε τον κωδικό, αλλάξτε τους κωδικούς: Πίνακας → Ρυθμίσεις → Κωδικοί, ' +
          'ή στο Φύλλο: μενού Ιστοσελίδα → 2. Ορισμός κωδικών.');
        katagrafi_('σύστημα', '', 'Κλείδωμα εισόδου μετά από ' + MEGISTES_APOTYXIES + ' λάθη', '', '');
      } catch (e) {}
    }
    Utilities.sleep(800);
    return { ok: false, minima: 'Λάθος κωδικός, ή το email δεν είναι στη λίστα της Διεύθυνσης. Οι εκπαιδευτικοί γράφουν και το email τους.' };
  }
  var token = Utilities.getUuid() + Utilities.getUuid();
  c.put('s_' + token, JSON.stringify({ rolos: rolos, gen: p.getProperty('GENIA') || '0', email: melos ? melos.email : '', onoma: melos ? melos.onoma : '' }), SYNEDRIA_ORES * 3600);
  if (melos) try { katagrafi_('syntaktis', melos.onoma || melos.email, 'Είσοδος (' + melos.email + ')', '', ''); } catch (e) {}
  return { ok: true, token: token, rolos: rolos, onoma: melos ? melos.onoma : '', epiloges: epiloges_() };
}

function synedria_(token, apaitisi) {
  var s = token && CacheService.getScriptCache().get('s_' + token);
  if (!s) throw new Error('Η σύνδεση έληξε. Μπείτε ξανά με τον κωδικό σας.');
  s = JSON.parse(s);
  if (s.gen !== (P().getProperty('GENIA') || '0')) throw new Error('Οι κωδικοί άλλαξαν. Μπείτε ξανά με τον νέο κωδικό.');
  if (apaitisi === 'diefthynsi' && s.rolos !== 'diefthynsi') throw new Error('Μόνο η Διεύθυνση μπορεί να το κάνει αυτό.');
  if (s.rolos === 'syntaktis' && !vresEmail_(s.email)) {   // βγήκε από τη λίστα → αποσυνδέεται αμέσως
    CacheService.getScriptCache().remove('s_' + token);
    throw new Error('Το email σας δεν είναι πια στη λίστα της Διεύθυνσης. Ρωτήστε τη Διεύθυνση.');
  }
  return s;
}

function akyrosiSynedrion_() { P().setProperty('GENIA', String(Number(P().getProperty('GENIA') || 0) + 1)); }

function epiloges_() {
  return { enotites: ENOTITES, taxeis: TAXEIS, diktya: DIKTYA, katastaseis: KATASTASEIS };
}

/* ═══════════════ Αναρτήσεις ═══════════════ */

function listaAnartiseon(token) {
  synedria_(token);
  if (diavase_('anartiseis').some(function (r) { return !Number(r.arithmos); })) {
    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    try { arithmisi_(); } finally { lock.releaseLock(); }
  }
  return diavase_('anartiseis').map(function (r) {
    var fot = json_(r.fotografies, []);
    return { id: r.id, katastasi: r.katastasi, imerominia: hm_(r.imerominia), titlos: r.titlos, enotita: r.enotita,
             taxeis: String(r.taxeis || ''), diktya: String(r.diktya || ''),
             syggrafeas: r.syggrafeas, sxolio: r.sxolio, exei_protasi: !!r.protasi,
             fotografies: fot.length, exofyllo: fot.length ? fot[0].id : '',
             tropopoiisi: r.tropopoiisi instanceof Date ? r.tropopoiisi.toISOString() : '',
             arithmos: Number(r.arithmos) || 0, meres_kadou: r.katastasi === 'Αποσυρμένη' ? meresKadou_(r) : null,
             apospasma: String(r.keimeno || '').replace(/[*#|=\[\]()]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140) };
  }).sort(function (a, b) { return a.imerominia < b.imerominia ? 1 : -1; });
}

function fereAnartisi(token, id) {
  var s = synedria_(token);
  var r = vres_('anartiseis', id);
  if (!r) throw new Error('Δεν βρέθηκε η ανάρτηση.');
  var o = morfi_(r);
  if (r.protasi && s.rolos) o.protasi = json_(r.protasi, null);
  return o;
}

function morfi_(r) {
  return { id: r.id, katastasi: r.katastasi, imerominia: hm_(r.imerominia), titlos: r.titlos, enotita: r.enotita,
           taxeis: (r.taxeis || '').toString(), diktya: (r.diktya || '').toString(), keimeno: r.keimeno,
           fotografies: json_(r.fotografies, []), arxeia: json_(r.arxeia, []), video: r.video || '',
           syggrafeas: r.syggrafeas, synainesi: r.synainesi === true || r.synainesi === 'TRUE', sxolio: r.sxolio || '',
           arithmos: Number(r.arithmos) || 0, meres_kadou: r.katastasi === 'Αποσυρμένη' ? meresKadou_(r) : null };
}

/**
 * Αποθήκευση από Συντάκτη ή Διεύθυνση.
 * energeia: 'proxeiro' | 'egkrisi' (αποστολή για έγκριση) | 'dimosiefsi' (μόνο Διεύθυνση)
 * Σε ήδη δημοσιευμένη ανάρτηση, ο Συντάκτης δημιουργεί ΠΡΟΤΑΣΗ αλλαγής· η ζωντανή μένει ως έχει.
 */
function apothikefsi(token, d, energeia) {
  var s = synedria_(token);
  elegxos_(d, energeia);
  if (energeia === 'dimosiefsi' && s.rolos !== 'diefthynsi') throw new Error('Μόνο η Διεύθυνση δημοσιεύει.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = fyllo_('anartiseis'), r = d.id ? vres_('anartiseis', d.id) : null, now = new Date();
    var pedia = {
      imerominia: d.imerominia, titlos: d.titlos.trim(), enotita: d.enotita, taxeis: (d.taxeis || []).join(','),
      diktya: (d.diktya || []).join(','), keimeno: d.keimeno || '', fotografies: JSON.stringify(d.fotografies || []),
      arxeia: JSON.stringify(d.arxeia || []), video: d.video || '', syggrafeas: (d.syggrafeas || '').trim(),
      synainesi: !!d.synainesi, tropopoiisi: now
    };
    if (r && r.katastasi === 'Δημοσιευμένη' && s.rolos !== 'diefthynsi') {
      grapse_(sh, r._row, { protasi: JSON.stringify(pedia), sxolio: '' });
      katagrafi_(s.rolos, pedia.syggrafeas, 'Πρόταση αλλαγής σε δημοσιευμένη', r.id, pedia.titlos);
      eidopoiisi_('Πρόταση αλλαγής: ' + pedia.titlos, pedia.syggrafeas + ' πρότεινε αλλαγή σε δημοσιευμένη ανάρτηση.');
      return { ok: true, id: r.id, minima: 'Η αλλαγή στάλθηκε στη Διεύθυνση. Η ανάρτηση μένει όπως είναι μέχρι την έγκριση.' };
    }
    pedia.katastasi = energeia === 'dimosiefsi' ? 'Δημοσιευμένη' : energeia === 'egkrisi' ? 'Προς έγκριση' : 'Πρόχειρο';
    if (energeia === 'dimosiefsi') { pedia.protasi = ''; pedia.sxolio = ''; }
    var id = r ? r.id : 'a' + Utilities.formatDate(now, 'Europe/Athens', 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
    if (r) grapse_(sh, r._row, pedia);
    else { pedia.id = id; pedia.dimiourgia = now; pedia.arithmos = arithmisi_() + 1; prosthese_(sh, 'anartiseis', pedia); }
    katagrafi_(s.rolos, pedia.syggrafeas, { proxeiro: 'Αποθήκευση προχείρου', egkrisi: 'Αποστολή για έγκριση', dimosiefsi: 'Δημοσίευση' }[energeia], id, pedia.titlos);
    if (energeia === 'egkrisi') eidopoiisi_('Νέα ανάρτηση προς έγκριση: ' + pedia.titlos, (pedia.syggrafeas || 'Συντάκτης') + ' έστειλε ανάρτηση για έγκριση.');
  } finally { lock.releaseLock(); }
  var apot = { ok: true, id: id, minima: { proxeiro: 'Αποθηκεύτηκε ως πρόχειρο.', egkrisi: 'Στάλθηκε στη Διεύθυνση για έγκριση.', dimosiefsi: 'Δημοσιεύεται. Θα φανεί στον ιστότοπο μέσα σε μισή ώρα.' }[energeia] };
  if (energeia === 'dimosiefsi') apot.github = ksekinaDimosiefsi_();
  return apot;
}

/** Διεύθυνση: έγκριση πρότασης, επιστροφή με σχόλιο, απόσυρση. */
function apofasi(token, id, praxi, sxolio) {
  var s = synedria_(token, 'diefthynsi');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  var r, sh = fyllo_('anartiseis');
  try {
    r = vres_('anartiseis', id);
    if (!r) throw new Error('Δεν βρέθηκε η ανάρτηση.');
    if (praxi === 'egkrisi') {
      var pedia = r.protasi ? json_(r.protasi, {}) : {};
      pedia.katastasi = 'Δημοσιευμένη'; pedia.protasi = ''; pedia.sxolio = ''; pedia.tropopoiisi = new Date();
      if (!(pedia.synainesi === true || (r.synainesi === true || r.synainesi === 'TRUE'))) throw new Error('Λείπει η επιβεβαίωση συγκατάθεσης κηδεμόνων.');
      grapse_(sh, r._row, pedia);
    } else if (praxi === 'epistrofi') {
      if (r.protasi) grapse_(sh, r._row, { protasi: '', sxolio: sxolio || '' });
      else grapse_(sh, r._row, { katastasi: 'Επιστράφηκε', sxolio: sxolio || '' });
    } else if (praxi === 'aposyrsi') {
      grapse_(sh, r._row, { katastasi: 'Αποσυρμένη', protasi: '', tropopoiisi: new Date() });
      egkatastasiKadou_();
    } else if (praxi === 'diagrafi') {      // οριστική διαγραφή: μόνο από τον κάδο
      if (r.katastasi !== 'Αποσυρμένη') throw new Error('Οριστική διαγραφή γίνεται μόνο σε ανάρτηση που είναι στον κάδο.');
      oristikiDiagrafi_(sh, diavase_('anartiseis'), [r], 'διεύθυνση', 'Οριστική διαγραφή');
      return { ok: true, minima: 'Η ανάρτηση διαγράφηκε οριστικά. Οι φωτογραφίες της πήγαν στον Κάδο του Google Drive (30 ημέρες).' };
    } else if (praxi === 'epanafora') {
      grapse_(sh, r._row, { katastasi: 'Δημοσιευμένη', tropopoiisi: new Date() });
    } else throw new Error('Άγνωστη ενέργεια.');
  } finally { lock.releaseLock(); }
  katagrafi_('διεύθυνση', 'Διεύθυνση', { egkrisi: 'Έγκριση και δημοσίευση', epistrofi: 'Επιστροφή με σχόλιο', aposyrsi: 'Απόσυρση', epanafora: 'Επαναφορά' }[praxi], id, r.titlos);
  var ap = { ok: true, minima: { egkrisi: 'Εγκρίθηκε. Θα φανεί στον ιστότοπο μέσα σε μισή ώρα.', epistrofi: 'Επιστράφηκε στον συντάκτη.', aposyrsi: 'Μπήκε στον κάδο ανακύκλωσης. Φεύγει από την ιστοσελίδα μέσα σε μισή ώρα και διαγράφεται οριστικά σε ' + KADOS_MERES + ' ημέρες· ως τότε επαναφέρεται με ένα πάτημα.', epanafora: 'Επανήλθε. Θα φανεί μέσα σε μισή ώρα.' }[praxi] };
  if (praxi !== 'epistrofi') ap.github = ksekinaDimosiefsi_();
  return ap;
}

function elegxos_(d, energeia) {
  var l = [];
  if (!d.titlos || d.titlos.trim().length < 5) l.push('Ο τίτλος θέλει τουλάχιστον 5 χαρακτήρες.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.imerominia || '')) l.push('Λείπει η ημερομηνία.');
  else if (d.imerominia < '2024-01-01') l.push('Η ημερομηνία πρέπει να είναι από 1/1/2024 και μετά.');
  if (!ENOTITES.some(function (e) { return e[0] === d.enotita; })) l.push('Διαλέξτε ενότητα.');
  if (energeia !== 'proxeiro') {
    if (!d.syggrafeas || !d.syggrafeas.trim()) l.push('Συμπληρώστε το «Ποιος το έγραψε».');
    if ((d.fotografies || []).length && !d.synainesi) l.push('Επιβεβαιώστε ότι υπάρχει συγκατάθεση κηδεμόνων για τις φωτογραφίες.');
    if (!(d.keimeno || '').trim() && !(d.fotografies || []).length) l.push('Γράψτε κείμενο ή προσθέστε φωτογραφίες.');
  }
  if (l.length) throw new Error(l.join('\n'));
}

/* ═══════════════ Ανέβασμα αρχείων (φωτογραφίες, PDF) ═══════════════ */

function anevasma(token, onoma, mime, base64, eidos) {
  synedria_(token);
  if (!/^image\/(jpeg|png|webp)$|^application\/pdf$/.test(mime)) throw new Error('Επιτρέπονται φωτογραφίες (JPG, PNG) και PDF.');
  var bytes = Utilities.base64Decode(base64);
  if (bytes.length > 15 * 1024 * 1024) throw new Error('Το αρχείο είναι μεγαλύτερο από 15 MB.');
  var root = DriveApp.getFolderById(P().getProperty('ROOT_ID'));
  var fakelos = root.getFoldersByName(eidos === 'pdf' ? 'Έγγραφα' : 'Φωτογραφίες').next();
  var mina = Utilities.formatDate(new Date(), 'Europe/Athens', 'yyyy-MM');
  var it = fakelos.getFoldersByName(mina), sub = it.hasNext() ? it.next() : fakelos.createFolder(mina);
  var f = sub.createFile(Utilities.newBlob(bytes, mime, onoma.replace(/[^\w.\-α-ωΑ-Ωάέήίόύώϊϋΐΰ ]/g, '_')));
  return { id: f.getId(), onoma: f.getName() };
}

/** Μικρογραφία για τον Πίνακα (data URL), μόνο για συνδεδεμένους. */
function mikrografia(token, id) {
  synedria_(token);
  var t = DriveApp.getFileById(id).getThumbnail();
  return t ? 'data:image/png;base64,' + Utilities.base64Encode(t.getBytes()) : '';
}

/** Πολλές μικρογραφίες μαζί (έως 16 ανά κλήση) για τον Πίνακα: { id: dataURL }. */
function mikrografies(token, ids) {
  synedria_(token);
  var c = CacheService.getScriptCache(), out = {};
  (ids || []).slice(0, 16).forEach(function (id) {
    var k = 'th_' + id, v = c.get(k);
    if (!v) {
      try {
        var t = DriveApp.getFileById(id).getThumbnail();
        v = t ? 'data:image/png;base64,' + Utilities.base64Encode(t.getBytes()) : '';
        if (v && v.length < 90000) c.put(k, v, 21600);
      } catch (e) { v = ''; }
    }
    out[id] = v;
  });
  return out;
}

/** Οριστική αφαίρεση φωτογραφίας (π.χ. ανάκληση συγκατάθεσης): κάδος Drive, 30 ημέρες. Μόνο Διεύθυνση. */
function afairesiFotografias(token, anartisiId, fotoId) {
  synedria_(token, 'diefthynsi');
  var r = vres_('anartiseis', anartisiId);
  if (!r) throw new Error('Δεν βρέθηκε η ανάρτηση.');
  var fot = json_(r.fotografies, []).filter(function (f) { return f.id !== fotoId; });
  grapse_(fyllo_('anartiseis'), r._row, { fotografies: JSON.stringify(fot) });
  try { DriveApp.getFileById(fotoId).setTrashed(true); } catch (e) {}
  katagrafi_('διεύθυνση', 'Διεύθυνση', 'Αφαίρεση φωτογραφίας', anartisiId, r.titlos);
  var ap = { ok: true, minima: 'Η φωτογραφία αφαιρέθηκε. Θα φύγει από τον ιστότοπο μέσα σε μισή ώρα.' };
  if (r.katastasi === 'Δημοσιευμένη') ap.github = ksekinaDimosiefsi_();
  return ap;
}

/* ═══════════════ Σταθερές σελίδες (μόνο Διεύθυνση) ═══════════════ */

function listaSelidon(token) {
  synedria_(token, 'diefthynsi');
  return diavase_('selides').map(function (r) {
    return { id: r.id, omada: r.omada, seira: r.seira, titlos: r.titlos, perigrafi: r.perigrafi, keimeno: r.keimeno,
             simeiosi: r.simeiosi, katastasi: r.katastasi, fotografies: json_(r.fotografies, []), arxeia: json_(r.arxeia, []) };
  });
}

function apothikefsiSelidas(token, d, dimosiefsi) {
  synedria_(token, 'diefthynsi');
  var r = vres_('selides', d.id);
  if (!r) throw new Error('Δεν βρέθηκε η σελίδα.');
  grapse_(fyllo_('selides'), r._row, { titlos: d.titlos, perigrafi: d.perigrafi, keimeno: d.keimeno, simeiosi: d.simeiosi || '',
    katastasi: d.katastasi, arxeia: JSON.stringify(d.arxeia || []), fotografies: JSON.stringify(d.fotografies || []), tropopoiisi: new Date() });
  katagrafi_('διεύθυνση', 'Διεύθυνση', 'Αλλαγή σελίδας', d.id, d.titlos);
  var ap = { ok: true, minima: dimosiefsi ? 'Δημοσιεύεται. Θα φανεί μέσα σε μισή ώρα.' : 'Αποθηκεύτηκε.' };
  if (dimosiefsi) ap.github = ksekinaDimosiefsi_();
  return ap;
}

/* ═══════════════ Ρυθμίσεις Διεύθυνσης ═══════════════ */

function rythmiseis(token) {
  synedria_(token, 'diefthynsi');
  var p = P(), d = p.getProperty('GITHUB_TOKEN_DATE');
  return { email: p.getProperty('NOTIFY_EMAIL') || '', github: !!p.getProperty('GITHUB_TOKEN'),
           github_imeres: d ? Math.floor((new Date() - new Date(d)) / 864e5) : null, istoriko: istoriko_(80) };
}

function allagiKodikou(token, poios, neos) {
  var s = synedria_(token, 'diefthynsi');
  neos = (neos || '').trim();
  if (poios === 'syntaktis' && neos.length < 8) throw new Error('Ο κωδικός Συντάκτη θέλει τουλάχιστον 8 χαρακτήρες.');
  if (poios === 'diefthynsi' && neos.length < 10) throw new Error('Ο κωδικός Διεύθυνσης θέλει τουλάχιστον 10 χαρακτήρες.');
  var allos = P().getProperty(poios === 'syntaktis' ? 'HASH_DIEYTHYNSIS' : 'HASH_SYNTAKTI');
  if (hash_(neos) === allos) throw new Error('Οι δύο κωδικοί πρέπει να διαφέρουν.');
  P().setProperty(poios === 'syntaktis' ? 'HASH_SYNTAKTI' : 'HASH_DIEYTHYNSIS', hash_(neos));
  akyrosiSynedrion_();
  katagrafi_('διεύθυνση', 'Διεύθυνση', poios === 'syntaktis' ? 'Νέος κωδικός Συντάκτη' : 'Νέος κωδικός Διεύθυνσης', '', '');
  return { ok: true, minima: 'Ο κωδικός άλλαξε. Όλοι αποσυνδέθηκαν και μπαίνουν με τους ισχύοντες κωδικούς.' };
}

/** Λίστα εκπαιδευτικών με πρόσβαση (μόνο Διεύθυνση). */
function emailSyntakton(token) {
  synedria_(token, 'diefthynsi');
  return listaEmail_();
}
/** lista: [{email, onoma}]. Όποιος αφαιρείται, αποσυνδέεται στην επόμενη κίνησή του. */
function apothikefsiEmailSyntakton(token, lista) {
  synedria_(token, 'diefthynsi');
  var seen = {}, out = [];
  (lista || []).forEach(function (x) {
    var e = emailNorm_(x && x.email);
    if (!e) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('Μη έγκυρο email: ' + e);
    if (seen[e]) return; seen[e] = 1;
    out.push({ email: e, onoma: String(x.onoma || '').trim().slice(0, 80) });
  });
  if (out.length > 150) throw new Error('Έως 150 email.');
  var prin = listaEmail_().map(function (x) { return x.email; });
  P().setProperty('EMAILS_SYNTAKTON', JSON.stringify(out));
  var nea = out.filter(function (x) { return prin.indexOf(x.email) < 0; }).length;
  var fygan = prin.filter(function (e) { return !seen[e]; }).length;
  katagrafi_('διεύθυνση', 'Διεύθυνση', 'Λίστα εκπαιδευτικών: ' + out.length + ' email (+' + nea + ', −' + fygan + ')', '', '');
  return { ok: true, lista: out, minima: 'Αποθηκεύτηκε: ' + out.length + ' εκπαιδευτικοί με πρόσβαση.' + (fygan ? ' Όσοι αφαιρέθηκαν αποσυνδέονται αμέσως.' : '') };
}

function allagiEmail(token, email) {
  synedria_(token, 'diefthynsi');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) throw new Error('Μη έγκυρο email.');
  P().setProperty('NOTIFY_EMAIL', email.trim());
  return { ok: true, minima: 'Οι ειδοποιήσεις θα πηγαίνουν στο ' + email.trim() };
}

/* ═══════════════ Δημοσίευση: εντολή στο GitHub Actions ═══════════════ */

/* Πού βρίσκεται η δημοσίευση στο GitHub: για την ένδειξη «Ανεβαίνει / Στην ιστοσελίδα» στον Πίνακα */
function katastasiDimosiefsis(token) {
  synedria_(token);
  var c = CacheService.getScriptCache(), k = 'gh_runs', v = c.get(k);
  if (v) return JSON.parse(v);
  var p = P(), t = p.getProperty('GITHUB_TOKEN'), repo = p.getProperty('GITHUB_REPO');
  if (!t) return { runs: [], xoris_kleidi: true };
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/actions/workflows/dimosieusi.yml/runs?per_page=6', {
    muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
  if (res.getResponseCode() !== 200) return { runs: [], sfalma: res.getResponseCode() };
  var o = { runs: JSON.parse(res.getContentText()).workflow_runs.map(function (r) {
    return { status: r.status, conclusion: r.conclusion, created: r.created_at, updated: r.updated_at }; }) };
  c.put(k, JSON.stringify(o), 20);
  return o;
}

function ksekinaDimosiefsi_() {
  var p = P(), t = p.getProperty('GITHUB_TOKEN'), repo = p.getProperty('GITHUB_REPO');
  if (!t) return { ok: false, minima: 'Δεν έχει οριστεί κλειδί GitHub· η αλλαγή αποθηκεύτηκε αλλά δεν δημοσιεύτηκε.' };
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/actions/workflows/dimosieusi.yml/dispatches', {
    method: 'post', muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    payload: JSON.stringify({ ref: 'main' })
  });
  var c = res.getResponseCode();
  if (c === 204) return { ok: true };
  katagrafi_('σύστημα', '', 'Αποτυχία εντολής δημοσίευσης (' + c + ')', '', '');
  eidopoiisi_('Η δημοσίευση δεν ξεκίνησε', 'Το GitHub απάντησε ' + c + '. Πιθανόν έληξε το κλειδί GitHub.\n' + res.getContentText().slice(0, 300));
  return { ok: false, minima: 'Η αλλαγή αποθηκεύτηκε, αλλά η δημοσίευση δεν ξεκίνησε (κωδικός ' + c + '). Ενημερώστε την τεχνική υποστήριξη.' };
}

/* ═══════════════ Αντίγραφα, ιστορικό, ειδοποιήσεις ═══════════════ */

function antigrafo() {
  var root = DriveApp.getFolderById(P().getProperty('ROOT_ID'));
  var f = root.getFoldersByName('Αντίγραφα ασφαλείας').next();
  var ss = SpreadsheetApp.getActive();
  DriveApp.getFileById(ss.getId()).makeCopy('Αντίγραφο ' + Utilities.formatDate(new Date(), 'Europe/Athens', 'yyyy-MM-dd'), f);
  var files = [], it = f.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(12).forEach(function (x) { x.setTrashed(true); });
  var d = P().getProperty('GITHUB_TOKEN_DATE');
  if (d && (new Date() - new Date(d)) / 864e5 > 330) eidopoiisi_('Ανανέωση κλειδιού GitHub', 'Το κλειδί δημοσίευσης λήγει σύντομα. Χρειάζεται ανανέωση (5 λεπτά).');
}

function katagrafi_(rolos, onoma, energeia, id, titlos) {
  var sh = fyllo_('istoriko');
  sh.appendRow([new Date(), rolos === 'diefthynsi' ? 'διεύθυνση' : rolos === 'syntaktis' ? 'συντάκτης' : rolos, onoma || '', energeia, id || '', titlos || '']);
}

function istoriko_(n) {
  var sh = fyllo_('istoriko'), last = sh.getLastRow();
  if (last < 2) return [];
  var from = Math.max(2, last - n + 1);
  return sh.getRange(from, 1, last - from + 1, 6).getValues().reverse().map(function (r) {
    return [Utilities.formatDate(new Date(r[0]), 'Europe/Athens', 'dd/MM/yyyy HH:mm'), r[1], r[2], r[3], r[5]];
  });
}

function eidopoiisi_(thema, keimeno) {
  var to = P().getProperty('NOTIFY_EMAIL');
  if (!to) return;
  try { MailApp.sendEmail(to, '[Ιστοσελίδα σχολείου] ' + thema, keimeno + '\n\nΠίνακας διαχείρισης: ' + PINAKAS_URL + '\nΟδηγίες χρήσης: ' + ODIGIES_URL); } catch (e) {}
}

/* ═══════════════ Εισαγωγή παλιών αναρτήσεων (μία φορά, συνεχίζει αν διακοπεί) ═══════════════ */

function eisagogi() {
  var ui = SpreadsheetApp.getUi(), p = P(), t0 = Date.now();
  var root = DriveApp.getFolderById(p.getProperty('ROOT_ID'));
  var eis = root.getFoldersByName('Εισαγωγή').next();
  var it = eis.getFilesByName('eisagogi.json');
  if (!it.hasNext()) { ui.alert('Λείπει το eisagogi.json στον φάκελο «Εισαγωγή».'); return; }
  var dedomena = JSON.parse(it.next().getBlob().getDataAsString('UTF-8'));
  var xartis = JSON.parse(p.getProperty('EISAGOGI_XARTIS') || '{}');
  if (!p.getProperty('EISAGOGI_XARTIS_OK')) {           // 1ο πέρασμα: διαδρομή αρχείου → id στο Drive
    (function skan(folder, path) {
      var f = folder.getFiles();
      while (f.hasNext()) { var x = f.next(); xartis[path + x.getName()] = x.getId(); }
      var s = folder.getFolders();
      while (s.hasNext()) { var y = s.next(); skan(y, path + y.getName() + '/'); }
    })(eis, '');
    p.setProperty('EISAGOGI_XARTIS', JSON.stringify(xartis));
    p.setProperty('EISAGOGI_XARTIS_OK', '1');
  }
  var ok = JSON.parse(p.getProperty('EISAGOGI_OK') || '[]'), done = {};
  ok.forEach(function (i) { done[i] = 1; });
  var sha = fyllo_('anartiseis'), sels = fyllo_('selides'), leipoun = [];
  var idmap = function (rel, prefix) { return xartis[prefix + rel] || null; };
  (dedomena.anartiseis || []).forEach(function (a) {
    if (done['a' + a.id] || Date.now() - t0 > 300000) return;
    var fot = (a.fotografies || []).map(function (f) {
      var id = idmap(f.arxeio.replace(/\.\w+$/, '-1600.webp'), 'fotografies/');
      if (!id) leipoun.push(f.arxeio);
      return id ? { id: id, perigrafi: f.perigrafi || '' } : null;
    }).filter(Boolean);
    var arx = (a.arxeia || []).map(function (rel) {
      var id = idmap(rel, 'arxeia/');
      if (!id) leipoun.push(rel);
      return id ? { id: id, onoma: rel.split('/').pop() } : null;
    }).filter(Boolean);
    prosthese_(sha, 'anartiseis', {
      id: 'wp' + a.id, katastasi: 'Δημοσιευμένη', imerominia: a.imerominia, titlos: a.titlos, enotita: a.enotita,
      taxeis: (a.taxeis || []).join(','), diktya: (a.diktya || []).join(','), keimeno: a.keimeno,
      fotografies: JSON.stringify(fot), arxeia: JSON.stringify(arx),
      video: (a.video || []).map(function (v) { return 'https://youtu.be/' + v.id; }).join(' '),
      syggrafeas: 'Από τον παλιό ιστότοπο', synainesi: true, url_slug: '', dimiourgia: new Date(), tropopoiisi: new Date()
    });
    ok.push('a' + a.id);
  });
  if (!done['selides']) {
    (dedomena.selides || []).forEach(function (s) {
      var arx = (s.arxeia || []).map(function (rel) { var id = idmap(rel, 'arxeia/'); return id ? { id: id, onoma: rel.split('/').pop() } : null; }).filter(Boolean);
      var fot = (s.fotografies || []).map(function (f) { var id = idmap(f.arxeio.replace(/\.\w+$/, '-1600.webp'), 'fotografies/'); return id ? { id: id, perigrafi: f.perigrafi || '' } : null; }).filter(Boolean);
      prosthese_(sels, 'selides', { id: s.id, omada: s.omada, seira: s.seira, titlos: s.titlos, perigrafi: s.perigrafi, keimeno: s.keimeno || '',
        simeiosi: s.simeiosi || '', katastasi: s.katastasi, arxeia: JSON.stringify(arx), fotografies: JSON.stringify(fot), tropopoiisi: new Date() });
    });
    ok.push('selides');
  }
  p.setProperty('EISAGOGI_OK', JSON.stringify(ok));
  var synolo = (dedomena.anartiseis || []).length, egine = ok.filter(function (x) { return x !== 'selides'; }).length;
  ui.alert(egine < synolo ? 'Η εισαγωγή συνεχίζεται' : 'Η εισαγωγή ολοκληρώθηκε',
    'Αναρτήσεις: ' + egine + ' από ' + synolo + (egine < synolo ? '\n\nΞανατρέξτε «4. Εισαγωγή» για να συνεχίσει από εκεί που σταμάτησε.' : '') +
    (leipoun.length ? '\n\nΔεν βρέθηκαν ' + leipoun.length + ' αρχεία (π.χ. ' + leipoun.slice(0, 2).join(', ') + ').' : ''), ui.ButtonSet.OK);
}

/* ═══════════════ Μεταφορά περιεχομένου απευθείας από το (δημόσιο) αποθετήριο GitHub ═══════════════
 * Διαβάζει periexomeno/*.json και meson/* από το raw.githubusercontent.com, ανεβάζει φωτογραφίες και
 * έγγραφα στο Drive και γράφει τις γραμμές στο Φύλλο. Δουλεύει σε κομμάτια των ~4,5 λεπτών και
 * συνεχίζει μόνη της (χρονικός διακόπτης κάθε 1 λεπτό) μέχρι να τελειώσει. Ξανατρέχει χωρίς διπλότυπα.
 */
var GH_RAW = 'https://raw.githubusercontent.com/dimoud/1o_dimotiko/main/';

function eisagogiGithub() {
  var p = P(), t0 = Date.now(), LIMIT = 200000;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var ghJson = function (rel) {
      var r = UrlFetchApp.fetch(GH_RAW + rel, { muteHttpExceptions: true });
      if (r.getResponseCode() !== 200) throw new Error('Δεν διαβάστηκε το ' + rel + ' (' + r.getResponseCode() + ')');
      return JSON.parse(r.getContentText('UTF-8'));
    };
    var enc = function (rel) { return rel.split('/').map(encodeURIComponent).join('/'); };
    var root = DriveApp.getFolderById(p.getProperty('ROOT_ID'));
    var ypo = function (onoma, sub) {
      var f = root.getFoldersByName(onoma).next(), it = f.getFoldersByName(sub);
      return it.hasNext() ? it.next() : f.createFolder(sub);
    };
    var fFot = ypo('Φωτογραφίες', 'Από τον παλιό ιστότοπο'), fDoc = ypo('Έγγραφα', 'Από τον παλιό ιστότοπο');
    var anevase = function (rel, fakelos) {
      var r = UrlFetchApp.fetch(GH_RAW + enc(rel), { muteHttpExceptions: true });
      if (r.getResponseCode() !== 200) return null;
      return fakelos.createFile(r.getBlob().setName(rel.split('/').pop())).getId();
    };
    var fotos = function (list, leipoun) {
      return (list || []).map(function (f) {
        var id = anevase('meson/fotografies/' + f.arxeio.replace(/\.\w+$/, '-1600.webp'), fFot);
        if (!id) leipoun.push(f.arxeio);
        return id ? { id: id, perigrafi: f.perigrafi || '' } : null;
      }).filter(Boolean);
    };
    var docs = function (list, leipoun) {
      return (list || []).map(function (rel) {
        var id = anevase('meson/arxeia/' + rel, fDoc);
        if (!id) leipoun.push(rel);
        return id ? { id: id, onoma: rel.split('/').pop() } : null;
      }).filter(Boolean);
    };

    var an = ghJson('periexomeno/anartiseis.json').filter(function (a) {
      return a.imerominia >= '2024-01-01' && (a.katastasi || 'Δημοσιευμένη') === 'Δημοσιευμένη';
    });
    var yparxoun = {};
    diavase_('anartiseis').forEach(function (r) { yparxoun[r.id] = 1; });
    var sha = fyllo_('anartiseis'), leipoun = JSON.parse(p.getProperty('GH_LEIPOUN') || '[]'), egine = 0, teleiose = true;

    for (var i = 0; i < an.length; i++) {
      var a = an[i];
      if (yparxoun['wp' + a.id]) { egine++; continue; }
      if (Date.now() - t0 > LIMIT) { teleiose = false; break; }
      prosthese_(sha, 'anartiseis', {
        id: 'wp' + a.id, katastasi: 'Δημοσιευμένη', imerominia: a.imerominia, titlos: a.titlos, enotita: a.enotita,
        taxeis: (a.taxeis || []).join(','), diktya: (a.diktya || []).join(','), keimeno: a.keimeno,
        fotografies: JSON.stringify(fotos(a.fotografies, leipoun)), arxeia: JSON.stringify(docs(a.arxeia, leipoun)),
        video: (a.video || []).map(function (v) { return 'https://youtu.be/' + v.id; }).join(' '),
        syggrafeas: 'Από τον παλιό ιστότοπο', synainesi: true, url_slug: '', dimiourgia: new Date(), tropopoiisi: new Date()
      });
      SpreadsheetApp.flush();
      egine++;
    }

    if (teleiose && !p.getProperty('GH_SELIDES')) {
      if (Date.now() - t0 > LIMIT) teleiose = false;
      else {
        var sel = ghJson('periexomeno/selides.json'), wp = {};
        try { ghJson('periexomeno/selides-wp.json').forEach(function (r) { wp[r.slug] = r; }); } catch (e) {}
        var yp = {};
        diavase_('selides').forEach(function (r) { yp[r.id] = 1; });
        var sels = fyllo_('selides');
        sel.forEach(function (s) {
          if (yp[s.id]) return;
          var w = wp[s.apo_wp || ''] || {};
          prosthese_(sels, 'selides', { id: s.id, omada: s.omada, seira: s.seira, titlos: s.titlos, perigrafi: s.perigrafi || '',
            keimeno: s.keimeno || w.keimeno || '', simeiosi: s.simeiosi || '', katastasi: s.katastasi || 'Δημοσιευμένη',
            fotografies: JSON.stringify(fotos(s.fotografies || w.fotografies, leipoun)), arxeia: JSON.stringify(docs(s.arxeia || w.arxeia, leipoun)),
            tropopoiisi: new Date() });
        });
        p.setProperty('GH_SELIDES', '1');
      }
    }
    p.setProperty('GH_LEIPOUN', JSON.stringify(leipoun.slice(0, 200)));

    ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'eisagogiGithub') ScriptApp.deleteTrigger(t); });
    if (!teleiose) {
      ScriptApp.newTrigger('eisagogiGithub').timeBased().after(60 * 1000).create();
      katagrafi_('σύστημα', '', 'Μεταφορά: ' + egine + ' από ' + an.length + ' αναρτήσεις, συνεχίζει', '', '');
    } else {
      katagrafi_('σύστημα', '', 'Μεταφορά ολοκληρώθηκε: ' + an.length + ' αναρτήσεις' + (leipoun.length ? ', λείπουν ' + leipoun.length + ' αρχεία' : ''), '', '');
      eidopoiisi_('Η μεταφορά περιεχομένου ολοκληρώθηκε', an.length + ' αναρτήσεις και οι σελίδες βρίσκονται πλέον στον Πίνακα διαχείρισης.' +
        (leipoun.length ? '\nΔεν βρέθηκαν ' + leipoun.length + ' αρχεία (π.χ. ' + leipoun.slice(0, 3).join(', ') + ').' : ''));
    }
  } finally { lock.releaseLock(); }
}

/* ═══════════════ Βοηθητικά Φύλλου ═══════════════ */

function fyllo_(k) { return SpreadsheetApp.getActive().getSheetByName(ONOMATA_FYLLON[k]); }

function diavase_(k) {
  var sh = fyllo_(k), v = sh.getDataRange().getValues(), kef = v.shift();
  return v.map(function (row, i) {
    var o = { _row: i + 2 };
    kef.forEach(function (h, j) { o[kleidi_(h)] = row[j]; });
    return o;
  }).filter(function (o) { return o.id; });
}

function vres_(k, id) { return diavase_(k).filter(function (r) { return String(r.id) === String(id); })[0] || null; }

function grapse_(sh, row, pedia) {
  var kef = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(kleidi_);
  Object.keys(pedia).forEach(function (k) {
    var c = kef.indexOf(k);
    if (c >= 0) sh.getRange(row, c + 1).setValue(pedia[k]);
  });
}

function prosthese_(sh, k, pedia) {   // κατά τις επικεφαλίδες του Φύλλου (όχι κατά θέση: στήλες μπορεί να προστεθούν)
  var kef = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(kleidi_) : FYLLA[k];
  sh.appendRow(kef.map(function (h) { return pedia[h] === undefined ? '' : pedia[h]; }));
}

/* ═══════════════ Αρίθμηση αναρτήσεων (Α/Α) ═══════════════
 * Σταθερός αύξων αριθμός ανά ανάρτηση· οι παλιές αριθμούνται μία φορά κατά ημερομηνία. Επιστρέφει τον μεγαλύτερο. */
function arithmisi_() {
  var sh = fyllo_('anartiseis'), kef = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(kleidi_);
  if (kef.indexOf('arithmos') < 0) {
    sh.getRange(1, kef.length + 1).setValue(etiketa_('arithmos')).setFontWeight('bold').setBackground('#eef5fc');
  }
  var rows = diavase_('anartiseis'), max = 0;
  rows.forEach(function (r) { var n = Number(r.arithmos) || 0; if (n > max) max = n; });
  var leipoun = rows.filter(function (r) { return !Number(r.arithmos); });
  if (!leipoun.length) return max;
  leipoun.sort(function (a, b) { var x = hm_(a.imerominia), y = hm_(b.imerominia); return x < y ? -1 : x > y ? 1 : (a._row - b._row); })
    .forEach(function (r) { max++; r.arithmos = max; });
  // μία εγγραφή για όλη τη στήλη (όχι μία ανά γραμμή)
  var col = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(kleidi_).indexOf('arithmos') + 1, last = sh.getLastRow();
  if (last >= 2) {
    var vals = sh.getRange(2, col, last - 1, 1).getValues(), ana = {};
    rows.forEach(function (r) { ana[r._row] = r.arithmos; });
    for (var i = 0; i < vals.length; i++) if (ana[i + 2] != null && ana[i + 2] !== '') vals[i][0] = ana[i + 2];
    sh.getRange(2, col, last - 1, 1).setValues(vals);
  }
  return max;
}

/* ═══════════════ Κάδος ανακύκλωσης ═══════════════
 * «Αφαίρεση» = Αποσυρμένη: φεύγει από την ιστοσελίδα, μένει στον κάδο KADOS_MERES ημέρες και επαναφέρεται με ένα πάτημα.
 * Μετά: η γραμμή σβήνεται και οι φωτογραφίες/τα PDF της πάνε στον Κάδο του Drive (εκεί μένουν άλλες 30 ημέρες). */
function meresKadou_(r) {
  var t = r.tropopoiisi instanceof Date ? r.tropopoiisi : (r.tropopoiisi ? new Date(r.tropopoiisi) : null);
  if (!t || isNaN(t)) return KADOS_MERES;
  return Math.max(0, Math.ceil(KADOS_MERES - (new Date() - t) / 864e5));
}
function kadosAnakyklosis() {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(30000)) return 0;
  try {
    var sh = fyllo_('anartiseis'), rows = diavase_('anartiseis');
    var lixi = rows.filter(function (r) { return r.katastasi === 'Αποσυρμένη' && r.tropopoiisi && meresKadou_(r) === 0; });
    if (!lixi.length) return 0;
    oristikiDiagrafi_(sh, rows, lixi, 'σύστημα', 'Οριστική διαγραφή από τον κάδο (' + KADOS_MERES + ' ημέρες)');
    return lixi.length;
  } finally { lock.releaseLock(); }
}
/* Σβήνει γραμμές και στέλνει στον Κάδο του Drive μόνο τα αρχεία που δεν χρησιμοποιεί άλλη ανάρτηση ή σελίδα. */
function oristikiDiagrafi_(sh, rows, svisimo, rolos, energeia) {
  var ids = svisimo.map(function (r) { return r.id; }), menoun = {};
  rows.concat(diavase_('selides')).forEach(function (r) {
    if (ids.indexOf(r.id) >= 0) return;
    json_(r.fotografies, []).concat(json_(r.arxeia, [])).forEach(function (f) { menoun[f.id] = true; });
  });
  svisimo.slice().sort(function (a, b) { return b._row - a._row; }).forEach(function (r) {
    json_(r.fotografies, []).concat(json_(r.arxeia, [])).forEach(function (f) {
      if (f.id && !menoun[f.id]) { try { DriveApp.getFileById(f.id).setTrashed(true); } catch (e) {} }
    });
    sh.deleteRow(r._row);
    katagrafi_(rolos, rolos === 'διεύθυνση' ? 'Διεύθυνση' : '', energeia, r.id, r.titlos);
  });
}
function egkatastasiKadou_() {   // ημερήσιος έλεγχος του κάδου, μία φορά
  try {
    if (ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'kadosAnakyklosis'; })) return;
    ScriptApp.newTrigger('kadosAnakyklosis').timeBased().everyDays(1).atHour(3).create();
  } catch (e) {}
}

function hash_(s) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, P().getProperty('SALT') + '|' + s, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(b);
}

function json_(s, def) { try { return s ? JSON.parse(s) : def; } catch (e) { return def; } }

function hm_(d) { return d instanceof Date ? Utilities.formatDate(d, 'Europe/Athens', 'yyyy-MM-dd') : String(d || ''); }

function youtubeId_(s) {
  var m = String(s || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
  return m ? m[1] : '';
}

function include(n) { return HtmlService.createHtmlOutputFromFile(n).getContent(); }

/* ═══════════════ Οδηγίες χρήσης: μόνο για συνδεδεμένους ═══════════════ */
var ODIGOS_PDF_ONOMA = 'Οδηγός νέας ανάρτησης (για τον Πίνακα, μην το σβήσετε).pdf';
function odigies(token) {
  synedria_(token);
  return { html: odigiesHtml_() };
}
/** Ο οδηγός PDF με εικόνες φυλάσσεται ιδιωτικά στον φάκελο Drive του Πίνακα. */
function odigosPdf(token) {
  synedria_(token);
  var f = odigosPdfArxeio_();
  if (!f) throw new Error('Ο οδηγός PDF δεν βρέθηκε. Ενημερώστε τον τεχνικό υπεύθυνο.');
  return { onoma: 'Odigos_neas_anartisis.pdf', b64: Utilities.base64Encode(f.getBlob().getBytes()) };
}
function odigosPdfArxeio_() {
  var id = P().getProperty('ODIGOS_PDF_ID');
  if (id) { try { var f = DriveApp.getFileById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  return null;
}
/** Μία φορά, από τον editor: αντιγράφει τον οδηγό PDF στο Drive (ιδιωτικά). url: από πού να τον πάρει. */
function egkatastasiOdigou(url) {
  url = url || 'https://1dim-polichnis.gr/static/odigoi/Odigos_neas_anartisis.pdf';
  if (odigosPdfArxeio_()) { console.log('υπάρχει ήδη: ' + odigosPdfArxeio_().getId()); return; }
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('λήψη ' + r.getResponseCode());
  var root = DriveApp.getFolderById(P().getProperty('ROOT_ID'));
  var f = root.createFile(r.getBlob().setName(ODIGOS_PDF_ONOMA));
  P().setProperty('ODIGOS_PDF_ID', f.getId());
  console.log('ok ' + f.getId() + ' ' + f.getSize());
}
