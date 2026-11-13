/* Δοκιμαστικός πάγκος του Πίνακα διαχείρισης.
 * Τρέχει το ΠΡΑΓΜΑΤΙΚΟ diaxeirisi/Code.gs μέσα σε εικονικό περιβάλλον Google (Φύλλο, Drive, Cache, Properties,
 * Lock, Mail, GitHub) στη μνήμη. Τίποτα δεν αγγίζει το πραγματικό Φύλλο ή το Drive του σχολείου.
 *
 *   const { neosPagkos } = require('./pagkos');
 *   const g = neosPagkos();                  // καθαρό περιβάλλον
 *   const d = g.syndesi('diefthynsi');        // token Διεύθυνσης
 *   g.call('apothikefsi', [d, {...}, 'proxeiro']);
 *
 * Κωδικοί δοκιμών: Διεύθυνση «dokimi-dieythynsi», Συντάκτης «dokimi-syntaktis»,
 * εκπαιδευτικοί daskala1@test.gr (Μαρία Δοκιμή), daskalos2@test.gr (Γιώργος Δοκιμή).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const RIZA = path.resolve(__dirname, '..', '..');
const KODIKOI = { diefthynsi: 'dokimi-dieythynsi', syntaktis: 'dokimi-syntaktis' };
const DASKALOI = [{ email: 'daskala1@test.gr', onoma: 'Μαρία Δοκιμή' }, { email: 'daskalos2@test.gr', onoma: 'Γιώργος Δοκιμή' }];

/* ── Φύλλο ── */
function Sheet(name, head) { this.name = name; this.d = [head.slice()]; }
Sheet.prototype.getName = function () { return this.name; };
Sheet.prototype.getLastColumn = function () { return this.d[0].length; };
Sheet.prototype.getLastRow = function () { return this.d.length; };
Sheet.prototype._show = function (v) { return (typeof v === 'string' && v[0] === "'") ? v.slice(1) : v; };
Sheet.prototype.getDataRange = function () { const me = this; return { getValues: () => me.d.map(r => me.d[0].map((_, j) => r[j] === undefined ? '' : me._show(r[j]))) }; };
Sheet.prototype.getRange = function (r, c, nr, nc) {
  const me = this; nr = nr || 1; nc = nc || 1;
  const cell = (i, j) => (me.d[r - 1 + i] || [])[c - 1 + j];
  const rng = {
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const x = cell(i, j); return x === undefined ? '' : me._show(x); })),
    getValue: () => { const x = cell(0, 0); return x === undefined ? '' : me._show(x); },
    getFormulas: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const x = cell(i, j); return typeof x === 'string' && x[0] === '=' ? x : ''; })),
    setValues: vv => { vv.forEach((row, i) => row.forEach((x, j) => { while (me.d.length < r + i) me.d.push([]); me.d[r - 1 + i][c - 1 + j] = x; })); return rng; },
    setValue: x => { while (me.d.length < r) me.d.push([]); me.d[r - 1][c - 1] = x; return rng; },
    setFontWeight: () => rng, setBackground: () => rng, setWrapStrategy: () => rng, setNumberFormat: () => rng, setNote: () => rng,
  };
  return rng;
};
Sheet.prototype.appendRow = function (row) { this.d.push(row.slice()); };
Sheet.prototype.deleteRow = function (n) { this.d.splice(n - 1, 1); };
['setFrozenRows', 'autoResizeColumns', 'setColumnWidth', 'hideColumns', 'setTabColor'].forEach(m => { Sheet.prototype[m] = function () { return this; }; });

function formatDate(d, tz, f) {
  d = new Date(d);
  const p = n => ('0' + n).slice(-2);
  return f.replace(/'([^']*)'/g, '\u0001$1\u0002').replace(/yyyy|yy|MM|dd|HH|mm|ss/g, t => ({
    yyyy: d.getFullYear(), yy: p(d.getFullYear() % 100), MM: p(d.getMonth() + 1), dd: p(d.getDate()), HH: p(d.getHours()), mm: p(d.getMinutes()), ss: p(d.getSeconds())
  })[t]).replace(/\u0001([^\u0002]*)\u0002/g, '$1');
}

