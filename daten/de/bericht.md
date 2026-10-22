# Sortendatenbank (deutsche Quellen): Bericht

Stand: 22.10.2026. Ergebnis eines nächtlichen Arbeitslaufs, ergänzt nach der Katalog-Erweiterung vom selben Tag (siehe „Nachtrag Katalog-Erweiterung“). Alle Zahlen beziehen sich auf `daten/de/sorten_de.json` in diesem Stand.

## Ergebnis in Zahlen

| | Anzahl |
|---|---|
| Sorten | **331** |
| davon mit mindestens einem Schnittmerkmal (Kernhaus, Kammern, Achsenhöhle, Kerne, Kelchhöhle) | **251** (mit mindestens drei: 240) |
| davon mit Eintrag in einem gemeinfreien Werk (Engelbrecht, Handbuch, Lauche) | 241 |
| davon nur Wikipedia (+ höchstens zwei Webseiten je Sorte) | 90 |
| Merkmalswerte | 17.427, davon 2.620 Schnittmerkmale im engeren Sinn (einschließlich der neuen Kernhaus- und Kernfachmaße) |
| Texte (Themenabschnitte) | 2.956, Median etwa 3.600 Zeichen je Sorte |
| Synonyme mit Beleg | 1.555 (darunter rund 400 englische, französische und niederländische Namen) |
| Bilder | 603 an 312 Sorten (235 Längsschnitt-Seiten bei Engelbrecht bzw. Schnittfotos, 254 Fruchtfotos, 75 Farbtafeln, 29 Baum, 10 Blüte) |
| Prüfskript | 0 Fehler, 0 Warnungen |

Merkmalswerte je Quelle: Engelbrecht 9.512, Illustr. Handbuch Bd. I 2.929, Wikipedia 2.301, Handbuch Bd. IV 1.298, Lauche 491, Webquellen 877.

## Dateien

- `daten/de/sorten_de.json` – Array von `Sorte` (Format aus `app/src/daten/sorte.ts`).
- `daten/de/quellen.json` – 23 Quellen (5 Werke/Datensätze, Commons, Lauches Farbtafeln, 16 Websites).
- `daten/de/katalog-luecken.md` – Angaben ohne passenden Katalogcode, mit Vorschlägen.
- `daten/de/arbeit/ergebnis/stapel_NN_notizen.md` – Arbeitsnotizen je Stapel: Identitätsfragen, Widersprüche, Scan-Lesungen.
- `daten/de/arbeit/anleitung.md` – verbindliche Regeln und Zuordnungstabelle, nach der alle Stapel gearbeitet haben.
- Skripte in `daten/skripte/de/`: `wiki_abruf.py`, `wiki_langlinks.py`, `engelbrecht_parse2.py` (+ `engelbrecht_parse.py` für die IA-OCR), `lucas_parse2.py`, `ocr_seiten.sh`, `suche.py`, `seite_bild.py`, `stapel_bauen.py`, `commons_bilder.py`, `commons_lauche.py`, `zusammenfuehren.py`, `pruefen.py`.
- Rohdaten in `daten/roh/de/` (Wikipedia-Wikitext mit Revisions-IDs, IA-OCR-Texte und Seitenindizes, eigene Tesseract-OCR von Engelbrecht). Die PDF-Scans habe ich am Ende wegen Speicherplatz gelöscht. `seite_bild.py` braucht sie; zum Nachlesen: `curl -L https://archive.org/download/<id>/<id>.pdf` nach `daten/roh/de/archive/` (ids in `quellen.json`).

Prüfen: `python3 -I daten/skripte/de/pruefen.py daten/de/arbeit/katalog.json daten/de/quellen.json daten/de/sorten_de.json --statistik`
Neu zusammenführen: `python3 -I daten/skripte/de/zusammenfuehren.py daten` (überschreibt `sorten_de.json` und `quellen.json`).

## Vorgehen

