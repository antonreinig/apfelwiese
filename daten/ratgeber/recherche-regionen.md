# Recherche: Regionalsorten und seltene Sorten

Stand: 23.10.2026. Grundlage für den Tab „Sorten“: Sorten aus der Region (Bundesland) und in Deutschland gefährdete Sorten. Ergebnisdateien:

- `regionen.json`: 792 Zuordnungen (211 Sorten der Datenbank) aus 27 Quellen, dazu 335 Einträge „nicht in der Datenbank“.
- `seltenheit.json`: 259 Einstufungen (253 Rote Liste, 6 Arche des Geschmacks), 302 Einträge „nicht in der Datenbank“.
- Prüfung: `daten/skripte/ratgeber/pruefen.py` (jede `sorte` steht in der Sortenliste, jede `quelle` in `quellen`, Regionscodes und Arten gültig). Lauf am 23.10.2026 ohne Fehler. Alle Quellen-URLs antworteten am 23.10.2026 mit Status 200.

## Methode

1. Je Bundesland nach Listen von Landesbehörden, Landesverbänden, Pomologen-Verein (Landesgruppen), Landschaftspflegeverbänden und Naturschutzverbänden gesucht. Die Dokumente wurden heruntergeladen und die Sortennamen aus dem Text übernommen, nicht aus Suchmaschinen-Zusammenfassungen.
2. Nur Apfelsorten. Birnen, Kirschen, Zwetschgen und Quitten aus denselben Listen wurden weggelassen. War die Obstart unklar, blieb die Sorte draußen.
3. Arten der Zuordnung:
   - `herkunft`: Die Quelle nennt einen Entstehungs- oder Fundort, der eindeutig in einem Bundesland liegt. Steht in der Quelle „vermutlich“, trägt die Zuordnung `"anmerkung": "laut Quelle vermutlich"`. Nicht zugeordnet wurden Angaben wie „Altes Land bei Hamburg“ (Niedersachsen und Hamburg) oder „Rheinland“ (NRW und Rheinland-Pfalz).
   - `regionalsorte`: Die Sorte steht in einer Regional- oder Lokalsortenliste, ist Lokalsorte bzw. Obstsorte des Jahres einer Landesgruppe, wird als regionaltypisch für eine Region des Landes bezeichnet oder ist ein Arche-Passagier des Landes. Landkreislisten (Baden-Württemberg, Landkreis Börde) gelten ebenfalls als regionalsorte.
   - `empfehlung`: Die Sorte steht in einer landesweiten Sortenempfehlung für Streuobst. Die Brandenburger Liste gilt laut Titel für Brandenburg und Berlin und wurde daher beiden Ländern zugeordnet, die Liste des Pomologen-Vereins für Schleswig-Holstein und Hamburg ebenso.
4. Namensabgleich gegen `sortennamen.tsv` per Skript: zuerst exakter Name, dann Synonym, dann normalisierte Schreibweise (Renette/Reinette, Kalvill/Calville, Parmäne/Pearmain, Umlaute, Bindestriche). Jeder Treffer, der nicht über den exakten Namen lief, wurde von Hand geprüft. Mehrdeutige Treffer sind als „nicht in der Datenbank“ geführt, mit Begründung.
5. Abgelehnt wurden Treffer, die nur über ein Datenbank-Synonym zustande kämen, das der Quelle oder der Roten Liste widerspricht. Beispiele: ‚Martens Sämling‘ (DB: Synonym von Juwel aus Kirchwerder, Rote Liste führt beide getrennt), ‚Mutterapfel‘ (DB: Lavanttaler Bananenapfel, Quelle: Herkunft USA), ‚Winterprinzenapfel‘ (DB: Stahls Winterprinz, Rheinland-Pfalz-Liste: = Friedberger Bohnapfel), ‚Bischofsmütze‘ (Pomologen-Verein Hessen: nicht identisch mit Geflammtem Kardinal), ‚Welschweinling‘, ‚Doppelter Prinzenapfel‘. Diese Synonyme in der Sortendatenbank sollte ein Pomologe prüfen.

## Ergebnis je Bundesland

