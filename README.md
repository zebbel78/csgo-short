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
-  de app laadt automatisch opgeslagen toernooi-data bij paginalaad (server -> fallback localStorage), en de `RESET TOERNOOI` knop reset nu programatisch zonder pagina-herlaad.

Wijzigingen sinds vorige versie
- Auto-load: de pagina probeert `/data/toernooi_data.json` te laden en valt terug op `localStorage` als de server niet bereikbaar is.
- Reset: `RESET TOERNOOI` wist UI/state en `localStorage` zonder te herladen.
- UI: inline `onclick` attributen verwijderd; event binding is nu via JS (delegatie), minder DOM listeners.
- Server: `POST /save` gebruikt non-blocking `fs.promises.writeFile`.
- Added: `.gitignore` (ignores `node_modules/`, `data/`, editor folders).

Snelle start (lokaal)

```bash
npm install
npm start
# open http://localhost:3000/toernooi.html
```

Testen en debug tips
- Als opgeslagen data niet zichtbaar is: controleer `data/toernooi_data.json` (server) of `localStorage` in browser DevTools.
- Om opgeslagen data te verwijderen handmatig: verwijder `data/toernooi_data.json` of klik `RESET TOERNOOI` in de UI.
- Confetti: als een winnaar is ingesteld, confetti kan persistent draaien totdat de winnaar verwijderd wordt (gebruik `RESET TOERNOOI`).

Bestanden van belang
- `toernooi.html` — UI
- `app.js` — client-logic (autosave, autoload, event delegation, reset)
- `server.js` — statische server + `POST /save`
- `data/toernooi_data.json` — runtime opslag (niet in repo)
- `fonts/Martyric.ttf` — optioneel: lettertype voor finale look