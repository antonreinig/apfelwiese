# Apfel-App: Projektstand und Konzept

Stand: 22.10.2026. Konzept, Entscheidungen, Umsetzungsstand und offene Punkte. Einstieg für neue Chats: `CLAUDE.md` im Hauptordner.

## Ziel

Eine App, mit der Menschen alte Apfelsorten an ihren Bäumen bestimmen und dokumentieren können:

1. **Bestimmen:** aus vier standardisierten Fotos von vier Äpfeln eines Baums eine Rangliste wahrscheinlicher Sorten, mit Begründung.
2. **Verstehen:** Die App erklärt an den eigenen Fotos, auf welche Merkmale es ankommt (Parametermodus).
3. **Erhalten:** Jede bestätigte Bestimmung landet in einer gemeinsamen Baumkarte. Seltene Sorten werden sichtbar, bevor der letzte Baum stirbt.

Pilotnutzer: der Vater des Entwicklers (Pomologe) mit 30+ Bäumen alter Sorten. Er liefert auch die bestätigten Referenzbestimmungen für den ersten Test.

## Getroffene Entscheidungen

| Entscheidung | Begründung |
|---|---|
| **Vier Äpfel, vier Fotos pro Baum** auf weißem A4-Blatt (siehe [Fotoanleitung](fotoanleitung.md)) | Alle pomologisch relevanten Ansichten, jede von anderen Äpfeln; jeder Apfel wird nur einmal geschnitten; Äpfel können danach gegessen werden |
| **Keine Druckvorlage, kein Farbabgleich** | Einfachheit für Nutzer wichtiger; A4 liefert Maßstab, Eckpunkte und Weißabgleich |
| **2x-Zoom, kein Blitz, gleichmäßiges Licht** | Bei 1x schaltet das iPhone aus der Nähe auf Ultraweitwinkel mit Digitalzoom (Test 21.10.2026); Blitz verdeckt Kelch und Schalendetails |
| **Kein eigenes Bildmodell zum Start**, stattdessen Messung + Sprachmodell + Merkmalsdatenbank | Kaum Trainingsbilder für alte Sorten; Merkmalsabgleich funktioniert auch für Sorten, die nur als Text beschrieben sind; Ergebnis ist nachvollziehbar. Eigenes Bildmodell später, wenn genug bestätigte Fotos vorliegen und ein Test zeigt, dass es hilft |
| **Messen per Programm, nicht per Sprachmodell** | Sprachmodelle schätzen Maße schlecht |
| **Abgleich gegen alle Sorten der Datenbank**, nicht nur gegen die erste Idee | Vermeidet Bestätigungsfehler; „passt zu keiner bekannten Sorte“ muss eine mögliche Antwort sein |
| **Vertrauensstufen** für Bestimmungen: App-Vorschlag / Nutzerkonsens / Pomologe / DNA (SSR-Fingerprint) | App-Vorschläge dürfen nie als Referenz zurückfließen, sonst verstärkt die App ihre eigenen Fehler |
| **Äpfel immer freigestellt**, Hintergrund durch die App gesteuert | Das weiße Blatt ist Messwerkzeug, kein Gestaltungselement |
| **3D-Modell von Anfang an Teil der UX** | Vergleich eigener Apfel ↔ Sorte, Fachbegriffe zeigen statt erklären, alte Sorten bekommen ein Gesicht |
| **Merkmalskatalog als zentrale Definition im Code** | Eine Quelle für Erfassung, Abgleich, Erklärung, Parametermodus und 3D-Modell |

## Kernkonzepte

### 1. Merkmalskatalog (Single Source of Truth)

Alle Merkmale mit ihren möglichen Ausprägungen sind **einmal zentral im Code** definiert. Grundlage ist das Schweizer NAP-Deskriptorenhandbuch (Agroscope/FRUCTUS 2021), ergänzt um Zuordnungen zu UPOV TG/14/10 und ECPGR 2022. Jedes Merkmal legt fest:

- Name, Gruppe (Frucht, Schale, Stiel, Kelch, Kernhaus, Kerne, Fleisch, Sensorik, Phänologie, Baum)
- Typ: Messwert (mit Einheit), Ausprägungsstufen (geordnet), Kategorie, Anzahl
- alle Ausprägungen mit Kurzlabel und verständlicher Beschreibung
- auf welchem Foto und in welcher Ansicht es zu sehen ist
- wie es erfasst wird: Messung, Sprachmodell, Abfrage beim Nutzer
- Erklärtext für den Parametermodus
- Zuordnung zum 3D-Parameter
- Quellen-Codes (NAP, UPOV, ECPGR)
- optional: diagnostischer Wert (wie stark unterscheidet es Sorten)

