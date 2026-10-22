// Für den Anmeldelink auf einem fremden Gerät: zeigt, für welche (gekürzte) Adresse der Link gilt,
// damit niemand unbemerkt in ein fremdes Konto angemeldet wird. Die Kennung kennt nur, wer die Mail hat.

import { json, fehler } from './_lib/http.js'
import { liesJson } from './_lib/speicher.js'
import type { Anfrage } from './anmelden.js'
import { mitProtokoll } from './_lib/protokoll.js'

function kuerzen(email: string) {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}`
}

async function get(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(id)) return fehler(400, 'Anfrage fehlt')
  const a = await liesJson<Anfrage>(`auth/anfragen/${id}.json`)
  if (!a || a.ablauf < Date.now()) return fehler(404, 'Der Link ist abgelaufen. Bitte fordere eine neue E-Mail an.')
  return json({ email: kuerzen(a.email) })
}

export const GET = mitProtokoll('anfrage', get)
