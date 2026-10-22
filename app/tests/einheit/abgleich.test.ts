// Abgleich: Eine Sorte, deren eigene Merkmale man eingibt, muss weit oben landen.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gleicheAb } from '../../src/daten/abgleich.ts'
import type { SortenEintrag } from '../../src/daten/sorte.ts'
import type { Wert } from '../../src/apfel3d/darstellung.ts'

const index = JSON.parse(readFileSync(new URL('../../public/sorten/index.json', import.meta.url), 'utf8')) as { sorten: SortenEintrag[] }

function werteVon(s: SortenEintrag): Wert[] {
  return Object.entries(s.m ?? {}).map(([merkmal, liste]) => ({ merkmal, wert: (liste as (string | number)[])[0] }))
}

test('Sortenindex ist geladen und plausibel', () => {
  assert.ok(index.sorten.length > 1500, `nur ${index.sorten.length} Sorten`)
  const ids = index.sorten.map((s) => s.id)
  assert.equal(new Set(ids).size, ids.length, 'doppelte Sorten-ID')
})

for (const id of ['gravensteiner', 'finkenwerder-herbstprinz', 'ananasrenette', 'schoener-aus-boskoop']) {
  test(`${id}: eigene Merkmale führen unter die ersten drei`, () => {
    const s = index.sorten.find((x) => x.id === id)
    assert.ok(s, `Sorte ${id} fehlt im Index`)
    const rang = gleicheAb(werteVon(s), index.sorten, 10).findIndex((k) => k.sorte.id === id)
    assert.ok(rang >= 0 && rang < 3, `${id} auf Rang ${rang + 1}`)
  })
}

test('Ohne Angaben gibt es keinen Vorschlag', () => {
  assert.deepEqual(gleicheAb([], index.sorten), [])
})
