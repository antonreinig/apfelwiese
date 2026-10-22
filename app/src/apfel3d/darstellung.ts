// Leitet die Parameter des 3D-Modells aus Merkmalswerten (Katalog-Codes) und Farbmessungen ab.
// Die Zuordnung Merkmal → Parameter steht im Merkmalskatalog (Feld parameter3d);
// hier steht nur, wie ein Ausprägungscode in eine Zahl oder Farbe übersetzt wird.

import { MERKMAL_NACH_ID } from '../daten/merkmalskatalog.ts'

export type DeckfarbeArt = 'verwaschen' | 'gestreift' | 'geflammt' | 'marmoriert' | 'getuepfelt'

export interface ApfelParameter {
  breiteMm: number
  hoeheZuBreite: number
  konisch: number // >0 breiteste Stelle zum Stiel hin
  walze: number // 0 rund … 1 walzenförmig
  rippung: number
  kronung: number
  asymmetrie: number
  /** Krümmung der Achse Stiel–Kelch (0 gerade … 1 deutlich krumm) */
  achseKruemmung: number
  /** Unregelmäßige Beulen und Dellen (0 … 1) */
  unregelmaessig: number
  stielgrubeTiefe: number
  stielgrubeWeite: number
  kelchgrubeTiefe: number
  kelchgrubeWeite: number
  stielLaengeMm: number
  stielDickeMm: number
  /** Biegung des Stiels (0 gerade … 1 stark gebogen) */
  stielKruemmung: number
  stielFarbe: string
  kelchOffen: number
  /** Länge der Kelchblätter (0 kurz … 1 lang) */
  kelchblattLaenge: number
  kelchFarbe: string
  grundfarbe: string
  deckfarbe: string
  deckfarbeAnteil: number
  deckfarbeArt: DeckfarbeArt[]
  rostStiel: number
  rostKelch: number
  rostWangen: number
  rostfarbe: string
  punkteDichte: number
  punkteGroesse: number
  punkteFarbe: string
  punkteHof: string | null
  glanz: number
  bereifung: number
  fleischfarbe: string
  kernhausForm: string
  kernhausLage: number // −1 Kelch … 0 Mitte … 1 Stiel
  /** Breite des Kernhauses relativ zur Fruchtbreite (0,15 … 0,45) */
  kernhausBreite: number
  /** Höhe des Kernhauses relativ zur Fruchthöhe (0,25 … 0,7) */
  kernhausHoehe: number
  /** Wie spitz das Kernhaus zum Stiel und zum Kelch ausläuft (0 rund … 1 spitz) */
  kernhausSpitze: number
  /** Größe der Kernfächer relativ zum Kernhaus (0 … 1) */
  kernfachGroesse: number
  kernForm: string
  /** Kernlänge in mm */
  kernLaengeMm: number
  kernFarbe: string
  achseOffen: boolean
  kernfaecherOffen: number
  kelchhoehle: string
  saat: number
}

export const STANDARD: ApfelParameter = {
  breiteMm: 70,
  hoeheZuBreite: 0.86,
  konisch: 0.06,
  walze: 0.2,
  rippung: 0.15,
  kronung: 0.15,
  asymmetrie: 0.1,
  achseKruemmung: 0.1,
  unregelmaessig: 0.15,
  stielgrubeTiefe: 0.45,
  stielgrubeWeite: 0.4,
  kelchgrubeTiefe: 0.35,
  kelchgrubeWeite: 0.4,
  stielLaengeMm: 15,
  stielDickeMm: 2.6,
  stielKruemmung: 0.3,
  stielFarbe: '#6b5a3a',
  kelchOffen: 0.4,
  kelchblattLaenge: 0.5,
  kelchFarbe: '#5c5232',
  grundfarbe: '#d8cf6a',
  deckfarbe: '#b5372d',
  deckfarbeAnteil: 0.25,
  deckfarbeArt: ['verwaschen'],
  rostStiel: 0.3,
  rostKelch: 0.05,
  rostWangen: 0,
  rostfarbe: '#9a7748',
  punkteDichte: 0.45,
  punkteGroesse: 0.4,
  punkteFarbe: '#e9e2bf',
  punkteHof: null,
  glanz: 0.5,
  bereifung: 0,
  fleischfarbe: '#f2e8c9',
  kernhausForm: 'zwiebel',
  kernhausLage: 0,
  kernhausBreite: 0.3,
  kernhausHoehe: 0.45,
  kernhausSpitze: 0.4,
  kernfachGroesse: 0.5,
  kernForm: 'eifoermig',
  kernLaengeMm: 8,
  kernFarbe: '#5a3518',
  achseOffen: false,
  kernfaecherOffen: 0.4,
  kelchhoehle: 'trichter_kurz',
  saat: 1,
}

