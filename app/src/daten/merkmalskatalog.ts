// Merkmalskatalog: einzige Quelle für Merkmale und Ausprägungen.
// Erfassung, Abgleich, Erklärtexte, Parametermodus und 3D-Modell lesen daraus.
//
// Stand 22.10.2026: vorläufige Fassung. Gliederung und Ausprägungen sind an die üblichen
// pomologischen Beschreibungen angelehnt. Die Codes aus NAP-Handbuch, UPOV TG/14 und
// ECPGR sind noch nicht abgeglichen; das Feld `quellen` bleibt leer, bis die Originale
// vorliegen und jede Zuordnung geprüft ist.

export type Gruppe =
  | 'frucht' | 'schale' | 'stiel' | 'kelch' | 'kernhaus' | 'kerne'
  | 'fleisch' | 'sensorik' | 'phaenologie' | 'baum'

export type Ansicht =
  | 'foto1_laengshaelfte_schale' | 'foto2_laengsscheibe'
  | 'foto3_querhaelfte_kelch' | 'foto3_querhaelfte_stiel' | 'foto3_kerne'
  | 'foto4_querscheibe'

export interface Auspraegung {
  code: string
  label: string
  beschreibung?: string
}

export interface Merkmal {
  id: string
  name: string
  gruppe: Gruppe
  typ: 'messwert' | 'ordinal' | 'kategorie' | 'anzahl' | 'text'
  einheit?: 'mm' | 'g' | 'verhaeltnis' | 'prozent' | 'monat'
  auspraegungen?: Auspraegung[]
  /** Mehrere Ausprägungen gleichzeitig möglich (z. B. Deckfarbe gestreift und verwaschen) */
  mehrfach?: boolean
  ansichten: Ansicht[]
  /** literatur: nur aus Sortenbeschreibungen, wird am eigenen Baum nicht abgefragt */
  erfassung: 'messung' | 'sprachmodell' | 'abfrage' | 'literatur'
  erklaerung: string
  parameter3d?: string
  quellen: {}
}

const stufen5 = (niedrig: string, mittel: string, hoch: string, sehrNiedrig: string, sehrHoch: string): Auspraegung[] => [
  { code: '1', label: sehrNiedrig },
  { code: '3', label: niedrig },
  { code: '5', label: mittel },
  { code: '7', label: hoch },
  { code: '9', label: sehrHoch },
]

const monate: Auspraegung[] = [
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
].map((m, i) => ({ code: String(((i + 6) % 12) + 1), label: m }))