Skizze (TypeScript, nur zur Orientierung):

```ts
type Ansicht =
  | "foto1_laengshaelfte_schale" | "foto2_laengsscheibe"
  | "foto3_querhaelfte_kelch" | "foto3_querhaelfte_stiel" | "foto3_kerne"
  | "foto4_querscheibe";

interface Auspraegung { code: string; label: string; beschreibung: string; }

interface Merkmal {
  id: string;                         // z. B. "kelchgrube_tiefe"
  name: string;                       // "Tiefe der Kelchgrube"
  gruppe: "frucht" | "schale" | "stiel" | "kelch" | "kernhaus" | "kerne"
        | "fleisch" | "sensorik" | "phaenologie" | "baum";
  typ: "messwert" | "ordinal" | "kategorie" | "anzahl";
  einheit?: "mm" | "verhaeltnis" | "prozent";
  auspraegungen?: Auspraegung[];
  ansichten: Ansicht[];               // wo im Foto zu sehen
  erfassung: "messung" | "sprachmodell" | "abfrage";
  erklaerung: string;                 // für den Parametermodus
  parameter3d?: string;               // Schlüssel im 3D-Modell
  quellen: { nap?: string; upov?: number; ecpgr?: string };
}
```

Beispiele für Ausprägungen aus dem NAP-Handbuch: Kernhausform (spindelförmig / kugelig / zwiebelförmig / herzförmig), Kelchhöhle (breit dreieckig / lang dreieckig / Trichter mit kurzer Röhre / Trichter mit langer Röhre / Röhre bis zum Kernhaus), Öffnung der Kernfächer (geschlossen / teilweise offen / offen).

### 2. Bildverarbeitung

1. A4-Blatt erkennen, Perspektive entzerren, Maßstab (px/mm) und Weißabgleich aus dem Papier bestimmen.
2. Äpfel, Scheiben und Kerne **segmentieren und freistellen** (Maske mit Alphakanal). Schatten gehören nicht zum Objekt.
3. Ansicht pro Objekt erkennen (Schale/Schnitt, längs/quer, Kelch-/Stielseite). Die App nimmt, was sie bekommt; die Lage ist nicht vorgegeben.
4. Messen: Umriss, Breite, Höhe, Verhältnis, Symmetrie (an Schalenhälften auf Papierhöhe exakt); Kernhausumriss, Stiel- und Kelchgrube (an Scheiben, ca. 1 cm über Papier, Korrektur ~2 %); Farbe, Schalenpunkte; Kernzahl.
5. Für jedes Merkmal den **Bildbereich** speichern, in dem es zu sehen ist (für den Zoom im Parametermodus).
6. Originalfotos immer unverändert aufbewahren.

### 3. Merkmalsbeschreibung und Bestimmung

1. Messwerte aus der Bildverarbeitung.
2. Ein Sprachmodell mit Bildverständnis beschreibt die übrigen Merkmale **nur mit dem Vokabular aus dem Merkmalskatalog**.
3. Abfrage beim Nutzer: Geschmack, Geruch, Reifezeit, Region, optional Gewicht.
4. Abgleich mit allen Sorten der Sortendatenbank → Rangliste mit Wahrscheinlichkeit und Begründung je Merkmal.
5. Das Sprachmodell erklärt die Kandidaten und schlägt unterscheidende Prüfungen vor („probier den Apfel: …“).
6. Später zusätzlich: Ähnlichkeitssuche über Bild-Embeddings, sobald Referenzfotos vorliegen.

### 4. Parametermodus (Onboarding und Erklärung)

Ein durchblätterbarer Rundgang durch die Merkmale **am eigenen Apfel**:

- Pro Merkmal zoomt die App in das eigene Foto an die Stelle, wo es zu sehen ist (freigestellt, mit Markierung).
- Daneben das 3D-Modell, das dieselbe Stelle zeigt, und die Ausprägung für diesen Apfel: z. B. „Kelchgrube: tief“, „Stiel: kurz, 12 mm“, „Kernhaus: zwiebelförmig“.
- Die anderen möglichen Ausprägungen werden zum Vergleich gezeigt (im 3D-Modell umschaltbar).
- Warum das Merkmal für die Bestimmung zählt, in einem Satz.
- Nutzer können die erkannte Ausprägung korrigieren; Korrekturen werden gespeichert.

