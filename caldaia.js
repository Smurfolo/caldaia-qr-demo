const matricola = getParam('id');
const BRAND = window.BRAND || 'baxi';
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
if (BRAND !== 'baxi') document.body.classList.add('brand-altro');
let uView = 'home'; const uCtx = {};
let mode = 'utente';

// --- popola il login finto tecnico -------------------------------
const db = getDb();
const tecnicoSelect = document.getElementById('tecnicoSelect');
db.tecnici.forEach(t => {
  const centro = getCentro(t.centro_id);
  const opt = document.createElement('option');
  opt.value = t.id;
  opt.textContent = `${t.nome} (${t.ruolo}) — ${centro.nome}`;
  tecnicoSelect.appendChild(opt);
});

document.querySelectorAll('#modeToggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#modeToggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    document.getElementById('tecnicoLogin').style.display = mode === 'tecnico' ? 'block' : 'none';
    render();
  });
});
tecnicoSelect.value = localStorage.getItem('caldaia_demo_tecnico') || db.tecnici[0].id;
if (!tecnicoSelect.value) tecnicoSelect.value = db.tecnici[0].id;
tecnicoSelect.addEventListener('change', () => { localStorage.setItem('caldaia_demo_tecnico', tecnicoSelect.value); render(); });
function currentTecnico() { return db.tecnici.find(t => t.id === tecnicoSelect.value) || db.tecnici[0]; }

// --- render --------------------------------------------------------
function render() {
  const content = document.getElementById('content');
  if (!matricola) {
    content.innerHTML = `<div class="card empty-state">Nessuna matricola indicata nell'URL.<br>Torna allo <a href="index.html">scanner</a>.</div>`;
    return;
  }
  const caldaia = getCaldaia(matricola);
  const banner = BRAND !== 'baxi' ? `<div class="brand-banner">Caldaia di altro marchio — servizio multimarca</div>` : '';
  if (!caldaia) {
    content.innerHTML = banner + `<div class="card"><span class="chip warn">Matricola non riconosciuta</span><h1 style="margin-top:12px">Codice <span class="matricola">${esc(matricola)}</span></h1><p class="lede">Non risulta nessuna caldaia con questo codice. Controlla di aver inquadrato il QR giusto o di aver digitato correttamente la matricola. Se l'etichetta è rovinata, rivolgiti a un centro assistenza.</p><a class="btn btn-primary btn-block" href="index.html">Torna allo scanner</a>${BRAND === 'baxi' ? '<a class="btn btn-secondary btn-block" style="margin-top:10px" href="https://www.baxi.it/supporto/centri-assistenza-autorizzati" target="_blank" rel="noopener">Trova un centro assistenza</a>' : ''}</div>`;
    return;
  }
  content.innerHTML = banner + (mode === 'utente' ? renderUtente(caldaia) : renderTecnico(caldaia));
  attachHandlers(caldaia);
}

