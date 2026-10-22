# Apfelwiese (Apfel-App)

PWA zur Bestimmung und Dokumentation alter Apfelsorten aus vier standardisierten Fotos pro Baum. Merkmals-Rundgang, parametrisches 3D-Modell, Sortendatenbank mit 1.911 Sorten, eigene Bäume auf einer Luftbildkarte („Wiese“).

**Live:** https://apfelwiese.app. Vercel-Projekt `apfelwiese`, Team `anton-reinigs-projects`, Code in `app/`.
**Betreiber:** Anton Reinig privat (siehe Impressum in der App).
**Stand dieser Datei:** 22.10.2026

## Zuerst lesen

1. `docs/projektstand.md`: Ziel, Entscheidungen, Umsetzungsstand, **offene Punkte und nächste Schritte**, zurückgestellte Ideen
2. `docs/ux-konzept.md`: Navigation, Bildschirme, Konto, Einwilligung, iOS-Besonderheiten
3. `app/README.md`: Befehle, Ordner, Umgebungsvariablen, Deployment
4. Nach Bedarf:
   - `docs/fotoanleitung.md`: Fotoprotokoll mit vier Äpfeln, vier Fotos und A4-Blatt
   - `docs/datenquellen-bestandsaufnahme.md`: Quellen und Lizenzen
   - `daten/README.md`: Datenpipeline der Sortendatenbank

## Grundregeln

- Der **Merkmalskatalog** (`app/src/daten/merkmalskatalog.ts`) ist die einzige Quelle für Merkmale und Ausprägungen. Erfassung, Abgleich, Erklärtexte, Rundgang und 3D-Modell lesen daraus; nichts wird anderswo hart codiert.
- **Messen per Code**, nicht per Sprachmodell. Ein Sprachmodell beschreibt höchstens mit dem Vokabular des Katalogs; eingebaut ist bisher keins.
- Äpfel werden in der App **immer freigestellt** gezeigt. Das A4-Blatt dient nur als Maßstab und Weißabgleich. Originalfotos bleiben unverändert erhalten.
- App-Vorschläge fließen **nie** als Referenz in die Sortendatenbank zurück. Dort landen nur bestätigte Bestimmungen (Pomologe, DNA, ggf. Nutzerkonsens).
- Jeder Wert in der Sortendatenbank trägt seine Quelle (Werk/Datensatz, Band, Seite) und Lizenz.
- Sprache in App und Dokumentation: Deutsch. Fachbegriffe nach dem NAP-Deskriptorenhandbuch. Code-Bezeichner sind ebenfalls deutsch (`baum`, `sorte`, `merkmal`, `speichereBaum` …); neuer Code folgt dem.
- **Datenschutz:** Neue externe Dienste, Cookies oder Datenflüsse erst einbauen, wenn die Datenschutzerklärung (`app/src/seiten/Rechtliches.tsx`) angepasst ist. Bilder fremder Server laufen über `api/kachel.ts`, Vercel-Rewrites auf fremde Hosts leiten die Nutzer-IP weiter (geprüft am 22.10.2026). Bei inhaltlicher Änderung von Nutzungsbedingungen oder Einwilligungstext `TEXT_VERSION` in `app/src/daten/konto.ts` erhöhen.

## Arbeitsweise mit dem Nutzer

- Der Nutzer (Anton) will fertige, getestete Stände **direkt live** haben: typprüfen, bauen, im Browser testen, mit `--prod` deployen, dann berichten.
- **Git:** Repository im Hauptordner, Branch `main`, öffentlich auf GitHub: https://github.com/antonreinig/apfelwiese (seit 22.10.2026). Committen und pushen nur, wenn der Nutzer darum bittet. Alles im Repository ist öffentlich: keine Schlüssel, keine privaten Kontaktdaten (auch nicht in User-Agents von Skripten). `.gitignore` hält Geheimnisse (`.env*`, `.vercel/`), Videos, PDFs und große Rohdaten (`daten/roh/bilder`, `daten/roh/de`) heraus.
- Er testet auf dem iPhone. Ich kann nur im Browser-Pane mit Handy-Ansicht testen; was nur am Gerät prüfbar ist, sage ich dazu.
- Er gibt große Aufgaben auch über Nacht ab und erwartet, dass weitergearbeitet wird.
- Kosten, Käufe, Annahme von Nutzungsbedingungen und neue Dienstkonten: vorher fragen.

## Architektur in Kürze

