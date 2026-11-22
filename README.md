# Caldaia QR — demo

Demo statica, nessun backend: tutti i dati vivono in `localStorage`, seedati al primo caricamento.

## Deploy su GitHub Pages

1. Crea un repository (es. `caldaia-qr-demo`) e carica questi 5 file nella root.
2. Su GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. Dopo un minuto la demo è live su `https://<utente>.github.io/<repo>/`.

## File

- `index.html` — pagina scanner QR (usa la fotocamera via [html5-qrcode](https://github.com/mebjas/html5-qrcode)) + scorciatoie per test senza QR stampato. La fotocamera si attiva solo al click su "Attiva fotocamera", per non far comparire il permesso del browser al semplice caricamento della pagina.
- `caldaia.html` — scheda caldaia, legge `?id=<matricola>` dall'URL e mostra vista utente finale o tecnico in base al toggle.
- `etichette.html` — genera un PDF con 9 QR per foglio A4 a partire da una lista di matricole incollate, per stampare etichette su caldaie vecchie senza QR di fabbrica. Nella versione finale andrà dietro il login del centro assistenza; per ora è solo linkata da `index.html`, senza controllo accessi.
- `app.js` — dati di esempio + funzioni di lettura/scrittura. **Questo è l'unico file da riscrivere quando si collega Microsoft Dynamics**: le funzioni `getCaldaia`, `collegaCentro`, `registraPrimaAccensione`, `aggiungiIntervento` vanno sostituite con chiamate alle API Dynamics, l'HTML e la UI restano invariati.
- `style.css` — stile condiviso.
- `vendor/` — copie locali delle 3 librerie usate ([html5-qrcode](https://github.com/mebjas/html5-qrcode), [qrcode](https://github.com/soldair/node-qrcode), [jsPDF](https://github.com/parallax/jsPDF), tutte MIT). Caricate da qui invece che da un CDN esterno: più affidabile in ambienti con rete aziendale filtrata, e non si rompe se un pacchetto npm smette di pubblicare il proprio bundle per il browser (è già successo con `qrcode` dalla versione 1.5.2 in poi). **Ricorda di caricare anche questa cartella su GitHub**, non solo i file `.html`.

## QR code reali

Ogni QR dovrebbe incapsulare l'URL completo, non solo la matricola:

```
https://<utente>.github.io/<repo>/caldaia.html?id=CH-2024-0091
```

Così basta inquadrarlo con la fotocamera di qualsiasi telefono (senza passare dalla pagina scanner) per arrivare direttamente alla scheda. La pagina scanner (`index.html`) serve soprattutto in fase di test/demo o per un uso interno da centralino.

## Login tecnico

Per la demo il login è finto: un toggle "Utente finale / Tecnico" + una select per scegliere quale tecnico/ditta si sta impersonando. Nella versione reale questo andrà sostituito con l'autenticazione Dynamics/Entra e la ditta del tecnico verrà letta dal suo account.

## Limiti della demo

- I dati sono per-browser: non si vedono aggiornamenti fatti da un altro dispositivo (serve un backend vero per quello).
- La "vicinanza per CAP" è una simulazione (primi due numeri del CAP), non geocoding reale.
- Nessuna validazione lato server, ovviamente.

## Novità v2

- `caldaia.js` — logica condivisa delle landing; `caldaia.html` (Baxi) e `altro-marchio.html` (tema colori diverso + banner) la usano entrambe.
- `configuratore.html` — solo ruolo **master**: fino a 3 piani di manutenzione (servizi, tempo di risposta, prezzo). Gli utenti su caldaie senza piano li vedono e possono richiederne l'attivazione.
- Utente senza centro: "Richiedi primo avviamento" → scelta centro → form (in demo non salva).
- Utente con centro: "Segnala un guasto" con alberi di risoluzione demo per E10, E01, E02 (testi indicativi, da sostituire con i codici ufficiali del costruttore; in `ALBERI` dentro `app.js`).
- Etichette: selezione marchio, il QR punta alla landing del marchio scelto.
- Matricole demo: `CH-2024-0091` (collegata, 3 piani offerti), `CH-2023-0044` (non collegata), `AM-2022-0007` (altro marchio).
- Login finto: tecnici Luca Rossi (master), Marco Neri (tecnico), Elena Verdi (master).
- I dati demo usano una nuova chiave localStorage (`v2`): i dati della versione precedente non vengono letti.

## Novità v3

- Form di primo avviamento con consenso privacy (obbligatorio) e marketing (facoltativo); l'utente segue lo stato (inviata → accettata → avviata). Il link "informativa privacy" è un segnaposto da collegare al testo reale.
- Il master vede in `configuratore.html` le richieste del proprio centro (con consenso marketing) e può accettarle o rifiutarle; se accettata, i dati precompilano la prima accensione del tecnico.
- Promemoria di scadenza: prossima manutenzione (12 mesi dall'ultimo intervento) e garanzia, visibili a utente e tecnico; il master ha l'elenco delle scadenze entro 60 giorni.
- Matricola non riconosciuta: messaggio dedicato. Le matricole generate in `etichette.html` vengono censite nel sistema (in demo, solo nel browser).
- Tema chiaro/scuro (pulsante in alto a destra, `theme.js`), stile ispirato a Baxi: i colori sono approssimati, si cambiano nelle variabili in cima a `style.css`.
- Chiave localStorage `v3`: i dati demo precedenti vengono azzerati.

## Novità v4

- **Questionario "la tua assistenza ideale"** (utente, caldaia collegata): evidenzia il piano più vicino alle richieste. I piani del master ora hanno campi strutturati: manutenzione (orari d'ufficio / orario scelto dal cliente), urgenze (giornata / 48h), domenica invernale, ricambi gratuiti dopo la garanzia.
- **Semaforo ricambi** in cima alla scheda: verde (garanzia convenzionale o estensione valida), giallo (estensione a rischio per manutenzione in scadenza), rosso (a pagamento, con motivo, p.es. "estensione scaduta per manutenzione non effettuata"). La garanzia convenzionale è calcolata in demo come 24 mesi dall'avviamento (`GARANZIA_CONV_MESI`, `ESTENSIONE_BAXI` in `app.js`): vanno sostituiti con le regole reali.
- **Contratti di estensione** in due sezioni (produttore / centro); il master configura l'estensione del centro.
- **Prima accensione** completa: dati precompilati, installatore, conformità, foto, consenso richiesto di nuovo se mancante, firma del cliente, certificato via mail (simulato).
- **Bozze offline**: con la casella "Simula assenza di rete" (o senza rete vera) la prima accensione firmata si salva sul dispositivo, bloccata, e si invia quando torna la rete. `sw.js` fa funzionare le pagine anche offline dopo la prima visita (su GitHub Pages, https). Nella versione reale i dati della caldaia andranno messi in cache per il tecnico.
- **Area installatore** (`installatore.html`): creata in automatico dalla prima accensione; vede le sue caldaie (senza dati del cliente) e può contattare solo i centri collegati.
- **Rottamazione** nell'area tecnico, con nuova Baxi / altro / niente.
- Layout desktop a due colonne; contatti demo unificati (0424517800, baxi.service@baxi.it).
- Chiave localStorage `v4`: i dati demo precedenti vengono azzerati. Matricole demo nuove: `CH-2021-0123` (semaforo rosso).

## Novità v5

- **Questionario:** opzione "Indifferente" per giorno e ora; alternative in caso di urgenza a scelta multipla (climatizzatore con caldo, stufa elettrica, camino/pellet, scaldabagno elettrico, ospitalità). Le preferenze arrivano al tecnico con la richiesta.
- **Prezzi:** il master può nasconderli (piani ed estensioni): il cliente vede "su richiesta".
- **Baxi consiglia** (in `configuratore.html`): 3 piani ideali, si copiano solo i parametri (non il prezzo) e poi si modificano. Con 3 proposte già presenti chiede quale sostituire; altrimenti avvisa che è stata aggiunta. I piani sono in `BAXI_CONSIGLIA` (`app.js`).
- **Estensioni:** il tecnico può solo pre-approvare; l'approvazione definitiva, il rifiuto e la registrazione manuale dei contratti sono del master (anche dalla lista "Estensioni da approvare").
- **Storico modifiche** (solo master): chi ha fatto cosa e quando (piani, prezzi, team, richieste, estensioni, interventi, cambio proprietario…).
- **Cambio proprietario** (solo centro, area tecnico): dati e consensi del nuovo proprietario; il vecchio viene archiviato, le segnalazioni passate perdono i contatti, le richieste aperte si annullano, piano ed estensione del centro restano solo se confermato. È una bozza della logica: regole e tutele vanno validate con DPO e ufficio legale.
- **Etichette, controllo qualità:** duplicati, formato non valido, matricole già presenti (con opzione per escluderle), import da CSV/TXT.
- **Statistiche master:** guasti risolti in autonomia, codici errore più frequenti, copertura ricambi, manutenzioni in ritardo, richieste di avviamento.
- Chiave localStorage `v5`: i dati demo precedenti vengono azzerati.
- Le protezioni sui ruoli (master/tecnico) valgono solo nell'interfaccia: in produzione vanno applicate lato server.

## Novità v6 / What's new in v6

- **Aree separate.** *Cliente*: si entra scansionando il QR (`index.html` → `caldaia.html?id=…`), nessun login e nessuna funzione tecnica. *Tecnici, master, installatori*: `login.html` (login finto: si sceglie la persona), poi `staff.html` (area tecnici) o `installatore.html`. Il link "Accesso tecnici" è anche nell'area cliente: dopo il login si torna alla stessa scheda, che si apre in vista tecnico. `etichette.html` e `configuratore.html` richiedono il login (il configuratore solo master). La sessione sta in `localStorage` (`caldaia_session`), funzioni in `app.js`. In produzione sostituire con l'autenticazione aziendale e applicare i permessi lato server.
- **Inglese / English.** Pulsante IT/EN in alto a destra (scelta ricordata; predefinita dalla lingua del browser). Il codice resta in italiano: `i18n.js` traduce a runtime ogni testo visibile (testi, placeholder, alert) con un dizionario (frasi intere, regole per le frasi con valori, parole sciolte). Per correggere o aggiungere una traduzione si modifica solo `i18n.js`. I testi digitati dall'utente (nomi, note) non vengono tradotti. Se aggiungi nuovi testi in italiano e restano in italiano in inglese, vanno aggiunti al dizionario.
- Pagine nuove: `login.html`, `staff.html`, `i18n.js`. `installatore.html` ora richiede il login da installatore.
- Prova rapida: in `login.html` scegli *Luca Rossi (master)* per l'area completa, *Marco Neri (tecnico)* per quella limitata, o *Paolo Bianchi* per l'installatore.

## Novità v7 / What's new in v7 — Luna Classic

- **Alberi di risoluzione per la Baxi Luna Classic** (`alarmi.js`): si attivano quando il modello della caldaia contiene "Luna Classic" (demo: `CH-2023-0310`). Le altre caldaie usano ancora l'albero generico di prova.
- **Tre menu a tendina** (H, E, A) con tutti i 58 codici: scelto un codice compare subito il **messaggio standard** della famiglia (H temporanea, E permanente, A predittivo), poi il codice con la descrizione. I codici con procedura guidata hanno il marker ●: verifica, passi, video, esito, e i pulsanti "Il problema è risolto" / "Il problema persiste" (che porta al contatto con il centro). Gli altri mostrano messaggio, codice e il pulsante per contattare il centro.
- I video sono **segnaposto** (VIDEO_01…06): per collegare i file reali basta sostituire il blocco `.video-ph` in `caldaia.js` con un `<video>` o un link.
- I testi sono in italiano e in inglese; i codici e le descrizioni stanno in `alarmi.js`, le traduzioni in `i18n.js`.
- Chiave localStorage `v6`: i dati demo precedenti vengono azzerati.

## Novità v8–v9 / What's new in v8–v9

- **Luna Century** (`alarmi.js`, demo `CH-2022-0555`): tabelle, messaggi e video propri del modello (105 codici). Il modello si riconosce da "Luna Classic" / "Luna Century" nel nome. Nei menu non c'è più nessun marker sui codici con procedura guidata.
- **Area cliente:** centro assistenza + "Segnala un guasto" sopra il semaforo; scadenze sotto il semaforo con Scrivi / Chiama per prenotare la manutenzione. "Scrivi" e "Segnala un guasto" aprono una form (nome e cognome, email, richiesta; la matricola è nell'oggetto) e mostrano l'anteprima della mail: se il richiedente non coincide con il proprietario registrato la mail lo segnala. Richiesta di primo avviamento: email obbligatoria e avviso della mail di conferma.
- **Area tecnico:** "Apri caldaia" con matricola + codice prodotto (controllo di corrispondenza). Dati installazione con email, codice prodotto e **conferma dati cliente**: finché non è confermato le altre operazioni sono bloccate (la prima accensione firmata e un cambio proprietario lo azzerano/impostano di conseguenza). Registro intervento con dati caldaia, ricambi e note. Rottamazione con "Marca e modello" (con esempio) e installatore scelto dalla lista. Prima accensione con codice prodotto, email cliente e scelta dell'installatore dalla lista del centro.
- **Area master:** gestione segnalazioni guasto (prendi in carico / chiudi), lista installatori del centro (con aggiunta), pubblicazione dei piani con blocco ("Riapri per modifiche" per sbloccare), toggle prezzi dentro la scheda dei piani. Rimossa la sezione "Prezzi ed estensione del centro".
- Chiave localStorage `v8`: i dati demo precedenti vengono azzerati. Nuove matricole demo: `CH-2023-0310` (Classic), `CH-2022-0555` (Century, dati cliente da confermare).
