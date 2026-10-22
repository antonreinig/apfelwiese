// API-Tests gegen ein Deployment (Standard: Live-Version). Mit RESEND_API_KEY läuft zusätzlich der
// ganze Ablauf mit einem Testkonto (delivered@resend.dev): Anmeldung, Zustimmung, Baum, Foto,
// Schutz fremder Pfade, Löschen. Das Testkonto wird am Ende gelöscht.
//
//   BASIS_URL=https://apfelwiese.app node --env-file-if-exists=.env.local --experimental-strip-types --test tests/api/api.test.ts

import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { uploadPresigned } from '@vercel/blob/client'
import { codeAusResend } from './resend.ts'

const BASIS = process.env.BASIS_URL ?? 'https://apfelwiese.app'
const HERKUNFT = new URL(BASIS).origin
let keks = ''

async function api(pfad: string, init: RequestInit & { ohneHerkunft?: boolean } = {}) {
  const kopf: Record<string, string> = { 'content-type': 'application/json', ...(init.headers as Record<string, string>) }
  if (!init.ohneHerkunft && !kopf.origin) kopf.origin = HERKUNFT
  if (keks) kopf.cookie = keks
  const r = await fetch(BASIS + pfad, { ...init, headers: kopf, redirect: 'manual' })
  const gesetzt = r.headers.getSetCookie?.() ?? []
  for (const c of gesetzt) if (c.startsWith('aw_sitzung=')) keks = c.split(';')[0].endsWith('=') ? '' : c.split(';')[0]
  const text = await r.text()
  let daten: Record<string, unknown> = {}
  try { daten = JSON.parse(text) } catch { /* kein JSON */ }
  return { status: r.status, daten, typ: r.headers.get('content-type') ?? '' }
}

test('Ohne Anmeldung: geschützte Routen antworten 401', async () => {
  for (const p of ['/api/ich', '/api/baeume', '/api/foto?k=foto-abc123', '/api/betrieb']) {
    assert.equal((await api(p)).status, 401, p)
  }
})

test('Fremde Herkunft wird abgewiesen', async () => {
  const r = await api('/api/anmelden', { method: 'POST', body: '{"email":"a@b.de"}', ohneHerkunft: true })
  assert.equal(r.status, 403)
  const r2 = await api('/api/anmelden', { method: 'POST', body: '{"email":"a@b.de"}', headers: { origin: 'https://boese.example' } })
  assert.equal(r2.status, 403)
})

test('Ungültige Eingaben werden abgewiesen', async () => {
  assert.equal((await api('/api/anmelden', { method: 'POST', body: '{"email":"kein-mail"}' })).status, 400)
  assert.equal((await api('/api/bestaetigen', { method: 'POST', body: '{"anfrage":"x","code":"1"}' })).status, 400)
  assert.equal((await api('/api/protokoll', { method: 'POST', body: '{"art":"unsinn","meldung":"x"}' })).status, 400)
  assert.equal((await api('/api/rueckmeldung', { method: 'POST', body: '{"text":""}' })).status, 400)
})

test('Cron-Routen nur mit Geheimnis', async () => {
  assert.equal((await api('/api/aufraeumen')).status, 401)
  assert.equal((await api('/api/tagesbericht')).status, 401)
})

