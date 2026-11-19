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
  return { msg, video, codici, byCode };
})();
function modelloAllarmi(c) { return /luna classic/i.test((c && c.tipo) || '') ? ALLARMI_LUNA : null; }
function codiciPerLettera(l) {
  const key = c => c.split('.').slice(1).map(Number);
  return ALLARMI_LUNA.codici.filter(x => x.t === l).sort((a, b) => { const A = key(a.c), B = key(b.c); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; });
}
