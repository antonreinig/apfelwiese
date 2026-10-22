// Testet die Messung an den Beispielfotos.
//   ffmpeg -i foto.jpg -f rawvideo -pix_fmt rgba foto.rgba
//   node --experimental-strip-types scripts/test-messung.ts foto.rgba 2000 1500 ausgabe.rgba
import { readFileSync, writeFileSync } from 'node:fs'
import { werteFotoAus } from '../src/kamera/messung.ts'

const [datei, ws, hs, ausgabe] = process.argv.slice(2)
const data = new Uint8ClampedArray(readFileSync(datei))
const t0 = performance.now()
const a = werteFotoAus({ data, width: Number(ws), height: Number(hs) })
console.log(`${(performance.now() - t0).toFixed(0)} ms, Blatt ${a.blattGefunden}, quer ${a.querformat}, Papier ${a.papierfarbe}, Licht ungleich ${a.lichtUngleich}, Schärfe ${a.schaerfe?.toFixed(1)}`)
for (const t of a.teile) console.log(`  ${t.art.padEnd(6)} ${t.breiteMm.toFixed(1)} × ${t.hoeheMm.toFixed(1)} mm, ${t.flaecheMm2.toFixed(0)} mm², Mitte ${t.mitte.x.toFixed(0)}/${t.mitte.y.toFixed(0)}`)
for (const f of a.farben ?? []) console.log(`  Farbe ${f.art.padEnd(5)} rgb(${f.rgb}) ${(f.anteil * 100).toFixed(0)} %`)
if (a.punkte) console.log(`  Punkte ${a.punkte.anzahl}, ${a.punkte.jeCm2.toFixed(2)}/cm², rgb(${a.punkte.farbe}), Hof ${a.punkte.hof ?? "-"}`)
if (a.freigestellt && ausgabe) {
  // Hintergrund rot einfärben, damit Schattenreste sichtbar werden
  const d = a.freigestellt.data
  for (let i = 0; i < d.length; i += 4) {
    const al = d[i + 3] / 255
    d[i] = d[i] * al + 230 * (1 - al); d[i + 1] = d[i + 1] * al + 30 * (1 - al); d[i + 2] = d[i + 2] * al + 30 * (1 - al); d[i + 3] = 255
  }
  writeFileSync(ausgabe, Buffer.from(d.buffer))
  console.log(`freigestellt ${a.freigestellt.width}x${a.freigestellt.height}`)
}
