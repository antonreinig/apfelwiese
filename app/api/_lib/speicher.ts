// Privater Blob-Speicher (Frankfurt). Aufbau:
//   auth/anfragen/<id>.json        laufende Anmeldung (Code, Link), 15 Minuten gültig
//   auth/zaehler/<hash>.json       Zeitpunkte der letzten Anmeldemails je E-Mail bzw. IP
//   auth/index/<hash>.json         E-Mail-Hash → Nutzerkennung
//   n/<uid>/konto.json             Konto: E-Mail, Einwilligungen, Sitzungsversion
//   n/<uid>/baeume/<baumId>.json   Bäume ohne Bilddaten
//   n/<uid>/f/<fotoKey>            Fotos und abgeleitete Bilder

import { createHash } from 'node:crypto'
import { get, put, del, list, BlobPreconditionFailedError } from '@vercel/blob'

export async function liesJson<T>(pfad: string): Promise<T | null> {
  const r = await get(pfad, { access: 'private', useCache: false })
  if (!r || r.statusCode !== 200) return null
  try {
    return JSON.parse(await new Response(r.stream).text()) as T
  } catch {
    return null
  }
}

export async function schreibeJson(pfad: string, daten: unknown, ueberschreiben = true) {
  await put(pfad, JSON.stringify(daten), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: ueberschreiben,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  })
}

/**
 * Liest eine JSON-Datei, ändert sie und schreibt sie nur zurück, wenn sie sich inzwischen nicht
 * geändert hat (ETag). So gehen parallele Anfragen nicht verloren. Gibt den neuen Wert zurück
 * oder null, wenn die Änderung abgelehnt wurde (f liefert null).
 */
export async function aendereAtomar<T>(pfad: string, f: (alt: T | null) => T | null, versuche = 6): Promise<T | null> {
  for (let i = 0; i < versuche; i++) {
    const r = await get(pfad, { access: 'private', useCache: false })
    let alt: T | null = null
    if (r && r.statusCode === 200) {
      try { alt = JSON.parse(await new Response(r.stream).text()) as T } catch { alt = null }
    }
    const neu = f(alt)
    if (neu === null) return null
    try {
      await put(pfad, JSON.stringify(neu), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60,
        ...(r && r.statusCode === 200 ? { allowOverwrite: true, ifMatch: r.blob.etag } : { allowOverwrite: false }),
      })
      return neu
    } catch (e) {
      // Konflikt mit einer parallelen Anfrage: neu lesen und erneut versuchen
      if (e instanceof BlobPreconditionFailedError || /already exists|precondition/i.test(String((e as Error).message))) {
        await new Promise((res) => setTimeout(res, 30 + Math.random() * 120))
        continue
      }
      throw e
    }
  }
  throw new Error('Speicher ist gerade ausgelastet, bitte erneut versuchen.')
}

/** Mengenlimit: true, wenn noch Platz ist (Zeitpunkt wird atomar verbucht) */
export async function imLimit(schluessel: string, max: number, fensterMs: number, abstandMs = 0) {
  const pfad = `auth/zaehler/${geheimHash(schluessel)}.json`
  const jetzt = Date.now()
  const r = await aendereAtomar<number[]>(pfad, (alt) => {
    const zeiten = (alt ?? []).filter((t) => jetzt - t < fensterMs)
    if (zeiten.length >= max) return null
    if (abstandMs && zeiten.length && jetzt - zeiten[zeiten.length - 1] < abstandMs) return null
    return [...zeiten, jetzt]
  })
  return r !== null
}

/** Zählt nur, wie oft etwas im Fenster passiert ist (ohne zu buchen) */
export async function anzahlIm(schluessel: string, fensterMs: number) {
  const jetzt = Date.now()
  return ((await liesJson<number[]>(`auth/zaehler/${geheimHash(schluessel)}.json`)) ?? []).filter((t) => jetzt - t < fensterMs).length
}

export async function loesche(pfade: string[]) {
  for (let i = 0; i < pfade.length; i += 100) await del(pfade.slice(i, i + 100))
}

export async function alleUnter(prefix: string): Promise<string[]> {
  const pfade: string[] = []
  let cursor: string | undefined
  do {
    const r = await list({ prefix, cursor, limit: 1000 })
    pfade.push(...r.blobs.map((b) => b.pathname))
    cursor = r.hasMore ? r.cursor : undefined
  } while (cursor)
  return pfade
}

/** Hash mit geheimem Zusatz (Pfeffer), damit E-Mail- und IP-Adressen nicht aus Dateinamen erraten werden können */
export function geheimHash(text: string) {
  const pfeffer = process.env.AW_PFEFFER
  if (!pfeffer || pfeffer.length < 32) throw new Error('AW_PFEFFER fehlt')
  return createHash('sha256').update(pfeffer).update('|').update(text).digest('base64url')
}

export function geheimnis() {
  const g = process.env.AW_GEHEIMNIS
  if (!g || g.length < 32) throw new Error('AW_GEHEIMNIS fehlt')
  return g
}

/** Erlaubte Bezeichner für Bäume und Fotos (wie sie die App erzeugt) */
export const ID_MUSTER = /^[a-z0-9-]{4,40}$/
export const FOTO_MUSTER = /^foto-[a-z0-9]{6,40}$/
