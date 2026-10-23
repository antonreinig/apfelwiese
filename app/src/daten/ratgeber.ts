// Kaufratgeber: Welche Sorte passt zu Lage, Boden, Platz, Nutzung und Geschmack?
// Bewertet nur belegte Werte aus dem Sortenindex. Fehlt eine Angabe, zählt sie weder für noch gegen die Sorte,
// wird aber als Lücke genannt. Das Ergebnis ist eine Orientierung, keine Pflanzempfehlung einer Baumschule.

import type { SortenEintrag } from './sorte.ts'
import { auspraegungLabel } from './merkmalskatalog.ts'
import { regionsarten, REGIONSART } from './erkunden.ts'
import { NACHBARN, BUNDESLAND_NAME } from './einstellungen.ts'

export type Lage = 'mild' | 'normal' | 'rau' | 'senke'
export type Boden = 'leicht' | 'mittel' | 'schwer' | 'unbekannt'
export type Platz = 'wiese' | 'garten' | 'klein'
export type Nutzung = 'sommer' | 'herbst' | 'lager' | 'kueche' | 'most'
export type Geschmack = 'suess' | 'ausgewogen' | 'saeuerlich' | 'egal'
export type Nachbarn = 'ja' | 'nein' | 'unbekannt'
export type Vorliebe = 'alt' | 'regional'

export interface Antworten {
  region: string | null
  lage: Lage
  boden: Boden
  platz: Platz
  nutzung: Nutzung[]
  geschmack: Geschmack
  robust: boolean
  nachbarn: Nachbarn
  vorliebe: Vorliebe[]
}

export const START: Antworten = {
  region: null, lage: 'normal', boden: 'mittel', platz: 'garten', nutzung: [], geschmack: 'egal', robust: true, nachbarn: 'unbekannt', vorliebe: [],
}

export interface Grund {
  text: string
  /** positiv spricht für die Sorte, negativ dagegen */
  punkte: number
  /** Merkmal, aus dem der Grund stammt (für die Quellen im Sortenporträt) */
  merkmal?: string
}

export interface Empfehlung {
  sorte: SortenEintrag
  punkte: number
  gruende: Grund[]
  /** Fragen, zu denen für diese Sorte keine Angabe vorliegt */
  luecken: string[]
}

/** Merkmale, die über Standort und Anbau Auskunft geben */
export const ANBAU_MERKMALE = [
  'standort_klima', 'standort_boden', 'standort_feuchte', 'bluete_frost', 'anfaelligkeit_schorf', 'anfaelligkeit_mehltau',
  'anfaelligkeit_krebs', 'gesundheit', 'hochstamm', 'baum_wuchs', 'ertrag_beginn', 'ertrag_alternanz', 'lagerfaehigkeit',
]

const werte = (s: SortenEintrag, m: string) => (s.m?.[m] ?? []).map(String)
const hat = (s: SortenEintrag, m: string, ...codes: string[]) => werte(s, m).some((w) => codes.includes(w))
const bekannt = (s: SortenEintrag, m: string) => werte(s, m).length > 0
/** Bei widersprüchlichen Quellen zählt der ungünstigste Wert */
const schlimmster = (s: SortenEintrag, m: string) => Math.max(...werte(s, m).map(Number))
const bester = (s: SortenEintrag, m: string) => Math.min(...werte(s, m).map(Number))

export function anbauAngaben(s: SortenEintrag) {
  return ANBAU_MERKMALE.filter((m) => bekannt(s, m)).length
}

