/* ---------------------------------------------------------------
   Data layer — DEMO ONLY.
   Everything lives in localStorage under one key. When this gets
   wired to Microsoft Dynamics, replace the functions in this file
   (getDb / saveDb / getCaldaia / assegnaCentro / registraCaldaia)
   with real API calls — nothing in index.html / caldaia.html needs
   to change, they only call these functions.
------------------------------------------------------------------ */

const DB_KEY = 'caldaie_qr_demo_v3';

const SEED = {
  centri: [
    {
      id: 'centro-rossi',
      nome: 'Rossi Termoidraulica',
      email: 'assistenza@rossitermoidraulica.it',
      telefono: '+39 0424 123 456',
      cap: '36061',
      comune: 'Bassano del Grappa (VI)',
      lat: 45.7669, lng: 11.7379
    },
    {
      id: 'centro-verdi',
      nome: 'Verdi Caldaie & Clima',
      email: 'info@verdicaldaieclima.it',
      telefono: '+39 0424 654 321',
      cap: '36063',
      comune: 'Marostica (VI)',
      lat: 45.7486, lng: 11.6497
    },
    {
      id: 'centro-bianchi',
      nome: 'Bianchi Service',
      email: 'supporto@bianchiservice.it',
      telefono: '+39 0444 987 654',
      cap: '36100',
      comune: 'Vicenza (VI)',
      lat: 45.5469, lng: 11.5464
    }
  ],
  tecnici: [
    { centro_id: 'centro-rossi', nome: 'Luca Rossi' },
    { centro_id: 'centro-verdi', nome: 'Elena Verdi' }
  ],
  caldaie: {
    'CH-2024-0091': {
      matricola: 'CH-2024-0091',
      tipo: 'Baxi Luna Duo-Tec 28 kW',
      centro_id: 'centro-rossi',
      utente: { nome: 'Mario Bianchi', posizione: 'Via Roma 12, Bassano del Grappa (VI)' },
      data_installazione: '2024-03-14',
      data_avviamento: '2024-03-15',
      interventi: [
        { data: '2024-11-02', tipo: 'Manutenzione ordinaria', tecnico: 'Luca Rossi' },
        { data: '2025-11-05', tipo: 'Controllo fumi', tecnico: 'Luca Rossi' }
      ],
      garanzia: { attiva: true, scadenza: '2029-03-15' }
    },
    'CH-2023-0044': {
      matricola: 'CH-2023-0044',
      tipo: 'Vaillant ecoTEC plus',
      centro_id: null,
      utente: null,
      data_installazione: null,
      data_avviamento: null,
      interventi: [],
      garanzia: { attiva: false, scadenza: null }
    }
  }
};

function getDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED));
    return JSON.parse(JSON.stringify(SEED));
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED));
    return JSON.parse(JSON.stringify(SEED));
  }
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDb() {
  localStorage.setItem(DB_KEY, JSON.stringify(SEED));
}

function getCentro(centroId) {
  const db = getDb();
  return db.centri.find(c => c.id === centroId) || null;
}

function getCaldaia(matricola) {
  const db = getDb();
  return db.caldaie[matricola] || null;
}

function elencoCentriOrdinatiPerVicinanza(cap) {
  const db = getDb();
  // Demo: stessi primi 2 numeri di CAP = "vicino". Non è geografia vera,
  // ma abbastanza per far vedere la logica prima di collegare Dynamics.
  const prefix = (cap || '').slice(0, 2);
  return [...db.centri].sort((a, b) => {
    const aMatch = a.cap.slice(0, 2) === prefix ? 0 : 1;
    const bMatch = b.cap.slice(0, 2) === prefix ? 0 : 1;
    return aMatch - bMatch;
  });
}

function distanzaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function elencoCentriPerPosizione(lat, lng) {
  const db = getDb();
  return [...db.centri]
    .map(c => ({ ...c, distanza: distanzaKm(lat, lng, c.lat, c.lng) }))
    .sort((a, b) => a.distanza - b.distanza);
}

function collegaCentro(matricola, centroId) {
  const db = getDb();
  if (!db.caldaie[matricola]) return;
  db.caldaie[matricola].centro_id = centroId;
  saveDb(db);
}