test('Bild-Proxy: gültige Kachel ja, fremde Pfade nein', async () => {
  const k = await api('/kacheln/luftbild/16/21170/34595')
  assert.equal(k.status, 200)
  assert.match(k.typ, /^image\//)
  const t = await api('/wmt/wikipedia/commons/thumb/c/c0/Malus_Gravensteiner_4481.jpg/960px-Malus_Gravensteiner_4481.jpg')
  assert.equal(t.status, 200, 'Vorschaubild von thumb.wikimedia.org')
  assert.match(t.typ, /^image\//)
  const ia = await api('/ia/download/bub_gb_tR4EMgEACAAJ/page/n627_w800.jpg')
  assert.equal(ia.status, 200, 'Seitenbild aus dem Internet Archive')
  assert.match(ia.typ, /^image\//)
  assert.equal((await api('/api/kachel?art=ia&p=download/x/../../etc')).status, 400)
  assert.equal((await api('/api/kachel?art=luftbild&z=99&y=1&x=1')).status, 400)
  assert.equal((await api('/api/kachel?art=wm&p=wikipedia/commons/../x.jpg')).status, 400)
  assert.equal((await api('/api/kachel?art=wm&p=index.html')).status, 400)
})

const MIT_KONTO = !!process.env.RESEND_API_KEY
test('Ganzer Ablauf mit Testkonto', { skip: !MIT_KONTO && 'RESEND_API_KEY fehlt' }, async (t) => {
  let uid = ''
  after(async () => { if (keks) await api('/api/konto', { method: 'DELETE' }) })

  await t.test('Code anfordern und anmelden', async () => {
    const a = await api('/api/anmelden', { method: 'POST', body: JSON.stringify({ email: `delivered+test${Date.now()}@resend.dev` }) })
    assert.equal(a.status, 200, JSON.stringify(a.daten))
    const anfrage = a.daten.anfrage as string
    const code = await codeAusResend(anfrage)
    assert.equal((await api('/api/bestaetigen', { method: 'POST', body: JSON.stringify({ anfrage, code: code === '000000' ? '111111' : '000000' }) })).status, 400)
    const b = await api('/api/bestaetigen', { method: 'POST', body: JSON.stringify({ anfrage, code }) })
    assert.equal(b.status, 200, JSON.stringify(b.daten))
    assert.ok(keks, 'kein Sitzungscookie')
    const ich = await api('/api/ich')
    assert.equal(ich.status, 200)
    uid = ich.daten.uid as string
    assert.equal(ich.daten.betreiber, false)
    assert.equal((await api('/api/betrieb')).status, 403)
  })

  await t.test('Ohne Zustimmung wird nichts gespeichert', async () => {
    // Ein Testkonto aus einem abgebrochenen Lauf kann schon zugestimmt haben; dann gibt es nichts zu prüfen
    const ich = await api('/api/ich')
    const schonZugestimmt = (ich.daten.einwilligungen as { zweck: string; erteilt: boolean }[]).some((e) => e.zweck === 'nutzung' && e.erteilt)
    const r = await api('/api/baeume?id=testbaum', { method: 'PUT', body: JSON.stringify({ id: 'testbaum', geaendert: new Date().toISOString() }) })
    if (!schonZugestimmt) assert.equal(r.status, 403)
    assert.equal((await api('/api/einwilligung', { method: 'POST', body: JSON.stringify({ zweck: 'nutzung', erteilt: true, textVersion: 'test' }) })).status, 200)
  })

  await t.test('Baum mit Foto speichern, lesen, Foto herunterladen', async () => {
    const foto = new Uint8Array(await (await fetch(`${BASIS}/beispiel/foto1_laengshaelften_schale.jpg`)).arrayBuffer())
    await uploadPresigned(`n/${uid}/f/foto-apitest01`, new Blob([foto], { type: 'image/jpeg' }), {
      access: 'private', handleUploadUrl: `${BASIS}/api/foto-hochladen`, contentType: 'image/jpeg',
      headers: { cookie: keks, origin: HERKUNFT },
    })
    const baum = { id: 'testbaum', geaendert: new Date().toISOString(), name: 'API-Test', fotosaetze: [{ fotos: ['foto:apitest01', null, null, null] }] }
    assert.equal((await api('/api/baeume?id=testbaum', { method: 'PUT', body: JSON.stringify(baum) })).status, 200)
    const liste = await api('/api/baeume')
    assert.ok((liste.daten.baeume as { id: string }[]).some((b) => b.id === 'testbaum'), 'Baum fehlt in der Liste')
    const f = await api('/api/foto?k=foto-apitest01')
    const geladen = new Uint8Array(await (await fetch(f.daten.url as string)).arrayBuffer())
    assert.equal(geladen.length, foto.length, 'Foto hat eine andere Größe')
  })

  await t.test('Fremde Pfade und ungültige Daten werden abgewiesen', async () => {
    await assert.rejects(uploadPresigned('n/00000000000000000000000000000000/f/foto-fremd001', new Blob(['x'], { type: 'image/jpeg' }), {
      access: 'private', handleUploadUrl: `${BASIS}/api/foto-hochladen`, headers: { cookie: keks, origin: HERKUNFT },
    }))
    const r = await api('/api/baeume?id=testbaum', { method: 'PUT', body: JSON.stringify({ id: 'testbaum', geaendert: 'x', fotosaetze: [{ fotos: ['../../n/x'] }] }) })
    assert.equal(r.status, 400)
    assert.equal((await api('/api/baeume?id=..%2Fx', { method: 'PUT', body: '{}' })).status, 400)
  })

  await t.test('Konto löschen beendet die Sitzung', async () => {
    assert.equal((await api('/api/konto', { method: 'DELETE' })).status, 200)
    keks = ''
    assert.equal((await api('/api/ich')).status, 401)
  })
})