### 5. Parametrisches 3D-Modell

- **Form:** Rotationskörper aus dem gemessenen Längsumriss, plus Parameter für Rippung, Kronung, Asymmetrie, Stiel- und Kelchgrube (Tiefe, Weite), Stiel (Länge, Dicke), Kelchblätter.
- **Schale (prozedural):** Grundfarbe, Deckfarbe (Anteil, Farbton, Muster: verwaschen/gestreift/geflammt), Schalenpunkte (Dichte, Größe, Farbe, Hof), Berostung (Stiel, Kelch, Wangen).
- **Innenleben:** Kernhausform als Kurve, fünf Kernfächer (offen/geschlossen, Form), Kernhauslinie mit Gefäßbündeln, Kelchröhre, Kerne (Anzahl, Form, Größe), Fleischfarbe.
- **Beliebige Schnitte** (längs, quer, frei). Naheliegender Ansatz: Apfel als implizite Funktion (Signed Distance Field) im Shader, damit jede Schnittfläche sauber gefüllt ist. Alternative: Mesh mit Schnittkappen.
- **Zwei Quellen für Parameter:** gemessene Werte aus den eigenen Fotos (nah am echten Apfel) und Ausprägungen aus Sortenbeschreibungen (typischer Apfel der Sorte).
- **Stil:** ursprünglich klar und illustrativ geplant; am 22.10.2026 auf realistische Darstellung geändert (Buchästhetik nur im Rahmen der App).
- **Prüfung der Formen:** LidarDome-3D-Scans von 33 alten Schweizer Sorten (Zenodo, CC BY 4.0).
- **Nutzung in der UX:** Vergleich eigener Apfel ↔ Kandidatensorte im selben Winkel und Schnitt; Parametermodus; Sortenporträts.

### 6. Daten und Baumkarte

- **Baum:** Standort (öffentlich nur grob, z. B. auf Gemeindeebene), Fotos, Messwerte, Merkmale, Bestimmungen mit Vertrauensstufe.
- **Sorte:** Namen und Synonyme, Merkmalsprofil mit Quelle je Wert (Werk, Band, Seite), Referenzbilder, optional MUNQ-Code und SSR-Profil.
- Siehe [Datenquellen-Bestandsaufnahme](datenquellen-bestandsaufnahme.md).

## Erkenntnisse aus der Konzeptphase

- **Schweizer Studie** (Wróbel et al. 2026, 348 alte Sorten, nur Außenansichten): Bildmodelle schlagen einfache Merkmalsmodelle deutlich; Farbe und feine Schalenstruktur zählen am meisten; Hauptproblem sind Unterschiede zwischen Jahren; Abstimmung über 3–5 Früchte verbessert stark. Schnitt- und Kernhausmerkmale hat niemand getestet; das ist die Lücke dieses Projekts.
- **Datenlage:** Offene Merkmalsdaten v. a. NFC (UK, 2.166 Akzessionen, OGL 3.0) und EURISCO, ohne Schnittmerkmale; Stichprobe: ca. 44 von 56 verbreiteten deutschen Sorten im NFC-Datensatz. Seltene Lokalsorten nur über deutsche Quellen, alte Handbücher und Pomologen.
- **Test 21.10.2026:** Aus den Testfotos ergab sich die Ananasrenette als plausibler Kandidat (gemessene Größe 53–61 mm, viele braune, grün umhöfte Schalenpunkte, keine Deckfarbe, zwiebelförmiges Kernhaus, offene Kernfächer). Nicht bestätigt, nur gegen eine Beschreibung verglichen.

## Erste Meilensteine

1. **Merkmalskatalog** als Code-Datei, zunächst die Fruchtmerkmale aus dem NAP-Handbuch.
2. **Bildverarbeitung:** Blatt erkennen, entzerren, freistellen, messen. Test mit den Beispielbildern in `docs/beispielbilder/`.
3. **3D-Prototyp:** Rotationskörper aus gemessenem Umriss, Längs- und Querschnitt, einfache Schale.
4. **Parametermodus** für 5–10 Merkmale am eigenen Apfel.
5. **Sprachmodell-Beschreibung** mit Katalog-Vokabular.
6. **Kleine Sortendatenbank** (z. B. 20–50 Sorten aus NFC und alten Handbüchern) und Abgleich.
7. **Test** mit 20–30 Bäumen bekannter Sorte (Vater): Trefferquote Platz 1 und Top 3.

## Stand der Umsetzung (22.10.2026, abends)