| Land | Zuordnungen | davon Herkunft / Regionalsorte / Empfehlung | Sorten | nicht in DB | wichtigste Quellen |
|---|---|---|---|---|---|
| BW | 42 | 4 / 30 / 8 | 32 | 43 | Landkreis-Sorten der Sortenerhaltungszentrale (KOB), LOGL Streuobstsorte des Jahres |
| BY | 48 | 0 / 0 / 48 | 48 | 25 | LWG Infoschrift 3151 (landesweite Empfehlung) |
| BE | 62 | 0 / 0 / 62 | 62 | 9 | Pomologen-Verein LG Brandenburg/Berlin, Sortenempfehlung 12/2025 |
| BB | 75 | 12 / 1 / 62 | 64 | 14 | dieselbe Liste, Broschüre „Apfelland Brandenburg“ (MLUK 2019) |
| HB | 1 | 1 / 0 / 0 | 1 | 0 | nur Herkunft ‚Boiken‘ (Bremen 1828) |
| HH | 57 | 6 / 1 / 50 | 51 | 14 | Pomologen-Verein LG Schleswig-Holstein/Hamburg 04/2026, Elbtalaue-Poster, Arche |
| HE | 18 | 4 / 14 / 0 | 17 | 10 | Hessische Lokalsorte des Jahres 2003–2026 (Pomologen-Verein) |
| MV | 37 | 4 / 6 / 27 | 33 | 3 | Apfel des Jahres der LG MV 2020–2026, „Normalsortiment für Mecklenburg, ca. 1910“ (LFA MV 2012) |
| NI | 10 | 7 / 3 / 0 | 10 | 5 | Biosphärenreservat Elbtalaue (Poster), Herkunftsangaben anderer Listen |
| NW | 72 | 10 / 14 / 48 | 50 | 50 | Obstsortenempfehlung Koordinierungsausschuss Obstwiesenschutz NRW 2023 (LWK), LWL Westfalen Regional, LG NRW |
| RP | 79 | 1 / 14 / 64 | 54 | 43 | Streuobst-Sortenempfehlungsliste RLP 2018 (Pomologen-Verein und DLR), Pfälzer Obstbaum des Jahres, Kartierung Saarland/Westpfalz |
| SL | 34 | 0 / 11 / 23 | 16 | 24 | Verband der Gartenbauvereine Saarland/RLP: Sortenempfehlung, Kartierung „Rambur, Renette, Rotbirn“, Streuobstsorte des Jahres |
| SN | 65 | 2 / 23 / 40 | 56 | 55 | SMUL „Streuobst in Sachsen“ (2012), lokale Kernobstsorten (LG Sachsen 2013), Sächsische Obstsorte des Jahres |
| ST | 57 | 3 / 54 / 0 | 54 | 4 | Pflanzempfehlung historischer Sorten Landkreis Börde (LPV „Grüne Umwelt“ 2012) |
| SH | 64 | 8 / 0 / 56 | 51 | 22 | Pomologen-Verein LG SH/HH 04/2026, BUND SH Leitfaden 2019 |
| TH | 71 | 2 / 1 / 68 | 69 | 14 | Grüne Liga Thüringen 2002 (Mittelthüringen), Thüringer Obstsorte der LG |

Herkunftsangaben stammen oft aus Listen anderer Länder (z. B. nennt die Brandenburger Liste ‚Holsteiner Cox‘ mit Herkunft Eutin). 49 Sorten der Datenbank haben eine belegte Herkunft.

## Seltenheit und Gefährdung

- **Rote Liste der gefährdeten einheimischen Nutzpflanzen in Deutschland** (BLE, Excel-Version 19.05.2026): 554 Apfelsorten, davon 253 in unserer Datenbank. Die Liste hat keine Gefährdungsstufen. Aufgenommen wird eine Sorte, wenn sie zugleich einheimisch, gefährdet (geringes bis kein Vorkommen in situ/on farm), bedeutend und ohne Sortenschutz oder Zulassung ist. Je Eintrag gibt es nur „ex situ erhalten: ja“ (505 der 554 Äpfel) und die Quelle (bei allen Äpfeln „BEKO-Beschluss“). In `seltenheit.json` steht daher als `stufe` der Listentitel und zusätzlich `ex_situ_erhalten`.
- **Arche des Geschmacks** (Slow Food Deutschland, Passagierliste Stand Mai 2026): 7 Apfelsorten, 6 davon in der Datenbank (es fehlt ‚Lausitzer Nelkenapfel‘). Ebenfalls ohne Stufen, mit Aufnahmejahr und Bundesland.
- Eine abgestufte bundesweite Gefährdungseinstufung für Apfelsorten (etwa Kategorien wie bei Roten Listen von Wildarten) wurde nicht gefunden. Die Deutsche Genbank Obst veröffentlicht keine Sortenliste mit Gefährdungsstatus.

