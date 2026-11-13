# Δοκιμές του Πίνακα διαχείρισης

Ο **πάγκος** (`pagkos.js`) τρέχει το πραγματικό `diaxeirisi/Code.gs` σε εικονικό περιβάλλον Google, στη μνήμη. Δεν αγγίζει το Φύλλο, το Drive ή το GitHub του σχολείου.

| Αρχείο | Τι κάνει | Εκτέλεση |
|---|---|---|
| `dokimes_diakomisti.js` | 37 έλεγχοι του Code.gs: είσοδος, δικαιώματα, νέες και παλιές αναρτήσεις, έγκριση, επιστροφή, προτάσεις, θέσεις (ενότητες και σελίδες), συγκατάθεση, βίντεο, ταυτόχρονη επεξεργασία | `node ergaleia/dokimes/dokimes_diakomisti.js` |
| `senaria_pinaka.py` | ο πραγματικός Πίνακας σε περιηγητή, ως δάσκαλος και ως Διευθύντρια: γράφει, ανεβάζει φωτογραφία, στέλνει, εγκρίνει, επιστρέφει, ψάχνει, ανακτά πρόχειρο, κινητό | `python ergaleia/dokimes/senaria_pinaka.py` (θέλει `pip install playwright` και `python -m playwright install chromium`) |
| `diakomistis.js` | ο Πίνακας για δοκιμή με το χέρι στο http://localhost:8787/ | `node ergaleia/dokimes/diakomistis.js` |
| `sporos.js` | αρχικά δεδομένα: σελίδες μενού και παλιές αναρτήσεις WordPress | — |

Κωδικοί δοκιμών: Διεύθυνση `dokimi-dieythynsi`· Συντάκτης `dokimi-syntaktis` με email `daskala1@test.gr` ή `daskalos2@test.gr`.

**Κανόνας:** πριν από κάθε ανέβασμα του Code.gs ή του Index.html στο Apps Script τρέχουν και τα δύο. Κάθε λάθος που βρεθεί στη χρήση γίνεται νέος έλεγχος εδώ, ώστε να μην ξαναγίνει.
