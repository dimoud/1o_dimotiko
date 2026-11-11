/**
 * Φόρμα επικοινωνίας της ιστοσελίδας — 1ο Δημοτικό Σχολείο Πολίχνης
 *
 * Ζει στο ΙΔΙΟ έργο Apps Script με τον Πίνακα διαχείρισης (δεύτερο αρχείο, δίπλα στο Code.gs).
 * Η ιστοσελίδα στέλνει τη φόρμα (POST) στην ίδια διεύθυνση /exec του Πίνακα.
 *
 *   1. Μήνυμα προς το σχολείο (mail@1dim-polichn.thess.sch.gr).
 *      «Απάντηση» από το σχολείο → πηγαίνει κατευθείαν στον γονέα/επισκέπτη.
 *   2. Επιβεβαίωση προς τον επισκέπτη, με όνομα αποστολέα «1ο Δημοτικό Σχολείο Πολίχνης».
 *      «Απάντηση» από τον επισκέπτη → πηγαίνει στο email του σχολείου (όχι στο Gmail).
 *
 * Δοκιμή: επιλέξτε τη συνάρτηση «dokimiFormas» → Εκτέλεση. Έρχονται στο email του σχολείου
 * και τα δύο δείγματα (προς σχολείο και προς επισκέπτη).
 */

var FORMA = {
  kleidi: 'k_uYy7s5eyz8GmKo5nxhFb4nyx',               // ίδιο με το κρυφό πεδίο _key της ιστοσελίδας
  sxoleio: 'mail@1dim-polichn.thess.sch.gr',          // παραλήπτης και διεύθυνση απαντήσεων
  onoma: '1ο Δημοτικό Σχολείο Πολίχνης',
  geniki: '1ου Δημοτικού Σχολείου Πολίχνης',
  dieythynsi: 'Σχολείου 1, 565 33 Πολίχνη Θεσσαλονίκης',
  tilefono: '2310 654739',
  fax: '2310 587767',
  site: 'https://1dim-polichnis.gr/',
  logo: 'https://www.expertease.eu/1o_dimotiko/email-logo.png',
  mple: '#1e64a8', skouro: '#14324f',
  megisto: 5000
};

