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
