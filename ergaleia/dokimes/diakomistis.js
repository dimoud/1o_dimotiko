/* Τοπικός διακομιστής δοκιμών: ο ΠΡΑΓΜΑΤΙΚΟΣ Πίνακας (diaxeirisi/Index.html) σε περιηγητή, συνδεδεμένος
 * με το ΠΡΑΓΜΑΤΙΚΟ Code.gs μέσα στον πάγκο (pagkos.js). Χωρίς Google, χωρίς το Φύλλο του σχολείου.
 *
 *   node ergaleia/dokimes/diakomistis.js [θύρα]      → http://localhost:8787/
 *   Κωδικοί: Διεύθυνση «dokimi-dieythynsi», Συντάκτης «dokimi-syntaktis» με email daskala1@test.gr
 *
 *   POST /_reset           καθαρό περιβάλλον (και προαιρετικά σπόρος δεδομένων)
 *   GET  /_state           Φύλλο, email, εντολές δημοσίευσης (για τους ελέγχους)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { neosPagkos, RIZA } = require('./pagkos');

let g = neosPagkos();
const seed = require('./sporos');
seed(g);

const SHIM = `<script>
/* google.script.run → /rpc του πάγκου (ίδια σημασιολογία: αλυσίδα handlers, ασύγχρονη κλήση) */
(function () {
  function mk(ok, fail) {
    return new Proxy({}, { get: function (_, k) {
      if (k === 'withSuccessHandler') return function (f) { return mk(f, fail); };
      if (k === 'withFailureHandler') return function (f) { return mk(ok, f); };
      if (k === 'withUserObject') return function () { return mk(ok, fail); };
      return function () {
        var args = [].slice.call(arguments);
        fetch('/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn: k, args: args }) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j.error) { if (fail) fail(new Error(j.error)); } else if (ok) ok(j.result); })
          .catch(function (e) { if (fail) fail(e); });
      };
    } });
  }
  window.google = { script: { run: mk(null, null) } };
})();
</script>`;

function selida() {
  const html = fs.readFileSync(path.join(RIZA, 'diaxeirisi', 'Index.html'), 'utf8');
  return html.replace(/<head>/i, '<head>' + SHIM);
}

function soma(req) { return new Promise(res => { let b = ''; req.on('data', c => { b += c; }); req.on('end', () => res(b)); }); }

const srv = http.createServer(async (req, res) => {
  const json = (o, c) => { res.writeHead(c || 200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(selida()); }
    if (req.method === 'POST' && req.url === '/rpc') {
      const { fn, args } = JSON.parse(await soma(req));
      try { return json({ result: g.call(fn, args) }); } catch (e) { return json({ error: e.message }); }
    }
    if (req.method === 'POST' && req.url === '/_reset') { g = neosPagkos(); seed(g); return json({ ok: true }); }
    if (req.method === 'GET' && req.url === '/_state') {
      return json({ anartiseis: g.call('diavase_', ['anartiseis']), selides: g.call('diavase_', ['selides']), mail: g.mail, dispatches: g.dispatches.length, istoriko: g.S[g.ON.istoriko].d.slice(1) });
    }
    res.writeHead(404); res.end('—');
  } catch (e) { json({ error: e.message }, 500); }
});
const port = Number(process.argv[2] || process.env.PORT || 8787);
srv.listen(port, () => console.log('Πίνακας δοκιμών: http://localhost:' + port + '/'));
