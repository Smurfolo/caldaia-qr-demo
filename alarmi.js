/* Alberi di risoluzione per la caldaia Baxi Luna Classic (contenuti forniti dal committente).
   Tre famiglie di codici: H = anomalie temporanee, E = anomalie permanenti, A = avvisi predittivi.
   Prima del codice l'app mostra sempre il messaggio standard della famiglia. */
const ALLARMI_LUNA = (function () {
  const msg = {
    H: { cls: 'warn', titolo: 'Anomalia temporanea rilevata', testo: [
      'La caldaia può continuare a funzionare regolarmente. Nella maggior parte dei casi questa anomalia si risolve automaticamente al ripristino delle normali condizioni di funzionamento.',
      'Si consiglia di annotare il codice visualizzato e di contattare il Centro Assistenza per una valutazione dell\'evento e l\'eventuale pianificazione di un controllo tecnico.'] },
    E: { cls: 'bad', titolo: 'Anomalia permanente rilevata', testo: [
      'La caldaia ha rilevato una condizione che richiede l\'intervento del Centro Assistenza.',
      'Annotare il codice visualizzato e contattare il prima possibile il Centro Assistenza autorizzato comunicando il codice dell\'anomalia.'] },
    A: { cls: 'info', titolo: 'Avvertimento di funzionamento', testo: [
      'La caldaia continua a funzionare regolarmente, ma è stata rilevata una condizione che potrebbe generare un\'anomalia futura.',
      'Si consiglia di contattare il Centro Assistenza autorizzato quanto prima, comunicando il codice visualizzato, per pianificare un controllo preventivo.'] }
  };
  const video = { VIDEO_01: 'Controllo e caricamento pressione impianto', VIDEO_02: 'Ciclo di deaerazione', VIDEO_03: 'Controllo alimentazione gas', VIDEO_04: 'Controllo aspirazione aria', VIDEO_05: 'Procedura RESET', VIDEO_06: 'Riavvio elettrico e RESET' };
  const PERSISTE = 'Se persiste contattare il Centro Assistenza';
  const RAD = { verifica: 'I termosifoni sono aperti? Le valvole dell\'impianto sono aperte?', azione: ['Verificare apertura radiatori e valvole', 'Verificare pressione impianto', 'Attivare ciclo di deaerazione'], video: ['VIDEO_01', 'VIDEO_02'], esito: PERSISTE };
  const GAS = { verifica: 'Contatore aperto? Rubinetto gas aperto? Griglie aspirazione pulite?', azione: ['Verificare alimentazione gas', 'Pulire eventuali griglie di aspirazione'], video: ['VIDEO_03', 'VIDEO_04'], esito: PERSISTE };
  const RAD2 = { verifica: 'Radiatori aperti? Valvole impianto aperte?', azione: ['Verificare apertura radiatori e valvole', 'Attivare ciclo di deaerazione', 'Eseguire RESET'], video: ['VIDEO_02', 'VIDEO_05'], esito: PERSISTE };
  const ELETTRICO = { verifica: null, azione: ['Togliere alimentazione elettrica dall\'interruttore a muro o dal quadro generale', 'Ridare alimentazione ed eseguire RESET'], video: ['VIDEO_06'], esito: PERSISTE };
  const PRESS = { verifica: 'La pressione è compresa nel valore corretto?', azione: ['Ripristinare la pressione impianto'], video: ['VIDEO_01'], esito: PERSISTE };
  // [codice, descrizione, guida|null]
  const righe = [
    ['H.01.05', 'Raggiunto valore massimo delta temperatura tra mandata e ritorno', RAD], ['H.01.08', 'Aumento temperatura mandata troppo rapido in riscaldamento', RAD],
    ['H.01.14', 'Raggiunto valore massimo di temperatura di mandata o ritorno', RAD], ['H.01.18', 'Mancanza circolazione acqua (temporanea)', RAD],
    ['H.01.21', 'Aumento temperatura di mandata durante funzionamento sanitario', RAD],
    ['H.02.00', 'Reset in corso', { verifica: null, azione: ['Attendere il completamento del reset'], video: [], esito: 'Se il messaggio permane contattare il Centro Assistenza' }],
    ['H.02.07', 'Pressione circuito di riscaldamento bassa', PRESS],
    ['H.03.02', 'Perdita fiamma temporanea', GAS], ['H.03.54', 'Perdita temporanea di fiamma per bassa tensione', GAS],
    ['E.01.04', 'Perdita di fiamma rilevata per 5 volte in 24 ore', { verifica: 'Contatore aperto? Rubinetto gas aperto? Aspirazione aria libera?', azione: ['Verificare alimentazione gas', 'Verificare aspirazione aria', 'Eseguire RESET'], video: ['VIDEO_03', 'VIDEO_04', 'VIDEO_05'], esito: PERSISTE }],
    ['E.01.17', 'Mancanza circolazione acqua (permanente)', { verifica: 'Radiatori aperti? Valvole impianto aperte?', azione: ['Verificare pressione impianto', 'Attivare ciclo di deaerazione', 'Eseguire RESET'], video: ['VIDEO_01', 'VIDEO_02', 'VIDEO_05'], esito: PERSISTE }],
    ['E.04.03', 'Superamento temperatura massima mandata', RAD2], ['E.04.08', 'Raggiunta temperatura massima di sicurezza', RAD2],
    ['E.04.13', 'Ventilatore bloccato o superamento numero giri massimo', { verifica: 'Le griglie di aspirazione sono pulite e libere?', azione: ['Verificare e pulire eventuali griglie di aspirazione accessibili', 'Eseguire RESET'], video: ['VIDEO_04'], esito: PERSISTE }],
    ['E.04.23', 'Blocco interno di comunicazione', ELETTRICO], ['E.04.29', 'Blocco interno di comunicazione', ELETTRICO],
    ['A.02.06', 'Pressione circuito riscaldamento bassa', { verifica: 'La pressione è inferiore al valore corretto?', azione: ['Ripristinare la pressione impianto'], video: ['VIDEO_01'], esito: PERSISTE }],
    // solo messaggio standard (nessuna procedura guidata)
    ['H.00.42', 'Sensore pressione aperto o guasto'], ['H.01.00', 'Mancata comunicazione temporanea interna alla scheda'], ['H.02.02', 'Attesa inserimento parametri configurazione'],
    ['H.02.03', 'Parametri configurazione inseriti non correttamente'], ['H.02.04', 'Parametri di configurazione illeggibili'], ['H.02.05', 'Memoria parametri non compatibile'],
    ['H.02.09', 'Blocco parziale caldaia'], ['H.02.10', 'Blocco totale caldaia'], ['H.02.70', 'Test recupero calore unità esterna fallito'],
    ['H.03.00', 'Mancata identificazione parte sicurezza'], ['H.03.05', 'Tensione elettrica troppo bassa'],
    ['E.00.04', 'Sensore temperatura ritorno non connesso'], ['E.00.05', 'Sensore temperatura ritorno in corto circuito'], ['E.00.16', 'Sensore temperatura bollitore ACS non connesso'],
    ['E.00.17', 'Sensore temperatura bollitore ACS in corto circuito'], ['E.00.20', 'Sensore fumi non connesso'], ['E.00.21', 'Sensore fumi in corto circuito'],
    ['E.01.12', 'Temperatura ritorno maggiore della mandata'], ['E.01.20', 'Raggiunto valore massimo temperatura fumi'], ['E.02.13', 'Blocco totale caldaia'],
    ['E.02.17', 'Mancata comunicazione permanente interna alla scheda'], ['E.02.35', 'Dispositivo critico di sicurezza disconnesso'], ['E.02.39', 'Pressione minima non raggiunta al termine del riempimento'],
    ['E.02.47', 'Connessione con dispositivo esterno non riuscita'], ['E.04.01', 'Sensore temperatura mandata in corto circuito'], ['E.04.02', 'Sensore temperatura mandata non connesso'],
    ['E.04.17', 'Guasto circuito comando valvola gas'], ['E.04.18', 'Temperatura mandata inferiore alla minima consentita o sensore scollegato'], ['E.04.254', 'Anomalia circuito comando valvola gas'],
    ['A.00.28', 'Sensore temperatura solare rimosso o fuori campo di misura'], ['A.00.29', 'Sensore temperatura solare in corto circuito'], ['A.00.34', 'Sonda temperatura esterna prevista ma non rilevata'],
    ['A.02.36', 'Dispositivo funzionale disconnesso'], ['A.02.37', 'Dispositivo funzionale passivo disconnesso'], ['A.02.45', 'Errore sulla connessione'], ['A.02.46', 'Errore sulla priorità del dispositivo'],
    ['A.02.48', 'Errore di configurazione funzione dell\'unità'], ['A.02.49', 'Inizializzazione nodo fallita'], ['A.02.54', 'Errore alimentazione bus OpenTherm'],
    ['A.02.55', 'Numero di serie errato o mancante'], ['A.02.76', 'Memoria interna piena']
  ];
  const codici = righe.map(r => ({ c: r[0], d: r[1], t: r[0][0], guida: r[2] || null }));
  const byCode = {}; codici.forEach(x => { byCode[x.c] = x; });
  const nomi = { H: 'Allarme H — Anomalie temporanee', E: 'Allarme E — Anomalie permanenti', A: 'Allarme A — Avvisi predittivi' };
  return { msg, video, codici, byCode, nomi };
})();