Prototyp als PWA, live unter https://apfelwiese.app (alte Adresse apfelwiese.vercel.app leitet weiter), Code in `app/` (siehe `app/README.md`, UX in [ux-konzept.md](ux-konzept.md)). Testreif für erste Personen, auf dem iPhone aber noch nicht geprüft.

| Meilenstein | Stand |
|---|---|
| 1. Merkmalskatalog | umgesetzt als vorläufige Fassung (`app/src/daten/merkmalskatalog.ts`), ergänzt um Geschmack, Geruch, Kernhausmaße, Juni, flachrund, mittelfrüh/mittelspät. Codes aus NAP, UPOV, ECPGR noch nicht abgeglichen (`quellen` leer) |
| 2. Bildverarbeitung | umgesetzt: Blatt live erkennen (auch bei blauem, grünem, gelbem Licht), entzerren, örtlicher Weißabgleich, freistellen (Schatten getrennt), Breite, Höhe/Breite, Grund- und Deckfarbe je Pixel, Fleischfarbe, Kerne zählen, Schalenpunkte mit Hof, Ausschnitte je Apfel. Getestet an Beispielfotos und Videos (IMG_0146, IMG_0147). **Nicht gemessen:** Kernhausform, Kelch, Stiel, Rost |
| 3. 3D-Modell | umgesetzt: Rotationskörper mit Gruben, Rippen, Kronung, Asymmetrie, gekrümmter Achse; prozedurale Schale mit Glanz, Bereifung, Streifen, Punkten; detaillierter Stiel und Kelch; Längs- und Querschnitt mit Kernhaus, Kernfächern, Kernen; Neigungssteuerung; Medaillons als gespeicherte Bilder |
| 4. Parametermodus | umgesetzt als „Modell angleichen“ (Farbpipette, Regler, Schnitt neben Foto) und Merkmals-Rundgang (Zoom auf die Stelle, Einzelapfel-Ausschnitte, Speichern beim Weiterblättern, „Fertig“) |
| 5. Sprachmodell-Beschreibung | offen |
| 6. Sortendatenbank und Abgleich | 1.911 Sorten: NFC-Datensatz (1.700 Sorten, OGL 3.0) und 331 deutsche Sorten aus Engelbrecht (1889), Illustrirtem Handbuch Bd. I und IV, Lauche (1883) und Wikipedia, davon 257 mit Schnittmerkmalen; Farben aus Referenzbildern per Code gemessen für 1.477 Sorten. Abgleich über Messung und Nutzerangaben (`app/src/daten/abgleich.ts`). Offen: Prüfung der Sortengleichsetzungen durch einen Pomologen |
| 7. Test mit bekannten Bäumen | offen |
| Konto und Server | umgesetzt 22.10.2026: Anmeldung per E-Mail-Code/Link, privater Speicher in Frankfurt, Abgleich zwischen Geräten, Einwilligungen, Kontolöschung, Rückmeldung, Impressum/Datenschutz/Nutzungsbedingungen, Sicherheitsprüfung mit Fixes |
| Wiese (Karte) | umgesetzt 22.10.2026: Luftbild (Esri über eigenen Proxy), Ortssuche, gemerkter Ausschnitt, Äpfel als Marker, Verschieben nur nach „Verschieben“ |
| Einführung, Home-Bildschirm-Anleitung | umgesetzt 22.10.2026 |
| Tests und Betrieb | umgesetzt 22.10.2026: Einzeltests, API- und Browsertests (Playwright), GitHub Actions bei jedem Push und nachts gegen die Live-Version, Fehlerprotokoll aus App und Server, Betriebsseite, Tagesbericht per Mail |

## Entscheidungen vom 22.10.2026

- **PWA** (Vite, React, three.js mit Mesh-Geometrie und Schnittkappen), gehostet auf Vercel.
- **Fotoaufnahme in der App** mit Live-Erkennung des Blatts; Import aus der Kamera-App oder Mediathek bleibt möglich.
- **Speicherung lokal** im Browser (IndexedDB), keine Konten, kein Upload. *Abgelöst am selben Tag, siehe unten.*
- **Startseite** mit dem 3D-Apfel des neuesten Fotosatzes; Navigation seit 22.10.2026 Äpfel, Sorten, Wiese (Karte).
- **Äpfel realistisch** rendern, buchhafte Gestaltung im Rahmen.

## Entscheidungen vom 22.10.2026 (Testreife)

