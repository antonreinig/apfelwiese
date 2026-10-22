# UX-Konzept

Stand: 22.10.2026. Erste Fassung ist als Prototyp umgesetzt: https://apfelwiese.vercel.app (Code in `app/`). Entscheidungen vom 22.10.2026 sind markiert; alles andere ist Vorschlag.

## Grundidee

Die App öffnet mit einem einzelnen Apfel, groß, freigestellt, langsam drehend. Er reagiert leicht auf die Neigung des Handys: Blickwinkel, Licht und Glanzpunkt verschieben sich. Darunter steht sein Name in Schreibschrift. Wischen nach links oder rechts zeigt den nächsten eigenen Baum. Diese Reihe ist die **Wiese** (Name entschieden am 22.10.2026).

## Einheit: der Baum

Bestimmt und gespeichert wird pro **Baum** (vier Äpfel, vier Fotos, siehe [Fotoanleitung](fotoanleitung.md)). Ein Eintrag auf der Wiese ist ein Baum. Er zeigt als Apfel das 3D-Modell aus den eigenen Messwerten des **neuesten Fotosatzes** (entschieden 22.10.2026); ohne Messung das typische Modell der zugeordneten Sorte, sonst einen neutralen Apfel. Unter dem Namen steht die eigene Bezeichnung des Baums.

## Navigation (umgesetzt)

```
[ Äpfel ]   [ Sorten ]   [ Wiese ]
        ( + Neuen Baum bestimmen )   ← prominent unter „Äpfel“
```

Umbenannt am 22.10.2026: Der bisherige Start „Wiese“ heißt „Äpfel“ (Apfel-Symbol), die Karte heißt „Wiese“ (Baum-Symbol). Die App startet weiter mit dem 3D-Apfel.

| Bereich | Inhalt |
|---|---|
| **Äpfel** (Start) | Eigene Bäume als Karussell, ein Apfel pro Tafel, neuester zuerst. Wischen wechselt, Antippen oder nach oben Wischen öffnet das Baumblatt. Zwei Finger zusammenziehen oder Rastersymbol → Übersicht als Raster runder 3D-Medaillons. |
| **Neuen Baum bestimmen** | Großer Knopf auf der Wiese; startet den Ablauf mit vier Fotos. |
| **Sorten** | Verzeichnis aller Sorten der Datenbank mit 3D-Medaillon; Suche nach Name und Synonym; Filter „genussreif im aktuellen Monat“, „mit Bild“, „mit Schnittmerkmalen“. |
| **Wiese** | Eigene Bäume als 3D-Äpfel auf dem Luftbild (Esri World Imagery, über die eigene Domain geladen), umschaltbar auf OpenStreetMap. Beim ersten Öffnen sucht man den Ort (Nominatim, nur auf Knopfdruck) und merkt sich den Ausschnitt der Wiese. Beim Öffnen des Tabs zeigt die Karte diesen Ausschnitt, erweitert um alle Bäume. Antippen eines Apfels zeigt Sorte und „Zum Baum“; Verschieben nur nach „Verschieben“ und „Standort sichern“. Bäume ohne Standort lassen sich platzieren. Jede Person sieht nur ihre eigenen Bäume. |

„Bestimmen“ ist ein Ablauf und kein Ort; er sitzt im Knopf auf der Wiese und im Baumblatt („Weitere vier Fotos“).

## Bildschirme (umgesetzt)

### Wiese
- Großer 3D-Apfel, dreht sich langsam; Neigung verschiebt Kamera und Licht um wenige Grad. Auf dem Desktop folgt die Neigung dem Mauszeiger.
- Name in Schreibschrift, darunter Status und Baumbezeichnung, Tafelnummer in römischen Ziffern.

### Baumblatt
- 3D-Apfel mit Umschalter **Ganz / Aufgeschnitten**; aufgeschnitten mit **Längs- und Querschnitt** (Kernhauslinie, Kernfächer, Kerne, Kelchhöhle; aus Parametern gezeichnet).
- Bestimmung mit Vertrauensstufe; Sorte zuordnen, als vom Pomologen oder per DNA bestätigt markieren.
- Fotos je Fotosatz, **freigestellt** angezeigt; Original per Antippen.
- Gemessene Werte mit Hinweisen zur Messung.
- Eigene Angaben (Geschmack, Reife …), Notizen, Standort.

### Bestimmen
1. Baum anlegen (Bezeichnung, Ort, Standort optional).
2. Vier Fotos, je mit Skizze, Schneide- und Legeanleitung. Drei Wege: **Kamera mit Blatterkennung**, Kamera-App des Handys, vorhandenes Foto.
3. Nach jedem Foto eine **Prüfung**: Blatt erkannt, Perspektive, Zahl der Apfelteile und Kerne; entzerrte, freigestellte Vorschau.
4. Fragen, die die Fotos nicht beantworten (Süße, Säure, Festigkeit, Saftigkeit, Pflückreife, Lagerfähigkeit), alle freiwillig.
5. Ergebnis: das eigene 3D-Modell aus den Messwerten, Messhinweise, **vorläufiger Abgleich** mit allen Sorten mit Begründung je Merkmal. Ein Kandidat kann als App-Vorschlag (Bleistift) gespeichert werden.