/** Neutrales Modell für Bäume ohne Messung und ohne Sorte */
export const UNVERMESSEN: ApfelParameter = {
  ...STANDARD,
  grundfarbe: '#cfc9a8',
  deckfarbeAnteil: 0,
  punkteDichte: 0.15,
  rostStiel: 0.1,
  glanz: 0.35,
}

const GRUNDFARBE: Record<string, string> = {
  weisslichgelb: '#efe4ad', gelb: '#e5c94f', gruengelb: '#d2cf62', gelbgruen: '#b9c656',
  gruen: '#8daf47', weisslichgruen: '#cfdba0', cremegelb: '#e9d998', orangegelb: '#e6b443',
}
const DECKFARBE: Record<string, string> = {
  orange: '#cc5a2c', rosa: '#c9606a', hellrot: '#c03c34', rot: '#a52824',
  dunkelrot: '#7a1c1c', purpurrot: '#721d33', braunrot: '#8a3b25',
}
const FLEISCH: Record<string, string> = {
  weiss: '#f6f1e2', cremeweiss: '#f2e8c9', gelblich: '#efdb9d', gruenlich: '#e2e6bd', roetlich: '#efc6b5',
}
const stufe = (code: string, tabelle: Record<string, number>, sonst: number) => tabelle[code] ?? sonst

export interface Wert {
  merkmal: string
  wert: string | number
}

export interface Messfarben {
  grundfarbe?: string
  deckfarbe?: string
  deckfarbeAnteil?: number
  rostfarbe?: string
  fleischfarbe?: string
  hoeheZuBreite?: number
  punktefarbe?: string
  punktehof?: string
}

/**
 * Mehrere Werte je Merkmal (mehrere Quellen oder Akzessionen) zu einem typischen Wert:
 * Stufen und Messwerte → Median, Kategorien → häufigster Wert, Mehrfachmerkmale → alle.
 */
export function zusammenfassen(werte: Wert[]): Wert[] {
  const gruppen = new Map<string, Wert[]>()
  for (const w of werte) {
    if (!gruppen.has(w.merkmal)) gruppen.set(w.merkmal, [])
    gruppen.get(w.merkmal)!.push(w)
  }
  const out: Wert[] = []
  for (const [mid, l] of gruppen) {
    const m = MERKMAL_NACH_ID[mid]
    if (!m || l.length === 1 || m.mehrfach) { out.push(...l); continue }
    if (m.typ === 'ordinal' || m.typ === 'messwert' || m.typ === 'anzahl') {
      const zahlen = l.map((w) => Number(w.wert)).filter((x) => !Number.isNaN(x)).sort((a, b) => a - b)
      if (!zahlen.length) { out.push(l[0]); continue }
      const median = zahlen[Math.floor((zahlen.length - 1) / 2)]
      out.push({ merkmal: mid, wert: m.typ === 'ordinal' ? String(median) : median })
    } else {
      const zaehl = new Map<string, number>()
      for (const w of l) zaehl.set(String(w.wert), (zaehl.get(String(w.wert)) ?? 0) + 1)
      out.push({ merkmal: mid, wert: [...zaehl.entries()].sort((a, b) => b[1] - a[1])[0][0] })
    }
  }
  return out
}

/**
 * Baut die Modellparameter. Mehrere Werte zu einem Merkmal: der erste zählt (für Sorten vorher
 * `zusammenfassen` aufrufen). Gemessene Farben haben Vorrang vor Farbcodes aus Beschreibungen.
 */