- **Betreiber:** Anton Reinig privat (Impressum, Datenschutz, Nutzungsbedingungen in der App, Stand 22.10.2026; rechtlich nicht geprüft).
- **Domain** apfelwiese.app über Vercel gekauft (9,99 $ erstes Jahr, ohne automatische Verlängerung, läuft am 22.10.2027 ab).
- **Konto per E-Mail-Code/Link**, eigene Umsetzung (Vercel Functions, Region fra1), Mailversand über das eigene Resend-Konto des Betreibers (Gratistarif, Absender anmeldung@apfelwiese.app, Region eu-west-1). Sitzung als signiertes HttpOnly-Cookie.
- **Server-Speicher:** privater Vercel-Blob-Speicher in Frankfurt (`apfelwiese-fotos`). Gemeinsame Karte vorerst nicht.
- **Luftbild:** Esri World Imagery mit ArcGIS-Schlüssel des Betreibers. Kacheln und Wikimedia-Bilder holt die Server-Funktion `api/kachel.ts` ab, damit keine Nutzerdaten (IP) an Esri oder Wikimedia gehen; Vercel-Weiterleitungen hätten die IP mitgeschickt (geprüft 22.10.2026).
- **Sicherheitsprüfung 22.10.2026:** kein Zugriff auf fremde Daten gefunden; behoben wurden u. a. Code-Raten über parallele Anfragen, Link-Adresse aus Anfrage-Headern, fremde Anmeldelinks, Daten auf geteilten Geräten, fehlende Mengen- und Speichergrenzen.
- **Verbesserungsnutzung der Fotos** nur mit freiwilliger, gesonderter Einwilligung.

## Entscheidungen vom 23.10.2026 (Sorten erkunden, Konto)

- **Sorten-Tab als Erkunden-Seite** statt langer Liste: Apfel des Tages (für alle gleich, aus gut beschriebenen Sorten mit Bild), Ratgeber, Jetzt genussreif, Aus deiner Region, Selten und erhaltenswert, Reifekalender, Sammlungen nach Farbe, Sortenfamilie und Thema, Seite „Alte Sorten bekommen und erhalten“, Liste aller Sorten. Code: `src/seiten/Sorten.tsx`, `src/daten/erkunden.ts`.
- **Sortenratgeber** (`src/daten/ratgeber.ts`, `src/seiten/Ratgeber.tsx`): neun Fragen, Bewertung nur aus belegten Werten, fehlende Angaben zählen nicht gegen eine Sorte, Sorten mit schwerem Gegengrund (z. B. frostempfindliche Blüte in einer Spätfrostsenke) fallen heraus. Bewertet werden nur Sorten mit mindestens zwei Anbauangaben (derzeit vor allem die deutschen Quellen). Kaufhinweise mit Quellen (LWG Bayern, Pomologen-Verein).
- **Anbaumerkmale im Katalog** (`erfassung: 'literatur'`, am eigenen Baum nicht abgefragt): Lagerfähigkeit, Frostempfindlichkeit der Blüte, Ertragsbeginn, Alternanz, Gesundheit, Anfälligkeit für Schorf, Mehltau, Obstbaumkrebs, Ansprüche an Lage und Boden, Wasserbedarf, Hochstamm-Eignung. Werte aus den deutschen Sortentexten, je Wert mit wörtlichem Ausschnitt und den Belegen des Textes (`daten/de/anbau.json`).
- **„Alte Sorte“** heißt: Entstehung laut Herkunftstext vor 1950 oder beschrieben bzw. abgebildet in einem Werk vor 1950. Für viele NFC-Sorten fehlt eine solche Angabe; sie gelten dann nicht als alt, auch wenn sie es sein mögen.
- **Region** wählt der Nutzer als Bundesland (nur im Gerät gespeichert, keine Ortung). Regionen einer Sorte: Herkunft und Verbreitung laut Text, dazu Regional- und Empfehlungslisten der Länder (`daten/ratgeber/regionen.json`).
- **Konto-Knopf** oben rechts auf der Startseite (`#/konto`): Kontokarte, Region, Darstellung hell/dunkel, Einwilligung, Sicherung, Abmelden, Konto löschen. „Über die App“ (i) enthält nur noch Erklärung, Quellen und Rechtliches. Datenschutzerklärung und Einwilligungstext verweisen jetzt auf „Konto“ (Ortsangabe, kein neuer Inhalt; `TEXT_VERSION` unverändert).

## Rendering der Äpfel (überarbeitet 23.10.2026)