1. **Quellenwahl.**
   - Gemeinfreie Werke, digitalisiert bei Internet Archive:
     - **Theodor Engelbrecht, Deutschlands Apfelsorten (1889)**, rund 690 Sorten. Systematisch aufgebaut, mit Kernhaus- und Kammermaßen, Achsenhöhle, Kernen und der Tiefe der Kelchhöhle; zu jeder Sorte ein Längsschnitt.
     - **Illustrirtes Handbuch der Obstkunde, Bd. I (1859, Nr. 1–262) und Bd. IV (1862–65, Nr. 263–541)**, mit den Feldern Kernhaus und Kelchröhre, Herkunft, Baum, Nutzung.
     - **Lauche, Erster Ergänzungsband (1883, Nr. 690–859).**
   - Dazu 323 Artikel der Kategorie „Apfelsorte“ der deutschen Wikipedia, über die API mit Revisions-ID abgerufen, samt Sprachverweisen (en, fr, nl …).
2. **Texterkennung.**
   - Engelbrecht habe ich mit Tesseract (deu) neu erkannt. Die alte IA-OCR derselben Seite liegt zum Gegenlesen bei.
   - Für das Handbuch habe ich die Fraktur-OCR von BSB bzw. Google genutzt.
   - Die Werke sind seitengenau nach Sortennummern zerlegt (`suche.py`).
   - Brüche, Maße und Wertzeichen, die in der OCR unlesbar waren, wurden am Scanbild nachgelesen (`seite_bild.py`).
3. **Auswahl.**
   - 205 Wikipedia-Sorten, die vor etwa 1950 bekannt waren und in Deutschland oder Mitteleuropa verbreitet sind, darunter die norddeutschen Lokalsorten.
   - Dazu 128 Sorten nur aus Engelbrecht und dem Handbuch: Kalvillen, Schlotteräpfel, Gulderlinge, Rosenäpfel, Taubenäpfel, Ramboure, Renetten, Peppinge, Parmänen, Streiflinge, Plattäpfel.
   - Zwei Dubletten wurden zusammengelegt (Eveapfel = Manks Küchenapfel, Weißer Taffetapfel = Weißer Wintertaffetapfel). Rother Jungfernapfel entfiel, weil er der Böhmische Rote Jungfernapfel ist.
4. **Bearbeitung in 31 Stapeln** zu je 11 Sorten durch parallele Unteragenten, alle nach derselben Anleitung und Zuordnungstabelle.
   - Je Sorte wurde zuerst die Identität mit den Einträgen der alten Werke geprüft.
   - Danach Merkmale mit Code, Originalwortlaut und Beleg (Werk, Band, Seite, Engelbrecht-Nr. bzw. Wikipedia-Versions-URL) und Texte in eigenen Worten nach Themen.
   - Widersprüche zwischen Quellen sind mit beiden Werten und eigenem Beleg aufgenommen und im Text genannt.
5. **Zusammenführung** (`zusammenfuehren.py`):
   - Quellen vereinheitlicht.
   - Bilder ergänzt: die Engelbrecht-Seite mit dem Längsschnitt-Holzschnitt (IA-Seitenbild, gemeinfrei), die Fotos aus dem Wikipedia-Artikel (Commons, Lizenz und Urheber je Bild) und Lauches Farbtafeln der „Deutschen Pomologie“ (Commons, gemeinfrei), letztere über Namen und Synonyme zugeordnet.

## Wichtige Zuordnungsregeln (Auslegungen)

Die vollständige Tabelle steht in `daten/de/arbeit/anleitung.md`. Diese Regeln prägen die Daten am stärksten:

- **Engelbrecht „Gestalt 62:56—58“** bedeutet Breite 62 mm und Höhe 56–58 mm. Gespeichert sind Breite, Höhe (Mittelwert) und Höhe/Breite.
- **Kelchhöhle:**
  - Die Tiefe entscheidet. Engelbrecht gibt sie als Bruchteil des Wegs zur Achsenhöhle an.
  - Kegel unter ½ → `dreieck_breit`, ab ½ → `dreieck_lang`.
  - Kegeltrichter oder Trichter unter ½ → `trichter_kurz`, ab ½ → `trichter_lang`, bis zur Achsenhöhle → `roehre_kernhaus`.
  - Im Handbuch: „Kelchröhre kurz, cylindrisch“ → `trichter_kurz`.