function registraPrimaAccensione(matricola, dati) {
  const db = getDb();
  const prev = db.caldaie[matricola] || {};
  db.caldaie[matricola] = {
    matricola, marchio: prev.marchio || 'baxi', piano_attivo: null, richiesta_piano: null, segnalazioni: [],
    tipo: dati.tipo,
    centro_id: dati.centro_id,
    utente: { nome: dati.nomeCliente, posizione: dati.posizione },
    data_installazione: dati.dataInstallazione,
    data_avviamento: dati.dataAvviamento,
    interventi: [],
    garanzia: { attiva: false, scadenza: null }
  };
  (db.richieste_avvio || []).filter(r => r.matricola === matricola && r.stato === 'accettata').forEach(r => { r.stato = 'completata'; });
  saveDb(db);
}

function aggiungiIntervento(matricola, intervento) {
  const db = getDb();
  if (!db.caldaie[matricola]) return;
  db.caldaie[matricola].interventi.push(intervento);
  saveDb(db);
}

function formatData(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ---- v2: marchi, ruoli, piani manutenzione, alberi guasto (DEMO) ---- */
const BRANDS = { baxi: { nome: 'Baxi', page: 'caldaia.html' }, altro: { nome: 'Altro marchio', page: 'altro-marchio.html' } };
const SERVIZI = ['Manutenzione annuale ordinaria', 'Analisi fumi', 'Pronto intervento 7/7', 'Ricambi inclusi (no elettronica)', 'Linea telefonica prioritaria', 'Pulizia scambiatore', 'Verifica sicurezza e taratura'];
const TEMPI = ['4 ore', '24 ore', '48 ore', '72 ore', '5 giorni lavorativi'];
SEED.tecnici = [
  { id: 't1', nome: 'Luca Rossi', centro_id: 'centro-rossi', ruolo: 'master' },
  { id: 't2', nome: 'Marco Neri', centro_id: 'centro-rossi', ruolo: 'tecnico' },
  { id: 't3', nome: 'Elena Verdi', centro_id: 'centro-verdi', ruolo: 'master' }
];
SEED.centri[0].piani = [
  { id: 'p1', nome: 'Base', servizi: [SERVIZI[0], SERVIZI[1]], tempo: '72 ore', prezzo: 89 },
  { id: 'p2', nome: 'Comfort', servizi: [SERVIZI[0], SERVIZI[1], SERVIZI[5], SERVIZI[4]], tempo: '48 ore', prezzo: 149 },
  { id: 'p3', nome: 'Premium', servizi: SERVIZI.slice(), tempo: '4 ore', prezzo: 249 }
];
SEED.centri[1].piani = [{ id: 'p1', nome: 'Standard', servizi: [SERVIZI[0], SERVIZI[6]], tempo: '24 ore', prezzo: 119 }];
SEED.centri[2].piani = [];
Object.values(SEED.caldaie).forEach(c => Object.assign(c, { marchio: 'baxi', piano_attivo: null, richiesta_piano: null, segnalazioni: [] }));
SEED.caldaie['AM-2022-0007'] = {
  matricola: 'AM-2022-0007', marchio: 'altro', tipo: 'Marca X Condens 24', centro_id: 'centro-verdi',
  utente: { nome: 'Anna Ferrari', posizione: 'Via Garibaldi 5, Marostica (VI)' },
  data_installazione: '2022-10-03', data_avviamento: '2022-10-04',
  interventi: [], garanzia: { attiva: false, scadenza: null }, piano_attivo: null, richiesta_piano: null, segnalazioni: []
};
const ALBERI = {
  E10: { nome: 'Pressione acqua bassa', start: 'q1', n: {
    q1: { t: 'Il manometro indica meno di 0,8 bar?', si: 'q2', no: 'tec' },
    q2: { t: 'Hai un rubinetto di carico accessibile sotto la caldaia?', si: 'a1', no: 'tec' },
    a1: { t: 'Apri lentamente il rubinetto fino a 1–1,5 bar (a freddo), richiudilo e premi reset. Il codice è sparito?', si: 'ok', no: 'tec' } } },
  E01: { nome: 'Mancata accensione / blocco', start: 'q0', n: {
    q0: { t: 'Senti odore di gas?', si: 'gas', no: 'q1' },
    q1: { t: 'Il rubinetto del gas è aperto (leva parallela al tubo)?', si: 'q2', no: 'a0' },
    a0: { t: 'Aprilo, poi premi reset una volta. La caldaia riparte?', si: 'ok', no: 'tec' },
    q2: { t: 'Premi reset una volta e attendi 2 minuti. La caldaia riparte?', si: 'ok', no: 'tec' } } },
  E02: { nome: 'Sovratemperatura', start: 'q1', n: {
    q1: { t: 'Alcuni radiatori sono aperti (valvole non tutte chiuse)?', si: 'a2', no: 'a1' },
    a1: { t: 'Apri alcune valvole, attendi che la caldaia si raffreddi e premi reset. Riparte?', si: 'ok', no: 'tec' },
    a2: { t: 'Attendi 10 minuti che si raffreddi e premi reset. Riparte?', si: 'ok', no: 'tec' } } }
};
function mutaCaldaia(m, fn) { const db = getDb(); if (db.caldaie[m]) { fn(db.caldaie[m]); saveDb(db); } }
function richiediPiano(m, id) { mutaCaldaia(m, c => { c.richiesta_piano = { piano_id: id, data: new Date().toISOString().slice(0, 10) }; }); }
function aggiungiSegnalazione(m, s) { mutaCaldaia(m, c => { (c.segnalazioni = c.segnalazioni || []).push({ data: new Date().toISOString().slice(0, 10), ...s }); }); }
function salvaPiani(centroId, piani) { const db = getDb(); db.centri.find(c => c.id === centroId).piani = piani; saveDb(db); }

/* ---- v3: richieste avviamento, scadenze, matricole censite ---- */
SEED.richieste_avvio = [];
const GIORNO = 864e5;
const isoOff = g => new Date(Date.now() + g * GIORNO).toISOString().slice(0, 10);
SEED.caldaie['CH-2024-0091'].interventi[1].data = isoOff(-350);
Object.assign(SEED.caldaie['AM-2022-0007'], { interventi: [{ data: isoOff(-200), tipo: 'Manutenzione ordinaria', tecnico: 'Elena Verdi' }], garanzia: { attiva: true, scadenza: isoOff(40) } });
function addMonths(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }
function giorniA(iso) { return Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / GIORNO); }
function prossimaManutenzione(c) { const ref = (c.interventi || []).map(i => i.data).sort().pop() || c.data_avviamento; return ref ? addMonths(ref, 12) : null; }
function statoScadenza(iso) {
  if (!iso) return null; const g = giorniA(iso);
  return { data: iso, giorni: g, cls: g <= 60 ? 'warn' : 'ok', testo: g < 0 ? `scaduta da ${-g} giorni` : g === 0 ? 'scade oggi' : `tra ${g} giorni` };
}
function creaRichiestaAvvio(r) { const db = getDb(); db.richieste_avvio = db.richieste_avvio || []; const x = { id: 'r' + Date.now(), data: new Date().toISOString().slice(0, 10), stato: 'in attesa', ...r }; db.richieste_avvio.push(x); saveDb(db); return x; }
function richiestaPerMatricola(m) { const l = (getDb().richieste_avvio || []).filter(r => r.matricola === m); return l.length ? l[l.length - 1] : null; }
function aggiornaRichiesta(id, stato) { const db = getDb(), r = (db.richieste_avvio || []).find(x => x.id === id); if (r) { r.stato = stato; saveDb(db); } }
function registraMatricole(list, marchio) {
  const db = getDb(); let n = 0;
  list.forEach(m => { if (!db.caldaie[m]) { db.caldaie[m] = { matricola: m, marchio, tipo: null, centro_id: null, utente: null, data_installazione: null, data_avviamento: null, interventi: [], garanzia: { attiva: false, scadenza: null }, piano_attivo: null, richiesta_piano: null, segnalazioni: [] }; n++; } });
  saveDb(db); return n;
}
