// Anmeldesitzung als signiertes Cookie (HMAC-SHA256). Das Cookie ist HttpOnly, Secure und
// SameSite=Lax; Skripte der Seite können es nicht lesen. Mit der Sitzungsversion im Konto
// lassen sich alle Sitzungen eines Nutzers beenden.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { geheimnis, liesJson } from './speicher.js'
import { fehler } from './http.js'

export const COOKIE = 'aw_sitzung'
const DAUER_S = 60 * 60 * 24 * 90 // 90 Tage

export interface Einwilligung {
  zweck: 'nutzung' | 'verbesserung'
  erteilt: boolean
  zeit: string
  textVersion: string
}

export interface Konto {
  uid: string
  email: string
  erstellt: string
  version: number
  einwilligungen: Einwilligung[]
  /** gesetzt, während ein Konto gelöscht wird */
  geloescht?: boolean
}

interface Inhalt { uid: string; v: number; exp: number }

function signatur(daten: string) {
  return createHmac('sha256', geheimnis()).update(daten).digest('base64url')
}

export function sitzungCookie(uid: string, version: number) {
  const inhalt: Inhalt = { uid, v: version, exp: Math.floor(Date.now() / 1000) + DAUER_S }
  const daten = Buffer.from(JSON.stringify(inhalt)).toString('base64url')
  return `${COOKIE}=${daten}.${signatur(daten)}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAUER_S}`
}

export function abmeldeCookie() {
  return `${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

function lies(req: Request): Inhalt | null {
  const roh = req.headers.get('cookie') ?? ''
  const wert = roh.split(/;\s*/).find((c) => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1)
  if (!wert) return null
  const [daten, sig] = wert.split('.')
  if (!daten || !sig) return null
  const a = Buffer.from(sig), b = Buffer.from(signatur(daten))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const i = JSON.parse(Buffer.from(daten, 'base64url').toString()) as Inhalt
    if (typeof i.uid !== 'string' || typeof i.v !== 'number' || i.exp < Date.now() / 1000) return null
    return i
  } catch {
    return null
  }
}

/** Liefert das Konto des angemeldeten Nutzers oder eine 401-Antwort */
export async function angemeldet(req: Request): Promise<Konto | Response> {
  const s = lies(req)
  if (!s || !/^[a-z0-9]{20,40}$/.test(s.uid)) return fehler(401, 'Nicht angemeldet')
  const konto = await liesJson<Konto>(`n/${s.uid}/konto.json`)
  if (!konto || konto.geloescht || konto.version !== s.v) return fehler(401, 'Sitzung abgelaufen')
  return konto
}

/** Hat der Nutzer der Speicherung seiner Daten zugestimmt (Nutzungsbedingungen)? */
export function nutzungAkzeptiert(k: Konto) {
  const letzte = [...k.einwilligungen].reverse().find((e) => e.zweck === 'nutzung')
  return !!letzte?.erteilt
}

/** Betreiber der App (E-Mails in BETREIBER_EMAILS, kommagetrennt): sieht die Betriebsübersicht */
export function istBetreiber(k: Konto) {
  const liste = (process.env.BETREIBER_EMAILS ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
  return !!k.email && liste.includes(k.email.toLowerCase())
}