- **Kernhausform nach dem Grundwort:** „eizwiebelförmig“ → zwiebelförmig.
- **Kammern:**
  - „nicht oder wenig offen“ ergibt zwei Werte (geschlossen und teilweise).
  - „Kernhaus offen/geschlossen“ im Handbuch ohne Nennung der Achse → Kernfächer.
- **Achsenhöhle:** „schmal“ zählt als offen.
- **Grundfarbe** wird in der Genussreife angegeben.
- **Spannweiten** („halb offen bis offen“) ergeben höchstens zwei Werte mit demselben Beleg. Mehrere Werte je Merkmal bedeuten also Spannweite, Alternative oder Widerspruch zwischen Quellen.
- **Engelbrechts Wertzeichen:** o/oo → Tafel, †/†† → Küche (Haushalt).
- **Schweigen der Quelle ergibt keinen Wert.** So wird „keine Berostung“ nur codiert, wenn es dasteht.
- **Engelbrechts „Kerne zu 2“** gilt je Kammer und ist deshalb nicht als `kerne_anzahl` erfasst.

## Lücken

- **90 Sorten ohne Eintrag in den alten Werken**, also ohne oder fast ohne Schnittmerkmale. Betroffen sind vor allem Sorten, die nach 1889 bekannt wurden, und Lokalsorten, darunter wichtige norddeutsche:
  - Altländer Pfannkuchenapfel, Finkenwerder Herbstprinz, Holsteiner Cox, Horneburger Pfannkuchen, Juwel und Ruhm aus Kirchwerder
  - Wohlschmecker aus Vierlanden, Stina Lohmann, Tietjenapfel, Rosa Claussen, Seestermüher Zitronenapfel, Dithmarscher Paradiesapfel, Wilstedter Apfel, Martini, Holländer Prinz
  - außerdem Berlepsch, James Grieve, Ingrid-Marie, Golden Delicious und Brettacher

  Hier helfen nur neuere, nicht freie Werke (Petzold, Votteler, Hartmann), Sortenblätter des Pomologen-Vereins oder eigene Aufnahmen. 23 dieser 90 Sorten haben wenigstens einzelne Schnittangaben aus Webquellen (vor allem Arche Noah, Pomologen-Verein, KOB) oder aus Wikipedia, z. B. Horneburger Pfannkuchen, Ingrid-Marie, Weißer Klarapfel, Signe Tillisch, Roter Krieger.
- **Sehr dünne Datensätze (unter 10 Merkmale):**
  - Anhalter, Apfel aus Grünheide, Apfel aus Lunow, Ausbacher Roter, Birkenfelder Rotäpfelchen, Brettacher, Diedenshausener, Edler von Leipzig, Engelsberger Renette, Erbachhofer Weinapfel, Finkenwerder Herbstprinz, Freiburger Prinzenapfel
  - Gehrers Rambour, Gelber Winterkalvill, Himbacher Grüner, Knebusch, Potts Sämling, Purpurroter Zwiebelapfel, Roter Metternich, Tulpenapfel, Unseldapfel
  - Fürst Blücher und Korbiniansapfel haben keine Merkmale. Beim Korbiniansapfel ist es Absicht: Nach Bannier, wiedergegeben in Wikipedia, sind die verbreiteten Bäume Stina Lohmann.
- **Schwach belegte Merkmale:** `kernhaus_lage` (29 Sorten), `kernfaecher_form` (16), `kerne_anzahl` (1), `schale_berostung_kelchgrube` (17), `bluete_zeit` (67), `ploidie` (40), `stiel_laenge` (105). Die alten Werke beschreiben diese Merkmale anders, als der Katalog sie fasst (siehe `katalog-luecken.md`).
- **Katalog:** Juni, „flachrund“, mittelfrüh/mittelspät und die Kernhaus-/Kernfachmaße sind seit der Erweiterung vom 22.10.2026 im Katalog und nachgetragen (siehe unten). Weiter offen:
  - die Tiefe der Kelchhöhle als Messwert
  - Engelbrechts beständige Blütenmerkmale (Kelchblättchen, Pistille)
  - Kerne je Kammer
  - weitere Kernhausformen (lanzettlich, melonenförmig)
