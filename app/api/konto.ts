// Konto löschen: alle Bäume, Fotos, Einwilligungen und der E-Mail-Index werden entfernt.

import { json, fehler, herkunftOk } from './_lib/http.js'
import { angemeldet, abmeldeCookie, type Konto } from './_lib/sitzung.js'
import { alleUnter, loesche, geheimHash, aendereAtomar, schreibeJson } from './_lib/speicher.js'
import { mitProtokoll, protokolliereEreignis } from './_lib/protokoll.js'

async function loeschen(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  // zuerst sperren: Sitzungen und laufende Uploads/Änderungen werden ab jetzt abgewiesen
  await aendereAtomar<Konto>(`n/${k.uid}/konto.json`, (alt) => (alt ? { ...alt, geloescht: true, version: alt.version + 1 } : null))
  await loesche([`auth/index/${geheimHash('mail:' + k.email)}.json`])
  const pfade = (await alleUnter(`n/${k.uid}/`)).filter((p) => p !== `n/${k.uid}/konto.json`)
  await loesche(pfade)
  // Uploads mit bereits ausgegebenen URLs (höchstens 10 Minuten gültig) räumt der Cron-Job ab;
  // konto.json bleibt bis dahin als Sperrvermerk ohne Inhalt bestehen
  await schreibeJson(`auth/geloescht/${k.uid}.json`, { zeit: Date.now() })
  await protokolliereEreignis('konto-geloescht', k.uid)
  await aendereAtomar<Konto>(`n/${k.uid}/konto.json`, (alt) => (alt ? { uid: alt.uid, email: '', erstellt: alt.erstellt, version: alt.version, einwilligungen: [], geloescht: true } : null))
  return json({ ok: true }, 200, { 'set-cookie': abmeldeCookie() })
}

export const DELETE = mitProtokoll('konto', loeschen)
