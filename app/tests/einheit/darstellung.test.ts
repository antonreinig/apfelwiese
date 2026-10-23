// 3D-Parameter: aus jeder Sorte entstehen gültige Werte, und Angaben wirken sich aus.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { darstellungAus, STANDARD, type ApfelParameter, type Wert } from '../../src/apfel3d/darstellung.ts'
import type { SortenEintrag } from '../../src/daten/sorte.ts'

const index = JSON.parse(readFileSync(new URL('../../public/sorten/index.json', import.meta.url), 'utf8')) as { sorten: SortenEintrag[] }

function endlich(p: ApfelParameter) {
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${k} = ${v}`)
}

test('Alle Sorten ergeben endliche 3D-Parameter', () => {
  for (const s of index.sorten) {
    const werte: Wert[] = Object.entries(s.m ?? {}).flatMap(([merkmal, l]) => (l as (string | number)[]).map((wert) => ({ merkmal, wert })))
    endlich(darstellungAus(werte).p)
  }
})

test('Lage der breitesten Stelle verändert die Form', () => {
  const stiel = darstellungAus([{ merkmal: 'frucht_breiteste_stelle', wert: 'stiel' }]).p
  const kelch = darstellungAus([{ merkmal: 'frucht_breiteste_stelle', wert: 'kelch' }]).p
  assert.notEqual(stiel.konisch, kelch.konisch)
})

test('Ohne Angaben bleibt das Standardmodell', () => {
  const p = darstellungAus([]).p
  assert.equal(p.breiteMm, STANDARD.breiteMm)
})

test('Gemessene Breite wird übernommen', () => {
  assert.equal(darstellungAus([{ merkmal: 'frucht_breite', wert: 62 }]).p.breiteMm, 62)
})

test('Widersprüchliche Angaben zur Schale werden gemittelt, rau oder matt überwiegt', () => {
  const glaenzend = darstellungAus([{ merkmal: 'schale_beschaffenheit', wert: 'glaenzend' }]).p.glanz
  const gemischt = darstellungAus([
    { merkmal: 'schale_beschaffenheit', wert: 'glatt' },
    { merkmal: 'schale_beschaffenheit', wert: 'rau' },
    { merkmal: 'schale_beschaffenheit', wert: 'glaenzend' },
  ]).p.glanz
  assert.ok(glaenzend > 0.7)
  assert.ok(gemischt <= 0.38, `rau und glänzend zugleich ergibt ${gemischt}`)
})

test('Stiel- und Kelchgrube sind nicht rund, die Achse bleibt aber gleich', async () => {
  const { profil, grubenForm } = await import('../../src/apfel3d/geometrie.ts')
  const p = darstellungAus([], undefined, 7).p
  const umrisse = [0, 1, 2, 3, 4, 5].map((k) => profil(p, 64, (k / 6) * Math.PI * 2))
  // am Pol (Ansatz von Stiel und Kelch) in jeder Richtung derselbe Punkt
  for (const u of umrisse) {
    assert.ok(Math.abs(u[64].y - umrisse[0][64].y) < 1e-9)
    assert.ok(Math.abs(u[0].y - umrisse[0][0].y) < 1e-9)
  }
  // am Grubenrand unterschiedliche Höhen je Richtung (kein Kreis)
  const rand = umrisse.map((u) => u[60].y)
  assert.ok(Math.max(...rand) - Math.min(...rand) > 0.002, `Rand fast kreisrund: ${rand.join(', ')}`)
  // ohne Richtung: rotationssymmetrische, runde Grube
  assert.deepEqual(grubenForm(p, 'stiel'), { weite: 1, wulst: 0, falte: 0 })
})

test('Höhe/Breite gilt von Grubenrand zu Grubenrand, die Gruben laufen ohne Knick in die Schulter', async () => {
  const { profil } = await import('../../src/apfel3d/geometrie.ts')
  for (const [hzb, tiefe] of [[0.7, 0.8], [0.9, 0.45], [1.1, 0.2]]) {
    const p = { ...darstellungAus([]).p, hoeheZuBreite: hzb, stielgrubeTiefe: tiefe, kelchgrubeTiefe: tiefe }
    const pr = profil(p, 240)
    const breite = 2 * Math.max(...pr.map((q) => q.x))
    const hoehe = Math.max(...pr.map((q) => q.y)) - Math.min(...pr.map((q) => q.y))
    assert.ok(Math.abs(hoehe / breite - hzb) < 0.01, `sichtbar ${hoehe / breite} statt ${hzb}`)
    // Richtungswechsel zwischen zwei Abschnitten des Umrisses (außerhalb des Stielansatzes) bleibt klein
    let knick = 0
    for (let i = 2; i < pr.length - 2; i++) {
      if (pr[i].x < 0.08 * breite) continue
      const a = Math.atan2(pr[i].y - pr[i - 1].y, pr[i].x - pr[i - 1].x)
      const b = Math.atan2(pr[i + 1].y - pr[i].y, pr[i + 1].x - pr[i].x)
      let d = Math.abs(b - a)
      if (d > Math.PI) d = 2 * Math.PI - d
      knick = Math.max(knick, d)
    }
    assert.ok(knick < (8 * Math.PI) / 180, `Knick ${(knick * 180) / Math.PI}° bei Höhe/Breite ${hzb}`)
  }
})

test('Bildabgleich: Werte von Hand landen im Sortenindex, Sorten mit Abgleich sind gekennzeichnet', () => {
  const hand = JSON.parse(readFileSync(new URL('../../../daten/bilder/abgleich_hand.json', import.meta.url), 'utf8')) as Record<string, { werte: Record<string, unknown> }>
  assert.ok(Object.keys(hand).length > 0)
  for (const [id, h] of Object.entries(hand)) {
    const s = index.sorten.find((x) => x.id === id)
    assert.ok(s, `Sorte ${id} fehlt im Index`)
    assert.ok(s.angeglichen, `${id} ohne Kennzeichen`)
    for (const [k, v] of Object.entries(h.werte)) assert.deepEqual((s.darstellung as Record<string, unknown>)[k], v, `${id}.${k}`)
  }
  assert.ok(index.sorten.filter((s) => s.angeglichen).length > 500, 'zu wenige Sorten mit Formabgleich')
})
