// Wege in die Sortendatenbank: Apfel des Tages, Sammlungen, Region, Seltenheit, Reifekalender.
// Alles aus den belegten Werten im Index (SortenEintrag.m und Zusatzfelder), nichts geschätzt.

import type { SortenEintrag } from './sorte.ts'
import { NACHBARN } from './einstellungen.ts'

export const MONATSNAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

const hat = (s: SortenEintrag, merkmal: string, ...codes: string[]) => (s.m?.[merkmal] ?? []).some((w) => codes.includes(String(w)))
const zahl = (s: SortenEintrag, merkmal: string) => s.m?.[merkmal]?.find((w) => typeof w === 'number') as number | undefined
const namen = (s: SortenEintrag) => [s.name, ...s.synonyme].join(' | ').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// ------------------------------------------------------------------ Apfel des Tages

/** Einfacher, stabiler Zufall aus einer Zahl (mulberry32) */
function zufall(saat: number) {
  let a = saat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function tagesnummer(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

/** Ein Apfel je Kalendertag, für alle gleich; bevorzugt gut beschriebene Sorten mit Bild */
export function apfelDesTages(sorten: SortenEintrag[], tag = tagesnummer()): SortenEintrag | undefined {
  const gut = sorten.filter((s) => s.hatBild && (s.ausfuehrlich || s.anzahlMerkmale >= 12))
  const auswahl = gut.length ? gut : sorten
  if (!auswahl.length) return undefined
  return auswahl[Math.floor(zufall(tag)() * auswahl.length)]
}

/** Zufällige Sorte, die nicht `ausser` ist */
export function zufaelligeSorte(sorten: SortenEintrag[], ausser?: string): SortenEintrag | undefined {
  const l = sorten.filter((s) => s.id !== ausser && s.hatBild)
  return l[Math.floor(Math.random() * l.length)]
}

// ------------------------------------------------------------------ Reife

export function genussreifIm(s: SortenEintrag, monat: number) {
  return !!s.genuss?.includes(monat)
}

/** Anzahl genussreifer Sorten je Monat (Index 0 = Januar) */
export function reifekalender(sorten: SortenEintrag[]) {
  const n = new Array(12).fill(0)
  for (const s of sorten) for (const m of s.genuss ?? []) n[m - 1]++
  return n as number[]
}

// ------------------------------------------------------------------ Region

export type Regionsart = 'h' | 'r' | 'e' | 'v'
export const REGIONSART: Record<Regionsart, string> = {
  h: 'hier entstanden',
  r: 'Regionalsorte',
  e: 'für den Streuobstbau empfohlen',
  v: 'hier verbreitet',
}

/** Zuordnungen einer Sorte zu einem Bundesland */
export function regionsarten(s: SortenEintrag, region: string): Regionsart[] {
  return (s.regionen ?? []).filter((r) => r.startsWith(region + ':')).map((r) => r.slice(region.length + 1) as Regionsart)
}

/**
 * Sorten einer Region: zuerst dort entstandene und gelistete Regionalsorten, dann Empfehlungen und Verbreitung,
 * danach Sorten der Nachbarländer.
 */
export function regionSorten(sorten: SortenEintrag[], region: string) {
  const rang = (arten: Regionsart[]) => Math.min(...arten.map((a) => ({ h: 0, r: 1, e: 2, v: 3 })[a]))
  const eigene = sorten
    .map((s) => ({ s, arten: regionsarten(s, region) }))
    .filter((x) => x.arten.length)
    .sort((a, b) => rang(a.arten) - rang(b.arten) || a.s.name.localeCompare(b.s.name, 'de'))
  const gesehen = new Set(eigene.map((x) => x.s.id))
  const nachbarn = sorten
    .filter((s) => !gesehen.has(s.id) && (NACHBARN[region] ?? []).some((n) => regionsarten(s, n).some((a) => a === 'h' || a === 'r')))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
  return { eigene, nachbarn }
}

// ------------------------------------------------------------------ Sammlungen

export interface Sammlung {
  id: string
  gruppe: 'thema' | 'familie' | 'farbe'
  titel: string
  text: string
  /** Farbe des Kärtchens (Schalenfarbe, für Farbsammlungen) */
  farbe?: string
  filter: (s: SortenEintrag) => boolean
  /** Reihenfolge, sonst alphabetisch */
  sortiere?: (a: SortenEintrag, b: SortenEintrag) => number
}

export const SAMMLUNGEN: Sammlung[] = [
  { id: 'alt', gruppe: 'thema', titel: 'Alte Sorten', text: 'Entstanden oder beschrieben vor 1950.', filter: (s) => !!s.alt, sortiere: (a, b) => (a.jahr ?? a.beschrieben ?? 9999) - (b.jahr ?? b.beschrieben ?? 9999) },
  { id: 'pomologien', gruppe: 'thema', titel: 'Aus alten Pomologien', text: 'Beschrieben oder abgebildet in Werken des 19. Jahrhunderts.', filter: (s) => (s.beschrieben ?? 9999) < 1900, sortiere: (a, b) => a.beschrieben! - b.beschrieben! },
  { id: 'deutschland', gruppe: 'thema', titel: 'In Deutschland entstanden', text: 'Laut Herkunftsangabe der Quellen.', filter: (s) => s.land === 'DE' },
  { id: 'lager', gruppe: 'thema', titel: 'Lageräpfel bis ins Frühjahr', text: 'Genussreif bis März oder länger.', filter: (s) => hat(s, 'genussreife_ende', '3', '4', '5', '6') || hat(s, 'lagerfaehigkeit', '7') },
  { id: 'sommer', gruppe: 'thema', titel: 'Sommeräpfel', text: 'Pflückreif im Juli oder August, am besten direkt vom Baum.', filter: (s) => hat(s, 'pflueckreife', '7', '8') },
  { id: 'robust', gruppe: 'thema', titel: 'Robust und gesund', text: 'Laut Quellen gesund oder wenig anfällig für Schorf.', filter: (s) => (hat(s, 'gesundheit', '7') || hat(s, 'anfaelligkeit_schorf', '3')) && !hat(s, 'anfaelligkeit_schorf', '7') },
  { id: 'raue-lagen', gruppe: 'thema', titel: 'Für raue Lagen', text: 'Gedeiht auch in Höhenlagen oder hat eine wenig frostempfindliche Blüte.', filter: (s) => hat(s, 'standort_klima', '3') || hat(s, 'bluete_frost', '3') },
  { id: 'hochstamm', gruppe: 'thema', titel: 'Für Wiese und Hochstamm', text: 'Von den Quellen für Streuobst, Straßen oder Feld empfohlen.', filter: (s) => hat(s, 'hochstamm', 'gut') },
  { id: 'most', gruppe: 'thema', titel: 'Saft und Most', text: 'Traditionell für Saft, Most oder Cidre genutzt.', filter: (s) => hat(s, 'verwendung', 'most') },
  { id: 'kueche', gruppe: 'thema', titel: 'Küche und Backen', text: 'Für Kuchen, Mus und Bratäpfel.', filter: (s) => hat(s, 'verwendung', 'kueche') },
  { id: 'renetten', gruppe: 'familie', titel: 'Renetten', text: 'Eine große Gruppe würziger, oft berosteter Tafeläpfel.', filter: (s) => /\b(renette|reinette|reinet|reneta)/.test(namen(s)) },
  { id: 'kalvillen', gruppe: 'familie', titel: 'Kalvillen', text: 'Gerippte, oft duftende Äpfel mit zartem Fleisch.', filter: (s) => /(kalvill|calvill)/.test(namen(s)) },
  { id: 'parmaenen', gruppe: 'familie', titel: 'Parmänen und Peppings', text: 'Alte Gruppe kegelförmiger, würziger Äpfel.', filter: (s) => /(parmaene|pearmain|pepping)/.test(namen(s)) },
  { id: 'streiflinge', gruppe: 'familie', titel: 'Streiflinge und Rambure', text: 'Gestreifte Wirtschafts- und Tafeläpfel, oft große Bäume.', filter: (s) => /(streifling|rambur)/.test(namen(s)) },
  { id: 'riesen', gruppe: 'thema', titel: 'Riesen', text: 'Früchte mit mehr als 85 mm Durchmesser.', filter: (s) => (zahl(s, 'frucht_breite') ?? 0) >= 85, sortiere: (a, b) => zahl(b, 'frucht_breite')! - zahl(a, 'frucht_breite')! },
  { id: 'zwerge', gruppe: 'thema', titel: 'Kleine Äpfel', text: 'Früchte mit höchstens 55 mm Durchmesser.', filter: (s) => { const b = zahl(s, 'frucht_breite'); return b !== undefined && b <= 55 }, sortiere: (a, b) => zahl(a, 'frucht_breite')! - zahl(b, 'frucht_breite')! },
  { id: 'gestreift', gruppe: 'farbe', titel: 'Rot gestreift', farbe: 'repeating-linear-gradient(100deg,#c9b24a 0 5px,#a8322a 5px 9px)', text: 'Deckfarbe in Streifen oder geflammt.', filter: (s) => hat(s, 'schale_deckfarbe_art', 'gestreift', 'geflammt') },
  { id: 'rot', gruppe: 'farbe', titel: 'Fast ganz rot', farbe: '#9e2a22', text: 'Großer Anteil roter Deckfarbe.', filter: (s) => hat(s, 'schale_deckfarbe_anteil', '7', '9') && hat(s, 'schale_deckfarbe_farbton', 'rot', 'dunkelrot', 'braunrot', 'purpurrot') },
  { id: 'gelb', gruppe: 'farbe', titel: 'Gelb ohne Deckfarbe', farbe: '#d9bf45', text: 'Gelbe Schale ohne rote Backe.', filter: (s) => hat(s, 'schale_grundfarbe', 'gelb') && hat(s, 'schale_deckfarbe_anteil', '0') },
  { id: 'gruen', gruppe: 'farbe', titel: 'Grün', farbe: '#8fae4a', text: 'Grüne Grundfarbe, wenig Deckfarbe.', filter: (s) => hat(s, 'schale_grundfarbe', 'gruen', 'gelbgruen') && hat(s, 'schale_deckfarbe_anteil', '0', '1', '3') },
  { id: 'berostet', gruppe: 'farbe', titel: 'Berostet', farbe: '#9b7a4c', text: 'Rauer, bräunlicher Rost auf großen Teilen der Schale.', filter: (s) => hat(s, 'schale_berostung_gesamt', '7', '9') },
  { id: 'rotfleischig', gruppe: 'farbe', titel: 'Rötliches Fruchtfleisch', farbe: '#d98a86', text: 'Selten: Fleisch rosa bis rötlich.', filter: (s) => hat(s, 'fleisch_farbe', 'roetlich') },
  { id: 'triploid', gruppe: 'thema', titel: 'Triploide Sorten', text: 'Schlechte Pollenspender: brauchen zwei andere Sorten in der Nähe.', filter: (s) => hat(s, 'ploidie', 'triploid') },
  { id: 'selten', gruppe: 'thema', titel: 'Selten und erhaltenswert', text: 'Auf der Roten Liste der gefährdeten einheimischen Nutzpflanzen (BLE, Mai 2026), in der Arche des Geschmacks oder laut Sortentext selten.', filter: (s) => !!s.selten },
  { id: 'ausfuehrlich', gruppe: 'thema', titel: 'Ausführlich beschrieben', text: 'Mehrere Textabschnitte aus mindestens zwei Quellen.', filter: (s) => !!s.ausfuehrlich },
  { id: 'schnitt', gruppe: 'thema', titel: 'Mit Schnittmerkmalen', text: 'Kernhaus, Kelchhöhle oder Kerne beschrieben.', filter: (s) => !!s.schnitt },
]
export const SAMMLUNG_NACH_ID: Record<string, Sammlung> = Object.fromEntries(SAMMLUNGEN.map((s) => [s.id, s]))

export function sammlungAnwenden(sorten: SortenEintrag[], sm: Sammlung) {
  const l = sorten.filter(sm.filter)
  return sm.sortiere ? l.sort((a, b) => sm.sortiere!(a, b) || a.name.localeCompare(b.name, 'de')) : l
}

/** Kurzer Steckbrief: Reife, Herkunft, Alter */
export function steckbrief(s: SortenEintrag) {
  const t: string[] = []
  if (s.reife) t.push(s.reife)
  if (s.jahr) t.push(`um ${s.jahr}`)
  else if (s.beschrieben) t.push(`beschrieben ${s.beschrieben}`)
  return t.join(' · ')
}
