import { json } from './_lib/http.js'
import { angemeldet, istBetreiber } from './_lib/sitzung.js'
import { mitProtokoll } from './_lib/protokoll.js'

async function get(req: Request) {
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  return json({ uid: k.uid, email: k.email, erstellt: k.erstellt, einwilligungen: k.einwilligungen, betreiber: istBetreiber(k) })
}

export const GET = mitProtokoll('ich', get)
