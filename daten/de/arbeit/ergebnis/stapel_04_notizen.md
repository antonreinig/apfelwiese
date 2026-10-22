# Stapel 04 – Notizen

Stand 2026-10-22. 11 Sorten bearbeitet, keine weggelassen. Prüfskript: 0 Fehler, 0 Warnungen. Keine Webquellen genutzt (`stapel_04_quellen.json` = `[]`).

## Weggelassene Sorten

Keine.

## Identität und Grundlage je Sorte

- **Blauer Kölner**: in keinem alten Werk (Suche nach „Kölner“, „Uhlhorn“ ohne Treffer; Sorte entstand erst in den 1890er-Jahren). Grundlage nur Wikipedia (oldid 253846310). Die beiden LVR-PDFs aus den Einzelnachweisen (Obstsortenhandbuch, Sortenflyer Blauer Kölner) liefern 404, auch unter der neuen lvr.de-Adresse; eine Websuche fand kein anderes Sortenblatt. Keine Schnittmerkmale.
- **Holländischer Küchenapfel** (Zusatzsorte): Engelbrecht Nr. 61 (S. 69) = Illustr. Handb. IV Nr. 271 (S. 17–19). Beide nennen Dutch Codlin (Hogg, Downing); Engelbrecht verweist auf Handb. IV, S. 17. Die Kandidaten Holländischer Weinapfel und Kentischer Küchenapfel sind andere Sorten.
- **Blutapfel**: Der Wikipedia-Artikel (oldid 267018468) behandelt die Zierapfel-Hybride *Malus ×purpurea*, keine Kulturapfelsorte. Datensatz deshalb **nur** aus Engelbrecht Nr. 651 (S. 723) und Illustr. Handb. IV Nr. 356 (S. 187–189), ohne Wikipedia-Inhalte und ohne das Synonym „Purpurapfel“; id `blutapfel` beibehalten. Engelbrecht verweist auf Diel II, S. 176 und Handb. IV, S. 187. Kandidat Blauapfel (L:I:247) ist eine andere Sorte. Handbuch-Seiten im Datensatz pauschal mit S. 187 (Beginn des Eintrags) belegt.
- **Bohnapfel** = Großer Bohnapfel: Engelbrecht Nr. 611 (S. 678), Illustr. Handb. I **Nr. 164, S. 359–360** (steckt im Suchwerkzeug im Text von L:I:163 „Winters Bredecke“, Kopfzeile nicht erkannt; Nummer nicht am Scan geprüft, aus der Lücke zwischen Nr. 163 und 165 erschlossen). Der Kleine Bohnapfel (E:610, L:I:165) ist eine andere Sorte und nur im Text `unterscheidung` erwähnt.
- **Winter-Postoph** (Zusatzsorte): Engelbrecht Nr. 87 (S. 97) = Illustr. Handb. I Nr. 87 (S. 205–207).
- **Boikenapfel**: Engelbrecht Nr. 94 (S. 108) und Illustr. Handb. I **Nr. 90, S. 211** (Boiken-Apfel, Beitrag Woltmann; steckt im Suchwerkzeug im Text von L:I:89 „Berliner Schafsnase“). Engelbrecht zitiert „Illustr. Handb. I, p. 211“. Die erste OCR von E:94 vermischt den Eintrag mit dem Nachbareintrag; ausgewertet wurden die zweite OCR und der Scan. Kandidat Luikenapfel ist eine andere Sorte.
- **Brauner Matapfel**: Engelbrecht Nr. 622 (S. 690) = Illustr. Handb. I Nr. 168 (S. 367–368).
- **Grünhofer Hasenkopf** (Zusatzsorte): Engelbrecht Nr. 80 (S. 89) = Illustr. Handb. IV Nr. 277 (S. 29–31).
- **Brettacher**: in keinem alten Werk (bekannt seit 1911). Grundlage nur Wikipedia (oldid 246654750). Keine Schnittmerkmale.
- **Woltmanns Schlotterapfel** (Zusatzsorte): Engelbrecht Nr. 76 (S. 85) = Illustr. Handb. IV Nr. 460 (S. 399–401). Name in heutiger Schreibung ohne Apostroph (wie im Handbuch), „Woltmann's Schlotterapfel“ als Synonym. Nicht vermischt mit Hesselmann's, Heinemann's oder Millet's Schlotterapfel.
- **Böhmischer Rosenapfel**: Engelbrecht Nr. 197 (S. 219) = Illustr. Handb. I Nr. 93 (S. 217–219).

