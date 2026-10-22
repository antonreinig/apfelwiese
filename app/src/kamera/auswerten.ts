// Auswertung im Browser: Foto laden, im Worker messen, freigestellte Vorschau erzeugen,
// und aus den vier Fotos eines Satzes Merkmalswerte (Katalog-IDs) ableiten.

import type { Fotoauswertung, Teil } from './messung.ts'
import { farbton, hex } from './messung.ts'
import type { Punkt } from './blatterkennung.ts'
import { erkenneBlatt } from './blatterkennung.ts'
import type { Fotomessung } from '../daten/baeume.ts'
import type { Wert } from '../apfel3d/darstellung.ts'
import { grundfarbeCode as grundfarbeCodeHex, fleischCode as fleischCodeHex, deckfarbtonCode as deckfarbtonCodeHex, anteilCode } from '../apfel3d/darstellung.ts'
import MessWorker from './messWorker.ts?worker'

const MAX_SEITE = 3000

export async function bildDaten(blob: Blob, maxSeite = MAX_SEITE): Promise<ImageData> {
  const bmp = await createImageBitmap(blob)
  const s = Math.min(1, maxSeite / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s)
  c.height = Math.round(bmp.height * s)
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return g.getImageData(0, 0, c.width, c.height)
}

/** Blatterkennung auf einem fertigen Foto (z. B. aus der Kamera-App) */
export async function blattImFoto(blob: Blob) {
  const d = await bildDaten(blob, 900)
  return { befund: erkenneBlatt(d), breite: d.width, hoehe: d.height }
}

let worker: Worker | null = null
let nummer = 0
const offen = new Map<number, (a: { auswertung?: Fotoauswertung; fehler?: string }) => void>()

/** Ausschnitt eines einzelnen Teils im Blattbild (Hochformat), Anteile 0..1 */
export interface Ausschnitt {
  x: number
  y: number
  w: number
  h: number
  art: 'frucht' | 'kerne'
}

/**
 * Rechtecke der Apfelstücke (und eines für alle Kerne zusammen) im angezeigten Blattbild:
 * Blatt ohne 3-mm-Rand, Querformat ins Hochformat gedreht, mit etwas Luft ringsum.
 */
export function ausschnitteAus(a: Fotoauswertung): Ausschnitt[] {
  if (!a.blattGefunden) return []
  const wMm = a.querformat ? 297 : 210, hMm = a.querformat ? 210 : 297
  const norm = (b: Teil['box']) => {
    const u0 = (b.x0 - 3) / (wMm - 6), u1 = (b.x1 - 3) / (wMm - 6)
    const v0 = (b.y0 - 3) / (hMm - 6), v1 = (b.y1 - 3) / (hMm - 6)
    // Drehung um 90° im Uhrzeigersinn wie beim Blattbild: (u, v) → (1 − v, u)
    return a.querformat ? { x0: 1 - v1, x1: 1 - v0, y0: u0, y1: u1 } : { x0: u0, x1: u1, y0: v0, y1: v1 }
  }
  const mitLuft = (b: { x0: number; x1: number; y0: number; y1: number }, art: Ausschnitt['art']): Ausschnitt => {
    const lx = (b.x1 - b.x0) * 0.1, ly = (b.y1 - b.y0) * 0.1
    const x0 = Math.max(0, b.x0 - lx), y0 = Math.max(0, b.y0 - ly), x1 = Math.min(1, b.x1 + lx), y1 = Math.min(1, b.y1 + ly)
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, art }
  }
  const fruechte = a.teile.filter((t) => t.art === 'frucht').map((t) => ({ t, b: norm(t.box) }))
  // Lesereihenfolge: Zeilen von oben nach unten, darin von links nach rechts
  fruechte.sort((p, q) => (Math.abs(p.b.y0 - q.b.y0) > 0.12 ? p.b.y0 - q.b.y0 : p.b.x0 - q.b.x0))
  const liste = fruechte.map((f) => mitLuft(f.b, 'frucht'))
  const kerne = a.teile.filter((t) => t.art === 'kern').map((t) => norm(t.box))
  if (kerne.length >= 2) {
    liste.push(mitLuft({
      x0: Math.min(...kerne.map((k) => k.x0)), x1: Math.max(...kerne.map((k) => k.x1)),
      y0: Math.min(...kerne.map((k) => k.y0)), y1: Math.max(...kerne.map((k) => k.y1)),
    }, 'kerne'))
  }
  return liste
}

