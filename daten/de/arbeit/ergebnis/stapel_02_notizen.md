# Stapel 02 – Notizen

Stand: Nachbearbeitung am 22.10.2026. Antonowka wurde mit Lauches eigener Beschreibung (Erg.-Band S. 7–8) ergänzt, die Seiten wurden gegen das korrigierte Suchwerkzeug geprüft, die Kelchhöhlen-Brüche im Scan nachgelesen und die neuen Geschmacksregeln angewandt.

## Weggelassene Sorten
Keine. Alle 11 Sorten sind bearbeitet.

## Zuordnungen und Unsicherheiten
- **Antonowka**: Grundlage sind Engelbrecht Nr. 150 (S. 170) und Lauche, Erg.-Band Nr. 693 (S. 7–8). Rosenthals „Zusätze und Berichtigungen“ sind vollständig entfernt (v. Regel 1862, Kritik an der Schreibweise). Wikipedia führt „Possarts Nalivia“ als Synonym. Engelbrecht beschreibt Possart's Nalivia aber als eigene Sorte (Nr. 21, S. 24; Calvillen, Ende Nov.–Febr., Kammern offen), ebenso das Handbuch Bd. I, S. 193. Diese Beschreibungen sind **nicht** übernommen. Das Synonym ist nur mit Wikipedia belegt, der Unterschied steht im Text `unterscheidung`. Im Scan von Lauche S. 7 steht neben dem Sortennamen eine **handschriftliche** Randnotiz eines Lesers („Possarts Nalivia … Monatshefte 1872 S. 341“). Sie gehört nicht zum Druck und wurde nicht verwendet, spricht aber für eine alte Gleichsetzung. Pomologisch klären.
- **Antonowka, Maße**: Lauche druckt „etwa 85 mm hoher und 80 mm breiter Apfel“ (im Scan geprüft). Engelbrecht zitiert Lauche dagegen als „85:74—75“ (Breite:Höhe). Übernommen sind Lauches gedruckte Werte (B 80, H 85) und Engelbrechts eigene Messung (83:70–72), beide mit eigenem Beleg.
- **Apfel von Åkerö**: Zugeordnet ist Engelbrecht Nr. 89, S. 99 („Apfel von Akerö (Eng.)“). Name, länglich ei- bis walzenförmige hellgelbe Frucht und Reife Okt.–Jan. passen. Engelbrecht kannte keine Beschreibung. Ich halte die Zuordnung für sicher, eine Bestätigung wäre gut. Gestalt im Scan geprüft: 67:65–69. `seite_bild.py E:89` findet den Eintrag nicht (er hängt an Nr. 88); das Bild über `E:88 --unten` geht.
- **Gelber Winterkalvill**: Nur Handbuch Bd. I, S. 35. Das Handbuch beschreibt nur Abweichungen vom Weißen Winterkalvill. Dessen Merkmale wurden nicht übertragen, deshalb gibt es nur 3 Merkmale und keine Schnittwerte. „White Easter“ (London Catalogue) ist nicht als Synonym aufgenommen, weil das Handbuch die Gleichheit nur vermutet.
- **Langer Himbeerapfel**: Christs „Rother Himbeer-Apfel“ steht nur im Text („dürfte wohl dasselbe sein“), nicht als Synonym.
- **Herzog Bernhard**: Dittrich zitiert Engelbrecht (Scan) mit I, p. 131. Seite nicht übernommen.
- **Baumanns Renette**: Synonym „Reinette de Bollvilla“ in der Schreibung von Wikipedia (Götz/Silbereisen). Gemeint ist vermutlich Bollweiler; nicht geprüft.
- **Fraas' Sommerkalvill**: Der zweite Name aus den „Kernobstsorten Württembergs“ ist in der OCR verstümmelt und wurde weggelassen.

