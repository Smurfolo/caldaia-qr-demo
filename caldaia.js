const matricola = getParam('id');
const BRAND = window.BRAND || 'baxi';
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
if (BRAND !== 'baxi') document.body.classList.add('brand-altro');
let uView = 'home', tView = 'home', flash = '', fotoTmp = [], sigData = null, sigDirty = false;
const uCtx = {};
let mode = 'utente';

// --- login finto ------------------------------------------------------
const db = getDb();
const tecnicoSelect = document.getElementById('tecnicoSelect');
db.tecnici.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = `${t.nome} (${t.ruolo}) — ${getCentro(t.centro_id).nome}`; tecnicoSelect.appendChild(o); });
document.querySelectorAll('#modeToggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#modeToggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); mode = btn.dataset.mode;
    document.getElementById('tecnicoLogin').style.display = mode === 'tecnico' ? 'block' : 'none';
    render();
  });
});
tecnicoSelect.value = localStorage.getItem('caldaia_demo_tecnico') || db.tecnici[0].id;
if (!tecnicoSelect.value) tecnicoSelect.value = db.tecnici[0].id;
tecnicoSelect.addEventListener('change', () => { localStorage.setItem('caldaia_demo_tecnico', tecnicoSelect.value); render(); });
function currentTecnico() { return db.tecnici.find(t => t.id === tecnicoSelect.value) || db.tecnici[0]; }
const simOff = document.getElementById('simOffline');
simOff.checked = sessionStorage.getItem('caldaia_sim_offline') === '1';
function aggiornaBtnOffline() {
  const b = document.getElementById('submitPrimaAccensione'); if (b) b.textContent = isOffline() ? 'Salva bozza firmata (offline)' : 'Conferma prima accensione';
  const n = document.getElementById('offNote'); if (n) n.style.display = isOffline() ? 'block' : 'none';
}
simOff.addEventListener('change', () => { sessionStorage.setItem('caldaia_sim_offline', simOff.checked ? '1' : '0'); aggiornaBtnOffline(); });
window.addEventListener('online', aggiornaBtnOffline); window.addEventListener('offline', aggiornaBtnOffline);

// --- render -----------------------------------------------------------
function render() {
  const content = document.getElementById('content');
  if (!matricola) { content.innerHTML = `<div class="card empty-state">Nessuna matricola indicata nell'URL.<br>Torna allo <a href="index.html">scanner</a>.</div>`; return; }
  const caldaia = getCaldaia(matricola);
  const banner = BRAND !== 'baxi' ? `<div class="brand-banner">Caldaia di altro marchio — servizio multimarca</div>` : '';
  if (!caldaia) {
    content.innerHTML = banner + `<div class="card wide"><span class="chip warn">Matricola non riconosciuta</span><h1 style="margin-top:12px">Codice <span class="matricola">${esc(matricola)}</span></h1><p class="lede">Non risulta nessuna caldaia con questo codice. Controlla di aver inquadrato il QR giusto o di aver digitato correttamente la matricola. Se l'etichetta è rovinata o non si legge, contatta il servizio assistenza:</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px"><a class="btn btn-primary" style="flex:1" href="tel:${CONTATTO.tel}">Numero verde ${CONTATTO.tel}</a><a class="btn btn-secondary" style="flex:1" href="mailto:${CONTATTO.mail}">${CONTATTO.mail}</a></div><a class="btn btn-secondary btn-block" href="index.html">Torna allo scanner</a></div>`;
    return;
  }
  content.innerHTML = banner + (mode === 'utente' ? renderUtente(caldaia) : renderTecnico(caldaia));
  attachHandlers(caldaia);
}