export async function werteAus(blob: Blob, ecken?: Punkt[]): Promise<{ auswertung: Fotoauswertung; vorschau: Blob | null; blatt: Blob | null }> {
  const d = await bildDaten(blob)
  if (!worker) {
    worker = new MessWorker()
    worker.onmessage = (e) => { offen.get(e.data.nr)?.(e.data); offen.delete(e.data.nr) }
    worker.onerror = () => {
      // alle offenen Anfragen beenden und den Worker beim nächsten Mal neu anlegen
      for (const [k, res] of offen) { res({ fehler: 'Auswertung abgebrochen' }); offen.delete(k) }
      worker?.terminate()
      worker = null
    }
  }
  const nr = nummer++
  const antwort = await new Promise<{ auswertung?: Fotoauswertung; fehler?: string }>((res) => {
    offen.set(nr, res)
    setTimeout(() => { if (offen.has(nr)) { offen.delete(nr); res({ fehler: 'Auswertung dauert zu lange' }) } }, 60000)
    worker!.postMessage({ data: d.data.buffer, width: d.width, height: d.height, ecken, nr }, [d.data.buffer])
  })
  if (!antwort.auswertung) throw new Error(antwort.fehler ?? 'Auswertung fehlgeschlagen')
  const a = antwort.auswertung
  const vorschau = a.freigestellt ? await alsBild(a.freigestellt, 'image/png') : null
  const blatt = a.blatt ? await alsBild(a.blatt, 'image/jpeg') : null
  a.freigestellt = undefined // nicht im Speicher halten
  a.blatt = undefined
  return { auswertung: a, vorschau, blatt }
}

/** Puffer als Bild; Querformat wird ins Hochformat gedreht, damit alle Blätter gleich liegen */
async function alsBild(b: { data: Uint8ClampedArray | Uint8Array; width: number; height: number }, typ: string): Promise<Blob | null> {
  const { width, height, data } = b
  const tmp = document.createElement('canvas')
  tmp.width = width; tmp.height = height
  tmp.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0)
  const drehen = width > height
  const c = document.createElement('canvas')
  c.width = drehen ? height : width
  c.height = drehen ? width : height
  const g = c.getContext('2d')!
  if (drehen) { g.translate(c.width, 0); g.rotate(Math.PI / 2) }
  g.drawImage(tmp, 0, 0)
  return new Promise((r) => c.toBlob(r, typ, 0.9))
}

// ------------------------------------------------------------------ Merkmale aus vier Fotos

const mittel = (l: number[]) => l.reduce((s, x) => s + x, 0) / Math.max(1, l.length)

const grundfarbeCode = (rgb: [number, number, number]) => grundfarbeCodeHex(hex(rgb))
const fleischCode = (rgb: [number, number, number]) => fleischCodeHex(hex(rgb))
const deckfarbtonCode = (rgb: [number, number, number]) => deckfarbtonCodeHex(hex(rgb))

function groesseCode(mm: number): string {
  if (mm < 55) return '1'
  if (mm < 62) return '3'
  if (mm < 70) return '5'
  if (mm < 78) return '7'
  return '9'
}

function gewichteteFarbe(l: { rgb: [number, number, number]; anteil: number }[]): [number, number, number] | null {
  const s = l.reduce((x, c) => x + c.anteil, 0)
  if (!s) return null
  return [0, 1, 2].map((k) => l.reduce((x, c) => x + c.rgb[k] * c.anteil, 0) / s) as [number, number, number]
}

