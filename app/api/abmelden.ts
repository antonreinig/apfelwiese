// Abmelden auf diesem Gerät; mit {"ueberall": true} werden alle Sitzungen ungültig.

import { json, fehler, herkunftOk, koerper } from './_lib/http.js'
import { angemeldet, abmeldeCookie, type Konto } from './_lib/sitzung.js'
import { aendereAtomar } from './_lib/speicher.js'
import { mitProtokoll } from './_lib/protokoll.js'

async function post(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const b = await koerper<{ ueberall?: boolean }>(req, 256)
  if (b?.ueberall) {
    const k = await angemeldet(req)
    if (!(k instanceof Response)) await aendereAtomar<Konto>(`n/${k.uid}/konto.json`, (alt) => (alt ? { ...alt, version: alt.version + 1 } : null))
  }
  return json({ ok: true }, 200, { 'set-cookie': abmeldeCookie() })
}

export const POST = mitProtokoll('abmelden', post)
