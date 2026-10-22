# Bestandsaufnahme: Datenquellen für die Apfelsorten-App

Stand: 21.10.2026, Webrecherche. **[V]** = in der Quelle geprüft, **[U]** = nicht bestätigt, vor Verwendung prüfen. Zahlen ohne Beleg sind als Schätzung markiert.

## Kurzfassung

- **Offene, maschinenlesbare Merkmalsdaten gibt es vor allem aus Großbritannien und über die europäischen Genbanken** (NFC-Datensatz mit 2.166 Apfel-Akzessionen und 25 Merkmalen; EURISCO mit Daten zu 8.541 Apfel-Akzessionen). Sie folgen dem ECPGR-Standard und enthalten **keine Schnittmerkmale** (Kernhaus, Kelchröhre, Kernfächer).
- **Schnittmerkmale stehen nur in nicht offenen Quellen**: Schweizer NAP-Beschreibungen (BDN/FRUCTUS), PomIdent, Arche-Noah-Sortenblätter, Pometum Apple Key (Kopenhagen), und in den **gemeinfreien alten Handbüchern**.
- **Offen lizenzierte Fotos**: grob 800–2.000 Sorten (v. a. NFC-Fotos auf Wikimedia Commons), mit Illustrationen 2.000–3.500 Sorten. Für **deutsche Regionalsorten** nur einige Dutzend bis wenige Hundert. Alle Angaben geschätzt [U].
- **Standardisierte Schnittfotos alter Sorten mit offener Lizenz gibt es praktisch nicht.** Das ist die größte Lücke, und genau dort setzt euer A4-Protokoll an.
- **Die alten Handbücher sind legal und frei verfügbar** (Bibliotheken, BHL, Internet Archive). BitTorrent ist nicht nötig. Die vorhandene Fraktur-OCR ist unbrauchbar und muss neu erzeugt werden.

## 1. Merkmals- und Sortendatenbanken