function doPost(e) {
  // Πίνακας διαχείρισης από την ιστοσελίδα: σώμα JSON (η φόρμα στέλνει multipart)
  if (e && e.postData && /^\s*\{/.test(e.postData.contents || '')) {
    var b; try { b = JSON.parse(e.postData.contents); } catch (x) { b = null; }
    if (b && b.fn) return rpc_(b);
  }
  try {
    var p = (e && e.parameter) || {};
    if (p._hp) return formaJson_({ result: 'success' });                     // ρομπότ: σιωπηλή αποδοχή
    if (p._key !== FORMA.kleidi) return formaJson_({ error: 'bad key' });
    if (p._to !== FORMA.sxoleio) return formaJson_({ error: 'bad recipient' });

    var d = {
      onoma: formaClip_(p.name), email: formaClip_(p.email).toLowerCase(), tilefono: formaClip_(p.phone),
      thema: formaClip_(p.subject) || 'Γενική ερώτηση', minima: formaClip_(p.message)
    };
    if (!d.onoma || !d.email || !d.minima) return formaJson_({ error: 'missing fields' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return formaJson_({ error: 'bad email' });

    // φρένο κατάχρησης: έως 5 μηνύματα την ώρα από την ίδια διεύθυνση email
    var c = CacheService.getScriptCache(), kk = 'f_' + d.email, n = Number(c.get(kk) || 0);
    if (n >= 5) return formaJson_({ error: 'rate' });
    c.put(kk, String(n + 1), 3600);

    var logo = formaLogo_(), inline = logo ? { logo: logo } : {};
    d.xronos = Utilities.formatDate(new Date(), 'Europe/Athens', "dd/MM/yyyy 'ώρα' HH:mm");
    d.ar = 'Ι-' + Utilities.formatDate(new Date(), 'Europe/Athens', 'yyMMdd-HHmm');

    // 1. Προς το σχολείο
    MailApp.sendEmail({
      to: FORMA.sxoleio,
      replyTo: d.email,
      name: FORMA.onoma + ' · Ιστοσελίδα',
      subject: 'Μήνυμα από την ιστοσελίδα: ' + d.thema + ' (' + d.onoma + ')',
      htmlBody: formaProsSxoleio_(d, !!logo),
      body: formaKeimenoSxoleio_(d),
      inlineImages: inline
    });

    // 2. Επιβεβαίωση προς τον επισκέπτη (μία ανά 10 λεπτά στην ίδια διεύθυνση)
    var ck = 'c_' + d.email;
    if (!c.get(ck)) {
      c.put(ck, '1', 600);
      MailApp.sendEmail({
        to: d.email,
        replyTo: FORMA.sxoleio,
        name: FORMA.onoma,
        subject: 'Λάβαμε το μήνυμά σας · ' + FORMA.onoma,
        htmlBody: formaProsEpiskepti_(d, !!logo),
        body: formaKeimenoEpiskepti_(d),
        inlineImages: inline
      });
    }
    try { katagrafi_('φόρμα', d.onoma, 'Μήνυμα από τη φόρμα: ' + d.thema, '', ''); } catch (x) {}
    return formaJson_({ result: 'success' });
  } catch (err) {
    return formaJson_({ error: String(err) });
  }
}

/** Δοκιμή: στέλνει στο email του σχολείου και τα δύο δείγματα. */
function dokimiFormas() {
  var d = { onoma: 'Μαρία Παπαδοπούλου (δοκιμή)', email: FORMA.sxoleio, tilefono: '6900 000000', thema: 'Εγγραφές μαθητών',
            minima: 'Καλησπέρα σας,\nθα ήθελα να ενημερωθώ για τα δικαιολογητικά εγγραφής στην Α΄ τάξη.\n\nΕυχαριστώ.',
            xronos: Utilities.formatDate(new Date(), 'Europe/Athens', "dd/MM/yyyy 'ώρα' HH:mm"), ar: 'Ι-ΔΟΚΙΜΗ' };
  var logo = formaLogo_(), inline = logo ? { logo: logo } : {};
  MailApp.sendEmail({ to: FORMA.sxoleio, name: FORMA.onoma + ' · Ιστοσελίδα', subject: '[Δοκιμή 1/2] Μήνυμα από την ιστοσελίδα: ' + d.thema,
                      htmlBody: formaProsSxoleio_(d, !!logo), body: formaKeimenoSxoleio_(d), inlineImages: inline });
  MailApp.sendEmail({ to: FORMA.sxoleio, name: FORMA.onoma, replyTo: FORMA.sxoleio, subject: '[Δοκιμή 2/2] Λάβαμε το μήνυμά σας · ' + FORMA.onoma,
                      htmlBody: formaProsEpiskepti_(d, !!logo), body: formaKeimenoEpiskepti_(d), inlineImages: inline });
}

/* ═══════════════ Πρότυπα email ═══════════════ */

function formaPlaisio_(eswteriko, hasLogo, proeskopisi) {
  var F = FORMA;
  var kefali = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    (hasLogo ? '<td width="64" style="padding-right:14px;vertical-align:middle"><img src="cid:logo" width="56" height="56" alt="" style="display:block;border:0"></td>' : '') +
    '<td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="font-size:18px;font-weight:bold;color:' + F.skouro + ';line-height:1.25">' + F.onoma + '</div>' +
    '<div style="font-size:13px;color:#5b6b7c;margin-top:2px">Πολίχνη Θεσσαλονίκης</div></td></tr></table>';
  return '<!DOCTYPE html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>' +
    '<body style="margin:0;padding:0;background:#eef2f7">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + formaEsc_(proeskopisi) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7"><tr><td align="center" style="padding:24px 12px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden">' +
    '<tr><td style="height:5px;background:' + F.mple + ';background:linear-gradient(90deg,#1e64a8,#2a7a3b 55%,#f2b233)"></td></tr>' +
    '<tr><td style="padding:22px 28px 14px;border-bottom:1px solid #e6ebf1">' + kefali + '</td></tr>' +
    '<tr><td style="padding:22px 28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1b2633">' + eswteriko + '</td></tr>' +
    '<tr><td style="padding:16px 28px;background:' + F.skouro + ';font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.7;color:#cfdbe8">' +
    '<strong style="color:#ffffff">' + F.onoma + '</strong><br>' + F.dieythynsi + '<br>' +
    'Τηλ. ' + F.tilefono + ' · Fax ' + F.fax + '<br>' +
    '<a href="mailto:' + F.sxoleio + '" style="color:#ffffff">' + F.sxoleio + '</a> · ' +
    '<a href="' + F.site + '" style="color:#ffffff">Ιστοσελίδα σχολείου</a></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function formaPinakas_(d) {
  var rows = [['Ονοματεπώνυμο', d.onoma], ['Email', '<a href="mailto:' + formaEsc_(d.email) + '" style="color:#1e64a8">' + formaEsc_(d.email) + '</a>'],
              ['Τηλέφωνο', d.tilefono ? formaEsc_(d.tilefono) : '—'], ['Θέμα', formaEsc_(d.thema)], ['Ημερομηνία', formaEsc_(d.xronos)]];
  var h = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:14px 0 16px;font-size:14px">';
  rows.forEach(function (r, i) {
    h += '<tr><td style="padding:8px 10px;width:130px;color:#5b6b7c;border-bottom:1px solid #eef1f5;vertical-align:top">' + r[0] + '</td>' +
         '<td style="padding:8px 10px;border-bottom:1px solid #eef1f5;font-weight:' + (i === 0 ? 'bold' : 'normal') + '">' + (i === 0 ? formaEsc_(r[1]) : r[1]) + '</td></tr>';
  });
  return h + '</table>';
}

function formaMinima_(d) {
  return '<div style="font-size:13px;color:#5b6b7c;margin:0 0 6px">Μήνυμα</div>' +
    '<div style="padding:14px 16px;background:#f5f8fc;border-left:4px solid ' + FORMA.mple + ';border-radius:4px;white-space:pre-wrap">' + formaEsc_(d.minima) + '</div>';
}

function formaProsSxoleio_(d, hasLogo) {
  var esw = '<div style="font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#2a7a3b;font-weight:bold">Νέο μήνυμα από τη φόρμα επικοινωνίας</div>' +
    '<h1 style="font-size:20px;line-height:1.3;margin:6px 0 0;color:#14324f">' + formaEsc_(d.thema) + '</h1>' +
    formaPinakas_(d) + formaMinima_(d) +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td style="background:' + FORMA.mple + ';border-radius:24px">' +
    '<a href="mailto:' + formaEsc_(d.email) + '?subject=' + encodeURIComponent('Απ: ' + d.thema) + '" style="display:inline-block;padding:11px 22px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px">Απάντηση στον αποστολέα</a></td></tr></table>' +
    '<p style="font-size:12.5px;color:#5b6b7c;margin:16px 0 0">Με «Απάντηση» το μήνυμά σας πηγαίνει κατευθείαν στο ' + formaEsc_(d.email) + '. Κωδικός μηνύματος: ' + formaEsc_(d.ar) + '.</p>';
  return formaPlaisio_(esw, hasLogo, d.onoma + ': ' + d.minima.slice(0, 90));
}

function formaProsEpiskepti_(d, hasLogo) {
  var esw = '<p style="margin:0 0 12px">Αγαπητή/Αγαπητέ ' + formaEsc_(d.onoma.replace(/\s*\(δοκιμή\)$/, '')) + ',</p>' +
    '<p style="margin:0 0 12px">σας ευχαριστούμε για την επικοινωνία. Το μήνυμά σας έφτασε στο σχολείο και θα σας απαντήσουμε το συντομότερο δυνατό.</p>' +
    '<p style="margin:0 0 4px">Ακολουθεί αντίγραφο του μηνύματος που στείλατε:</p>' +
    formaPinakas_(d) + formaMinima_(d) +
    '<p style="margin:18px 0 0">Για θέμα που δεν μπορεί να περιμένει, καλέστε μας στο <a href="tel:+30' + FORMA.tilefono.replace(/\s/g, '') + '" style="color:#1e64a8;font-weight:bold">' + FORMA.tilefono + '</a>, τις ώρες λειτουργίας του σχολείου.</p>' +
    '<p style="margin:18px 0 0">Με εκτίμηση,<br><strong>Η Διεύθυνση του ' + FORMA.geniki + '</strong></p>' +
    '<p style="font-size:12px;color:#7a8896;margin:18px 0 0;border-top:1px solid #eef1f5;padding-top:12px">Λάβατε αυτό το μήνυμα επειδή συμπληρώσατε τη φόρμα επικοινωνίας της ιστοσελίδας του σχολείου. Αν απαντήσετε σε αυτό το email, η απάντησή σας θα σταλεί στο ' + FORMA.sxoleio + '.</p>';
  return formaPlaisio_(esw, hasLogo, 'Λάβαμε το μήνυμά σας και θα σας απαντήσουμε σύντομα.');
}

function formaKeimenoSxoleio_(d) {
  return ['Νέο μήνυμα από τη φόρμα επικοινωνίας της ιστοσελίδας', '', 'Ονοματεπώνυμο: ' + d.onoma, 'Email: ' + d.email,
          'Τηλέφωνο: ' + (d.tilefono || '—'), 'Θέμα: ' + d.thema, 'Ημερομηνία: ' + d.xronos, '', d.minima].join('\n');
}

function formaKeimenoEpiskepti_(d) {
  return 'Σας ευχαριστούμε για την επικοινωνία. Το μήνυμά σας έφτασε στο σχολείο και θα σας απαντήσουμε το συντομότερο δυνατό.\n\n' +
    'Θέμα: ' + d.thema + '\n\n' + d.minima + '\n\nΜε εκτίμηση,\nΗ Διεύθυνση του ' + FORMA.geniki + '\n' +
    FORMA.dieythynsi + ' · Τηλ. ' + FORMA.tilefono + ' · ' + FORMA.sxoleio;
}

/* ═══════════════ Βοηθητικά ═══════════════ */

function formaLogo_() {
  try {
    var c = CacheService.getScriptCache(), b = c.get('forma_logo_v2');
    if (b) return Utilities.newBlob(Utilities.base64Decode(b), 'image/png', 'logo.png');
    var r = UrlFetchApp.fetch(FORMA.logo, { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return null;
    var blob = r.getBlob().setName('logo.png');
    c.put('forma_logo_v2', Utilities.base64Encode(blob.getBytes()), 21600);
    return blob;
  } catch (e) { return null; }
}

function formaClip_(v) { return String(v || '').trim().slice(0, FORMA.megisto); }

function formaEsc_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formaJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
