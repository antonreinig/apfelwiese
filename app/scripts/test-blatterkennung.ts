// Testet die Blatterkennung an Einzelbildern eines Videos.
//
//   ffmpeg -i video.MOV -vf "fps=2,scale=270:480" -f rawvideo -pix_fmt rgba frames.rgba
//   node --experimental-strip-types scripts/test-blatterkennung.ts frames.rgba 270 480 ausgabe.rgba
//   ffmpeg -f rawvideo -pix_fmt rgba -s 270x480 -i ausgabe.rgba -vf tile=11x4 uebersicht.jpg

import { readFileSync, writeFileSync } from 'node:fs'
import { erkenneBlatt, bewerteBefund } from '../src/kamera/blatterkennung.ts'

const [datei, ws, hs, ausgabe] = process.argv.slice(2)
const w = Number(ws), h = Number(hs)
const roh = readFileSync(datei)
const groesse = w * h * 4
const anzahl = Math.floor(roh.length / groesse)
const out = Buffer.from(roh)

const farbe = { fehlt: [220, 40, 40], korrigieren: [240, 170, 0], gut: [40, 200, 70] } as const

for (let f = 0; f < anzahl; f++) {
  const data = new Uint8Array(roh.buffer, roh.byteOffset + f * groesse, groesse)
  const t0 = performance.now()
  const b = erkenneBlatt({ data, width: w, height: h })
  const ms = performance.now() - t0
  const hinweis = bewerteBefund(b)
  const fmt = (x: number) => (x * 100).toFixed(1).padStart(5)
  console.log(
    `${String(f).padStart(2)} ${(f / 2).toFixed(1).padStart(4)}s ${ms.toFixed(1).padStart(5)}ms`,
    b.gefunden ? `Fläche ${fmt(b.flaechenanteil)}% Neigung x${fmt(b.neigung.x)} y${fmt(b.neigung.y)} Dreh ${b.drehung.toFixed(1).padStart(5)}° Rand ${b.randBeruehrt.join(',') || '-'}` : 'kein Blatt',
    `→ ${hinweis.text}`,
  )
  const [r, g, bl] = farbe[hinweis.stufe]
  const setze = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const xx = Math.round(x) + dx, yy = Math.round(y) + dy
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
        const p = f * groesse + (yy * w + xx) * 4
        out[p] = r; out[p + 1] = g; out[p + 2] = bl
      }
  }
  // Statusbalken oben
  for (let y = 0; y < 8; y++) for (let x = 0; x < w; x++) setze(x, y)
  if (b.gefunden) {
    for (let k = 0; k < 4; k++) {
      const a = b.ecken[k], c = b.ecken[(k + 1) % 4]
      for (let t = 0; t <= 1; t += 0.002) setze((a.x + (c.x - a.x) * t) * w, (a.y + (c.y - a.y) * t) * h)
    }
  }
}
writeFileSync(ausgabe, out)
console.log(`${anzahl} Bilder`)
