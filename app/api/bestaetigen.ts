// Schritt 2 der Anmeldung: Code oder Link-Token prüfen, Konto anlegen oder finden, Sitzung setzen.
// Jeder Versuch wird vor der Prüfung atomar verbucht (höchstens 5 je Anfrage); zusätzlich gelten
// Fehlerbudgets je Adresse (10 pro Tag) und je IP (30 pro Stunde).

import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import { json, fehler, herkunftOk, koerper, clientIp, text } from './_lib/http.js'
import { liesJson, schreibeJson, loesche, aendereAtomar, imLimit, anzahlIm } from './_lib/speicher.js'
import { sitzungCookie, type Konto } from './_lib/sitzung.js'
import type { Anfrage } from './anmelden.js'
import { mitProtokoll, protokolliereEreignis, istTest } from './_lib/protokoll.js'

const MAX_VERSUCHE = 5
const MAX_FEHLER_TAG = 10

function gleich(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
const hash = (t: string) => createHash('sha256').update(t).digest('base64url')

async function post(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  if (!(await imLimit('bestaetigen-ip:' + clientIp(req), 30, 3600_000))) return fehler(429, 'Zu viele Versuche. Bitte später erneut versuchen.')
  const b = await koerper<{ anfrage?: unknown; code?: unknown; token?: unknown }>(req, 1024)
  const anfrage = text(b?.anfrage, 40)
  const code = text(b?.code, 6)
  const token = text(b?.token, 100)
  if (!anfrage || !/^[A-Za-z0-9_-]{20,40}$/.test(anfrage) || (!code && !token)) return fehler(400, 'Anfrage fehlt')
  const pfad = `auth/anfragen/${anfrage}.json`
  const ungueltig = 'Code oder Link ist ungültig oder abgelaufen. Bitte fordere eine neue E-Mail an.'

  // Versuch zuerst verbuchen; nur wenn das gelingt, wird geprüft
  let gesperrt = false
  const a = await aendereAtomar<Anfrage>(pfad, (alt) => {
    if (!alt || alt.ablauf < Date.now() || alt.versuche >= MAX_VERSUCHE) return null
    return { ...alt, versuche: alt.versuche + 1 }
  }).catch(() => null)
  if (!a) {
    await loesche([pfad]).catch(() => {})
    return fehler(400, ungueltig)
  }
  if ((await anzahlIm('fehl:' + a.emailHash, 24 * 3600_000)) >= MAX_FEHLER_TAG) gesperrt = true

  const ok = !gesperrt && (
    (!!code && /^\d{6}$/.test(code) && gleich(hash(code), a.codeHash)) ||
    (!!token && gleich(hash(token), a.tokenHash)))
  if (!ok) {
    await imLimit('fehl:' + a.emailHash, 1000, 24 * 3600_000)
    if (a.versuche >= MAX_VERSUCHE || gesperrt) await loesche([pfad]).catch(() => {})
    return fehler(400, gesperrt ? 'Zu viele falsche Codes. Bitte morgen erneut versuchen.' : a.versuche >= MAX_VERSUCHE ? ungueltig : 'Der Code stimmt nicht.')
  }
  await loesche([pfad])

  // Konto finden oder anlegen
  const indexPfad = `auth/index/${a.emailHash}.json`
  let uid = (await liesJson<{ uid: string }>(indexPfad))?.uid
  let konto = uid ? await liesJson<Konto>(`n/${uid}/konto.json`) : null
  const neu = !konto || !!konto.geloescht
  if (!konto || konto.geloescht) {
    uid = randomBytes(16).toString('hex')
    konto = { uid, email: a.email, erstellt: new Date().toISOString(), version: 1, einwilligungen: [] }
    await schreibeJson(`n/${uid}/konto.json`, konto, false)
    await schreibeJson(indexPfad, { uid })
    await protokolliereEreignis('konto-neu', uid, istTest(req, a.email))
  }
  return json({ ok: true, neu }, 200, { 'set-cookie': sitzungCookie(konto.uid, konto.version) })
}

export const POST = mitProtokoll('bestaetigen', post)
