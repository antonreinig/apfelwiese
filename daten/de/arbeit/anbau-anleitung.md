# Anleitung: Anbaumerkmale und Herkunft aus den Sortentexten

Stand 23.10.2026. Grundlage sind die Texte in `daten/de/sorten_de.json` (Themen `baum`, `verwendung`, `reife_lagerung`, `herkunft`, `ueberblick`) und das Feld `herkunft`. Diese Texte sind bereits belegte Zusammenfassungen aus Engelbrecht (1889), Illustrirtem Handbuch, Lauche, Wikipedia und Webquellen.

## Regeln

- Nur übernehmen, was im Text steht. Nichts aus eigenem Wissen ergänzen, auch wenn es bekannt scheint.
- `original` ist ein **wörtlicher Ausschnitt** aus dem Text (Teilzeichenkette, kurz, max. ca. 120 Zeichen), der den Wert trägt.
- `thema` nennt das Thema des Textes, aus dem der Ausschnitt stammt. Die Belege übernimmt das Skript aus diesem Text.
- Widersprechen sich Quellen (z. B. „anfällig für Schorf“ nach Wikipedia, „gesund“ nach dem Handbuch), beide Werte aufnehmen.
- Allgemeine Aussagen wie „sehr gesund und dauerhaft“ ohne Krankheit nicht als Schorf/Mehltau/Krebs werten, sondern als `gesundheit`.
- Lieber weglassen als raten.

## Merkmale und Codes

| merkmal | Codes | Beispiele im Text |
|---|---|---|
| `verwendung` | `tafel`, `kueche` (Küche, Backen, Kochen, Mus, Haushalt, Wirtschaft), `most` (Saft, Most, Cidre, Apfelwein), `brennen`, `doerren` | „Tafel- und Wirtschaftsapfel“ → tafel, kueche |
| `baum_wuchs` | `3` schwach, `5` mittel, `7` stark | „wächst kräftig“, „starkwüchsig“ → 7 |
| `ploidie` | `diploid`, `triploid` | „triploid“ |
| `ertrag_beginn` | `frueh`, `mittel`, `spaet` | „trägt früh“, „Ertrag setzt spät ein“ |
| `ertrag_alternanz` | `regelmaessig`, `alternierend` | „trägt jährlich“ → regelmaessig; „alterniert“, „nur alle zwei Jahre“ |
| `gesundheit` | `3` empfindlich, `5` mittel, `7` robust | „sehr gesund und dauerhaft“ → 7 |
| `anfaelligkeit_schorf` | `3` gering, `5` mittel, `7` hoch | „anfällig für Schorf“ → 7; „wenig schorfanfällig“ → 3 |
| `anfaelligkeit_mehltau` | wie oben | |
| `anfaelligkeit_krebs` | wie oben (Obstbaumkrebs) | |
| `bluete_frost` | `3` wenig empfindlich, `7` empfindlich | „Blüte ist wenig empfindlich“ → 3; „Blüten frostempfindlich“ → 7 |
| `standort_klima` | `3` auch raue Lagen, `5` mittlere Lagen, `7` warme, geschützte Lagen | „für Höhenlagen geeignet“, „klimatisch wenig anspruchsvoll“ → 3; „braucht geschützte Lagen“ → 7 |
| `standort_boden` | `3` anspruchslos, `5` mittel, `7` anspruchsvoll (nährstoffreich, tiefgründig) | „gedeiht auch auf leichten Böden“ → 3 |
| `standort_feuchte` | `trocken` (verträgt Trockenheit), `feucht` (braucht genügend Feuchtigkeit) | „braucht feuchten Boden“ → feucht |
| `hochstamm` | `gut` (für Hochstamm, Streuobst, Straßen, Feld geeignet), `eingeschraenkt` | „empfahl ihn für Straßenpflanzungen“ → gut |
| `lagerfaehigkeit` | `3` kurz (wenige Wochen), `5` mittel (bis Winter), `7` lang (bis Frühjahr) | „hält sich bis April“ → 7 |

## Herkunft

Aus `herkunft.text` und dem Text zum Thema `herkunft`:

- `land`: ISO-Ländercode des Entstehungslands nach heutigen Grenzen (`DE`, `NL`, `FR`, `GB`, `PL`, `DK`, `RU`, `US`, `CZ`, `AT`, `CH`, `BE`, `LV`, `SE`, `CA`, …), nur wenn der Text es sagt oder ein Ort eindeutig benannt ist. Unsicher („vermutlich“) → `sicher: false`.
- `regionen`: für deutsche Herkunft die Bundesländer als ISO-Code (`DE-BW`, `DE-BY`, `DE-BE`, `DE-BB`, `DE-HB`, `DE-HH`, `DE-HE`, `DE-MV`, `DE-NI`, `DE-NW`, `DE-RP`, `DE-SL`, `DE-SN`, `DE-ST`, `DE-SH`, `DE-TH`), aus Ortsangaben abgeleitet. Historische Regionen auflösen (Aachener Land → DE-NW; Altes Land → DE-NI; Rheinland → DE-NW und DE-RP; Württemberg → DE-BW; Schlesien → land PL, Görlitz → DE-SN).
- `verbreitung`: Bundesländer, in denen die Sorte laut Text verbreitet oder häufig war oder ist („in Württemberg häufig“ → DE-BW), mit `original`.
- `ort`: genannter Entstehungsort in Kurzform („Aachener Land“, „Gravenstein, Nordschleswig“).
- `jahr`: Entstehungs- oder erste Erwähnungszeit als Zahl, wenn genannt (Jahr oder Jahrhundert als ungefähres Jahr, z. B. „um 1800“ → 1800, „16. Jahrhundert“ → 1550), mit `original`.
- `selten`: nur wenn der Text sagt, dass die Sorte heute selten, kaum noch verbreitet, gefährdet oder fast verschwunden ist; mit `original`.

## Ausgabeformat

JSON-Array, je Sorte ein Eintrag, nur Sorten mit mindestens einem Wert:

```json
{
  "id": "gravensteiner",
  "merkmale": [
    { "merkmal": "ploidie", "wert": "triploid", "original": "Die Sorte ist triploid", "thema": "baum" },
    { "merkmal": "anfaelligkeit_schorf", "wert": "7", "original": "anfällig für Schorf und Mehltau", "thema": "baum" }
  ],
  "herkunft": {
    "land": "DK", "sicher": false, "regionen": [], "ort": "Gravenstein, Nordschleswig",
    "jahr": 1669, "jahr_original": "seit 1669 in Dänemark bzw. Schleswig bekannt",
    "verbreitung": [{ "region": "DE-SH", "original": "…" }],
    "selten": { "original": "…" }
  }
}
```

`original` bei `herkunft`-Angaben stammt aus `herkunft.text` oder dem Text zum Thema `herkunft`.
