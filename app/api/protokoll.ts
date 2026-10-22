// Nimmt Fehlermeldungen der App entgegen (siehe src/ui/protokoll.ts). Geht auch ohne Anmeldung.

import { json, fehler, herkunftOk, koerper, clientIp, text } from './_lib/http.js'
import { angemeldet } from './_lib/sitzung.js'
import { imLimit } from './_lib/speicher.js'
import { protokolliereFehler, mitProtokoll } from './_lib/protokoll.js'

const ARTEN = new Set(['js', 'versprechen', 'darstellung', 'nachladen', 'abgleich', 'upload', 'kamera', 'messung', 'sonstiges'])

async function post(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const b = await koerper<Record<string, unknown>>(req, 8 * 1024)
  const art = text(b?.art, 20)
  const meldung = text(b?.meldung, 500)
  if (!art || !ARTEN.has(art) || !meldung) return fehler(400, 'Ungültige Meldung')
  // höchstens 60 Meldungen pro Stunde und IP, insgesamt 2.000 pro Tag
  if (!(await imLimit('pk:' + clientIp(req), 60, 3600_000))) return json({ ok: false }, 429)
  if (!(await imLimit('pk-alle', 2000, 24 * 3600_000))) return json({ ok: false }, 429)
  const k = await angemeldet(req)
  await protokolliereFehler({
    quelle: 'app', art, meldung,
    ablauf: text(b?.ablauf, 2000),
    zusatz: text(b?.zusatz, 300),
    seite: text(b?.seite, 200),
    version: text(b?.version, 40),
    geraet: text(b?.geraet, 300),
    uid: k instanceof Response ? undefined : k.uid,
  })
  return json({ ok: true })
}

export const POST = mitProtokoll('protokoll', post)