const INFO = `<button class="info-btn" data-act="info" title="Come funziona">?</button><div class="hint" id="infoBox" style="display:none">Scegli il centro assistenza più vicino e lascia i tuoi dati. La richiesta arriva al centro, che la valuta e, una volta accettato il lavoro, ti ricontatta per fissare il primo avviamento. Nella demo i dati restano solo in questo browser.</div>`;
const euro = p => p ? `€ ${p}/anno` : 'su richiesta';
const MAILMSG = `<p class="count-hint">✉ La mail è stata inviata a te e al centro assistenza (demo).</p>`;
function rottamataHtml(c) {
  const r = c.rottamazione || {}, s = r.tipo === 'baxi' ? `Sostituita con una nuova caldaia Baxi (${esc(r.matricola)})` : r.tipo === 'altro' ? `Sostituita con: ${esc(r.descrizione)}` : 'Nessuna sostituzione indicata';
  return `<div class="card wide"><span class="chip warn">Caldaia rottamata</span><p class="lede" style="margin:12px 0 0">Rottamata il ${formatData(r.data)}. ${s}.</p></div>`;
}
const pianoCard = (p, o = {}) => `<div class="plan ${o.best ? 'best' : ''}">${o.best ? '<div class="badge">★ Più vicino alle tue richieste</div>' : ''}<div class="data-row"><strong>${esc(p.nome)}</strong><span class="v">${euro(p.prezzo)}</span></div><ul>${descrPiano(p).map(x => `<li>${x}</li>`).join('')}${p.servizi.map(x => `<li>${x}</li>`).join('')}</ul>${o.v ? `<div class="count-hint" style="margin:0 0 8px">Soddisfa ${o.v.ok} richieste su 4${o.v.mancanti.length ? ' · non include: ' + o.v.mancanti.join(', ') : ''}</div>` : ''}<button class="btn ${o.best ? 'btn-primary' : 'btn-secondary'} btn-block" data-act="piano" data-id="${p.id}">Richiedi attivazione</button></div>`;
function estensioniUtenteHtml(c, centro) {
  const es = centro.estensione || {};
  const sez = (tipo, titolo, sotto, offerta) => {
    const att = (c.estensioni || []).filter(e => e.tipo === tipo && giorniA(e.fine) >= 0), rq = (c.richieste_estensione || {})[tipo];
    return `<div class="plan"><strong>${titolo}</strong><div class="count-hint" style="margin:2px 0 8px">${sotto}</div>` + (att.length ? att.map(e => `<span class="chip ok">Attiva fino al ${formatData(e.fine)}</span>`).join(' ') : rq ? `<span class="chip warn">Richiesta inviata il ${formatData(rq.data)}</span>${MAILMSG}` : `<div class="count-hint" style="margin:0 0 8px">${offerta}</div><button class="btn btn-secondary btn-block" data-act="est-rich" data-tipo="${tipo}">Richiedi contratto</button>`) + `</div>`;
  };
  return `<div class="card"><h2>Contratti di estensione</h2>` +
    sez('produttore', 'Estensione di garanzia Baxi', 'Garantita dal produttore', `${ESTENSIONE_BAXI.nome}: ${ESTENSIONE_BAXI.mesi / 12} anni, ricambi gratuiti con manutenzione annuale.`) +
    sez('centro', 'Estensione del centro assistenza', `Garantita da ${esc(centro.nome)}, anche fuori garanzia del produttore`, `${esc(es.nome)}: ${es.mesi / 12} anni${es.prezzo ? ' · € ' + es.prezzo : ''}.`) + `</div>`;
}

