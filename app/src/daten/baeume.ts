// Eigene Bäume, lokal im Browser (IndexedDB). Fotos als Blobs unter eigenem Schlüssel.

import { get, set, del } from 'idb-keyval'
import { useSyncExternalStore } from 'react'
import type { Wert, Messfarben } from '../apfel3d/darstellung.ts'

export type Vertrauen = 'unbestimmt' | 'vorschlag' | 'nutzer' | 'pomologe' | 'dna'

export const VERTRAUEN: Record<Vertrauen, { label: string; tinte: boolean; siegel?: string }> = {
  unbestimmt: { label: 'noch unbestimmt', tinte: false },
  vorschlag: { label: 'App-Vorschlag', tinte: false },
  nutzer: { label: 'von dir bestimmt', tinte: true },
  pomologe: { label: 'pomologisch bestätigt', tinte: true, siegel: 'P' },
  dna: { label: 'per DNA bestätigt', tinte: true, siegel: 'DNA' },
}

export interface Bestimmung {
  status: Vertrauen
  sorteId?: string
  sorteName?: string
  von?: string
  datum?: string
  anmerkung?: string
}

export interface Fotomessung {
  /** Merkmalswerte, per Code aus den Fotos gemessen (Katalog-IDs) */
  werte: Wert[]
  farben: Messfarben
  /** Einzelmaße je Apfelhälfte in mm */
  objekte: { breiteMm: number; hoeheMm: number }[]
  hinweise: string[]
}

export interface Fotosatz {
  id: string
  datum: string
  /** Schlüssel der vier Fotos in der Datenbank (null = fehlt) */
  fotos: (string | null)[]
  /** Freigestellte Vorschau je Foto (Schlüssel) */
  vorschau?: (string | null)[]
  /** Entzerrtes, weißabgeglichenes A4-Blatt je Foto, Hochformat (Schlüssel) */
  blatt?: (string | null)[]
  /** Je Foto die Ausschnitte der einzelnen Apfelstücke und der Kernreihe im Blattbild (Anteile 0..1) */
  ausschnitte?: ({ x: number; y: number; w: number; h: number; art: 'frucht' | 'kerne' }[] | null)[]
  /** Von Hand angeglichene Modellparameter (Modell angleichen) */
  modell?: Record<string, unknown>
  messung?: Fotomessung
}

export interface Baum {
  id: string
  name: string
  erstellt: string
  geaendert: string
  standort?: { lat: number; lng: number; genauigkeit?: number }
  ort?: string
  notizen?: string
  bestimmung: Bestimmung
  fotosaetze: Fotosatz[]
  /** Angaben des Nutzers (Geschmack, Reife …) mit Katalog-IDs */
  angaben: Wert[]
  beispiel?: boolean
}

// ------------------------------------------------------------------ Speicher mit React-Anbindung

/** Anbindung an den Server (serverabgleich.ts), ohne zyklischen Import */
interface ServerHaken {
  gespeichert: (b: Baum) => void
  geloescht: (id: string) => void
  fotoHolen: (k: string) => Promise<Blob | undefined>
}
let server: ServerHaken | null = null
export function setzeServerHaken(h: ServerHaken) { server = h }

let baeume: Baum[] = []
let geladen = false
const hoerer = new Set<() => void>()
const melden = () => hoerer.forEach((h) => h())

async function laden() {
  const gespeichert = await get<Baum[]>('baeume')
  if (gespeichert) baeume = gespeichert
  else {
    baeume = [await beispielbaum()]
    await set('baeume', baeume)
  }
  geladen = true
  melden()
  nachholen()
}

/**
 * Holt für ältere Fotosätze im Hintergrund nach, was neuere Versionen speichern: entzerrtes Blattbild,
 * Freistellung und Ausschnitte der einzelnen Äpfel. Die Messung wird nur beim Beispielbaum erneuert;
 * bei eigenen Bäumen bleiben Messwerte und Angleichungen unverändert.
 */
