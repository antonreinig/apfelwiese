import { json } from './_lib/http.js'
import { angemeldet } from './_lib/sitzung.js'

export async function GET(req: Request) {
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  return json({ uid: k.uid, email: k.email, erstellt: k.erstellt, einwilligungen: k.einwilligungen })
}
