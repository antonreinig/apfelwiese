// Führt die Sortendaten aller Quellen zusammen und schreibt die Dateien für die App:
//   public/sorten/index.json   Kurzfassung aller Sorten (Liste, 3D-Medaillons, Abgleich)
//   public/sorten/<id>.json    vollständige Sorte mit Belegen
//
//   node --experimental-strip-types scripts/baue-sorten.ts
//
// Eingaben (fehlende werden übersprungen), alle unter ../daten/:
//   de/sorten_de.json, de/quellen.json        deutsche Quellen (alte Pomologien, Wikipedia)
//   nfc/sorten_nfc.json, nfc/quellen.json     UK National Fruit Collection
//   bilder/bilder.json, bilder/aliase.json, bilder/farbmessung.json, bilder/quellen.json
//   de/anbau.json                             Anbaumerkmale und Herkunft aus den deutschen Sortentexten
//   ratgeber/regionen.json                    Regional- und Lokalsortenlisten der Länder
//   ratgeber/seltenheit.json                  Gefährdungseinstufungen
//   bilder/form3d.json                        3D-Form per Code an NFC-Fototafeln angepasst
//   bilder/abgleich_hand.json                 Feinabstimmung von Hand nach Sichtvergleich
//   bilder/falsche_bilder.json                Bilder, die eine andere Sorte zeigen (ausgelassen)

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type { Sorte, Quelle, SortenEintrag, Sortenbild, Farbmessung, Merkmalswert, Beleg, Regionszuordnung, Bildabgleich } from '../src/daten/sorte.ts'
import { MERKMAL_NACH_ID, auspraegungLabel } from '../src/daten/merkmalskatalog.ts'
import { darstellungAus, zusammenfassen, STANDARD } from '../src/apfel3d/darstellung.ts'

const DATEN = join(import.meta.dirname, '../../daten')
const ZIEL = join(import.meta.dirname, '../public/sorten')

const lies = <T,>(p: string, sonst: T): T => {
  const f = join(DATEN, p)
  if (!existsSync(f)) { console.log(`  (fehlt: ${p})`); return sonst }
  return JSON.parse(readFileSync(f, 'utf8')) as T
}