## Lücken je Bundesland

- **Bremen:** keine eigene Liste gefunden. Die Landesgruppe Niedersachsen/Bremen verweist auf das Buch „Alte Obstsorten neu entdeckt für Niedersachsen und Bremen“ (2. Aufl. 2013), online nicht abrufbar.
- **Niedersachsen:** keine landesweite Empfehlung oder Lokalsortenliste online gefunden. Nur die Elbtalaue und Herkunftsangaben. Das Alte Land ist nicht zugeordnet, weil es zu Niedersachsen und Hamburg gehört.
- **Bayern:** nur die landesweite LWG-Empfehlung. Die LWG-Erfassung nennt 147 sichere bayerische Lokalsorten, veröffentlicht aber nur vier als Beispiel (keine davon in der Datenbank). Keine bayerische „Obstsorte des Jahres“ gefunden.
- **Thüringen:** einzige Liste ist die Grüne-Liga-Liste von 2002, nur als Abschrift der BUND-Kreisgruppe Lemgo abrufbar, Empfehlung und Bestandsaufnahme nicht getrennt. Die Streuobst-Broschüre des Thüringer Umweltministeriums war wegen einer Captcha-Sperre nicht abrufbar. Eine Gartensortenliste der LVG Erfurt (2012) wurde bewusst nicht übernommen, weil sie für Hausgärten und nicht für Streuobst gilt.
- **Sachsen-Anhalt:** nur die Landkreisliste Börde. Die Seite „Streuobsttipps“ des NABU Sachsen-Anhalt mit regionalen Sorten war nicht erreichbar.
- **Nordrhein-Westfalen:** Die Sortenlisten des NABU-Projekts „Erhalt der genetischen Ressourcen im Obstbau in NRW“ (84 westfälische Regional- und Lokalsorten) und das LVR-Handbuch „Lokale und regionale Obstsorten im Rheinland“ (rund 100 Sorten) sind nicht vollständig online. Die NABU-Server (nabu.de, nrw.nabu.de, rlp.nabu.de) waren am 23.10.2026 wegen einer Sicherheitslücke abgeschaltet. Nach Wiederinbetriebnahme lohnt ein zweiter Durchgang.
- **Saarland:** gute Quellen, aber viele Sorten fehlen in der Datenbank (16 Sorten zugeordnet, 24 Einträge ohne Datenbanksorte, z. B. ‚Judenapfel‘, ‚Duddeljung‘, ‚Brills Sämling‘, ‚Rheinröschen‘).
- **Norddeutschland allgemein:** Der „Apfel des Jahres in Norddeutschland“ des Pomologen-Vereins (2005–2026) nennt kein Bundesland und wurde nicht zugeordnet.

## Hinweise für die Datenbank

- Doppelte Einträge derselben Sorte, die bei der Anzeige zusammengeführt werden sollten: `schoener-aus-herrnhut` / `schoener-von-herrnhut`, `adersleber-kalvill` / `adersleber-calville`. Je nach Schreibweise in der Quelle landet eine Zuordnung bei dem einen oder anderen Eintrag.
- Viele verbreitete Regionalsorten fehlen in der Datenbank, z. B. ‚Riesenboiken‘, ‚Luxemburger Triumph‘, ‚Lohrer Rambur‘, ‚Lausitzer Nelkenapfel‘, ‚Hauxapfel‘, ‚Galloway Pepping‘, ‚Carola‘, ‚Roter Boskoop‘ (Liste in `nicht_in_datenbank`).
- Mehrere Quellen sind ältere Arbeitsstände (Grüne Liga 2002, Landkreis Börde 2012, SMUL Sachsen 2012, Normalsortiment Mecklenburg um 1910). Das Datum steht jeweils im Quellentitel.
