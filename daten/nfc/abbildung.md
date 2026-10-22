# NFC 2025 → Merkmalskatalog: Abbildung

Stand 22.10.2026 (dritte Fassung nach Katalogerweiterungen: neue Formcodes, „weißlich grün“, Juni, Berostung insgesamt). Quelle: Ordidge, M.; Hale, P. (2025): *Characterization and Evaluation data from the National Fruit Collection 2025_Apple*. University of Reading. DOI [10.17864/1947.001455](https://doi.org/10.17864/1947.001455). Lizenz: Open Government Licence v3.0 (laut README, Abschnitt „Terms of use“, und Metadaten der Datensatzseite, Rechteinhaber Defra). Rohdaten unverändert in `daten/roh/nfc/`.

Umgesetzt in `daten/skripte/nfc_aufbereiten.py` (Tabellen `ABB`, `BLUETE`, `OHNE_MERKMAL`). Merkmal-IDs und Codes aus `app/src/daten/merkmalskatalog.ts` (Stand 22.10.2026), geprüft mit `daten/skripte/nfc_validieren.mjs`.

## Regeln

- **Originalwert:** Jeder Merkmalswert trägt den NFC-Text in `original` (bei Messwerten nur, wenn die Quelle eine Spanne angibt, z. B. `64-70`).
- **Beleg:** `quelle: "nfc2025"`, im Feld `seite` die Akzessionsnummer. Bei Fruchtmerkmalen (Spalten 14–38 der CSV) steht dahinter die Datenquelle laut NFC-Spalte „Data Source“: `Smith 1971` (aus dem National Apple Register standardisiert) oder `NFC-Früchte` (an Früchten der Sammlung erhoben). Bei Verkostungsmerkmalen stehen Prüferin und Datum („Verkostung P. Hale, 06/11/2019“). `seite` ist hier also die Fundstelle im Datensatz, keine Buchseite.
- **ECPGR-Zwischenstufen:** Die NFC nutzt die 1–9-Skalen der ECPGR mit Zwischenstufen („Medium to large“, „Weak to medium“). Der Katalog hat nur die Stufen 1/3/5/7/9 oder weniger. Eine Zwischenstufe wird als **zwei Merkmalswerte** (beide Nachbarstufen) mit derselben Originalangabe geführt. Das bildet die Spanne ab, ohne einen Wert zu erfinden. Folge: Viele Sorten haben bei ordinalen Merkmalen zwei Werte, ohne dass sich Akzessionen widersprechen.
- **Mehrere Akzessionen:** Gleiche MUNQ = eine Sorte. Weichen Akzessionen voneinander ab, bleiben alle Werte erhalten, jeder mit eigenem Beleg (Akzessionsnummer). Gleiche Werte mehrerer Akzessionen werden zu einem Eintrag mit allen Akzessionsnummern in `seite` zusammengefasst.
- **Nicht abbildbar:** Werte ohne passendes Katalogmerkmal oder ohne passende Ausprägung stehen nicht in `merkmale`, sondern je Sorte in `daten/nfc/nicht_abgebildet.json` (NFC-Spalte, Originalwert, NFC-Code, Akzession, Grund). Sie fließen in den Überblickstext ein, weil sie belegte NFC-Angaben sind.
- **Vergröbert:** Wo mehrere NFC-Stufen auf eine Katalogstufe fallen (z. B. „Very soft“ und „Soft“ → weich), ist das in der Begründung vermerkt. Der Originalwert bleibt erhalten.

## Tabelle

| NFC-Spalte | NFC-Wert | Katalog-Merkmal | Code | Begründung |
|---|---|---|---|---|
| Type | Dessert | verwendung | tafel | Tafelapfel |
| Type | Culinary | verwendung | kueche | Küchenapfel |
| Type | Cider | verwendung | most | Most-/Cider-Apfel |
| Type | Dual-purpose | verwendung | tafel + kueche | britisch „dual purpose“ = Tafel und Küche; Katalog erlaubt mehrere Werte |
| Type | Cider (?) | – | – | Lücke: in der Quelle selbst unsicher, nicht übernommen |
| Type | Rootstock, Ornamental | – | – | Lücke: Unterlage und Zierapfel sind keine Verwendung im Sinne des Katalogs |
| Accession Name | Zusatz „(3n)“ | ploidie | triploid | Ploidieangabe der NFC im Akzessionsnamen |
| Accession Name | Zusatz „(4n)“, „(4x)“ | – | – | Lücke: Katalog kennt nur diploid/triploid; meist induzierte tetraploide Klone, nicht die Sorte |
| Fruit size | Small | frucht_groesse | 3 | klein |
| Fruit size | Small to medium | frucht_groesse | 3 + 5 | Zwischenstufe (ECPGR 4) |
| Fruit size | Medium | frucht_groesse | 5 | mittel |
| Fruit size | Medium to large | frucht_groesse | 5 + 7 | Zwischenstufe (ECPGR 6) |
| Fruit size | Large | frucht_groesse | 7 | groß |
| Fruit size | Very large | frucht_groesse | 9 | sehr groß. Achtung: NFC-Zahlencode dazu ist 8; übernommen nach dem Text |
| Fruit size (classified from width) | 2–9 | – | – | nicht übernommen: aus der gemessenen Breite abgeleitet, die direkt übernommen wird |
| Average fruit width | mm | frucht_breite | Messwert | Mittelwert der NFC; Spanne „64-70“ → Mitte (67), Original erhalten |
| Average fruit height | mm | frucht_hoehe | Messwert | wie Breite |
| Fruit height/width mean ratio (Wert) | z. B. 0,85 | frucht_hoehe_breite | Messwert | auf drei Stellen gerundet |
| Fruit height/width mean ratio (Klasse 1–5) | – | – | – | nicht übernommen: aus dem Verhältnis abgeleitet |
| Fruit shape (ECPGR) | Globose (1) | frucht_form | rund | kugelig |
| Fruit shape | Globose conical (2) | frucht_form | rundkonisch | rundlich-kegelförmig |
| Fruit shape | Broad globose conical (3) | frucht_form | breitrundkonisch | breit rundlich-kegelförmig (häufigste NFC-Form, 370 Akzessionen); Code im Katalog nach erster Fassung ergänzt |
| Fruit shape | Flat (4) | frucht_form | flachrund | stark abgeflacht; vergröbert, Katalog trennt „flach“ und „flachrund“ nicht |
| Fruit shape | Flat globose (5) | frucht_form | flachrund | flachkugelig |
| Fruit shape | Conical (6) | frucht_form | konisch | kegelförmig |
| Fruit shape | Narrow conical (7) | frucht_form | konisch | vergröbert (schmal kegelförmig) |
| Fruit shape | Truncate conical (8) | frucht_form | stumpfkonisch | stumpf kegelförmig |
| Fruit shape | Ellipsoid (9) | frucht_form | elliptisch | elliptisch (eiförmig ist eine andere Form) |
| Fruit shape | Ellipsoid conical (10) | frucht_form | elliptischkonisch | elliptisch-kegelförmig |
| Fruit shape | Oblong (11) | frucht_form | walzenfoermig | länglich mit fast parallelen Seiten |
| Fruit shape | Oblong conical (12) | frucht_form | laenglichkonisch | länglich kegelförmig |
| Presence of ribs (angepasste ECPGR-Skala 1–5) | Absence | frucht_rippung | 1 | fehlend |
| Presence of ribs | Very light | frucht_rippung | 1 | „fehlend oder sehr schwach“ |
| Presence of ribs | Medium | frucht_rippung | 5 | mittel |
| Presence of ribs | Strong | frucht_rippung | 7 | stark |
| Presence of ribs | Very strong | frucht_rippung | 9 | sehr stark |
| Fruit crowning at apex | Absent or very weak, Very weak to weak, Weak | frucht_kronung | 1 | Katalog: „fehlend oder schwach“ |
| Fruit crowning at apex | Weak to medium | frucht_kronung | 1 + 5 | Zwischenstufe |
| Fruit crowning at apex | Medium | frucht_kronung | 5 | mittel |
| Fruit crowning at apex | Medium to strong | frucht_kronung | 5 + 9 | Zwischenstufe |
| Fruit crowning at apex | Strong, Strong to very strong, Very strong | frucht_kronung | 9 | Katalog: „stark“ (dreistufig) |
| Ground colour | Yellow | schale_grundfarbe | gelb | |
| Ground colour | Whitish yellow | schale_grundfarbe | weisslichgelb | |
| Ground colour | Green yellow | schale_grundfarbe | gruengelb | grünlich gelb |
| Ground colour | Green | schale_grundfarbe | gruen | |
| Ground colour | Whitish green | schale_grundfarbe | weisslichgruen | weißlich grün (117 Akzessionen) |
| Ground colour | Orange, Red | – | – | **Lücke:** keine Ausprägung (orangegelb ist nicht orange); 7 Akzessionen |
| Amount of over colour | Absent | schale_deckfarbe_anteil | 0 | keine |
| Amount of over colour | Very low / Low / Medium / High / Very high | schale_deckfarbe_anteil | 1 / 3 / 5 / 7 / 9 | direkte Entsprechung |
| Amount of over colour | Low to medium / Medium to high / High to very high | schale_deckfarbe_anteil | 3+5 / 5+7 / 7+9 | Zwischenstufen |
| Over colour | Orange / Pink / Red / Dark red / Purple / Brownish red | schale_deckfarbe_farbton | orange / rosa / rot / dunkelrot / purpurrot / braunrot | direkte Entsprechung; ECPGR „purple“ = purpurrot |
| Over colour | Absent | – | – | kein Farbton; nicht in schale_deckfarbe_anteil übertragen (andere Spalte) |
| Pattern of over colour | Only solid flush | schale_deckfarbe_art | verwaschen | flächig ohne klare Grenzen |
| Pattern of over colour | Flush with stripes | schale_deckfarbe_art | verwaschen + gestreift | Merkmal erlaubt mehrere Werte |
| Pattern of over colour | Only stripes | schale_deckfarbe_art | gestreift | |
| Pattern of over colour | Mottled | schale_deckfarbe_art | marmoriert | gefleckt-marmoriert |
| Pattern of over colour | Washed out | schale_deckfarbe_art | verwaschen | vergröbert: „blass verwaschen“ und „flächig“ fallen zusammen |
| Pattern of over colour | Absent | – | – | keine Deckfarbe |
| Russet: overall amount | Absent | schale_berostung_gesamt | 0 | fehlend |
| Russet: overall amount | Very low / Low / Medium / High / Very high | schale_berostung_gesamt | 1 / 3 / 5 / 7 / 9 | direkte Entsprechung |
| Russet: overall amount | Low to medium / Medium to high / High to very high | schale_berostung_gesamt | 3+5 / 5+7 / 7+9 | Zwischenstufen. Die örtlichen Merkmale (Stielgrube, Wangen, Kelchgrube) bleiben leer; aus dem Gesamtwert nicht ableitbar |
| Flesh colour | White / Cream / Yellowish / Greenish / Pinkish | fleisch_farbe | weiss / cremeweiss / gelblich / gruenlich / roetlich | direkte Entsprechung |
| Fruit firmness (sensorisch) | Extremely soft, Very soft, Soft | fleisch_festigkeit | 3 | weich; vergröbert |
| Fruit firmness | Soft to intermediate | fleisch_festigkeit | 3 + 5 | Zwischenstufe |
| Fruit firmness | Intermediate | fleisch_festigkeit | 5 | mittel |
| Fruit firmness | Intermediate to firm | fleisch_festigkeit | 5 + 7 | Zwischenstufe |
| Fruit firmness | Firm, Very firm | fleisch_festigkeit | 7 | fest; vergröbert |
| Flesh sweetness | Very low, Low | geschmack_suesse | 3 | wenig süß |
| Flesh sweetness | Low to intermediate / Intermediate / Intermediate to high | geschmack_suesse | 3+5 / 5 / 5+7 | |
| Flesh sweetness | High, Very high | geschmack_suesse | 7 | süß |
| Flesh acidity | Extremely low, Very low, Low | geschmack_saeure | 3 | mild |
| Flesh acidity | Low to intermediate / Intermediate / Intermediate to high | geschmack_saeure | 3+5 / 5 / 5+7 | |
| Flesh acidity | High | geschmack_saeure | 7 | säuerlich |
| Flesh acidity | Very high, Extremely high | geschmack_saeure | 9 | sehr sauer |
| Flesh juiciness | Very low, Low | fleisch_saftigkeit | 3 | wenig saftig |
| Flesh juiciness | Low to intermediate / Intermediate / Intermediate to high | fleisch_saftigkeit | 3+5 / 5 / 5+7 | |
| Flesh juiciness | High, Very high | fleisch_saftigkeit | 7 | saftig |
| Ratio between acidity and sweetness | alle | – | – | **Lücke:** Katalog bräuchte „Verhältnis Säure zu Süße“ |
| Flesh crunchiness | alle | – | – | **Lücke:** Katalog bräuchte „Knackigkeit“ |
| Intensity of fruit aroma | alle | – | – | **Lücke:** Katalog bräuchte „Aromaintensität“; geschmack_aroma ist Freitext für Aromanoten |
| Overall fruit quality (as dessert) | alle | – | – | **Lücke:** wertendes Merkmal, kein Katalogmerkmal |
| Tree global architecture | alle | – | – | **Lücke:** Katalog bräuchte „Wuchsform/Kronenform“ (aufrecht – ausladend – hängend); baum_wuchs ist die Wuchsstärke |
| Flowering 10% open (Klasse 1–9) | 1, 2, 3 | bluete_zeit | 3 | früh; Klasse relativ zur Sammlung, Mittel aus etwa zehn Jahren. Tag des Jahres im Original |
| Flowering 10% open | 4 | bluete_zeit | 3 + 5 | Zwischenstufe |
| Flowering 10% open | 5 | bluete_zeit | 5 | mittel |
| Flowering 10% open | 6 | bluete_zeit | 5 + 7 | Zwischenstufe |
| Flowering 10% open | 7, 8, 9 | bluete_zeit | 7 | spät |
| Flowering 80% open, 90% petal fall | Tag, Klasse | – | – | **Lücke:** Katalog hat nur einen Blühzeitpunkt; Blühverlauf bräuchte eigene Merkmale |
| Time of fruit ripening (harvest maturity) | Late July … Mid November | pflueckreife | 7 … 11 | Monat übernommen; Monatsdrittel (Anfang/Mitte/Ende) steht nur im Original. Katalog bräuchte feinere Stufen |
| Storage (original) | z. B. „October-December“ | – | – | **Lücke:** Lagerzeitraum laut NFC. Ob der Beginn der Genussreife entspricht, ist nicht gesichert; genussreife_beginn bleibt leer |
| Latest store date (standardised) | August … June | genussreife_ende | 8 … 6 | „bis wann lagerfähig und gut“; Juni (16 Akzessionen) seit Katalogerweiterung abbildbar |
| MUNQ | Zahl | Feld `munq` | – | Zahl; Untercodes wie 1106.1 bleiben eigene Gruppen |
| Accession No., Accession Name | – | Feld `akzessionen` | – | Sammlung „UK National Fruit Collection (Brogdale)“ |
| Block/Row/Tree, Current, ECPGR data, Harvest Date, Standardised recording date | – | – | – | Verwaltungs- und Standortangaben, nicht übernommen (Prüfdatum steht im Beleg) |

## Nicht im Datensatz

- **Herkunft** (Land, Jahr, Züchter): Die CSV enthält keine Herkunftsangaben. Feld `herkunft` bleibt leer. Herkunftsdaten der NFC stehen ggf. in EURISCO (laut README) oder im National Apple Register.
- **Bilder:** keine Bild-Links im Datensatz; `bilder` bleibt leer.
- Keine Angaben zu Stiel, Kelch, Kelchhöhle, Kernhaus, Kernen, Lentizellen, Schalenbeschaffenheit, örtlicher Berostung, Wuchsstärke. Für die Bestimmung aus Fotos fehlen damit gerade die Schnittmerkmale; die NFC-Daten helfen vor allem bei Größe, Form, Farbe, Reife und Verwendung.

## Zusammenfassung der Lücken (Vorschläge für den Katalog)

1. ~~`frucht_form`: breit rundlich-kegelförmig, elliptisch, elliptisch-kegelförmig, länglich-kegelförmig~~ – im Katalog ergänzt, abgebildet.
2. Zwischenstufen 2/4/6/8 der ECPGR-Skalen, oder ordinale Merkmale als Zahl 1–9 statt Codeliste. Betrifft Größe, Kronung, Deckfarbenanteil, Festigkeit, Süße, Säure, Saftigkeit, Blütezeit.
3. `schale_grundfarbe`: „weißlich grün“ im Katalog ergänzt und abgebildet; offen bleiben „orange“ und „rot“ (7 Akzessionen).
4. ~~Neues Merkmal „Berostung gesamt“~~ – als `schale_berostung_gesamt` im Katalog ergänzt, abgebildet.
5. Neue sensorische Merkmale: Aromaintensität, Knackigkeit, Verhältnis Säure zu Süße.
6. Neues Baummerkmal: Wuchsform (ECPGR „tree global architecture“).
7. ~~Monatsliste um Juni ergänzen~~ – im Katalog ergänzt, abgebildet.
8. Pflückreife feiner als Monat (Monatsdrittel).
9. `ploidie`: Ausprägung „tetraploid“, falls Klone geführt werden sollen.

## Auswahl der Einträge und Namen

- 2.166 Akzessionen in der CSV, davon 28 ohne jede Merkmalsangabe.
- 29 Akzessionen heißen „Unknown“ und gehören zu keiner MUNQ-Gruppe mit benannter Akzession: ausgelassen, weil sie keine Sorte bezeichnen.
- 83 Gruppen haben nur die Kronenform („Tree global architecture“), die der Katalog nicht kennt: kein Sorteneintrag, Werte stehen in `nicht_abgebildet.json` mit `"nicht_in_sorten": true`.
- Ergebnis: **1.700 Sorten aus 2.038 Akzessionen**, 178 davon aus mehreren Akzessionen (MUNQ-Gruppen).
- Name: deutscher Name nur mit Beleg (siehe `namen.csv`, Prüfung in `namenpruefung_wikipedia.tsv`, Rohantworten in `daten/roh/wikipedia_namen/`). Sonst der NFC-Name ohne technische Klammerzusätze (Ploidie, Klonbezeichnung wie „LA 62A“, „EMLA“, „Wisley“). Bei MUNQ-Gruppen ohne deutschen Namen gilt der NFC-Name, der dem MUNQ-Vorzugsnamen entspricht, sonst der häufigste.
- Synonyme: der NFC-Name, wenn ein deutscher Name gewählt wurde, und Synonyme, die die NFC selbst im Namen nennt („syn …“). Weitere Namen derselben MUNQ-Gruppe (oft Mutanten oder Fehlbenennungen) stehen nur unter `akzessionen`.
- ID-Zusatz `-munq-<Nummer>` nur bei gleichem Namen mit verschiedener MUNQ (Ontario-Klon 4x, zweimal Severn Bank).

## Überblickstexte

Per Skript aus den NFC-Textwerten erzeugt (drei Satzvorlagen je Thema, Auswahl über eine Prüfsumme der ID). Reihenfolge: Größe, Form und Farben; Berostung und Fleischfarbe; Verkostung; Verwendung, Pflückreife, Lagerfähigkeit. Auch nicht abbildbare NFC-Werte (z. B. Aromaintensität) gehen ein, weil sie belegt sind. Bei abweichenden Akzessionen nennt der Text den häufigsten Wert, bei Gleichstand den Wert der Akzession mit den meisten Angaben; alle Einzelwerte stehen in `merkmale`. 1.699 Sorten haben einen Text, davon 50 mit nur einem Satz (z. B. nur Verkostungsdaten); eine Sorte (Karmijn de Sonnaville) hat keine Angaben, aus denen ein Text entsteht.

## Reproduktion

Aus `/Users/antonreinig/Developer/apfel-app/daten`:

```
python3 -I skripte/nfc_namen_kandidaten.py roh/wikipedia_namen <prüfung.tsv>    # Wikipedia-Prüfung (Netz; Antworten werden zwischengespeichert)
# manuelle Entscheidungen stehen in nfc/namenpruefung_wikipedia.tsv (Spalten ergebnis, anmerkung)
python3 -I skripte/nfc_aufbereiten.py roh/nfc/NFC_C_E_data_Apple_22_08_25.csv roh/munq/MUNQ_20200909.txt nfc/namenpruefung_wikipedia.tsv nfc
cd .. && node --experimental-strip-types --no-warnings daten/skripte/nfc_validieren.mjs app/src/daten/merkmalskatalog.ts daten/nfc/sorten_nfc.json daten/nfc/quellen.json
```

Hilfsskripte: `skripte/nfc_erkunden.py` (Spalten und Häufigkeiten), `skripte/nfc_gruppen_liste.py` (MUNQ-Gruppen mit Namen anderer Sammlungen).
