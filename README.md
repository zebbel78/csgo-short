CS:GO Poseidon Toernooi
========================

Kort overzicht
- Enkelvoudig HTML/JS UI: `toernooi.html`.
- Kleine Node/Express server: `server.js` (slaat `POST /save` op als `data/toernooi_data.json`).

Snel starten (lokaal)

```bash
npm install
npm start
# open http://localhost:3000/toernooi.html in je browser
```

Belangrijke aantekeningen
- Voeg de lettertype-bestand `Martyric.ttf` toe aan `fonts/Martyric.ttf` als je de speciale VS-stijl wil gebruiken.
- De server schrijft toernooi-gegevens naar `data/toernooi_data.json` — deze map/file wordt door `.gitignore` uitgesloten.
- Als je de confetti wilt stoppen, refresh de pagina (de confetti draait persistent zolang een winnaar is ingesteld).

Wat is er in de repo
- `toernooi.html` — hoofd-UI en logica (bracket, semis, finale, autosave).
- `server.js` — statische server + `POST /save` voor JSON persistente opslag.
- `package.json` — startscript en dependency (`express`).
- `data/` — runtime opslag (niet onder versiebeheer).
- `fonts/` — plaats `Martyric.ttf` hier (niet onder versiebeheer).

Tips
- Run `npm install` once before `npm start`.
- To reset saved data, remove `data/toernooi_data.json`.

Problemen?
- Als `npm start` faalt, controleer Node.js versie en gebruik `npm install` opnieuw.
- Laat me weten als je wilt dat ik auto-load van `data/toernooi_data.json` bij paginalaad toevoeg.
