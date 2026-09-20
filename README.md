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
