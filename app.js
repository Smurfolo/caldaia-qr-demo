/* ---------------------------------------------------------------
   Data layer — DEMO ONLY.
   Everything lives in localStorage under one key. When this gets
   wired to Microsoft Dynamics, replace the functions in this file
   (getDb / saveDb / getCaldaia / assegnaCentro / registraCaldaia)
   with real API calls — nothing in index.html / caldaia.html needs
   to change, they only call these functions.
------------------------------------------------------------------ */

const DB_KEY = 'caldaie_qr_demo_v4';

const SEED = {
  centri: [
    {
      id: 'centro-rossi',
      nome: 'Rossi Termoidraulica',
      email: 'baxi.service@baxi.it',
      telefono: '0424517800',
      cap: '36061',
      comune: 'Bassano del Grappa (VI)',
      lat: 45.7669, lng: 11.7379
    },
    {
      id: 'centro-verdi',
      nome: 'Verdi Caldaie & Clima',
      email: 'baxi.service@baxi.it',
      telefono: '0424517800',
      cap: '36063',
      comune: 'Marostica (VI)',
      lat: 45.7486, lng: 11.6497
    },
    {
      id: 'centro-bianchi',
      nome: 'Bianchi Service',
      email: 'baxi.service@baxi.it',
      telefono: '0424517800',
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
    matricola, marchio: prev.marchio || 'baxi', piano_attivo: null, richiesta_piano: null, segnalazioni: [], estensioni: [], richieste_estensione: {}, stato: 'attiva',
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
  list.forEach(m => { if (!db.caldaie[m]) { db.caldaie[m] = { matricola: m, marchio, tipo: null, centro_id: null, utente: null, data_installazione: null, data_avviamento: null, interventi: [], garanzia: { attiva: false, scadenza: null }, piano_attivo: null, richiesta_piano: null, segnalazioni: [], estensioni: [], richieste_estensione: {}, stato: 'attiva' }; n++; } });
  saveDb(db); return n;
}

/* ---- v4: contatti, piani strutturati, semaforo ricambi, estensioni, installatori, bozze offline, rottamazione ---- */
const CONTATTO = { tel: '0424517800', mail: 'baxi.service@baxi.it' };
const GARANZIA_CONV_MESI = 24; // demo: durata garanzia convenzionale
const ESTENSIONE_BAXI = { nome: 'Estensione di garanzia Baxi', mesi: 36 }; // demo
SEED.centri.forEach(c => { c.estensione = { nome: 'Estensione Assistenza Plus', mesi: 24, prezzo: 190 }; });
const _p = (id, nome, servizi, man, urg, dom, ricambi, prezzo) => ({ id, nome, servizi, man, urg, dom, ricambi, prezzo });
SEED.centri[0].piani = [
  _p('p1', 'Base', [SERVIZI[0], SERVIZI[1]], 'ufficio', '48h', false, false, 89),
  _p('p2', 'Comfort', [SERVIZI[0], SERVIZI[1], SERVIZI[5]], 'libera', '48h', false, false, 149),
  _p('p3', 'Premium', SERVIZI.slice(), 'libera', 'giorno', true, true, 249)];
SEED.centri[1].piani = [_p('p1', 'Standard', [SERVIZI[0], SERVIZI[6]], 'ufficio', 'giorno', false, false, 119)];
SEED.caldaie['CH-2024-0091'].estensioni = [{ id: 'e1', tipo: 'produttore', nome: ESTENSIONE_BAXI.nome, inizio: '2026-03-15', fine: isoOff(400) }];
SEED.caldaie['AM-2022-0007'].estensioni = [{ id: 'e1', tipo: 'centro', nome: 'Estensione Assistenza Plus', inizio: '2024-10-04', fine: isoOff(300) }];
SEED.caldaie['CH-2021-0123'] = {
  matricola: 'CH-2021-0123', marchio: 'baxi', tipo: 'Baxi Luna Platinum 32', centro_id: 'centro-rossi',
  utente: { nome: 'Giulia Conti', posizione: 'Via Marconi 8, Bassano del Grappa (VI)' },
  data_installazione: '2021-02-10', data_avviamento: '2021-02-12',
  interventi: [{ data: isoOff(-420), tipo: 'Manutenzione ordinaria', tecnico: 'Marco Neri' }],
  garanzia: { attiva: false, scadenza: null }, piano_attivo: null, richiesta_piano: null, segnalazioni: [],
  estensioni: [{ id: 'e1', tipo: 'centro', nome: 'Estensione Assistenza Plus', inizio: '2023-02-12', fine: isoOff(100) }],
  prima_accensione: { installatore: { ragione: 'Termo Installazioni Bianchi', referente: 'Paolo Bianchi', email: CONTATTO.mail, telefono: CONTATTO.tel, piva: '01234567890' }, conformita: true, foto: [], firma: null, data: '2021-02-12' }
};
Object.values(SEED.caldaie).forEach(c => { c.estensioni = c.estensioni || []; c.richieste_estensione = c.richieste_estensione || {}; c.stato = c.stato || 'attiva'; });
SEED.installatori = [{ id: 'i1', ragione: 'Termo Installazioni Bianchi', referente: 'Paolo Bianchi', email: CONTATTO.mail, telefono: CONTATTO.tel, piva: '01234567890', centri: ['centro-rossi'] }];

function descrPiano(p) {
  return [`Manutenzione ordinaria: ${p.man === 'libera' ? "all'orario scelto da te" : "in orari d'ufficio"}`, `Urgenze: ${p.urg === 'giorno' ? 'intervento in giornata' : 'entro 48 ore'}`, `Urgenze anche di domenica (inverno): ${p.dom ? 'sì' : 'no'}`, `Ricambi gratuiti anche dopo la garanzia: ${p.ricambi ? 'sì' : 'no'}`];
}
function valutaPiano(p, q) {
  const n = [];
  if (q.man === 'libera' && p.man !== 'libera') n.push("manutenzione all'orario che vuoi");
  if (q.urg === 'giorno' && p.urg !== 'giorno') n.push('urgenze in giornata');
  if (q.dom && !p.dom) n.push('domenica in inverno');
  if (q.ricambi && !p.ricambi) n.push('ricambi gratuiti dopo la garanzia');
  return { mancanti: n, ok: 4 - n.length };
}
function ordinaPiani(piani, q) { return piani.map(p => ({ p, v: valutaPiano(p, q) })).sort((a, b) => b.v.ok - a.v.ok || ((a.p.prezzo || 1e9) - (b.p.prezzo || 1e9))); }

function coperturaRicambi(c) {
  if (!c.data_avviamento) return { cls: 'none', titolo: 'Garanzia non ancora attiva', dettaglio: 'La copertura parte dal primo avviamento.' };
  const gc = addMonths(c.data_avviamento, GARANZIA_CONV_MESI), pm = prossimaManutenzione(c), manG = pm ? giorniA(pm) : 999;
  if (giorniA(gc) >= 0) return { cls: 'ok', titolo: 'Ricambi gratuiti', dettaglio: `Garanzia convenzionale attiva fino al ${formatData(gc)}.` };
  const valide = (c.estensioni || []).filter(e => giorniA(e.fine) >= 0 && giorniA(e.inizio) <= 0);
  if (valide.length) {
    const e = valide[0], lab = e.tipo === 'produttore' ? 'Estensione Baxi' : 'Estensione del centro';
    if (manG < 0) return { cls: 'bad', titolo: 'Ricambi a pagamento', dettaglio: `${lab} scaduta per manutenzione non effettuata.` };
    if (manG <= 60) return { cls: 'warn', titolo: 'Ricambi gratuiti, ma a rischio', dettaglio: `${lab} attiva fino al ${formatData(e.fine)}. Esegui la manutenzione entro il ${formatData(pm)} per non perdere la copertura.` };
    return { cls: 'ok', titolo: 'Ricambi gratuiti', dettaglio: `${lab} attiva fino al ${formatData(e.fine)}.` };
  }
  return { cls: 'bad', titolo: 'Ricambi a pagamento', dettaglio: (c.estensioni || []).length ? 'Garanzia convenzionale ed estensione terminate.' : 'Garanzia convenzionale terminata e nessuna estensione attiva.' };
}
function semaforoHtml(c) {
  const s = coperturaRicambi(c), lamp = (k) => `<span class="lamp ${k} ${s.cls === k ? 'on' : ''}"></span>`;
  return `<div class="card semaforo ${s.cls}"><div class="lamps">${lamp('bad')}${lamp('warn')}${lamp('ok')}</div><div><h2 style="margin-bottom:4px">${s.titolo}</h2><p class="lede" style="margin:0">${s.dettaglio}</p></div></div>`;
}
function scadenzeHtml(c) {
  const pm = prossimaManutenzione(c), sm = statoScadenza(pm); if (!sm) return '';
  const valide = (c.estensioni || []).filter(e => giorniA(e.fine) >= 0 && giorniA(e.inizio) <= 0); let avviso = '';
  if (valide.length && sm.giorni < 0) avviso = `<div class="alert bad"><strong>Estensione scaduta per manutenzione non effettuata.</strong> La manutenzione annuale è in ritardo: la copertura dell'estensione è decaduta e i ricambi non sono più gratuiti.</div>`;
  else if (valide.length && sm.giorni <= 60) avviso = `<div class="alert warn"><strong>Attenzione:</strong> se la manutenzione non viene eseguita entro il ${formatData(pm)}, l'estensione di garanzia scade e i ricambi non saranno più gratuiti.</div>`;
  const ext = (c.estensioni || []).map(e => { const s = statoScadenza(e.fine); return `<div class="data-row"><span class="k">${e.tipo === 'produttore' ? 'Estensione Baxi' : 'Estensione del centro'}</span><span class="v">${formatData(e.fine)}<br><span class="chip ${s.cls}">${s.testo}</span></span></div>`; }).join('');
  return `<div class="card"><h2>Scadenze</h2><div class="data-row"><span class="k">Prossima manutenzione</span><span class="v">${formatData(pm)}<br><span class="chip ${sm.cls}">${sm.testo}</span></span></div>${ext}${avviso}</div>`;
}
function richiediPiano(m, id, prefs) { mutaCaldaia(m, c => { c.richiesta_piano = { piano_id: id, data: isoOff(0), prefs: prefs || null }; }); }
function richiediEstensione(m, tipo) { mutaCaldaia(m, c => { c.richieste_estensione = c.richieste_estensione || {}; c.richieste_estensione[tipo] = { data: isoOff(0) }; }); }
function aggiungiEstensione(m, e) { mutaCaldaia(m, c => { (c.estensioni = c.estensioni || []).push({ id: 'e' + Date.now(), ...e }); }); }
function risolviEstensione(m, tipo, accetta) {
  mutaCaldaia(m, c => {
    const r = (c.richieste_estensione || {})[tipo]; if (!r) return;
    if (accetta) {
      const cen = getCentro(c.centro_id), es = cen.estensione || {}, mesi = tipo === 'produttore' ? ESTENSIONE_BAXI.mesi : (es.mesi || 24);
      const gc = addMonths(c.data_avviamento || isoOff(0), GARANZIA_CONV_MESI), inizio = giorniA(gc) > 0 ? gc : isoOff(0);
      (c.estensioni = c.estensioni || []).push({ id: 'e' + Date.now(), tipo, nome: tipo === 'produttore' ? ESTENSIONE_BAXI.nome : es.nome, inizio, fine: addMonths(inizio, mesi) });
    }
    delete c.richieste_estensione[tipo];
  });
}
function rottama(m, info) { mutaCaldaia(m, c => { c.stato = 'rottamata'; c.rottamazione = { data: isoOff(0), ...info }; }); if (info.tipo === 'baxi' && info.matricola) registraMatricole([info.matricola], 'baxi'); }
function upsertInstallatore(i, centroId) {
  const db = getDb(); db.installatori = db.installatori || [];
  let x = db.installatori.find(y => y.piva && y.piva === i.piva);
  if (!x) { x = { id: 'i' + Date.now(), centri: [] }; db.installatori.push(x); }
  Object.assign(x, { ragione: i.ragione, referente: i.referente, email: i.email, telefono: i.telefono, piva: i.piva });
  if (!x.centri.includes(centroId)) x.centri.push(centroId);
  saveDb(db);
}
function completaPrimaAccensione(m, p) {
  registraPrimaAccensione(m, { nomeCliente: p.nomeCliente, posizione: p.posizione, tipo: p.tipo, dataInstallazione: p.dataInstallazione, dataAvviamento: p.dataAvviamento, centro_id: p.centro_id });
  mutaCaldaia(m, c => { c.prima_accensione = { installatore: p.installatore, conformita: true, foto: p.foto || [], firma: p.firma, data: p.dataAvviamento, consenso: { privacy: true, marketing: !!p.marketing } }; });
  upsertInstallatore(p.installatore, p.centro_id);
}
const BOZZE_KEY = 'caldaia_bozze_v1';
function getBozze() { try { return JSON.parse(localStorage.getItem(BOZZE_KEY) || '[]'); } catch (e) { return []; } }
function saveBozze(l) { try { localStorage.setItem(BOZZE_KEY, JSON.stringify(l)); return true; } catch (e) { return false; } }
function isOffline() { return sessionStorage.getItem('caldaia_sim_offline') === '1' || navigator.onLine === false; }