function renderUtente(caldaia) {
  const linked = !!caldaia.centro_id;
  const head = `<div class="card"><h1>Caldaia <span class="matricola">${esc(matricola)}</span></h1>${linked ? '<span class="chip ok">Centro assistenza collegato</span>' : '<span class="chip warn">Nessun centro collegato</span>'}</div>`;
  const back = `<button class="btn btn-secondary btn-block" data-act="home" style="margin-top:10px">Indietro</button>`;
  const centro = linked ? getCentro(caldaia.centro_id) : (uCtx.centro ? getCentro(uCtx.centro) : null);
  if (caldaia.stato === 'rottamata') return head + rottamataHtml(caldaia);
  if (uView === 'avvio-centri') return head + `<div class="card"><h2>Scegli il centro assistenza ${INFO}</h2>
    <label for="capInput">Il tuo CAP</label><input type="text" id="capInput" placeholder="es. 36061" maxlength="5">
    <button class="btn btn-secondary btn-block" id="cercaCapBtn" style="margin-top:12px">Cerca per CAP</button>
    <button class="btn btn-secondary btn-block" id="usaPosizioneBtn" style="margin-top:8px">Usa la mia posizione</button>
    <div id="risultatiCentri" style="margin-top:16px"></div>${back}</div>`;
  if (uView === 'avvio-form') return head + `<div class="card wide"><h2>Richiesta primo avviamento ${INFO}</h2>
    <p class="lede" style="margin-bottom:6px">Centro: <strong>${centro.nome}</strong> — ${centro.comune}</p>
    <label for="uNome">Nome e cognome *</label><input type="text" id="uNome">
    <label for="uTel">Telefono *</label><input type="text" id="uTel">
    <label for="uMail">Email</label><input type="text" id="uMail">
    <label for="uInd">Indirizzo dell'impianto</label><input type="text" id="uInd">
    <label for="uNote">Note</label><input type="text" id="uNote" placeholder="es. orari preferiti">
    <div class="svc-grid" style="margin-top:14px"><label><input type="checkbox" id="cPriv"><span>Ho letto l'<a href="#">informativa privacy</a> e acconsento al trattamento dei miei dati per gestire la richiesta *</span></label><label><input type="checkbox" id="cMkt"><span>Acconsento a ricevere comunicazioni commerciali (facoltativo)</span></label></div>
    <button class="btn btn-primary btn-block" data-act="invia-avvio" style="margin-top:16px">Invia richiesta</button>${back}</div>`;
  if (uView === 'avvio-ok') return head + `<div class="card"><span class="chip ok">Richiesta inviata</span><p class="lede" style="margin-top:12px">${centro.nome} riceverà i tuoi dati e ti ricontatterà dopo aver accettato il lavoro. Puoi seguire lo stato da questa pagina. <em>(Demo: dati salvati solo in questo browser.)</em></p>${back}</div>`;
  if (uView === 'guasto') return head + `<div class="card"><h2>Segnala un guasto</h2><p class="lede" style="margin-bottom:12px">Che codice errore vedi sul display?</p>
    ${Object.entries(ALBERI).map(([k, v]) => `<button class="btn btn-secondary btn-block" data-act="codice" data-code="${k}" style="margin-bottom:8px">${k} — ${v.nome}</button>`).join('')}
    <label for="codiceAltro">Altro codice o nessun codice</label><input type="text" id="codiceAltro" placeholder="es. E05">
    <button class="btn btn-primary btn-block" data-act="codice-altro" style="margin-top:12px">Continua</button>
    <p class="count-hint">Codici e procedure dimostrativi, da sostituire con quelli ufficiali del costruttore.</p>${back}</div>`;
  if (uView === 'albero') { const n = ALBERI[uCtx.code].n[uCtx.node];
    return head + `<div class="card"><h2>${uCtx.code} — ${ALBERI[uCtx.code].nome}</h2><p style="line-height:1.5">${n.t}</p>
    <div style="display:flex;gap:10px"><button class="btn btn-primary" style="flex:1" data-act="si">Sì</button><button class="btn btn-secondary" style="flex:1" data-act="no">No</button></div>${back}</div>`; }
  if (uView === 'risolto') return head + `<div class="card"><span class="chip ok">Risolto</span><p class="lede" style="margin-top:12px">Ottimo, non serve chiamare il tecnico. Se il codice ricompare, segnalalo di nuovo.</p><button class="btn btn-primary btn-block" data-act="risolto-fine">Chiudi</button></div>`;
  if (uView === 'gas') return head + `<div class="card"><span class="chip warn">Emergenza gas</span><p style="line-height:1.5;margin-top:12px">Chiudi il rubinetto del gas, apri le finestre, non usare interruttori né fiamme, esci dall'abitazione e chiama il pronto intervento del distributore (sulla bolletta) o il 112.</p>${back}</div>`;
  if (uView === 'invia-guasto') return head + `<div class="card"><h2>Serve un tecnico</h2><p class="lede">Codice ${esc(uCtx.code)}: non risolvibile in autonomia. Contatta ${centro.nome} o lascia una segnalazione.</p>
    <div style="display:flex;gap:10px;margin-bottom:12px"><a class="btn btn-primary" style="flex:1" href="tel:${centro.telefono.replace(/\s/g, '')}">Chiama</a><a class="btn btn-secondary" style="flex:1" href="mailto:${centro.email}">Scrivi</a></div>
    <label for="gDesc">Descrizione</label><input type="text" id="gDesc"><label for="gTel">Telefono per essere richiamato</label><input type="text" id="gTel">
    <button class="btn btn-primary btn-block" data-act="invia-guasto" style="margin-top:14px">Invia segnalazione</button>${back}</div>`;
  if (uView === 'guasto-ok') return head + `<div class="card"><span class="chip ok">Segnalazione inviata</span><p class="lede" style="margin-top:12px">${centro.nome} è stato avvisato.</p>${back}</div>`;
  if (uView === 'quiz') return head + `<div class="card wide"><h2>La tua assistenza ideale</h2>
    <label>La manutenzione ordinaria la preferisci…</label><div class="svc-grid"><label><input type="radio" name="qMan" value="ufficio" checked><span>In orari d'ufficio</span></label><label><input type="radio" name="qMan" value="libera"><span>All'ora che vuoi tu</span></label></div>
    <label>Il tuo giorno e orario ideale (se scegli l'orario libero)</label><div class="field-row"><div><select id="qGiorno"><option>Lunedì</option><option>Martedì</option><option>Mercoledì</option><option>Giovedì</option><option>Venerdì</option><option>Sabato</option></select></div><div><select id="qFascia"><option>Mattina (8-12)</option><option>Pomeriggio (14-18)</option><option>Sera (18-20)</option></select></div></div>
    <label>In caso di urgenza (senza acqua calda o riscaldamento) come immagini il servizio?</label><div class="svc-grid"><label><input type="radio" name="qUrg" value="giorno" checked><span>Il più rapido possibile (il giorno stesso)</span></label><label><input type="radio" name="qUrg" value="48h"><span>Ho altre fonti alternative (entro 48 ore)</span></label></div>
    <label>In caso di urgenza vorresti l'assistenza anche di domenica (nei mesi invernali)?</label><div class="svc-grid"><label><input type="radio" name="qDom" value="si" checked><span>Sì</span></label><label><input type="radio" name="qDom" value="no"><span>No</span></label></div>
    <label>Vorresti tutti i ricambi gratuiti anche dopo la garanzia?</label><div class="svc-grid"><label><input type="radio" name="qRic" value="si" checked><span>Sì</span></label><label><input type="radio" name="qRic" value="no"><span>No</span></label></div>
    <button class="btn btn-primary btn-block" data-act="quiz-go" style="margin-top:16px">Mostra la mia assistenza ideale</button>${back}</div>`;
  if (uView === 'quiz-ris') { const o = ordinaPiani(centro.piani || [], uCtx.q);
    return head + `<div class="card"><h2>Le offerte, in base alle tue richieste</h2>${uCtx.q.man === 'libera' ? `<p class="count-hint" style="margin-top:0">Orario preferito: ${esc(uCtx.q.giorno)}, ${esc(uCtx.q.fascia)}</p>` : ''}${o.map((x, i) => pianoCard(x.p, { best: i === 0, v: x.v })).join('')}${back}</div>`; }
  // home
  if (!linked) {
    const rq = richiestaPerMatricola(matricola), rc = rq && getCentro(rq.centro_id);
    if (rq && rq.stato !== 'rifiutata') {
      const st = { 'in attesa': ['warn', `In attesa di risposta da ${rc.nome}`], accettata: ['ok', `Accettata: ${rc.nome} ti contatterà per fissare il primo avviamento`], completata: ['ok', 'Primo avviamento eseguito'] }[rq.stato];
      const step = (t, on) => `<div class="step ${on ? 'on' : ''}">${t}</div>`;
      return head + `<div class="card"><h2>Richiesta di primo avviamento</h2><span class="chip ${st[0]}">${st[1]}</span><div class="steps">${step('Inviata', true)}${step('Accettata', rq.stato !== 'in attesa')}${step('Avviata', rq.stato === 'completata')}</div><p class="count-hint">Inviata il ${formatData(rq.data)} a ${rc.nome}</p></div>`;
    }
    return head + (rq ? `<div class="card"><span class="chip warn">Richiesta rifiutata da ${rc.nome}</span><p class="lede" style="margin:10px 0 0">Puoi sceglierne un altro.</p></div>` : '') + `<div class="card"><h2>Primo avviamento ${INFO}</h2><p class="lede">Questa caldaia non è ancora collegata a un centro assistenza.</p><button class="btn btn-primary btn-block" data-act="avvio">Richiedi primo avviamento</button></div>`;
  }
  let html = head + semaforoHtml(caldaia) + `<div class="card"><h2>Il tuo centro assistenza</h2>
    <div class="data-row"><span class="k">Centro</span><span class="v">${centro.nome}</span></div>
    <div class="data-row"><span class="k">Zona</span><span class="v">${centro.comune}</span></div>
    <div style="display:flex; gap:10px; margin-top:16px"><a class="btn btn-primary" style="flex:1" href="mailto:${centro.email}">Scrivi</a><a class="btn btn-secondary" style="flex:1" href="tel:${centro.telefono.replace(/\s/g, '')}">Chiama</a></div>
    <button class="btn btn-secondary btn-block" data-act="guasto" style="margin-top:10px">Segnala un guasto</button></div>`;
  html += scadenzeHtml(caldaia) + estensioniUtenteHtml(caldaia, centro);
  const piani = centro.piani || [], pa = piani.find(p => p.id === caldaia.piano_attivo), rqp = caldaia.richiesta_piano, pr = rqp && piani.find(p => p.id === rqp.piano_id);
  if (pa) html += `<div class="card"><h2>Il tuo piano di manutenzione</h2><span class="chip ok">${esc(pa.nome)} attivo</span><ul class="plain">${descrPiano(pa).map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  else if (pr) html += `<div class="card"><h2>Piano di manutenzione</h2><span class="chip warn">Richiesta "${esc(pr.nome)}" in attesa di conferma</span>${rqp.prefs && rqp.prefs.man === 'libera' ? `<p class="count-hint">Orario preferito: ${esc(rqp.prefs.giorno)}, ${esc(rqp.prefs.fascia)}</p>` : ''}${MAILMSG}</div>`;
  else if (piani.length) html += `<div class="card"><h2>Piani di manutenzione</h2><button class="btn btn-primary btn-block" data-act="quiz" style="margin-bottom:12px">Trova la tua assistenza ideale</button>${piani.map(p => pianoCard(p)).join('')}</div>`;
  return html;
}

function handleAct(act, b) {
  const val = id => (document.getElementById(id) || {}).value || '';
  const chk = n => { const x = document.querySelector(`input[name=${n}]:checked`); return x ? x.value : ''; };
  const A = uCtx.code && ALBERI[uCtx.code];
  if (act === 'info') { const x = document.getElementById('infoBox'); x.style.display = x.style.display === 'none' ? 'block' : 'none'; return; }
  if (act === 'home') uView = 'home';
  else if (act === 'avvio') uView = 'avvio-centri';
  else if (act === 'invia-avvio') {
    if (!val('uNome').trim() || !val('uTel').trim()) { alert('Nome e telefono sono obbligatori.'); return; }
    if (!document.getElementById('cPriv').checked) { alert('Per inviare la richiesta devi acconsentire al trattamento dei dati.'); return; }
    creaRichiestaAvvio({ matricola, centro_id: uCtx.centro, nome: val('uNome').trim(), telefono: val('uTel').trim(), email: val('uMail').trim(), indirizzo: val('uInd').trim(), note: val('uNote').trim(), privacy: true, marketing: document.getElementById('cMkt').checked });
    uView = 'avvio-ok';
  }
  else if (act === 'quiz') uView = 'quiz';
  else if (act === 'quiz-go') { uCtx.q = { man: chk('qMan'), giorno: val('qGiorno'), fascia: val('qFascia'), urg: chk('qUrg'), dom: chk('qDom') === 'si', ricambi: chk('qRic') === 'si' }; uView = 'quiz-ris'; }
  else if (act === 'piano') { richiediPiano(matricola, b.dataset.id, uCtx.q || null); uView = 'home'; }
  else if (act === 'est-rich') richiediEstensione(matricola, b.dataset.tipo);
  else if (act === 'est-ok') risolviEstensione(matricola, b.dataset.tipo, true);
  else if (act === 'est-no') risolviEstensione(matricola, b.dataset.tipo, false);
  else if (act === 'est-reg') {
    if (!val('eFine')) { alert('Indica la data di fine del contratto.'); return; }
    const tipo = val('eTipo'); aggiungiEstensione(matricola, { tipo, nome: tipo === 'produttore' ? ESTENSIONE_BAXI.nome : ((getCentro(currentTecnico().centro_id).estensione || {}).nome || 'Estensione del centro'), inizio: isoOff(0), fine: val('eFine') });
  }
  else if (act === 'conferma-piano') mutaCaldaia(matricola, c => { c.piano_attivo = c.richiesta_piano.piano_id; c.richiesta_piano = null; });
  else if (act === 'rifiuta-piano') mutaCaldaia(matricola, c => { c.richiesta_piano = null; });
  else if (act === 'guasto') uView = 'guasto';
  else if (act === 'codice') { uCtx.code = b.dataset.code; uCtx.node = ALBERI[uCtx.code].start; uView = 'albero'; }
  else if (act === 'codice-altro') { uCtx.code = val('codiceAltro').trim().toUpperCase() || 'N/D'; if (ALBERI[uCtx.code]) { uCtx.node = ALBERI[uCtx.code].start; uView = 'albero'; } else uView = 'invia-guasto'; }
  else if (act === 'si' || act === 'no') { const nx = A.n[uCtx.node][act]; if (nx === 'ok') uView = 'risolto'; else if (nx === 'tec') uView = 'invia-guasto'; else if (nx === 'gas') uView = 'gas'; else uCtx.node = nx; }
  else if (act === 'risolto-fine') { aggiungiSegnalazione(matricola, { codice: uCtx.code, stato: 'risolta autonomamente' }); uView = 'home'; }
  else if (act === 'invia-guasto') { aggiungiSegnalazione(matricola, { codice: uCtx.code, descrizione: val('gDesc'), contatto: val('gTel'), stato: 'inviata al centro' }); uView = 'guasto-ok'; }
  else if (act === 'rottama-open') tView = 'rottama';
  else if (act === 'rottama-annulla') tView = 'home';
  else if (act === 'rottama-conferma') {
    const tipo = chk('rTipo'), mat = val('rMat').trim().toUpperCase(), desc = val('rDesc').trim();
    if (!tipo) { alert('Seleziona cosa è successo dopo la rottamazione.'); return; }
    if (tipo === 'baxi' && !mat) { alert('Indica la matricola della nuova caldaia Baxi.'); return; }
    if (tipo === 'altro' && !desc) { alert('Indica cosa è stato installato.'); return; }
    rottama(matricola, { tipo, matricola: tipo === 'baxi' ? mat : null, descrizione: tipo === 'altro' ? desc : null });
    flash = tipo === 'baxi' ? `Caldaia rottamata. Nuova caldaia Baxi ${esc(mat)} censita: <a href="caldaia.html?id=${encodeURIComponent(mat)}">apri la scheda per la prima accensione</a>.` : 'Caldaia segnata come rottamata.';
    tView = 'home';
  }
  else if (act === 'invia-bozza') {
    if (isOffline()) { alert('Sei ancora offline: la bozza resta salvata sul dispositivo.'); return; }
    const l = getBozze(), bz = l.find(x => x.id === b.dataset.id), ex = bz && getCaldaia(bz.matricola);
    if (!bz) return;
    if (ex && ex.centro_id) { alert('Questa caldaia risulta già attivata: la bozza non può essere inviata.'); return; }
    completaPrimaAccensione(bz.matricola, bz.payload); saveBozze(l.filter(x => x.id !== bz.id));
    flash = `Bozza ${esc(bz.matricola)} inviata. Il certificato di prima accensione è stato inviato via mail al cliente e al centro assistenza (demo).`;
  }
  else if (act === 'elimina-bozza') { if (!confirm('Eliminare la bozza? La firma del cliente andrà persa.')) return; saveBozze(getBozze().filter(x => x.id !== b.dataset.id)); }
  render();
}
document.getElementById('content').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) handleAct(b.dataset.act, b); });

// --- area tecnico -------------------------------------------------------
function bozzeHtml(centroId) {
  const l = getBozze().filter(b => b.centro_id === centroId); if (!l.length) return '';
  return `<div class="card"><h2>Bozze offline firmate</h2><p class="count-hint" style="margin-top:0">Firmate dal cliente: non sono modificabili. Inviale quando c'è rete.</p>` + l.map(b => `<div class="plan"><div class="data-row"><strong>${esc(b.matricola)}</strong><span class="chip warn">Da inviare · bloccata</span></div><div class="count-hint" style="margin:0 0 8px">${esc(b.payload.nomeCliente)} · avviamento ${formatData(b.payload.dataAvviamento)} · ${b.payload.foto.length} foto · installatore ${esc(b.payload.installatore.ragione)}${b.payload.firma ? ' · firma <img class="sig-thumb" src="' + b.payload.firma + '" alt="firma">' : ''}</div><div style="display:flex;gap:10px"><button class="btn btn-primary" style="flex:1" data-act="invia-bozza" data-id="${b.id}">Invia</button><button class="btn btn-secondary" style="flex:1" data-act="elimina-bozza" data-id="${b.id}">Elimina</button></div></div>`).join('') + `</div>`;
}
function primaAccensioneForm(centro, centroLoggato) {
  const r = richiestaPerMatricola(matricola), rqA = (r && r.centro_id === centroLoggato && r.stato === 'accettata') ? r : {}, c0 = getCaldaia(matricola) || {};
  return `<div class="card wide"><h2>Prima accensione</h2><p class="lede">Questa matricola non risulta ancora in gestione. Compila i dati per prenderla in carico con ${centro.nome}.${rqA.nome ? ' Dati del cliente precompilati dalla sua richiesta.' : ''}</p>
    <h3>Cliente</h3>
    <label for="fNome">Nome cliente</label><input type="text" id="fNome" value="${esc(rqA.nome)}">
    <label for="fPosizione">Indirizzo installazione</label><input type="text" id="fPosizione" value="${esc(rqA.indirizzo)}">
    <h3>Impianto</h3>
    <label for="fTipo">Modello caldaia</label><input type="text" id="fTipo" placeholder="es. Baxi Luna Duo-Tec 28 kW" value="${esc(c0.tipo)}">
    <div class="field-row"><div><label for="fInstall">Data installazione</label><input type="date" id="fInstall"></div><div><label for="fAvvio">Data avviamento</label><input type="date" id="fAvvio"></div></div>
    <h3>Installatore</h3>
    <label for="iRag">Ragione sociale</label><input type="text" id="iRag">
    <div class="field-row"><div><label for="iRef">Referente</label><input type="text" id="iRef"></div><div><label for="iPiva">Partita IVA</label><input type="text" id="iPiva"></div></div>
    <div class="field-row"><div><label for="iTel">Telefono</label><input type="text" id="iTel"></div><div><label for="iMail">Email</label><input type="text" id="iMail"></div></div>
    <h3>Conformità</h3>
    <div class="svc-grid"><label><input type="checkbox" id="cConf"><span>Dichiaro che l'impianto è stato realizzato in conformità alla normativa vigente (dichiarazione di conformità, D.M. 37/08) *</span></label></div>
    <h3>Foto</h3>
    <input type="file" id="fFoto" accept="image/*" multiple><div class="foto-grid" id="fotoPrev"></div><div class="count-hint">Fino a 6 foto (targhetta, installazione, scarichi…).</div>
    ${rqA.privacy ? '' : `<h3>Consenso del cliente</h3><div class="svc-grid"><label><input type="checkbox" id="cPrivT"><span>Il cliente ha letto l'<a href="#">informativa privacy</a> e acconsente al trattamento dei dati *</span></label><label><input type="checkbox" id="cMktT"><span>Comunicazioni commerciali (facoltativo)</span></label></div>`}
    <h3>Firma del cliente</h3>
    <canvas class="sig" id="sigPad" width="600" height="180"></canvas><button class="btn btn-secondary" id="sigClear" style="margin-top:8px">Cancella firma</button>
    <div class="hint" id="offNote" style="display:none">Sei offline: la prima accensione verrà salvata come bozza firmata sul dispositivo. Dopo la firma non sarà più modificabile e potrai inviarla quando torna la rete.</div>
    <button class="btn btn-primary btn-block" id="submitPrimaAccensione" style="margin-top:16px">Conferma prima accensione</button></div>`;
}
function estensioniTecnicoHtml(c) {
  const sez = (tipo, titolo) => { const l = (c.estensioni || []).filter(e => e.tipo === tipo), rq = (c.richieste_estensione || {})[tipo];
    return `<h3>${titolo}</h3>` + (l.map(e => `<div class="data-row"><span>${esc(e.nome)}</span><span class="v">${formatData(e.inizio)} → ${formatData(e.fine)}</span></div>`).join('') || '<p class="count-hint" style="margin:0 0 8px">Nessun contratto.</p>') +
      (rq ? `<div class="alert warn">Richiesta del cliente del ${formatData(rq.data)}<div style="display:flex;gap:10px;margin-top:8px"><button class="btn btn-primary" style="flex:1" data-act="est-ok" data-tipo="${tipo}">Conferma</button><button class="btn btn-secondary" style="flex:1" data-act="est-no" data-tipo="${tipo}">Rifiuta</button></div></div>` : ''); };
  return `<div class="card"><h2>Contratti di estensione</h2>${sez('produttore', 'Estensione del produttore (Baxi)')}${sez('centro', 'Estensione del centro (fuori garanzia produttore)')}
    <h3>Registra un contratto</h3><div class="field-row"><div><select id="eTipo"><option value="produttore">Produttore (Baxi)</option><option value="centro">Centro assistenza</option></select></div><div><input type="date" id="eFine"></div></div>
    <button class="btn btn-secondary btn-block" data-act="est-reg" style="margin-top:10px">Registra</button></div>`;
}
function renderTecnico(caldaia) {
  const tecnico = currentTecnico(), centroLoggato = tecnico.centro_id, centro = getCentro(centroLoggato);
  let html = `<div class="card"><h1>Caldaia <span class="matricola">${esc(matricola)}</span></h1><p class="lede" style="margin:6px 0 0">Accesso come <strong>${tecnico.nome}</strong> — ${centro.nome}</p></div>`;
  if (flash) { html += `<div class="card"><span class="chip ok">Fatto</span><p style="margin:10px 0 0;line-height:1.5">${flash}</p></div>`; flash = ''; }
  if (tecnico.ruolo === 'master') html += `<div class="card"><h2>Area master</h2><a class="btn btn-secondary btn-block" href="configuratore.html">Configuratore, richieste e team →</a></div>`;
  html += bozzeHtml(centroLoggato);
  if (caldaia.stato === 'rottamata') return html + rottamataHtml(caldaia);
  if (!caldaia.centro_id) return html + (getBozze().some(b => b.matricola === matricola) ? `<div class="card"><p class="lede" style="margin:0">Per questa matricola c'è già una prima accensione firmata in bozza: inviala dall'elenco qui sopra.</p></div>` : primaAccensioneForm(centro, centroLoggato));
  if (caldaia.centro_id !== centroLoggato) return html + `<div class="card empty-state">Questa caldaia è già in gestione da un altro centro assistenza.<br>Dati cliente non visibili.</div>`;
  const pa0 = caldaia.prima_accensione;
  html += semaforoHtml(caldaia) + `<div class="card"><h2>Dati installazione</h2>
    <div class="data-row"><span class="k">Cliente</span><span class="v">${esc(caldaia.utente.nome)}</span></div>
    <div class="data-row"><span class="k">Indirizzo</span><span class="v">${esc(caldaia.utente.posizione)}</span></div>
    <div class="data-row"><span class="k">Modello</span><span class="v">${esc(caldaia.tipo)}</span></div>
    <div class="data-row"><span class="k">Installazione</span><span class="v">${formatData(caldaia.data_installazione)}</span></div>
    <div class="data-row"><span class="k">Avviamento</span><span class="v">${formatData(caldaia.data_avviamento)}</span></div>
    ${pa0 && pa0.installatore ? `<div class="data-row"><span class="k">Installatore</span><span class="v">${esc(pa0.installatore.ragione)}</span></div>` : ''}</div>`;
  html += scadenzeHtml(caldaia) + estensioniTecnicoHtml(caldaia);
  html += `<div class="card"><h2>Interventi</h2><div id="listaInterventi">${caldaia.interventi.length ? caldaia.interventi.map(i => `<div class="intervento"><span>${esc(i.tipo)} — ${esc(i.tecnico)}</span><span class="data">${formatData(i.data)}</span></div>`).join('') : `<div class="empty-state" style="padding:12px 0">Nessun intervento registrato.</div>`}</div><button class="btn btn-secondary btn-block" id="aggiungiInterventoBtn" style="margin-top:14px">+ Registra intervento</button></div>`;
  const piani = centro.piani || [], rq = caldaia.richiesta_piano, pa = piani.find(p => p.id === caldaia.piano_attivo), pr = rq && piani.find(p => p.id === rq.piano_id);
  html += `<div class="card"><h2>Piano di manutenzione</h2>` + (pa ? `<span class="chip ok">${esc(pa.nome)} attivo</span><ul class="plain">${descrPiano(pa).map(x => `<li>${x}</li>`).join('')}</ul>`
    : pr ? `<span class="chip warn">Richiesta "${esc(pr.nome)}" del ${formatData(rq.data)}</span>${rq.prefs && rq.prefs.man === 'libera' ? `<p class="count-hint">Orario preferito dal cliente: ${esc(rq.prefs.giorno)}, ${esc(rq.prefs.fascia)}</p>` : ''}<div style="display:flex;gap:10px;margin-top:12px"><button class="btn btn-primary" style="flex:1" data-act="conferma-piano">Conferma attivazione</button><button class="btn btn-secondary" style="flex:1" data-act="rifiuta-piano">Rifiuta</button></div>`
    : `<p class="lede" style="margin:0">Nessun piano attivo né richieste in attesa.</p>`) + `</div>`;
  const seg = (caldaia.segnalazioni || []).slice().reverse();
  html += `<div class="card"><h2>Segnalazioni guasto</h2>` + (seg.length ? seg.map(g => `<div class="intervento"><span>${esc(g.codice)} — ${esc(g.stato)}${g.descrizione ? '<br><small>' + esc(g.descrizione) + '</small>' : ''}${g.contatto ? '<br><small>Tel. ' + esc(g.contatto) + '</small>' : ''}</span><span class="data">${formatData(g.data)}</span></div>`).join('') : `<div class="empty-state" style="padding:12px 0">Nessuna segnalazione.</div>`) + `</div>`;
  if (tView === 'rottama') html += `<div class="card wide"><h2>Rottamazione caldaia</h2><p class="lede">Cosa è stato installato al posto di questa caldaia?</p>
    <div class="svc-grid"><label><input type="radio" name="rTipo" value="baxi"><span>Nuova caldaia Baxi</span></label><label><input type="radio" name="rTipo" value="altro"><span>Altra marca / altro impianto</span></label><label><input type="radio" name="rTipo" value="nessuna"><span>Niente / non so</span></label></div>
    <label for="rMat">Matricola nuova caldaia Baxi</label><input type="text" id="rMat" placeholder="es. CH-2026-0001">
    <label for="rDesc">Cosa hanno installato</label><input type="text" id="rDesc" placeholder="marca e modello">
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-primary" style="flex:1" data-act="rottama-conferma">Conferma rottamazione</button><button class="btn btn-secondary" style="flex:1" data-act="rottama-annulla">Annulla</button></div></div>`;
  else html += `<button class="btn btn-secondary btn-block" data-act="rottama-open">Segnala rottamazione</button>`;
  return html;
}

