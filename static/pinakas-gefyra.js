/* pinakas-gefyra.js — ο Πίνακας διαχείρισης μέσα στην ιστοσελίδα.
 * Μιμείται το google.script.run του Apps Script με fetch (POST text/plain, χωρίς προέλεγχο CORS),
 * ώστε ο Πίνακας να ανοίγει χωρίς λογαριασμό Google και χωρίς το σφάλμα «unable to open the file»
 * που βγάζει η Google όταν ο περιηγητής έχει πολλούς λογαριασμούς. */
(function () {
    var API = document.documentElement.getAttribute('data-api');
    function klisi() {
        var ok = function () {}, fail = function () {};
        var h = {
            withSuccessHandler: function (f) { ok = f; return p; },
            withFailureHandler: function (f) { fail = f; return p; }
        };
        var p = new Proxy(h, {
            get: function (t, k) {
                if (k in t) return t[k];
                return function () {
                    var args = Array.prototype.slice.call(arguments);
                    fetch(API, { method: 'POST', body: JSON.stringify({ fn: k, args: args }) })
                        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
                        .then(function (x) {
                            if (x && x.sfalma !== undefined) fail(new Error(x.sfalma));
                            else ok(x ? x.r : null);
                        })
                        .catch(function () { fail(new Error('Δεν ήταν δυνατή η σύνδεση. Ελέγξτε το διαδίκτυο και δοκιμάστε ξανά.')); });
                };
            }
        });
        return p;
    }
    window.google = { script: { get run() { return klisi(); } } };
})();
