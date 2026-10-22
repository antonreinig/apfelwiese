// Einwilligungen festhalten: Jede Erteilung und jeder Widerruf wird mit Zeitpunkt und
// Textfassung angehängt (Nachweis nach Art. 7 Abs. 1 DSGVO).

import { json, fehler, herkunftOk, koerper } from './_lib/http.js'
import { angemeldet, type Einwilligung, type Konto } from './_lib/sitzung.js'
import { aendereAtomar } from './_lib/speicher.js'
import { mitProtokoll } from './_lib/protokoll.js'

async function post(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  const b = await koerper<{ zweck?: string; erteilt?: boolean; textVersion?: string }>(req, 512)
  if (!b || (b.zweck !== 'nutzung' && b.zweck !== 'verbesserung') || typeof b.erteilt !== 'boolean' || typeof b.textVersion !== 'string' || !/^[\w.-]{1,20}$/.test(b.textVersion)) {
    return fehler(400, 'Ungültige Angabe')
  }
  const e: Einwilligung = { zweck: b.zweck, erteilt: b.erteilt, zeit: new Date().toISOString(), textVersion: b.textVersion }
  const neu = await aendereAtomar<Konto>(`n/${k.uid}/konto.json`, (alt) =>
    alt && !alt.geloescht ? { ...alt, einwilligungen: [...alt.einwilligungen, e].slice(-200) } : null)
  if (!neu) return fehler(401, 'Sitzung abgelaufen')
  return json({ einwilligungen: neu.einwilligungen })
}

export const POST = mitProtokoll('einwilligung', post)