## Lesarten und OCR (am Scan geprüft)

- Kelchhöhlen-Brüche am Scan: E:61 „⅖ bis ½(?)“ – **zweiter Bruch auch vergrößert nicht sicher lesbar** (½ wahrscheinlich, ⅓ nicht ausgeschlossen); E:651 „oft nur ⅓“; E:87 „gut ½“; E:94 „⅗“; E:622 „½“; E:80 „½ bis ⅗“; E:76 „⅗ bis ¾“; E:611 „⅓“; E:197 ohne Bruch („bis nahe zur Achsenh.“).
- Wertzeichen am Scan: E:61 ††; E:651 fast o††; E:87 o††; E:94 fast oo und ††; E:622 o††; E:80 o††; E:76 ††; E:611 ††!; E:197 o††.
- Hinweis für die Werkzeuge: Die Seitenbilder in `seitenbilder/` werden von parallelen Stapeln überschrieben (gleicher Dateiname je Seite, `--unten`-Ausschnitt hängt offenbar vom Eintrag ab). Ein Ausschnitt von `E_0126_u.jpg` zeigte zwischenzeitlich einen anderen Eintrag. Ich habe die Bilder deshalb direkt nach dem Rendern in den Scratchpad kopiert.

## Zuordnungsentscheidungen (Ermessen)

- Kelchhöhle nach der ergänzten Regel (Tiefe entscheidet): E:61 ⅖ → dreieck_breit, dazu „etwas kegeltrichterf.“ → trichter_kurz (bei ½ als zweitem Bruch käme dreieck_lang hinzu). Handb. IV „breiter Kegel“ ohne Tiefe → dreieck_breit. E:87 „kegel- bis fast kegeltrichterf., gut ½“ → dreieck_lang + trichter_lang; ebenso E:94 (⅗) und E:76 (⅗–¾). E:651 „trichterförmig, oft nur ⅓“ → trichter_kurz. E:197 „breiter, stumpfer Kegel bis nahe zur Achsenh.“ → dreieck_lang.
- Handbuch-Kelchröhren: Winter-Postoph „mehr cylindrisch als conisch, reicht bis zum Kernhaus“ → roehre_kernhaus; Woltmanns „breiter Kegel oder etwas abgestumpfter Trichter bis auf die Spitze des Kernhauses“ → dreieck_lang + roehre_kernhaus; Brauner Matapfel „weit und tief, trichterförmig“ → trichter_lang; Böhmischer Rosenapfel „sehr weiter tiefgehender Kegel“ → dreieck_lang; Bohnapfel „trichterförmig in eine kleine cylindrische Röhre übergehend“ (OCR-Reihenfolge gestört) → trichter_kurz; Boiken „kurz, kegelförmig“ → dreieck_breit.
- **Ohne Code**: Blutapfel Handb. „Kelchröhre kegelförmig“ (keine Tiefe); Grünhofer Hasenkopf Handb. „Kelchröhre geht als Kegel etwas herab“ (Tiefe unklar).
- „meistens nicht weit offen“ (E:87) und „etwas offen“ (E:622, E:80) → kernfaecher_oeffnung teilweise.
- Blauer Kölner: „abgerundet kegelförmig“ → rundkonisch; „mildsüß-aromatisch“ → Süße 7, Säure 3; „gelblich-weiß mit rötlichen Adern“ → nur cremeweiss (rötliche Adern im Text); „bis in den Februar lagerbar“ als genussreife_ende 2.
- Brettacher: „dicke Wachsschicht“ nicht als `bereift` oder `fettig` kodiert (keines passt sicher), nur im Text. „bis Ende des nächsten Frühjahres gelagert“ → kein Monatscode.
- Bohnapfel Handb. „blaßgelb“ → gelb; Engelbrecht „Januar bis Juli“ und Handb. „März bis Juli“ → genussreife_ende 7 (Juli des Folgejahres).
- Boikenapfel E „Höhle … mässig weithin berostet“ → Stielgrube 5; Woltmann „weinsäuerlich gezuckert, sehr mild“ nicht kodiert (widersprüchlich), nur Text.
- Brauner Matapfel Wikipedia „dunkelviolett“ → kein Farbton-Code.

