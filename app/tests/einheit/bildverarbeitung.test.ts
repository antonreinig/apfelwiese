// Bildverarbeitung an echten Aufnahmen: Beispielfotos (Messung) und Testvideo (Live-Blatterkennung).
// Braucht ffmpeg; ohne ffmpeg werden die Tests übersprungen.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { werteFotoAus } from '../../src/kamera/messung.ts'
import { erkenneBlatt } from '../../src/kamera/blatterkennung.ts'
import { HAT_FFMPEG, rgba } from './hilfen.ts'

const pfad = (p: string) => new URL(`../../${p}`, import.meta.url).pathname
const FOTOS = [
  'public/beispiel/foto1_laengshaelften_schale.jpg',
  'public/beispiel/foto2_laengsscheiben_kernhaus.jpg',
  'public/beispiel/foto3_querhaelften_kelch_stiel_kerne.jpg',
  'public/beispiel/foto4_querscheiben_kernhausstern.jpg',
]

for (const [i, foto] of FOTOS.entries()) {
  test(`Messung Foto ${i + 1}: Blatt, vier Äpfel, plausible Größen`, { skip: !HAT_FFMPEG && 'ffmpeg fehlt' }, () => {
    const [data] = rgba(pfad(foto), 1600, 1200)
    const a = werteFotoAus({ data, width: 1600, height: 1200 })
    assert.ok(a.blattGefunden, 'Blatt nicht gefunden')
    const fruechte = a.teile.filter((t) => t.art === 'frucht')
    assert.equal(fruechte.length, 4, `${fruechte.length} Apfelteile statt 4`)
    // Testäpfel (vermutlich Ananasrenette) sind 55–75 mm breit
    for (const t of fruechte) assert.ok(t.breiteMm > 50 && t.breiteMm < 80, `Breite ${t.breiteMm.toFixed(1)} mm`)
    if (i === 0) {
      const grund = a.farben?.find((f) => f.art === 'grund')
      assert.ok(grund && grund.anteil > 0.8, 'Grundfarbe fehlt')
      const [r, g, b] = grund!.rgb
      assert.ok(r > 180 && g > 160 && b < 120, `Grundfarbe rgb(${grund!.rgb}) ist nicht gelb`)
      assert.ok((a.punkte?.anzahl ?? 0) > 50, 'zu wenige Schalenpunkte')
    }
    if (i === 2) assert.ok(a.teile.filter((t) => t.art === 'kern').length >= 5, 'Kerne nicht gefunden')
  })
}

const VIDEO = pfad('public/testfeed.mp4')
test('Live-Blatterkennung im Testvideo', { skip: (!HAT_FFMPEG || !existsSync(VIDEO)) && 'ffmpeg oder Testvideo fehlt' }, () => {
  const bilder = rgba(VIDEO, 270, 480, 2)
  assert.ok(bilder.length >= 10, 'zu wenige Videobilder')
  const gefunden = bilder.filter((data) => erkenneBlatt({ data, width: 270, height: 480 }).ecken.length === 4).length
  const quote = gefunden / bilder.length
  console.log(`Blatt in ${gefunden} von ${bilder.length} Videobildern erkannt`)
  assert.ok(quote >= 0.7, `Blatt nur in ${(quote * 100).toFixed(0)} % der Bilder erkannt`)
})
