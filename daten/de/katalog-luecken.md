# Katalog-Lücken: Angaben aus den Quellen, die sich nicht sauber einem Merkmalscode zuordnen ließen

Stand: 22.10.2026. Grundlage: Auswertung von 331 Sorten (Engelbrecht 1889, Illustrirtes Handbuch Bd. I und IV, Lauche 1883, Wikipedia, einzelne Webquellen). Die Angaben stehen in den Sortentexten; einen Code gibt es dafür nicht. Der Merkmalskatalog (`app/src/daten/merkmalskatalog.ts`) wurde von mir nicht geändert; der Nutzer hat am 22.10.2026 einige Lücken geschlossen (unten als erledigt markiert), die Daten sind nachgezogen (`daten/skripte/de/nachtrag_katalog.py`). Die Häufigkeiten sind Zählungen in den Bearbeitungsnotizen (Erwähnungen, nicht Sorten).

## Fehlende Ausprägungen oder Merkmale, nach Bedeutung

| Merkmal | Was fehlt | Häufigkeit / Beispiele | Vorschlag |
|---|---|---|---|
| ~~`genussreife_ende` (auch `_beginn`, `pflueckreife`)~~ **erledigt 22.10.2026** | Monat **Juni** fehlte (Juli–Mai). Katalog hat jetzt Code `6`; nachgetragen: 21 Werte `genussreife_ende` = Juni (17 Engelbrecht, 2 Handbuch, 2 Wikipedia) | ca. 25 Erwähnungen; Engelbrecht „Januar bis Juni“ bei Lagersorten (Roter Stettiner, Gelber Winter-Stettiner, Alter Nonpareil, Kleiner Api, Bohnapfel, Boikenapfel …), Handbuch „bis Johannis“ | Juni ergänzen |
| `kelchhoehle_form` | Tiefe als eigenes Merkmal; Engelbrecht gibt die Tiefe der Kelchhöhle als Bruchteil des Abstands zur Achsenhöhle (⅓, ⅖, ½, ⅗, ⅔, ¾). Die Grenze breit/lang dreieckig wurde bei ½ gezogen (Regel siehe bericht.md) | ⅖ ist der häufigste Grenzfall (ca. 47 Erwähnungen); Formwort und Tiefe widersprechen sich oft („breiter Kegel, ⅗“) | Merkmal „Tiefe der Kelchhöhle (Anteil bis Achsenhöhle)“ als Messwert/Verhältnis; „kegelwalzenförmig“, „Kegeltrichter“ als eigene Formen prüfen |
| `kernhaus_form` | **flachrund** – **erledigt 22.10.2026**: Code `flachrund` im Katalog, 14 Werte nachgetragen (flachrund als Grundwort, „flachrund bis zwiebelförmig“, „mehr flachrund als eiförmig“, „sehr flachrund“; „flachrund zwiebelförmig“ bleibt zwiebelförmig). Offen: lanzettlich, eilanzettlich, melonenförmig | flachrund ca. 20 Erwähnungen (z. B. Roter Gravensteiner, Böhmischer Rosenapfel, Hörlins Pepping) | „flachrund“ ergänzen |
| ~~Kernhaus-Maße~~ **erledigt 22.10.2026** | Engelbrecht nennt Breite:Höhe des Kernhauses und der Kammern in mm. Katalog hat jetzt `kernhaus_breite_mm`, `kernhaus_hoehe_mm`, `kernfach_breite_mm`, `kernfach_hoehe_mm`; nachgetragen für 213 bzw. 175 Sorten | bei fast allen Engelbrecht-Sorten | Messwerte Kernhausbreite/-höhe ergänzen; sie stehen derzeit nur in `original`/Text |
| `kerne_anzahl` | Engelbrecht zählt **Kerne je Kammer** („Kerne zu 2“), der Katalog Kerne je Frucht; außerdem „vollkommen/unvollkommen“, Kernfarbe | fast alle Engelbrecht-Sorten | Merkmal „Kerne je Kammer“ und „Kerne vollkommen ausgebildet ja/nein“ |
| `kernfaecher_form` | Wandform der Kammern: „stielwärts spitz, kelchwärts abgerundet“, „ohrenförmig“, „zerrissen/glattwandig“ | sehr häufig, deshalb nur 16 Sorten codiert | Merkmal „Kammerwände glatt/zerrissen“, Ausprägung „ohrenförmig“ |
| `bluete_zeit` | Zwischenstufen **mittelfrüh**, **mittelspät** – **erledigt 22.10.2026** (Codes `4`, `6`; 15 Werte nachgetragen, v. a. aus Wikipedia, 2 aus dem Handbuch). Offen: Datumsangaben („Ende April bis Mitte Mai“) | mittelfrüh 17, mittelspät 7 | Stufen 4 und 6 bzw. Fünferskala wie NAP |
| `schale_lentizellen_art` | Punkte **hell umhöft/umflossen**, **gelb umhöft**, „im Rot hell, im Gelb grünlich“ | ca. 15 | Ausprägungen „hell umhöft“, „gelb umhöft“ |
| `schale_beschaffenheit` | „mattglänzend“ (weder matt noch glänzend), „geschmeidig“ (bei Kalvillen, nicht gleich fettig), „welkt (nicht)“ | mattglänzend 10 | Stufe „mattglänzend“; „welkt beim Lagern“ als Merkmal |
| `fleisch_farbe`, `schale_grundfarbe` | Mischfarben: „grüngelblichweiß“, „hellgrüngelblichweiß“, „hochstrohgelb“, „blassgelb“, „wachsartig weiß“ (Grundfarbe weiß fehlt), Deckfarbe „ziegelrot“ | ca. 12 | ggf. Farbmessung statt Kategorie |
| `frucht_form` | „länglich“ allein, „hochrund“, „eiwalzenförmig“, „verkehrt eiförmig“, „halbkugelig“, „walzenkegelförmig“ | länglich 9, walzen… 20 | „länglich“/„hochgebaut“ und „verkehrt eiförmig“ ergänzen |
| `stiel_laenge` | Engelbrecht gibt die Stiellänge in mm („etwa 14 mm l.“), der Katalog hat nur Stufen ohne Grenzwerte | fast alle Engelbrecht-Sorten | Messwert Stiellänge in mm oder Grenzwerte der Stufen |
| `baum_wuchs` | „rasch“, „lebhaft“, „üppig, aber bald nachlassend“ | ca. 19 | Grenzwerte/Synonyme festlegen |
| `geschmack_suesse/saeure` | „mild süß“, „etwas vorherrschend weinig, nicht viel weniger süß“ (Zwischenstufen) | einzelne | Fünfer- statt Dreierstufen |
| `frucht_gewicht` | Gewichtsspannen („50–80 g“) | 7 | Spannen erlauben (min/max) |
| Engelbrecht-Merkmale ohne Katalogentsprechung | Kelchblättchen (am Grunde sich berührend/getrennt), Pistille (lang/kurz verwachsen, behaart), Staubfäden (Stellung), Querschnitt der Kelchwölbung | bei allen Engelbrecht-Sorten | Engelbrecht nennt die Kelchblättchen-Stellung und die Pistille ausdrücklich als beständige Merkmale; Aufnahme in den Katalog prüfen |
| Wertzeichen | Engelbrechts Tafel- (o, oo) und Haushaltswert (†, ††) als Rangstufe, Handbuch-Zeichen (*, **) | alle | Merkmal „historischer Wert für Tafel/Haushalt“ |

## Zuordnungsentscheidungen (Auslegungen)

- Kelchhöhle: Bei Kegel oder Trichter entscheidet die Tiefe (unter ½ → breit dreieckig bzw. Trichter mit kurzer Röhre, ab ½ → lang dreieckig bzw. lange Röhre, bis zur Achsenhöhle → Röhre bis zum Kernhaus). Wo ein Bruch auch am Scan nicht sicher lesbar war (⅖ oder ⅔), blieb der Code weg oder ist in den Notizen markiert.
- „Kernhaus offen/geschlossen“ im Handbuch ohne Nennung der Achse wurde als `kernfaecher_oeffnung` gewertet; „hohlachsig“ als `kernhaus_achse` offen. Achsenhöhle „schmal“ zählt als offen.
- Kernhausform nach dem Grundwort: „eizwiebelförmig“ → zwiebelförmig, „zwiebeleiförmig“ → eiförmig.
- Engelbrecht „hochsitzend“ (Kammern) → Kernhaus zum Kelch hin, weil Engelbrecht die Früchte mit dem Kelch nach oben zeichnet.
- Grundfarbe immer in der Genussreife („später …“).

## Rohnotizen der einzelnen Arbeitsstapel (Abschnitte „Katalog-Lücken“)

Die vollständigen Notizen je Stapel (inklusive Identitätsfragen, Widersprüche, OCR-Lesungen) liegen in `daten/de/arbeit/ergebnis/stapel_NN_notizen.md`.

### Stapel _0

- Geschmack nach den Tabellenregeln nachkodiert: Aachener Hausapfel E „mässig weinig, etwas vorherrschend, doch nicht stark süss“ → Säure 7, Süße 3; Aachener HB „etwas weinartigem Zuckergeschmacke“ → Süße 7, Säure 5 (vorher Säure 3); Ananasrenette HB „weinigen Zuckergeschmack“ und Adams Parmäne HB „delikatem weinartigen … Zuckergeschmacke“ → Süße 7, Säure 5; Gelber Herbst-Kalvill HB „feinsäuerlichem süßen Geschmack“ → 5/5; Adersleber (Arche Noah) „mild säuerlich-süß“ → 5/5; Altländer „süßsäuerlich“ → 5/5; Alkmene „fein säuerlich“ (Wikipedia) und „zart säuerlich“ (BOGL) → Säure 5.
- Weiterhin ohne Code: Adersleber Wikipedia „mild süß“ (keine Regel für die Süße; „mild“ bezieht sich hier auf die Süße).
- Roter Oster-Kalvill E „vorherrschend weinig, bald etwas weniger, bald fast ebenso süss“ → Säure 7, Süße 5 (Ermessensentscheidung).
- Aachener Hausapfel HB „Kelchröhre ist ein kurzer, spitzer Kegel“: „kurz“ und „spitz“ zeigen in der Tabelle in verschiedene Richtungen; dreieck_breit gewählt (Tiefe maßgeblich, passt zu Engelbrecht ⅓).
- Fleischfarbe Gestreifter Winter-Kalvill E „hellgrüngelblichweiss“: kein Code (zwischen gruenlich und cremeweiss), nur Text.
- „mattglänzend“ (Aachener E/HB, Adersleber Arche Noah): weder `matt` noch `glaenzend` vergeben.
- Adersleber: „Gefäßbündel zwiebelförmig“ als kernhaus_form zwiebel gewertet; „im Querschnitt fünfkantig“ → Rippung 7; „Blüte mittelfrüh“ → kein Code (zwischen früh und mittel); „anfangs fest, später mürber“ → keine Festigkeit; „matt glänzend“ → nichts.
- Alkmene: Deckfarbe „ziegelrot“ (BOGL) ohne Farbton-Code; „orangerot“ (Wikipedia) als `orange`. Blütezeit nur als Datum („Ende April bis Mitte Mai“) → kein Code. Fleischfarbe „grünlichgelb bis cremefarben“ → gruenlich + cremeweiss.
- Altländer Pfannkuchenapfel: Lagerung großer Früchte „bis Juni“ → Juni nicht im Katalog, kein genussreife_ende; Form „breitkugelig-flach, häufig unregelmäßig“ nur als flachrund kodiert.
- Aachener Hausapfel: Genussreife-Ende „Juni“ (E) bzw. „bis an den Sommer“ (HB) → kein Code. Gewicht 50–80 g (Wikipedia) als Spanne nicht als Messwert übernommen.
- Roter Sommer-Kalvill: Haltbarkeit „14 Tage bis 3 Wochen“ ohne Monatscode für das Ende aus dem Handbuch.
- „Kerne zu 2“ (Engelbrecht) durchweg nur im Text, kein kerne_anzahl.

