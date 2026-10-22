// Konto und Anmeldung (E-Mail mit Code oder Link). Die Sitzung liegt in einem HttpOnly-Cookie,
// das nur der Server lesen kann; hier wird nur der Anmeldestatus gehalten.

import { useSyncExternalStore } from 'react'
import { gehe } from '../ui/router.ts'

export interface Einwilligung { zweck: 'nutzung' | 'verbesserung'; erteilt: boolean; zeit: string; textVersion: string }
export interface KontoDaten { uid: string; email: string; erstellt: string; einwilligungen: Einwilligung[]; betreiber?: boolean }

/** Fassung der Texte, denen zugestimmt wird; bei inhaltlicher Änderung erhöhen */
export const TEXT_VERSION = '2026-10-22'

type Zustand = { status: 'laedt' } | { status: 'abgemeldet' } | { status: 'offline' } | { status: 'angemeldet'; konto: KontoDaten }

let zustand: Zustand = { status: 'laedt' }
const hoerer = new Set<() => void>()
function setze(z: Zustand) { zustand = z; hoerer.forEach((h) => h()) }

export function useKonto(): Zustand {
  return useSyncExternalStore((h) => { hoerer.add(h); return () => hoerer.delete(h) }, () => zustand)
}
export function kontoJetzt() { return zustand }

async function api<T>(pfad: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(pfad, { ...init, credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(init.headers ?? {}) } })
  // ohne Server (z. B. Entwicklungsserver) kommt statt JSON die App-Seite zurück
  if (!(r.headers.get('content-type') ?? '').includes('application/json')) throw Object.assign(new Error('Server nicht erreichbar'), { status: 503 })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) {
    // eigene Meldung der API, sonst Firewall (Mengenbegrenzung) oder Serverfehler
    const meldung = (d as { fehler?: string }).fehler
      ?? (r.status === 403 || r.status === 429 ? 'Zu viele Anfragen in kurzer Zeit. Bitte in einigen Minuten erneut versuchen.' : `Fehler ${r.status}`)
    throw Object.assign(new Error(meldung), { status: r.status })
  }
  return d as T
}
export { api as kontoApi }

// Letzter bekannter Kontostand, damit die App ohne Netz weiter mit den eigenen Bäumen arbeitet
const ZULETZT = 'konto-zuletzt'
function merke(k: KontoDaten | null) {
  try { if (k) localStorage.setItem(ZULETZT, JSON.stringify(k)); else localStorage.removeItem(ZULETZT) } catch { /* privat */ }
}
function zuletzt(): KontoDaten | null {
  try {
    const k = JSON.parse(localStorage.getItem(ZULETZT) ?? 'null')
    return k && typeof k.uid === 'string' && Array.isArray(k.einwilligungen) ? k : null
  } catch { return null }
}

// Aufräumen, wenn die Sitzung serverseitig beendet wurde (serverabgleich.ts meldet sich hier an)
let beiAbmeldung: (() => Promise<void>) | null = null
export function setzeAbmeldeHaken(f: () => Promise<void>) { beiAbmeldung = f }

export async function kontoLaden() {
  try {
    const konto = await api<KontoDaten>('/api/ich')
    if (typeof konto.uid !== 'string' || !Array.isArray(konto.einwilligungen)) throw Object.assign(new Error('Ungültige Antwort'), { status: 503 })
    merke(konto)
    setze({ status: 'angemeldet', konto })
  } catch (e) {
    if ((e as { status?: number }).status === 401) {
      merke(null)
      setze({ status: 'abgemeldet' })
      await beiAbmeldung?.().catch(() => {})
      return
    }
    const k = zuletzt()
    setze(k ? { status: 'angemeldet', konto: k } : { status: 'offline' })
  }
}

export async function codeAnfordern(email: string): Promise<string> {
  const id = (await api<{ anfrage: string }>('/api/anmelden', { method: 'POST', body: JSON.stringify({ email }) })).anfrage
  try { localStorage.setItem('aw-anfrage', id) } catch { /* privat */ }
  return id
}

/** Wurde diese Anmeldung auf diesem Gerät angefordert? */
export function eigeneAnfrage(id: string) {
  try { return localStorage.getItem('aw-anfrage') === id } catch { return false }
}

export async function bestaetigen(anfrage: string, nachweis: { code: string } | { token: string }) {
  await api('/api/bestaetigen', { method: 'POST', body: JSON.stringify({ anfrage, ...nachweis }) })
  await kontoLaden()
}

export async function abmelden(ueberall = false) {
  await api('/api/abmelden', { method: 'POST', body: JSON.stringify({ ueberall }) }).catch(() => {})
  merke(null)
  setze({ status: 'abgemeldet' })
}

export async function kontoLoeschen() {
  await api('/api/konto', { method: 'DELETE' })
  merke(null)
  setze({ status: 'abgemeldet' })
}

export async function einwilligen(zweck: Einwilligung['zweck'], erteilt: boolean) {
  const d = await api<{ einwilligungen: Einwilligung[] }>('/api/einwilligung', { method: 'POST', body: JSON.stringify({ zweck, erteilt, textVersion: TEXT_VERSION }) })
  if (zustand.status === 'angemeldet') {
    const konto = { ...zustand.konto, einwilligungen: d.einwilligungen }
    merke(konto)
    setze({ status: 'angemeldet', konto })
  }
}

export function aktuelleEinwilligung(k: KontoDaten, zweck: Einwilligung['zweck']) {
  return [...k.einwilligungen].reverse().find((e) => e.zweck === zweck)
}

/** Angemeldet und den Nutzungsbedingungen zugestimmt */
export function bereit(z: Zustand) {
  return z.status === 'angemeldet' && !!aktuelleEinwilligung(z.konto, 'nutzung')?.erteilt
}

const ZIEL = 'nach-anmeldung'

/** Zur Anmeldung und danach zurück an die gemerkte Stelle */
export function zurAnmeldung(ziel: string) {
  try { sessionStorage.setItem(ZIEL, ziel) } catch { /* privat */ }
  gehe('/anmelden')
}

export function zielNachAnmeldung() {
  let ziel = '/'
  try { ziel = sessionStorage.getItem(ZIEL) || '/'; sessionStorage.removeItem(ZIEL) } catch { /* privat */ }
  return ziel
}

if (typeof window !== 'undefined') kontoLaden()
