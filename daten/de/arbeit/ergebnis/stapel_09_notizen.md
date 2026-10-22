# Stapel 09 – Notizen

Stand 2026-10-22. 11 Sorten bearbeitet, keine weggelassen. 400 Merkmalswerte, davon 44 Schnittmerkmale (Kernhaus, Kammern, Achse, Kerne, Kelchhöhle). Prüfskript: 0 Fehler, 0 Warnungen.

## Weggelassene Sorten

Keine.

## Identität und Zuordnungen

- **Braunschweiger Milchapfel** = Engelbrecht Nr. 140 (S. 160) und Illustr. Handb. I Nr. 188 (S. 409–410). Engelbrecht zitiert Handb. I, p. 409. Der Handbuch-Datensatz enthält ab „Schmidt.“ den Text der Folgesorte (Rother Jungfernapfel); nicht verwendet.
- **Sommer-Zimtapfel** (Zusatzsorte, Name in heutiger Schreibung) = Engelbrecht Nr. 183 (S. 204), Handb. I Nr. 100 (S. 231–232). Synonym „Rother Herbst-Taubenapfel“ (mit Pigeon rouge d'automne) nach Oberdiecks ausdrücklicher Identitätsfeststellung im Handbuch aufgenommen. „Edler Rosenstreifling“ nur im Text (Name für mehrere Sorten), „Couleur de Chair“ nicht aufgenommen (nur Hörensagen bei Diel).
- **Freiherr von Trauttenberg** = Engelbrecht Nr. 115 (S. 129) und Handb. IV Nr. 283 (S. 41). Herkunft widerspricht sich: Handbuch (Oberdieck) nennt Pfarrer Urbanek in Maytheny (Ungarn) als Züchter, Wikipedia nennt die Herkunft ungesichert. Beides im Text.
- **Roter Kronenapfel** (Zusatzsorte) = Engelbrecht Nr. 154 (S. 175), Handb. I Nr. 191 (S. 415). Knoops Namen (Rothe Kroons-Apple, Rode Agt, Tulp-Kroon) nach Handbuch als Synonyme.
- **Fromms Goldrenette** = Engelbrecht Nr. 328 (S. 370, „Fromm's Reinette“), Früchte aus Meiningen auch als „Seeber Borsdorfer“ – passt zu Wikipedia (Seebaer Borsdorfer, Seeba bei Meiningen). Sicher. Engelbrecht zitiert Illustr. Handb. VIII, p. 111; Band VIII gehört nicht zum Material, nur Engelbrechts Maßangabe daraus ist im Text genannt.
- **Morgenduftapfel** (Zusatzsorte) = Engelbrecht Nr. 164 (S. 185), Handb. I Nr. 33 (S. 97–98). In der Handbuch-OCR fehlte Gestalt bis Schale; am Scan nachgelesen.
- **Fießers Erstling, Finkenwerder Herbstprinz, Freiburger Prinzenapfel, Fürst Blücher, Gacksapfel**: in keinem alten Werk (Volltextsuche nach Fieß/Fiess/Erstling, Finkenwerder, Haseldorf, Blücher, Gacks; Kandidaten waren andere Sorten). Grundlage nur Wikipedia, daher keine oder kaum Schnittangaben.
- **Fürst Blücher**: keine Merkmale. Webabruf versucht (Infoblatt Pomologen-Verein MV 2023: PDF nicht lesbar; obstsortenerhalt.de/node/298: HTTP 503). Eine Fruchtbeschreibung muss nachgetragen werden.
- Für Freiburger Prinzenapfel ergab eine Websuche keine verwertbare Sortenbeschreibung; keine Webquelle verwendet. Quellendatei daher leer.
- Fießers Erstling: Wikipedia stützt sich auf die Farbtafel „Nach der Arbeit“ Nr. 184 (BUND-Lemgo-PDF); nicht selbst geprüft.

## Ermessensentscheidungen und Katalog-Lücken

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

## Widersprüche zwischen Quellen (beide Werte aufgenommen)

- Braunschweiger Milchapfel: Kelchgrube mitteltief (E) / ansehnlich tief (HB); Geschmack weinsäuerlich, wenig süß (E) / süß-weinsäuerlich (HB).
- Sommer-Zimtapfel: Stiel dünn bis mitteldick, Höhle mäßig tief (E) / Stiel stark, Höhle weit und tief (HB); Krönung 1 (E) / 5 (HB).
- Freiherr von Trauttenberg: Deckfarbe zuweilen leicht rot (E) / meist fehlend (HB) / orange-rötliche Sonnenseite (Wikipedia); Fleisch markig, Säure überwiegt (E) / mürbe, Zuckergeschmack (HB); Kelchhöhle ⅗ (E) / bis fast aufs Kernhaus (HB); Herkunft (s. o.).
- Roter Kronenapfel: Kelch halb offen (E) / offen (HB); Kelchhöhle ⅖–½ (E) / breiter, wenig tiefer Kegel (HB, Diel: tiefgehend); Süße ausgeglichen (E) / Zuckergeschmack (HB).
- Morgenduftapfel: Stiel mitteldick (E) / stark (HB); Süße ausgeglichen (E) / süßweinig (HB); Kelchhöhle kegeltrichter- bis kegelförmig (E) / langer Zylinder (HB).

## OCR-Stellen (am Scan nachgelesen)

- Brüche der Kelchhöhle am Scan gelesen: E 140 ½ bis ¾; E 115 ⅗; E 154 ⅖ bis ½; E 164 ⅗; E 183 ¼; E 328 ⅓ bis ⅖.
- E 115 Gestalt: OCR „71: 75 — 70“ / „71: 75—76“, Scan 71:75–76.
- Kopfzeilen am Scan: E 140 „††“ (nur Haushalt), E 115 „fast oo††“, E 183 „oo††“. E 154 („00ff/ooff“ = oo++), E 164 („0+f“ = o++) und E 328 („fast 00}+“) nur nach OCR gelesen.
- Handb. I S. 409–410 (Braunschweiger): Stiellänge „¼–½ Zoll“ und Reifeangabe am Scan gelesen.