- **Gruben unregelmäßig:** Stiel- und Kelchgrube hängen vom Winkel ab (`grubenForm` in `geometrie.ts`): schwankende Weite, einseitiger Fleischwulst, Falten aus den Rippen, am Kelch Höcker. Nahe der Achse bleibt die Grube rund, damit Stiel und Kelchblätter sitzen. Färbung, Schatten und Rost an den Gruben folgen dieser Form (vorher kreisrunde Ringe).
- **Glanz nach Schale:** Widersprüchliche Angaben werden gemittelt, „rau“ oder „matt“ begrenzt den Glanz auf seidig (Ananasrenette jetzt matt). Klarlack (Wachsschicht) nur bei Glanz über 0,5 und nie auf Rost und Schalenpunkten (eigene Glanzkarte). Rauheit aus einer Karte, Rost fast ganz matt, matte Schalen mit leichtem Flaum (Sheen), Bereifung kühl und zart.
- **Muster je Apfel verschieden** (`musterWerte` aus der Saat): Lage und Breite der Sonnenseite, Wolkigkeit und Weichheit der Rötung, Sprenkel, Zahl, Breite, Stärke und Abrisse der Streifen, eigene Lagen für feine Streifen und Flammen, weiche Marmorierung, Tupfen, Fleckung und grünliche Inseln der Grundfarbe, goldene Backe bei gelben Sorten, grünere Schattenseite.
- **Rost** als dünne, lückige Schicht mit Netz, durch die die Farbe scheint; strahlenförmige Ausläufer aus der Stielgrube; zwei Töne (zimtbraun, graugrün-ocker).
- **Schalenpunkte** auf der Rötung hell, sonst in ihrer Farbe, ungleich groß, zum Kelch hin dichter, an den Polen länglich, matt und leicht erhaben.
- Prüfung an Referenzfotos mit der Entwicklerseite `#/vergleich?sorten=…` (Seite, Stielgrube, Kopfstand, Kelch; bei einer Sorte zusätzlich Längs- und Querschnitt und ein Feld, um Werte probeweise zu überschreiben). Textur etwa 45 ms je Medaillon und 0,4 s für die große Bühne (Desktop).
- Offen: Am iPhone prüfen, wie lange die erste Sortenliste braucht; Rendering echter eigener Fotos (Farben aus der Messung) mit dem neuen Material vergleichen.

## Abgleich mit den NFC-Fototafeln (23.10.2026)

- **Form je Sorte aus dem Foto:** `daten/skripte/bilder/form_anpassen.py` vergleicht die Seitenansichten aller 1.694 NFC-Tafeln „Cross section of …“ mit dem Umriss des Modells (Rastersuche über Höhe/Breite, Kegel- und Walzenform; Lage am Stielrest erkannt). Ergebnis je Sorte mit Bild, Verfahren und Güte in `daten/bilder/form3d.json`; 1.271 Tafeln mit Umrissabweichung bis 3,5 % der Breite gelten, das sind 1.073 Sorten der App. Für sie geht die Form aus dem Foto den Werten aus der Sortenbeschreibung vor; die Sortenseite nennt das mit Link auf die Tafel.
- **Feinabstimmung von Hand:** `daten/bilder/abgleich_hand.json` (Werte, Anmerkung, Datum, Bild), bisher Gravensteiner, Ananasrenette, Freiherr von Berlepsch, Weißer Klarapfel, Egremont Russet, Granny Smith. Sie gilt zuletzt.
- **Gelernt für Sorten ohne Foto** (Median je Klasse, in `darstellung.ts` übernommen): Die Walzenform liegt bei allen Fruchtformen um −0,2, auch bei „walzenförmig“; die alte Zuordnung (bis 0,85) war viel zu extrem. Die Klassen unterscheiden sich vor allem in Höhe/Breite (flachrund 0,84, rund 0,88, konisch 0,94, elliptisch 0,98) und Kegelform (0,07 bis 0,14). Breiteste Stelle „stiel“ 0,13, „mitte“ 0,06.
- **Nicht übernommen:** Schiefe aus dem Schulterversatz (trennt schiefe und symmetrische Sorten nicht); Rippung, wo die Beschreibung sie angibt (die Stielansicht zeigt nur den Äquator, gemessen 0,16 / 0,36 / 0,43 bei Stufe 1 / 5 / 7).
- **Modell:** `hoeheZuBreite` gilt jetzt von Grubenrand zu Grubenrand (vorher vor dem Eindrücken der Gruben, dadurch zu flach). Gruben glockenförmig statt mit spitzer Kante, Wulst und Falten laufen weich aus, Kronung schwächer (±3,5 %), Rippen etwas stärker (±4 %).
- **Schale** nach Farbmessung an 153 Tafeln und Renderings: Rötung deckender und tiefer (Farbton 41° statt 55°, Foto 28°), Anteil leicht gekürzt; Tupfen nur als schmaler Saum; Fleckung der Grundfarbe, Rostausläufer an der Stielgrube und leichter Wangenrost weicher und feiner; starker Wangenrost fast deckend; heller Flaum matter Schalen schwächer. `MODELL_VERSION` 7.
- **Falsche Tafel:** Die Commons-Datei „Cox's Orange Pippin (HTC), acc. 1982-202“ zeigt laut Etikett Rouge des Flandres. Sie steht in `daten/bilder/falsche_bilder.json` und wird weder angezeigt noch gemessen.
- Offen: weitere Sorten von Hand abstimmen; die Renderings sind insgesamt etwas heller als die Tafelfotos (Grundfarbe L* etwa 80 statt 66), grüne Sorten wirken dadurch gelblicher. Rippung und Kronung ließen sich besser aus der Kelchansicht messen.