## Katalog-Lücken

- **Genussreife Juni** (kein Code): Winter-Postoph E:87 „Anf. Januar bis Juni“; Boikenapfel E:94 „Januar bis Juni“; Bohnapfel Wikipedia „bis Juni haltbar“.
- **kernhaus_form „sehr flachrund“**: Böhmischer Rosenapfel E:197 „Kernhaus 49:22, sehr flachrund“ – kein Code.
- **Blütezeit „mittelfrüh“**: Bohnapfel Wikipedia „blüht mittelfrüh und langanhaltend“ – kein Code (nur früh/mittel/spät).
- Kernform Handbuch Winter-Postoph „spitzherzförmig“ – kein passender Katalogwert, nur Text.

## Widersprüche zwischen Quellen

- Holländischer Küchenapfel: Kelchgrube E „mässig tief“, Handb. „tief“; Kerne E „meistens vollkommen“, Handb. „meistens unvollkommen“; Reife E Okt.–Dez., Handb. Ende Sept. (Hogg Aug.–Sept.). Engelbrecht nennt die Kelchhöhle „schmalkegel-“, das Handbuch die Kelchröhre einen „breiten Kegel“ – nach der Tiefenregel beide dreieck_breit.
- Blutapfel: Bauch E stielbauchig, Handb. Mitte; Stielgrube E mäßig tief, Handb. tief; Geschmack Diel weinsäuerlich, Oberdieck weinartiger Zuckergeschmack; Fleisch Diel rosenrot, Oberdieck gelblich.
- Bohnapfel: Kelch E meist halb offen, Handb. offen bis halboffen; Punkte E sparsam/bräunlich, Handb. zahlreich/weißlich; Hälften E gleich, Handb. oft ungleich.
- Winter-Postoph: Stielgrube E mitteltief/mittelweit, Handb. tief/eng; Kernhaus E eizwiebelförmig, Handb. fast herzförmig; Hälften E fast gleich, Handb. oft ungleich; Punkte E ziemlich zahlreich, Handb. spärlich.
- Boikenapfel: Kelch E halb offen bis fast geschlossen, Handb. geschlossen; Kelchhöhle E ⅗ (dreieck_lang/trichter_lang), Handb. „kurz, kegelförmig“ (dreieck_breit).
- Brauner Matapfel: Kammern E „etwas offen“, Handb. offen; Kelchhöhle E Kegel ½, Handb. weiter, tiefer Trichter; Größe Handb. „ziemlich groß“, Wikipedia „mittelgroß“.
- Grünhofer Hasenkopf: Form E eiförmig, Handb. walzenförmig oder kugelig; Kernhaus E 38:36, Handb. 38:47.
- Woltmanns Schlotterapfel: Kelchgrube E mitteltief, Handb. ziemlich tief.
- Böhmischer Rosenapfel: Kelch E geschlossen, Handb. offen.

## Nicht gelesene oder unsichere Stellen

- E:61 zweiter Kelchhöhlen-Bruch (s. o.).
- Handb. I Nr. 164 (Bohnapfel): Die OCR hat die Kelchröhren-Angabe ans Ende des Eintrags verschoben und einen Teil verstümmelt („Kelchröhre: trichterförmig in eine kleine cylindrische Röhre über…“); nicht am Scan nachgelesen.
