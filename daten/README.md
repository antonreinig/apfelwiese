# Daten der Sortendatenbank

Stand: 22.10.2026. Aus diesen Dateien erzeugt `app/scripts/baue-sorten.ts` die Dateien der App (`app/public/sorten/index.json` und je Sorte `<id>.json`). Jeder Merkmalswert trägt Quelle und Beleg; das Format steht in `app/src/daten/sorte.ts`.

## Ordner

| Ordner | Inhalt | Ausführlich in |
|---|---|---|
| `nfc/` | UK National Fruit Collection 2025 (Ordidge & Hale, OGL 3.0), aufbereitet auf den Merkmalskatalog: `sorten_nfc.json`, `quellen.json`, Namenszuordnung, nicht abbildbare Werte | `nfc/abbildung.md`, `nfc/namenszuordnung-offen.md` |
| `de/` | 331 deutsche Sorten aus Engelbrecht (1889), Illustrirtem Handbuch Bd. I und IV, Lauche (1883), Wikipedia und Webquellen: `sorten_de.json`, `quellen.json`, Arbeitsnotizen in `de/arbeit/` | `de/bericht.md`, `de/katalog-luecken.md` |
| `de/anbau.json` | Anbaumerkmale (Standort, Krankheiten, Wuchs, Lagerung, Verwendung), Herkunftsland, Bundesländer, Jahr und Seltenheit, aus den deutschen Sortentexten gezogen; jeder Wert mit wörtlichem Ausschnitt | `de/arbeit/anbau-anleitung.md` |
| `ratgeber/` | Recherche für den Sortenratgeber: Bezugsquellen, Pomologen-Verein, Kaufberatung (`recherche-bezug.md`), Regionalsortenlisten (`regionen.json`) und Gefährdungseinstufungen (`seltenheit.json`) mit Quellen | `ratgeber/recherche-*.md` |
| `bilder/` | Referenzbilder je Sorte (`bilder.json`), Namensaliase, Farbmessung per Code aus NFC-Fotos, USDA-Aquarellen und Lauche-Tafeln (`farbmessung.json`) | `bilder/bericht.md` |
| `roh/` | Rohdaten unverändert (NFC-CSV, MUNQ-Liste, Wikipedia-Wikitext, OCR-Texte, Bild-Cache, Messprotokolle) | – |
| `skripte/` | Aufbereitungsskripte (Python, ein Node-Skript) | Dateiköpfe der Skripte |

## Ablauf

1. **NFC:** `python3 -I skripte/nfc_aufbereiten.py roh/nfc/NFC_C_E_data_Apple_22_08_25.csv roh/munq/MUNQ_20200909.txt nfc/namenpruefung_wikipedia.tsv nfc` (aus `daten/`), prüfen mit `skripte/nfc_validieren.mjs`.
2. **Deutsche Quellen:** Skripte in `skripte/de/`, zusammenführen mit `python3 -I daten/skripte/de/zusammenfuehren.py daten`, prüfen mit `python3 -I daten/skripte/de/pruefen.py daten/de/arbeit/katalog.json daten/de/quellen.json daten/de/sorten_de.json --statistik` (aus dem Hauptordner). Die PDF-Scans wurden aus Platzgründen gelöscht, wie man sie wieder lädt, steht in `de/bericht.md`.
3. **Bilder und Farbmessung:** Skripte in `skripte/bilder/` (`strom_messen.py`, danach `messung_ausfuehren.py --nur-ausgabe`).
4. **Anbaumerkmale:** Auswertung nach `de/arbeit/anbau-anleitung.md` in `de/arbeit/anbau_teil*.json`, Seltenheitsangaben aus Überblickstexten in `de/arbeit/selten_nachtrag.json`; zusammenführen und prüfen mit `python3 -I daten/skripte/de/anbau_zusammenfuehren.py daten` (aus dem Hauptordner).
5. **App-Daten:** in `app/`: `node --experimental-strip-types scripts/baue-sorten.ts`. Danach in `app/src/apfel3d/modell.ts` `MODELL_VERSION` erhöhen, wenn sich das Aussehen der Sorten ändert, und deployen.

## Regeln

- Nur Werte aus den Quellen, nichts ergänzen. Was nicht in den Katalog passt, kommt in `nfc/nicht_abgebildet.json` bzw. `de/katalog-luecken.md`.
- Wird der Merkmalskatalog erweitert, die Abbildungen (`nfc_aufbereiten.py`, `de/arbeit/anleitung.md`) nachziehen und neu erzeugen.
- Sortengleichsetzungen (Synonyme, deutsch ↔ englisch) sind vorläufig und sollen von einem Pomologen geprüft werden.