async function nachholen() {
  for (const b of [...baeume]) {
    for (const satz of b.fotosaetze) {
      if (satz.ausschnitte || satz.fotos.filter(Boolean).length === 0) continue
      await satzAufbereiten(b.id, satz.id, !!b.beispiel)
    }
  }
}

async function satzAufbereiten(baumId: string, satzId: string, messungNeu: boolean) {
  const b = baeume.find((x) => x.id === baumId)
  const satz = b?.fotosaetze.find((x) => x.id === satzId)
  if (!b || !satz) return
  try {
    const { werteAus, messungAusFotos, ausschnitteAus } = await import('../kamera/auswerten.ts')
    const auswertungen = []
    const vorschau: (string | null)[] = []
    const blatt: (string | null)[] = []
    const ausschnitte: Fotosatz['ausschnitte'] = []
    for (const k of satz.fotos) {
      const blob = k ? await ladeFoto(k) : undefined
      if (!blob) { auswertungen.push(null); vorschau.push(null); blatt.push(null); ausschnitte.push(null); continue }
      const r = await werteAus(blob)
      auswertungen.push(r.auswertung)
      vorschau.push(r.vorschau ? await speichereFoto(r.vorschau) : null)
      blatt.push(r.blatt ? await speichereFoto(r.blatt) : null)
      ausschnitte.push(ausschnitteAus(r.auswertung))
    }
    const aktuell = baeume.find((x) => x.id === baumId)
    if (!aktuell) return
    for (const k of [...(satz.vorschau ?? []), ...(satz.blatt ?? [])]) if (k) await del(k)
    const messung = messungNeu ? messungAusFotos(auswertungen) : undefined
    await speichereBaum({
      ...aktuell,
      fotosaetze: aktuell.fotosaetze.map((x) => (x.id === satzId ? { ...x, vorschau, blatt, ausschnitte, ...(messung ? { messung } : {}) } : x)),
    })
  } catch {
    // Auswertung nicht möglich (z. B. alter Browser): bleibt beim bisherigen Stand
  }
}
const ladeVersprechen = typeof window !== 'undefined' ? laden() : Promise.resolve()

export function useBaeume(): { baeume: Baum[]; geladen: boolean } {
  const liste = useSyncExternalStore(
    (h) => { hoerer.add(h); return () => hoerer.delete(h) },
    () => baeume,
  )
  return { baeume: liste, geladen }
}

export async function speichereBaum(b: Baum) {
  await ladeVersprechen
  b.geaendert = new Date().toISOString()
  const i = baeume.findIndex((x) => x.id === b.id)
  baeume = i >= 0 ? baeume.map((x) => (x.id === b.id ? b : x)) : [b, ...baeume]
  await set('baeume', baeume)
  melden()
  server?.gespeichert(b)
}

/** Ersetzt die ganze Liste (Abgleich mit dem Server), ohne Änderungszeit zu setzen */
export async function ersetzeBaeume(neu: Baum[]) {
  await ladeVersprechen
  baeume = neu
  await set('baeume', baeume)
  melden()
}

export function alleBaeume() { return baeume }
export { ladeVersprechen as baeumeGeladen }

/** Ändert einen Baum auf dem aktuellen Stand (nicht auf einer veralteten Kopie aus dem Render) */
export async function aktualisiereBaum(id: string, f: (b: Baum) => Baum) {
  await ladeVersprechen
  const aktuell = baeume.find((x) => x.id === id)
  if (!aktuell) return
  await speichereBaum(f(aktuell))
}

export async function loescheBaum(id: string) {
  const b = baeume.find((x) => x.id === id)
  if (b) for (const s of b.fotosaetze) for (const k of [...s.fotos, ...(s.vorschau ?? []), ...(s.blatt ?? [])]) if (k) await del(k)
  baeume = baeume.filter((x) => x.id !== id)
  await set('baeume', baeume)
  melden()
  server?.geloescht(id)
}