## Offene Punkte und nächste Schritte (Stand 22.10.2026)

**Am iPhone noch nicht geprüft** (manuelle Tests will der Nutzer vorerst nicht; Fehler zeigt jetzt das Fehlerprotokoll):
- Fotografieren im Safari: Zoom und Objektivwahl, Live-Erkennung, automatisches Auslösen, Kunstlicht.
- Abstand oben (`--oben` in `app/src/styles.css`, 22 px unter der sicheren Zone): Greift die Unschärfe der Statusleiste (iOS 26) noch in Bedienelemente?
- Anmeldung in der App auf dem Home-Bildschirm mit Code; Upload großer Kamerafotos; Neigungssensor.
- Rechtstexte von jemandem mit Rechtskenntnis gegenlesen lassen.

**Sorten erkunden (23.10.2026):**
- Anbauangaben gibt es fast nur für die 331 deutschen Sorten; NFC-Sorten haben dafür keine Daten. Der Ratgeber nennt die Zahl der bewerteten Sorten.
- Ob eine Baumschule eine Sorte führt, weiß die App nicht. Offene Recherchepunkte in `daten/ratgeber/recherche-bezug.md` (NABU-Baumschullisten waren am 23.10.2026 offline, Einsendung von Früchten an die LG SH/HH, Lohnveredelung im Norden).
- Regionallisten (`daten/ratgeber/regionen.json`, 27 Quellen, Bericht `recherche-regionen.md`): Lücken bei Bremen (nur eine Herkunftsangabe), Niedersachsen (keine landesweite Liste online), Bayern (nur die LWG-Empfehlung), Thüringen (Liste von 2002), NRW (NABU-Listen am 23.10.2026 offline). Viele Regionalsorten fehlen ganz in der Datenbank (z. B. Riesenboiken, Luxemburger Triumph, Lohrer Rambur, Hauxapfel).
- Seltenheit: Rote Liste der gefährdeten einheimischen Nutzpflanzen (BLE, Fassung 19.05.2026, ohne Gefährdungsstufen; 253 von 554 Apfelsorten in der Datenbank) und Arche des Geschmacks (Slow Food, Mai 2026). Dazu Aussagen „heute selten“ aus den Sortentexten.
- Pomologisch prüfen: Dubletten `schoener-aus-herrnhut`/`schoener-von-herrnhut` und `adersleber-kalvill`/`adersleber-calville`; Synonyme, die der Roten Liste widersprechen (Martens Sämling, Mutterapfel, Winterprinzenapfel, Bischofsmütze; siehe `nicht_in_datenbank` in `regionen.json`).
- Weitere Ratgeber-Merkmale aus den Texten wären möglich: Befruchtersorten, Fruchtfall, Feuerbrand, Winterhärte, Eignung für kleine Baumformen.

**Fachlich offen:**
- Test mit 20–30 Bäumen bekannter Sorte (Vater): Trefferquote Platz 1 und Top 3 (Meilenstein 7).
- Messung von Kernhausform, Kelch, Stiel; Rost ist aus Fotos bisher nicht verlässlich messbar.
- Katalog-Lücken laut `daten/de/katalog-luecken.md`: Kelchhöhlentiefe, Stiellänge in mm, Kerne je Kammer, Kelchblättchen.
- Bekannte Darstellungsgrenzen: geschlossener Kelch zu kompakt; einige NFC-Masken fehlerhaft (z. B. Sorte „hazen“).
- Sortengleichsetzungen (deutsche Namen ↔ NFC) von einem Pomologen prüfen lassen.
- Sprachmodell-Beschreibung (Meilenstein 5) noch nicht begonnen.

