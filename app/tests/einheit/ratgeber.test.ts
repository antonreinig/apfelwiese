// Sorten erkunden und Kaufratgeber: stabile Auswahl, belegte Gründe, keine Empfehlung gegen harte Ausschlüsse.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { SortenEintrag } from '../../src/daten/sorte.ts'
import { apfelDesTages, tagesnummer, SAMMLUNGEN, sammlungAnwenden, regionSorten, reifekalender } from '../../src/daten/erkunden.ts'
import { bewerte, empfehlungen, START, anbauAngaben, type Antworten } from '../../src/daten/ratgeber.ts'
import { BUNDESLAENDER } from '../../src/daten/einstellungen.ts'
import { MERKMAL_NACH_ID } from '../../src/daten/merkmalskatalog.ts'

const index = JSON.parse(readFileSync(new URL('../../public/sorten/index.json', import.meta.url), 'utf8')) as { sorten: SortenEintrag[] }

const sorte = (id: string, m: Record<string, (string | number)[]>, extra: Partial<SortenEintrag> = {}): SortenEintrag => ({
  id, name: id, synonyme: [], darstellung: {}, hatBild: true, anzahlMerkmale: Object.keys(m).length, m, ...extra,
})

test('Apfel des Tages ist für einen Tag stabil und wechselt über die Tage', () => {
  const heute = tagesnummer(new Date(2026, 9, 23))
  assert.equal(apfelDesTages(index.sorten, heute)?.id, apfelDesTages(index.sorten, heute)?.id)
  const woche = new Set(Array.from({ length: 7 }, (_, i) => apfelDesTages(index.sorten, heute + i)?.id))
  assert.ok(woche.size >= 5, `nur ${woche.size} verschiedene Sorten in sieben Tagen`)
  assert.ok(apfelDesTages(index.sorten, heute)!.hatBild)
})

test('Sammlungen sind eindeutig und nicht leer', () => {
  const ids = SAMMLUNGEN.map((s) => s.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const sm of SAMMLUNGEN) {
    if (sm.id === 'selten') continue // hängt an externen Listen
    assert.ok(sammlungAnwenden(index.sorten, sm).length >= 3, `Sammlung ${sm.id} hat weniger als drei Sorten`)
  }
})

test('Reifekalender zählt jede genussreife Sorte im richtigen Monat', () => {
  const k = reifekalender(index.sorten)
  assert.equal(k.length, 12)
  assert.equal(k[9], index.sorten.filter((s) => s.genuss?.includes(10)).length)
})

test('Regionen im Index sind gültige Bundesländer und erscheinen in der Regionsliste', () => {
  const codes = new Set(BUNDESLAENDER.map((b) => b.code))
  for (const s of index.sorten) {
    for (const r of s.regionen ?? []) {
      const [code, art] = r.split(':')
      assert.ok(codes.has(code), `${s.id}: unbekannte Region ${r}`)
      assert.match(art, /^[hrev]$/)
    }
  }
  const mitRegion = index.sorten.find((s) => s.regionen?.length)
  if (mitRegion) {
    const code = mitRegion.regionen![0].split(':')[0]
    assert.ok(regionSorten(index.sorten, code).eigene.some((x) => x.s.id === mitRegion.id))
  }
})

test('Anbaumerkmale im Index stammen aus dem Katalog', () => {
  for (const s of index.sorten) {
    for (const [m, werte] of Object.entries(s.m ?? {})) {
      const k = MERKMAL_NACH_ID[m]
      assert.ok(k, `${s.id}: unbekanntes Merkmal ${m}`)
      if (k.auspraegungen && k.typ !== 'messwert') for (const w of werte) assert.ok(k.auspraegungen.some((a) => a.code === String(w)), `${s.id}: ${m}=${w}`)
    }
  }
})

test('Ratgeber: Spätfrostsenke spricht gegen frostempfindliche Blüte, für robuste', () => {
  const a: Antworten = { ...START, lage: 'senke' }
  const empfindlich = bewerte(sorte('a', { bluete_frost: ['7'], bluete_zeit: ['3'] }), a)
  const robust = bewerte(sorte('b', { bluete_frost: ['3'], bluete_zeit: ['7'] }), a)
  assert.ok(empfindlich.punkte < 0 && robust.punkte > 0)
  assert.ok(robust.gruende.some((g) => g.merkmal === 'bluete_frost'))
})

test('Ratgeber: triploide Sorte ohne Bäume in der Nähe bekommt einen Gegengrund', () => {
  const e = bewerte(sorte('t', { ploidie: ['triploid'] }), { ...START, nachbarn: 'nein' })
  assert.ok(e.gruende.some((g) => g.punkte < 0 && /triploid/.test(g.text)))
})

test('Ratgeber: bei widersprüchlichen Quellen zählt der ungünstigere Wert', () => {
  const e = bewerte(sorte('w', { anfaelligkeit_schorf: ['3', '7'] }), { ...START, robust: true })
  assert.ok(e.gruende.some((g) => g.text === 'anfällig für Schorf'))
  assert.ok(!e.gruende.some((g) => g.text === 'wenig anfällig für Schorf'))
})

test('Ratgeber: derselbe Grund zählt nur einmal', () => {
  const e = bewerte(sorte('k', { anfaelligkeit_krebs: ['3'] }), { ...START, boden: 'schwer', robust: true })
  assert.equal(e.gruende.filter((g) => /Obstbaumkrebs/.test(g.text)).length, 1)
})

test('Ratgeber: fehlende Angaben zählen nicht, werden aber genannt', () => {
  const e = bewerte(sorte('l', { baum_wuchs: ['7'] }), { ...START, robust: true, boden: 'leicht' })
  assert.equal(e.punkte, 0)
  assert.ok(e.luecken.includes('Krankheiten') && e.luecken.includes('Boden'))
})

test('Ratgeber: Empfehlungen aus der Datenbank enthalten keinen schweren Gegengrund', () => {
  const a: Antworten = { ...START, lage: 'rau', boden: 'schwer', platz: 'wiese', nutzung: ['lager', 'most'], robust: true, nachbarn: 'nein' }
  const e = empfehlungen(index.sorten, a)
  assert.ok(e.pool >= 0)
  for (const x of e.liste) {
    assert.ok(anbauAngaben(x.sorte) >= 2)
    assert.ok(!x.gruende.some((g) => g.punkte <= -2.5), `${x.sorte.id} trotz schwerem Gegengrund`)
    assert.ok(x.punkte > 0)
  }
  for (let i = 1; i < e.liste.length; i++) assert.ok(e.liste[i - 1].punkte >= e.liste[i].punkte)
})