| Quelle | Umfang | Schnittmerkmale | Zugang | Lizenz | Priorität |
|---|---|---|---|---|---|
| **NFC Characterization & Evaluation 2025 – Apple** (Univ. Reading/Defra), [DOI 10.17864/1947.001455](https://researchdata.reading.ac.uk/1455) | 2.166 Akzessionen, 25 Merkmale (ECPGR) [V] | nein | CSV-Download, mit MUNQ-Spalte [V] | **Open Government Licence 3.0** (README) [V] | **hoch** |
| **EURISCO** (ECPGR) | 261.299 Datenpunkte zu 8.541 Apfel-Akzessionen aus 8 Sammlungen (Bericht 02/2026) [V] | nein (ECPGR-Standard) | Webportal mit Download [U] | je Datengeber prüfen [U] | **hoch** |
| **PomIdent** (Rinntech, Daten H. Letulé) | >500 Apfelsorten, >20 Merkmale, tausende Fotos [V] | [U] | kostenpflichtiges Abo, kein Export | Lizenzvertrag nötig | hoch (Kooperation) |
| **BUND Lemgo Obstsortendatenbank** | >3.500 Obstsorten aller Arten, Texte aus ~40 historischen Werken, Tafeln, eigene Fotos [V] | im Fließtext | Webseiten und PDFs, keine API | „für private Zwecke frei“ [V], App-Nutzung nur mit Genehmigung | hoch (Kooperation) |
| **Schweiz: BDN / FRUCTUS / Agroscope NAP** | NAP-Inventar >2.000 gefährdete Akzessionen aller Obstarten [V]; Medien: ~1.200 Apfelsorten [U] | **ja**, nach NAP-Handbuch [V] | bdn.ch sperrt automatische Abrufe | [U] | **sehr hoch** (Anfrage) |
| **Pometum Apple Key** (Univ. Kopenhagen) | 319 Sorten, 37 Merkmalsgruppen, davon 7 innere Fruchtmerkmale [V] | **ja** | Webtool [U] | [U] | mittel |
| **Arche Noah Sortenblätter** (AT) | Einzelblätter als PDF | **ja**, Kernhaus inkl. Samen [V] | PDF | kein Vermerk | mittel |
| **USDA GRIN-Global** (Geneva) | 6.079 Akzessionen in 55 Taxa [V], z. B. Fruchtform für 3.289 Akzessionen [V] | teilweise [U] | Download | US-Bundesdaten, vermutlich gemeinfrei [U] | mittel (US-Fokus) |
| **GDR rosaceae.org** | Phänotypdaten 2010–2012, CSV [V] | – | CSV | keine offene Lizenz genannt | niedrig |
| **CGN Wageningen** (NL) | ~240 *M. domestica* [V] | – | Portal, Merkmale im Beispiel nicht sichtbar | [U] | niedrig |
| **fruitID** (UK) | [U] | [U] | JavaScript-App | [U] | niedrig |
| **Wikipedia „List of apple cultivars“** | ~345 Sorten [V] | nein | – | CC BY-SA | niedrig (Namen) |
| Pomologen-Verein, KOB Bavendorf, genres.de (Rote Liste), INRAE | keine öffentliche Datenbank gefunden bzw. nicht erreichbar | – | – | – | Anfrage |


## 1a. Stichprobe: Wie viele deutsche Sorten stehen im NFC-Datensatz?

Abgleich am 21.10.2026 mit einer Liste von 56 verbreiteten deutschen Streuobst- und Regionalsorten (inkl. Altes Land). Nach Abzug von Fehltreffern stehen **etwa 44 im NFC-Datensatz**, fast alle mit ECPGR-Merkmalen (2.138 von 2.167 Einträgen haben Merkmalsdaten) [V].

- **Gefunden u. a.:** Boskoop, Gravensteiner, Jakob Lebel, Kaiser Wilhelm, Rheinischer Bohnapfel, Rote Sternrenette, Goldparmäne, Landsberger und Baumanns Renette, Ontario, Berlepsch, Ananasrenette, Danziger Kantapfel, Brettacher, Roter Eiserapfel, Charlamowsky, Klarapfel-Typen, Roter Astrachan, Gelber Edelapfel, Prinzenapfel, Biesterfelder Renette, Purpurroter Cousinot, Zuccalmaglio, Oberlausitzer Muskatrenette, Holsteiner Cox, Glockenapfel, Dülmener Rosenapfel, Krügers Dickstiel, Boiken, Schöner aus Herrnhut, Zabergäu Renette, Champagner Renette, Signe Tillisch, Harberts Renette, Luxemburger Renette, **Finkenwerder Prinz, Altländer Pfannkuchenapfel, Horneburger Pfannkuchen**.
- **Nicht gefunden:** Bittenfelder, Kaiser Alexander, Martens Sämling, Kasseler Renette, Geflammter Kardinal, Lohrer Rambur, Schafsnase, Purpurrote Agathe, Rote Walze, Rheinischer Winterrambur, Roter Trierer Weinapfel, Roter Bellefleur.
- **Einschränkungen:** Die Liste enthält eher bekannte Sorten; seltene Lokalsorten fehlen vermutlich häufiger. Die Bäume stehen in Kent, Größe und Färbung können unter norddeutschen Bedingungen abweichen. Namen müssen zugeordnet werden (englische und französische Schreibweisen), dafür hilft die MUNQ-Spalte.

### Genetische Referenzen (zur Absicherung)

- **Deutsche Genbank Obst, SSR-Datensatz** (Broschewitz et al., *Sci. Data* 2025): 7.890 Bäume, 1.404 Profile, 17 Marker [V]; 1.036 davon pomologisch sortenecht oder mit Vorbehalt [V]. Excel auf OpenAgrar, Lizenz des Datensatzes [U].
- **MUNQ-Codes** (INRAE, etalab 2.0, offen) [V]: eindeutige IDs für Genotypen aus europäischen Sammlungen, gut als gemeinsamer Schlüssel gegen das Synonym-Chaos.
- **Muranty et al. 2020** (1.355 Akzessionen, SNP) [V], Lizenz [U]; **NFC SSR-Daten** [V]; **NL-SNP-Daten** (CC BY 4.0) [V].

## 2. Bildquellen

| Quelle | Sorten / Bilder | Ansichten | Lizenz | Bemerkung |
|---|---|---|---|---|
| **NFC-Fotos auf Wikimedia Commons** | viele NFC-Akzessionen, Zahl [U] | Baum und „Cross section“ [V], 640×480 | OGL [V] | **wichtigste offene Quelle mit Schnittansicht**, Akzessionsnummer im Dateinamen |
| **Wróbel et al. 2026, ETH** ([DOI](https://doi.org/10.3929/ethz-c-000803685)) | 38 alte Sorten, Box | 5 Außenansichten, kein Schnitt | „In Copyright – Non-Commercial“ [V] | Kontakt mit den Autor:innen nötig |
| **LidarDome 2023** ([Zenodo](https://zenodo.org/records/21682885)) | 33 alte Sorten, 7.910 farbige Punktwolken | 3D | CC BY 4.0 [V] | lässt sich zu Ansichten rendern |
| **FruitPhenoBox** (Kirchgessner 2024) | 15 moderne Handelssorten à ~100 Früchte [V] | 5 Außenansichten | CC0 laut Artikel, Metadaten leer [V] | nur zur Kalibrierung; der Artikel von Wróbel nennt 10 Sorten |
| **Krug & Hutschenreuther** | 6 Sorten, 2.030 Bilder [V] | **Längsschnitt**, Stiel-, Kelchseite | nicht öffentlich [U] | einzige Smartphone-Schnittbilder alter Sorten, Anfrage bei Silvia |
| **USDA Pomological Watercolors** | 3.807 Apfelblätter [V], Sortenzahl [U] | ganze Frucht, oft Halbschnitt [V] | gemeinfrei [V] | Bulk über Commons-API; vor allem US-Sorten |
| **Wikimedia Commons, Apple cultivars** | [U] | gemischt | gemischt | Bestimmung ungeprüft |
| Fruits-360, Kaggle, Roboflow, Zenodo | wenige Handelssorten | – | gemischt | für alte Sorten irrelevant |
| iNaturalist, Pl@ntNet | keine Sortenebene | Feld | – | höchstens Testmaterial |
| BUND Lemgo, PomIdent, Pomologen-Verein, BDN | groß, deutsche Sorten | z. T. Schnitt [U] | nicht offen | Kooperation nötig |

## 3. Historische Literatur (gemeinfrei, legal digitalisiert)

Einstieg: [Gartenbaubibliothek, Linkliste Pomologie](https://gartenbaubibliothek.de/digitale-archive/monographien/pomologie-fruit-cultivars) (~200 Werke) und das TU-Berlin-Pomologie-Portal (pomologie.ub.tu-berlin.de).

| Werk | Jahre | Apfelsorten | Schema / Schnitt | Digitalisat | OCR |
|---|---|---|---|---|---|
| **Jahn/Lucas/Oberdieck, Illustrirtes Handbuch der Obstkunde** | 1859–1875, 8 Bde. | geschätzt 600–800 [U] | festes Schema inkl. Kernhaus; Umrisse oft mit Längsschnitt [U] | BSB, SUB Göttingen, TU Berlin (Public Domain Mark), Internet Archive [V] | Fraktur, vorhandene OCR unbrauchbar [V] |
| **Engelbrecht, Deutschlands Apfelsorten** | 1889 | oft genannt ~690 [U] | systematisch, Umriss- und Schnittzeichnungen [U] | UB Braunschweig [U, nicht abrufbar] | offen |
| **Diel, Systematische Beschreibung der Kernobstsorten** | 1799–1832 | offen | Klassensystem, keine Bilder [U] | TU Berlin, BHL [V] | Fraktur |
| **Lauche, Deutsche Pomologie** | 1879–1884 | ~100 im Apfelband [U] | 300 Farbtafeln [V] | WUR Wageningen [V] | – |
| **Deutschlands Obstsorten** (Eckstein & Stähle) | 1905–1934 | >100 [V] | festes Schema inkl. Kernhaus, Tafeln mit Halbschnitt [V] | UB Gießen (Lfg. 1–33) [U] | Rechte der späten Hefte **ungeklärt** |
| **Beach, The Apples of New York** | 1905 | Sammlung >700 [V] | sehr detailliert inkl. Kelchröhre, Samen [U] | Internet Archive, BHL [V] | **gute OCR** |
| **Hogg, The Fruit Manual** | 1884 | vermutlich >1.500 Namen [U] | keine Bilder | BHL, IA [V] | gute OCR |
| **Leroy, Dictionnaire de pomologie** | 1867–1879 | ~500–550 [U] | Umrisse [U] | IA, BHL [V] | gute OCR |
| Lucas, Kernobstsorten Württembergs; Gaucher; Bivort; Deutsches Obstcabinet | | | | Google Books, GWLB (IIIF) u. a. | |
| **Noch geschützt:** Petzold, Votteler, Fischer/Silbereisen | | | | kein legaler Gratiszugang | nur Fakten selbst erfassen |

**Geschätzte Abdeckung der Top 5 zusammen:** 1.500–2.500 verschiedene Sorten nach Abzug von Überschneidungen [Schätzung, hohe Unsicherheit].

**Machbarkeit:** Fraktur-OCR mit Tesseract `frak2021`/`GT4HistOCR`, Kraken, Calamari oder OCR-D; erwartete Zeichenfehlerrate 1–3 % bei sauberen Drucken [U]. Danach Zerlegung nach Sortennummer und Extraktion der Merkmale per Sprachmodell in ein festes Vokabular (NAP-Handbuch), mit Quelle, Band und Seite an jedem Wert und Stichproben durch einen Pomologen. Längsschnitt-Zeichnungen lassen sich per Layoutanalyse ausschneiden.

## 4. Was die App am ersten Tag könnte

- **Mit offenen Daten allein:** Merkmalsabgleich für rund 2.000 überwiegend britische und europäische Genbank-Sorten (NFC, EURISCO), ohne Schnittmerkmale; Fotovergleich für einige hundert bis knapp zweitausend Sorten. **Für deutsche Streuobstsorten wäre das schwach.**
- **Mit den alten Handbüchern:** Schnittmerkmale und Zeichnungen für die klassischen deutschen Sorten, nach einigen Wochen OCR- und Extraktionsarbeit.
- **Mit Kooperationen:** Den eigentlichen Sprung bringen BDN/FRUCTUS (Schnittmerkmale und NAP-Fotos), BUND Lemgo, Pomologen-Verein/Silvia Krug, PomIdent und die Deutsche Genbank Obst.

## 5. Anfragen, die sich lohnen

1. **Agroscope / FRUCTUS** (über Anna Wróbel, ZHAW, oder direkt): NAP-Beschreibungen und Fotos inkl. Schnitte, Nutzungsbedingungen.
2. **Silvia Krug / Pomologen-Verein:** Schnittbilder, Fotoanleitung, Zusammenarbeit.
3. **BUND Lemgo** (Willi Hennebrüder): Nutzung der Texte und Fotos, eventuell Export.
4. **JKI Dresden-Pillnitz** (Monika Höfer): Lizenz des DGO-Datensatzes, pomologische Merkmale der DGO-Sorten.
5. **Rinntech (PomIdent):** Lizenz- oder Kooperationsmodell.

## 6. Nächste Schritte

1. NFC-Datensatz und NFC-Fotos von Commons herunterladen und sichten (offen, sofort machbar).
2. Pilot: einen Apfelband des Illustrirten Handbuchs per IIIF holen, Fraktur-OCR testen, 20 Sortenbeschreibungen extrahieren und mit dem Vater prüfen.
3. Gemeinsames Merkmalsvokabular auf Basis des NAP-Handbuchs festlegen, mit Zuordnung zu ECPGR/UPOV.
4. Anfragen 1–3 aus Abschnitt 5 stellen.

## Wichtigste Quellen

- [NFC C&E Apple 2025](https://researchdata.reading.ac.uk/1455) · [NFC](https://nationalfruitcollection.org.uk/)
- [ECPGR WG-Bericht 2026](https://www.ecpgr.org/fileadmin/templates/ecpgr.org/upload/WORKING_GROUPS/Chairs/Meeting-WGchairs_ExCo-2026/Malus-Pyrus_WG_Chair_s_report_final.pdf) · [ECPGR-Deskriptoren 2022](https://www.ecpgr.org/fileadmin/bioversity/publications/pdfs/2022_ECPGR_Malus_descriptors_final.pdf)
- [NAP-Deskriptorenhandbuch 2021](https://www.fructus.ch/wp-content/uploads/deskriptoren-handbuch_nap_2021.pdf)
- [DGO SSR, Sci. Data 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11736075) · [Höfer et al. 2024](https://www.mdpi.com/2223-7747/13/19/2699) · [MUNQ](https://b2find.eudat.eu/dataset/a7a4b348-c4b4-5e04-b87f-2978bc5f6436)
- [BUND Lemgo Flyer 2025](https://www.bund-lemgo.de/download/00_Obstsortendatenbank_2025.pdf) · [PomIdent](https://pomident2.rinntech.com/)
- [Pometum Apple Key](https://test01.ku.dk/:obvius/pureproxy/3974268/da/publications/the-pometum-apple-key-an-internet-tool-for-genebank-data-includin) · [Arche Noah Sortenblatt](https://www.arche-noah.at/media/obstsortenblatt_2016_steir_schafnase_web.pdf)
- [ETH-Datensatz Wróbel](https://doi.org/10.3929/ethz-c-000803685) · [LidarDome](https://zenodo.org/records/21682885) · [Krug & Hutschenreuther 2024](https://www.mdpi.com/2313-433X/10/4/94)
- [USDA Pomological Watercolors](https://catalog.data.gov/dataset/u-s-department-of-agriculture-usda-pomological-watercolor-collection-750fb) · [Commons-Kategorie](https://commons.wikimedia.org/wiki/Category:USDA_Pomological_Watercolors)
- [Gartenbaubibliothek Pomologie](https://gartenbaubibliothek.de/digitale-archive/monographien/pomologie-fruit-cultivars) · [Beach Bd. 1](https://archive.org/details/applesofnewyork01beac/applesofnewyork01beac) · [Hogg (BHL)](https://biodiversitylibrary.org/bibliography/21905) · [Leroy (BHL)](https://biodiversitylibrary.org/item/286724)