export function darstellungAus(werte: Wert[], farben?: Messfarben, saat = 1): { p: ApfelParameter; belegt: Set<keyof ApfelParameter> } {
  const p: ApfelParameter = { ...STANDARD, deckfarbeArt: [...STANDARD.deckfarbeArt], saat }
  const belegt = new Set<keyof ApfelParameter>()
  const gesehen = new Set<string>()
  let breitesteStelle: string | undefined
  const masse: { kernhausBreite?: number; kernhausHoehe?: number; kernfachBreite?: number; kernfachHoehe?: number } = {}
  const setze = <K extends keyof ApfelParameter>(k: K, v: ApfelParameter[K]) => { p[k] = v; belegt.add(k) }

  for (const { merkmal, wert } of werte) {
    if (gesehen.has(merkmal) && !MERKMAL_NACH_ID[merkmal]?.mehrfach) continue
    gesehen.add(merkmal)
    const c = String(wert)
    const n = Number(wert)
    switch (merkmal) {
      case 'frucht_breite': if (n > 20) setze('breiteMm', n); break
      case 'frucht_groesse':
        if (!belegt.has('breiteMm')) setze('breiteMm', stufe(c, { '1': 54, '2': 58, '3': 62, '4': 66, '5': 70, '6': 74, '7': 78, '8': 83, '9': 88 }, 70))
        break
      case 'frucht_hoehe_breite': if (n > 0.4 && n < 1.6) setze('hoeheZuBreite', n); break
      case 'frucht_form': {
        const f: Record<string, [number, number, number]> = {
          // Höhe/Breite, konisch, walze
          flachrund: [0.74, 0.03, 0.15], rund: [0.92, 0.02, 0.1], rundkonisch: [0.88, 0.12, 0.15],
          konisch: [0.95, 0.22, 0.1], stumpfkonisch: [0.84, 0.15, 0.3], walzenfoermig: [0.95, 0.04, 0.85],
          glockenfoermig: [0.95, 0.18, 0.45], eifoermig: [1.02, 0.1, 0.05], flachkonisch: [0.76, 0.16, 0.2],
          unregelmaessig: [0.85, 0.08, 0.2], breitrundkonisch: [0.8, 0.12, 0.15], elliptisch: [0.95, 0.0, 0.0],
          elliptischkonisch: [0.98, 0.14, 0.05], laenglichkonisch: [1.05, 0.2, 0.1],
        }
        const w = f[c]
        if (w) {
          if (!belegt.has('hoeheZuBreite')) setze('hoeheZuBreite', w[0])
          setze('konisch', w[1]); setze('walze', w[2])
          if (c === 'unregelmaessig') { setze('asymmetrie', 0.5); setze('unregelmaessig', 0.6) }
        }
        break
      }
      // nach der Schleife angewendet, damit die Fruchtform sie nicht überschreibt
      case 'frucht_breiteste_stelle': breitesteStelle = c; break
      case 'frucht_rippung': setze('rippung', (n - 1) / 8); break
      case 'frucht_kronung': setze('kronung', (n - 1) / 8); break
      case 'frucht_symmetrie':
        setze('asymmetrie', c === 'schief' ? 0.55 : 0.08)
        setze('achseKruemmung', c === 'schief' ? 0.45 : 0.08)
        break
      case 'schale_grundfarbe': if (GRUNDFARBE[c]) setze('grundfarbe', GRUNDFARBE[c]); break
      case 'schale_deckfarbe_anteil': setze('deckfarbeAnteil', stufe(c, { '0': 0, '1': 0.06, '2': 0.12, '3': 0.22, '4': 0.33, '5': 0.45, '6': 0.58, '7': 0.7, '8': 0.8, '9': 0.9 }, 0.3)); break
      case 'schale_deckfarbe_farbton': if (DECKFARBE[c]) setze('deckfarbe', DECKFARBE[c]); break
      case 'schale_deckfarbe_art': {
        const art = c as DeckfarbeArt
        if (!belegt.has('deckfarbeArt')) setze('deckfarbeArt', [art])
        else if (!p.deckfarbeArt.includes(art)) p.deckfarbeArt.push(art)
        break
      }
      case 'schale_berostung_stielgrube': setze('rostStiel', n / 8); break
      case 'schale_berostung_kelchgrube': setze('rostKelch', n / 8); break
      case 'schale_berostung_wangen': setze('rostWangen', n / 9); break
      case 'schale_berostung_gesamt':
        if (!belegt.has('rostWangen')) setze('rostWangen', n / 9)
        if (!belegt.has('rostStiel')) setze('rostStiel', Math.min(1, n / 7))
        break
      case 'schale_lentizellen_anzahl': setze('punkteDichte', stufe(c, { '1': 0.1, '3': 0.25, '5': 0.5, '7': 0.8, '9': 1 }, 0.45)); break
      case 'schale_lentizellen_groesse': setze('punkteGroesse', stufe(c, { '3': 0.25, '5': 0.5, '7': 0.85 }, 0.4)); break
      case 'schale_lentizellen_art':
        if (c === 'braun') setze('punkteFarbe', '#8d6b44')
        if (c === 'hell') setze('punkteFarbe', '#efe7c6')
        if (c === 'umhoeft_gruen') setze('punkteHof', '#97ab4f')
        if (c === 'umhoeft_rot') setze('punkteHof', '#b34036')
        break
      case 'schale_beschaffenheit':
        if (c === 'glaenzend') setze('glanz', 0.8)
        if (c === 'matt' || c === 'rau') setze('glanz', 0.18)
        if (c === 'fettig') setze('glanz', 0.9)
        if (c === 'bereift') setze('bereifung', 0.7)
        break
      case 'stiel_laenge': setze('stielLaengeMm', stufe(c, { '1': 5, '3': 10, '5': 16, '7': 23, '9': 30 }, 15)); break
      case 'stiel_dicke': setze('stielDickeMm', stufe(c, { '3': 2, '5': 2.7, '7': 3.8 }, 2.6)); break
      case 'stielgrube_tiefe': setze('stielgrubeTiefe', stufe(c, { '3': 0.25, '5': 0.45, '7': 0.68 }, 0.45)); break
      case 'stielgrube_weite': setze('stielgrubeWeite', stufe(c, { '3': 0.25, '5': 0.4, '7': 0.58 }, 0.4)); break
      case 'kelchgrube_tiefe': setze('kelchgrubeTiefe', stufe(c, { '3': 0.18, '5': 0.35, '7': 0.55 }, 0.35)); break
      case 'kelchgrube_weite': setze('kelchgrubeWeite', stufe(c, { '3': 0.25, '5': 0.4, '7': 0.58 }, 0.4)); break
      case 'kelch_offenheit': setze('kelchOffen', stufe(c, { geschlossen: 0, halboffen: 0.5, offen: 1 }, 0.4)); break
      case 'fleisch_farbe': if (FLEISCH[c]) setze('fleischfarbe', FLEISCH[c]); break
      case 'kernhaus_form': {
        setze('kernhausForm', c)
        // Umriss: [Breite, Höhe, Spitze]
        const k: Record<string, [number, number, number]> = {
          spindel: [0.2, 0.55, 0.85], kugelig: [0.32, 0.4, 0.1], zwiebel: [0.36, 0.36, 0.55],
          herz: [0.32, 0.45, 0.6], eifoermig: [0.28, 0.48, 0.35], achsenstaendig: [0.16, 0.5, 0.6],
          flachrund: [0.38, 0.3, 0.12],
        }
        if (k[c]) { setze('kernhausBreite', k[c][0]); setze('kernhausHoehe', k[c][1]); setze('kernhausSpitze', k[c][2]) }
        break
      }
      case 'kerne_form': setze('kernForm', c); break
      // Maße in mm werden nach der Schleife in Anteile an der Frucht umgerechnet (Breite steht dann fest)
      case 'kernhaus_breite_mm': if (n > 0) masse.kernhausBreite = n; break
      case 'kernhaus_hoehe_mm': if (n > 0) masse.kernhausHoehe = n; break
      case 'kernfach_breite_mm': if (n > 0) masse.kernfachBreite = n; break
      case 'kernfach_hoehe_mm': if (n > 0) masse.kernfachHoehe = n; break
      case 'kernfaecher_form': setze('kernfachGroesse', stufe(c, { schlitz: 0.2, mondsichel: 0.35, bohnen: 0.55, oval: 0.6 }, 0.5)); break
      case 'kernhaus_lage': setze('kernhausLage', stufe(c, { stiel: 0.6, mitte: 0, kelch: -0.6 }, 0)); break
      case 'kernhaus_achse': setze('achseOffen', c === 'offen'); break
      case 'kelchhoehle_form': setze('kelchhoehle', c); break
      case 'kernfaecher_oeffnung': setze('kernfaecherOffen', stufe(c, { geschlossen: 0, teilweise: 0.5, offen: 1 }, 0.4)); break
    }
  }
  // Lage der breitesten Stelle: verschiebt die Bauchung deutlich zum Stiel oder zum Kelch
  if (breitesteStelle) setze('konisch', stufe(breitesteStelle, { stiel: 0.26, mitte: 0, kelch: -0.2 }, p.konisch))

  // Kernhausmaße relativ zur Frucht (Engelbrecht: „Kernhaus 36:37, Kammern 9:20“)
  const fruchtHoeheMm = p.breiteMm * p.hoeheZuBreite
  if (masse.kernhausBreite) setze('kernhausBreite', Math.max(0.12, Math.min(0.5, masse.kernhausBreite / p.breiteMm)))
  if (masse.kernhausHoehe) setze('kernhausHoehe', Math.max(0.2, Math.min(0.75, masse.kernhausHoehe / fruchtHoeheMm)))
  if (masse.kernfachBreite && masse.kernhausBreite) {
    // Kammer im Verhältnis zur halben Kernhausbreite: 0,2 schmal … 0,6 groß
    setze('kernfachGroesse', Math.max(0, Math.min(1, ((masse.kernfachBreite / (masse.kernhausBreite / 2)) - 0.2) / 0.4)))
  }

  // Ohne Deckfarbe keine Streifen
  if (belegt.has('deckfarbeAnteil') && p.deckfarbeAnteil === 0) p.deckfarbeArt = ['verwaschen']

  if (farben) {
    if (farben.grundfarbe) setze('grundfarbe', farben.grundfarbe)
    if (farben.deckfarbe) setze('deckfarbe', farben.deckfarbe)
    // gemessener Anteil schlägt die grobe Stufe aus Beschreibungen (die oft von einer anderen Akzession stammt)
    if (farben.deckfarbeAnteil !== undefined) {
      setze('deckfarbeAnteil', farben.deckfarbeAnteil)
      if (farben.deckfarbeAnteil < 0.03) p.deckfarbeArt = ['verwaschen']
      // viel gemessenes Rot: flächige Rötung unter den Streifen, wie auf den Fotos zu sehen
      else if (farben.deckfarbeAnteil > 0.35 && !p.deckfarbeArt.includes('verwaschen')) p.deckfarbeArt = ['verwaschen', ...p.deckfarbeArt]
    }
    // Rost wird in Fotos unsicher erkannt: nur ein wirklich bräunlicher Ton wird übernommen
    if (farben.rostfarbe) {
      const { h, s: satt, v } = hsv(farben.rostfarbe)
      if (h >= 18 && h <= 48 && v < 0.7 && satt > 0.2) setze('rostfarbe', farben.rostfarbe)
    }
    if (farben.fleischfarbe) setze('fleischfarbe', farben.fleischfarbe)
    if (farben.punktefarbe) setze('punkteFarbe', farben.punktefarbe)
    if (farben.punktehof) setze('punkteHof', farben.punktehof)
    if (farben.hoeheZuBreite && !belegt.has('hoeheZuBreite')) setze('hoeheZuBreite', farben.hoeheZuBreite)
  }
  return { p, belegt }
}

