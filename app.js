/* ---------------------------------------------------------------
   Data layer — DEMO ONLY.
   Everything lives in localStorage under one key. When this gets
   wired to Microsoft Dynamics, replace the functions in this file
   (getDb / saveDb / getCaldaia / assegnaCentro / registraCaldaia)
   with real API calls — nothing in index.html / caldaia.html needs
   to change, they only call these functions.
------------------------------------------------------------------ */

const DB_KEY = 'caldaie_qr_demo_v1';

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
    return structuredClone(SEED);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED));
    return structuredClone(SEED);
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
  db.caldaie[matricola] = {
    matricola,
    tipo: dati.tipo,
    centro_id: dati.centro_id,
    utente: { nome: dati.nomeCliente, posizione: dati.posizione },
    data_installazione: dati.dataInstallazione,
    data_avviamento: dati.dataAvviamento,
    interventi: [],
    garanzia: { attiva: false, scadenza: null }
  };
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
