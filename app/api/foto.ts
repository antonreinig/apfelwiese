// Liefert für ein eigenes Foto eine Download-URL, die nach fünf Minuten verfällt.

import { issueSignedToken, presignUrl } from '@vercel/blob'
import { json, fehler } from './_lib/http.js'
import { angemeldet } from './_lib/sitzung.js'
import { FOTO_MUSTER } from './_lib/speicher.js'

export async function GET(req: Request) {
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  const key = new URL(req.url).searchParams.get('k') ?? ''
  if (!FOTO_MUSTER.test(key)) return fehler(400, 'Ungültiger Fotoschlüssel')
  const pathname = `n/${k.uid}/f/${key}`
  const gueltigBis = Date.now() + 5 * 60 * 1000
  const token = await issueSignedToken({ pathname, operations: ['get'], validUntil: gueltigBis })
  const { presignedUrl } = await presignUrl(token, { operation: 'get', pathname, validUntil: gueltigBis, access: 'private' })
  return json({ url: presignedUrl })
}
