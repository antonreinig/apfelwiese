// Rückmeldung aus der App per E-Mail an den Betreiber. Geht auch ohne Anmeldung.

import { json, fehler, herkunftOk, koerper, clientIp, text as zeichen, EMAIL_MUSTER } from './_lib/http.js'
import { angemeldet } from './_lib/sitzung.js'
import { imLimit } from './_lib/speicher.js'
import { sendeMail, escape, BETREIBER_MAIL } from './_lib/mail.js'
import { mitProtokoll, protokolliereEreignis, istTest } from './_lib/protokoll.js'

async function post(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const b = await koerper<Record<string, unknown>>(req, 24 * 1024)
  const text = zeichen(b?.text, 5000)?.trim()
  if (!text) return fehler(400, 'Bitte eine Nachricht eingeben (höchstens 5000 Zeichen).')

  // höchstens 10 Rückmeldungen pro Stunde und IP, insgesamt 15 pro Tag
  if (!(await imLimit('rm:' + clientIp(req), 10, 3600_000))) return fehler(429, 'Zu viele Nachrichten. Bitte später erneut versuchen.')
  if (!(await imLimit('rm-alle', 15, 24 * 3600_000))) return fehler(503, 'Heute können keine Rückmeldungen mehr angenommen werden.')

  const k = await angemeldet(req)
  const konto = k instanceof Response ? null : k
  const kontakt = zeichen(b?.kontakt, 254)?.trim()
  const antwortAn = konto?.email ?? (kontakt && EMAIL_MUSTER.test(kontakt) ? kontakt : undefined)
  const kurz = (t: unknown) => (zeichen(t, 2000) ?? '').slice(0, 300)
  const zeilen = [
    `Von: ${antwortAn ?? 'ohne Kontaktangabe'}${konto ? ' (angemeldet)' : ''}`,
    `Seite: ${kurz(b?.seite)}`,
    `App-Stand: ${kurz(b?.version)}`,
    `Gerät: ${kurz(b?.geraet)}`,
    '',
    text,
  ]
  try {
    await sendeMail(
      BETREIBER_MAIL,
      'Apfelwiese: Rückmeldung',
      zeilen.join('\n'),
      `<pre style="font-family:Georgia,serif;white-space:pre-wrap">${escape(zeilen.join('\n'))}</pre>`,
      antwortAn,
    )
  } catch {
    return fehler(502, 'Die Nachricht konnte nicht verschickt werden.')
  }
  await protokolliereEreignis('rueckmeldung', konto?.uid, istTest(req, konto?.email))
  return json({ ok: true })
}

export const POST = mitProtokoll('rueckmeldung', post)