const FARBE_ZU_MERKMAL: Record<string, keyof Messfarben> = {
  schale_grundfarbe: 'grundfarbe', schale_deckfarbe_farbton: 'deckfarbe', schale_deckfarbe_anteil: 'deckfarbeAnteil', fleisch_farbe: 'fleischfarbe',
}

/** Gemessene Farben ohne die, die der Nutzer per Merkmal korrigiert hat */
export function farbenOhne(farben: Messfarben | undefined, merkmale: string[]): Messfarben | undefined {
  if (!farben) return farben
  const f = { ...farben }
  for (const m of merkmale) { const k = FARBE_ZU_MERKMAL[m]; if (k) delete f[k] }
  return f
}

/** Kompakte, stabile Kennung eines Parametersatzes (für Textur-Zwischenspeicher) */
export function schluessel(p: ApfelParameter): string {
  return JSON.stringify(p)
}

export function saatAusText(t: string): number {
  let h = 2166136261
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619)
  return (h >>> 0) % 100000
}

// ------------------------------------------------------------------ Rückweg: Parameter → Katalogwerte

function hsv(hex: string) {
  const v = parseInt(hex.replace('#', ''), 16)
  const r = ((v >> 16) & 255) / 255, g = ((v >> 8) & 255) / 255, b = (v & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max }
}

