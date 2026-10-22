# Stapel 07 – Notizen

Stand 2026-10-22. 11 Sorten bearbeitet, keine weggelassen. 459 Merkmalswerte, davon 52 Schnittmerkmale (Kernhaus, Kammern, Achse, Kerne, Kelchhöhle). Keine Webquellen verwendet (`stapel_07_quellen.json` = `[]`).

## Weggelassene Sorten

Keine.

## Identität und Zuordnungen

- **Königsapfel von Jersey**: E Nr. 92 (S. 106) und Illustr. Handb. I Nr. 17 (S. 65) – Engelbrecht verweist ausdrücklich auf Handb. I p. 65 und Diel. Sicher.
- **Weißkante**: E Nr. 131 (S. 147) = Handb. IV Nr. 464 (S. 407), Verweis bei Engelbrecht. Sicher.
- **Apfel von Uelzen**: E Nr. 108 (S. 122) = Handb. IV Nr. 463 (S. 405), Verweis bei Engelbrecht. Sicher.
- **Roter Augustiner**: E Nr. 128 (S. 144) = Handb. IV Nr. 286 (S. 47). Sicher. Oberdieck setzt Lucas' Rothen Herbst-Tafftapfel gleich; dessen Volksnamen nach Metzger (Tafft-Apfel, Sammetapfel, Seidenrock, Wollenschläger) als Synonyme mit Beleg Handbuch aufgenommen. Diese Namen sind teils Sammelnamen für feinschalige Äpfel (Oberdieck sagt das selbst), bei der Namenssuche vorsichtig verwenden. Lothringer bunter Gulderling/Calville de Rose („vielleicht identisch“) nur im Text.
- **Königlicher Edelapfel**: E Nr. 97 (S. 111) = Handb. IV Nr. 285 (S. 45). Sicher.
- **Doppelter Härtling**: E Nr. 615 (S. 682). Wikipedia nennt Engelbrecht S. 682 als Erstbeschreibung. Sicher.
- **Doppelter Melonenapfel**: E Nr. 63 (S. 71) übernommen. Begründung: gleicher Name, sehr große, hohe, walzenförmige Frucht, Schlotterapfel, Herkunft Kiel/Schleswig-Holstein (Wikipedia: norddeutsche Sorte), kaum Kerne (passt zu triploid). Engelbrecht nennt keine Literatur oder Synonyme; die Gleichsetzung mit dem heutigen Doppelten Prinzenapfel ist plausibel, aber nicht durch ein Synonym in der alten Quelle belegt. „Hasenkopf“ und „Walzenapfel“ (auch für den Prinzenapfel gebraucht) nicht als Synonyme aufgenommen.
- **Doppelter Aachener Hausapfel**: nur Wikipedia. Handb. IV Nr. 507 „Doppelter Hausapfel“ (Diel, Herkunft unbekannt, Reife Dezember, lange haltbar) nicht übernommen: kein Bezug zu Aachen, Pflückreife und Beschreibung nicht abgleichbar. Keine Schnittangaben verfügbar (NABU-Aachen-Seite ohne Sortenbeschreibung).
- **Ditzels Rosenapfel**: entstanden 1890–1901, in keinem alten Werk. Nur Wikipedia. Faltblatt Pomologen-Verein „Hessische Lokalsorte 2005“ (PDF) war per Abruf nicht lesbar; keine Schnittangaben. Hier wäre das Faltblatt nachzutragen.
- **Dorheimer Streifling**: erste Erwähnung 1949, in keinem alten Werk. Nur Wikipedia (dort Schnittangaben aus dem Faltblatt Lokalsorte 2009).
- **Dülmener Herbstrosenapfel**: um 1870 entstanden, kein Eintrag in Engelbrecht, Handbuch I/IV oder Lauche 1883 (Suche „Dülmen“, „Bröser“ ohne Treffer). Nur Wikipedia; die Werte stammen aus den dort zitierten Beschreibungen von Petzold (1979) und Bröser (Original genannt) – im `original` jeweils kenntlich gemacht. Keine Schnittangaben. Die Elternangabe (Weißer Astrachan × Kasseler Renette) steht nur in der Infobox, der Fließtext nennt nur Weißer Astrachan als Mutter.

## Lesarten und OCR (Scan geprüft)

- E 615 (Doppelter Härtling): die zweite OCR-Fassung enthält den Text einer anderen Sorte (vermutlich Nachbarseite). Am Scan gelesen: Kopf „für Apfelkraut ††, Anf. Dec. bis März“; „Gestalt 65:59—60“; Stiel „etwa 10 mm“; Kelchhöhle „½ zur Achsenh.“.
- E 108 (Apfel von Uelzen): Scan zeigt tatsächlich „Gestalt 67:58—52“ – Druckfehler; nur Breite 67 übernommen, keine Höhe und kein Verhältnis. Kopfzeichen „Off“/„O'ff“ als o++ gelesen (nicht am Scan geprüft, oberer Seitenteil wegen vollem Datenträger nicht erzeugt).
- E 131 (Weißkante): Kelchhöhle am Scan „fast ½“; Kopf „fast oo††“.
- E 63 (Doppelter Melonenapfel): Scan „89:86—91“, Kelchhöhle „⅓ bis ½“, Kopf „fast o††“.
- E 128 (Roter Augustiner): Scan „70:56—59“ (OCR 2 „50“ falsch), Kelchhöhle „½“.
- E 92, E 97: Kopfzeichen „Off“/„oft“ bzw. „fast 04}“/„fast oft“ ohne Scanprüfung als o++ bzw. fast o++ gelesen.
- Handb. I Nr. 17: Stiellänge („“ lang“) unlesbar, nicht übernommen.

## Katalog-Lücken und Zuordnungsentscheidungen

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

## Widersprüche zwischen Quellen (beide Werte aufgenommen, im Text genannt)

- Königsapfel von Jersey: Wangenberostung 3 (E) / 5 (HB, Rostnetz); Kelchhöhle bis nahe zur Achsenhöhle (E) / bis aufs Kernhaus (HB).
- Weißkante: Kelchgrube mäßig tief (E) / ziemlich tief (HB); Krönung 1 (E) / 5 (HB); nicht deutlich gestreift (E) / gestreift oder flammenartig (HB); Geschmack ausgeglichen (E) / Zucker mit etwas Säure (HB).
- Apfel von Uelzen: Kelchgrube tief–mitteltief (E) / flach (HB); Stielgrubenrost schwach (E) / strahlig (HB); Säure 3 (E) / 5 (HB); Reifebeginn Januar (E) / Dezember (HB).
- Roter Augustiner: Säure vorherrschend (E 7/3) / Zuckergeschmack etwas weinartig (HB 7/5); Kelchhöhle ½ (E) / breit, oft kurz (HB); Kerne meist 1 (E, Diel) / stets mehrere vollkommene (Oberdieck).
- Doppelter Melonenapfel: Fleisch fast weißlich, markig (E) / gelblichweiß, mürbe (Wikipedia); Säure 7 (E) / 5 (Wikipedia); Röte unbedeutend punktiert (E) / gestreift und gefleckt (Wikipedia).
- Dülmener Herbstrosenapfel: Wuchs mittelstark (Petzold) / kräftig (Bröser); Grundfarbe gelbgrün bis rötlichgelb (Petzold) / sattgelb (Bröser).
- Königlicher Edelapfel: Fleisch weiß (Diel) / grünlichgelb (Oberdieck, Engelbrecht); Geschmack süßweinsäuerlich (Diel) / einschneidend sauer (Oberdieck) / scharf weinig (E).
