// Vorläufiger Abgleich eines Baums mit allen Sorten der Datenbank.
// Vergleicht nur Merkmale, die gemessen oder vom Nutzer angegeben wurden, Merkmal für Merkmal,
// und liefert eine Rangliste mit Begründung. Das Ergebnis ist ein App-Vorschlag, keine Bestimmung.

import type { SortenEintrag } from './sorte.ts'
import type { Wert } from '../apfel3d/darstellung.ts'
import { MERKMAL_NACH_ID, auspraegungLabel } from './merkmalskatalog.ts'

export interface Begruendung {
  merkmal: string
  eigen: string
  sorte: string
  passung: number // 0..1
}

export interface Kandidat {
  sorte: SortenEintrag
  punkte: number // 0..1
  verglichen: number
  begruendung: Begruendung[]
}

// Gewicht je Merkmal: wie stark es Sorten unterscheidet und wie verlässlich es gemessen ist
const GEWICHT: Record<string, number> = {
  frucht_breite: 1, frucht_groesse: 0.6, frucht_hoehe_breite: 0.8, frucht_form: 0.8,
  schale_grundfarbe: 1, schale_deckfarbe_anteil: 1.2, schale_deckfarbe_farbton: 0.8, schale_deckfarbe_art: 1,
  schale_berostung_wangen: 1, schale_berostung_gesamt: 1, schale_berostung_stielgrube: 0.5, schale_lentizellen_anzahl: 0.4,
  fleisch_farbe: 0.6, kernhaus_form: 1.2, kernfaecher_oeffnung: 1, kelchhoehle_form: 1.2,
  pflueckreife: 1, genussreife_ende: 0.8, geschmack_suesse: 0.6, geschmack_saeure: 0.8, fleisch_festigkeit: 0.4, fleisch_saftigkeit: 0.4,
  kerne_anzahl: 0.3, aroma_noten: 0.8, aroma_staerke: 0.3, duft_noten: 0.5, duft_staerke: 0.3, schale_beschaffenheit: 0.5,
  schale_lentizellen_art: 0.6, kelch_offenheit: 0.6, kernhaus_breite_mm: 0.6, kernhaus_hoehe_mm: 0.6, bluete_zeit: 0.3, kernhaus_lage: 0.4, kernhaus_achse: 0.4, stiel_laenge: 0.5, genussreife_beginn: 0.6,
}

// Ähnliche Farbcodes zählen halb
const NACHBARN: Record<string, string[]> = {
  gelb: ['gruengelb', 'cremegelb', 'orangegelb'], gruengelb: ['gelb', 'gelbgruen'], gelbgruen: ['gruengelb', 'gruen'],
  gruen: ['gelbgruen'], cremegelb: ['gelb', 'weisslichgelb'], weisslichgelb: ['cremegelb'], orangegelb: ['gelb'],
  rot: ['hellrot', 'dunkelrot'], hellrot: ['rot', 'orange', 'rosa'], dunkelrot: ['rot', 'purpurrot', 'braunrot'],
  purpurrot: ['dunkelrot'], braunrot: ['dunkelrot', 'orange'], orange: ['hellrot', 'braunrot'], rosa: ['hellrot'],
  weiss: ['cremeweiss'], cremeweiss: ['weiss', 'gelblich'], gelblich: ['cremeweiss'], gruenlich: ['cremeweiss'],
  kugelig: ['zwiebel'], zwiebel: ['kugelig'], herz: ['eifoermig'], spindel: ['achsenstaendig'],
}

function passung(merkmal: string, eigen: string | number, sorte: (string | number)[]): number {
  const m = MERKMAL_NACH_ID[merkmal]
  if (!m) return 0.5
  let best = 0
  for (const s of sorte) {
    let p = 0
    if (merkmal === 'frucht_breite') p = Math.exp(-(((Number(eigen) - Number(s)) / 7) ** 2))
    else if (merkmal === 'frucht_hoehe_breite') {
      // Die Messung kennt die Stiel-Kelch-Achse nicht (Wert immer ≤ 1): beide Seiten auf ≤ 1 bringen
      const flach = (x: number) => (x > 1 ? 1 / x : x)
      p = Math.exp(-(((flach(Number(eigen)) - flach(Number(s))) / 0.08) ** 2))
    }
    else if (m.typ === 'messwert') {
      // übrige Messwerte: Abweichung relativ zur Größe, etwa ±12 % gelten als passend
      const a = Number(eigen), b = Number(s)
      p = Math.exp(-(((a - b) / (0.12 * Math.max(1, a, b))) ** 2))
    } else if (m.typ === 'ordinal' || m.typ === 'anzahl' || m.einheit === 'monat') {
      const a = Number(eigen), b = Number(s)
      let d = Math.abs(a - b)
      if (m.einheit === 'monat') d = Math.min(d, 12 - d) * 2
      p = Math.max(0, 1 - d / 4)
    } else p = String(eigen) === String(s) ? 1 : NACHBARN[String(eigen)]?.includes(String(s)) ? 0.5 : 0
    best = Math.max(best, p)
  }
  return best
}

export function gleicheAb(eigen: Wert[], sorten: SortenEintrag[], anzahl = 8): Kandidat[] {
  // Werte je Merkmal sammeln; bei Einzelmerkmalen zählt der erste (Korrekturen stehen vorn)
  const werte = new Map<string, (string | number)[]>()
  for (const w of eigen) {
    if (!GEWICHT[w.merkmal]) continue
    const l = werte.get(w.merkmal)
    if (!l) werte.set(w.merkmal, [w.wert])
    else if (MERKMAL_NACH_ID[w.merkmal]?.mehrfach && !l.includes(w.wert)) l.push(w.wert)
  }
  if (!werte.size) return []
  const ergebnis: Kandidat[] = []
  for (const s of sorten) {
    if (!s.m) continue
    let summe = 0, gewichte = 0
    const begruendung: Begruendung[] = []
    for (const [mid, eigeneWerte] of werte) {
      const sw = s.m[mid]
      // Größe nur einmal zählen: gemessene Breite, wenn die Sorte eine hat, sonst die Größenklasse
      if (mid === 'frucht_groesse' && s.m.frucht_breite && werte.has('frucht_breite')) continue
      if (!sw?.length) continue
      // Mehrfachmerkmale: Anteil der eigenen Ausprägungen, die bei der Sorte vorkommen
      const p = eigeneWerte.reduce((x: number, w) => x + passung(mid, w, sw), 0) / eigeneWerte.length
      const g = GEWICHT[mid]
      summe += p * g
      gewichte += g
      begruendung.push({
        merkmal: mid,
        eigen: eigeneWerte.map((w) => auspraegungLabel(mid, w)).join(', '),
        sorte: [...new Set(sw.map((x) => auspraegungLabel(mid, x)))].join(' oder '),
        passung: p,
      })
    }
    if (gewichte < 2) continue
    // Wenige verglichene Merkmale bremsen das Ergebnis
    const abdeckung = Math.min(1, gewichte / 5)
    ergebnis.push({ sorte: s, punkte: (summe / gewichte) * (0.6 + 0.4 * abdeckung), verglichen: begruendung.length, begruendung: begruendung.sort((a, b) => b.passung - a.passung) })
  }
  return ergebnis.sort((a, b) => b.punkte - a.punkte).slice(0, anzahl)
}
