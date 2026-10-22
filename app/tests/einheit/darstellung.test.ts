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