## Seitenprüfung (aktuelle Ausgabe von suche.py)
Alle Handbuch- und Lauche-Belege stimmen mit dem Eintragsbeginn bzw. der Seite der Angabe überein: HB I Nr. 2 S. 35; Nr. 4 S. 39; Nr. 82 S. 195 (Beschreibung 196); Nr. 83 S. 197 (Beschreibung 198); Nr. 226 S. 485 (Beschreibung 486); HB IV Nr. 267 S. 9; Lauche Nr. 693 S. 7 (Herkunft, Gestalt, Kelch, Stiel) und S. 8 (ab Schale). Eine Korrektur war nur bei Lauche nötig (vorher S. 5 = Rosenthal).

## Wertzeichen (Engelbrecht)
Im Scan stehen Kreuze („o††“, „oo††“, „fast oo†“). Gedeutet als o/oo → `tafel` und †/†† (= +/++) → `kueche`. Im Scan geprüft: Antonowka „o††“, Herzog Bernhard „o††“, Fraas „fast oo†“, Åkerö „oo††“. Nur nach OCR (Kopf nicht im Bildausschnitt): Langer Himbeerapfel („0044“/„OOft“), Roter Gravensteiner („001}f“/„ooift“), Baumanns Renette („0044“/„OOft“); im Feld `original` vermerkt. Die Stern- und Plus-Zeichen im Handbuch wurden nicht ausgewertet.

## Kelchhöhle (im Scan nachgelesen)
- Langer Himbeerapfel: „kegel- bis kegeltrichterf., ½ zur Achsenh.“ → `dreieck_lang` + `trichter_kurz`.
- Herzog Bernhard: „kegel-, oft ziemlich trichterf., ½ bis ¾“ → `dreieck_lang`.
- Fraas' Sommerkalvill: „kegelf., zuweilen etwas kegeltrichterf., ⅗ bis ⅔“ → `dreieck_lang`.
- Roter Gravensteiner: „kegelf., ¾ zur Achsenh.“ → `dreieck_lang`.
- Apfel von Åkerö: „trichterförm. mit breiter Röhre, ⅗ bis ⅔“ → `trichter_lang` (Röhre reicht über die Hälfte).
- Baumanns Renette: „trichter- oder kegeltrichterf., bald kaum ½, bald ¾“ → `trichter_kurz` (unverändert, Text ergänzt).
- **Antonowka: „kegelf., ⅖ zur Achsenh.“** Die Tabelle deckt nur „höchstens ⅓“ (breit) und „½ oder tiefer“ (lang) ab; ⅖ liegt dazwischen. Aus Engelbrecht deshalb kein Code, Code `dreieck_lang` nur aus Lauche („Kelchröhre lang-kegelförmig“). **Katalog-/Tabellenlücke**.

## Geschmack (neue Regeln)
Ergänzt: Lunow „süß-säuerlich“ → 5/5 (Wikipedia); Åkerö „süß-sauer bis süßweinig“ → Süße 5 und 7, Säure 5 (Wikipedia); Antonowka (Lauche), Herzog Bernhard (HB), Roter Gravensteiner (HB) „süßweinig“ → Süße 7, Säure 5; Baumanns Renette (HB) „weinartiger Zuckergeschmack“ → Süße 7, Säure 5; Fraas' Säure von 7 auf 5 („mild weinig“). Nicht codiert: Fraas HB „süßweinsäuerlich“ (Mischform, keine Regel). Herzog Bernhard Saftigkeit nach Scan korrigiert: „mässig saftig“ → 5 (die OCR hatte „mässig“ verloren).