export function normalisiere(t: string) {
  return t
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`´.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ------------------------------------------------------------------ Laden

// Deutsche Quellen: Endergebnis, sonst die schon fertigen Arbeitsstapel des Recherche-Agenten
let de = lies<Sorte[]>('de/sorten_de.json', [])
const stapelOrdner = join(DATEN, 'de/arbeit/ergebnis')
const ausStapeln = !de.length && existsSync(stapelOrdner)
if (ausStapeln) {
  for (const f of readdirSync(stapelOrdner).filter((f) => /^stapel_\d+\.json$/.test(f)).sort()) {
    try { de.push(...(JSON.parse(readFileSync(join(stapelOrdner, f), 'utf8')) as Sorte[])) } catch { console.log(`  (unlesbar: ${f})`) }
  }
  console.log(`  deutsche Quellen aus ${de.length} Sorten in Arbeitsstapeln`)
}
const nfc = lies<Sorte[]>('nfc/sorten_nfc.json', [])
const bilder = lies<Record<string, { namen: string[]; bilder: Sortenbild[] }>>('bilder/bilder.json', {})
// Bilder, die nachweislich eine andere Sorte zeigen (URL → Grund); weder angezeigt noch gemessen
const falscheBilder = lies<Record<string, string>>('bilder/falsche_bilder.json', {})
const bildAliase = lies<Record<string, string>>('bilder/aliase.json', {})
const farbmessungen = lies<Record<string, Farbmessung[]>>('bilder/farbmessung.json', {})
const quellen = new Map<string, Quelle>()
for (const p of ['nfc/quellen.json', 'de/quellen.json', 'bilder/quellen.json']) for (const q of lies<Quelle[]>(p, [])) quellen.set(q.id, q)
if (ausStapeln) for (const f of readdirSync(stapelOrdner).filter((f) => /_quellen\.json$/.test(f))) {
  try { for (const q of JSON.parse(readFileSync(join(stapelOrdner, f), 'utf8')) as Quelle[]) if (!quellen.has(q.id)) quellen.set(q.id, q) } catch { /* unvollständig */ }
}
console.log(`Eingang: ${de.length} deutsche, ${nfc.length} NFC-Sorten, ${Object.keys(bilder).length} Bildeinträge, ${quellen.size} Quellen`)

// ------------------------------------------------------------------ Zusammenführen

const sorten = new Map<string, Sorte>()
const alias = new Map<string, string>() // normalisierter Name → Sorten-ID
const nachMunq = new Map<number, string>()

const namenVon = (s: Sorte) => [s.name, ...s.synonyme.map((x) => x.name)]

function registriere(s: Sorte) {
  for (const n of namenVon(s)) { const k = normalisiere(n); if (k && !alias.has(k)) alias.set(k, s.id) }
  if (s.munq) nachMunq.set(s.munq, s.id)
}

function freieId(id: string) {
  let k = id, i = 2
  while (sorten.has(k)) k = `${id}-${i++}`
  return k
}

function zusammenfuehren(ziel: Sorte, neu: Sorte) {
  const bekannt = new Set(namenVon(ziel).map(normalisiere))
  for (const n of [{ name: neu.name }, ...neu.synonyme]) {
    if (!bekannt.has(normalisiere(n.name))) { ziel.synonyme.push(n); bekannt.add(normalisiere(n.name)) }
  }
  ziel.munq ??= neu.munq
  ziel.akzessionen = [...(ziel.akzessionen ?? []), ...(neu.akzessionen ?? [])]
  ziel.herkunft ??= neu.herkunft
  ziel.merkmale.push(...neu.merkmale)
  const hatUeberblick = ziel.texte.some((t) => t.thema === 'ueberblick')
  for (const t of neu.texte) {
    if (t.thema === 'ueberblick' && hatUeberblick) ziel.texte.push({ ...t, thema: 'frucht', text: `Nach den Erhebungen der National Fruit Collection: ${t.text.charAt(0).toLowerCase()}${t.text.slice(1)}` })
    else ziel.texte.push(t)
  }
  ziel.bilder.push(...neu.bilder)
  ziel.farbmessung = [...(ziel.farbmessung ?? []), ...(neu.farbmessung ?? [])]
}

const ausDe = new Map<string, string>() // ID in sorten_de.json → ID in der App
for (const s of de) {
  const kopie: Sorte = structuredClone(s)
  kopie.id = freieId(normalisiere(kopie.id || kopie.name))
  sorten.set(kopie.id, kopie)
  ausDe.set(s.id, kopie.id)
  registriere(kopie)
}
let zusammen = 0
for (const s of nfc) {
  const treffer = (s.munq && nachMunq.get(s.munq)) || namenVon(s).map((n) => alias.get(normalisiere(n))).find(Boolean)
  if (treffer) { zusammenfuehren(sorten.get(treffer)!, structuredClone(s)); zusammen++; continue }
  const kopie: Sorte = structuredClone(s)
  kopie.id = freieId(normalisiere(kopie.id || kopie.name))
  sorten.set(kopie.id, kopie)
  registriere(kopie)
}
console.log(`Zusammengeführt: ${zusammen} NFC-Sorten in vorhandene Einträge, ${sorten.size} Sorten insgesamt`)

// Bilder und Farbmessungen über alle Namen zuordnen
let mitBild = 0, mitFarbe = 0
for (const s of sorten.values()) {
  const schluessel = new Set<string>()
  for (const n of namenVon(s)) {
    const k = normalisiere(n)
    schluessel.add(k)
    if (bildAliase[k]) schluessel.add(bildAliase[k])
  }
  const urls = new Set(s.bilder.map((b) => b.url))
  for (const k of schluessel) {
    for (const b of bilder[k]?.bilder ?? []) {
      const url = b.url.split('?')[0]
      if (!urls.has(url) && !falscheBilder[url]) { s.bilder.push({ ...b, url }); urls.add(url) }
    }
    for (const f of farbmessungen[k] ?? []) {
      s.farbmessung ??= []
      if (!falscheBilder[f.bild.split('?')[0]] && !s.farbmessung.some((x) => x.bild === f.bild)) s.farbmessung.push({ ...f, bild: f.bild.split('?')[0] })
    }
  }
  if (s.bilder.length) mitBild++
  if (s.farbmessung?.length) mitFarbe++
}
console.log(`Mit Bild: ${mitBild}, mit Farbmessung: ${mitFarbe}`)

// ------------------------------------------------------------------ Bildabgleich (3D-Form an Fotos)

// Nur Anpassungen mit kleiner Umrissabweichung übernehmen (Anteil der Breite)
const GUETE_GRENZE = 0.035
const form3d = lies<Record<string, Omit<Bildabgleich, 'hand'> & { seiten?: number; richtung_sicher?: boolean; roh?: unknown }>>('bilder/form3d.json', {})
const hand = lies<Record<string, { werte: Record<string, unknown>; anmerkung: string; datum: string; bild?: string }>>('bilder/abgleich_hand.json', {})
let angeglichen = 0
for (const s of sorten.values()) {
  const schluessel = new Set<string>()
  for (const n of namenVon(s)) { const k = normalisiere(n); schluessel.add(k); if (bildAliase[k]) schluessel.add(bildAliase[k]) }
  const k = [s.id, ...schluessel].find((x) => form3d[x] && (form3d[x].guete ?? 1) <= GUETE_GRENZE)
  if (k) {
    // Messrohwerte bleiben in form3d.json (zum Kalibrieren), in die App kommt nur das Ergebnis
    const { seiten: _s, richtung_sicher: _r, roh: _roh, ...f } = form3d[k]
    s.bildabgleich = { ...f }
  }
  const h = hand[s.id]
  if (h) {
    s.bildabgleich = s.bildabgleich ?? { bild: h.bild ?? '', verfahren: 'Sichtvergleich von Hand', werte: {} }
    s.bildabgleich.hand = { werte: h.werte, anmerkung: h.anmerkung, datum: h.datum }
  }
  if (s.bildabgleich) angeglichen++
}
console.log(`Bildabgleich: ${angeglichen} Sorten (Umrissabweichung höchstens ${(GUETE_GRENZE * 100).toFixed(1)} % der Breite)`)

// ------------------------------------------------------------------ Anbau, Herkunft, Regionen, Seltenheit

interface AnbauEintrag {
  id: string
  merkmale: { merkmal: string; wert: string; original: string; thema: string; quelle?: string }[]
  herkunft?: {
    land?: string; sicher?: boolean; regionen?: string[]; ort?: string; jahr?: number
    verbreitung?: { region: string; original: string }[]; selten?: { original: string; thema?: string } | null
  }
}
const anbau = lies<AnbauEintrag[]>('de/anbau.json', [])
let anbauWerte = 0
for (const a of anbau) {
  const s = sorten.get(ausDe.get(a.id) ?? '')
  const quelleDe = de.find((x) => x.id === a.id)
  if (!s || !quelleDe) { console.log(`  Anbau: unbekannte Sorte ${a.id}`); continue }
  const herkunftBelege = [...(quelleDe.herkunft?.belege ?? []), ...quelleDe.texte.filter((t) => t.thema === 'herkunft').flatMap((t) => t.belege)]
  for (const w of a.merkmale) {
    const text = quelleDe.texte.find((t) => t.thema === w.thema && t.text.includes(w.original))
    if (!text) { console.log(`  Anbau: Ausschnitt nicht im Text (${a.id}, ${w.merkmal}): ${w.original}`); continue }
    const genannt = w.quelle ? text.belege.filter((b) => b.quelle === w.quelle) : []
    const belege = genannt.length ? genannt : text.belege
    if (s.merkmale.some((x) => x.merkmal === w.merkmal && String(x.wert) === w.wert && belege.some((b) => b.quelle === x.quelle))) continue
    s.merkmale.push({ merkmal: w.merkmal, wert: w.wert, original: w.original, ...belege[0], ...(belege.length > 1 ? { belege } : {}) })
    anbauWerte++
  }
  const h = a.herkunft
  if (h && s.herkunft) {
    if (h.land) { s.herkunft.land = h.land; s.herkunft.landSicher = h.sicher !== false }
    if (h.ort) s.herkunft.ort = h.ort
    if (h.jahr) s.herkunft.jahr = h.jahr
    for (const r of h.regionen ?? []) (s.regionen ??= []).push({ region: r, art: 'herkunft', belege: herkunftBelege })
    for (const v of h.verbreitung ?? []) (s.regionen ??= []).push({ region: v.region, art: 'verbreitung', belege: herkunftBelege, original: v.original })
  }
  if (h?.selten) {
    const thema = h.selten.thema
    const belege = thema ? quelleDe.texte.filter((t) => t.thema === thema && t.text.includes(h.selten!.original)).flatMap((t) => t.belege) : herkunftBelege
    ;(s.gefaehrdung ??= []).push({ stufe: 'selten', belege: belege.length ? belege : herkunftBelege, original: h.selten.original })
  }
}
if (anbau.length) console.log(`Anbau: ${anbauWerte} Werte aus ${anbau.length} Sortentexten`)

/** Externe Listen (Ratgeber-Recherche): Quellen mit eigenem Präfix, Sorten über ihre ID in der App */
interface ListenQuelle { id: string; titel: string; herausgeber?: string; url?: string; abgerufen?: string; anmerkung?: string }
function listenQuellen(qs: ListenQuelle[]) {
  for (const q of qs) quellen.set(`rg_${q.id}`, { id: `rg_${q.id}`, werk: q.titel, autor: q.herausgeber, url: q.url, abgerufen: q.abgerufen, anmerkung: q.anmerkung, lizenz: '' })
}
const regionen = lies<{ quellen: ListenQuelle[]; zuordnungen: { sorte: string; name_in_quelle?: string; region: string; art: Regionszuordnung['art']; quelle: string; seite?: string }[] }>('ratgeber/regionen.json', { quellen: [], zuordnungen: [] })
listenQuellen(regionen.quellen)
for (const z of regionen.zuordnungen) {
  const s = sorten.get(z.sorte)
  if (!s) { console.log(`  Regionen: unbekannte Sorte ${z.sorte}`); continue }
  const beleg: Beleg = { quelle: `rg_${z.quelle}`, ...(z.seite ? { seite: z.seite } : {}) }
  const da = s.regionen?.find((r) => r.region === z.region && r.art === z.art)
  if (da) { if (!da.belege.some((b) => b.quelle === beleg.quelle)) da.belege.push(beleg) }
  else (s.regionen ??= []).push({ region: z.region, art: z.art, belege: [beleg], original: z.name_in_quelle })
}
const seltenheit = lies<{ quellen: ListenQuelle[]; einstufungen: { sorte: string; name_in_quelle?: string; stufe: string; quelle: string; seite?: string }[] }>('ratgeber/seltenheit.json', { quellen: [], einstufungen: [] })
listenQuellen(seltenheit.quellen)
for (const e of seltenheit.einstufungen) {
  const s = sorten.get(e.sorte)
  if (!s) { console.log(`  Seltenheit: unbekannte Sorte ${e.sorte}`); continue }
  ;(s.gefaehrdung ??= []).push({ stufe: e.stufe, belege: [{ quelle: `rg_${e.quelle}`, ...(e.seite ? { seite: e.seite } : {}) }], original: e.name_in_quelle })
}
console.log(`Regionen: ${[...sorten.values()].filter((s) => s.regionen?.length).length} Sorten, Seltenheit: ${[...sorten.values()].filter((s) => s.gefaehrdung?.length).length} Sorten`)

// ------------------------------------------------------------------ Prüfen

let fehler = 0
for (const s of sorten.values()) {
  s.merkmale = s.merkmale.filter((w: Merkmalswert) => {
    const m = MERKMAL_NACH_ID[w.merkmal]
    const ok = m && (m.typ === 'messwert' || m.typ === 'anzahl' || m.typ === 'text' || m.auspraegungen?.some((a) => a.code === String(w.wert)))
    if (!ok) fehler++
    return ok
  })
}
if (fehler) console.log(`Verworfen: ${fehler} Merkmalswerte mit unbekannter ID oder unbekanntem Code`)

// ------------------------------------------------------------------ Index

const ABGLEICH = new Set([
  'frucht_breite', 'frucht_groesse', 'frucht_hoehe_breite', 'frucht_form', 'schale_grundfarbe', 'schale_deckfarbe_anteil',
  'schale_deckfarbe_farbton', 'schale_deckfarbe_art', 'schale_berostung_wangen', 'schale_berostung_gesamt', 'schale_berostung_stielgrube',
  'schale_lentizellen_anzahl', 'fleisch_farbe', 'kernhaus_form', 'kernfaecher_oeffnung', 'kelchhoehle_form', 'pflueckreife',
  'genussreife_ende', 'geschmack_suesse', 'geschmack_saeure', 'fleisch_festigkeit', 'fleisch_saftigkeit', 'kerne_anzahl',
  'aroma_noten', 'aroma_staerke', 'duft_noten', 'duft_staerke', 'schale_beschaffenheit', 'schale_lentizellen_art', 'kelch_offenheit',
  'kernhaus_lage', 'kernhaus_achse', 'stiel_laenge', 'genussreife_beginn', 'kernhaus_breite_mm', 'kernhaus_hoehe_mm', 'bluete_zeit',
  // Ratgeber und Erkunden
  'verwendung', 'baum_wuchs', 'ploidie', 'lagerfaehigkeit', 'bluete_frost', 'ertrag_beginn', 'ertrag_alternanz', 'gesundheit',
  'anfaelligkeit_schorf', 'anfaelligkeit_mehltau', 'anfaelligkeit_krebs', 'standort_klima', 'standort_boden', 'standort_feuchte', 'hochstamm',
])
// Werke vor 1950 ohne einzelnes Erscheinungsjahr (Sammlungen über mehrere Jahrzehnte)
const VOR_1950 = new Set(['pomologische-monatshefte', 'usda-pomological', 'pomological-magazine'])
/** Kurzbezeichnung für Listen: externe Einstufung vor der Aussage im Sortentext */
function kurzeStufe(s: Sorte) {
  const stufen = (s.gefaehrdung ?? []).map((g) => g.stufe)
  if (stufen.some((x) => /Rote Liste/.test(x))) return 'Rote Liste'
  if (stufen.some((x) => /Arche/.test(x))) return 'Arche des Geschmacks'
  return stufen[0]
}
const REGION_ART = { herkunft: 'h', regionalsorte: 'r', empfehlung: 'e', verbreitung: 'v' } as const
const SCHNITT = new Set(['kernhaus', 'kerne', 'kelch'])
const KURZMONAT = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

const ersterWert = (s: Sorte, id: string) => s.merkmale.find((w) => w.merkmal === id)?.wert

/** Rang der Bildart: standardisierte NFC-Fotos zuerst, dann andere Fotos, zuletzt Aquarelle und Tafeln */
function rang(f: Farbmessung) {
  if (/nfc/i.test(f.methode)) return 0
  if (/foto/i.test(f.methode)) return 1
  return 2
}

function mischeHex(l: string[]) {
  const c = l.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)))
  return '#' + [0, 1, 2].map((k) => Math.round(c.reduce((s, x) => s + x[k], 0) / c.length).toString(16).padStart(2, '0')).join('')
}

// Zielfarbe des Fruchtfleischs je Katalogcode (für den Weißabgleich der Fotos)
const FLEISCH_ZIEL: Record<string, string> = {
  weiss: '#f4efe0', cremeweiss: '#f1e7c8', gelblich: '#eedb9e', gruenlich: '#e2e6bd', roetlich: '#eec6b5',
}
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const hexAus = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

/**
 * Weißabgleich einer Fotomessung am Fruchtfleisch: Die Schnittflächen sind fast weiß bis cremefarben.
 * Belichtung und Farbstich des Fotos werden so aus Schalen-, Deck- und Rostfarbe herausgerechnet.
 */
function abgleichen(f: Farbmessung, fleischCode?: string): Farbmessung {
  if (!f.fleischfarbe || !/foto/i.test(f.methode)) return f
  const ist = rgb(f.fleischfarbe)
  const soll = rgb(FLEISCH_ZIEL[fleischCode ?? ''] ?? FLEISCH_ZIEL.cremeweiss)
  const faktor = ist.map((v, k) => Math.max(0.85, Math.min(1.8, soll[k] / Math.max(30, v))))
  const korr = (h?: string) => (h ? hexAus(rgb(h).map((v, k) => v * faktor[k])) : undefined)
  return { ...f, grundfarbe: korr(f.grundfarbe), deckfarbe: korr(f.deckfarbe), rostfarbe: korr(f.rostfarbe), fleischfarbe: hexAus(soll) }
}

/** Mittel über alle Messungen der besten verfügbaren Bildart */
function farbmessungWahl(s: Sorte): Farbmessung | undefined {
  const fleischCode = zusammenfassen(s.merkmale).find((w) => w.merkmal === 'fleisch_farbe')?.wert as string | undefined
  const l = (s.farbmessung ?? []).map((f) => abgleichen(f, fleischCode))
  if (!l.length) return undefined
  const best = Math.min(...l.map(rang))
  const g = l.filter((f) => rang(f) === best)
  const feld = <K extends 'grundfarbe' | 'deckfarbe' | 'rostfarbe' | 'fleischfarbe'>(k: K) => {
    const w = g.map((f) => f[k]).filter((x): x is string => typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x))
    return w.length ? mischeHex(w) : undefined
  }
  const anteile = g.map((f) => f.deckfarbeAnteil).filter((x): x is number => typeof x === 'number')
  const verhaeltnisse = l.filter((f) => rang(f) <= 1).map((f) => f.hoeheZuBreite).filter((x): x is number => typeof x === 'number' && x > 0.5 && x < 1.5)
  return {
    hoeheZuBreite: verhaeltnisse.length ? verhaeltnisse.reduce((a, b) => a + b, 0) / verhaeltnisse.length : undefined,
    bild: g[0].bild,
    methode: g[0].methode,
    grundfarbe: feld('grundfarbe'),
    deckfarbe: feld('deckfarbe'),
    // Rost wird in den Fotos nicht belastbar erkannt (Bericht der Bildmessung, Spearman 0,15): weglassen
    rostfarbe: undefined,
    fleischfarbe: feld('fleischfarbe'),
    deckfarbeAnteil: anteile.length ? anteile.reduce((a, b) => a + b, 0) / anteile.length : undefined,
  }
}

function kurz(s: Sorte) {
  const t = s.texte.find((x) => x.thema === 'ueberblick')?.text
  if (!t) return undefined
  const satz = t.split(/(?<=\.)\s/)[0]
  return satz.length <= 110 ? satz : satz.slice(0, 107).replace(/\s\S*$/, '') + ' …'
}

const eintraege: SortenEintrag[] = []
for (const s of sorten.values()) {
  const f = farbmessungWahl(s)
  const { p, belegt } = darstellungAus(zusammenfassen(s.merkmale), f, 1)
  const darstellung: Record<string, unknown> = {}
  for (const k of belegt) if (JSON.stringify(p[k]) !== JSON.stringify(STANDARD[k])) darstellung[k] = p[k]
  // Werte aus dem Bildabgleich gehen vor (Form aus dem Foto, dann Feinabstimmung von Hand).
  // Ausnahme Rippung: Die Stielansicht zeigt nur den Umriss am Äquator, Rippen sitzen meist zum Kelch hin;
  // gemessen trennt sie die Klassen schwach (Median 0,16 / 0,36 / 0,43 bei Stufe 1 / 5 / 7). Eine Angabe
  // aus der Sortenbeschreibung bleibt daher maßgeblich.
  if (s.bildabgleich) {
    const foto = Object.fromEntries(Object.entries(s.bildabgleich.werte).filter(([k]) => !(k === 'rippung' && belegt.has('rippung'))))
    Object.assign(darstellung, foto, s.bildabgleich.hand?.werte ?? {})
  }
  // Ohne Angabe zum Anteil: Streifen deuten auf eine größere Fläche, ein bekannter Farbton auf etwas Rot
  if (!belegt.has('deckfarbeAnteil')) darstellung.deckfarbeAnteil = belegt.has('deckfarbeArt') && p.deckfarbeArt.some((a) => a !== 'verwaschen') ? 0.35 : belegt.has('deckfarbe') ? 0.15 : 0

  const m: Record<string, (string | number)[]> = {}
  for (const w of s.merkmale) {
    if (!ABGLEICH.has(w.merkmal)) continue
    m[w.merkmal] ??= []
    if (!m[w.merkmal].includes(w.wert)) m[w.merkmal].push(w.wert)
  }
  const beginn = Number(ersterWert(s, 'genussreife_beginn') ?? ersterWert(s, 'pflueckreife'))
  const ende = Number(ersterWert(s, 'genussreife_ende'))
  const genuss: number[] = []
  if (beginn) {
    const bis = ende || beginn
    for (let k = beginn, n = 0; n < 12; k = (k % 12) + 1, n++) { genuss.push(k); if (k === bis) break }
  }
  const reife = beginn && ende && ende !== beginn
    ? `${KURZMONAT[beginn]}–${KURZMONAT[ende]}`
    : ersterWert(s, 'pflueckreife') ? `pflückreif ${auspraegungLabel('pflueckreife', ersterWert(s, 'pflueckreife')!)}` : undefined
  const fruchtbild = s.bilder.find((b) => b.art === 'frucht') ?? s.bilder[0]
  // Älteste Beschreibung oder Abbildung in einem datierten Werk
  const belegQuellen = new Set([...s.merkmale.map((w) => w.quelle), ...s.texte.flatMap((t) => t.belege.map((b) => b.quelle)), ...s.bilder.map((b) => b.quelle)])
  const jahre = [...belegQuellen].map((q) => quellen.get(q)?.jahr).filter((j): j is number => typeof j === 'number' && j < 1950)
  const beschrieben = jahre.length ? Math.min(...jahre) : undefined
  const jahr = s.herkunft?.jahr
  const alt = (jahr !== undefined && jahr < 1950) || beschrieben !== undefined || [...belegQuellen].some((q) => VOR_1950.has(q))
  const regionenKurz = [...new Set((s.regionen ?? []).map((r) => `${r.region}:${REGION_ART[r.art]}`))]
  eintraege.push({
    id: s.id,
    name: s.name,
    synonyme: s.synonyme.map((x) => x.name).filter((n) => n !== s.name).slice(0, 8),
    darstellung,
    reife,
    kurz: kurz(s),
    bild: fruchtbild?.url,
    hatBild: s.bilder.length > 0,
    anzahlMerkmale: new Set(s.merkmale.map((w) => w.merkmal)).size,
    schnitt: s.merkmale.some((w) => SCHNITT.has(MERKMAL_NACH_ID[w.merkmal]?.gruppe ?? '') || w.merkmal === 'kelchhoehle_form'),
    genuss: genuss.length ? genuss : undefined,
    ausfuehrlich: s.texte.length >= 4 && new Set(s.texte.flatMap((t) => t.belege.map((b) => b.quelle))).size >= 2,
    m,
    ...(s.herkunft?.land && s.herkunft.landSicher !== false ? { land: s.herkunft.land } : {}),
    ...(regionenKurz.length ? { regionen: regionenKurz } : {}),
    ...(jahr ? { jahr } : {}),
    ...(beschrieben ? { beschrieben } : {}),
    ...(alt ? { alt } : {}),
    ...(s.gefaehrdung?.length ? { selten: kurzeStufe(s) } : {}),
    ...(s.bildabgleich ? { angeglichen: true } : {}),
  })
}
// Alphabetisch; Zuchtnummern und Namen, die mit Ziffern beginnen, ans Ende
const ziffer = (n: string) => /^[0-9]/.test(n) ? 1 : 0
eintraege.sort((a, b) => ziffer(a.name) - ziffer(b.name) || a.name.localeCompare(b.name, 'de'))

// ------------------------------------------------------------------ Schreiben

if (existsSync(ZIEL)) for (const f of readdirSync(ZIEL)) rmSync(join(ZIEL, f))
mkdirSync(ZIEL, { recursive: true })
const genutzt = new Set<string>()
for (const s of sorten.values()) {
  for (const w of s.merkmale) { genutzt.add(w.quelle); w.belege?.forEach((b) => genutzt.add(b.quelle)) }
  for (const r of s.regionen ?? []) r.belege.forEach((b) => genutzt.add(b.quelle))
  for (const g of s.gefaehrdung ?? []) g.belege.forEach((b) => genutzt.add(b.quelle))
  for (const t of s.texte) for (const b of t.belege) genutzt.add(b.quelle)
  for (const b of s.bilder) genutzt.add(b.quelle)
  s.herkunft?.belege.forEach((b) => genutzt.add(b.quelle))
  writeFileSync(join(ZIEL, `${s.id}.json`), JSON.stringify(s))
}
const unbekannt = [...genutzt].filter((q) => !quellen.has(q))
if (unbekannt.length) console.log(`Warnung: Belege ohne Quelleneintrag: ${unbekannt.join(', ')}`)
const index = {
  stand: new Date().toISOString().slice(0, 10),
  anzahl: eintraege.length,
  sorten: eintraege,
  quellen: [...quellen.values()].filter((q) => genutzt.has(q.id)),
}
writeFileSync(join(ZIEL, 'index.json'), JSON.stringify(index))
const groesse = readFileSync(join(ZIEL, 'index.json')).length
console.log(`Geschrieben: ${eintraege.length} Sorten, index.json ${(groesse / 1024).toFixed(0)} KB, ${index.quellen.length} Quellen`)