export function grundfarbeCode(hex: string): string {
  const { h, s, v } = hsv(hex)
  if (s < 0.3 && v > 0.8) return h > 70 ? 'weisslichgruen' : 'weisslichgelb'
  if (h < 42) return 'orangegelb'
  if (h < 55) return s < 0.45 ? 'cremegelb' : 'gelb'
  if (h < 68) return 'gruengelb'
  if (h < 85) return 'gelbgruen'
  return 'gruen'
}

export function fleischCode(hex: string): string {
  const { h, s } = hsv(hex)
  if (s < 0.12) return 'weiss'
  if (h < 35 && s > 0.2) return 'roetlich'
  if (h > 62) return 'gruenlich'
  if (s > 0.32) return 'gelblich'
  return 'cremeweiss'
}

export function deckfarbtonCode(hex: string): string {
  const { h, s, v } = hsv(hex)
  if (h > 300 && h < 345) return 'purpurrot'
  if (h > 330 || h < 8) return v < 0.45 ? 'dunkelrot' : 'rot'
  if (h < 16) return v < 0.5 ? 'braunrot' : s < 0.5 ? 'rosa' : 'hellrot'
  return 'orange'
}

export function anteilCode(a: number): string {
  if (a < 0.03) return '0'
  if (a < 0.1) return '1'
  if (a < 0.25) return '3'
  if (a < 0.5) return '5'
  if (a < 0.75) return '7'
  return '9'
}