export const MERKMALE: Merkmal[] = [
  // ---------------------------------------------------------------- Frucht
  {
    id: 'frucht_breite', name: 'Fruchtbreite', gruppe: 'frucht', typ: 'messwert', einheit: 'mm',
    ansichten: ['foto1_laengshaelfte_schale', 'foto3_querhaelfte_kelch'], erfassung: 'messung',
    erklaerung: 'Größter Durchmesser quer zur Achse Stiel–Kelch. Zusammen mit der Höhe ergibt er Größe und Form.',
    parameter3d: 'breiteMm', quellen: {},
  },
  {
    id: 'frucht_hoehe', name: 'Fruchthöhe', gruppe: 'frucht', typ: 'messwert', einheit: 'mm',
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'messung',
    erklaerung: 'Abstand vom Grund der Stielgrube bis zum Kelch, gemessen an der Längshälfte.',
    parameter3d: 'hoeheMm', quellen: {},
  },
  {
    id: 'frucht_groesse', name: 'Fruchtgröße', gruppe: 'frucht', typ: 'ordinal',
    auspraegungen: stufen5('klein', 'mittel', 'groß', 'sehr klein', 'sehr groß'),
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'messung',
    erklaerung: 'Grobe Größenklasse. Schwankt mit Jahr, Behang und Standort; deshalb ein schwaches Merkmal.',
    quellen: {},
  },
  {
    id: 'frucht_form', name: 'Fruchtform', gruppe: 'frucht', typ: 'kategorie',
    auspraegungen: [
      { code: 'flachrund', label: 'flachrund', beschreibung: 'deutlich breiter als hoch' },
      { code: 'rund', label: 'kugelig', beschreibung: 'etwa so hoch wie breit' },
      { code: 'rundkonisch', label: 'rundlich-kegelförmig' },
      { code: 'konisch', label: 'kegelförmig', beschreibung: 'zum Kelch hin deutlich verjüngt' },
      { code: 'stumpfkonisch', label: 'stumpf kegelförmig' },
      { code: 'walzenfoermig', label: 'walzenförmig', beschreibung: 'Seiten fast parallel' },
      { code: 'glockenfoermig', label: 'glockenförmig' },
      { code: 'eifoermig', label: 'eiförmig' },
      { code: 'flachkonisch', label: 'flach kegelförmig' },
      { code: 'breitrundkonisch', label: 'breit rundlich-kegelförmig' },
      { code: 'elliptisch', label: 'elliptisch' },
      { code: 'elliptischkonisch', label: 'elliptisch-kegelförmig' },
      { code: 'laenglichkonisch', label: 'länglich kegelförmig' },
      { code: 'unregelmaessig', label: 'unregelmäßig' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'messung',
    erklaerung: 'Umriss der Längshälfte. Die App misst ihn direkt; die Bezeichnung ist eine Einordnung des Umrisses.',
    parameter3d: 'form', quellen: {},
  },
  {
    id: 'frucht_hoehe_breite', name: 'Verhältnis Höhe zu Breite', gruppe: 'frucht', typ: 'messwert', einheit: 'verhaeltnis',
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'messung',
    erklaerung: 'Unter 0,85 wirkt ein Apfel flach, über 1,0 hoch gebaut.',
    parameter3d: 'hoeheZuBreite', quellen: {},
  },
  {
    id: 'frucht_breiteste_stelle', name: 'Lage der breitesten Stelle', gruppe: 'frucht', typ: 'kategorie',
    auspraegungen: [
      { code: 'stiel', label: 'zum Stiel hin' },
      { code: 'mitte', label: 'in der Mitte' },
      { code: 'kelch', label: 'zum Kelch hin' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'messung',
    erklaerung: 'Liegt die breiteste Stelle nahe am Stiel, wirkt der Apfel kegelförmig.',
    parameter3d: 'breitesteStelle', quellen: {},
  },
  {
    id: 'frucht_rippung', name: 'Rippung', gruppe: 'frucht', typ: 'ordinal',
    auspraegungen: [
      { code: '1', label: 'fehlend oder sehr schwach' }, { code: '3', label: 'schwach' },
      { code: '5', label: 'mittel' }, { code: '7', label: 'stark' }, { code: '9', label: 'sehr stark' },
    ],
    ansichten: ['foto3_querhaelfte_kelch', 'foto4_querscheibe'], erfassung: 'sprachmodell',
    erklaerung: 'Längsrippen über die Frucht. Im Querschnitt als kantiger statt runder Umriss zu sehen.',
    parameter3d: 'rippung', quellen: {},
  },
  {
    id: 'frucht_kronung', name: 'Kronung am Kelch', gruppe: 'frucht', typ: 'ordinal',
    auspraegungen: [
      { code: '1', label: 'fehlend oder schwach' }, { code: '5', label: 'mittel' }, { code: '9', label: 'stark' },
    ],
    ansichten: ['foto3_querhaelfte_kelch'], erfassung: 'sprachmodell',
    erklaerung: 'Höcker rund um die Kelchgrube, wie eine kleine Krone.',
    parameter3d: 'kronung', quellen: {},
  },
  {
    id: 'frucht_symmetrie', name: 'Symmetrie', gruppe: 'frucht', typ: 'kategorie',
    auspraegungen: [{ code: 'symmetrisch', label: 'gleichmäßig' }, { code: 'schief', label: 'einseitig, schief' }],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'messung',
    erklaerung: 'Manche Sorten sind typisch auf einer Seite höher gebaut.',
    parameter3d: 'asymmetrie', quellen: {},
  },
  {
    id: 'frucht_gewicht', name: 'Fruchtgewicht', gruppe: 'frucht', typ: 'messwert', einheit: 'g',
    ansichten: [], erfassung: 'abfrage',
    erklaerung: 'Optional mit der Küchenwaage. Hilft bei der Größeneinordnung.',
    quellen: {},
  },

  // ---------------------------------------------------------------- Schale
  {
    id: 'schale_grundfarbe', name: 'Grundfarbe', gruppe: 'schale', typ: 'kategorie',
    auspraegungen: [
      { code: 'weisslichgelb', label: 'weißlich gelb' },
      { code: 'gelb', label: 'gelb' },
      { code: 'gruengelb', label: 'grünlich gelb' },
      { code: 'gelbgruen', label: 'gelblich grün' },
      { code: 'gruen', label: 'grün' },
      { code: 'weisslichgruen', label: 'weißlich grün' },
      { code: 'cremegelb', label: 'cremegelb' },
      { code: 'orangegelb', label: 'orangegelb' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Farbe der Schale dort, wo keine Deckfarbe liegt, meist auf der Schattenseite. Ändert sich mit der Reife.',
    parameter3d: 'grundfarbe', quellen: {},
  },
  {
    id: 'schale_deckfarbe_anteil', name: 'Anteil der Deckfarbe', gruppe: 'schale', typ: 'ordinal',
    auspraegungen: [
      { code: '0', label: 'keine' }, { code: '1', label: 'sehr gering' }, { code: '3', label: 'gering' },
      { code: '5', label: 'mittel' }, { code: '7', label: 'groß' }, { code: '9', label: 'sehr groß' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Wie viel der Oberfläche rot oder orange überzogen ist. Hängt stark von Sonne und Jahr ab.',
    parameter3d: 'deckfarbeAnteil', quellen: {},
  },
  {
    id: 'schale_deckfarbe_farbton', name: 'Farbton der Deckfarbe', gruppe: 'schale', typ: 'kategorie',
    auspraegungen: [
      { code: 'orange', label: 'orange' }, { code: 'rosa', label: 'rosa' }, { code: 'hellrot', label: 'hellrot' },
      { code: 'rot', label: 'rot' }, { code: 'dunkelrot', label: 'dunkelrot' }, { code: 'purpurrot', label: 'purpurrot' },
      { code: 'braunrot', label: 'braunrot' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Farbton der Deckfarbe auf der Sonnenseite.',
    parameter3d: 'deckfarbe', quellen: {},
  },
  {
    id: 'schale_deckfarbe_art', name: 'Verteilung der Deckfarbe', gruppe: 'schale', typ: 'kategorie', mehrfach: true,
    auspraegungen: [
      { code: 'verwaschen', label: 'verwaschen', beschreibung: 'flächig ohne klare Grenzen' },
      { code: 'gestreift', label: 'gestreift', beschreibung: 'schmale Streifen vom Stiel zum Kelch' },
      { code: 'geflammt', label: 'geflammt', beschreibung: 'breite, ausgefranste Streifen' },
      { code: 'marmoriert', label: 'marmoriert' },
      { code: 'getuepfelt', label: 'getupft' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Wie die Deckfarbe auf der Schale verteilt ist. Streifen und Flammen sind oft sortentypisch und gut zu erkennen.',
    parameter3d: 'deckfarbeArt', quellen: {},
  },
  {
    id: 'schale_berostung_stielgrube', name: 'Berostung in der Stielgrube', gruppe: 'schale', typ: 'ordinal',
    auspraegungen: [{ code: '0', label: 'fehlend' }, { code: '3', label: 'gering' }, { code: '5', label: 'mittel' }, { code: '7', label: 'stark' }],
    ansichten: ['foto3_querhaelfte_stiel'], erfassung: 'sprachmodell',
    erklaerung: 'Rauer, bräunlicher Belag in der Stielgrube. Bei vielen Renetten typisch.',
    parameter3d: 'rostStiel', quellen: {},
  },
  {
    id: 'schale_berostung_wangen', name: 'Berostung auf den Wangen', gruppe: 'schale', typ: 'ordinal',
    auspraegungen: [{ code: '0', label: 'fehlend' }, { code: '3', label: 'gering' }, { code: '5', label: 'mittel' }, { code: '7', label: 'stark' }, { code: '9', label: 'fast vollständig' }],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Rost auf der Seitenfläche, als Netz, Flecken oder geschlossene Fläche.',
    parameter3d: 'rostWangen', quellen: {},
  },
  {
    id: 'schale_berostung_gesamt', name: 'Berostung insgesamt', gruppe: 'schale', typ: 'ordinal',
    auspraegungen: [
      { code: '0', label: 'fehlend' }, { code: '1', label: 'sehr gering' }, { code: '3', label: 'gering' },
      { code: '5', label: 'mittel' }, { code: '7', label: 'stark' }, { code: '9', label: 'sehr stark' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Wie viel der ganzen Schale von rauem, bräunlichem Rost bedeckt ist. Bei Boskoop und vielen Renetten groß.',
    parameter3d: 'rostGesamt', quellen: {},
  },
  {
    id: 'schale_berostung_kelchgrube', name: 'Berostung in der Kelchgrube', gruppe: 'schale', typ: 'ordinal',
    auspraegungen: [{ code: '0', label: 'fehlend' }, { code: '3', label: 'gering' }, { code: '5', label: 'mittel' }, { code: '7', label: 'stark' }],
    ansichten: ['foto3_querhaelfte_kelch'], erfassung: 'sprachmodell',
    erklaerung: 'Rost rund um den Kelch.',
    parameter3d: 'rostKelch', quellen: {},
  },
  {
    id: 'schale_lentizellen_anzahl', name: 'Schalenpunkte (Lentizellen): Anzahl', gruppe: 'schale', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'wenige' }, { code: '5', label: 'mittel' }, { code: '7', label: 'viele' }],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Kleine Atemöffnungen der Schale. Dichte, Größe und Farbe sind oft sortentypisch.',
    parameter3d: 'punkteDichte', quellen: {},
  },
  {
    id: 'schale_lentizellen_groesse', name: 'Schalenpunkte: Größe', gruppe: 'schale', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'klein' }, { code: '5', label: 'mittel' }, { code: '7', label: 'groß' }],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Feine Punkte oder deutlich sichtbare Sternchen.',
    parameter3d: 'punkteGroesse', quellen: {},
  },
  {
    id: 'schale_lentizellen_art', name: 'Schalenpunkte: Aussehen', gruppe: 'schale', typ: 'kategorie', mehrfach: true,
    auspraegungen: [
      { code: 'hell', label: 'hell, weißlich' }, { code: 'braun', label: 'bräunlich, berostet' },
      { code: 'umhoeft_gruen', label: 'grün umhöft' }, { code: 'umhoeft_rot', label: 'rot umhöft' },
      { code: 'sternfoermig', label: 'sternförmig' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'sprachmodell',
    erklaerung: 'Ein farbiger Hof um die Punkte ist bei einigen Sorten ein gutes Unterscheidungsmerkmal.',
    parameter3d: 'punkteArt', quellen: {},
  },
  {
    id: 'schale_beschaffenheit', name: 'Beschaffenheit der Schale', gruppe: 'schale', typ: 'kategorie', mehrfach: true,
    auspraegungen: [
      { code: 'glatt', label: 'glatt' }, { code: 'rau', label: 'rau' }, { code: 'fettig', label: 'fettig beim Lagern' },
      { code: 'bereift', label: 'bläulich bereift' }, { code: 'glaenzend', label: 'glänzend' }, { code: 'matt', label: 'matt' },
    ],
    ansichten: ['foto1_laengshaelfte_schale'], erfassung: 'abfrage',
    erklaerung: 'Fühlt sich die Schale glatt, rau oder fettig an? Fettige Schale ist bei manchen Sorten typisch.',
    parameter3d: 'glanz', quellen: {},
  },

  // ---------------------------------------------------------------- Stiel
  {
    id: 'stiel_laenge', name: 'Stiellänge', gruppe: 'stiel', typ: 'ordinal',
    auspraegungen: [{ code: '1', label: 'sehr kurz' }, { code: '3', label: 'kurz' }, { code: '5', label: 'mittel' }, { code: '7', label: 'lang' }, { code: '9', label: 'sehr lang' }],
    ansichten: ['foto2_laengsscheibe', 'foto3_querhaelfte_stiel'], erfassung: 'messung',
    erklaerung: 'Ragt der Stiel über die Stielgrube hinaus oder bleibt er darin?',
    parameter3d: 'stielLaenge', quellen: {},
  },
  {
    id: 'stiel_dicke', name: 'Stieldicke', gruppe: 'stiel', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'dünn' }, { code: '5', label: 'mittel' }, { code: '7', label: 'dick' }],
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Ein dicker, fleischiger Stiel ist bei manchen Sorten typisch.',
    parameter3d: 'stielDicke', quellen: {},
  },
  {
    id: 'stielgrube_tiefe', name: 'Tiefe der Stielgrube', gruppe: 'stiel', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'flach' }, { code: '5', label: 'mittel' }, { code: '7', label: 'tief' }],
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Im Längsschnitt gut messbar.',
    parameter3d: 'stielgrubeTiefe', quellen: {},
  },
  {
    id: 'stielgrube_weite', name: 'Weite der Stielgrube', gruppe: 'stiel', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'eng' }, { code: '5', label: 'mittel' }, { code: '7', label: 'weit' }],
    ansichten: ['foto3_querhaelfte_stiel'], erfassung: 'messung',
    erklaerung: 'Durchmesser der Vertiefung um den Stiel.',
    parameter3d: 'stielgrubeWeite', quellen: {},
  },

  // ---------------------------------------------------------------- Kelch
  {
    id: 'kelch_offenheit', name: 'Kelch', gruppe: 'kelch', typ: 'kategorie',
    auspraegungen: [{ code: 'geschlossen', label: 'geschlossen' }, { code: 'halboffen', label: 'halb offen' }, { code: 'offen', label: 'offen' }],
    ansichten: ['foto3_querhaelfte_kelch'], erfassung: 'sprachmodell',
    erklaerung: 'Stehen die vertrockneten Kelchblätter zusammen oder sieht man in die Kelchhöhle?',
    parameter3d: 'kelchOffen', quellen: {},
  },
  {
    id: 'kelchgrube_tiefe', name: 'Tiefe der Kelchgrube', gruppe: 'kelch', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'flach' }, { code: '5', label: 'mittel' }, { code: '7', label: 'tief' }],
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Im Längsschnitt gut messbar.',
    parameter3d: 'kelchgrubeTiefe', quellen: {},
  },
  {
    id: 'kelchgrube_weite', name: 'Weite der Kelchgrube', gruppe: 'kelch', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'eng' }, { code: '5', label: 'mittel' }, { code: '7', label: 'weit' }],
    ansichten: ['foto3_querhaelfte_kelch'], erfassung: 'messung',
    erklaerung: 'Durchmesser der Vertiefung um den Kelch.',
    parameter3d: 'kelchgrubeWeite', quellen: {},
  },
  {
    id: 'kelchhoehle_form', name: 'Kelchhöhle (Kelchröhre)', gruppe: 'kelch', typ: 'kategorie',
    auspraegungen: [
      { code: 'dreieck_breit', label: 'breit dreieckig' },
      { code: 'dreieck_lang', label: 'lang dreieckig' },
      { code: 'trichter_kurz', label: 'Trichter mit kurzer Röhre' },
      { code: 'trichter_lang', label: 'Trichter mit langer Röhre' },
      { code: 'roehre_kernhaus', label: 'Röhre bis zum Kernhaus' },
    ],
    ansichten: ['foto2_laengsscheibe'], erfassung: 'sprachmodell',
    erklaerung: 'Hohlraum unter dem Kelch, nur im Längsschnitt sichtbar. Für viele alte Sorten ein Schlüsselmerkmal.',
    parameter3d: 'kelchhoehle', quellen: {},
  },

  // ---------------------------------------------------------------- Kernhaus
  {
    id: 'kernhaus_form', name: 'Form des Kernhauses', gruppe: 'kernhaus', typ: 'kategorie',
    auspraegungen: [
      { code: 'spindel', label: 'spindelförmig' }, { code: 'kugelig', label: 'kugelig' },
      { code: 'zwiebel', label: 'zwiebelförmig' }, { code: 'herz', label: 'herzförmig' },
      { code: 'eifoermig', label: 'eiförmig' }, { code: 'achsenstaendig', label: 'achsenständig, schmal' },
      { code: 'flachrund', label: 'flachrund', beschreibung: 'breiter als hoch, ohne Zwiebelspitzen' },
    ],
    ansichten: ['foto2_laengsscheibe'], erfassung: 'sprachmodell',
    erklaerung: 'Umriss der Kernhauslinie im Längsschnitt.',
    parameter3d: 'kernhausForm', quellen: {},
  },
  {
    id: 'kernhaus_lage', name: 'Lage des Kernhauses', gruppe: 'kernhaus', typ: 'kategorie',
    auspraegungen: [{ code: 'stiel', label: 'zum Stiel hin' }, { code: 'mitte', label: 'mittig' }, { code: 'kelch', label: 'zum Kelch hin' }],
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Wo das Kernhaus auf der Achse sitzt.',
    parameter3d: 'kernhausLage', quellen: {},
  },
  {
    id: 'kernhaus_breite_mm', name: 'Kernhaus: Breite', gruppe: 'kernhaus', typ: 'messwert', einheit: 'mm',
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Breite des Kernhauses (Gefäßbündellinie) im Längsschnitt. Engelbrecht gibt sie mit der Höhe als „Kernhaus Breite:Höhe“ an.',
    parameter3d: 'kernhausBreite', quellen: {},
  },
  {
    id: 'kernhaus_hoehe_mm', name: 'Kernhaus: Höhe', gruppe: 'kernhaus', typ: 'messwert', einheit: 'mm',
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Höhe des Kernhauses entlang der Achse im Längsschnitt.',
    parameter3d: 'kernhausHoehe', quellen: {},
  },
  {
    id: 'kernfach_breite_mm', name: 'Kernfach: Breite', gruppe: 'kernhaus', typ: 'messwert', einheit: 'mm',
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Breite einer Kammer im Längsschnitt („Kammern Breite:Höhe“ bei Engelbrecht).',
    parameter3d: 'kernfachGroesse', quellen: {},
  },
  {
    id: 'kernfach_hoehe_mm', name: 'Kernfach: Höhe', gruppe: 'kernhaus', typ: 'messwert', einheit: 'mm',
    ansichten: ['foto2_laengsscheibe'], erfassung: 'messung',
    erklaerung: 'Höhe einer Kammer im Längsschnitt.',
    parameter3d: 'kernfachGroesse', quellen: {},
  },
  {
    id: 'kernhaus_achse', name: 'Achsenhöhle', gruppe: 'kernhaus', typ: 'kategorie',
    auspraegungen: [{ code: 'geschlossen', label: 'geschlossen' }, { code: 'offen', label: 'offen, hohl' }],
    ansichten: ['foto4_querscheibe'], erfassung: 'sprachmodell',
    erklaerung: 'Ist die Mitte des Kernhauses hohl?',
    parameter3d: 'achseOffen', quellen: {},
  },
  {
    id: 'kernfaecher_oeffnung', name: 'Kernfächer', gruppe: 'kernhaus', typ: 'kategorie',
    auspraegungen: [{ code: 'geschlossen', label: 'geschlossen' }, { code: 'teilweise', label: 'teilweise offen' }, { code: 'offen', label: 'offen' }],
    ansichten: ['foto4_querscheibe'], erfassung: 'sprachmodell',
    erklaerung: 'Im Querschnitt sichtbar: Sind die fünf Kammern zur Mitte hin geöffnet?',
    parameter3d: 'kernfaecherOffen', quellen: {},
  },
  {
    id: 'kernfaecher_form', name: 'Form der Kernfächer', gruppe: 'kernhaus', typ: 'kategorie',
    auspraegungen: [{ code: 'oval', label: 'oval' }, { code: 'bohnen', label: 'bohnenförmig' }, { code: 'mondsichel', label: 'mondsichelförmig' }, { code: 'schlitz', label: 'schlitzförmig' }],
    ansichten: ['foto4_querscheibe', 'foto2_laengsscheibe'], erfassung: 'sprachmodell',
    erklaerung: 'Umriss einer Kammer.',
    parameter3d: 'kernfaecherForm', quellen: {},
  },

  // ---------------------------------------------------------------- Kerne
  {
    id: 'kerne_form', name: 'Form der Kerne', gruppe: 'kerne', typ: 'kategorie',
    auspraegungen: [{ code: 'lang', label: 'lang, spitz' }, { code: 'eifoermig', label: 'eiförmig' }, { code: 'rundlich', label: 'rundlich' }, { code: 'breit', label: 'breit' }],
    ansichten: ['foto3_kerne'], erfassung: 'messung',
    erklaerung: 'Form der Samen.',
    parameter3d: 'kernForm', quellen: {},
  },
  {
    id: 'kerne_anzahl', name: 'Anzahl voll ausgebildeter Kerne', gruppe: 'kerne', typ: 'anzahl',
    ansichten: ['foto3_kerne'], erfassung: 'messung',
    erklaerung: 'Triploide Sorten wie Boskoop haben oft wenige, schlecht ausgebildete Kerne.',
    parameter3d: 'kernAnzahl', quellen: {},
  },

  // ---------------------------------------------------------------- Fleisch und Geschmack
  {
    id: 'fleisch_farbe', name: 'Fleischfarbe', gruppe: 'fleisch', typ: 'kategorie',
    auspraegungen: [
      { code: 'weiss', label: 'weiß' }, { code: 'cremeweiss', label: 'cremeweiß' }, { code: 'gelblich', label: 'gelblich' },
      { code: 'gruenlich', label: 'grünlich' }, { code: 'roetlich', label: 'rötlich' },
    ],
    ansichten: ['foto2_laengsscheibe', 'foto4_querscheibe'], erfassung: 'sprachmodell',
    erklaerung: 'Farbe des Fruchtfleischs gleich nach dem Schneiden.',
    parameter3d: 'fleischfarbe', quellen: {},
  },
  {
    id: 'fleisch_festigkeit', name: 'Festigkeit', gruppe: 'fleisch', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'weich, mürbe' }, { code: '5', label: 'mittel' }, { code: '7', label: 'fest' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wie fest gibt das Fruchtfleisch beim Hineinbeißen nach?',
    quellen: {},
  },
  {
    id: 'fleisch_saftigkeit', name: 'Saftigkeit', gruppe: 'fleisch', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'wenig saftig' }, { code: '5', label: 'mittel' }, { code: '7', label: 'saftig' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wie viel Saft tritt beim Kauen aus?',
    quellen: {},
  },
  {
    id: 'geschmack_suesse', name: 'Süße', gruppe: 'sensorik', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'wenig süß' }, { code: '5', label: 'mittel' }, { code: '7', label: 'süß' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wie süß schmeckt der Apfel?', quellen: {},
  },
  {
    id: 'geschmack_saeure', name: 'Säure', gruppe: 'sensorik', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'mild' }, { code: '5', label: 'mittel' }, { code: '7', label: 'säuerlich' }, { code: '9', label: 'sehr sauer' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wie sauer schmeckt der Apfel?', quellen: {},
  },
  {
    id: 'aroma_staerke', name: 'Aroma', gruppe: 'sensorik', typ: 'ordinal',
    auspraegungen: [{ code: '1', label: 'fade' }, { code: '3', label: 'schwach' }, { code: '5', label: 'mittel' }, { code: '7', label: 'kräftig' }, { code: '9', label: 'sehr kräftig' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wie ausgeprägt der Geschmack jenseits von Süße und Säure ist.', quellen: {},
  },
  {
    id: 'aroma_noten', name: 'Geschmacksnoten', gruppe: 'sensorik', typ: 'kategorie', mehrfach: true,
    auspraegungen: [
      { code: 'nussig', label: 'nussig' }, { code: 'wuerzig', label: 'würzig' }, { code: 'weinig', label: 'weinig' },
      { code: 'parfuemiert', label: 'parfümiert, blumig' }, { code: 'ananas', label: 'ananasartig' }, { code: 'zitronig', label: 'zitronig' },
      { code: 'honig', label: 'honigartig' }, { code: 'anis', label: 'Anis, Fenchel' }, { code: 'marzipan', label: 'Marzipan, Bittermandel' },
      { code: 'birne', label: 'birnenartig' }, { code: 'quitte', label: 'quittenartig' }, { code: 'beerig', label: 'beerig' },
      { code: 'muskat', label: 'muskatartig' }, { code: 'herb', label: 'herb, gerbstoffig' },
    ],
    ansichten: [], erfassung: 'abfrage',
    erklaerung: 'Besondere Noten im Geschmack. Bei alten Sorten oft kennzeichnend, etwa der Fenchelton der Gewürzluiken oder das Ananasaroma der Ananasrenette.',
    quellen: {},
  },
  {
    id: 'duft_staerke', name: 'Duft', gruppe: 'sensorik', typ: 'ordinal',
    auspraegungen: [{ code: '1', label: 'kaum' }, { code: '3', label: 'schwach' }, { code: '5', label: 'deutlich' }, { code: '7', label: 'stark' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wie stark die ganze Frucht riecht, am besten im warmen Raum.', quellen: {},
  },
  {
    id: 'duft_noten', name: 'Duftnoten', gruppe: 'sensorik', typ: 'kategorie', mehrfach: true,
    auspraegungen: [
      { code: 'fruchtig', label: 'fruchtig' }, { code: 'blumig', label: 'blumig' }, { code: 'wuerzig', label: 'würzig' },
      { code: 'ananas', label: 'ananasartig' }, { code: 'quitte', label: 'quittenartig' }, { code: 'honig', label: 'honigartig' },
      { code: 'gruen', label: 'grasig, grün' }, { code: 'anis', label: 'Anis, Fenchel' },
    ],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wonach die Frucht riecht.', quellen: {},
  },
  {
    id: 'geschmack_aroma', name: 'Aroma', gruppe: 'sensorik', typ: 'text',
    ansichten: [], erfassung: 'abfrage',
    erklaerung: 'Besondere Noten, etwa nussig, würzig, parfümiert, ananasartig, Fenchel oder Anis.',
    quellen: {},
  },
  {
    id: 'verwendung', name: 'Verwendung', gruppe: 'sensorik', typ: 'kategorie', mehrfach: true,
    auspraegungen: [
      { code: 'tafel', label: 'Tafelapfel' }, { code: 'kueche', label: 'Küche und Backen' },
      { code: 'most', label: 'Saft und Most' }, { code: 'brennen', label: 'Brennen' }, { code: 'doerren', label: 'Dörren' },
    ],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wofür die Sorte traditionell genutzt wird.', quellen: {},
  },

  // ---------------------------------------------------------------- Phänologie und Baum
  {
    id: 'pflueckreife', name: 'Pflückreife', gruppe: 'phaenologie', typ: 'kategorie', einheit: 'monat', auspraegungen: monate,
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wann die Früchte vom Baum genommen werden.', quellen: {},
  },
  {
    id: 'genussreife_beginn', name: 'Genussreife ab', gruppe: 'phaenologie', typ: 'kategorie', einheit: 'monat', auspraegungen: monate,
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Ab wann der Apfel sein volles Aroma hat. Bei Lageräpfeln oft Wochen nach der Ernte.', quellen: {},
  },
  {
    id: 'genussreife_ende', name: 'Genussreife bis', gruppe: 'phaenologie', typ: 'kategorie', einheit: 'monat', auspraegungen: monate,
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Bis wann der Apfel lagerfähig und gut ist.', quellen: {},
  },
  {
    id: 'bluete_zeit', name: 'Blütezeit', gruppe: 'phaenologie', typ: 'ordinal',
    auspraegungen: [
      { code: '3', label: 'früh' }, { code: '4', label: 'mittelfrüh' }, { code: '5', label: 'mittel' },
      { code: '6', label: 'mittelspät' }, { code: '7', label: 'spät' },
    ],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Relativ zu anderen Sorten am selben Ort.', quellen: {},
  },
  {
    id: 'baum_wuchs', name: 'Wuchsstärke', gruppe: 'baum', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'schwach' }, { code: '5', label: 'mittel' }, { code: '7', label: 'stark' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Wie kräftig der Baum wächst.', quellen: {},
  },
  {
    id: 'ploidie', name: 'Ploidie', gruppe: 'baum', typ: 'kategorie',
    auspraegungen: [{ code: 'diploid', label: 'diploid' }, { code: 'triploid', label: 'triploid' }],
    ansichten: [], erfassung: 'abfrage', erklaerung: 'Triploide Sorten sind schlechte Pollenspender und haben oft wenige Kerne.', quellen: {},
  },

  // ---------------------------------------------------------------- Anbau (aus Sortenbeschreibungen, für den Ratgeber)
  {
    id: 'lagerfaehigkeit', name: 'Lagerfähigkeit', gruppe: 'phaenologie', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'kurz, wenige Wochen' }, { code: '5', label: 'mittel, bis in den Winter' }, { code: '7', label: 'lang, bis ins Frühjahr' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Wie lange sich die Früchte nach der Ernte in einem kühlen Keller halten.', quellen: {},
  },
  {
    id: 'bluete_frost', name: 'Frostempfindlichkeit der Blüte', gruppe: 'phaenologie', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'wenig empfindlich' }, { code: '7', label: 'empfindlich' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Spätfröste während der Blüte kosten die Ernte. In Senken und Höhenlagen zählen robuste oder spät blühende Sorten.', quellen: {},
  },
  {
    id: 'ertrag_beginn', name: 'Ertragsbeginn', gruppe: 'baum', typ: 'kategorie',
    auspraegungen: [{ code: 'frueh', label: 'früh' }, { code: 'mittel', label: 'mittel' }, { code: 'spaet', label: 'spät' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Wie viele Jahre nach der Pflanzung der Baum nennenswert trägt. Hängt stark von der Unterlage ab.', quellen: {},
  },
  {
    id: 'ertrag_alternanz', name: 'Regelmäßigkeit des Ertrags', gruppe: 'baum', typ: 'kategorie',
    auspraegungen: [{ code: 'regelmaessig', label: 'jährlich' }, { code: 'alternierend', label: 'im Wechsel, ein Jahr viel, eins wenig' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Manche Sorten tragen nur jedes zweite Jahr reich (Alternanz).', quellen: {},
  },
  {
    id: 'gesundheit', name: 'Gesundheit', gruppe: 'baum', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'empfindlich' }, { code: '5', label: 'mittel' }, { code: '7', label: 'robust' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Allgemeine Aussagen der Quellen zur Gesundheit von Baum und Frucht.', quellen: {},
  },
  {
    id: 'anfaelligkeit_schorf', name: 'Anfälligkeit für Schorf', gruppe: 'baum', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'gering' }, { code: '5', label: 'mittel' }, { code: '7', label: 'hoch' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Schorf ist eine Pilzkrankheit mit dunklen Flecken auf Blättern und Früchten, häufig in feuchten Lagen.', quellen: {},
  },
  {
    id: 'anfaelligkeit_mehltau', name: 'Anfälligkeit für Mehltau', gruppe: 'baum', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'gering' }, { code: '5', label: 'mittel' }, { code: '7', label: 'hoch' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Echter Mehltau überzieht junge Triebe mit weißem Belag, häufig in warmen, trockenen Lagen.', quellen: {},
  },
  {
    id: 'anfaelligkeit_krebs', name: 'Anfälligkeit für Obstbaumkrebs', gruppe: 'baum', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'gering' }, { code: '5', label: 'mittel' }, { code: '7', label: 'hoch' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Obstbaumkrebs zerstört die Rinde an Ästen und Stamm, vor allem auf schweren, nassen Böden.', quellen: {},
  },
  {
    id: 'standort_klima', name: 'Ansprüche an die Lage', gruppe: 'baum', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'gering, auch raue Lagen' }, { code: '5', label: 'mittel' }, { code: '7', label: 'hoch, warme und geschützte Lagen' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Ob die Sorte auch in Höhenlagen, im Wind und in kühlem Klima gedeiht.', quellen: {},
  },
  {
    id: 'standort_boden', name: 'Ansprüche an den Boden', gruppe: 'baum', typ: 'ordinal',
    auspraegungen: [{ code: '3', label: 'gering' }, { code: '5', label: 'mittel' }, { code: '7', label: 'hoch, nährstoffreich und tiefgründig' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Wie nährstoffreich und tiefgründig der Boden sein muss.', quellen: {},
  },
  {
    id: 'standort_feuchte', name: 'Wasserbedarf', gruppe: 'baum', typ: 'kategorie',
    auspraegungen: [{ code: 'trocken', label: 'verträgt Trockenheit' }, { code: 'feucht', label: 'braucht ausreichend Feuchtigkeit' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Ob die Sorte trockene Standorte verträgt oder genügend feuchten Boden braucht.', quellen: {},
  },
  {
    id: 'hochstamm', name: 'Eignung als Hochstamm', gruppe: 'baum', typ: 'kategorie',
    auspraegungen: [{ code: 'gut', label: 'gut geeignet (Streuobst, Straßen, Feld)' }, { code: 'eingeschraenkt', label: 'eingeschränkt' }],
    ansichten: [], erfassung: 'literatur', erklaerung: 'Hochstämme auf Wiesen und an Wegen brauchen gesunde, kräftige und langlebige Sorten.', quellen: {},
  },
]

export const MERKMAL_NACH_ID: Record<string, Merkmal> = Object.fromEntries(MERKMALE.map((m) => [m.id, m]))

export const GRUPPEN: Record<Gruppe, string> = {
  frucht: 'Frucht', schale: 'Schale', stiel: 'Stiel und Stielgrube', kelch: 'Kelch und Kelchhöhle',
  kernhaus: 'Kernhaus', kerne: 'Kerne', fleisch: 'Fruchtfleisch', sensorik: 'Geschmack und Verwendung',
  phaenologie: 'Reife und Blüte', baum: 'Baum',
}

export function auspraegungLabel(merkmalId: string, code: string | number): string {
  const m = MERKMAL_NACH_ID[merkmalId]
  if (!m) return String(code)
  if (m.typ === 'messwert') return `${code}${m.einheit === 'mm' ? ' mm' : m.einheit === 'g' ? ' g' : ''}`
  return m.auspraegungen?.find((a) => a.code === String(code))?.label ?? String(code)
}