### Kamera mit Blatterkennung (umgesetzt, auf dem iPhone noch zu testen)
- Erkennt das A4-Blatt live (etwa 12-mal pro Sekunde, im Hintergrund-Thread) und zeichnet seine Kanten ein.
- Hinweise in klarer Reihenfolge: Blatt fehlt → Ecke ragt aus dem Bild (mit Richtung) → zu klein → schräg (welche Kante absenken) → gut.
- **Wasserwaage**: Ein Punkt wandert zu der Seite, die zu hoch gehalten wird. Gemessen wird die Perspektive am Blatt selbst (Längenunterschied gegenüberliegender Kanten), deshalb funktioniert sie auch, wenn der Tisch schief ist. Grenze: 7 % Längenunterschied, etwa 8–10° Schräglage.
- **Auslösen automatisch**, wenn 0,9 s lang alles passt und das Bild ruhig ist; Auslöser zeigt den Fortschritt. Manuelles Auslösen bleibt möglich.
- Vorschau zeigt das ganze Kamerabild, damit sichtbar ist, was aufgenommen wird.
- Getestet mit dem Video `IMG_0146.MOV` (Skript `app/scripts/test-blatterkennung.ts`).

### Zoom auf dem iPhone
- Die App fordert die Rückkamera mit bis zu 4032 × 3024 an und setzt, wenn der Browser es anbietet, **Zoom 2** (`applyConstraints({ advanced: [{ zoom: 2 }] })`). Ob iOS Safari die Zoom-Einstellung unterstützt und ob dabei das Hauptobjektiv benutzt wird, ist nicht sicher belegt: Eine Quelle nennt Unterstützung ab Safari 17.4, andere verneinen sie; Entwickler berichten, dass iOS in `getUserMedia` zwischen Objektiven wechselt. **Muss am Gerät geprüft werden.** Unter „Kamera“ zeigt die Kameraansicht Auflösung, Zoombereich und Objektivname und erlaubt, ein Objektiv von Hand zu wählen.
- Wenn das nicht reicht: Fotos mit der Kamera-App (dort 2× wählen) aufnehmen und importieren. Die App prüft und entzerrt sie genauso.

## Überarbeitung nach dem ersten Test (22.10.2026)

Rückmeldungen aus dem ersten Durchgang am iPhone und was daraus wurde:

| Rückmeldung | Umsetzung |
|---|---|
| Apfel von allen Seiten ansehen | In Baumblatt, Sortenporträt und Schnittansicht mit dem Finger drehbar (waagrecht drehen, senkrecht von oben bis ganz unten), mit Schwung; nach 3,5 s ohne Berührung dreht er wieder von selbst. Auf der Wiese bleibt Wischen für den Baumwechsel. |
| Neigung war falsch herum, von unten kam man nicht heran | Handy nach unten kippen → Blick von oben; nach oben kippen → Blick von unten, bis ganz unter den Apfel. Bereich ±25°, Ruhelage folgt langsam. |
| Große Ansicht startete mit der blassen Seite | Startet mit der Sonnenseite, wie die Medaillons. |
| Medaillons in der Sortenliste ruckeln beim Scrollen | Medaillons sind jetzt einmal gerenderte Bilder (im Browser zwischengespeichert); ein Glanzlicht folgt per CSS der Neigung. Keine Eigendrehung in Listen. |
| Glanz unterschiedlich | Glanz reicht von matt-rau bis wachsig; einstellbar beim Angleichen. |
| Stiel und Kelch zu einfach | Eigenes Modul (`stielKelch.ts`): Stiel mit Verdickung, Abrissstelle, Rinde; Kelch mit fünf Kelchblättern, offen bis geschlossen. |
| Äpfel sind nicht rotationssymmetrisch | Krumme Achse, Schiefe und Beulen als Parameter. |
| Schnitt: man konnte hineinsehen, Querschnitt fehlerhaft | Kamera kreist um den stillstehenden halben Apfel; Schnittebene bleibt am Apfel. |
| Kernhaus zu rund, Kerne passen nicht | Kernhaus mit Breite, Höhe, Spitze, Lage; Kernfächer kahnförmig; Kerne als Tropfen mit Form, Länge und Farbe. |
| Fotos: in der App vergrößern, nur das A4-Blatt zeigen | Gespeichert wird zusätzlich das entzerrte, am Papier weißabgeglichene Blatt (6 px/mm, 3 mm Rand weg, Hochformat). Kacheln im A4-Format, Großansicht in der App mit Wischen und Doppeltippen. |
| Schatten wurden mitgemessen | Zweistufige Freistellung nach Farbort; Schattensäume fallen heraus. Getestet an den Beispielfotos und am Video. |
| Schritt zurück beim Fotografieren | Zurück-Pfeil geht einen Schritt zurück, Kreuz bricht ab. |
| Beispielbilder vor dem Foto | Echte Aufnahmen, entzerrt und auf das Blatt zugeschnitten, mit kleiner Skizze. |
| Genussreife | Monate beginnen beim gewählten Pflückmonat und laufen zwölf Monate weiter. |
| 3D passte nicht zum eigenen Apfel, Vorschläge falsch | **Modell angleichen**: Foto und 3D nebeneinander für Schale, Kelch und Stiel, Längs- und Querschnitt. Farben per Pipette aus dem Foto (Grundfarbe, Deckfarbe, Schalenpunkte, Hof, Rost, Fleisch, Kerne, Stiel, Kelch), Form und Kernhaus mit Reglern. Daraus werden Katalogwerte abgeleitet, die der Abgleich nutzt. Schalenpunkte werden jetzt feiner gemessen (dunkelster Punktkern, bei der Ananasrenette dunkles Oliv). |
| Dropdowns | Durch Chips ersetzt. |
| Geschmack und Geruch | Neue Katalogmerkmale: Aroma, Geschmacksnoten, Duft, Duftnoten, dazu Schalengefühl. |

