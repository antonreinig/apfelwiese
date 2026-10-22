// Proxy für Luftbildkacheln (Esri) und Sortenbilder (Wikimedia Commons). Anders als eine
// Vercel-Weiterleitung schickt er keine Daten der Nutzer (IP-Adresse, Browserkennung) weiter.
// Antworten werden im Vercel-CDN zwischengespeichert.

import { fehler } from './_lib/http.js'

const KENNUNG = 'Apfelwiese/1.0 (+https://apfelwiese.app/#/impressum)'
const WM_PFAD = /^wikipedia\/(commons|en|de)\/(thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/[^/?#]+(\/[^/?#]+)?$/
const WM_ENDUNG = /\.(jpe?g|png|webp|gif|tiff?)$/i

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  let ziel: string
  let dauer: number
  if (q.get('art') === 'luftbild') {
    const z = q.get('z') ?? '', y = q.get('y') ?? '', x = q.get('x') ?? ''
    if (!/^\d{1,2}$/.test(z) || !/^\d{1,7}$/.test(y) || !/^\d{1,7}$/.test(x) || +z > 23) return fehler(400, 'Ungültige Kachel')
    const key = process.env.ARCGIS_KEY
    if (!key) return fehler(503, 'Luftbild nicht eingerichtet')
    ziel = `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}?token=${encodeURIComponent(key)}`
    dauer = 24 * 3600
  } else if (q.get('art') === 'wm') {
    const p = q.get('p') ?? ''
    if (p.length > 400 || !WM_PFAD.test(p) || !WM_ENDUNG.test(p) || p.includes('..')) return fehler(400, 'Ungültiger Bildpfad')
    ziel = `https://upload.wikimedia.org/${p}`
    dauer = 30 * 24 * 3600
  } else return fehler(400, 'Unbekannte Art')

  const r = await fetch(ziel, { headers: { 'user-agent': KENNUNG, accept: 'image/*' }, redirect: 'error' }).catch(() => null)
  if (!r || !r.ok) return fehler(r?.status === 404 ? 404 : 502, 'Bild nicht verfügbar')
  const typ = r.headers.get('content-type') ?? ''
  if (!typ.startsWith('image/')) return fehler(502, 'Kein Bild')
  return new Response(r.body, {
    headers: {
      'content-type': typ,
      'cache-control': `public, max-age=${dauer}, s-maxage=${dauer}`,
      'x-content-type-options': 'nosniff',
    },
  })
}