function neosPagkos(epiloges) {
  epiloges = epiloges || {};
  const cache = {}, props = { GENIA: '0', ROOT_ID: 'root', GITHUB_TOKEN: 'dokimi', GITHUB_REPO: 'dokimi/dokimi', NOTIFY_EMAIL: 'diefthynsi@test.gr' };
  const mail = [], dispatches = [], arxeia = {}, S = {};
  let kleidoma = false, ar = 0;
  const fakelos = (onoma) => ({
    onoma, ypo: {},
    getFoldersByName(n) { const f = this.ypo[n]; let used = false; return { hasNext: () => !!f && !used, next: () => { used = true; return f; } }; },
    createFolder(n) { return (this.ypo[n] = fakelos(n)); },
    createFile(blob) { const id = 'f' + (++ar) + 'dokimi'; arxeia[id] = { id, onoma: blob.name, mime: blob.mime, bytes: blob.bytes.length, trashed: false }; return { getId: () => id, getName: () => blob.name }; },
    getId: () => onoma,
  });
  const root = fakelos('root'); root.createFolder('Φωτογραφίες'); root.createFolder('Έγγραφα');
  const sandbox = {
    console, JSON, Math, Date, String, Number, Array, Object, RegExp, Error, encodeURIComponent, decodeURIComponent,
    CacheService: { getScriptCache: () => ({ get: k => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = String(v); }, remove: k => { delete cache[k]; }, removeAll: ks => ks.forEach(k => delete cache[k]) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); }, deleteProperty: k => { delete props[k]; }, getProperties: () => Object.assign({}, props) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (kleidoma) return false; kleidoma = true; return true; }, waitLock: () => { kleidoma = true; }, releaseLock: () => { kleidoma = false; }, hasLock: () => kleidoma }) },
    Utilities: {
      formatDate, sleep: () => 0, getUuid: () => crypto.randomUUID(),
      base64Decode: s => Array.from(Buffer.from(String(s), 'base64')), base64Encode: b => Buffer.from(b.map(x => x & 255)).toString('base64'),
      newBlob: (bytes, mime, name) => ({ bytes, mime, name }),
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (a, s) => Array.from(crypto.createHash('sha256').update(String(s)).digest()).map(b => (b > 127 ? b - 256 : b)),
    },
    MailApp: { sendEmail: (a, b, c, d) => { const m = typeof a === 'object' ? Object.assign({}, a) : { to: a, subject: b, body: c, opt: d }; if (m.attachments) m.attachments = m.attachments.map(x => ({ name: x.name, mime: x.mime, size: (x.bytes || []).length })); mail.push(m); }, getRemainingDailyQuota: () => 100 },
    UrlFetchApp: { fetch: (url, o) => { dispatches.push({ url, o }); return { getResponseCode: () => (epiloges.githubKodikos || 204), getContentText: () => '{"workflow_runs":[]}' }; } },
    DriveApp: {
      getFolderById: () => root, getRootFolder: () => root, getStorageUsed: () => 3e9, getStorageLimit: () => 15e9,
      getFileById: id => {
        const f = arxeia[id] || { id, onoma: id + '.jpg', trashed: false };
        return { getId: () => id, getName: () => f.onoma, setTrashed: t => { f.trashed = t; }, getThumbnail: () => ({ getBytes: () => [137, 80, 78, 71] }), getBlob: () => ({ getBytes: () => [1, 2, 3], getContentType: () => f.mime || 'image/jpeg' }) };
      },
    },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: n => S[n] || null, getId: () => 'fyllo-dokimis', insertSheet: n => (S[n] = new Sheet(n, [''])) }), flush: () => 0, getUi: () => { throw new Error('χωρίς UI'); }, WrapStrategy: { CLIP: 1 } },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => { const t = { timeBased: () => t, everyDays: () => t, everyMinutes: () => t, everyHours: () => t, atHour: () => t, onWeekDay: () => t, create: () => t }; return t; }, deleteTrigger: () => 0, WeekDay: {} },
    HtmlService: {}, ContentService: { MimeType: {} },
  };
  vm.createContext(sandbox);
  const src = fs.readFileSync(epiloges.codeGs || path.join(RIZA, 'diaxeirisi', 'Code.gs'), 'utf8');
  vm.runInContext(src, sandbox, { filename: 'Code.gs' });
  const run = s => vm.runInContext(s, sandbox);
  // Φύλλα με τις ελληνικές επικεφαλίδες, όπως στο πραγματικό
  const FYLLA = run('FYLLA'), ON = run('ONOMATA_FYLLON'), ET = run('ETIKETES');
  Object.keys(FYLLA).forEach(k => { if (ON[k]) S[ON[k]] = new Sheet(ON[k], FYLLA[k].map(x => ET[x] || x)); });
  if (!S[ON.istoriko]) S[ON.istoriko] = new Sheet(ON.istoriko, ['Χρόνος', 'Ρόλος', 'Όνομα', 'Ενέργεια', 'Κωδικός', 'Τίτλος']);
  props.HASH_DIEYTHYNSIS = run('hash_')(KODIKOI.diefthynsi);
  props.HASH_SYNTAKTI = run('hash_')(KODIKOI.syntaktis);
  props.EMAILS_SYNTAKTON = JSON.stringify(DASKALOI);

  const g = {
    S, props, cache, mail, dispatches, arxeia, run, ON,
    /** Κλήση συνάρτησης του Code.gs όπως από το google.script.run: αντίγραφο JSON πάνω-κάτω, όπως στο πραγματικό. */
    call(fn, args) {
      const f = sandbox[fn];
      if (typeof f !== 'function') throw new Error('άγνωστη συνάρτηση ' + fn);
      const res = f.apply(null, JSON.parse(JSON.stringify(args || [])));
      return res === undefined ? null : JSON.parse(JSON.stringify(res, (k, v) => (v instanceof Date ? v.toISOString() : v)));
    },
    /** Είσοδος: 'diefthynsi' ή 'syntaktis' (με email δασκάλου). Επιστρέφει token. */
    syndesi(rolos, email) {
      const r = g.call('syndesi', [KODIKOI[rolos], rolos === 'syntaktis' ? (email || DASKALOI[0].email) : '']);
      if (!r.ok) throw new Error('είσοδος ' + rolos + ': ' + r.minima);
      return r.token;
    },
    /** Πρόσθεση σελίδας στο Φύλλο (όπως από το αρχικό στήσιμο). */
    selida(o) {
      const sh = S[ON.selides], kef = sh.d[0].map(h => run('kleidi_')(h));
      sh.appendRow(kef.map(k => (k in o ? (typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]) : '')));
    },
    /** Παλιά ανάρτηση από το WordPress (κωδικός wpNNNN), δημοσιευμένη. */
    palia(o) {
      const sh = S[ON.anartiseis], kef = sh.d[0].map(h => run('kleidi_')(h));
      const d = Object.assign({ katastasi: 'Δημοσιευμένη', syggrafeas: '', synainesi: true, fotografies: '[]', arxeia: '[]', video: '', taxeis: '', diktya: '', alles_enotites: '' }, o);
      sh.appendRow(kef.map(k => (k in d ? (typeof d[k] === 'object' ? JSON.stringify(d[k]) : d[k]) : '')));
    },
    grammi(id) { return g.call('diavase_', ['anartiseis']).filter(r => String(r.id) === String(id))[0] || null; },
  };
  return g;
}

module.exports = { neosPagkos, KODIKOI, DASKALOI, RIZA };