- **Nicht ausgewertete Werke:**
  - Handbuch Bd. VII und VIII (Äpfel ab Nr. 542; nur schlechte OCR vorhanden), Diel, Dittrich, Lauches „Deutsche Pomologie“ als Text, Deutschlands Obstsorten, Hogg, Beach, Leroy.
  - Mehrere Sorten verweisen bei Engelbrecht auf Bd. VIII (z. B. Jonathan, Rote Sternrenette, Fromms Goldrenette, Winter-Rambour).
  - Bd. I des Handbuchs ist bei der BSB nur als 330-MB-Scan vorhanden. Er wurde wegen Speicherplatz nicht für Scan-Lesungen genutzt, die OCR ist dort aber gut.
- **MUNQ-Codes:** keine. Keine der Quellen nennt sie. Für den Abgleich mit NFC stehen englische und französische Synonyme bereit.

## Unsicherheiten, die ein Pomologe prüfen sollte

- **Gleichsetzungen, die sich nur auf Wikipedia oder Namensgleichheit stützen:**
  - Aachener Hausapfel = Cornelis Hausapfel (Engelbrecht Nr. 618, HB IV Nr. 523)
  - Celler Dickstiel = Woltmanns Renette; die alten Werke nennen den Stiel dünn
  - Peter Broich = Kaiser Wilhelm
  - Roter Brasil = Mecklenburger Königsapfel; die Reifezeit weicht ab
  - Doppelter Melonenapfel = Engelbrecht Nr. 63
  - Lavanttaler Bananenapfel = Lauches Mutterapfel
  - Welschisner = Großer Böhmischer Brünnerling (Lauche Nr. 712)
  - Kalterer Böhmer = Engelbrechts „Mantuaner“ (Nr. 204)
  - Apfel von Åkerö = Engelbrecht Nr. 89
  - Pommerscher Krummstiel = Gestreifter Römerapfel
- **Bewusst nicht zugeordnet, aber möglicherweise identisch:**
  - Roter Bellefleur ↔ Holländischer Bellefleur (E Nr. 431)
  - Eifeler Rambur ↔ Winter-Rambour (E Nr. 280; jetzt zwei getrennte Datensätze)
  - Gelbe Sächsische Renette ↔ Meißner Zitronenapfel (zwei Datensätze)
  - Gestreifter Matapfel ↔ Berliner Schafsnase
  - Siebenschläfer ↔ Lauche Nr. 828
  - Uelzener Rambour ↔ Apfel von Uelzen
  - Purpurroter Cousinot: Der heutige Cousinot ist laut Wikipedia nicht Diels Sorte. Deshalb sind die Einträge bei Engelbrecht und im Handbuch nicht übernommen.
  - Antonowka ↔ Possarts Nalivia: Die alten Werke trennen beide Sorten, Wikipedia setzt sie gleich.
- **Blutapfel:** Der Wikipedia-Artikel beschreibt einen Zierapfel. Der Datensatz beruht nur auf Engelbrecht Nr. 651 und HB IV Nr. 356.
- **OCR und Scan:** Einige Kelchhöhlen-Brüche sind auch am Scan nicht sicher lesbar, etwa ⅖ gegenüber ⅔ (z. B. Ribston Pepping, Rote Sternrenette, Königs-Fleiner, Lothringer Rambour, Wellington). Dort fehlt der Code, oder der Fall ist in den Notizen markiert. Engelbrechts Wertzeichen sind teils nur aus der OCR erschlossen.
- **Fotos auf Commons:** Ob die Fotos wirklich die genannte Sorte zeigen, ist nicht geprüft. Die Art (Frucht, Schnitt, Baum) ist aus Dateiname und Beschreibung abgeleitet.
- **Engelbrecht-Bilder:** Verlinkt ist jeweils die ganze Buchseite (Längsschnitt oben, Beschreibung darunter). Der Holzschnitt ist nicht ausgeschnitten.
- **Alter der Angaben:** Die Werke von 1859–1889 beschreiben Früchte ihrer Zeit, oft von Zwergstämmen. Größen, Färbung und Reifezeiten können von heutigen norddeutschen Hochstämmen abweichen. Engelbrecht weist selbst darauf hin, dass diese Merkmale stark schwanken und Kammer-, Kern- und Kelchhöhlenform beständiger sind.

