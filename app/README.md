# Apfelwiese – App

PWA zur Bestimmung und Dokumentation alter Apfelsorten. Live: https://apfelwiese.app

Konzept, Regeln und Stand: `../CLAUDE.md`, `../docs/projektstand.md`, `../docs/ux-konzept.md`.

## Entwickeln

```bash
npm install
npm run dev -- --port 5174                   # Frontend ohne API (eigene Bäume dann „offline“)
APFEL_API=live npm run dev -- --port 5175    # /api wird an https://apfelwiese.app weitergeleitet
npx tsc -p tsconfig.app.json --noEmit        # Typprüfung Frontend
npx tsc -p api/tsconfig.json                 # Typprüfung API (Vercel Functions)
npm run build                                # Typprüfung und Produktionsbuild nach dist/
```

Im Desktop-App-Browser starten die Konfigurationen `apfelwiese` (5174) und `apfelwiese-live-api` (5175) aus `../.claude/launch.json`.

Mit `APFEL_API=live` entstehen echte Konten und Daten auf dem Live-Server. Testkonten danach löschen (Konto → Konto löschen oder `DELETE /api/konto`). Für Mails die Testadresse `delivered@resend.dev` nehmen. Den Code liest man über die Resend-API (`GET https://api.resend.com/emails`, dann `/emails/<id>`).

Testvideo als Kamerabild: `public/testfeed.mp4` (nur lokal, nicht im Deployment) und `?testfeed` an die URL hängen, z. B. `http://localhost:5174/?testfeed#/neu`.

## Tests

```bash
npm test                 # Einzeltests (node:test): Katalog, Abgleich, 3D-Parameter, Messung, Blatterkennung (ffmpeg nötig)
npm run test:api         # API gegen BASIS_URL (Standard https://apfelwiese.app), mit RESEND_API_KEY inkl. Testkonto
npm run test:e2e         # Browsertests mit Playwright (lokal mit installiertem Chrome)
npm run pruefen          # vor dem Deployment: Typprüfung, Einzeltests, Build
npm run pruefen:live     # nach dem Deployment: API- und Browsertests gegen die Live-Version
```

Das Testkonto ist `delivered@resend.dev`. Den Code liest der Test über die Resend-API, am Ende löscht er das Konto. `RESEND_API_KEY` liegt lokal in `.env.local`, bei GitHub als Secret. Die Browsertests prüfen alle Tabs auf Skriptfehler und Verstöße gegen die Sicherheitsregeln. Sie stellen auch den Fall nach, dass nach einem Update ein Teil der App fehlt. Ohne Konto klicken sie Sorten-Startseite, Sammlung und Ratgeber durch und prüfen Konto-Knopf, Region und Darstellung. Mit Konto gehen sie den ganzen Ablauf durch: Anmelden, Konto-Seite, Baum aus den Beispielfotos, Rundgang bis „Fertig“, Platz auf der Wiese, Konto löschen.

## Aufbau

| Ordner/Datei | Inhalt |
|---|---|
| `src/daten/merkmalskatalog.ts` | **Einzige Quelle** für Merkmale und Ausprägungen |
| `src/daten/sorte.ts`, `sorten.ts` | Datenformat der Sortendatenbank (jeder Wert mit Beleg), Laden des Index |
| `src/daten/baeume.ts` | Eigene Bäume und Fotos im Browser (IndexedDB), Nachholen alter Fotosätze |
| `src/daten/konto.ts` | Anmeldung, Kontostatus, Einwilligungen (`TEXT_VERSION`) |
| `src/daten/serverabgleich.ts` | Hochladen, Abgleich beim Start, Übernahme-Frage, Abmelden mit Aufräumen |
| `src/daten/abgleich.ts` | Abgleich Baum ↔ Sorten, Merkmal für Merkmal |
| `src/daten/baumModell.ts` | 3D-Parameter eines Baums (Messung, Angaben, Angleichung) |
| `src/daten/sicherung.ts` | Sicherung als Datei herunterladen und einspielen |
| `src/apfel3d/` | Parametrisches 3D-Modell: Parameter (`darstellung.ts`), Form, Schale, Stiel/Kelch, Schnitte, Bühne, Neigung, Medaillon-Bilder (`MODELL_VERSION` in `modell.ts`) |
| `src/kamera/` | Live-Blatterkennung, Kamera, Messung per Code (Entzerren, Weißabgleich, Freistellen, Maße, Farben, Ausschnitte), Worker |
| `src/seiten/` | Äpfel (`Wiese.tsx`), Baumblatt, Bestimmen, Rundgang, Angleichen, Sorten (Erkunden und Listen), Ratgeber, Bezug (alte Sorten bekommen), Sortenporträt, Wiese (`Karte.tsx`), Anmelden, Konto, Info, Installieren, Rückmeldung, Rechtliches; Entwicklerseiten Test3d, TestStielKelch, Vergleich (nur im Dev-Server) |
| `src/ui/` | Navigation, Router, Symbole, Einführung, Kontopflicht, Übernahme-Dialog, Chips, Leuchtkasten … |
| `api/` | Vercel Functions: `anmelden`, `bestaetigen`, `anfrage`, `ich`, `abmelden`, `einwilligung`, `baeume`, `foto-hochladen`, `foto`, `konto`, `rueckmeldung`, `protokoll` (Fehler aus der App), `betrieb` (Betriebsübersicht), `kachel` (Proxy für Luftbild, Wikimedia und Internet Archive), `aufraeumen` und `tagesbericht` (Cron); gemeinsame Hilfen in `api/_lib/` |
| `vercel.json` | Region fra1, Sicherheits-Header (CSP), Umleitungen `/kacheln/luftbild`, `/wm`, `/wmt`, `/ia` auf `api/kachel`, Weiterleitung der alten Domain, Cron |
| `scripts/baue-sorten.ts` | Führt `../daten/` (NFC, deutsche Quellen, Bilder) zu `public/sorten/` zusammen |
| `scripts/baue-anleitung.ts` | Erzeugt `public/anleitung/foto1–4.jpg` aus den Beispielfotos |
| `scripts/test-blatterkennung.ts`, `test-messung.ts` | Ausgabe der Blatterkennung und Messung zum Ansehen; Aufruf im Dateikopf |
| `tests/` | automatische Tests (`einheit/`, `api/`, `e2e/`), Konfiguration in `playwright.config.ts` |

