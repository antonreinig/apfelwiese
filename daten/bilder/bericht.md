# Farbmessung aus Referenzbildern – Bericht

Stand: 22.10.2026, 05:10. Ausgabe: `daten/bilder/farbmessung.json` (`{ schluessel: Farbmessung[] }`), wird atomar geschrieben (`.tmp` + rename).

## Umfang

| methode | Quelle | Sorten | gültige Bilder |
|---|---|---|---|
| NFC-Foto | National Fruit Collection, Brogdale (Commons, OGL 2) | 1692 | 1728 von 1729 |
| Aquarell | USDA Pomological Watercolor | 1546 | 3396 von 3655 |
| Farbtafel | Lauche, Deutsche Pomologie 1882–83 | 93 | 93 von 100 |
| Umrisszeichnung | USDA, ungefärbte Bleistiftschnitte (nur `hoeheZuBreite`) | 35 | 37 |
| Foto | Wikimedia Commons, Sortenangabe ungeprüft | 68 | wenige, die meisten verworfen |

Gesamt: 3215 Sorten, 5294 Messungen.

`methode` enthält die Kurzbezeichnung. Die ausführliche Verfahrensbeschreibung steht im Zusatzfeld `verfahren`. Das ist im TypeScript-Interface `Farbmessung` noch nicht deklariert.

## Verfahren NFC-Foto (Version 10)

- Gemessen werden die Fototafeln „Cross section of …“: vier ganze Früchte, ein Längs- und ein Querschnitt, graublauer Grund, Maßstab. Hälften, Etikett und Maßstab sind ausgeschlossen.
- Weißabgleich über den Hintergrund. Gerechnet wird an einer Kopie mit 640 px Breite, die nur im Speicher liegt.
- Schalenpixel werden einzeln klassifiziert:
  - Grundfarbe: Median der beleuchteten gelbgrünen Pixel (Farbton 72–135°, a* < 12).
  - Deck: a* liegt mindestens 12 über der Grundfarbe (rot, rosa, orange, braunrot), unabhängig von der Helligkeit.
  - Rost: ocker- bis zimtbraun und matt, dunkler als die Grundfarbe.
  - Sehr dunkle Pixel, die nicht eindeutig rot sind, gelten als Schatten und zählen nicht mit.
- `deckfarbeAnteil` ist der Anteil der Deckpixel an Grund + Deck + Rost.
- Die Deckfarbe ist der Median der kräftiger roten Hälfte der Deckpixel.
- `fleischfarbe` kommt aus den Schnittflächen, `hoeheZuBreite` aus dem Längsschnitt.

Gegenüber Version 8 (k-means-Cluster) werden dunkle und entsättigte Rot- und Braunrottöne jetzt als Deckfarbe erkannt. Beispiele:

| Sorte | deckfarbeAnteil vorher | nachher |
|---|---|---|
| aivaniya | 0 | 0,17 |
| alderman | 0 | 0,16 |

Ebenfalls neu: 173 NFC-Tafeln, die in der NFC-Kategorieliste fehlten (z. B. aldwick-beauty, Anteil 0,96). Sie werden jetzt über ihr Titelschema erkannt.

Sichtprüfung: 40 Stichproben mit eingezeichneter Klassenkarte (grün Grund, rot Deck, braun Rost, grau verworfen).

## Abgleich mit den NFC-Merkmalsdaten (1716 Tafeln)

- **Höhe/Breite**: n = 1021. Mittlere absolute Abweichung 0,059, 83 % innerhalb ±0,10, Pearson r = 0,58.
- **Deckfarbenanteil** gegen die NFC-Stufe 1–9: n = 846, Spearman 0,79 (Version 8: 0,77). Median des Anteils je Stufe:

  | Stufe | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
  |---|---|---|---|---|---|---|---|---|---|
  | Anteil | 0 | 0,10 | 0,29 | 0,49 | 0,59 | 0,69 | 0,69 | 0,69 | 0,83 |

- **Grundfarbe**: Die NFC-Kategorien (Green yellow, Whitish yellow, Yellow …) unterscheiden sich im gemessenen Farbton kaum (Median 99–103°). Die Grundfarbe taugt als Farbwert, nicht zur Unterscheidung dieser Kategorien.
- **Rost**: Spearman 0,15, also nicht belastbar. Vollberostete Sorten werden nicht erkannt, weil dann gelbgrüne Referenzpixel fehlen. `rostfarbe` aus NFC-Fotos sollte vorerst nicht für das 3D-Modell verwendet werden.

## Bekannte Schwächen

- Einzelne Fruchtmasken sind falsch geschnitten (Rasterlinie schneidet ein Rechteck ab, sehr dunkle Früchte werden nicht freigestellt, z. B. hazen). Das betrifft wenige Tafeln.
- Aquarell und Farbtafel sind seit 05:10 ebenfalls auf das Pixelverfahren (Version 10) umgestellt. Sichtprüfung an 20 Stichproben (15 USDA, 5 Lauche): Rotbacken und Streifen werden erkannt. Glanzlichter auf roten Früchten zählen teils als Grundfarbe, blasse, verwaschene Streifen (z. B. peasgoods-sondergleichen) nur teilweise als Deckfarbe. Rost ist auf den Tafeln kaum noch ausgewiesen (Aquarell 67 Bilder, Farbtafel 1). Belastbar ist er dort ohnehin nicht.
- Die Commons-Fotos (Version 9, Cluster-Verfahren) haben unkontrollierte Beleuchtung und ungeprüfte Sortenangaben. Sie sind nur als letzte Quelle geeignet.

## Skripte

`daten/skripte/bilder/`: `strom_messen.py` (lädt Bilder nur in den Speicher, misst, schreibt `daten/roh/bilder/messungen_roh.json`), `messung_ausfuehren.py --nur-ausgabe` (schreibt `farbmessung.json`), `validierung.py` (Abgleich mit NFC), `messen.py` (`schalenfarben_pixel`), `analyse.py` (`analysiere_nfc`), `bilderliste.py`.
