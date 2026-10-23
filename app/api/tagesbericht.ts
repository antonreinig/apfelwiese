// Täglicher Cron-Job: kurze Mail an den Betreiber, wenn es in den letzten 24 Stunden neue Konten,
// Rückmeldungen oder Fehler gab. Ohne Vorkommnisse wird nichts verschickt.

import { list } from '@vercel/blob'
import { json, fehler } from './_lib/http.js'
import { liesJson } from './_lib/speicher.js'
import { sendeMail, escape, BETREIBER_MAIL } from './_lib/mail.js'
import { mitProtokoll, type Fehlereintrag, type Ereignis } from './_lib/protokoll.js'

async function letzte24h<T extends { zeit: string }>(bereich: string): Promise<T[]> {
  const grenze = new Date(Date.now() - 24 * 3600_000).toISOString()
  const pfade: string[] = []
  for (const tag of [0, 1]) {
    const datum = new Date(Date.now() - tag * 24 * 3600_000).toISOString().slice(0, 10)
    const r = await list({ prefix: `log/${bereich}/${datum}/`, limit: 1000 })
    pfade.push(...r.blobs.map((b) => b.pathname))
  }
  const daten: T[] = []
  for (const p of pfade.slice(0, 300)) {
    const d = await liesJson<T>(p)
    if (d && d.zeit >= grenze) daten.push(d)
  }
  return daten
}

async function get(req: Request) {
  const geheim = process.env.CRON_SECRET
  if (!geheim || req.headers.get('authorization') !== `Bearer ${geheim}`) return fehler(401, 'Nicht erlaubt')
  const [alleEreignisse, alleFehler] = await Promise.all([letzte24h<Ereignis>('ereignisse'), letzte24h<Fehlereintrag>('fehler')])
  // automatische Tests (Testkonten, Testläufe) zählen nicht als Nutzung
  const ereignisse = alleEreignisse.filter((e) => !e.test)
  const fehlerliste = alleFehler.filter((f) => !f.test)
  const testkonten = alleEreignisse.filter((e) => e.test && e.art === 'konto-neu').length
  if (!ereignisse.length && !fehlerliste.length) return json({ verschickt: false })

  const zaehle = (art: Ereignis['art']) => ereignisse.filter((e) => e.art === art).length
  const arten = new Map<string, number>()
  for (const f of fehlerliste) arten.set(`${f.quelle}/${f.art}: ${f.meldung.slice(0, 120)}`, (arten.get(`${f.quelle}/${f.art}: ${f.meldung.slice(0, 120)}`) ?? 0) + 1)
  const zeilen = [
    'Apfelwiese, letzte 24 Stunden:',
    '',
    `Neue Konten: ${zaehle('konto-neu')}`,
    `Gelöschte Konten: ${zaehle('konto-geloescht')}`,
    `Rückmeldungen: ${zaehle('rueckmeldung')}`,
    `Fehler: ${fehlerliste.length}`,
    ...[...arten.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t, n]) => `  ${n}× ${t}`),
    '',
    ...(testkonten ? [`(Nicht mitgezählt: ${testkonten} Testkonten der automatischen Prüfung)`] : []),
    'Details: https://apfelwiese.app/#/betrieb',
  ]
  await sendeMail(BETREIBER_MAIL, `Apfelwiese: ${fehlerliste.length} Fehler, ${zaehle('konto-neu')} neue Konten`, zeilen.join('\n'),
    `<pre style="font-family:Georgia,serif;white-space:pre-wrap">${escape(zeilen.join('\n'))}</pre>`)
  return json({ verschickt: true })
}

export const GET = mitProtokoll('tagesbericht', get)