## Nachtrag Katalog-Erweiterung (22.10.2026)

Der Nutzer hat den Katalog um den Juni (Code `6`), die Kernhausform `flachrund`, die Blütezeiten `4` mittelfrüh und `6` mittelspät sowie die Messwerte `kernhaus_breite_mm`, `kernhaus_hoehe_mm`, `kernfach_breite_mm`, `kernfach_hoehe_mm` erweitert. `daten/skripte/de/nachtrag_katalog.py` (aufgerufen von `zusammenfuehren.py`) trägt die Werte ohne neue Downloads nach, aus den gespeicherten Originalangaben und den zerlegten Quelltexten:

| Merkmal | neue Werte | Herkunft |
|---|---|---|
| `kernhaus_breite_mm` / `kernhaus_hoehe_mm` | je 213 | Engelbrecht „Kernhaus B:H“. Vorrang hat der vom Bearbeiter (oft am Scan) geprüfte Wortlaut im Feld `original` (207 Sorten); sonst nur, wenn beide OCR-Fassungen dieselben Zahlen zeigen |
| `kernfach_breite_mm` / `kernfach_hoehe_mm` | je 175 | Engelbrecht „Kammern B:H“, gleiche Regel; Spannen („12—13:17“) als Mittelwert |
| `genussreife_ende` = Juni | 21 | Engelbrecht-Kopfzeile „… bis Juni“ (17; beide OCR-Fassungen oder ausdrückliche Scan-Lesung im Sortentext), Handbuch „hält oft/bis Juni“ (2), Wikipedia (2) |
| `kernhaus_form` = flachrund | 14 | Engelbrecht, nur wenn „flachrund“ Grundwort ist („flachrund bis zwiebelförmig“, „mehr flachrund als eiförmig“, „sehr flachrund“); „flachrund zwiebelförmig“ bleibt zwiebelförmig |
| `bluete_zeit` = mittelfrüh/mittelspät | 15 (13 mittelfrüh, 2 mittelspät) | Wikipedia (11 mittelfrüh, 2 mittelspät), Handbuch Bd. I (2 mittelfrüh) |

Jeder neue Wert hat Beleg (Werk, Seite bzw. Engelbrecht-Nr. oder Wikipedia-Versions-URL) und Originalwortlaut. Die Texte sind unverändert; sie nannten diese Angaben schon. Nicht nachgetragen sind Juni-Angaben, wenn dieselbe Quelle bereits ein anderes Ende der Genussreife hatte (z. B. Handbuch „bis gegen Johannis“ beim Deutschen Goldpepping neben einem früheren Ende). Ebenso fehlen Blütezeiten aus Webseiten, weil dafür neue Abrufe nötig gewesen wären.

## Lizenzen

- **Engelbrecht, Handbuch, Lauche:** gemeinfrei. Die Autoren sind vor 1956 gestorben (Engelbrecht 1892, Lucas 1882, Oberdieck 1880, Lauche 1883). Die Texte in der Datenbank sind eigene Formulierungen; kurze Zitate stehen in Anführungszeichen. Im Feld `original` steht der Wortlaut der Quelle.
- **Wikipedia:** CC BY-SA 4.0. Übernommen sind nur Fakten in eigenen Worten. Jeder Beleg nennt die Artikelversion (oldid); die Urheberschaft ergibt sich aus deren Versionsgeschichte.
- **Webquellen:** nur einzelne Fakten, kein Text, Lizenzvermerk „Fakten, Text nicht übernommen“. Die BUND-Lemgo-Datenbank wurde nur punktuell genutzt (4 Sorten, meist Synonyme), nicht systematisch ausgelesen.
- **Bilder:** Lizenz und Urheber stehen je Bild; Commons-Bilder stehen meist unter CC BY-SA. Für eine Veröffentlichung der App muss die Namensnennung angezeigt werden.
