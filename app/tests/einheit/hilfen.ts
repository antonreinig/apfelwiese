// Gemeinsame Hilfen für die Einzeltests: Bilder per ffmpeg in RGBA-Puffer wandeln.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

export const HAT_FFMPEG = (() => {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true } catch { return false }
})()

/** Bild- oder Videodatei als RGBA-Bilder (bei Video: fps Bilder pro Sekunde, skaliert) */
export function rgba(datei: string, breite: number, hoehe: number, fps?: number): Uint8ClampedArray[] {
  if (!existsSync(datei)) throw new Error(`Testdatei fehlt: ${datei}`)
  const filter = [fps ? `fps=${fps}` : '', `scale=${breite}:${hoehe}`].filter(Boolean).join(',')
  const roh = execFileSync('ffmpeg', ['-v', 'error', '-i', datei, '-vf', filter, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 30 })
  const groesse = breite * hoehe * 4
  const bilder: Uint8ClampedArray[] = []
  for (let o = 0; o + groesse <= roh.length; o += groesse) bilder.push(new Uint8ClampedArray(roh.buffer, roh.byteOffset + o, groesse))
  return bilder
}
