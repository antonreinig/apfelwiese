// Stündlicher Cron-Job: abgelaufene Anmeldeanfragen (nach 1 Stunde), alte Zähler für den
// Missbrauchsschutz (nach 25 Stunden) und Reste gelöschter Konten entfernen.

import { list } from '@vercel/blob'
import { json, fehler } from './_lib/http.js'
import { loesche, alleUnter } from './_lib/speicher.js'

async function aelterAls(prefix: string, ms: number) {
  const grenze = Date.now() - ms
  const pfade: string[] = []
  let cursor: string | undefined
  do {
    const r = await list({ prefix, cursor, limit: 1000 })
    for (const b of r.blobs) if (b.uploadedAt.getTime() < grenze) pfade.push(b.pathname)
    cursor = r.hasMore ? r.cursor : undefined
  } while (cursor)
  return pfade
}

export async function GET(req: Request) {
  const geheim = process.env.CRON_SECRET
  if (!geheim || req.headers.get('authorization') !== `Bearer ${geheim}`) return fehler(401, 'Nicht erlaubt')
  const weg = [
    ...(await aelterAls('auth/anfragen/', 3600_000)),
    ...(await aelterAls('auth/zaehler/', 25 * 3600_000)),
  ]
  // gelöschte Konten: nach 15 Minuten (alle Upload-URLs abgelaufen) alles unter n/<uid>/ entfernen
  for (const marke of await aelterAls('auth/geloescht/', 15 * 60_000)) {
    const uid = marke.slice('auth/geloescht/'.length, -'.json'.length)
    if (/^[a-z0-9]{20,40}$/.test(uid)) weg.push(...(await alleUnter(`n/${uid}/`)))
    weg.push(marke)
  }
  await loesche(weg)
  return json({ geloescht: weg.length })
}
