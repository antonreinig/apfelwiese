// Datenformat der Sortendatenbank.
//
// Grundsätze (siehe CLAUDE.md):
// - Jeder Wert trägt seine Quelle (Schlüssel in QUELLEN, dazu Seite/Band, falls vorhanden).
// - Merkmale nur mit IDs und Ausprägungscodes aus dem Merkmalskatalog.
// - Texte sind eigene Formulierungen auf Deutsch, aus belegten Angaben zusammengefasst;
//   Wortlaut fremder Werke wird nicht übernommen (Ausnahme: gemeinfreie Werke, als Zitat markiert).
// - App-Vorschläge fließen nie in diese Datenbank.

export interface Quelle {
  /** Kurzer Schlüssel, z. B. "nfc2025", "lauche1882" */
  id: string
  werk: string
  autor?: string
  jahr?: number
  url?: string
  lizenz: string
  abgerufen?: string
  anmerkung?: string
}

/** Verweis auf eine Quelle, optional mit Band und Seite */
export interface Beleg {
  quelle: string
  band?: string
  seite?: string
  url?: string
}

export interface Merkmalswert extends Beleg {
  merkmal: string // ID aus MERKMALE
  wert: string | number // Ausprägungscode oder Messwert
  /** Originalangabe in der Quelle, z. B. "small" oder "mittelgroß" */
  original?: string
  /** Wert aus einem zusammengefassten Sortentext: alle Belege dieses Textes (quelle ist dann der erste) */
  belege?: Beleg[]
}

export type Textthema =
  | 'ueberblick' | 'herkunft' | 'frucht' | 'schale' | 'schnitt' | 'fleisch_geschmack'
  | 'reife_lagerung' | 'baum' | 'verwendung' | 'unterscheidung'

export interface Sortentext {
  thema: Textthema
  text: string
  belege: Beleg[]
}

export interface Sortenbild {
  /** Direkte Bild-URL (Vorschaugröße, z. B. 640 px breit) */
  url: string
  /** Beschreibungsseite mit Lizenz, z. B. Wikimedia-Commons-Dateiseite */
  seite: string
  art: 'frucht' | 'schnitt' | 'baum' | 'bluete' | 'tafel'
  urheber: string
  lizenz: string
  quelle: string
  titel?: string
}

/** Aus einem Referenzbild per Code gemessene Farben (keine Schätzung durch ein Sprachmodell) */
export interface Farbmessung {
  bild: string // URL des gemessenen Bildes
  /** Kurzbezeichnung der Bildart: „NFC-Foto“, „Foto“, „Aquarell“, „Farbtafel“, „Umrisszeichnung“ */
  methode: string
  /** Ausführliche Beschreibung des Messverfahrens */
  verfahren?: string
  grundfarbe?: string // #rrggbb
  deckfarbe?: string
  deckfarbeAnteil?: number // 0..1 der sichtbaren Schale
  rostfarbe?: string
  fleischfarbe?: string
  hoeheZuBreite?: number // aus dem Umriss, falls Frucht von der Seite fotografiert
}

/** Region (Bundesland, ISO 3166-2) mit Art der Zuordnung */
export interface Regionszuordnung {
  region: string // z. B. "DE-NW"
  /** herkunft: dort entstanden; regionalsorte: in einer Regional- oder Lokalsortenliste; empfehlung: in einer Sortenempfehlung des Landes; verbreitung: laut Quelle dort verbreitet */
  art: 'herkunft' | 'regionalsorte' | 'empfehlung' | 'verbreitung'
  belege: Beleg[]
  original?: string
}

/** Angabe zur Seltenheit oder Gefährdung, wörtlich wie in der Quelle */
export interface Gefaehrdung {
  stufe: string
  belege: Beleg[]
  original?: string
}

export interface Sorte {
  id: string // kleingeschrieben, ohne Umlaute und Leerzeichen: "ananasrenette"
  name: string // gebräuchlicher deutscher Name, sonst Originalname
  synonyme: { name: string; beleg?: Beleg }[]
  munq?: number
  akzessionen?: { sammlung: string; nummer: string; name: string }[]
  herkunft?: {
    text: string
    belege: Beleg[]
    /** Entstehungsland (ISO 3166-1), aus dem Text abgeleitet */
    land?: string
    landSicher?: boolean
    ort?: string
    /** Entstehung oder erste Erwähnung laut Text, ungefähr */
    jahr?: number
  }
  regionen?: Regionszuordnung[]
  gefaehrdung?: Gefaehrdung[]
  merkmale: Merkmalswert[]
  texte: Sortentext[]
  bilder: Sortenbild[]
  farbmessung?: Farbmessung[]
}

/** Kurzfassung für Listen (public/sorten/index.json) */
export interface SortenEintrag {
  id: string
  name: string
  synonyme: string[]
  /** Für das 3D-Medaillon nötige Werte, bereits aus Merkmalen und Farbmessung abgeleitet */
  darstellung: Record<string, unknown>
  reife?: string
  /** Ein Satz zur Einordnung, aus belegten Werten */
  kurz?: string
  /** Vorschaubild (URL), falls vorhanden */
  bild?: string
  hatBild: boolean
  anzahlMerkmale: number
  /** Hat Angaben zum Schnitt (Kernhaus, Kelchhöhle …) */
  schnitt?: boolean
  /** Monate der Genussreife als Codes 1–12 */
  genuss?: number[]
  /** Mehrere Textabschnitte aus mindestens zwei Quellen */
  ausfuehrlich?: boolean
  /** Kompakte Merkmalswerte für Abgleich und Ratgeber: Merkmal-ID → Codes oder Messwerte */
  m?: Record<string, (string | number)[]>
  /** Entstehungsland (ISO 3166-1) */
  land?: string
  /** Regionen als "DE-NW:h" (h herkunft, r regionalsorte, e empfehlung, v verbreitung) */
  regionen?: string[]
  /** Entstehung oder erste Erwähnung (ungefähr), laut Herkunftstext */
  jahr?: number
  /** Ältestes Werk der Quellen, das die Sorte beschreibt oder abbildet (Erscheinungsjahr) */
  beschrieben?: number
  /** Belegt vor 1950 (Entstehung oder Beschreibung) */
  alt?: boolean
  /** Seltenheit oder Gefährdung laut Quelle */
  selten?: string
}
