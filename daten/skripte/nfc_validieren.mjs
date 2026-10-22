// Prüft daten/nfc/sorten_nfc.json gegen Merkmalskatalog und quellen.json und gibt eine Statistik aus.
// Aufruf: node --experimental-strip-types --no-warnings daten/skripte/nfc_validieren.mjs \
//   app/src/daten/merkmalskatalog.ts daten/nfc/sorten_nfc.json daten/nfc/quellen.json
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [katalogPfad, sortenPfad, quellenPfad] = process.argv.slice(2)
const { MERKMALE } = await import(pathToFileURL(resolve(katalogPfad)).href)
const sorten = JSON.parse(readFileSync(sortenPfad, 'utf8'))
const quellen = JSON.parse(readFileSync(quellenPfad, 'utf8'))

const merkmal = Object.fromEntries(MERKMALE.map((m) => [m.id, m]))
const quellIds = new Set(quellen.map((q) => q.id))
const fehler = []
const f = (s, t) => fehler.push(`${s}: ${t}`)
const belegPruefen = (s, b, wo) => {
  if (!b || typeof b.quelle !== 'string') f(s, `${wo}: Beleg ohne quelle`)
  else if (!quellIds.has(b.quelle)) f(s, `${wo}: unbekannte Quelle "${b.quelle}"`)
}

for (const q of quellen) {
  for (const feld of ['id', 'werk', 'lizenz']) if (!q[feld]) f(`Quelle ${q.id}`, `Pflichtfeld ${feld} fehlt`)
}

const ids = new Set()
const THEMEN = new Set(['ueberblick', 'herkunft', 'frucht', 'schale', 'schnitt', 'fleisch_geschmack',
  'reife_lagerung', 'baum', 'verwendung', 'unterscheidung'])
for (const s of sorten) {
  const sid = s.id
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(sid)) f(sid, 'ID nicht im Format kleingeschrieben-mit-bindestrichen')
  if (ids.has(sid)) f(sid, 'doppelte ID')
  ids.add(sid)
  if (!s.name) f(sid, 'name fehlt')
  for (const feld of ['synonyme', 'merkmale', 'texte', 'bilder']) if (!Array.isArray(s[feld])) f(sid, `${feld} ist kein Array`)
  for (const syn of s.synonyme ?? []) { if (!syn.name) f(sid, 'Synonym ohne Namen'); if (syn.beleg) belegPruefen(sid, syn.beleg, 'Synonym') }
  if (s.munq !== undefined && typeof s.munq !== 'number') f(sid, 'munq ist keine Zahl')
  for (const a of s.akzessionen ?? []) if (!a.sammlung || !a.nummer || !a.name) f(sid, 'Akzession unvollständig')
  if (s.herkunft) for (const b of s.herkunft.belege) belegPruefen(sid, b, 'herkunft')
  for (const mw of s.merkmale) {
    const m = merkmal[mw.merkmal]
    belegPruefen(sid, mw, `Merkmal ${mw.merkmal}`)
    if (!m) { f(sid, `unbekanntes Merkmal "${mw.merkmal}"`); continue }
    if (m.typ === 'messwert') {
      if (typeof mw.wert !== 'number' || !Number.isFinite(mw.wert)) f(sid, `${mw.merkmal}: Messwert keine Zahl (${mw.wert})`)
    } else if (m.typ === 'text' || m.typ === 'anzahl') {
      // freie Werte
    } else if (!(m.auspraegungen ?? []).some((a) => a.code === String(mw.wert))) {
      f(sid, `${mw.merkmal}: Code "${mw.wert}" nicht im Katalog`)
    } else if (typeof mw.wert !== 'string') {
      f(sid, `${mw.merkmal}: Code als ${typeof mw.wert} statt string`)
    }
  }
  for (const t of s.texte) {
    if (!THEMEN.has(t.thema)) f(sid, `unbekanntes Textthema ${t.thema}`)
    if (!t.text) f(sid, 'leerer Text')
    if (!t.belege?.length) f(sid, 'Text ohne Beleg')
    for (const b of t.belege ?? []) belegPruefen(sid, b, 'Text')
  }
  for (const b of s.bilder) for (const feld of ['url', 'seite', 'art', 'urheber', 'lizenz', 'quelle']) if (!b[feld]) f(sid, `Bild ohne ${feld}`)
}

// ---- Statistik
const n = sorten.length
const jeSorte = sorten.map((s) => new Set(s.merkmale.map((m) => m.merkmal)).size)
const summe = jeSorte.reduce((a, b) => a + b, 0)
const abdeckung = {}
for (const s of sorten) for (const id of new Set(s.merkmale.map((m) => m.merkmal))) abdeckung[id] = (abdeckung[id] ?? 0) + 1
const widerspruch = {}
for (const s of sorten) {
  const proMerkmal = {}
  for (const m of s.merkmale) (proMerkmal[m.merkmal] ??= new Set()).add(String(m.wert))
  for (const [id, w] of Object.entries(proMerkmal)) if (w.size > 1 && !merkmal[id]?.mehrfach) widerspruch[id] = (widerspruch[id] ?? 0) + 1
}

console.log(`Sorten: ${n}`)
console.log(`Akzessionen: ${sorten.reduce((a, s) => a + (s.akzessionen?.length ?? 0), 0)}`)
console.log(`Merkmalswerte gesamt: ${sorten.reduce((a, s) => a + s.merkmale.length, 0)}`)
console.log(`Verschiedene Merkmale je Sorte: Mittel ${(summe / n).toFixed(1)}, Min ${Math.min(...jeSorte)}, Max ${Math.max(...jeSorte)}`)
console.log(`Sorten mit Überblickstext: ${sorten.filter((s) => s.texte.some((t) => t.thema === 'ueberblick')).length}`)
console.log(`Sorten mit MUNQ: ${sorten.filter((s) => s.munq !== undefined).length}, mit mehreren Akzessionen: ${sorten.filter((s) => (s.akzessionen?.length ?? 0) > 1).length}`)
console.log(`Sorten mit Synonymen: ${sorten.filter((s) => s.synonyme.length).length}`)
console.log('\nAbdeckung je Merkmal (Sorten mit mindestens einem Wert; in Klammern: Sorten mit mehreren Werten)')
for (const m of MERKMALE) {
  if (!abdeckung[m.id]) continue
  const w = widerspruch[m.id] ? ` (${widerspruch[m.id]})` : ''
  console.log(`  ${m.id.padEnd(26)} ${String(abdeckung[m.id]).padStart(5)}  ${(100 * abdeckung[m.id] / n).toFixed(1).padStart(5)} %${w}`)
}
console.log(`\nKatalogmerkmale ohne NFC-Wert: ${MERKMALE.filter((m) => !abdeckung[m.id]).map((m) => m.id).join(', ')}`)
console.log(`\nFehler: ${fehler.length}`)
for (const e of fehler.slice(0, 50)) console.log('  ' + e)
process.exit(fehler.length ? 1 : 0)