function scadenzeHtml(c) {
  const sm = statoScadenza(prossimaManutenzione(c)), sg = c.garanzia && c.garanzia.attiva ? statoScadenza(c.garanzia.scadenza) : null;
  if (!sm && !sg) return '';
  const row = (k, s) => `<div class="data-row"><span class="k">${k}</span><span class="v">${formatData(s.data)}<br><span class="chip ${s.cls}">${s.testo}</span></span></div>`;
  return `<div class="card"><h2>Scadenze</h2>${sm ? row('Prossima manutenzione', sm) : ''}${sg ? row('Garanzia estesa', sg) : ''}</div>`;
}
const INFO = `<button class="info-btn" data-act="info" title="Come funziona">?</button><div class="hint" id="infoBox" style="display:none">Scegli il centro assistenza più vicino e lascia i tuoi dati. La richiesta arriva al centro, che la valuta e, una volta accettato il lavoro, ti ricontatta per fissare il primo avviamento. Nella demo i dati restano solo in questo browser.</div>`;
const euro = p => p ? `€ ${p}/anno` : 'su richiesta';
function renderUtente(caldaia) {
  const linked = caldaia && caldaia.centro_id;
  const head = `<div class="card"><h1>Caldaia <span class="matricola">${matricola}</span></h1>${linked ? '<span class="chip ok">Centro assistenza collegato</span>' : '<span class="chip warn">Nessun centro collegato</span>'}</div>`;
  const back = `<button class="btn btn-secondary btn-block" data-act="home" style="margin-top:10px">Indietro</button>`;
  const centro = linked ? getCentro(caldaia.centro_id) : (uCtx.centro ? getCentro(uCtx.centro) : null);
  if (uView === 'avvio-centri') return head + `<div class="card"><h2>Scegli il centro assistenza ${INFO}</h2>
    <label for="capInput">Il tuo CAP</label><input type="text" id="capInput" placeholder="es. 36061" maxlength="5">
    <button class="btn btn-secondary btn-block" id="cercaCapBtn" style="margin-top:12px">Cerca per CAP</button>
    <button class="btn btn-secondary btn-block" id="usaPosizioneBtn" style="margin-top:8px">Usa la mia posizione</button>
    <div id="risultatiCentri" style="margin-top:16px"></div>${back}</div>`;
  if (uView === 'avvio-form') return head + `<div class="card"><h2>Richiesta primo avviamento ${INFO}</h2>
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
  if (uView === 'invia-guasto') return head + `<div class="card"><h2>Serve un tecnico</h2><p class="lede">Codice ${uCtx.code}: non risolvibile in autonomia. Contatta ${centro.nome} o lascia una segnalazione.</p>
    <div style="display:flex;gap:10px;margin-bottom:12px"><a class="btn btn-primary" style="flex:1" href="tel:${centro.telefono.replace(/\s/g, '')}">Chiama</a><a class="btn btn-secondary" style="flex:1" href="mailto:${centro.email}">Scrivi</a></div>
    <label for="gDesc">Descrizione</label><input type="text" id="gDesc"><label for="gTel">Telefono per essere richiamato</label><input type="text" id="gTel">
    <button class="btn btn-primary btn-block" data-act="invia-guasto" style="margin-top:14px">Invia segnalazione</button>${back}</div>`;
  if (uView === 'guasto-ok') return head + `<div class="card"><span class="chip ok">Segnalazione inviata</span><p class="lede" style="margin-top:12px">${centro.nome} è stato avvisato.</p>${back}</div>`;
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
  let html = head + `<div class="card"><h2>Il tuo centro assistenza</h2>
    <div class="data-row"><span class="k">Centro</span><span class="v">${centro.nome}</span></div>
    <div class="data-row"><span class="k">Zona</span><span class="v">${centro.comune}</span></div>
    <div style="display:flex; gap:10px; margin-top:16px"><a class="btn btn-primary" style="flex:1" href="mailto:${centro.email}">Scrivi</a><a class="btn btn-secondary" style="flex:1" href="tel:${centro.telefono.replace(/\s/g, '')}">Chiama</a></div>
    <button class="btn btn-secondary btn-block" data-act="guasto" style="margin-top:10px">Segnala un guasto</button></div>`;
  html += scadenzeHtml(caldaia);
  const piani = centro.piani || [], pa = piani.find(p => p.id === caldaia.piano_attivo), pr = piani.find(p => p.id === (caldaia.richiesta_piano || {}).piano_id);
  if (pa) html += `<div class="card"><h2>Il tuo piano di manutenzione</h2><span class="chip ok">${pa.nome} attivo</span><p class="lede" style="margin:10px 0 0">${pa.servizi.join(' · ')}</p></div>`;
  else if (pr) html += `<div class="card"><h2>Piano di manutenzione</h2><span class="chip warn">Richiesta "${pr.nome}" in attesa di conferma</span></div>`;
  else if (piani.length) html += `<div class="card"><h2>Piani di manutenzione</h2>${piani.map(p => `<div class="plan"><div class="data-row"><strong>${p.nome}</strong><span class="v">${euro(p.prezzo)}</span></div><div class="count-hint" style="margin:0 0 6px">Intervento entro ${p.tempo}</div><ul>${p.servizi.map(x => `<li>${x}</li>`).join('')}</ul><button class="btn btn-secondary btn-block" data-act="piano" data-id="${p.id}">Richiedi attivazione</button></div>`).join('')}</div>`;
  return html;
}

function handleAct(act, b) {
  const val = id => (document.getElementById(id) || {}).value || '';
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
  else if (act === 'piano') richiediPiano(matricola, b.dataset.id);
  else if (act === 'conferma-piano') mutaCaldaia(matricola, c => { c.piano_attivo = c.richiesta_piano.piano_id; c.richiesta_piano = null; });
  else if (act === 'rifiuta-piano') mutaCaldaia(matricola, c => { c.richiesta_piano = null; });
  else if (act === 'guasto') uView = 'guasto';
  else if (act === 'codice') { uCtx.code = b.dataset.code; uCtx.node = ALBERI[uCtx.code].start; uView = 'albero'; }
  else if (act === 'codice-altro') { uCtx.code = val('codiceAltro').trim().toUpperCase() || 'N/D'; if (ALBERI[uCtx.code]) { uCtx.node = ALBERI[uCtx.code].start; uView = 'albero'; } else uView = 'invia-guasto'; }
  else if (act === 'si' || act === 'no') { const nx = A.n[uCtx.node][act]; if (nx === 'ok') uView = 'risolto'; else if (nx === 'tec') uView = 'invia-guasto'; else if (nx === 'gas') uView = 'gas'; else uCtx.node = nx; }
  else if (act === 'risolto-fine') { aggiungiSegnalazione(matricola, { codice: uCtx.code, stato: 'risolta autonomamente' }); uView = 'home'; }
  else if (act === 'invia-guasto') { aggiungiSegnalazione(matricola, { codice: uCtx.code, descrizione: val('gDesc'), contatto: val('gTel'), stato: 'inviata al centro' }); uView = 'guasto-ok'; }
  render();
}
document.getElementById('content').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) handleAct(b.dataset.act, b); });

function renderTecnico(caldaia) {
  const tecnico = currentTecnico();
  const centroLoggato = tecnico.centro_id;
  const centro = getCentro(centroLoggato);

  let html = `<div class="card">
    <h1>Caldaia <span class="matricola">${matricola}</span></h1>
    <p class="lede" style="margin:6px 0 0">Accesso come <strong>${tecnico.nome}</strong> — ${centro.nome}</p>
  </div>`;
  if (tecnico.ruolo === 'master') html += `<div class="card"><h2>Area master</h2><a class="btn btn-secondary btn-block" href="configuratore.html">Configuratore manutenzione →</a></div>`;

  if (!caldaia || !caldaia.centro_id) {
    const rqA = (() => { const r = richiestaPerMatricola(matricola); return r && r.centro_id === centroLoggato && r.stato === 'accettata' ? r : null; })() || {};
    html += `<div class="card">
      <h2>Prima accensione</h2>
      <p class="lede">Questa matricola non risulta ancora in gestione. Compila i dati per prenderla in carico con ${centro.nome}.${rqA.nome ? ' Dati precompilati dalla richiesta del cliente.' : ''}</p>
      <label for="fNome">Nome cliente</label>
      <input type="text" id="fNome" placeholder="Nome e cognome" value="${esc(rqA.nome)}">
      <label for="fPosizione">Indirizzo installazione</label>
      <input type="text" id="fPosizione" placeholder="Via, città" value="${esc(rqA.indirizzo)}">
      <label for="fTipo">Modello caldaia</label>
      <input type="text" id="fTipo" placeholder="es. Baxi Luna Duo-Tec 28 kW">
      <div class="field-row">
        <div>
          <label for="fInstall">Data installazione</label>
          <input type="date" id="fInstall">
        </div>
        <div>
          <label for="fAvvio">Data avviamento</label>
          <input type="date" id="fAvvio">
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="submitPrimaAccensione" style="margin-top:16px">Registra e prendi in gestione</button>
    </div>`;
    return html;
  }

  if (caldaia.centro_id !== centroLoggato) {
    html += `<div class="card empty-state">
      Questa caldaia è già in gestione da un altro centro assistenza.<br>Dati cliente non visibili.
    </div>`;
    return html;
  }

  const g = caldaia.garanzia || {};
  html += `<div class="card">
    <h2>Dati installazione</h2>
    <div class="data-row"><span class="k">Cliente</span><span class="v">${caldaia.utente.nome}</span></div>
    <div class="data-row"><span class="k">Indirizzo</span><span class="v">${caldaia.utente.posizione}</span></div>
    <div class="data-row"><span class="k">Modello</span><span class="v">${caldaia.tipo}</span></div>
    <div class="data-row"><span class="k">Installazione</span><span class="v">${formatData(caldaia.data_installazione)}</span></div>
    <div class="data-row"><span class="k">Avviamento</span><span class="v">${formatData(caldaia.data_avviamento)}</span></div>
    <div class="data-row"><span class="k">Garanzia estesa</span><span class="v">${g.attiva ? 'Attiva fino al ' + formatData(g.scadenza) : 'Non attiva'}</span></div>
  </div>`;

  html += scadenzeHtml(caldaia);
  html += `<div class="card">
    <h2>Interventi</h2>
    <div id="listaInterventi">
      ${caldaia.interventi.length
        ? caldaia.interventi.map(i => `<div class="intervento"><span>${i.tipo} — ${i.tecnico}</span><span class="data">${formatData(i.data)}</span></div>`).join('')
        : `<div class="empty-state" style="padding:12px 0">Nessun intervento registrato.</div>`}
    </div>
    <button class="btn btn-secondary btn-block" id="aggiungiInterventoBtn" style="margin-top:14px">+ Registra intervento</button>
  </div>`;

  const piani = centro.piani || [], rq = caldaia.richiesta_piano;
  const pa = piani.find(p => p.id === caldaia.piano_attivo), pr = rq && piani.find(p => p.id === rq.piano_id);
  html += `<div class="card"><h2>Piano di manutenzione</h2>` + (pa
    ? `<span class="chip ok">${pa.nome} attivo</span><p class="lede" style="margin:10px 0 0">Intervento entro ${pa.tempo} · ${euro(pa.prezzo)}</p>`
    : pr ? `<span class="chip warn">Richiesta "${pr.nome}" del ${formatData(rq.data)}</span><div style="display:flex;gap:10px;margin-top:12px"><button class="btn btn-primary" style="flex:1" data-act="conferma-piano">Conferma attivazione</button><button class="btn btn-secondary" style="flex:1" data-act="rifiuta-piano">Rifiuta</button></div>`
    : `<p class="lede" style="margin:0">Nessun piano attivo né richieste in attesa.</p>`) + `</div>`;
  const seg = (caldaia.segnalazioni || []).slice().reverse();
  html += `<div class="card"><h2>Segnalazioni guasto</h2>` + (seg.length
    ? seg.map(g => `<div class="intervento"><span>${g.codice} — ${g.stato}${g.descrizione ? '<br><small>' + g.descrizione + '</small>' : ''}${g.contatto ? '<br><small>Tel. ' + g.contatto + '</small>' : ''}</span><span class="data">${formatData(g.data)}</span></div>`).join('')
    : `<div class="empty-state" style="padding:12px 0">Nessuna segnalazione.</div>`) + `</div>`;

  return html;
}

// --- event handlers per la vista corrente ---------------------------
function attachHandlers(caldaia) {
  const cercaCapBtn = document.getElementById('cercaCapBtn');
  if (cercaCapBtn) {
    cercaCapBtn.addEventListener('click', () => {
      const cap = document.getElementById('capInput').value;
      mostraRisultatiCentri(elencoCentriOrdinatiPerVicinanza(cap));
    });
  }

  const usaPosizioneBtn = document.getElementById('usaPosizioneBtn');
  if (usaPosizioneBtn) {
    usaPosizioneBtn.addEventListener('click', () => {
      if (!navigator.geolocation) { alert('Geolocalizzazione non disponibile su questo dispositivo.'); return; }
      usaPosizioneBtn.textContent = 'Localizzazione…';
      navigator.geolocation.getCurrentPosition(
        pos => mostraRisultatiCentri(elencoCentriPerPosizione(pos.coords.latitude, pos.coords.longitude)),
        () => { alert('Posizione non disponibile, prova con il CAP.'); usaPosizioneBtn.textContent = 'Usa la mia posizione'; }
      );
    });
  }

  const submitPrima = document.getElementById('submitPrimaAccensione');
  if (submitPrima) {
    submitPrima.addEventListener('click', () => {
      const nomeCliente = document.getElementById('fNome').value.trim();
      const posizione = document.getElementById('fPosizione').value.trim();
      const tipo = document.getElementById('fTipo').value.trim();
      const dataInstallazione = document.getElementById('fInstall').value;
      const dataAvviamento = document.getElementById('fAvvio').value;
      if (!nomeCliente || !posizione || !tipo || !dataInstallazione || !dataAvviamento) {
        alert('Compila tutti i campi prima di registrare la caldaia.');
        return;
      }
      registraPrimaAccensione(matricola, {
        nomeCliente, posizione, tipo, dataInstallazione, dataAvviamento,
        centro_id: currentTecnico().centro_id
      });
      render();
    });
  }

  const aggiungiInterventoBtn = document.getElementById('aggiungiInterventoBtn');
  if (aggiungiInterventoBtn) {
    aggiungiInterventoBtn.addEventListener('click', () => {
      const tipo = prompt('Tipo di intervento (es. Manutenzione ordinaria):');
      if (!tipo) return;
      const tecnico = currentTecnico();
      aggiungiIntervento(matricola, {
        data: new Date().toISOString().slice(0, 10),
        tipo,
        tecnico: tecnico.nome
      });
      render();
    });
  }
}

function mostraRisultatiCentri(centri) {
  const el = document.getElementById('risultatiCentri');
  el.innerHTML = centri.slice(0, 3).map(c => `
    <div class="card" style="background:var(--panel-raised); margin-bottom:10px">
      <div class="data-row"><span class="k">${c.nome}</span><span class="v">${c.comune}</span></div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" data-centro="${c.id}">Scegli questo centro</button>
    </div>
  `).join('');
  el.querySelectorAll('button[data-centro]').forEach(btn => {
    btn.addEventListener('click', () => {
      uCtx.centro = btn.dataset.centro; uView = 'avvio-form'; render();
    });
  });
}

render();
