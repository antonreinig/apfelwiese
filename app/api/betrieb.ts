// Betriebsübersicht für den Betreiber: Konten, Ereignisse, Fehler, Mail-Kontingent.
// Nur für Konten, deren E-Mail in BETREIBER_EMAILS steht (kommagetrennt).

import { list } from '@vercel/blob'
import { json, fehler } from './_lib/http.js'
import { angemeldet, istBetreiber, type Konto } from './_lib/sitzung.js'
import { liesJson, alleUnter, anzahlIm } from './_lib/speicher.js'
import { mitProtokoll, type Fehlereintrag, type Ereignis } from './_lib/protokoll.js'

const TAG = 24 * 3600_000

/** Einträge der letzten Tage aus log/<bereich>/<datum>/ lesen, neueste zuerst */
async function eintraege<T>(bereich: string, tage: number, max: number): Promise<T[]> {
  const pfade: string[] = []
  for (let i = 0; i < tage && pfade.length < max; i++) {
    const datum = new Date(Date.now() - i * TAG).toISOString().slice(0, 10)
    const r = await list({ prefix: `log/${bereich}/${datum}/`, limit: 1000 })
    pfade.push(...r.blobs.map((b) => b.pathname).sort().reverse())
  }
  const auswahl = pfade.slice(0, max)
  const daten: T[] = []
  for (let i = 0; i < auswahl.length; i += 10) {
    const teil = await Promise.all(auswahl.slice(i, i + 10).map((p) => liesJson<T>(p)))
    for (const d of teil) if (d) daten.push(d)
  }
  return daten
}

async function get(req: Request) {
  const k = await angemeldet(req)
  if (k instanceof Response) return k
  if (!istBetreiber(k)) return fehler(403, 'Nur für den Betreiber')

  // Konten mit Zahl der Bäume
  const kontoPfade = (await alleUnter('n/')).filter((p) => p.endsWith('/konto.json')).slice(0, 500)
  const konten: { email: string; erstellt: string; baeume: number; fotos: number; verbesserung: boolean }[] = []
  for (const p of kontoPfade) {
    const kk = await liesJson<Konto>(p)
    if (!kk || kk.geloescht || /@resend\.dev$/i.test(kk.email)) continue
    const inhalt = await alleUnter(`n/${kk.uid}/`)
    const verbesserung = [...kk.einwilligungen].reverse().find((e) => e.zweck === 'verbesserung')?.erteilt ?? false
    konten.push({
      email: kk.email, erstellt: kk.erstellt, verbesserung,
      baeume: inhalt.filter((x) => x.includes('/baeume/')).length,
      fotos: inhalt.filter((x) => x.includes('/f/')).length,
    })
  }
  konten.sort((a, b) => b.erstellt.localeCompare(a.erstellt))

  const [alleEreignisse, alleFehler] = await Promise.all([
    eintraege<Ereignis>('ereignisse', 14, 300),
    eintraege<Fehlereintrag>('fehler', 7, 400),
  ])
  // Einträge der automatischen Tests nur zählen, nicht anzeigen
  const ereignisse = alleEreignisse.filter((e) => !e.test)
  const fehlerliste = alleFehler.filter((f) => !f.test)
  const tests = { konten: alleEreignisse.filter((e) => e.test && e.art === 'konto-neu').length, fehler: alleFehler.length - fehlerliste.length }

  // Fehler nach Art und Meldung gruppieren
  const gruppen = new Map<string, { art: string; quelle: string; meldung: string; anzahl: number; zuletzt: string; seiten: string[]; geraete: string[]; versionen: string[]; beispiel?: Fehlereintrag }>()
  for (const f of fehlerliste) {
    const key = f.quelle + f.art + f.meldung
    const g = gruppen.get(key) ?? { art: f.art, quelle: f.quelle, meldung: f.meldung, anzahl: 0, zuletzt: f.zeit, seiten: [], geraete: [], versionen: [], beispiel: f }
    g.anzahl++
    if (f.zeit > g.zuletzt) g.zuletzt = f.zeit
    for (const [liste, wert] of [[g.seiten, f.seite], [g.geraete, f.geraet], [g.versionen, f.version]] as [string[], string | undefined][]) {
      if (wert && !liste.includes(wert) && liste.length < 5) liste.push(wert)
    }
    gruppen.set(key, g)
  }

  return json({
    konten,
    ereignisse,
    fehler: [...gruppen.values()].sort((a, b) => b.zuletzt.localeCompare(a.zuletzt)),
    tests,
    kontingent: {
      anmeldemails: await anzahlIm('alle-mails', TAG), anmeldemailsMax: 80,
      rueckmeldungen: await anzahlIm('rm-alle', TAG), rueckmeldungenMax: 15,
    },
  })
}

export const GET = mitProtokoll('betrieb', get)
