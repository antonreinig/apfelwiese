// Der Merkmalskatalog ist die einzige Quelle für Merkmale; er muss in sich stimmig sein.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MERKMALE, MERKMAL_NACH_ID, auspraegungLabel } from '../../src/daten/merkmalskatalog.ts'

test('Merkmal-IDs sind eindeutig und gültig', () => {
  const ids = MERKMALE.map((m) => m.id)
  assert.equal(new Set(ids).size, ids.length, 'doppelte Merkmal-ID')
  for (const id of ids) assert.match(id, /^[a-z0-9_]+$/, `ungültige ID ${id}`)
})

test('Ausprägungen je Merkmal sind eindeutig und beschriftet', () => {
  for (const m of MERKMALE) {
    if (!m.auspraegungen) continue
    const codes = m.auspraegungen.map((a) => a.code)
    assert.equal(new Set(codes).size, codes.length, `doppelter Code bei ${m.id}`)
    for (const a of m.auspraegungen) assert.ok(a.label?.trim(), `${m.id}/${a.code} ohne Beschriftung`)
  }
})

test('Ordinale Merkmale haben aufsteigende Zahlencodes', () => {
  for (const m of MERKMALE.filter((x) => x.typ === 'ordinal' && x.auspraegungen?.every((a) => /^\d+$/.test(a.code)))) {
    const zahlen = m.auspraegungen!.map((a) => Number(a.code))
    assert.deepEqual(zahlen, [...zahlen].sort((a, b) => a - b), `${m.id} nicht aufsteigend`)
  }
})

test('Nachschlagen nach ID und Beschriftung funktionieren', () => {
  for (const m of MERKMALE) assert.equal(MERKMAL_NACH_ID[m.id], m)
  const mitAusp = MERKMALE.find((m) => m.auspraegungen?.length)!
  assert.equal(auspraegungLabel(mitAusp.id, mitAusp.auspraegungen![0].code), mitAusp.auspraegungen![0].label)
})
