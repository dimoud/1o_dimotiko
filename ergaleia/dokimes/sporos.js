/* Αρχικά δεδομένα δοκιμών: σελίδες των μενού και μερικές παλιές αναρτήσεις του WordPress (κωδικοί wpNNNN),
 * όπως είναι στο πραγματικό Φύλλο μετά τη μεταφορά. */
'use strict';
module.exports = function sporos(g) {
  const SEL = [
    ['istoria', 'sxoleio', 1, 'Η ιστορία του σχολείου', 'Δημοσιευμένη'],
    ['edy', 'sxoleio', 2.5, 'Επιτροπή Διεπιστημονικής Υποστήριξης (Ε.Δ.Υ.)', 'Δημοσιευμένη'],
    ['egkatastaseis', 'sxoleio', 4, 'Σχολικές εγκαταστάσεις', 'Δημοσιευμένη'],
    ['kipos', 'zoi', 1, 'Σχολικός κήπος', 'Δημοσιευμένη'],
    ['ores-synergasias', 'goneis', 1, 'Ώρες συνεργασίας με τους εκπαιδευτικούς', 'Δημοσιευμένη'],
    ['syllogos-goneon', 'goneis', 4, 'Σύλλογος Γονέων και Κηδεμόνων', 'Δημοσιευμένη'],
    ['proxeiri-selida', 'goneis', 9, 'Σελίδα σε προετοιμασία', 'Πρόχειρο'],
  ];
  SEL.forEach(([id, omada, seira, titlos, katastasi]) => g.selida({ id, omada, seira, titlos, perigrafi: titlos, keimeno: 'Κείμενο της σελίδας «' + titlos + '».', fotografies: [], arxeia: [], simeiosi: '', katastasi }));
  g.palia({ id: 'wp6511', imerominia: '2025-06-18', titlos: 'Μικροί μεγάλοι εν δράσει', enotita: 'draseis', alles_enotites: 'perivallon', taxeis: 'ΣΤ', diktya: 'oikologika',
            keimeno: 'Οι μαθητές της ΣΤ΄ τάξης…\n\n- πρώτο\n- δεύτερο', fotografies: [{ id: 'drv1', perigrafi: 'Στην αυλή' }, { id: 'drv2', perigrafi: '' }], synainesi: true });
  g.palia({ id: 'wp6100', imerominia: '2024-12-20', titlos: 'Χριστουγεννιάτικη γιορτή', enotita: 'giortes', taxeis: 'Α,Β', keimeno: 'Με τραγούδια και ποιήματα.', fotografies: [{ id: 'drv3', perigrafi: '' }], synainesi: true });
  g.palia({ id: 'wp5900', imerominia: '2024-09-11', titlos: 'Αγιασμός νέας σχολικής χρονιάς', enotita: 'anakoinoseis', keimeno: 'Ο αγιασμός θα γίνει στις 9:00.', synainesi: false });
};
