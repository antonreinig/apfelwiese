// Schritt 1 der Anmeldung: E-Mail mit sechsstelligem Code und Anmeldelink verschicken.
// Code und Link gelten 15 Minuten. Die Antwort ist für bekannte und neue Adressen gleich.

import { randomBytes, randomInt, createHash } from 'node:crypto'
import { json, fehler, herkunftOk, koerper, clientIp, text, EMAIL_MUSTER, APP_URL } from './_lib/http.js'
import { schreibeJson, geheimHash, imLimit } from './_lib/speicher.js'
import { sendeMail, escape } from './_lib/mail.js'
import { mitProtokoll } from './_lib/protokoll.js'

export interface Anfrage {
  emailHash: string
  email: string
  codeHash: string
  tokenHash: string
  ablauf: number
  versuche: number
}

const GUELTIG_MS = 15 * 60 * 1000

const STUNDE = 3600_000
const TAG = 24 * STUNDE

async function post(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const b = await koerper<{ email?: unknown }>(req, 1024)
  const email = text(b?.email, 254)?.trim().toLowerCase()
  if (!email || !EMAIL_MUSTER.test(email)) return fehler(400, 'Bitte eine gültige E-Mail-Adresse eingeben.')

  // Limits: je IP 20/Stunde, je Adresse 5/Stunde mit 50 s Abstand und 10/Tag, insgesamt 80 Mails/Tag (Resend-Gratistarif: 100 am Tag)
  const zuViel = fehler(429, 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.')
  if (!(await imLimit('ip:' + clientIp(req), 20, STUNDE))) return zuViel
  if (!(await imLimit('mail:' + email, 5, STUNDE, 50_000))) return zuViel
  if (!(await imLimit('mailtag:' + email, 10, TAG))) return zuViel
  if (!(await imLimit('alle-mails', 80, TAG))) return fehler(503, 'Heute sind keine Anmeldungen mehr möglich. Bitte morgen erneut versuchen.')

  const id = randomBytes(18).toString('base64url')
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const token = randomBytes(32).toString('base64url')
  const anfrage: Anfrage = {
    emailHash: geheimHash('mail:' + email),
    email,
    codeHash: createHash('sha256').update(code).digest('base64url'),
    tokenHash: createHash('sha256').update(token).digest('base64url'),
    ablauf: Date.now() + GUELTIG_MS,
    versuche: 0,
  }
  await schreibeJson(`auth/anfragen/${id}.json`, anfrage, false)

  const link = `${APP_URL}/#/anmelden?a=${id}&t=${token}`
  const inhalt = `Dein Anmeldecode für die Apfelwiese: ${code}\n\nOder öffne diesen Link: ${link}\n\nCode und Link gelten 15 Minuten. Wenn du dich nicht anmelden wolltest, kannst du diese E-Mail ignorieren.`
  const html = `<div style="font-family:Georgia,serif;font-size:17px;color:#2a2119;line-height:1.5">
<p>Dein Anmeldecode für die Apfelwiese:</p>
<p style="font-size:32px;letter-spacing:6px;margin:8px 0 16px"><b>${code}</b></p>
<p>Gib den Code in der App ein. Am Computer kannst du auch diesen Link öffnen:<br><a href="${escape(link)}">In der Apfelwiese anmelden</a></p>
<p style="color:#5b4d3e;font-size:14px">Code und Link gelten 15 Minuten. Wenn du dich nicht anmelden wolltest, kannst du diese E-Mail ignorieren.</p></div>`
  try {
    await sendeMail(email, 'Apfelwiese: Dein Anmeldecode', inhalt, html)
  } catch {
    return fehler(502, 'Die E-Mail konnte nicht verschickt werden. Bitte später erneut versuchen.')
  }
  return json({ anfrage: id })
}

export const POST = mitProtokoll('anmelden', post)
