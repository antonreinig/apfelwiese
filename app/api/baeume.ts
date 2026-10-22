// Bäume des angemeldeten Nutzers: auflisten, speichern, löschen. Fotos liegen getrennt
// unter n/<uid>/f/ und werden beim Löschen eines Baums mit entfernt.

import { json, fehler, herkunftOk, koerper } from './_lib/http.js'
import { angemeldet, nutzungAkzeptiert } from './_lib/sitzung.js'
import { liesJson, schreibeJson, loesche, alleUnter, ID_MUSTER } from './_lib/speicher.js'
import { list } from '@vercel/blob'

const MAX_BAEUME = 500

interface BaumDaten {
  id: string
  geaendert: string
  fotosaetze?: { fotos?: (string | null)[]; vorschau?: (string | null)[]; blatt?: (string | null)[] }[]
  [k: string]: unknown
}

const LOKALER_FOTOKEY = /^foto:[a-z0-9]{6,40}$/

function fotoKeys(b: BaumDaten): string[] {
  const k: string[] = []
  for (const s of b.fotosaetze ?? []) for (const x of [...(s.fotos ?? []), ...(s.vorschau ?? []), ...(s.blatt ?? [])]) if (x) k.push(x)
  return k
}

/** Aufbau prüfen, bevor Fotoschlüssel ausgelesen werden */
function gueltig(b: unknown, id: string): b is BaumDaten {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return false
  const x = b as BaumDaten
  if (x.id !== id || typeof x.geaendert !== 'string' || x.geaendert.length > 40) return false
  if (x.fotosaetze === undefined) return true
  if (!Array.isArray(x.fotosaetze) || x.fotosaetze.length > 50) return false
  const liste = (l: unknown) => l === undefined || (Array.isArray(l) && l.length <= 8 && l.every((k) => k === null || (typeof k === 'string' && LOKALER_FOTOKEY.test(k))))
  return x.fotosaetze.every((s) => !!s && typeof s === 'object' && !Array.isArray(s) && liste(s.fotos) && liste(s.vorschau) && liste(s.blatt))
}

const serverPfad = (uid: string, key: string) => `n/${uid}/f/${key.replace(':', '-')}`

export async function GET(req: Request) {
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  const pfade = await alleUnter(`n/${k.uid}/baeume/`)
  const baeume: BaumDaten[] = []
  for (let i = 0; i < pfade.length; i += 8) {
    const teil = await Promise.all(pfade.slice(i, i + 8).map((p) => liesJson<BaumDaten>(p)))
    for (const b of teil) if (b) baeume.push(b)
  }
  return json({ baeume })
}

export async function PUT(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  if (!nutzungAkzeptiert(k)) return fehler(403, 'Bitte zuerst den Nutzungsbedingungen zustimmen.')
  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!ID_MUSTER.test(id)) return fehler(400, 'Ungültige Baumkennung')
  const b = await koerper<unknown>(req, 1024 * 1024)
  if (!gueltig(b, id)) return fehler(400, 'Ungültige Baumdaten')
  const pfad = `n/${k.uid}/baeume/${id}.json`
  const alt = await liesJson<BaumDaten>(pfad)
  if (!alt) {
    const vorhanden = await list({ prefix: `n/${k.uid}/baeume/`, limit: MAX_BAEUME })
    if (vorhanden.blobs.length >= MAX_BAEUME) return fehler(403, `Höchstens ${MAX_BAEUME} Bäume je Konto.`)
  }
  await schreibeJson(pfad, b)
  // Fotos, auf die der Baum nicht mehr verweist (ersetzt oder neu ausgewertet), auch auf dem Server löschen
  if (alt) {
    const neu = new Set(fotoKeys(b))
    const weg = fotoKeys(alt).filter((x) => LOKALER_FOTOKEY.test(x) && !neu.has(x)).map((x) => serverPfad(k.uid, x))
    if (weg.length) await loesche(weg)
  }
  return json({ ok: true })
}

export async function DELETE(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!ID_MUSTER.test(id)) return fehler(400, 'Ungültige Baumkennung')
  const pfad = `n/${k.uid}/baeume/${id}.json`
  const b = await liesJson<BaumDaten>(pfad)
  if (b) {
    const fotos = fotoKeys(b).filter((x) => LOKALER_FOTOKEY.test(x)).map((x) => serverPfad(k.uid, x))
    await loesche([pfad, ...fotos])
  }
  return json({ ok: true })
}