- Roter Sommer-Kalvill E:37 „kegel- bis kegeltrichterf., bis nahe zur Achsenh.“: nach der ergänzten Regel dreieck_lang und roehre_kernhaus (vorher trichter_kurz); damit stimmt Engelbrecht mit dem Handbuch („bis aufs Kernhaus“) weitgehend überein.
- Handbuch-Wertzeichen (z. B. Corneli's Hausapfel „*††“) nicht kodiert; die Zuordnungstabelle gilt nur für Engelbrechts Zeichen.

### Stapel _0

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

### Stapel _0

- **Kernhausform ohne Code**: Rote Walze E „breit lanzettlich“, HB „kreiselförmig“ (nur Text).
- **Geschmack „süßweinsäuerlich“** (Weißer Sommer-Kalvill HB) und **„süß-weinsäuerlich“** (Berner Rosenapfel Wikipedia) als süßsäuerlich → Süße 5 / Säure 5 gewertet (Ermessen).
- **„vorherrschend, angenehm weinig, genügend süss“** (Lütticher E) → Säure 7, Süße 5 (wie Stapel 01, Roter Oster-Kalvill).
- **„nicht süss“** (Kentischer E) → Süße 3 (niedrigste Stufe); „ziemlich scharf weinsäuerlich“ → Säure 9.
- **Wuchs „rasch“/„lebhaft“** (HB: Weißer Sommer-Kalvill, Lütticher, Rote Walze) ohne Code, nur Text.
- **Stielgrube berostet „bald halb, bald ganz … oft strahlig“** (Weißer Sommer-Kalvill HB) → 7; „etwas grün und rostig“ (Rote Walze HB) → 3.
- **Kelchhöhle**: Lütticher E 2/5 bis 1/2 → dreieck_breit und dreieck_lang (neue Tiefenregel); Rote Walze HB „kegelförmig mit ganz kurzer Röhre“ → trichter_kurz; Kentischer E „stumpfkegelf., fast kegelwalzenf., 1/2 bis 3/4“ → dreieck_lang. Berner Rosenapfel „Kelch- und Stempelröhre: Konisch, bis 1 cm lang“ ohne Tiefenbezug → kein Code.
- **Deckfarbe „kirschrot“** (Biesterfelder) ohne Farbton-Code; „rot-orange“ (Bittenfelder) als `orange`; „trübes Roth“ (Rote Walze HB) als `braunrot`, „Blutroth“ als `dunkelrot`.
- **Grundfarbe** Bismarckapfel „gelb- bis weiß-grünlich“ ohne Code. Rote Walze HB „blasses Gelb“ als `gelb`.
- **Lentizellen „grün“** (Biesterfelder) ohne Art-Code.
- **„mattglänzend“** (Berner Rosenapfel) ohne Code.
- **Rippung** ohne Code: Berlepsch BOGL „meist deutlich gerippt“, Berner Rosenapfel „flache Rippen … stören die Rundung“, Rote Walze E/HB „Querschn. nicht rund“ bzw. flache Erhabenheiten, Kentischer E „Querschn. nicht rund“.
- **Blütezeit „mittelfrüh“** (Berner Rosenapfel, Bismarckapfel) ohne Code.
- **Verwendung „Apfelkraut“/„Krautapfel“** (Bergische Schafsnase) nicht als `kueche` kodiert, nur im Text; „Gelee“ (Birkenfelder) über „Wirtschaftsapfel“ als `kueche`.
- **Reifeangaben ohne klare Zuordnung**: Bittenfelder „reifen Ende Oktober bis Mitte November“ (Wikipedia) bzw. „Mitte Oktober bis Mitte November“ (BOGL) weder als Pflück- noch als Genussreife kodiert; Berlepsch BOGL „Reife Mitte September bis Mitte Oktober“ ebenso. Lütticher: Diels „November“ nur im Text.
- **Kleinwüchsig** (Birkenfelder) als Wuchs 3 gewertet.
- „Kerne zu 2“ u. ä. bei Engelbrecht nur im Text, kein kerne_anzahl.

### Stapel _0

- **Genussreife Juni** (kein Code): Winter-Postoph E:87 „Anf. Januar bis Juni“; Boikenapfel E:94 „Januar bis Juni“; Bohnapfel Wikipedia „bis Juni haltbar“.
- **kernhaus_form „sehr flachrund“**: Böhmischer Rosenapfel E:197 „Kernhaus 49:22, sehr flachrund“ – kein Code.
- **Blütezeit „mittelfrüh“**: Bohnapfel Wikipedia „blüht mittelfrüh und langanhaltend“ – kein Code (nur früh/mittel/spät).
- Kernform Handbuch Winter-Postoph „spitzherzförmig“ – kein passender Katalogwert, nur Text.

### Stapel _0

- **Kelchhöhle nach ergänzter Regel (Tiefe entscheidet), nachgetragen:** E:216 Jungfernapfel „kegelf., ⅖“ → dreieck_breit; E:111 Doppelter Holländer „meistens kegelf., ⅖“ → dreieck_breit; E:430 Woltmann's Reinette „kegelf., fast ½“ → dreieck_breit (unter ½); E:68 Bürgerherrnapfel „breiter Kegel, ⅗“ → dreieck_lang; E:98 Champagner Reinette „stumpfer Kegel, ½“ → dreieck_lang; E:169 Charlamowsky „stumpf kegel-, oft fast kegeltrichterf., ⅗“ → dreieck_lang (nur Kegel kodiert, „oft fast kegeltrichterf.“ ist zu unbestimmt für trichter_lang).
- Bei ⅖ mit „kegel- bis kegeltrichterf.“ → dreieck_breit + trichter_kurz: E:86, E:332, E:531 (⅓), E:81 „schmal kegel- bis kegeltrichterf., kaum ⅖“ (nach Regel jetzt dreieck_breit statt dreieck_lang).
- Folge der Tiefenregel: Bürgerherrnapfel Engelbrecht dreieck_lang gegen Handbuch „recht breiter, etwas herabgehender Kegel“ (ohne Tiefe) dreieck_breit; Doppelter Holländer Engelbrecht dreieck_breit gegen Handbuch „feine Röhre bis auf das Kernhaus“ roehre_kernhaus. Beide Werte stehen drin.
- Handbuch-Kelchröhren ohne Code: Jungfernapfel „kurz und abgestumpft“ (Röhre, Form unklar); Woltmanns Reinette „geht nur etwas herab“; Charlamowsky „mit der kurzen Röhre ein etwas eingezogener Kegel“. Champagner Reinette „trichterförmig, klein“ → trichter_kurz (Ermessen). Cludius „sehr kurz, weit“ → dreieck_breit (Ermessen).
- „eiwalzenförmig“ (E:216, E:86) als walzenfoermig kodiert (Grundwort); „eikegelförmig, etwas abgestumpft“ (E:111) als stumpfkonisch.
- „zwiebeleiförmig“ (E:86, E:81, E:332) nach Tabelle → eifoermig; „eizwiebelförmig“ (E:111) → zwiebel.
- Kernform Handbuch: Jungfernapfel „dick, herzförmig“, Doppelter Holländer „eirund, nicht langgespitzt“ → kein Code (kein passender Katalogwert bzw. unklar).
- Geschmack: Bürgerherrnapfel E „vorherrschend, doch angenehm weinig, weniger süss“ nur Säure 7, Süße offen gelassen; Handb. „merklich versüßt, weinsäuerlich“ nur Säure 7. Celler Dickstiel E „vorherrschend, angenehm weinig, genügend süss“ → Säure 7/Süße 5 (Ermessen, ebenso Rheinische Schafsnase). Jungfernapfel E „wenig vorherrschend weinig, fast ebenso süss“ → 5/5.
- „kaum mitteltief“ (Stielhöhle E:216) → keine Tiefe kodiert.
- „mattglänzend“ (E:111, E:531) → weder matt noch glänzend.
- Börtlinger: Blüte „mittelfrüh bis spät“ (LOGL, KOB) → kein Code; Deckfarbe „deckend“ (KOB) → kein Anteil-Code; Grundfarbe weißlich gelb (Wikipedia, LOGL) gegen gelbgrün (KOB), beide aufgenommen; „etwas zäh“ ohne Code.
- Champagnerrenette: Genussreife Engelbrecht „Februar bis Juli“ → Ende = 7 (Juli des Folgejahres); Wikipedia „bis in den Juni“ → kein Code (Juni fehlt im Katalog). Handbuch „hält 1 Jahr“ nur im Text. Wikipedia-Maße 65 × 47 mm als Messwerte aufgenommen.
- Cludius’ Borsdorfer: Genussreife bis Juni (E und Handb.) → kein Ende-Code.
- Roter Eckapfel Handb. „besonders zum Welken beliebt“ → nur kueche, kein doerren (Bedeutung von „Welken“ unklar).
- Charlamowsky E „oft weithin hell punktirt geröthet“: Farbton nur rot (carmoisin) kodiert, nicht hellrot.
- „Kerne zu 1/2/3“ (Engelbrecht) durchweg nur im Text, kein kerne_anzahl.

### Stapel _0

- Kelchhöhle **„trichterförmig“ ohne Röhrenangabe** (Deutscher Goldpepping E: „trichterf., etwa ⅗ zur Achsenh.“): nach der ergänzten Regel (Trichter ab ½) jetzt `trichter_lang`. Handbuch dort „geht als Kegel etwas herab“ → `dreieck_breit` (Widerspruch).
- Langer grüner Gulderling E „trichter- bis kegeltrichterf., ½ bis ⅗“ → `trichter_kurz` (kegeltrichterförmig) und neu `trichter_lang` (Trichter ab ½). HB „schmaler Cylinder bis zur Hälfte … öfter auch Kegel“ → kein Code, nur Text.
- Cornwalliser E „kegel- bis kegeltrichterförmig, ⅓ bis ⅗“ → nur `trichter_kurz` kodiert. Der Kegelanteil bleibt ohne Code, weil die Spanne ⅓–⅗ die Grenze ½ überschreitet und keine Lesart eindeutig ist.
- Fleischfarbe **„hellgrüngelblich“/„hellgrünlichgelb“** (Cornwalliser, Gold-Gulderling, Cox Pomona, Danziger, alle E): weder `gruenlich` noch `gelblich` eindeutig → bei „… bis gelblichweiss“ nur `cremeweiss`, beim Gold-Gulderling (E) gar kein Code.
- Geschmack ohne Code: Danziger E „etwas vorherrschend, mild weinig, genügend süss“; Cox Pomona E „vorherrschend, doch mild weinig, genügend süss“; Langer grüner Gulderling E „vorherrschend weinig, erst wenig, später fast ebenso süss“.
- Gold-Gulderling E „Rost findet sich sehr selten“: kein Wangen-Code. Cox Orange WP „oft netzartiger Rost“: kein Wangen-Code.
- „mattglänzend“ (Berliner, Gold-Gulderling, Cox Orange, Goldpepping): weder `matt` noch `glaenzend`.
- „etwas offen“ (Kelch, Berliner) → `halboffen`; „etwas offen“ (Kammern, Cox Orange) → `teilweise`.
- Cox Orange Blüte „mittelfrüh“ (WP) → kein Code. Cox Orange WP „Fruchtform-Index 0,83“ zusätzlich zum E-Verhältnis 0,79 als eigener Wert aufgenommen.
- Genussreife-Ende „Juni“ (Langer grüner Gulderling E) bzw. „bis gegen Johannis“ (Goldpepping HB) → kein Code.
- Danziger WP „Fruchtfleisch mit grünen und roten Adern“ → kein Fleischfarben-Code, nur Text.
- Deutscher Goldpepping WP „Reifezeit Anfang Oktober, hält sich bis Februar“: nicht kodiert (unklar, ob Pflück- oder Genussreife).
- Diedenshausener: „Durchmesser von mehr als sechs Zentimetern“ nicht als Messwert; „früher Herbstapfel“ ohne Monat.
- „Kerne zu 2“ (Engelbrecht) durchweg nur im Text, kein `kerne_anzahl`.

### Stapel _0

- Kernhaus „flachrund“ ohne Code: Königsapfel von Jersey (E 92, „Kernhaus 37:22, flachrund“; Code zwiebel aus dem Handbuch), Königlicher Edelapfel (E 97, „Kernhaus 46:27, flachrund“). Apfel von Uelzen „flachrund bis zwiebelf.“ und Roter Augustiner „flachrund bis flachrund zwiebelförmig“ → zwiebel.
- Kelchhöhle Weißkante E „meistens kegelf., fast ½“ → dreieck_lang (Ermessen, knapp unter ½). Handbuch „geht etwas trichterförmig bis halb aufs Kernhaus herab“ → kein Code, nur Text.
- Kelchhöhle Apfel von Uelzen E „trichterf., bis nahe zur Achsenh.“ → roehre_kernhaus (Ermessen); widerspricht dem Handbuch („kurzer Kegel oder Trichter nicht weit herab“ → dreieck_breit, trichter_kurz). Beide aufgenommen.
- Kelchhöhle Doppelter Härtling „schmaltrichter- bis kegeltrichterf., ½“ → nur trichter_kurz.
- Kelchhöhle Königlicher Edelapfel „kegelf. bis kegelwalzenf., bis nahe zur Achsenh.“ → dreieck_lang; „kegelwalzenförmig“ ohne eigenen Code.
- Kelchhöhle Dorheimer Streifling „klein und trichterförmig“ → trichter_kurz (Ermessen).
- Fleischfarbe Königlicher Edelapfel „hellgrünlichgelb“ (E) / „etwas grünlich gelb“ (HB) / „weiß“ (Diel): kein Code.
- Deckfarbton ohne Code: Weißkante HB „gelbröthlich oder lackartig“; Doppelter Härtling Wikipedia „zinnoberrot, dunkelrot bis bräunlich rot“ (nur E-Wert dunkelrot); Dorheimer Streifling Farbe der Streifen nicht genannt (rot aus „roten Sprenkeln“).
- Lentizellenanzahl Doppelter Härtling („schattenw. sparsam, sonnenw. zahlreich“) ohne Code.
- „mattglänzend“ (Härtling, Melonenapfel E) weder matt noch glaenzend.
- Blütezeit „mittelfrüh“ (Doppelter Härtling, Dorheimer Streifling): kein Code.
- Genussreife-Ende Apfel von Uelzen E „Juni“: kein Code (Ende 5 aus HB-Kopfzeile).
- Stiel Doppelter Härtling „kaum mitteldick“: kein Code.
- Säure Doppelter Härtling „nicht weinig, nur süss“ → Säure 3 (Ermessen).
- Säure Königlicher Edelapfel „vorherrschend scharf weinig“ → 9.
- Krönung Apfel von Uelzen „zwischen ziemlich starken, doch flach … laufenden Rippen“ → 9 (Ermessen); Doppelter Melonenapfel ebenso.
- Königsapfel von Jersey: Deckfarbe 0 aus HB „Sonnenseite nur goldartiger gefärbt“ (implizit ohne Röte).
- „Kerne zu 2/zu 1/zu 0 bis 1“ nur im Text, kein kerne_anzahl.
- Doppelter Aachener Hausapfel: Gewicht 100–150 g, Dorheimer 100–150 g als Spanne nicht als Messwert.

### Stapel _0

- Weißer Astrakan, Engelbrecht: Kelchhöhle „kegelwalzenförmig“ hat keinen eigenen Code. Vergeben ist nur dreieck_lang (Kegel ⅗); im Text beschrieben.
- Weißer Astrakan, Handbuch: Die Kelchhöhle „kurzer, weiter, abgestumpfter Kegel, fast ein Cylinder“ ist als trichter_kurz codiert (analog zu „Kelchröhre kurz, cylindrisch“). Grenzfall.
- Edelborsdorfer, Handbuch: „Kelchröhre kurz und ziemlich weit“ ohne Formwort, kein Code.
- Winter-Quittenapfel, Handbuch: „hält bis Juni und länger“. Für Juni gibt es keinen Monatscode, deshalb kein genussreife_ende aus dem Handbuch.
- Englische Spital-Renette, Handbuch: „hält sich … bis in den Frühling“, kein Monatscode.
- Engelsberger Renette: Blüte „Mitte April bis Anfang Mai“ ohne früh/mittel/spät, kein Code. Erbachhofer Weinapfel: Blüte „mittelfrüh“, liegt zwischen 3 und 5, kein Code.
- Deckfarbtöne „goldig roth“ (Edelborsdorfer) und „gelblichroth/gelbroth“ (Englische Spital-Renette) als orange codiert. „mattrothe Backe“ (Eveapfel, Handbuch) und „röthlicher Anflug“ (mehrere Sorten) ohne Farbton-Code.
- Kronung bei „zwischen flachen, doch deutlich über die Frucht laufenden Rippen“ einheitlich 5, bei „starken Rippen“ 9.
- Rippung: „Querschnitt nicht ganz rund“ → 3, „flachkantig“ mit flachen Rippen → 5, „flachkantig“ mit starken Rippen → 7.
- Geschmack „vorherrschend weinig, nicht viel weniger/fast ebenso süß“ → Süße 5, Säure 5 (ausgewogen). „vorherrschend … weinig, mässig süss“ (Eveapfel) → Säure 7, Süße 5.
- Handbuch „Kernhaus geschlossen/offen“ ohne Achse → kernfaecher_oeffnung (nach Ergänzung der Anleitung). „mit hohler Achse“ → zusätzlich kernhaus_achse offen.

### Stapel _0

- `kelchhoehle_form` Trichter mit Tiefenangabe, aber ohne Röhrenlänge: Freiherr von Trauttenberg E „trichterförm., ⅗ zur Achsenh.“ → trichter_lang (analog Kegel ½ oder tiefer). Morgenduftapfel HB „langer, tief herabgehender Cylinder“ → trichter_lang.
- `kelchhoehle_form` Kegel ⅖ bis ½ (Roter Kronenapfel E) → dreieck_lang (Obergrenze ½) plus trichter_kurz für „kegeltrichterförm.“; Morgenduftapfel E „kegeltrichter- bis schmal kegelf., ⅗“ → trichter_kurz und dreieck_lang. Sommer-Zimtapfel E „kurz kegel- bis kegeltrichterf., ¼“ → dreieck_breit und trichter_kurz.
- Trauttenberg HB „Kelchröhre geht bald trichterförmig bis fast aufs Kernhaus“ → roehre_kernhaus.
- `frucht_form` „eiwalzenf.“ (Trauttenberg E) als walzenfoermig codiert (Grundwort).
- `stiel_dicke` „stark“ (Handbuch: Sommer-Zimtapfel, Morgenduftapfel) als dick (7) gewertet.
- `schale_deckfarbe_anteil`: „zuweilen … leicht roth angeflogen“ (Trauttenberg E), „zuweilen zart röthlich angeflogen“ (Fromms E) → 1; „nicht selten rother Anflug“ (Braunschweiger E) → 3.
- `schale_grundfarbe` „wachsartig weiss“ / „wachsartig strohweiß“ (Braunschweiger) → weisslichgelb.
- `kernhaus_form` „flachrund bis zwiebelf.“ (Fromms) → zwiebel; „flachrund“ ohne Code.
- `kernhaus_lage`: Sommer-Zimtapfel E „Kammern … tiefsitzend“ – nicht codiert (nicht ausdrücklich „nach dem Stiel hin“), nur im Text.
- `geschmack`: Fromms E „etwas vorherrschend weinig, genügend süss“ → Säure 7, Süße 5 (wie Stapel 02 für „vorherrschend weinig, genügend süß“; das „etwas“ spräche auch für 5/5). Roter Kronenapfel E „wenig vorherrschend weinig, fast ebenso süss“ → 5/5. Braunschweiger HB „süß-weinsäuerlich“ → 5/5.
- `fleisch_festigkeit`: Fromms E „erst fest, später fast mürbe“ – nicht codiert.
- `fleisch_farbe` Morgenduftapfel: gelblichweiß (cremeweiss) codiert; Rötung unter der Schale/an Gefäßbündeln nur im Text.
- `kelch_offenheit` Sommer-Zimtapfel E „fast halb offen“ – nicht codiert; HB widersprüchlich (Diel geschlossen, 1858 meist offen), nur Text.
- `frucht_breiteste_stelle` Braunschweiger E „nicht oder wenig stielbauch.“ – nicht codiert (HB: Mitte).
- `pflueckreife` Gacksapfel „reift Ende September bis Mitte Oktober“ – unklar ob Pflückreife, nicht codiert. `bluete_zeit` Gacksapfel „mittelspät“ – kein Code.
- Fießers Erstling: Genussreife-Beginn nicht codiert (Wikipedia nennt nur Verwendung im Herbst als Wirtschaftsapfel, im Frühjahr als Tafelapfel). Größe „groß bis sehr groß“ trotz Messwert als Worte codiert.
- Freiherr von Trauttenberg, Wikipedia: Lagerung „bis Ende Dezember, kühl bis Januar“ nicht als Genussreife-Ende codiert (widerspricht Engelbrecht bis Februar, nur Text).
- Handbuch-Wertzeichen (*, †) nicht ausgewertet, `verwendung` aus dem Handbuch nur nach dem Text.
- „Kerne zu 2“ (Engelbrecht) durchweg nur im Text.

### Stapel _1

- Kelchhöhle nach der ergänzten Regel (Tiefe entscheidet, Kegel unter ½ → dreieck_breit, ab ½ → dreieck_lang):
  - Florianer Rosenapfel E „kegelf., ⅖“ → dreieck_breit (Nachtrag; deckt sich mit dem Handbuch „breiter Kegel … etwas herab“)
  - Gelbe Sächs. Renette „⅖ bis ½“ → dreieck_breit und dreieck_lang (Spanne über die Grenze, beide Werte)
- `kelchhoehle_form` Gelber Bellefleur E „trichterf., ⅔ bis ⅘“ → trichter_lang, gleich gehandhabt wie in Stapel 02 (tiefer Trichter). Das Handbuch sagt dagegen „kegelförmig mit kurzer Röhre“ → trichter_kurz. Beide Werte sind aufgenommen.
- `kelchhoehle_form` Caroline Auguste: Handbuch „kurz, spitz, kegelförmig“ → dreieck_breit (wie Stapel 01), Engelbrecht ⅗ → dreieck_lang. Beide Werte sind aufgenommen.
- `frucht_form` ohne Code:
  - Florianer „abgest. eiwalzen- bis eikegelf.“, Handbuch „hochaussehend, einzeln fast walzenförmig, meistens geneigt zum Konischen“
  - Gelber Bellefleur E „abgest. eikegelf.“ (Code `konisch` nur nach Wikipedia „kegelförmig“)
  - Jansen „eikegelförmig“ (nur `eifoermig` vergeben)
- `schale_grundfarbe` Caroline Auguste: E „hellgrüngelblichweiss“, Handbuch „milch- oder [wachs?]weiß“ (OCR) → kein Code.
- `fleisch_farbe` Geflammter Kardinal E „hellgelblich bis grüngelblichweiss“ → kein Code aus Engelbrecht (Handbuch „weißgrünlich“ → gruenlich).
- Deckfarbe:
  - Gelbe Sächs. Renette „gelblich rother Anflug“ → kein Farbton-Code
  - Florianer Handbuch „gelbbräunliche, nicht ganz carmoisinrothe Röthe“ → nur `rot` für die Streifen
  - Caroline Auguste „hellcarmoisinroth“ → `hellrot` (Ermessen)
  - Breuhahn „trüb orangerot“ → `orange`
- Geschmack ohne Code: Margarethenapfel HB „süßweinsäuerlich“; Breuhahn „mild säuerlichsüß“; Caroline Auguste E „vorherrschend, doch mild weinig, genügend süss“; Gelber Bellefleur HB „gewürzig weinig, reinettenartig“.
- Geschmack mit Ermessen:
  - „etwas vorherrschend weinig, nicht ganz so / etwas weniger süss“ (Florianer, Bellefleur) → Säure 7, Süße 5
  - Geflammter Kardinal E „vorherrschend … weinig, mässig süss“ → Säure 7, Süße 5
  - Jansen E „mild weinig, etwas vorherrschend oder ebenso süss“ → 5/5
  - Oldenburg „fein süßsäuerlich“ → 5/5
  - Geflammter Kardinal HB „süß weinsäuerlich“ → 5/5
- Kronung:
  - Geflammter Kardinal E: Rippen „breit und flach, doch deutlich über die Frucht“ → kein Code
  - Florianer E „zwischen starken, doch flach … laufenden Rippen“ → 9; HB „Falten und Fleischbeulen“ → 5
  - Bellefleur E „kelchw. starken … Rippen“ → 9
- `frucht_rippung` „Querschnitt nicht ganz rund“ (Caroline Auguste, Florianer, Jansen „oft nicht ganz rund“) → 3.
- `schale_berostung_stielgrube` Margarethenapfel HB „roststrahlige Höhle“ → 5 (berostet; „strahlig über den Rand“ steht nicht da).
- Margarethenapfel und Caroline Auguste HB „Kernhaus … offen“ → `kernfaecher_oeffnung` nur, wo ausdrücklich von Fächern/Kammern die Rede ist.
- Genussreife-Ende ohne Code:
  - Jansen HB „hält sich bis zum Sommer“
  - Florianer HB „oft noch den Januar hindurch“ (Ende 12 nach „bis gegen Weihnachten“)
- Baum ohne Code: Margarethenapfel „der Baum bleibt klein“ und Jansen (Diel) „wächst nicht frech“ → kein `baum_wuchs`.
- Wikipedia-Größenspannen (Geflammter Kardinal 70–90 × 60–85 mm) sind nicht als Messwerte übernommen. Einzelwerte aus Wikipedia (Gascoyne 75:60 mm, 145 g; Breuhahn 60:53 mm, 90 g) sind übernommen.
- „Kerne zu 2“ u. ä. stehen nur im Text, nie als `kerne_anzahl`.

### Stapel _1

- Kelchhöhle nach Tiefenregel der Anleitung (Kegel <½ dreieck_breit, ab ½ dreieck_lang; Trichter ohne Röhrenangabe <½ trichter_kurz, ab ½ trichter_lang): E 147 und E 151 „kegelf., ⅖“ → dreieck_breit; E 217 „kegeltrichterf., ½“ → trichter_lang (vorher trichter_kurz).
- Glanz-Renette E „kurz kegel- bis fast kegeltrichterf., ⅓“ → nur dreieck_breit (wegen „fast“ kein trichter_kurz; Leipaer Wildling „kegel- bis kegeltrichterf.“ hat beide).
- Geschmack: „etwas vorherrschend weinig, genügend süss“ (Glanz-Renette E) → Säure 5/Süße 5; „vorherrschend weinig, genügend/nicht viel weniger süss“ (Gelber Edelapfel, Früher Sperberapfel E) → Säure 7/Süße 5; „mild weinig, fast ebenso süss“ (Gelber Richard E) → 5/5. Englischer Gewürzapfel Handbuch „süßlich angenehm, nicht kräftig“ ohne Code. Leipaer Wildling Handbuch „etwas einschneidend weinartig“ ohne Code. Glockenapfel Wikipedia „ausgeprägte, etwas scharfe Säure“ → Säure 9. Gestreifter Matapfel „etwas säuerlich“ → Säure 5.
- Fleischfarbe Gestreifter Matapfel „grün-gelblich-weiß“: kein Code.
- „mattglänzend“ (E 157, E 147, Handb. IV 373): weder matt noch glaenzend.
- Gelber Edelapfel: Wikipedia „sofort genussreif“ nach Pflückreife September – kein genussreife_beginn aus Wikipedia kodiert; Deckfarbe „zitronengelb, selten hellorange“ nicht kodiert.
- Englischer Gewürzapfel Handbuch „sonnenseits goldartig geröthet (in warmen Jahrgängen)“: kein Anteil/Farbton.
- Glanz-Renette Handbuch „Baum wächst nicht stark“: kein baum_wuchs.
- Glockenapfel: Lagerung „bis Juni“ (Wikipedia) – Juni nicht im Katalog, kein Code; Blüte „mittelfrüh“ – kein Code; „dunkle Schalenpunkte“ – keine Lentizellenart; „höckerig begrenzte Kelchgrube“ → Krönung 9.
- Gelber Richard: Blütezeit „April bis Mai“ ohne Code; Wikipedia „reifen von September bis November“ nicht kodiert (Pflück-/Genussreife unklar).
- Sibirischer Augustapfel Handbuch: Diels Angabe „Kelchröhre bis auf das Kernhaus“ nur im Text, kodiert ist Oberdiecks „kurzer Kegel“ (dreieck_breit).
- „Kerne zu 2“ u. ä. durchweg nur im Text.

### Stapel _1

- **Kelchhöhle „kegelf., fast ½“** (E 241 Edelroter): knapp unter ½, kein Code gesetzt; nur Handbuch-Code roehre_kernhaus („weit, lang bis fast aufs Kernhaus“). Bitte zentral entscheiden.
- Kelchhöhle Handbuch „weit, zur Hälfte bis zum Kernhaus herabgehend“ (Der Köstlichste): Form nicht genannt, kein Code. Handbuch IV „breiterer, ziemlich herabgehender Kegel“ (Graue Französische Renette): Formwort und Tiefe widersprechen sich, keine Tiefenangabe, kein Code. Grasblümchen „trichterförmig, mittelweit, mittellang“: kein Code (mittellang nicht zuordenbar).
- Handbuch „Kelchröhre geht als Cylinder oder feiner Kegel nur etwas herab“ (Weißer Winter-Taubenapfel) → trichter_kurz und dreieck_breit.
- Fruchtform ohne Code: „eiwalzen- bis eikegelf.“ (E 235), „bald länglich, bald rundlich eikegelf.“ (E 522). „abgest. rundlich eiförmig bis eikegelförmig“ (E 241) und „abgest. eiwalzenf. bis abgest. eiförmig“ (E 245) → eifoermig.
- Fleischfarbe „hellgrünlichgelb“ (E 566, E 558): kein Code. „weiß, ins Gelbliche spielend/schillernd“ (Handbuch) → cremeweiss.
- Kernhaus „flachrund(lich) bis zwiebelf.“ (E 558, E 28) → nur zwiebel. „herz-zwiebelförmig“ (Lauche 791) → zwiebel.
- Deckfarbe „lackrot“: „lebhaft lackroth“ → hellrot (E 507, E 241, Lauche 791); Handbuch „schönes Lackroth“ (Edelroter) ohne Farbton. „hellcarmoisin“ (Der Köstlichste) → hellrot. Der Köstlichste E „sonnenw. … schattenw. blasser werdend überzogen“ → Anteil 7.
- Edelroter: Rostanflüge auf der Sonnenseite, die „marmoriertes Ansehen“ geben (Handbuch) – keine Deckfarbenart marmoriert, keine Wangenberostung kodiert, nur Text.
- Stielgrube „kaum mitteltief“ (E 522): kein Code. „etwas roststrahlig“ (Handbuch, Blenheim): keine Berostung kodiert.
- „Achsenh. schmal, hochsitzend“ (E 209): keine kernhaus_lage kodiert.
- Wikipedia „Grünlichweiß bis cremefarbig“ (Gravensteiner) → gruenlich und cremeweiss. Grasblümchen „Stielgrube netz- bis strahlenförmig berostet“ → 5 (nicht 7).
- Blütezeit „mittelfrüh“ (Goldparmäne Handb., Graue Französische Renette Wiki), „etwas vor dem Borsdorfer“ (Der Köstlichste), „ziemlich bald“ (Gravensteiner) – kein Code.
- Baumwuchs „wächst lebhaft/freudig“ (Goldparmäne, Edelroter Handbuch) – kein Code; Graue Herbstrenette „wächst lebhaft und schön, wird stark“ → 7.
- Engelbrecht-Maße Graue Herbstrenette: 95:70–72 übernommen, obwohl E selbst schreibt „meistens erheblich kleiner“ (Klammerwerte nicht übernommen).
- Goldparmäne Handbuch „zum Mosten und Dur… sehr schätzbar“: Wort nach „und“ unlesbar (Bd. I nicht lokal), nur most kodiert.
- Roter Rosmarinapfel: Oberdiecks Wertzeichen „**+“ nicht kodiert (nur Engelbrecht-Zeichen sind in der Zuordnung geregelt).

### Stapel _1

- Gubener Warraschke, Engelbrecht „Anf. Jan. bis Anf. Juni“: Juni nicht im Katalog, kein `genussreife_ende` aus Engelbrecht (Wikipedia: Mai).
- Fleischfarbe „grüngelblichweiß“ (Grüner Stettiner, Engelbrecht) und „sehr hell grüngelblichweiß, fast weißlich“ (Lütticher, Engelbrecht): Zuordnung unklar (cremeweiss/gruenlich), nicht codiert. Bei Gubener Warraschke („hellgrüngelblichweiß“) ebenso; dort ist nur das Handbuch („etwas gelblich“) codiert.
- Deckfarbe „hellblutroth“ (Gubener Warraschke, Engelbrecht): zwischen hellrot und dunkelrot, nicht codiert; Handbuch „Blutroth“ = dunkelrot.
- „Kelchröhre sehr kurz“ ohne Formangabe (Grüner Stettiner, Handbuch): kein Code.
- Fruchtform „länglichrund“ (Lütticher, Engelbrecht), „halbkugelförmig“ (Flandrischer Rambour), „käseförmig“ (Hawthornden): kein eigener Code.
- „mattglänzend“ (Lütticher, Engelbrecht): weder `glaenzend` noch `matt` codiert.
- Blütezeit „mittelfrüh“ (Grüner Stettiner, Wikipedia): nicht codiert. Hawthornden „früh bis mittelfrüh“ nur als früh (3).
- Kronung bei Hawthornden („zwischen flach … laufenden Falten“, Handbuch „schönen Falten“) und Lütticher Rambour (Engelbrecht „breiten, flach, doch sehr merklich … Rippen“) nicht codiert. Querschnitt „nicht rund“ (Lütticher, Engelbrecht) nicht codiert.
- Geschmack Hilliard, Engelbrecht „vorherrschend, doch nicht scharf weinig, genügend süß“: nur Säure 7, Süße nicht codiert.

### Stapel _1

- Heuchelheimer `kelchhoehle_form`: „Kelchhöhle breit trichterförmig bis dreieckig“ (Pomologen-Verein) ohne Tiefenangabe, als dreieck_breit codiert (breit). Unsicher; ggf. löschen.
- Hibernal `kelchhoehle_form`: „tiefe, breite Kelchhöhle … kegel- bis kegelstumpfförmig“ (Wikipedia), ohne Bruch, daher kein Code, nur Text.
- Blutroter Kardinal: HB „Kelchröhre: starker Kegel“, ohne Tiefe, daher kein Code.
- Blutroter Kardinal `schale_lentizellen_art`: E „hellbräunlichgelb“ ist weder eindeutig braun noch hell, daher kein Code. Das HB „grau“ ist als hell codiert.
- Ingrid-Marie `schale_lentizellen_art`: „hell umhöft“ (Arche Noah) bzw. „weit umhöfte Lentizellen“ (Pomologen-Verein). Der Katalog hat nur umhoeft_gruen und umhoeft_rot, daher kein Code.
- Ingrid-Marie `kerne_form`: „breitoval zugespitzt“ lässt sich nicht eindeutig zuordnen, daher kein Code.
- Horneburger `kernfaecher_form`: Wände „bogenförmig“ lassen sich nicht eindeutig zuordnen, daher kein Code. `fleisch_festigkeit`: „anfangs fest und dicht, später mürber“ ist kein Zustand in der Genussreife, daher kein Code.
- Holländer Prinz: Das Sortenblatt sagt, der Sorte fehle das „offene Kernhaus“ der Prinzenäpfel. Daraus habe ich keinen Code für `kernfaecher_oeffnung` abgeleitet, die Angabe steht nur im Text. `schale_deckfarbe_anteil` 7 aus „kann bis zu 2/3 karminrot überzogen sein“ ist ein Höchstwert.
- Pojnik und Pomeranzenapfel, Geschmack „(etwas) vorherrschend weinig, nicht ganz so (doch genügend) süß“: Das liegt zwischen den Tabellenfällen 7/3 und 5/5, codiert ist Säure 7 und Süße 5.
- Pomeranzenapfel und Lothringer Rambour: „hell carmoisinroth“/„hellcarmoisin“ als hellrot codiert.
- Messwerte aus Spannen (Arche Noah, Ingrid-Marie, „47–55 mm hoch, 65–75 mm breit“): Für Breite und Höhe habe ich jeweils den Mittelwert genommen (70/51).
- Blütezeit „mittelspät“ → 5 und 7; „mittelfrüh“ → 3 und 5; „mittelfrüh bis mittelspät“ (Heuchelheimer) → 5.
- `genussreife_ende` aus „Haltbarkeit bis …“ übernommen: Heuchelheimer April (Pomologen-Verein), Holsteiner Cox Februar (BUND). Für Hibernal („bis Januar haltbar“, ohne Genussreife-Beginn) und Himbacher („Haltbarkeit bis März/April“) nur Text.
- Ingrid-Marie, Arche Noah: „Genussreife: Oktober bis September“ ist offensichtlich ein Druckfehler, daher nicht übernommen.
- Hibernal: Den Satz bei Wikipedia, der Baum könne wegen Triploidie „keine Samen bilden“, habe ich nicht übernommen, er ist sachlich zweifelhaft. Übernommen ist nur, dass die Sorte triploid ist und Pollenspender braucht. Das Gewicht „bis zu 200 g“ ist ein Höchstwert und steht nur im Text.

### Stapel _1

- Kaiser Alexander, Handbuch „Kelchhöhle: ein starker stumpfspitzer Kegel“: ohne Tiefenangabe, kein Code (nur Text).
- Kasseler gelbe Renette, Fleisch „etwas abknackend, zart“: Die Festigkeit ist widersprüchlich (7 oder 3), deshalb kein Code, nur Text.
- Großer Rambour, Deckfarbe „blasse Röthe“: Der Farbton ist nicht eindeutig zuzuordnen, deshalb kein Code.
- Großer Rambour, Kernhaus „läuft in die Breite“: kein Formcode.
- Goldzeugapfel, Handbuch „Trieb und Blüthe … spät“: Die OCR ist verstümmelt (Bd. I-Scan nicht lokal), deshalb ist `bluete_zeit` nicht codiert und die Angabe nicht im Text.
- Jakob Fischer
  - Bogl-bw nennt „ab Ende August folgernd bis Mitte September“, ohne zu sagen, ob das Pflück- oder Genussreife ist. Nicht codiert.
  - Wikipedia nennt eine Haltbarkeit von etwa vier Wochen. Daraus habe ich kein Genussreife-Ende abgeleitet.
- Jakob Fischer, „süßlich-fruchtig“ (bogl-bw): kein Süße-Code.
- Engelbrechts „Kerne zu 1/2/2–3“ (je Kammer): kein `kerne_anzahl`, nur Text.
- Kelchhöhle „kegel- bis kegeltrichterf., ½“ (Winter-Rambour) ist wie in anderen Stapeln als `dreieck_lang` + `trichter_kurz` codiert.
- Goldzeugapfel „schmal trichter- bis kegeltrichterf., ½ bis ⅔“ ist nur als `trichter_lang` codiert, gestützt durch das Handbuch („schmal, häufig tiefgehend, trichterförmig“).

### Stapel _1

- Fleischfarbe „grüngelblichweiss“ / „hell grüngelblichweiss“ / „hellgelblich bis grüngelblichweiss“ (Kanadarenette E, Luxemburger Renette E, Kloppenheimer Streifling E, Lothringer Renette E): zwischen `cremeweiss` und `gruenlich`, nicht codiert. Ebenso Lothringer Renette H „etwas grünlich gelb“.
- Berostung der Wangen bei der Kanadarenette (E: „Anflüge, selbst Ueberzüge von Rost kommen in sehr verschiedenem Grade vor“; H: Roststernchen, die zu Überzügen zusammenfließen): Spannweite zu groß, nicht codiert.
- „im Roth hell umflossen“ / „oft etwas hell umflossen“ / „weiß umringelt“ (Lentizellen; Kloppenheimer Streifling, Lothringer Renette): keine passende Ausprägung (nur grün/rot umhöft).
- Kernhaus „flachrund“ (Burchardts Renette E „zuweilen flachrund“) und „länglich“ (Kleiner Fleiner H): kein Code.
- Kernhaus „flachrund eiförm. bis zwiebelf.“ (Lothringer Renette E): als `eifoermig` und `zwiebel` codiert.
- Kammerform „stielw. spitz, kelchw. abgerundet“ (bei fast allen Engelbrecht-Sorten): kein passender `kernfaecher_form`-Code, nur im Text.
- Kerne „zu 1 bis 2“ / „zu 2“ (je Kammer): kein `kerne_anzahl`, nur Text.
- Genussreife Kanadarenette H „hält oft bis Juni“, Wikipedia „bis Mai/Juni“: Juni nicht im Katalog; als Ende nur E (Mai) und Wikipedia (April) codiert.
- Luxemburger Renette H „hält über 1 Jahr“: nur Beginn codiert.
- Frucht_form Lothringer Renette E „abgest. rundlich bis flachrund kegelf.“: als `rund` und `flachkonisch` codiert (Deutung).
- Kanadarenette H Blüte „nicht sehr früh und dauert mehrere Wochen“: kein Code für `bluete_zeit`.
- Kleiner Herrenapfel Wikipedia „50 bis 80 Gramm“: nicht als `frucht_gewicht` codiert (Spanne, keine Messung), nur im Text; Geschmack „süßlich“ nicht codiert.
- Kleiner Herrenapfel E Kopf „fast o††“: nur `kueche` codiert, „fast Tafelwert“ im Text.

### Stapel _1

- **Alter Nonpareil**, `genussreife_ende`: Engelbrecht „Anf. Januar bis Juni“. Den Juni gibt es im Katalog nicht, deshalb kein Ende-Wert aus Engelbrecht; das Handbuch (Kopf „Jan.—Mai“) liefert Ende 5.
- Handbuch „Kelchröhre kurz“ ohne Formangabe (Alter Nonpareil) und „sehr spitz und kurz“ (Luikenapfel): Diese Angaben sind nicht codiert, nur im Text erwähnt.
  - Ebenso bei der Renette von Breda: „Kelchröhre kurz, mit der Höhle einen etwas eingebogenen Kegel bildend“. Das ist ein Kegel ohne Tiefenangabe.
- Lavanttaler/Lauche „herz-zwiebelförmig“ (Teil des Fleisches innerhalb der Gefäßbündel): Nach dem Grundwort ist das als `kernhaus_form` = zwiebel codiert. Die Angabe beschreibt eher die Kernhauslinie als das Kernhaus selbst.
- „schmal geöffnet“ (Breda) habe ich nach dem Vorgehen anderer Stapel als `kernfaecher_oeffnung` = teilweise codiert.
- Luikenapfel, Kelchhöhle „trichterf. mit oft recht schmaler Röhre, ⅖ bis ½“: Über die Tiefe codiert als trichter_kurz und trichter_lang.
- Luikenapfel, `schale_deckfarbe_anteil`: Engelbrecht „meistens ringsum … gestreift“ → 9, Handbuch „größter Theil der Frucht“ → 7.
- Luikenapfel, Fleisch „oft schwach geröthet“ bzw. „unter der Schale fein geröthet“: nicht als `roetlich` codiert, nur im Text.
- Landsberger Renette, „mattglänzend“: kein Code (weder glänzend noch matt eindeutig).
- Lentizellen „hell umflossen“ (Landsberger): Für einen hellen Hof gibt es keinen Code. Codiert ist nur `braun`.
- Küttiger Dachapfel: Wikipedia gibt Maße als Spannen an (60–65 : 54–60 mm). Codiert sind die Mittelwerte 62,5 und 57 mm.
- Küttiger Dachapfel, „blüht erst Mitte Mai“: kein `bluete_zeit`, weil „spät“ nicht ausdrücklich dasteht.
- Küttiger Dachapfel, „Kernhausfächer … mit meist nur einem Kern“: Das ist wohl je Fach gemeint, deshalb kein `kerne_anzahl`.
- Laxtons Superb, Fleisch „kurz nach der Ernte saftig, später locker und fast breiig“: keine `fleisch_festigkeit`. Der Zustand in der Genussreife ist nicht eindeutig.
- Laxtons Superb, „Berostung ist selten“: nicht codiert.
- Emilie Müller, Engelbrecht „Hälften wenig verschieden“: keine Symmetrie codiert. Ebenso bei der Renette von Breda: „Hälften zuweilen etwas ungleich“.
- Braddicks Nonpareil, `baum_wuchs`: Hogg (über das Handbuch) „wächst langsam“ → 3, Oberdieck „in der Baumschule rasch“ → 7. Beide Werte sind aufgenommen.

### Stapel _1

- Genussreife Juni: Neuer Stein-Pepping, Engelbrecht „Ende Januar bis Juni“; Handbuch „bis in den Sommer“ → kein `genussreife_ende`.
- Kernfächerwände „ohrenförmig“ (Maunzen, Trenthorst) → kein Code für `kernfaecher_form`.
- „mattglänzend“ (Muskatrenette, Dietzer Goldrenette, Maibiers Parmäne) → weder `glaenzend` noch `matt` gesetzt.
- Lentizellen „in der Röte hell umrandet“ (Moringer, Lauche) bzw. „weißlich glasig umhöft“ (Minister von Hammerstein) → kein passender Code (nur rot/grün umhöft).
- Fleischfarbe „hellgrüngelblichweiß“ / „schwach grünlich weißgelb“ (Neuer Stein-Pepping) → kein Code.
- Grundfarbe „blaßgelb“ (Maibiers, Lauche) → als `gelb` codiert (Vorlauf), alternativ `weisslichgelb`.
- „Kelchröhre geht als Kegel oder mehr cylinderförmig ziemlich herab“ (Neuer Stein-Pepping, Handbuch IV) → kein Code.

### Stapel _1

- Engelbrecht „Kerne zu 2“ usw. (je Kammer): kein `kerne_anzahl`, nur Text (alle Engelbrecht-Sorten).
- Lentizellen mit **gelbem Hof** (Orleansrenette, Handbuch und Wikipedia; Multhaupts Renette „weißlich gelb umflossen“): keine passende Ausprägung; bei Multhaupt als „hell“ codiert, bei Orleans nur „braun“ und Text.
- „matt glänzend“ (Van Mons' Renette, E): weder `matt` noch `glaenzend` codiert.
- „länglichrund“ (Hildesheimer, E) und „eiwalzenförmig“ (Nathusius, E): nur Grundform codiert, Rest im Text.
- „hochrund“ (Orangenburg, Wikipedia): kein Code.
- Orangenburg „Der Kelch ist flach“: unklar, ob Kelchgrube gemeint; kein Code.
- Napoleonsapfel: „Kelchhöhle mehr oder weniger dreieckig“ ohne Tiefe → kein `kelchhoehle_form`; Geschmack „säuerlich, später süßlicher … mild“ → keine Süße/Säure-Codes; „Stiel 1 bis 2 cm“ nur Text.
- Müschens Rosenapfel: Stiel „meistens nur ein Butz“ (Handbuch) → kein `stiel_laenge`.
- Van Mons' Renette: „Kelchröhre tief und weit“ (Handbuch) ohne Form → kein Code.
- Naményer Rote: `frucht_gewicht` = 125 als Mittel aus „120–130 Gramm“ (analog zur Höhenregel).
- Ontarioapfel: „blüht mittelspät“ als `bluete_zeit` 5 und 7.
- Handbuch-Wertzeichen in Kopfzeilen (Sterne/Kreuze) sind in der OCR unsicher und wurden nicht codiert; Verwendung aus dem Fließtext.

### Stapel _2

- `bluete_zeit`: „mittelfrüh“ hat keinen Code (Karmeliterrenette, Handbuch; Peter Broich, Wikipedia). Bei Oberdiecks Renette steht „mittelfrüh, zur Zeit der allgemeinen Apfelblüthe“; dort wurde 5 vergeben.
- `kernhaus_form`: „melonenförmig“ (Pommerscher Krummstiel, Handbuch) ohne Code; nur im Text.
- `schale_grundfarbe`: „blaßgelb“ (Goldapfel von Kew, Handbuch), „hochstrohgelb“ (Parkers Pepping, Handbuch), „levergelb“ (Pommerscher Krummstiel, Handbuch) nicht codiert.
- `schale_lentizellen_art`: „hell umringelt/gelblich umflossen“ (Karmeliterrenette, Peter Broich, Pfirsichroter Sommerapfel) hat keinen Code; nur im Text. Querlinien der Punkte auf der Kelchwölbung (Oberdiecks Renette) nur im Text.
- `schale_beschaffenheit`: „mattglänzend“ (Pfirsichroter Sommerapfel, Oberdiecks Renette) nicht codiert; „fast fettig“ (Erzherzog Anton, Handbuch) nicht als fettig codiert.
- `kelchhoehle_form`: Handbuch „Kelchröhre ganz kurz“ ohne Formangabe (Renette von Middelburg) nicht codiert.
- `baum_wuchs`: „treibt nicht stark“ (Erzherzog Anton), „wächst gut, wird nicht groß“ (Pfirsichroter Sommerapfel), „ziemlich schlank“ (Oberdiecks Renette) nicht codiert.
- `kerne_anzahl`: Engelbrecht nennt nur Kerne je Kammer, daher keine Werte.
- Pommerscher Langsüßer: Maße 70 × 75 mm aus Lauche als Messwerte übernommen (keine Engelbrecht-Angabe vorhanden). Kernhausform nach Lauches „durch die Gefäßbündel umgrenzter Teil hoch-zwiebelförmig“ als zwiebel codiert.
- Osnabrücker Renette: `pflueckreife` 10 aus Wikipedias „Baumreife Ende Oktober“.

### Stapel _2

- kernhaus_form: „breit eilanzettlich“ (Prinzenapfel, E:71) und „flachrund“ (Hörlins Pepping, E:368) – kein Code.
- frucht_form: „länglichrund“ (Gelber Lavendel-Pepping) – nur „rundlich“ codiert.
- Gelber Lavendel-Pepping: „höchstens rothe Einfassung einzelner Punkte“ (Handbuch) – nicht als umhoeft_rot codiert, nur im Text.
- Prinz Albrecht: „mittelspäte Blüte“ – kein bluete_zeit-Code. Kelchgrubentiefe aus der Obsttafel („tiefen Stielbucht“, offensichtlich Kelchbucht gemeint) als kelchgrube_tiefe 7 codiert. Die numerischen „Fruchtzahlen“ der Obsttafel sind nicht ausgewertet.
- Purpurroter Cousinot: Genussreife-Ende „bis zum Ende des Frühjahrs bzw. Beginn des Sommers“ – kein Monatscode.
- Engelbrecht „Kerne zu 1 bis 2 / zu 2 / zu 2 bis 4“ – nur im Text (kerne_anzahl nicht gesetzt).
- Kelchhöhle Prinzenapfel „fast ½“ als dreieck_breit (unter ½) codiert; Hahnen-Pepping „kegeltrichterf., gut ½“ nach der Tiefenregel als trichter_lang (nicht trichter_kurz).
- Geschmack „etwas vorherrschend (kräftig) weinig, fast ebenso süß“ einheitlich als Süße 5 / Säure 5 codiert.

### Stapel _2

- Roter Astrachan, Engelbrecht: Kernhaus „breit elliptisch bis zwiebelf.“ – nur zwiebel codiert, „elliptisch“ ohne Code.
- Rote Sternrenette, Engelbrecht: Grundfarbe „gelblich“ als gelb codiert (unter dichter Deckfarbe).
- Rote Sternrenette: Fleisch „hellgelblichweiss bis weiss, unter der Schale … leicht geröthet“ – cremeweiss und roetlich codiert, weiss weggelassen (max. zwei Werte).
- Süße Herbstrenette, Handbuch: „zum Welken“ (Trocknen?) – nicht als doerren codiert.
- Duquesnes Pepping, Handbuch: Genussreife „bis Ostern“ – kein Monatscode.
- Rheinischer Winterrambur, Wikipedia: Blüte „mittelspät“ – kein Code.
- Ribston Pepping, Wikipedia: Maße 6–7 cm breit, 5–6 cm hoch; Roter Bellefleur, Wikipedia: 68–78 mm breit, 50–60 mm hoch – Spannweiten nur im Text.
- Rheinischer Krummstiel, Engelbrecht: Krönung „zwischen flach über die Frucht laufenden Rippen“ – kein Code.

### Stapel _2

- Kegeltrichterförmige Kelchhöhle mit Tiefe ½ oder mehr (Fette Goldrenette, Roter Brasil): nach der Ergänzungsregel (Tiefe entscheidet) dreieck_lang und trichter_lang.
- Roter Brasil, Handbuch „Kelchröhre: kurz, sitzt auf dem Kernhause auf, ohne Fortsatz … nach dem Mittelpunkte der Achsenhöhle“: kein Code (kurz vs. bis zum Kernhaus widersprüchlich), nur Text.
- Roter Brasil, Engelbrecht „kegelwalzenf.“: kein eigener Formcode; nur „abgest. rundl.“ → rund kodiert.
- Roter Brasil, Engelbrecht „Hälften wenig verschieden“: keine Symmetrie kodiert.
- Roter Brasil, Handbuch „wächst gut, wird groß“, Wikipedia „sehr große Bäume“: kein Wuchscode.
- Roter Eiserapfel, Handbuch „hält sich … bis Johannis“ (Ende Juni): Juni nicht im Katalog, kein Endcode aus dem Handbuch.
- Roter Eiserapfel, Engelbrecht „Fleisch gelblich bis grüngelblichweiss“: nur gelblich kodiert.
- Roter Eiserapfel, Handbuch „Kelchröhre ist kurz und spitz“ → dreieck_breit (wie Stapel 01), widerspricht Engelbrechts ½ (dreieck_lang); beide aufgenommen.
- Staatenparmäne, Engelbrecht „mattroth überlaufen“: kein Farbton kodiert (matt rot nicht in der Tabelle).
- Fette Goldrenette, Engelbrecht „etwas vorherrschend weinig, genügend süss“ → Säure 7, Süße 5 (Ermessen).
- Juni ohne Katalogcode: Roter Stettiner (Engelbrecht „Januar bis Juni“, Handbuch „hält bis zum Sommer“) – Genussreife-Ende nur aus Wikipedia (Mai); Roter Eiserapfel (Handbuch „bis Johannis“).
- Roter Eiserapfel, Engelbrecht „Jan. bis Aug. u. länger“ → Ende 8 (Folgejahr).
- Engelbrecht „Hälften wenig verschieden“ (Roter Brasil) bzw. „Hälften meistens wenig verschieden“ (Roter Herbstkalvill): keine Symmetrie kodiert.
- „Baum wächst lebhaft“ (Handbuch: Roter Herbstkalvill, Sommerparmäne) nicht als Wuchsstärke kodiert, nur Text.
- Kelchkronung „zwischen flachen … Falten“ (Roter Stettiner) → 1; „deutlichen, flach … laufenden Falten“ (Roter Eiserapfel) → 5.
- Roter Herbstkalvill, Engelbrecht Kelchhöhle „stumpf trichter-walzenf. bis kegelförm., meistens bis nahe zur Achsenh., zuweilen sich in dieselbe öffnend“ → roehre_kernhaus; Handbuch „bildet mit der kurzen Röhre einen kurzen Kegel“ → dreieck_breit.
- Roter Krieger, Erhalternetzwerk „Kelchhöhle trichterförmig, geht in teilweise bis zum Kernhaus reichende Röhre über“ (Röhre nur bei etwa der Hälfte der Früchte) → roehre_kernhaus.
- Roter Krieger: Kammerform „fächer-, bogen- bis ohrenförmig“ ohne Katalogcode.
- Roter Pariner: Blüte „mittelspät“ nicht kodiert (zwischen 5 und 7); „leicht wachsige Schale“ nicht als fettig/bereift kodiert.
- Sommerparmäne, Engelbrecht „abgestumpft eikegelf.“ → nur stumpfkonisch; Fleisch „hellgrüngelblichweiss“ ohne Code.
- Fleischfarbe „hellgrünlich bis grüngelblichweiss“ (Roter Stettiner) → gruenlich.

### Stapel _2

- `frucht_form`: Birnförmiger Apfel, „verkehrt ei- oder eikegelf., sehr kelchbauch.“ (Engelbrecht Nr. 469) – verkehrt eiförmig hat keinen Code.
- `frucht_form`: Roter Winter-Calvill, „abgest. länglich rund“ – „länglich“ ohne Code.
- `frucht_breiteste_stelle`: Roter Winter-Calvill, „nicht oder wenig stielbauch.“ – nicht eindeutig.
- `kernhaus_form`: Birnförmiger Apfel, Engelbrecht „breit lanzettlich“ – kein Code (Handbuch „zwiebelförmig“ codiert).
- `kernhaus_achse`: Roter von Simonffi, „Achse minimal hohl“ (Arche Noah) – zwischen geschlossen und offen, kein Code.
- `kernfaecher_form`: Roter von Simonffi, „Wände zerrissen, ohrenförmig“; Roter Baschesapfel, Handbuch „Kammern rundlich“ – kein Code.
- `kerne_form`: Roter von Simonffi, „Kerne rehbraun, oval, 7:4,5 mm“ – „oval“ bei Kernen nicht in der Tabelle.
- `kernhaus_lage`: Roter Baschesapfel, Handbuch „ziemlich weit nach unten“ – Ausrichtung der Abbildung unklar, kein Code.
- `baum_wuchs`: Roter Winter-Calvill „wächst nicht stark“, Birnförmiger Apfel „wächst anfangs lebhaft“, Roter Baschesapfel „anfangs starkes Holz“ – nicht eindeutig, nur Text.
- `frucht_kronung`: Roter von Simonffi, „Einsenkung … gefältelt, Rand feinrippig“ – nicht eindeutig, nur Text.
- `schale_deckfarbe_art`: Ruhm aus Kelsterbach, Wikipedia „kann leicht gelblich gestreift oder verwaschen sein“ – widersprüchlich formuliert, nur Text.
- `kerne_anzahl`: überall nur „zu 1 bis 2“/„zu 2“ je Kammer – kein Wert.

- Weißer Sommer-Strichapfel: Kelchhöhle „kegel- oder etwas kegeltrichterf., fast 1/2 zur Achsenh.“ als unter ½ gewertet → `dreieck_breit` + `trichter_kurz`. Handbuch: Diel „bis fast auf das Kernhaus herabgehender Cylinder“ → `roehre_kernhaus`, Oberdieck „breiter, ziemlich herabgehender Kegel“ → `dreieck_lang`.
- Echter Winterstreifling: Handbuch „Kelchröhre tief und spitz bis fast zum Kernhaus“ als Kegel → `dreieck_lang`.
- Birnförmiger Apfel: Geschmack „etwas weinig, vorherrschend, doch nur mässig süss“ → Süße 5, Säure 3.
- Roter Winter-Calvill: „flach, doch ziemlich deutlich über die Frucht laufenden Rippen“ nach Tabelle → Rippung 7.

### Stapel _2

- „etwas vorherrschend weinig, nicht ganz so/nicht viel weniger süß“ (Safranapfel, Schmidberger Renette, Gelber Winter-Stettiner, Schöner aus Boskoop): nicht in der Tabelle; als Säure 7, Süße 5 kodiert.
- „etwas offen“ (Engelbrecht, Kammern) als `teilweise` kodiert (Safranapfel, Schmidberger Renette, Wellington).
- „Achsenhöhle sehr schmal“ (Kleiner Bohnapfel) als `offen` nach Tabelle („schmal → offen“).
- Fleischfarbe „hellgrüngelblich“/„grünlichgelb“ (Kleiner Bohnapfel) als `gelblich` (Grundwort).
- Deckfarbton „dunkelcarmoisin“ (Altgelds Küchenapfel) als `dunkelrot`; „mattroth“ (Wellington) und „erdartige Röthe“ (Gelber Winter-Stettiner, Handbuch) ohne Farbton-Code.
- Altgelds Küchenapfel, Handbuch: „Kelchröhre spitzer, kurzer Kegel“ – widersprüchliche Formwörter, kein Code.
- Wellington, Handbuch: „Kelchröhre mittelmäßig, kegelförmig“ – keine Tiefe, kein Code.
- Blütezeit „mittelfrüh“ (Schmidberger Renette, Wikipedia), „mittelfrüh bis spät“ (Nordhausen, Arche Noah), „mittelspät“ (Herrnhut): kein Code.
- **Juni:** Gelber Winter-Stettiner, Engelbrecht „Januar bis Juni“ – genussreife_ende nicht kodiert (kein Monatscode Juni).
- Kleiner Bohnapfel: Oberdieck „wenn sie bis Mitte October am Baume bleiben“ – keine ausdrückliche Pflückangabe, nur im Text.
- Schmidberger Renette, Wikipedia „reift im Oktober“ – unklar ob Pflück- oder Genussreife, kein Code.
- Schöner aus Nordhausen: Maße (60–70 × 53–60 mm, Arche Noah) nur im Text, da keine Engelbrecht-Gestaltangabe.
- Safranapfel, Engelbrecht „Hälften zuweilen nicht ganz gleich“: keine Symmetrie kodiert.

### Stapel _2

- Genussreife bis **Juni** (kein Monatscode): Sternapfel (E „Januar bis Juni“), Polnischer Papierapfel (E „Ende Decemb. bis Juni“, Handbuch „bis in den Sommer“) – nur Beginn codiert.
- Sternapfel, Engelbrecht: Kelchhöhle „etwas stumpf kegel- oder kegeltrichterförm., ?/₅ (oder ⅔) zur Achsenh.“ – Bruch auch am Scan nicht sicher lesbar (⅖ oder ⅔), daher kein Code aus Engelbrecht; Code nur aus dem Handbuch (sehr kurzer Kegel → dreieck_breit).
- Kleiner Langstiel, Handbuch: „Kelchröhre conisch, von mittlerer Länge“ – keine Tiefe, kein Code.
- Gelber Herbst-Stettiner, Handbuch: „Kelchröhre sehr kurz“ – ohne Form, kein Code.
- Sonnenwirtsapfel, KOB: „Breite, tiefe bis sehr tiefe Kelchhöhle“ – ohne Formwort, kein Code. „hell umhöfte Lentizellen“ – kein passender Code (nur grün/rot umhöft), nur Text.
- Signe Tillisch: Kerne „oval zugespitzt, auffallend platt gedrückt“ – nicht codiert. Fruchtmaße 80–90 × 70–85 mm (Spanne, kein Engelbrecht-Maß) nur im Text. „mittelständig“ als kernhaus_lage mitte gedeutet.
- Schöner von Wiltshire: Blüte „mittelfrüh“ (Wikipedia) – kein Code; Lauche Kerne „ovale, lang-zugespitzte“ nicht codiert.
- Sonnenwirtsapfel: Gewicht 160–190 g (Spanne) nur im Text; Blüte mittelfrüh, kein Code.
- Handbuch-Wertzeichen (*, ++) nicht in `verwendung` übertragen, nur Engelbrecht-Zeichen.
- Engelbrecht „Kerne zu 1 bis 2“ usw. nur im Text (kein kerne_anzahl).

### Stapel _2

- Kleiner Api: Genussreife-Ende „Juni“ (E) – kein Monatscode.
- Stina Lohmann: „kann bis Juli gelagert werden“ (Wikipedia) – nicht als Genussreife-Ende codiert, nur Text; „leichte Rippen um die Blüte“ – Krönung nicht sicher zuzuordnen; „teilweise rosafarbene Deckfarbe“ – Anteil nicht codiert.
- Königs-Fleiner: Form „kegelwalzenförmig“ (E) – kein Code (Handbuch-Werte walzenförmig/abgestutzt kegelförmig verwendet); „Hälften wenig verschieden“ – Symmetrie nicht codiert; Lentizellen „hellgraubraun“ (E) – Art nicht codiert.
- Taubenapfel von St. Louis: Stielgrube „unter mitteltief“ – Tiefe nicht codiert; Handbuch-Kelchröhre „sehr tiefer, weiter und stumpfer Kegel“ – widersprüchliche Formwörter, kein Code.
- Müllers Spitzapfel: Kammern „etwas ungleich offen“ (E) – nicht codiert (Handbuch „halboffen“ → teilweise); Form „eikegelförmig“ – nur „eiförmig“ codiert.
- Transparent von Croncels: Lauche „Kernhaus fast geschlossen“ – nicht codiert; Lentizellen „meistens nur Dupfen“ – Art nicht codiert; Wikipedia „schwach fettig“ – nicht als fettig codiert.
- Vaterapfel ohne Kern: kerne_anzahl = 0 aus „Kerne fehlen“ (E), Handbuch „fast nie … einen Kern“.
- Uelzener Rambour: Geschmack „süßlich oder säuerlich“ (Wikipedia) – nicht codiert.
- Tulpenapfel: „reift von September bis November“ (Wikipedia) als Genussreife codiert; ob Pflück- oder Genussreife gemeint ist, bleibt offen.

### Stapel _2

- `kernhaus_form` ohne Code: Wagenerapfel E „sehr flachrund“ (52:26).
- Weilburger E „flachrund bis flachrund zwiebelf.“ → nur zwiebel kodiert.
- `kernfaecher_form` ohne Code: Vaterapfel „Kernhauswände bogen- bis ohrenförmig, wattig gerissen“.
- `kerne_form` ohne Code: Kirchmessapfel HB „ziemlich großen spitzen braunen Kernen“ (kein Grundwort); Weißer Klarapfel AN „länglich oval, zugespitzt“ (oval nicht in der Kerne-Tabelle); Weißer Matapfel HB „klein, rund eiförmig“ (OCR „RR klein“, Wort für Kerne verstümmelt; nur im Text).
- `kelchhoehle_form` ohne Code (Kegel ohne Tiefe): Secklerapfel HB „etwas herabgehender Kegel, mitunter Cylinder bis ins Kernhaus“; Meißner Zitronenapfel HB „etwas eingezogen, kegelförmig“; Weißer Matapfel HB „weit, kegelförmig“.
- Wagener E „schmal kegel- oder kegeltrichterf., ⅗“ → dreieck_lang und trichter_lang (Kegeltrichter ohne Röhrenangabe, Tiefe ab ½). Winter-Zitronenapfel E „kegel- bis fast kegeltrichterförmig, ½“ → nur dreieck_lang („fast“).
- `bluete_zeit` ohne Code: „mittelfrüh“ (Vaterapfel W, Wagener W, Klarapfel AN). Klarapfel W „früh bis mittelfrüh“ → 3.
- `schale_grundfarbe`: Vaterapfel „blassgelb“ → gelb (Ermessen, wie hellgelb).
- `schale_deckfarbe_anteil` ohne Code: Kirchmessapfel (HB: stellenweise zusammenfließend; Diel: rundum dunkelrot verwaschen) – nur Text. Uttwiler W „Anflug bräunlicher Röte“ bei gut besonnten Früchten → 3 (Ermessen).
- Geschmack (Ermessen, wie in anderen Stapeln): E „vorherrschend weinig, mässig/genügend süss“ bzw. „etwas vorherrschend, doch nicht viel weniger süss“ → Säure 7 / Süße 5 (Secklerapfel, Wagener, Winter-Zitronenapfel, Weilburger, Weißer Matapfel). Kirchmessapfel HB „feinen zuckerartigen, kraftvollen Weingeschmack“ → Süße 7, Säure 5. Vaterapfel Faltblatt „süßsäuerlich … säurearm“ → Süße 5, Säure 3. Uttwiler W „sauer“ → Säure 9. Secklerapfel HB „weinig gezuckert“ ohne Code. Wagener HB „merklich gezuckert, feine milde Säure“ → nur Säure 5. Winter-Zitronenapfel HB „mildem, weinsäuerlichem … gezuckertem“ → Säure 5.
- `fleisch_festigkeit`: Kirchmessapfel HB „markicht“ (5) und „mürben Fleische“ (3) beide kodiert. Winter-Zitronenapfel E „erst abknackend, später mürbe“ → 3 (Zustand in der Genussreife). Weilburger E „abknackend, später etwas mürber“ → 7.
- `kernfaecher_oeffnung`: Wagener E „nicht weit offen“ → teilweise (Ermessen).
- `stiel_dicke`: Kirchmessapfel HB „kurz und stark“ → 7 (stark als dick gedeutet).
- `frucht_rippung`: „Querschnitt (meistens) nicht ganz rund“ → 3.
- `genussreife_ende` ohne Code wegen Juni bzw. „Sommer“: Secklerapfel (E bis Juni, HB bis in den Sommer), Weilburger E (bis Juni), Weißer Matapfel (E bis Juni, HB bis zum Sommer). Winter-Zitronenapfel HB „bis Ostern“ nicht kodiert.
- Weilburger W „reifen Mitte Oktober“ nicht als Pflück- oder Genussreife kodiert (nicht eindeutig).
- Weißer Klarapfel: Fruchtmaße (45–55 mm hoch, 58–73 mm breit) nur im Text, nicht als Messwert (Spannen, keine Engelbrecht-Messung).

### Stapel _2

- Rote Kasseler Renette: „hält sich bei guter Aufbewahrung bis Juni“. Juni fehlt im Katalog, kein Code.
- Weißer Winter-Calville: Kernhaus „zwiebelf. bis flachrund“; nur „zwiebel“ codiert. „Hälften meistens wenig verschieden“ ist nicht als Symmetrie codiert.
- Lord Suffield: Lauches „Raum melonenförmig“ (Kernhaus) hat keinen Code. „fast fettig“ ist nicht als fettig codiert.
- Weißer Rosmarinapfel: „röthlicher Anflug“ und „gelblich blutroth“ (Wachs-Renette, als dunkelrot codiert) sind Grenzfälle beim Farbton.
- Winterbananenapfel: „maximal 30 % Deckfarbe“ ist nicht in einen Anteil umgerechnet; der Anteil 5 kommt aus Wikipedia („Sonnenseite“). „orangerot“ ist als orange codiert.
- Westfälischer Gülderling: „Reifezeit Anfang Oktober“ ist als Genussreifebeginn 10 codiert. Ob Pflückreife gemeint ist, bleibt offen.
- Welschisner: Lauche „der Bauch sitzt dem Kelche genähert … nach dem Kelche merklicher abnimmt“ ist in sich widersprüchlich (wohl Druckfehler). `frucht_breiteste_stelle` nicht codiert.

### Stapel _3

- Zürcher Transparent: Grundfarbe „wachsartig weiss“ (Engelbrecht) bzw. „weißgrün bis weißgelb“ (Wikipedia). Der Katalog hat kein „weiß“; zugeordnet ist `weisslichgelb`.
- Worcester Pearmain: Für Deckfarbe „blutigcarmoisin“ ist `rot` gewählt; `dunkelrot` wäre auch vertretbar. Lauches „auf der Schattenseite schwach, auf der Sonnenseite stark geröthet“ steht ohne Anteilscode nur im Text.
- Zuccalmaglios Renette: Deckfarbe „gelbrot verwaschen“ (Wikipedia) hat keinen Farbtoncode; nur `verwaschen` ist vergeben.
- Wohlschmecker aus Vierlanden: „typische Rostnetze“ steht ohne Berostungscode nur im Text, weil die Menge nicht angegeben ist.
- Zabergäurenette: „im Oktober reifend“ ist nicht eindeutig Pflück- oder Genussreife; kein Code, nur Text. „weniger säurebetont als Boskoop“: kein Code.
- Zwiebelborsdorfer: „Reifezeit Ende Oktober“ (Wikipedia) ist nicht eindeutig; kein Code. „Kerne meist flach“ (Handbuch): kein Code.
- Zuccalmaglios Renette: „Rostanflüge … namentlich um die Kelchwölbung“ betrifft die Kelchwölbung, die Kelchgrube ist nicht genannt; kein Code für `schale_berostung_kelchgrube`.
- Engelbrecht „Kerne zu 1 bis 2“ usw. sind Angaben je Kammer; kein Wert für `kerne_anzahl`.
- Weißer Taffetapfel: Für den Hinweis des Handbuchs, die Frucht „muß auch sehr guten Wein geben“, ist kein `most`-Code vergeben, weil es eine Vermutung ist. Der Hinweis steht im Text.
- „Hälften wenig verschieden/wenig ungleich“ ist wie in den übrigen Stapeln als `symmetrisch` codiert.
- „Kelch geschlossen oder wenig offen“ ist nur als `geschlossen` codiert.

### Stapel _3

- Jonathan: „abgestumpft ei- bis eikegelförmig“ – nur `eifoermig` codiert, „eikegelförmig“ hat keinen Code.
- Weißer Wintertaffetapfel: Handbuch „Gestalt ziemlich platt“ und „geräumige Senkung“ ohne Code; „Kelchröhre zieht sich spitz … tief herab“ in der OCR teils unlesbar, nicht codiert (Code aus Engelbrecht).
- Weißer Wintertaffetapfel: `kernhaus_lage` = kelch aus Engelbrecht „Kammern etwas hochsitzend“ und Handbuch „mehr nach dem Kelche hin“.
- Weißer Wintertaffetapfel: `schale_deckfarbe_art` = verwaschen aus „rosiger Anflug“ (Anflug als verwaschen gedeutet).
- Golden Delicious: „am Kelch sind die fünf Rippen deutlich erkennbar“ – Krönung nicht codiert (zwischen 5 und 9 unklar); Stiel „schmal“ nicht als Dicke codiert; Genussreife-Ende nicht codiert (Lagerangaben nach Lagerart: Frischluft bis Dezember, gekühlt bis März, CA bis Sommer).