export async function speichereFoto(blob: Blob): Promise<string> {
  const k = `foto:${neueId()}`
  await set(k, blob)
  return k
}

export async function loescheFoto(k: string) {
  await del(k)
}

export async function ladeFoto(k: string): Promise<Blob | undefined> {
  const lokal = await get<Blob>(k)
  if (lokal || !server) return lokal
  // auf einem anderen Gerät aufgenommen: vom Server holen und hier ablegen
  const b = await server.fotoHolen(k).catch(() => undefined)
  if (b) await set(k, b).catch(() => {})
  return b
}

/** Foto nur aus dem Gerätespeicher (für das Hochladen) */
export async function ladeFotoLokal(k: string): Promise<Blob | undefined> {
  return get<Blob>(k)
}

export function neueId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** Neuester Baum zuerst (zuletzt bearbeitet) */
export function sortiert(liste: Baum[]) {
  return [...liste].sort((a, b) => b.geaendert.localeCompare(a.geaendert))
}

export function letzterFotosatz(b: Baum): Fotosatz | undefined {
  return [...b.fotosaetze].sort((x, y) => y.datum.localeCompare(x.datum))[0]
}

// ------------------------------------------------------------------ Beispielbaum

/**
 * Beispiel aus den Testfotos vom 21.10.2026 (docs/beispielbilder). Die Messwerte stammen aus
 * dem Test im Projektstand (Größe 53–61 mm, keine Deckfarbe, braune, grün umhöfte Punkte,
 * zwiebelförmiges Kernhaus, offene Kernfächer). Sorte nur vermutet.
 */
async function beispielbaum(): Promise<Baum> {
  const jetzt = new Date().toISOString()
  // Fotos nach Position (Foto 1–4); fehlt eines, bleibt der Platz leer
  const fotos: (string | null)[] = []
  const namen = ['foto1_laengshaelften_schale', 'foto2_laengsscheiben_kernhaus', 'foto3_querhaelften_kelch_stiel_kerne', 'foto4_querscheiben_kernhausstern']
  for (const n of namen) {
    try {
      const r = await fetch(`/beispiel/${n}.jpg`)
      fotos.push(r.ok ? await speichereFoto(await r.blob()) : null)
    } catch {
      fotos.push(null) // ohne Netz
    }
  }
  return {
    id: 'beispiel',
    name: 'Beispielbaum',
    erstellt: '2026-10-21T12:00:00.000Z',
    geaendert: jetzt,
    ort: 'Testfotos vom 21.10.2026',
    beispiel: true,
    bestimmung: {
      status: 'vorschlag',
      sorteId: 'ananasrenette',
      sorteName: 'Ananasrenette',
      datum: '2026-10-21',
      anmerkung: 'Plausibler Kandidat nach Vergleich mit einer Sortenbeschreibung. Nicht bestätigt.',
    },
    fotosaetze: [
      {
        id: 'beispiel-1',
        datum: '2026-10-21',
        fotos,
        messung: {
          werte: [
            { merkmal: 'frucht_breite', wert: 58 },
            { merkmal: 'schale_grundfarbe', wert: 'gruengelb' },
            { merkmal: 'schale_deckfarbe_anteil', wert: '0' },
            { merkmal: 'schale_lentizellen_anzahl', wert: '7' },
            { merkmal: 'schale_lentizellen_art', wert: 'braun' },
            { merkmal: 'schale_lentizellen_art', wert: 'umhoeft_gruen' },
            { merkmal: 'kernhaus_form', wert: 'zwiebel' },
            { merkmal: 'kernfaecher_oeffnung', wert: 'offen' },
          ],
          farben: {},
          objekte: [],
          hinweise: ['Werte aus dem Test vom 21.10.2026 übernommen, nicht neu gemessen.'],
        },
      },
    ],
    angaben: [],
  }
}