- **Frontend:** Vite 8, React 19, TypeScript, Hash-Router (`#/…`), vite-plugin-pwa, three.js + @react-three/fiber, Leaflet, idb-keyval. Tabs: **Äpfel** (`#/`, Start mit 3D-Apfel), **Sorten** (`#/sorten`), **Wiese** (`#/wiese`, Luftbildkarte).
- **3D:** `app/src/apfel3d/`. Parameter in `darstellung.ts`, Geometrie, prozedurale Schale, Stiel/Kelch, Schnitte. Medaillons werden einmal als Bild gerendert und gespeichert (`medaillonBild.ts`). **Nach sichtbaren Änderungen `MODELL_VERSION` in `modell.ts` erhöhen**, sonst bleiben alte Bilder im Speicher.
- **Kamera und Messung:** `app/src/kamera/`. Live-Blatterkennung (auch bei farbigem Licht), Entzerren, Weißabgleich, Freistellen, Maße, Farben, Ausschnitte je Apfel.
- **Server:** Vercel Functions in `app/api/`, Region fra1, Web-Handler `GET`/`POST`/…
  - Anmeldung per E-Mail mit sechsstelligem Code und Link. Der Code ist nötig, weil Links aus der Mail-App auf dem iPhone nicht in der Home-Bildschirm-App landen.
  - Sitzung als HMAC-signiertes HttpOnly-Cookie `aw_sitzung` (Path `/api`).
  - Daten im privaten Vercel-Blob-Speicher `apfelwiese-fotos` (fra1) unter `n/<uid>/`.
  - Fotos gehen per presigned Upload direkt vom Browser in den Speicher.
  - Änderungen an Zählern und Konten laufen atomar über ETag (`aendereAtomar` in `api/_lib/speicher.ts`).
- **Gerät ↔ Server:** Die App arbeitet lokal in IndexedDB (`app/src/daten/baeume.ts`). `serverabgleich.ts` lädt Änderungen hoch und gleicht beim Start ab. Abmelden entfernt die Daten vom Gerät.
- **Mail:** eigenes Resend-Konto des Nutzers (Gratistarif, 100 Mails am Tag), Absender `anmeldung@apfelwiese.app`, Domain bei Resend verifiziert, DNS bei Vercel.
- **Sicherheit:**
  - CSP und weitere Header in `app/vercel.json`.
  - Drei Rate-Limit-Regeln in der Vercel-Firewall.
  - Stündlicher Cron `api/aufraeumen.ts`.
  - Sicherheitsprüfung vom 22.10.2026, Ergebnisse in `docs/projektstand.md`.

## Befehle (aus `app/`)

```bash
npm run dev                                      # http://localhost:5174 über .claude/launch.json "apfelwiese"
APFEL_API=live npm run dev -- --port 5175        # Dev-Server mit /api → apfelwiese.app ("apfelwiese-live-api")
npx tsc -p tsconfig.app.json --noEmit            # Typprüfung Frontend
npx tsc -p api/tsconfig.json                     # Typprüfung API
npm run build                                    # Build nach dist/
npx vercel@latest deploy --yes --scope anton-reinigs-projects           # Vorschau (geschützt)
npx vercel@latest deploy --prod --yes --scope anton-reinigs-projects    # live
node --experimental-strip-types scripts/baue-sorten.ts                  # Sortendaten neu erzeugen
```

## Stolpersteine

- **Vercel-CLI:** Die global installierte Version ist veraltet, daher immer `npx vercel@latest`.
- **zsh:** Optionen nicht in eine Variable packen (`S="--scope …"; vercel … $S`), zsh teilt sie nicht auf. Flags ausschreiben.
- **API im Dev-Server:** Der Vite-Dev-Server hat keine `/api`. Ohne `APFEL_API=live` gilt die App dort als „offline“ und zeigt keine eigenen Bäume. Mit Live-API entstehen echte Daten: Testkonten danach löschen (`DELETE /api/konto`).
- **Vorschau-Deployments:** Sie sind durch die Vercel-Anmeldung geschützt (Test per `npx vercel@latest curl <url> --scope anton-reinigs-projects -- …`). Sie nutzen **denselben Blob-Speicher und dieselben Geheimnisse** wie die Live-Version.
- **Mails testen:** Empfänger `delivered@resend.dev`. Code und Link liest man mit dem `RESEND_API_KEY` über `GET https://api.resend.com/emails`.
- **Herkunftsprüfung:** Live sind nur `https://apfelwiese.app` und `www` als Origin erlaubt (`api/_lib/http.ts`). Anmeldelinks zeigen fest auf `APP_URL`.
- **IndexedDB je Origin:** localhost:5174, localhost:5175 und apfelwiese.app haben getrennte Daten.
- **Speicherplatz:** Die Festplatte war schon einmal voll. Große Zwischenstände ins Scratchpad legen und danach löschen. `daten/roh` und `daten/skripte` sind groß.
- **Testmaterial:**
  - `IMG_0146.MOV` im Hauptordner.
  - `app/public/testfeed.mp4` als Kamerabild: `?testfeed` an die URL hängen. Die Datei steht in `.vercelignore` und wird nicht deployt.
  - Die Testaufnahmen `IMG_0147.MOV` und `IMG_0148.HEIC` (blaues Licht) liegen nicht mehr im Ordner.