const naechster = (wert: number, tabelle: Record<string, number>) =>
  Object.entries(tabelle).sort((a, b) => Math.abs(a[1] - wert) - Math.abs(b[1] - wert))[0][0]

/**
 * Leitet aus von Hand angeglichenen Modellparametern die passenden Katalogwerte ab,
 * damit der Abgleich mit den Sorten dieselben Angaben nutzt wie das Modell.
 */
export function merkmaleAusParametern(p: ApfelParameter, geaendert: (keyof ApfelParameter)[]): Wert[] {
  const w: Wert[] = []
  const g = new Set(geaendert)
  const add = (merkmal: string, wert: string | number) => w.push({ merkmal, wert })
  if (g.has('hoeheZuBreite')) add('frucht_hoehe_breite', Math.round(p.hoeheZuBreite * 100) / 100)
  if (g.has('rippung')) add('frucht_rippung', naechster(p.rippung, { '1': 0, '3': 0.25, '5': 0.5, '7': 0.75, '9': 1 }))
  if (g.has('kronung')) add('frucht_kronung', naechster(p.kronung, { '1': 0, '5': 0.5, '9': 1 }))
  if (g.has('asymmetrie') || g.has('achseKruemmung')) add('frucht_symmetrie', p.asymmetrie > 0.35 || p.achseKruemmung > 0.35 ? 'schief' : 'symmetrisch')
  if (g.has('grundfarbe')) add('schale_grundfarbe', grundfarbeCode(p.grundfarbe))
  if (g.has('deckfarbeAnteil')) add('schale_deckfarbe_anteil', anteilCode(p.deckfarbeAnteil))
  if (g.has('deckfarbe') && p.deckfarbeAnteil > 0.03) add('schale_deckfarbe_farbton', deckfarbtonCode(p.deckfarbe))
  if (g.has('deckfarbeArt')) for (const a of p.deckfarbeArt) add('schale_deckfarbe_art', a)
  if (g.has('rostWangen')) add('schale_berostung_wangen', naechster(p.rostWangen, { '0': 0, '3': 3 / 9, '5': 5 / 9, '7': 7 / 9, '9': 1 }))
  if (g.has('rostStiel')) add('schale_berostung_stielgrube', naechster(p.rostStiel, { '0': 0, '3': 3 / 8, '5': 5 / 8, '7': 7 / 8 }))
  if (g.has('rostKelch')) add('schale_berostung_kelchgrube', naechster(p.rostKelch, { '0': 0, '3': 3 / 8, '5': 5 / 8, '7': 7 / 8 }))
  if (g.has('punkteDichte')) add('schale_lentizellen_anzahl', naechster(p.punkteDichte, { '3': 0.25, '5': 0.5, '7': 0.8 }))
  if (g.has('punkteGroesse')) add('schale_lentizellen_groesse', naechster(p.punkteGroesse, { '3': 0.25, '5': 0.5, '7': 0.85 }))
  if (g.has('punkteHof') && p.punkteHof) {
    const { h } = hsv(p.punkteHof)
    add('schale_lentizellen_art', h > 50 && h < 170 ? 'umhoeft_gruen' : 'umhoeft_rot')
  }
  if (g.has('punkteFarbe')) add('schale_lentizellen_art', hsv(p.punkteFarbe).v > 0.7 ? 'hell' : 'braun')
  if (g.has('glanz')) { if (p.glanz > 0.7) add('schale_beschaffenheit', 'glaenzend'); else if (p.glanz < 0.25) add('schale_beschaffenheit', 'matt') }
  if (g.has('bereifung') && p.bereifung > 0.4) add('schale_beschaffenheit', 'bereift')
  if (g.has('stielLaengeMm')) add('stiel_laenge', naechster(p.stielLaengeMm, { '1': 5, '3': 10, '5': 16, '7': 23, '9': 30 }))
  if (g.has('stielDickeMm')) add('stiel_dicke', naechster(p.stielDickeMm, { '3': 2, '5': 2.7, '7': 3.8 }))
  if (g.has('stielgrubeTiefe')) add('stielgrube_tiefe', naechster(p.stielgrubeTiefe, { '3': 0.25, '5': 0.45, '7': 0.68 }))
  if (g.has('stielgrubeWeite')) add('stielgrube_weite', naechster(p.stielgrubeWeite, { '3': 0.25, '5': 0.4, '7': 0.58 }))
  if (g.has('kelchgrubeTiefe')) add('kelchgrube_tiefe', naechster(p.kelchgrubeTiefe, { '3': 0.18, '5': 0.35, '7': 0.55 }))
  if (g.has('kelchgrubeWeite')) add('kelchgrube_weite', naechster(p.kelchgrubeWeite, { '3': 0.25, '5': 0.4, '7': 0.58 }))
  if (g.has('kelchOffen')) add('kelch_offenheit', naechster(p.kelchOffen, { geschlossen: 0, halboffen: 0.5, offen: 1 }))
  if (g.has('kernhausForm')) add('kernhaus_form', p.kernhausForm)
  if (g.has('kernhausBreite')) add('kernhaus_breite_mm', Math.round(p.kernhausBreite * p.breiteMm))
  if (g.has('kernhausHoehe')) add('kernhaus_hoehe_mm', Math.round(p.kernhausHoehe * p.breiteMm * p.hoeheZuBreite))
  if (g.has('kernhausLage')) add('kernhaus_lage', naechster(p.kernhausLage, { kelch: -0.6, mitte: 0, stiel: 0.6 }))
  if (g.has('achseOffen')) add('kernhaus_achse', p.achseOffen ? 'offen' : 'geschlossen')
  if (g.has('kernfaecherOffen')) add('kernfaecher_oeffnung', naechster(p.kernfaecherOffen, { geschlossen: 0, teilweise: 0.5, offen: 1 }))
  if (g.has('kelchhoehle')) add('kelchhoehle_form', p.kelchhoehle)
  if (g.has('kernForm')) add('kerne_form', p.kernForm)
  if (g.has('fleischfarbe')) add('fleisch_farbe', fleischCode(p.fleischfarbe))
  return w
}