// --- handler della vista corrente ---------------------------------------
function comprimi(file) {
  return new Promise(res => { const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 720 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.6)); }; img.src = r.result; }; r.readAsDataURL(file); });
}
function attachHandlers(caldaia) {
  const el = id => document.getElementById(id);
  if (el('cercaCapBtn')) el('cercaCapBtn').addEventListener('click', () => mostraRisultatiCentri(elencoCentriOrdinatiPerVicinanza(el('capInput').value)));
  if (el('usaPosizioneBtn')) el('usaPosizioneBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Geolocalizzazione non disponibile su questo dispositivo.'); return; }
    el('usaPosizioneBtn').textContent = 'Localizzazione…';
    navigator.geolocation.getCurrentPosition(pos => mostraRisultatiCentri(elencoCentriPerPosizione(pos.coords.latitude, pos.coords.longitude)), () => { alert('Posizione non disponibile, prova con il CAP.'); el('usaPosizioneBtn').textContent = 'Usa la mia posizione'; });
  });
  const pad = el('sigPad');
  if (pad) {
    fotoTmp = []; sigData = null; sigDirty = false;
    const ctx = pad.getContext && pad.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#0B2545'; let down = false;
      const pos = e => { const b = pad.getBoundingClientRect(); return [(e.clientX - b.left) * pad.width / b.width, (e.clientY - b.top) * pad.height / b.height]; };
      pad.addEventListener('pointerdown', e => { down = true; if (pad.setPointerCapture) pad.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); });
      pad.addEventListener('pointermove', e => { if (!down) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); sigDirty = true; });
      const end = () => { if (down) { down = false; sigData = pad.toDataURL('image/png'); } };
      pad.addEventListener('pointerup', end); pad.addEventListener('pointerleave', end);
      el('sigClear').addEventListener('click', () => { ctx.clearRect(0, 0, pad.width, pad.height); sigData = null; sigDirty = false; });
    }
    el('fFoto').addEventListener('change', async () => {
      for (const f of [...el('fFoto').files]) { if (fotoTmp.length >= 6) { alert('Massimo 6 foto.'); break; } fotoTmp.push(await comprimi(f)); }
      el('fFoto').value = ''; el('fotoPrev').innerHTML = fotoTmp.map(s => `<img src="${s}" alt="foto">`).join('');
    });
    aggiornaBtnOffline();
  }
  if (el('submitPrimaAccensione')) el('submitPrimaAccensione').addEventListener('click', () => {
    const v = id => (el(id) ? el(id).value.trim() : '');
    const centroLoggato = currentTecnico().centro_id, r = richiestaPerMatricola(matricola);
    const rqA = (r && r.centro_id === centroLoggato && r.stato === 'accettata') ? r : {};
    if (!v('fNome') || !v('fPosizione') || !v('fTipo') || !v('fInstall') || !v('fAvvio')) { alert('Compila i dati del cliente e dell\'impianto.'); return; }
    if (!v('iRag') || !v('iRef') || !v('iTel') || !v('iPiva')) { alert('Compila i dati dell\'installatore (ragione sociale, referente, telefono, partita IVA).'); return; }
    if (!el('cConf').checked) { alert('Per procedere serve la dichiarazione di conformità.'); return; }
    if (el('cPrivT') && !el('cPrivT').checked) { alert('Il cliente non ha ancora dato il consenso al trattamento dei dati: va richiesto prima di procedere.'); return; }
    if (!sigData) { alert('Serve la firma del cliente.'); return; }
    const p = { nomeCliente: v('fNome'), posizione: v('fPosizione'), tipo: v('fTipo'), dataInstallazione: v('fInstall'), dataAvviamento: v('fAvvio'), centro_id: centroLoggato,
      installatore: { ragione: v('iRag'), referente: v('iRef'), email: v('iMail'), telefono: v('iTel'), piva: v('iPiva') }, foto: fotoTmp.slice(), firma: sigData, marketing: el('cMktT') ? el('cMktT').checked : !!rqA.marketing };
    if (isOffline()) {
      const l = getBozze(); l.push({ id: 'b' + Date.now(), matricola, centro_id: centroLoggato, creata: new Date().toISOString(), locked: true, payload: p });
      if (!saveBozze(l)) { alert('Spazio esaurito sul dispositivo: riduci il numero di foto.'); return; }
      flash = 'Bozza firmata salvata sul dispositivo. Non è più modificabile: inviala quando torni online.';
    } else { completaPrimaAccensione(matricola, p); flash = 'Prima accensione registrata. Il certificato è stato inviato via mail al cliente e al centro assistenza (demo).'; }
    render();
  });
  if (el('aggiungiInterventoBtn')) el('aggiungiInterventoBtn').addEventListener('click', () => {
    const tipo = prompt('Tipo di intervento (es. Manutenzione ordinaria):'); if (!tipo) return;
    aggiungiIntervento(matricola, { data: new Date().toISOString().slice(0, 10), tipo, tecnico: currentTecnico().nome }); render();
  });
}
function mostraRisultatiCentri(centri) {
  const el = document.getElementById('risultatiCentri');
  el.innerHTML = centri.slice(0, 3).map(c => `<div class="card" style="background:var(--panel-raised); margin-bottom:10px"><div class="data-row"><span class="k">${c.nome}</span><span class="v">${c.comune}</span></div><button class="btn btn-primary btn-block" style="margin-top:10px" data-centro="${c.id}">Scegli questo centro</button></div>`).join('');
  el.querySelectorAll('button[data-centro]').forEach(btn => btn.addEventListener('click', () => { uCtx.centro = btn.dataset.centro; uView = 'avvio-form'; render(); }));
}
render();