/* ---- Luna Century ---- */
const ALLARMI_CENTURY = (function () {
  const msg = {
    H: { cls: 'warn', titolo: 'Anomalia temporanea rilevata', testo: [
      'La caldaia può continuare a funzionare regolarmente. Nella maggior parte dei casi questa anomalia si risolve automaticamente al ripristino delle normali condizioni di funzionamento.',
      'Si consiglia di annotare il codice visualizzato e contattare il Centro Assistenza per la valutazione dell\'evento e l\'eventuale pianificazione di un controllo tecnico.'] },
    E: { cls: 'bad', titolo: 'Anomalia permanente rilevata', testo: [
      'La caldaia ha rilevato una condizione che ne impedisce il corretto funzionamento.',
      'Annotare il codice visualizzato e contattare il prima possibile il Centro Assistenza autorizzato comunicando il codice dell\'anomalia.'] },
    A: { cls: 'info', titolo: 'Avvertimento di funzionamento', testo: [
      'La caldaia continua a funzionare regolarmente, ma è stata rilevata una condizione che potrebbe generare un\'anomalia futura.',
      'Si consiglia di contattare il Centro Assistenza autorizzato comunicando il codice visualizzato per pianificare un controllo preventivo.'] }
  };
  const video = { VIDEO_01: 'Controllo e ripristino pressione impianto', VIDEO_02: 'Attivazione ciclo di deaerazione', VIDEO_03: 'Controllo contatore e rubinetti gas', VIDEO_04: 'Verifica e pulizia prese aria e griglie di aspirazione', VIDEO_05: 'Procedura di RESET della caldaia' };
  const P = 'Se persiste contattare il Centro Assistenza', RV = 'I radiatori sono aperti? Eventuali valvole di intercettazione impianto sono aperte?';
  const RAD = { verifica: RV, azione: ['Verificare apertura radiatori e valvole', 'Verificare pressione impianto', 'Attivare il ciclo di deaerazione'], video: ['VIDEO_01', 'VIDEO_02'], esito: P };
  const GASV = 'Il contatore gas è aperto? Il rubinetto gas è aperto? Le griglie di aspirazione sono libere?';
  const GASR = { verifica: GASV, azione: ['Verificare alimentazione gas', 'Verificare aspirazione aria', 'Eseguire RESET'], video: ['VIDEO_03', 'VIDEO_04', 'VIDEO_05'], esito: P };
  const righe = [
    ['A02.06', 'Pressione circuito di riscaldamento bassa', { verifica: 'La pressione indicata sul display è inferiore al valore corretto?', azione: ['Ripristinare la pressione dell\'impianto'], video: ['VIDEO_01'], esito: P }],
    ['H00.42', 'Sensore pressione aperto/guasto o pressione troppo elevata', { verifica: 'La pressione visualizzata è corretta?', azione: ['Verificare la pressione dell\'impianto', 'Se fuori range ripristinare il valore corretto'], video: ['VIDEO_01'], esito: P }],
    ['H01.05', 'Raggiunto valore massimo delta temperatura tra mandata e ritorno', RAD], ['H01.08', 'Aumento temperatura di mandata troppo rapido in riscaldamento', RAD],
    ['H01.14', 'Raggiunto valore massimo di temperatura di mandata o ritorno', RAD], ['H01.18', 'Mancanza circolazione acqua (temporanea)', RAD],
    ['H01.21', 'Aumento temperatura di mandata troppo rapido durante il funzionamento sanitario', RAD],
    ['H02.00', 'Reset in corso', { verifica: null, azione: ['Attendere il completamento della procedura di reset'], video: [], esito: 'Se il messaggio permane contattare il Centro Assistenza' }],
    ['H02.07', 'Pressione circuito di riscaldamento bassa', { verifica: 'La pressione è inferiore al valore corretto?', azione: ['Ripristinare la pressione dell\'impianto', 'Attivare il ciclo di deaerazione se necessario'], video: ['VIDEO_01', 'VIDEO_02'], esito: P }],
    ['H02.31', 'Richiesta di riempimento automatico impianto', { verifica: 'Nessuna azione richiesta all\'utilizzatore.', azione: ['Attendere il completamento della procedura automatica'], video: [], esito: P }],
    ['H03.02', 'Perdita temporanea della fiamma', { verifica: 'Il contatore gas è aperto? Il rubinetto gas sotto la caldaia è aperto? Le griglie di aspirazione sono libere?', azione: ['Verificare alimentazione gas', 'Verificare apertura rubinetti', 'Verificare e pulire eventuali griglie di aspirazione accessibili'], video: ['VIDEO_03', 'VIDEO_04'], esito: P }],
    ['E01.17', 'Mancanza circolazione acqua (permanente)', { verifica: RV, azione: ['Verificare pressione impianto', 'Attivare ciclo di deaerazione', 'Eseguire RESET'], video: ['VIDEO_01', 'VIDEO_02', 'VIDEO_05'], esito: P }],
    ['E04.03', 'Superata la temperatura massima di mandata', { verifica: RV, azione: ['Verificare apertura radiatori e valvole', 'Attivare il ciclo di deaerazione', 'Eseguire RESET'], video: ['VIDEO_02', 'VIDEO_05'], esito: P }],
    ['E04.10', 'Accensione del bruciatore fallita dopo 5 tentativi', GASR], ['E04.14', 'Anomalia combustione', GASR],
    ['E04.15', 'Anomalia scarico fumi bloccato', { verifica: 'Le prese aria risultano libere da ostruzioni visibili?', azione: ['Verificare visivamente che le prese aria non siano ostruite', 'Eseguire RESET'], video: ['VIDEO_04', 'VIDEO_05'], esito: P }],
    ['E04.23', 'Blocco interno di comunicazione', { verifica: null, azione: ['Eseguire RESET'], video: ['VIDEO_05'], esito: P }],
    ['E04.25', 'Errore perdita fiamma durante tempo di sicurezza', GASR], ['E04.26', 'Errore accensione', GASR], ['E04.27', 'Errore valvola gas aperta con rilevazione fiamma', GASR],
    ['H00.81', 'Sensore di temperatura ambiente mancante'], ['H01.00', 'Mancata comunicazione temporanea interna alla scheda'], ['H01.09', 'Pressostato gas'], ['H01.26', 'Superamento della pressione del gas'],
    ['H02.02', 'Attesa inserimento parametri di configurazione (CN1, CN2)'], ['H02.03', 'Parametri di configurazione inseriti non correttamente'], ['H02.04', 'Parametri di scheda illeggibili'],
    ['H02.05', 'Memoria parametri non compatibile con il tipo di scheda'], ['H02.12', 'Anomalia su ingresso blocco caldaia RL (release)'], ['H02.38', 'Massimo numero di riempimenti automatici raggiunto'],
    ['H02.70', 'Test di recupero calore unità esterna fallito'], ['H02.91', 'La richiesta di riscaldamento è bloccata dall\'ingresso multifunzione'], ['H02.92', 'La richiesta di acqua calda sanitaria è bloccata dall\'ingresso multifunzione'],
    ['H02.93', 'Le richieste di riscaldamento e acqua calda sanitaria sono bloccate dall\'ingresso multifunzione'], ['H03.00', 'Mancata identificazione parte di sicurezza della caldaia'], ['H03.01', 'Mancata comunicazione software di comfort'],
    ['H03.05', 'Blocco interno'], ['H03.08', 'Falsa fiamma'], ['H03.09', 'Tensione bassa'], ['H03.17', 'Anomalia sistema controllo gas'], ['H03.26', 'Richiesta calibrazione caldaia'], ['H03.28', 'Errore di sincronizzazione'],
    ['H03.31', 'Anomalia camino ostruito'], ['H03.45', 'Regolazione relativa alla messa a punto manuale del lambda disabilitata'], ['H03.54', 'Anomalia sconosciuta'], ['H03.254', 'Anomalia sconosciuta'],
    ['H08.07', 'Pompa in errore'], ['H08.09', 'Mancata comunicazione tra scheda caldaia e pompa'], ['H20.36', 'Calibrazione manuale fallita'], ['H20.39', 'Mancanza prima calibrazione'], ['H20.40', 'Mancanza configurazione gas'],
    ['E00.04', 'Sensore di temperatura ritorno non connesso'], ['E00.05', 'Sensore di temperatura ritorno in corto circuito'], ['E00.06', 'Sensore di ritorno scollegato durante il funzionamento'], ['E00.07', 'Temperatura sensore di ritorno troppo alta'],
    ['E00.16', 'Sensore temperatura bollitore ACS non connesso'], ['E00.17', 'Sensore temperatura bollitore ACS in corto circuito'], ['E00.40', 'Ingresso sensore pressione acqua aperto'], ['E00.41', 'Ingresso sensore pressione acqua chiuso'],
    ['E00.44', 'Sensore ACS aperto'], ['E00.45', 'Sensore ACS in corto circuito'], ['E01.12', 'Temperatura rilevata dal sensore di ritorno maggiore della temperatura di mandata'], ['E01.20', 'Raggiunto valore massimo della temperatura fumi'],
    ['E02.13', 'Ingresso di blocco dell\'unità di controllo generato dall\'unità esterna'], ['E02.15', 'Tempo minimo di riconoscimento chiavetta CSU superato'], ['E02.17', 'Mancata comunicazione permanente interna alla scheda'],
    ['E02.32', 'Tempo esaurito per caricamento automatico'], ['E02.35', 'Dispositivo critico di sicurezza disconnesso'], ['E02.39', 'Aumento di pressione insufficiente dopo il riempimento automatico'], ['E02.47', 'Connessione con dispositivo esterno non riuscita'],
    ['E04.00', 'Anomalia parametri di sicurezza'], ['E04.01', 'Sensore temperatura di mandata in corto circuito'], ['E04.02', 'Sensore temperatura di mandata non connesso'], ['E04.04', 'Sensore fumi in corto circuito'], ['E04.05', 'Sensore fumi non connesso'],
    ['E04.06', 'Raggiunto valore critico di temperatura fumi'], ['E04.07', 'Raggiunta massima differenza tra le temperature di mandata'], ['E04.11', 'Test VPS valvola gas fallito'], ['E04.12', 'Mancata accensione per rilevamento fiamma parassita'],
    ['E04.17', 'Guasto circuito di comando valvola gas'], ['E04.18', 'Temperatura di mandata inferiore alla temperatura minima'], ['E04.24', 'Errore famiglia del gas non trovata'], ['E04.28', 'Errore feedback valvola gas'],
    ['E04.29', 'Raggiunto numero massimo di reset ammessi'], ['E04.50', 'Errore valvola gas'], ['E04.54', 'Errore sconosciuto'], ['E04.250', 'Errore valvola gas'], ['E04.254', 'Errore sconosciuto'],
    ['A00.34', 'Sonda esterna mancante'], ['A02.18', 'Parametrizzazione errata'], ['A02.33', 'Superata la durata massima consentita del rabbocco'], ['A02.34', 'Intervallo minimo tra due richieste di riempimento automatico non raggiunto'],
    ['A02.36', 'Dispositivo funzionale disconnesso'], ['A02.37', 'Dispositivo funzionale passivo disconnesso'], ['A02.45', 'Errore sulla connessione'], ['A02.46', 'Errore sulle priorità del dispositivo'],
    ['A02.48', 'Errore di configurazione funzione unità'], ['A02.49', 'Inizializzazione nodo fallita'], ['A02.55', 'Numero di serie errato o mancante'], ['A02.76', 'Memoria interna riservata alla personalizzazione piena'],
    ['A02.80', 'Mancanza della resistenza terminatrice nel bus'], ['A05.29', 'Pressione gas sotto il limite'], ['A05.30', 'Controllo pressione gas fallito'], ['A05.95', 'Breve interruzione del segnale della fiamma'], ['A08.02', 'Errore tempo doccia trascorso']
  ];
  const codici = righe.map(r => ({ c: r[0], d: r[1], t: r[0][0], guida: r[2] || null }));
  const byCode = {}; codici.forEach(x => { byCode[x.c] = x; });
  const nomi = { H: 'Anomalie H — Contattare il Centro Assistenza', E: 'Anomalie E — Contattare immediatamente il Centro Assistenza', A: 'Avvertenze A — Manutenzione preventiva' };
  return { msg, video, codici, byCode, nomi };
})();

const ALLARMI_MODELLI = [{ re: /luna classic/i, m: ALLARMI_LUNA }, { re: /luna century/i, m: ALLARMI_CENTURY }];
function modelloAllarmi(c) { const t = (c && c.tipo) || ''; const x = ALLARMI_MODELLI.find(e => e.re.test(t)); return x ? x.m : null; }
function codiciPerLettera(M, l) {
  const key = c => c.replace(/^[AEH]\.?/, '').split('.').map(Number);
  return M.codici.filter(x => x.t === l).sort((a, b) => { const A = key(a.c), B = key(b.c); for (let i = 0; i < 2; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; });
}
