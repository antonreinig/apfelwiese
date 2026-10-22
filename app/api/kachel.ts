// Proxy für Luftbildkacheln (Esri) und Sortenbilder (Wikimedia Commons, Internet Archive). Anders als eine
// Vercel-Weiterleitung schickt er keine Daten der Nutzer (IP-Adresse, Browserkennung) weiter.
// Antworten werden im Vercel-CDN zwischengespeichert.

import { fehler } from './_lib/http.js'
import { mitProtokoll } from './_lib/protokoll.js'

const KENNUNG = 'Apfelwiese/1.0 (+https://apfelwiese.app/#/impressum)'
const WM_PFAD = /^wikipedia\/(commons|en|de)\/(thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/[^/?#]+(\/[^/?#]+)?$/
const WM_ENDUNG = /\.(jpe?g|png|webp|gif|tiff?)$/i
const IA_PFAD = /^download\/[A-Za-z0-9_.-]{3,80}\/page\/n\d{1,5}(_w\d{2,4})?\.jpg$/

/** Folgt Weiterleitungen nur innerhalb von archive.org (Bildserver ia*.us.archive.org) */
async function holeMitWeiterleitung(url: string, kopf: Record<string, string>, erlaubt: (host: string) => boolean): Promise<Response | null> {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: kopf, redirect: 'manual' }).catch(() => null)
    if (!r) return null
    const ziel = r.headers.get('location')
    if (r.status < 300 || r.status >= 400 || !ziel) return r
    const naechste = new URL(ziel, url)
    if (naechste.protocol !== 'https:' || !erlaubt(naechste.hostname)) return null
    url = naechste.toString()
  }
  return null
}

async function get(req: Request) {
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
  } else if (q.get('art') === 'wm' || q.get('art') === 'wmt') {
    // upload.wikimedia.org (Originale) bzw. thumb.wikimedia.org (Vorschaubilder)
    const p = q.get('p') ?? ''
    if (p.length > 400 || !WM_PFAD.test(p) || !WM_ENDUNG.test(p) || p.includes('..')) return fehler(400, 'Ungültiger Bildpfad')
    ziel = `https://${q.get('art') === 'wmt' ? 'thumb' : 'upload'}.wikimedia.org/${p}`
    dauer = 30 * 24 * 3600
  } else if (q.get('art') === 'ia') {
    // Seitenabbildungen alter Pomologien aus dem Internet Archive
    const p = q.get('p') ?? ''
    if (!IA_PFAD.test(p)) return fehler(400, 'Ungültiger Bildpfad')
    ziel = `https://archive.org/${p}`
    dauer = 30 * 24 * 3600
  } else return fehler(400, 'Unbekannte Art')

  const kopf = { 'user-agent': KENNUNG, accept: 'image/*' }
  const r = q.get('art') === 'ia'
    ? await holeMitWeiterleitung(ziel, kopf, (h) => h === 'archive.org' || h.endsWith('.archive.org'))
    : await fetch(ziel, { headers: kopf, redirect: 'error' }).catch(() => null)
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

export const GET = mitProtokoll('kachel', get)