/** Aus den Auswertungen der vier Fotos (Reihenfolge wie in der Anleitung) */
export function messungAusFotos(a: (Fotoauswertung | null)[]): Fotomessung {
  const werte: Wert[] = []
  const hinweise: string[] = []
  const farben: Fotomessung['farben'] = {}
  const [f1, f2, f3] = a
  const fruechte = (x: Fotoauswertung | null | undefined) => x?.teile.filter((t) => t.art === 'frucht') ?? []

  // Breite: Querhälften (Foto 3) zeigen den vollen Durchmesser; sonst Längshälften
  const quer = fruechte(f3)
  const laengs = fruechte(f1)
  if (quer.length) {
    const b = quer.map((t) => t.breiteMm)
    const br = Math.round(mittel(b))
    werte.push({ merkmal: 'frucht_breite', wert: br }, { merkmal: 'frucht_groesse', wert: groesseCode(br) })
    hinweise.push(`Breite aus ${quer.length} Querhälften: ${Math.round(Math.min(...b))}–${Math.round(Math.max(...b))} mm, Mittel ${br} mm.`)
  } else if (laengs.length) {
    const br = Math.round(mittel(laengs.map((t) => t.breiteMm)))
    werte.push({ merkmal: 'frucht_breite', wert: br }, { merkmal: 'frucht_groesse', wert: groesseCode(br) })
    hinweise.push(`Breite aus ${laengs.length} Längshälften, Mittel ${br} mm.`)
  }
  if (laengs.length) {
    const v = mittel(laengs.map((t) => t.hoeheMm / t.breiteMm))
    werte.push({ merkmal: 'frucht_hoehe_breite', wert: Math.round(v * 100) / 100 })
    hinweise.push('Höhe zu Breite aus den Umrissen der Längshälften; die längere Ausdehnung wird als Breite angenommen.')
  }

  // Schale (Foto 1)
  if (f1?.farben?.length) {
    const grund = gewichteteFarbe(f1.farben.filter((c) => c.art === 'grund'))
    const deck = f1.farben.filter((c) => c.art === 'deck')
    const deckRgb = gewichteteFarbe(deck)
    const anteil = deck.reduce((s, c) => s + c.anteil, 0)
    if (grund) { farben.grundfarbe = hex(grund); werte.push({ merkmal: 'schale_grundfarbe', wert: grundfarbeCode(grund) }) }
    werte.push({ merkmal: 'schale_deckfarbe_anteil', wert: anteilCode(anteil) })
    farben.deckfarbeAnteil = anteil
    if (deckRgb && anteil > 0.03) { farben.deckfarbe = hex(deckRgb); werte.push({ merkmal: 'schale_deckfarbe_farbton', wert: deckfarbtonCode(deckRgb) }) }
    const rost = gewichteteFarbe(f1.farben.filter((c) => c.art === 'rost'))
    if (rost) farben.rostfarbe = hex(rost)
  }
  if (f1?.punkte) {
    const d = f1.punkte.jeCm2
    farben.punktefarbe = hex(f1.punkte.farbe)
    if (f1.punkte.hof) {
      farben.punktehof = hex(f1.punkte.hof)
      const { h } = farbton(f1.punkte.hof)
      werte.push({ merkmal: 'schale_lentizellen_art', wert: h > 50 && h < 170 ? 'umhoeft_gruen' : 'umhoeft_rot' })
    }
    werte.push({ merkmal: 'schale_lentizellen_art', wert: farbton(f1.punkte.farbe).v > 0.7 ? 'hell' : 'braun' })
    werte.push({ merkmal: 'schale_lentizellen_anzahl', wert: d < 1 ? '3' : d < 3 ? '5' : '7' })
    hinweise.push(`Schalenpunkte grob gezählt: etwa ${d.toFixed(1)} je cm².`)
  }

  // Fleisch (Foto 2, Längsscheiben)
  if (f2?.farben?.length) {
    const hell = [...f2.farben].sort((x, y) => farbton(y.rgb).v - farbton(x.rgb).v)[0]
    if (hell) { farben.fleischfarbe = hex(hell.rgb); werte.push({ merkmal: 'fleisch_farbe', wert: fleischCode(hell.rgb) }) }
  }

  // Kerne (Foto 3)
  const kerne = f3?.teile.filter((t) => t.art === 'kern') ?? []
  if (kerne.length >= 2 && kerne.length <= 15) {
    werte.push({ merkmal: 'kerne_anzahl', wert: kerne.length })
    hinweise.push(`${kerne.length} Kerne gezählt, Länge im Mittel ${mittel(kerne.map((k) => k.breiteMm)).toFixed(1)} mm.`)
  }

  const fehlend = a.map((x, i) => (!x?.blattGefunden ? i + 1 : 0)).filter(Boolean)
  if (fehlend.length) hinweise.push(`Auf Foto ${fehlend.join(', ')} wurde das Blatt nicht sicher erkannt.`)
  hinweise.push('Kernhaus, Kelch und Stiel werden noch nicht automatisch erfasst.')

  const objekte = laengs.map((t) => ({ breiteMm: t.breiteMm, hoeheMm: t.hoeheMm }))
  return { werte, farben, objekte, hinweise }
}