## Katalog-Lücken / nicht codiert
- Roter Gravensteiner, `kernhaus_form`: „mehr flachrund als eiförmig“ (Engelbrecht Nr. 29). Kein Code.
- Langer Himbeerapfel, `frucht_form`: Handbuch „lang, stumpf zugespitzt, fast walzenförmig“. Nicht codiert („fast“).
- `kernfaecher_form`: „stielw. spitz, kelchw. abgerundet“ (mehrere Sorten) hat keine Entsprechung.
- `stiel_laenge`: mm-Angaben nur im Text.
- Antonowka, `geschmack`: Engelbrecht „vorherrschend weinig, mässig süss“ als Säure 7 / Süße 5 codiert; „mäßig süß“ steht nicht in der Tabelle. Herzog Bernhard „vorherrschend weinig, genügend süss“ ebenso. Åkerö und Baumanns „etwas vorherrschend weinig, nicht viel weniger süß“ als 5/5 codiert.
- `bluete_zeit`: Baumanns Renette „mittelfrüh“ (Wikipedia). Liegt zwischen 3 und 5, nicht codiert.
- `ploidie`: Ausbacher Roter – Wikipedia erwähnt nur „triploide Pollen“ („vermutlich“ schlechter Pollenspender). Nicht codiert.
- `baum_wuchs`: Baumanns („wächst fast stark“), Herzog Bernhard, Langer Himbeerapfel (jung lebhaft, bleibt klein) und Gelber Winterkalvill (nur Vergleich) nicht codiert. Bei Åkerö widersprechen sich die Quellen (Wikipedia), nicht codiert.
- Gelber Winterkalvill, `schale_deckfarbe_anteil`: „selten, doch zuweilen … roth verwaschen“. Nicht codiert.
- Apfel aus Grünheide, `frucht_gewicht`: „450 bis 600 Gramm“ als Mittelwert 525 eingetragen.
- Åkerö, `pflueckreife`: „bis in den November hinein geerntet“ → 11.
- Antonowka: Wikipedia „Früchte werden im September reif“ ist nicht codiert, weil unklar ist, ob Pflück- oder Genussreife gemeint ist.

## Widersprüche zwischen Quellen (beide Werte aufgenommen)
- Antonowka: Form rundlich eiförmig (E) gegenüber kegelförmig (Lauche); Kammern nicht oder wenig offen (E) gegenüber geöffnet (L); Punkte zahlreich, braun (E) gegenüber zerstreut, hellgelb (L); Stiel dünn bis mitteldick (E) gegenüber stark, kurz (L); Stielgrube mäßig weit (E) gegenüber eng (L); Genussreife Okt.–Nov. (E) gegenüber Nov. (L).
- Langer Himbeerapfel: Genussreife Nov.–Jan. (E) gegenüber Ende Okt.–Dez. (HB); Schale „nicht deutlich fettig“ (E) gegenüber „etwas fettig“ (HB).
- Herzog Bernhard: Stiel mitteldick (E) gegenüber dünn (HB); Punkte sparsam, fein (E) gegenüber „eigentliche Punkte … nicht vorhanden“ (HB).
- Fraas' Sommerkalvill: Kammern „schmal geöffnet“ (E) gegenüber „weit offen“ (HB); Kerne meist vollkommen (E) gegenüber nicht vollkommen (HB); Hälften wenig verschieden (E) gegenüber ungleichhälftig (HB).
- Roter Gravensteiner: Punkte ziemlich sparsam, bräunlich (E) gegenüber ziemlich zahlreich, grün (HB).
- Baumanns Renette: Kelch halb offen bis geschlossen (E) gegenüber halb bis ganz offen (HB); Kammern bald offen, bald geschlossen (E) gegenüber geschlossen (HB); Kerne kaum mittelgroß (E) gegenüber zahlreich und groß (HB); Genussreife bis April (E) gegenüber bis März (Wikipedia).
- Apfel von Åkerö: Fleisch mürbe, hellgelblichweiß (E) gegenüber fest, weiß (Wikipedia); Streifung „nicht oder nicht deutlich“ (E) gegenüber „dezente Längsstreifen“ (Wikipedia).

## OCR-Stellen
- Langer Himbeerapfel Handbuch: Maßangabe in Zoll verstümmelt, nicht verwendet.
- Engelbrecht Nr. 72 (Name) ist im Datensatz nicht vorhanden; im Text zu Åkerö steht nur die Nummer.

## Webquellen
- BUND-Lemgo-Seite zum Apfel aus Lunow: übernommen ist nur das Synonym „Apfel von Lunow“.
- Ausbacher Roter: Das Sortenblatt des Pomologen-Vereins (Hessische Lokalsorte 2008) ist nicht mehr abrufbar (404), die BUND-Lemgo-Seite ist leer. Es gibt keine Quelle mit Fruchtbeschreibung.
- Apfel aus Grünheide und Apfel aus Lunow: nur Wikipedia, keine Schnittangaben.