**Technisch offen oder bewusst so gelassen:**
- Abmelden auf einem Gerät beendet die Sitzung serverseitig nicht (Cookie bis 90 Tage gültig); „Überall abmelden“ tut es.
- Wird ein Baum ohne Netz gelöscht, kommt er beim nächsten Abgleich vom Server zurück.
- Vorschau-Deployments nutzen denselben Blob-Speicher und dieselben Geheimnisse wie die Live-Version.
- Resend-Gratistarif: 100 Mails am Tag; die App begrenzt auf 80 Anmeldemails und 15 Rückmeldungen.
- ArcGIS-Schlüssel: im ArcGIS-Konto ein Nutzungsbudget setzen (empfohlen, nicht geprüft).

**Für den Betreiber:**
- Domain apfelwiese.app läuft am 22.10.2027 ab (keine automatische Verlängerung).
- Rückmeldungen im Gmail-Postfach spätestens nach zwölf Monaten löschen (so in der Datenschutzerklärung zugesagt).

## Zurückgestellte Ideen (besprochen am 22.10.2026, vorerst nicht verfolgen)

- **3D-Rekonstruktion aus Video** (Fotogrammetrie, Gaussian Splatting): verworfen für jetzt. Glatte, glänzende Äpfel rekonstruieren schlecht, im Browser fehlt die Rechenleistung, ein externer Dienst kostet und überträgt Fotos an Dritte.
- **360°-Bildfolge des eigenen Apfels:** Apfel auf dem A4-Blatt drehen, die App nimmt etwa 36 Einzelbilder, liest den Winkel aus den Blattecken und stellt frei. Das wäre ein echtes Abbild ohne Rekonstruktion.
- **Mischweg:** Form aus dem gemessenen Umriss (Foto 1), Schale aus den eigenen Fotos auf das 3D-Modell projiziert; Parameter nur noch für Sorten der Datenbank.
- **Rundgang mit echten Beispielbildern** je Ausprägung (z. B. Kelchgrube flach/mittel/tief), etwa aus NFC-Fotos von Sorten mit belegtem Wert (OGL); Messung schlägt nur vor.
- **Bessere Parameter für Sorten:** Rostmuster, Punktdichte zum Kelch hin, Streifenbreite. Grenze sind die groben Sortenbeschreibungen (Form inzwischen aus NFC-Fotos, siehe oben).

## Offene Entscheidungen

- Zoom und Objektivwahl im Browser auf dem iPhone: am Gerät prüfen (siehe ux-konzept.md)
- Welches Sprachmodell, Kosten pro Bestimmung, Verhalten ohne Netz
- Gemeinsame Baumkarte (derzeit nicht gewünscht): Regel, wie genau Standorte anderen gezeigt werden
- Zielgruppe des ersten Prototyps: nur Entwickler und Vater, oder schon weitere Pomologen

## Kontakte und Anfragen

- **Silvia Krug** (Pomologen-Verein, KI-Projekt mit Schnittbildern): Code, Fotoanleitung, Zusammenarbeit
- **Anna Wróbel** (ZHAW, wrob@zhaw.ch): Studie, Daten, Kontakt zu Agroscope/FRUCTUS
- **Agroscope / FRUCTUS:** NAP-Beschreibungen und Fotos mit Schnitten
- **BUND Lemgo:** Nutzung der Obstsortendatenbank
- **JKI Dresden-Pillnitz** (Deutsche Genbank Obst): SSR-Daten, pomologische Merkmale
- **Rinntech (PomIdent):** Lizenz oder Kooperation

## Begriffe

- **Stielgrube:** Vertiefung, aus der der Stiel wächst (am Baum oben).
- **Kelch („Auge“):** vertrocknete Blütenreste am gegenüberliegenden Ende; die Vertiefung darum heißt **Kelchgrube**, nach innen führt die **Kelchröhre**.
- **Kernhaus, Kernfächer:** Gehäuse mit fünf Kammern für die Kerne; im Querschnitt als Stern sichtbar.
- **Lentizellen:** Schalenpunkte.
- **SSR-Fingerprint:** genetischer Fingerabdruck aus Mikrosatelliten; alle Bäume einer Sorte sind Klone und haben dasselbe Muster.
- **MUNQ:** europäischer Code für eindeutige Apfel-Genotypen.