## Daten im Blob-Speicher (`apfelwiese-fotos`, privat, fra1)

```
auth/anfragen/<id>.json        laufende Anmeldung (15 min gültig, Cron löscht nach 1 h)
auth/zaehler/<hash>.json       Mengenlimits (Cron löscht nach 25 h)
auth/index/<hash>.json         E-Mail-Hash → Kontokennung
auth/geloescht/<uid>.json      Marke für den Cron, Reste eines gelöschten Kontos zu entfernen
log/fehler/<datum>/<id>.json   Fehler aus App und Server (Cron löscht nach 30 Tagen)
log/ereignisse/<datum>/<id>.json neue und gelöschte Konten, Rückmeldungen (30 Tage)
n/<uid>/konto.json             Konto, Einwilligungen, Sitzungsversion
n/<uid>/baeume/<baumId>.json   Bäume ohne Bilddaten
n/<uid>/f/foto-<id>            Fotos (lokaler Schlüssel foto:<id>)
```

## Sortendaten neu erzeugen

```bash
node --experimental-strip-types scripts/baue-sorten.ts
```

Danach `MODELL_VERSION` in `src/apfel3d/modell.ts` erhöhen, wenn sich das Aussehen der Sorten ändert.

## Umgebungsvariablen (Vercel, Production und Preview)

| Name | Zweck |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | privater Blob-Speicher `apfelwiese-fotos` (fra1) |
| `RESEND_API_KEY` | Mailversand über das eigene Resend-Konto des Betreibers (Gratistarif, 100 Mails am Tag; die App begrenzt auf 80 Anmeldemails und 15 Rückmeldungen am Tag) |
| `AW_GEHEIMNIS` | Signatur der Sitzungscookies |
| `AW_PFEFFER` | geheimer Zusatz für Hashes von E-Mail- und IP-Adressen (nicht ändern, sonst finden Nutzer ihr Konto nicht mehr) |
| `ARCGIS_KEY` | Esri-Luftbild, nur auf dem Server (`api/kachel.ts`); lokal in `.env.local` für den Dev-Proxy |
| `CRON_SECRET` | Schutz der Cron-Jobs (Aufräumen stündlich, Tagesbericht 06:00 UTC) |
| `BETREIBER_EMAILS` | Konten mit Zugriff auf die Betriebsseite `#/betrieb` (kommagetrennt) |

## Betrieb

- **Firewall:** drei Rate-Limit-Regeln je IP: „Anmeldung begrenzen“ (20 je 10 min), „Bilder begrenzen“ (1.500 je min), „API begrenzen“ (600 je min). Anzeigen: `npx vercel@latest firewall status --scope anton-reinigs-projects`.
- **Domain und DNS:** apfelwiese.app bei Vercel (Registrar Vercel, läuft am 22.10.2027 ab). DNS-Einträge für Resend (DKIM `resend._domainkey`, `send` MX/TXT, `rsend`, `_dmarc`).
- **Vorschau-Deployments:** durch die Vercel-Anmeldung geschützt; Test mit `npx vercel@latest curl <url> --scope anton-reinigs-projects -- <curl-Optionen>`. Sie nutzen denselben Speicher wie die Live-Version.

## Deployment

```bash
npx vercel@latest deploy --prod --yes --scope anton-reinigs-projects
```

Vorher `npm run pruefen`, danach `npm run pruefen:live`.