## Vertrauensstufen (umgesetzt)

| Stufe | Darstellung |
|---|---|
| App-Vorschlag, unbestimmt | Name in **Bleistift** (grau), mit „vermutlich“ |
| eigene Bestimmung | Name in Tinte |
| Pomologe | Tinte und Siegel „P“ |
| DNA | Tinte und Siegel „DNA“ |

## Ästhetik

- Rahmen und Typografie wie ein altes Pomologie-Werk: Papierton mit feiner Struktur, Tintenbraun, Haarlinien, Tafelnummern, Kapitälchen; Sortennamen in **Pinyon Script**, Text in **EB Garamond** (beide SIL Open Font License, lokal eingebunden). Dunkelmodus als „Nachtausgabe“.
- **Die Äpfel selbst realistisch** (entschieden 22.10.2026): physikalisch basiertes Material mit Klarlack-Glanz, Bereifung, Rauheit; prozedurale Schale mit Grundfarbe, Deckfarbe (verwaschen, gestreift, geflammt, marmoriert), Berostung, Schalenpunkten mit Hof; Form aus Höhe/Breite, Kegelform, Rippen, Kronung, Gruben. Alte Pomologien zeigen die Früchte ebenfalls möglichst naturgetreu; das Buchhafte liegt im Rahmen.
- Bewegung ruhig; bei „Bewegung reduzieren“ keine Drehung.

## Technik, die die UX betrifft

- **Neigungssensor auf iOS** braucht eine Erlaubnis, die nur nach einer Berührung erfragt werden darf. Umgesetzt: Der Apfel dreht sich zunächst von selbst; die erste Berührung irgendwo in der App fragt die Erlaubnis ab.
- **Viele 3D-Medaillons**: eine gemeinsame WebGL-Leinwand für alle Medaillons (three.js mit drei `View`), Medaillons rendern erst in Sichtweite, Schalentexturen werden nacheinander erzeugt.
- **Konto per E-Mail-Code** (seit 22.10.2026): sechsstelliger Code plus Anmeldelink. Der Code ist nötig, weil Links aus der Mail-App auf dem iPhone im Browser landen und nicht in der App auf dem Home-Bildschirm. Ohne Konto: nur Sorten. Mit Konto: Bäume und Fotos im privaten Speicher (Vercel Blob, Frankfurt), Kopie im Gerätespeicher; Abgleich beim Start und nach jeder Änderung. Abmelden entfernt die Daten vom Gerät.
- **Einwilligung:** Pflicht ist die Zustimmung zu Nutzungsbedingungen und Speicherung im Konto. Die Nutzung der Fotos zur Verbesserung der App ist ein eigenes, freiwilliges Häkchen (Kopplungsverbot, Art. 7 Abs. 4 DSGVO), widerrufbar unter „Über die App“.
- **Einführung** mit drei Tafeln beim ersten Start; **Anleitung Home-Bildschirm** je nach Gerät (Safari, Chrome iOS, Chrome Android, Samsung); **Rückmeldung** per Formular an den Betreiber.
- **Abstand oben** (`--oben` in styles.css): Bedienelemente liegen 22 px unter der sicheren Zone, damit der weiche Rand der Statusleiste unter iOS 26 sie nicht verdeckt. Am Gerät prüfen.

## Offene Punkte

- Am iPhone prüfen: Zoom, Objektivwahl, Auflösung, Auto-Auslösen bei Kunstlicht.
- Kernhaus, Kelch und Stiel werden noch nicht automatisch aus den Fotos erfasst (Sprachmodell-Beschreibung mit Katalogvokabular, Meilenstein 5).
- Parametermodus (Rundgang durch die Merkmale am eigenen Foto) fehlt noch.
- Gemeinsame Baumkarte: Server, Konten, Regeln zur Standortgenauigkeit.
- Was zeigt die Wiese bei zwei Fotosätzen aus verschiedenen Jahren? Derzeit den neuesten.