export function bewerte(s: SortenEintrag, a: Antworten): Empfehlung {
  const gruende: Grund[] = []
  const luecken: string[] = []
  // derselbe Grund (etwa Obstbaumkrebs bei Boden und Robustheit) zählt nur einmal
  const plus = (text: string, punkte: number, merkmal?: string) => { if (!gruende.some((g) => g.text === text)) gruende.push({ text, punkte, merkmal }) }

  // ---- Lage und Spätfrost
  const frostLage = a.lage === 'rau' || a.lage === 'senke'
  if (frostLage) {
    const gewicht = a.lage === 'senke' ? 1.5 : 1
    if (bekannt(s, 'bluete_frost')) {
      if (schlimmster(s, 'bluete_frost') >= 7) plus('Blüte frostempfindlich', -2.5 * gewicht, 'bluete_frost')
      else plus('Blüte wenig frostempfindlich', 2 * gewicht, 'bluete_frost')
    }
    if (bekannt(s, 'bluete_zeit')) {
      const b = Number(werte(s, 'bluete_zeit')[0])
      if (b >= 6) plus('blüht spät, entgeht so oft Spätfrösten', 1.5 * gewicht, 'bluete_zeit')
      else if (b <= 3) plus('blüht früh, Spätfrost trifft sie eher', -1.5 * gewicht, 'bluete_zeit')
    }
    if (!bekannt(s, 'bluete_frost') && !bekannt(s, 'bluete_zeit')) luecken.push('Spätfrost')
  }
  if (a.lage === 'rau' || a.lage === 'senke') {
    if (bekannt(s, 'standort_klima')) {
      if (schlimmster(s, 'standort_klima') >= 7) plus('braucht warme, geschützte Lagen', -3, 'standort_klima')
      else if (bester(s, 'standort_klima') <= 3) plus('gedeiht auch in rauen Lagen', 2.5, 'standort_klima')
    } else if (a.lage === 'rau') luecken.push('Klima')
  }
  if (a.lage === 'mild') {
    if (hat(s, 'standort_klima', '7')) plus('mag warme Lagen', 1, 'standort_klima')
    if (bekannt(s, 'anfaelligkeit_mehltau') && schlimmster(s, 'anfaelligkeit_mehltau') >= 7) plus('anfällig für Mehltau, der in warmen, trockenen Lagen häufig ist', -1.5, 'anfaelligkeit_mehltau')
  }

  // ---- Boden
  if (a.boden === 'leicht') {
    if (hat(s, 'standort_feuchte', 'trocken')) plus('verträgt Trockenheit', 2, 'standort_feuchte')
    if (hat(s, 'standort_feuchte', 'feucht')) plus('braucht ausreichend feuchten Boden', -2, 'standort_feuchte')
    if (bekannt(s, 'standort_boden')) {
      if (schlimmster(s, 'standort_boden') >= 7) plus('braucht nährstoffreichen, tiefgründigen Boden', -2, 'standort_boden')
      else if (bester(s, 'standort_boden') <= 3) plus('anspruchslos an den Boden', 1.5, 'standort_boden')
    }
    if (!bekannt(s, 'standort_feuchte') && !bekannt(s, 'standort_boden')) luecken.push('Boden')
  }
  if (a.boden === 'schwer') {
    if (bekannt(s, 'anfaelligkeit_krebs')) {
      if (schlimmster(s, 'anfaelligkeit_krebs') >= 7) plus('anfällig für Obstbaumkrebs, der auf schweren, nassen Böden häufig ist', -2.5, 'anfaelligkeit_krebs')
      else if (bester(s, 'anfaelligkeit_krebs') <= 3) plus('wenig anfällig für Obstbaumkrebs', 1.5, 'anfaelligkeit_krebs')
    }
    if (hat(s, 'standort_feuchte', 'feucht')) plus('mag feuchten Boden', 1, 'standort_feuchte')
    if (hat(s, 'standort_feuchte', 'trocken') && !hat(s, 'standort_feuchte', 'feucht')) plus('für eher trockene Standorte beschrieben', -0.5, 'standort_feuchte')
    if (!bekannt(s, 'anfaelligkeit_krebs') && !bekannt(s, 'standort_feuchte')) luecken.push('Boden')
  }
  if (a.boden === 'mittel' && hat(s, 'standort_boden', '3')) plus('anspruchslos an den Boden', 0.5, 'standort_boden')

  // ---- Platz und Baumform
  if (a.platz === 'wiese') {
    if (hat(s, 'hochstamm', 'gut')) plus('für Hochstamm und Streuobst empfohlen', 2.5, 'hochstamm')
    if (hat(s, 'hochstamm', 'eingeschraenkt') && !hat(s, 'hochstamm', 'gut')) plus('als Hochstamm nur eingeschränkt geeignet', -2, 'hochstamm')
    if (bekannt(s, 'baum_wuchs')) {
      if (bester(s, 'baum_wuchs') >= 7) plus('wächst stark, gut für große Bäume', 1, 'baum_wuchs')
      else if (schlimmster(s, 'baum_wuchs') <= 3) plus('wächst schwach, als Hochstamm eher klein', -1, 'baum_wuchs')
    }
    if (!bekannt(s, 'hochstamm') && !bekannt(s, 'baum_wuchs')) luecken.push('Hochstamm')
  }
  if (a.platz === 'klein' && bekannt(s, 'baum_wuchs')) {
    if (schlimmster(s, 'baum_wuchs') <= 3) plus('wächst schwach', 1, 'baum_wuchs')
    else if (bester(s, 'baum_wuchs') >= 7) plus('wächst stark, braucht eine schwache Unterlage', -1, 'baum_wuchs')
  }

  // ---- Nutzung
  const tafel = hat(s, 'verwendung', 'tafel')
  const verwendungBekannt = bekannt(s, 'verwendung')
  if (a.nutzung.includes('sommer')) {
    if (hat(s, 'pflueckreife', '7', '8')) plus(`reif im ${hat(s, 'pflueckreife', '7') ? 'Juli' : 'August'}`, 2, 'pflueckreife')
    else if (bekannt(s, 'pflueckreife')) plus('kein Sommerapfel', -1.5, 'pflueckreife')
  }
  if (a.nutzung.includes('herbst')) {
    if (s.genuss?.some((m) => m === 9 || m === 10) && (tafel || !verwendungBekannt)) plus('genussreif im Herbst', 1.5, 'genussreife_ende')
  }
  if (a.nutzung.includes('lager')) {
    if (hat(s, 'lagerfaehigkeit', '7') || hat(s, 'genussreife_ende', '3', '4', '5', '6')) plus('hält sich bis ins Frühjahr', 2.5, 'genussreife_ende')
    else if (hat(s, 'genussreife_ende', '1', '2')) plus('hält sich bis in den Winter', 1, 'genussreife_ende')
    else if (hat(s, 'lagerfaehigkeit', '3') || hat(s, 'genussreife_ende', '8', '9', '10')) plus('hält sich nicht lange', -2, 'genussreife_ende')
    else luecken.push('Lagerung')
  }
  if ((a.nutzung.includes('sommer') || a.nutzung.includes('herbst') || a.nutzung.includes('lager')) && verwendungBekannt && !tafel) {
    plus('eher kein Tafelapfel', -1.5, 'verwendung')
  }
  if (a.nutzung.includes('kueche')) {
    if (hat(s, 'verwendung', 'kueche')) plus('gut für Küche und Backen', 2, 'verwendung')
    else if (!verwendungBekannt) luecken.push('Verwendung')
  }
  if (a.nutzung.includes('most')) {
    if (hat(s, 'verwendung', 'most')) plus('gut für Saft und Most', 2, 'verwendung')
    else if (!verwendungBekannt) luecken.push('Verwendung')
  }

  // ---- Geschmack
  if (a.geschmack !== 'egal') {
    const suess = werte(s, 'geschmack_suesse').map(Number)
    const sauer = werte(s, 'geschmack_saeure').map(Number)
    if (!suess.length && !sauer.length) luecken.push('Geschmack')
    if (a.geschmack === 'suess') {
      if (suess.some((x) => x >= 7)) plus('schmeckt süß', 2, 'geschmack_suesse')
      if (sauer.some((x) => x >= 7)) plus('eher säuerlich', -1.5, 'geschmack_saeure')
    }
    if (a.geschmack === 'saeuerlich') {
      if (sauer.some((x) => x >= 7)) plus('säuerlich und frisch', 2, 'geschmack_saeure')
      if (sauer.length && sauer.every((x) => x <= 3)) plus('eher mild', -1.5, 'geschmack_saeure')
    }
    if (a.geschmack === 'ausgewogen') {
      if (sauer.includes(5) && (suess.includes(5) || suess.includes(7))) plus('ausgewogen zwischen süß und sauer', 1.5, 'geschmack_saeure')
      if (sauer.some((x) => x >= 9)) plus('sehr sauer', -1.5, 'geschmack_saeure')
    }
  }

  // ---- Robustheit
  if (a.robust) {
    let angaben = 0
    for (const [m, name, g] of [['anfaelligkeit_schorf', 'Schorf', 2], ['anfaelligkeit_mehltau', 'Mehltau', 1.2], ['anfaelligkeit_krebs', 'Obstbaumkrebs', 1.2]] as const) {
      if (!bekannt(s, m)) continue
      angaben++
      if (schlimmster(s, m) >= 7) plus(`anfällig für ${name}`, -g, m)
      else if (bester(s, m) <= 3) plus(`wenig anfällig für ${name}`, g, m)
    }
    if (bekannt(s, 'gesundheit')) {
      angaben++
      if (bester(s, 'gesundheit') >= 7 && schlimmster(s, 'gesundheit') >= 7) plus('als gesund und robust beschrieben', 1.5, 'gesundheit')
      else if (schlimmster(s, 'gesundheit') <= 3) plus('als empfindlich beschrieben', -1.5, 'gesundheit')
    }
    if (!angaben) luecken.push('Krankheiten')
  }

  // ---- Befruchtung
  if (hat(s, 'ploidie', 'triploid')) {
    if (a.nachbarn === 'nein') plus('triploid: braucht zwei weitere Sorten als Befruchter', -3, 'ploidie')
    else if (a.nachbarn === 'unbekannt') plus('triploid: braucht zwei andere Sorten in der Nähe', -1, 'ploidie')
  }

  // ---- Vorlieben
  if (a.vorliebe.includes('alt') && s.alt) plus(s.jahr ? `alte Sorte, um ${s.jahr}` : s.beschrieben ? `alte Sorte, beschrieben ${s.beschrieben}` : 'alte Sorte', 2)
  if (a.region) {
    const arten = regionsarten(s, a.region)
    const gewicht = a.vorliebe.includes('regional') ? 1 : 0.4
    if (arten.length) plus(`${BUNDESLAND_NAME[a.region]}: ${arten.map((x) => REGIONSART[x]).join(', ')}`, 3 * gewicht)
    else if ((NACHBARN[a.region] ?? []).some((n) => regionsarten(s, n).some((x) => x === 'h' || x === 'r'))) plus('aus einem Nachbarland', 1 * gewicht)
  }

  const punkte = gruende.reduce((x, g) => x + g.punkte, 0)
  return { sorte: s, punkte, gruende: gruende.sort((x, y) => y.punkte - x.punkte), luecken: [...new Set(luecken)] }
}

/**
 * Rangliste: nur Sorten mit Angaben zum Anbau (sonst ließe sich zu Lage und Robustheit nichts sagen),
 * mindestens zwei passende Gründe, und keine Sorte mit einem schweren Gegengrund.
 */
export function empfehlungen(sorten: SortenEintrag[], a: Antworten, anzahl = 30) {
  const pool = sorten.filter((s) => anbauAngaben(s) >= 2)
  const bewertet = pool.map((s) => bewerte(s, a))
  const passend = bewertet
    .filter((e) => e.punkte > 0 && !e.gruende.some((g) => g.punkte <= -2.5))
    .sort((x, y) => y.punkte - x.punkte || x.luecken.length - y.luecken.length || x.sorte.name.localeCompare(y.sorte.name, 'de'))
  return { pool: pool.length, liste: passend.slice(0, anzahl), anzahlPassend: passend.length }
}

/** Kurzbeschriftung eines Merkmalswerts (für Gründe mit Quelle) */
export function wertText(s: SortenEintrag, merkmal: string) {
  return werte(s, merkmal).map((w) => auspraegungLabel(merkmal, w)).join(' oder ')
}
