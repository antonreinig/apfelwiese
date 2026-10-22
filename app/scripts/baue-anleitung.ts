// Erzeugt die Anleitungsbilder (public/anleitung/foto1–4.jpg) aus den Beispielfotos:
// Blatt erkennen, entzerren, Weißabgleich, 3 mm Rand weg, Hochformat.
//   node --experimental-strip-types scripts/baue-anleitung.ts
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { werteFotoAus } from '../src/kamera/messung.ts'

const QUELLE = join(import.meta.dirname, '../../docs/beispielbilder')
const ZIEL = join(import.meta.dirname, '../public/anleitung')
const NAMEN = ['foto1_laengshaelften_schale', 'foto2_laengsscheiben_kernhaus', 'foto3_querhaelften_kelch_stiel_kerne', 'foto4_querscheiben_kernhausstern']
mkdirSync(ZIEL, { recursive: true })
const tmp = join(tmpdir(), `anleitung-${process.pid}.rgba`)
NAMEN.forEach((n, i) => {
  const groesse = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', join(QUELLE, `${n}.jpg`)]).toString().trim().split(',').map(Number)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', join(QUELLE, `${n}.jpg`), '-f', 'rawvideo', '-pix_fmt', 'rgba', tmp])
  const a = werteFotoAus({ data: new Uint8ClampedArray(readFileSync(tmp)), width: groesse[0], height: groesse[1] })
  if (!a.blatt) throw new Error(`Kein Blatt in ${n}`)
  writeFileSync(tmp, Buffer.from(a.blatt.data.buffer))
  const drehen = a.blatt.width > a.blatt.height ? ['-vf', 'transpose=1,scale=-2:900'] : ['-vf', 'scale=-2:900']
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${a.blatt.width}x${a.blatt.height}`, '-i', tmp, ...drehen, '-q:v', '4', join(ZIEL, `foto${i + 1}.jpg`)])
  console.log(`foto${i + 1}.jpg`)
})
rmSync(tmp)
