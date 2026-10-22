// Fotos gehen direkt vom Browser in den privaten Blob-Speicher (vorbei an der 4,5-MB-Grenze
// der Functions). Diese Route stellt dafür eine kurzlebige, auf genau einen Pfad im Bereich
// des Nutzers beschränkte Upload-URL aus.

import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client'
import { issueSignedToken } from '@vercel/blob'
import { json, fehler, herkunftOk, koerper } from './_lib/http.js'
import { angemeldet, nutzungAkzeptiert } from './_lib/sitzung.js'
import { FOTO_MUSTER, imLimit } from './_lib/speicher.js'

const MAX_BYTES = 30 * 1024 * 1024
const TYPEN = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(req: Request) {
  if (!herkunftOk(req)) return fehler(403, 'Herkunft nicht erlaubt')
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  if (!nutzungAkzeptiert(k)) return fehler(403, 'Bitte zuerst den Nutzungsbedingungen zustimmen.')
  const body = await koerper<HandleUploadPresignedBody>(req, 8 * 1024)
  if (!body || body.type !== 'blob.generate-presigned-url') return fehler(400, 'Ungültige Anfrage')
  // höchstens 400 Uploads pro Konto und Tag (ein Baum hat bis zu 12 Bilder)
  if (!(await imLimit('upload:' + k.uid, 400, 24 * 3600_000))) return fehler(429, 'Heute sind keine weiteren Uploads möglich.')
  try {
    const r = await handleUploadPresigned({
      body,
      request: req,
      // Abschlussmeldungen nutzen wir nicht (oben abgewiesen); das SDK verlangt trotzdem einen Schlüssel
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY ?? 'nicht-genutzt',
      getSignedToken: async (pfad) => {
        const teile = pfad.split('/')
        if (teile.length !== 4 || teile[0] !== 'n' || teile[1] !== k.uid || teile[2] !== 'f' || !FOTO_MUSTER.test(teile[3])) {
          throw new Error('Pfad nicht erlaubt')
        }
        const gueltigBis = Date.now() + 10 * 60 * 1000
        const token = await issueSignedToken({ pathname: pfad, operations: ['put'], validUntil: gueltigBis, allowedContentTypes: TYPEN, maximumSizeInBytes: MAX_BYTES })
        return { token, urlOptions: { validUntil: gueltigBis, allowedContentTypes: TYPEN, maximumSizeInBytes: MAX_BYTES, allowOverwrite: true, addRandomSuffix: false } }
      },
    })
    return json(r)
  } catch {
    return fehler(400, 'Upload nicht erlaubt')
  }
}
