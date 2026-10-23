// Prozedurale Schalentextur: Grundfarbe, Deckfarbe (verwaschen, gestreift, geflammt …),
// Berostung, Schalenpunkte mit Hof. Dazu Rauheit und Relief für das Material.
// Textur-Layout: u = Umfang (0..1), v = Profil vom Kelch (unten) zum Stiel (oben).

import type { ApfelParameter } from './darstellung.ts'
import { texelMasse, grubenForm } from './geometrie.ts'

// --------------------------------------------------------------- Zufall und Rauschen

function zufall(saat: number) {
  let s = saat >>> 0 || 1
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 3D-Wertrauschen; auf einem Zylinder abgetastet ist es in u nahtlos */
function rauschen3(saat: number) {
  const perm = new Uint8Array(512)
  const r = zufall(saat)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]] }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const werte = new Float32Array(256).map(() => r())
  const h = (x: number, y: number, z: number) => werte[perm[perm[perm[x & 255] + (y & 255)] + (z & 255)]]
  const s = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
    const xf = s(x - xi), yf = s(y - yi), zf = s(z - zi)
    const l = (a: number, b: number, t: number) => a + (b - a) * t
    return l(
      l(l(h(xi, yi, zi), h(xi + 1, yi, zi), xf), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
      l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf),
      zf,
    )
  }
}

/** Fraktales Rauschen auf dem Zylinder: fu = Frequenz rund herum, fv = Frequenz entlang der Achse */
function feld(n: ReturnType<typeof rauschen3>, u: number, v: number, fu: number, fv: number, oktaven = 3) {
  let summe = 0, amp = 0.5, norm = 0
  const a = u * Math.PI * 2
  for (let o = 0; o < oktaven; o++) {
    const k = 2 ** o
    const rad = (fu * k) / (Math.PI * 2)
    summe += amp * n(Math.cos(a) * rad + 17.3 * o, Math.sin(a) * rad, v * fv * k)
    norm += amp
    amp *= 0.5
  }
  return summe / norm
}

const glatt = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function hexNachRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function leinwand(b: number, h: number) {
  const c = document.createElement('canvas')
  c.width = b
  c.height = h
  return c
}

/** Quantil einer Werteliste mit Gewichten (Flächenanteil je Zeile) */
function gewichtetesQuantil(werte: Float32Array, gewichte: Float32Array, anteil: number) {
  const idx = Array.from(werte.keys()).sort((a, b) => werte[b] - werte[a])
  let gesamt = 0
  for (const g of gewichte) gesamt += g
  let s = 0
  for (const i of idx) {
    s += gewichte[i]
    if (s >= anteil * gesamt) return werte[i]
  }
  return -Infinity
}

// --------------------------------------------------------------- Textur

/**
 * Musterwerte, die je Apfel aus der Saat streuen: zwei Äpfel derselben Sorte sehen ähnlich,
 * aber nie gleich aus, und verschiedene Sorten mit demselben Merkmal (etwa „gestreift“)
 * unterscheiden sich in Streifenbreite, Kontrast und Sprenkelung.
 */
export function musterWerte(saat: number) {
  const r = zufall(Math.floor(saat * 104729) + 7)
  const z = (a: number, b: number) => a + (b - a) * r()
  return {
    sonne: z(0.12, 0.38),           // Lage der Sonnenseite (u)
    sonnenBreite: z(0.75, 1.25),     // wie weit die Rötung um den Apfel greift
    wolken: z(2.6, 5.5),             // Größe der Wolken in der Rötung
    weich: z(0.07, 0.22),            // Übergang Rötung – Grundfarbe
    sprenkel: z(0.08, 0.42),         // Sprenkelung innerhalb der Rötung
    streifenFein: z(48, 90),         // Zahl feiner Streifen rund herum
    streifenGrob: z(14, 26),         // Zahl geflammter Bänder
    streifenStriche: z(2.5, 6),      // wie oft Streifen der Länge nach abreißen
    streifenDunkel: z(0.62, 0.86),   // Streifen dunkler als die Rötung
    streifenUnruhe: z(0.02, 0.07),   // Verzug der Streifen
    marmor: z(9, 18),
    fleckung: z(0.3, 0.85),          // Wolkigkeit der Grundfarbe
    gruenRest: z(0.15, 0.55),        // grünliche Partien in der Grundfarbe
    goldBacke: z(0, 0.35),             // goldgelbe bis orange Sonnenbacke bei Äpfeln ohne Rötung
    rostTon: z(0, 1),                // zimtbraun … graugrün-ocker
    rostStrahlen: z(30, 60),         // Feinheit der Rostausläufer aus der Stielgrube
    punkteStreuung: z(0.45, 1),      // wie ungleich groß die Schalenpunkte sind
    punkteKelch: z(0.25, 0.75),      // Häufung der Punkte zum Kelch hin
  }
}

export interface Schalenbilder {
  farbe: HTMLCanvasElement
  rauheit: HTMLCanvasElement
  relief: HTMLCanvasElement
  /** Wo die glänzende Wachsschicht liegt (weiß) und wo nicht (Rost, Schalenpunkte) */
  glanz: HTMLCanvasElement
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function schalenbilder(p: ApfelParameter, breite = 1024): Schalenbilder {
  const W = breite, H = breite / 2
  const rnd = zufall(p.saat * 7919 + 13)
  const n = rauschen3(p.saat)
  const n2 = rauschen3(p.saat + 101)
  const n3 = rauschen3(p.saat + 211)
  const m = musterWerte(p.saat)
  // kleine Texturen (Medaillons, etwa 300 Pixel): gröbere Masken und ohne die feinsten Lagen, die man dort nicht sieht
  const klein = W <= 512
  const halb = klein ? 4 : 2

  // Maße für die Masken auf kleinem Raster (wird beim Zeichnen hochskaliert)
  const mw = klein ? 128 : 256, mh = mw / 2
  const masse = texelMasse(p, mh)
  const flaeche = new Float32Array(mw * mh)
  for (let y = 0; y < mh; y++) {
    const t = 1 - (y + 0.5) / mh
    const i = Math.round(t * mh)
    const w = masse.umfang[i] * masse.bogen[i]
    for (let x = 0; x < mw; x++) flaeche[y * mw + x] = w
  }

  // ---- Lage in den Gruben: 1 tief in der Grube, 0 am Rand und außerhalb; Rand folgt der unregelmäßigen Grube
  const pr = texelMasse(p, 256).profil
  const sw = 0.1 + p.stielgrubeWeite * 0.28
  const kw = 0.1 + p.kelchgrubeWeite * 0.26
  /**
   * Abstand zur Grubenmitte relativ zum Grubenrand: 0 Mitte, 1 Rand. Der Rand folgt der
   * unregelmäßigen Grube nur in ihren groben Zügen (ohne die fünf Falten), dazu weiches Rauschen,
   * damit Färbungen an der Grube weder kreisrund noch sternförmig werden.
   */
  const grubenAbstand = (u: number, v: number) => {
    const q = pr[Math.min(256, Math.max(0, Math.round(v * 256)))]
    const phi = u * Math.PI * 2
    const stiel = q.y > 0
    const g = grubenForm(p, stiel ? 'stiel' : 'kelch', phi)
    const fuenf = (stiel ? 0.04 + 0.08 * p.rippung : 0.05 + 0.12 * p.kronung) * Math.cos(5 * phi + 0.4)
    const grob = 1 + (g.weite - 1 - fuenf) * 0.6 + (feld(n3, u, stiel ? 0.9 : 0.1, 3, 1, 2) - 0.5) * 0.3
    return { seite: stiel ? 'stiel' as const : 'kelch' as const, d: q.x / ((stiel ? sw : kw) * grob) }
  }

  const farbe = leinwand(W, H)
  const fc = farbe.getContext('2d')!
  const rau = leinwand(W, H)
  const rc = rau.getContext('2d')!
  const rel = leinwand(W, H)
  const lc = rel.getContext('2d')!
  const gl = leinwand(W, H)
  const gc = gl.getContext('2d')!

  // ---- Grundfarbe: wolkig, mit grünlichen Partien, zur Stielgrube grüner
  const [gr, gg, gb] = hexNachRgb(p.grundfarbe)
  fc.fillStyle = p.grundfarbe
  fc.fillRect(0, 0, W, H)
  // Rauheit: matte Schalen 0,66, wachsige 0,30; dazu leichte Schwankung (Abrieb, Wachs ungleich verteilt)
  const basisRau = 0.66 - p.glanz * 0.36
  rc.fillStyle = grau(basisRau)
  rc.fillRect(0, 0, W, H)
  lc.fillStyle = grau(0.5)
  lc.fillRect(0, 0, W, H)
  gc.fillStyle = grau(1)
  gc.fillRect(0, 0, W, H)

  zeichneMaske(fc, W / halb, H / halb, W, H, (u, v) => {
    const w = feld(n, u, v, 6, 5, 4)
    const w2 = feld(n3, u, v, 16, 13, 2)
    const { seite, d } = grubenAbstand(u, v)
    const strahlig = feld(n3, u, v * 0.2, 60, 2, 2) // feine Strahlen zur Grube hin
    // weich zur Grube hin grüner; Strahlen nur angedeutet (stärker wirkten sie neben NFC-Fotos wie Flecken)
    const grubeGruen = seite === 'stiel' ? (1 - glatt(0.45, 1.3 + w * 0.25 + strahlig * 0.1, d)) * 0.7 : 0.35 * (1 - glatt(0.3, 0.65, d))
    // Schattenseite etwas grüner als die Sonnenseite
    const schatten = 1 - (Math.cos((u - m.sonne) * Math.PI * 2) * 0.5 + 0.5)
    const gruen = Math.max(glatt(0.5, 0.68, w2) * m.gruenRest, grubeGruen * 0.75, glatt(0.55, 1, schatten) * 0.3 * (1 - p.deckfarbeAnteil))
    // Wolken: dunklere, olivgrüne und hellere, gelbere Partien (Fleckung der Grundfarbe)
    // weich auslaufend: mit harten Rändern sah die Fleckung wie ein Tarnmuster aus
    const t = Math.max(-1, Math.min(1, (w - 0.5) * 2)) * m.fleckung
    if (t < 0 || gruen > 0.05) {
      const a = Math.min(1, Math.max(-t, 0) * 0.5 + gruen * 0.8)
      return [gr * 0.76, gg * 0.86, gb * 0.6, a]
    }
    // hellere Partien im selben Farbton (sonst werden grüne Äpfel gelblich)
    return [Math.min(255, gr * 1.07 + 6), Math.min(255, gg * 1.07 + 6), Math.min(255, gb * 1.03 + 4), t * 0.45]
  })

  // goldgelbe bis orange Sonnenbacke bei gelben Äpfeln mit wenig Rot (Renetten, Ananasrenette)
  // nur bei gelben Grundfarben; auf grünen Äpfeln sähe eine orange Backe wie ein Fleck aus
  if (m.goldBacke > 0.05 && p.deckfarbeAnteil < 0.3 && farbton(gr, gg, gb) < 58) {
    zeichneMaske(fc, mw, mh, W, H, (u, v) => {
      const seite = Math.cos((u - m.sonne) * Math.PI * 2) * 0.5 + 0.5
      const w = feld(n2, u, v, 3, 3, 2)
      const a = glatt(0.45, 0.95, seite * 0.8 + w * 0.4) * m.goldBacke * glatt(0.1, 0.3, v) * glatt(0.95, 0.7, v)
      return [Math.min(255, gr * 1.02 + 12), gg * 0.78, gb * 0.45, a]
    })
  }

  // ---- Deckfarbe
  const deckA = new Float32Array(mw * mh) // Deckkraft der Rötung (für die Farbe der Schalenpunkte)
  if (p.deckfarbeAnteil > 0.01) {
    const basis = new Float32Array(mw * mh)
    for (let y = 0; y < mh; y++) {
      const v = 1 - (y + 0.5) / mh
      for (let x = 0; x < mw; x++) {
        const u = (x + 0.5) / mw
        // periodisch in u (sonst Naht); die Breite der Rötung über einen Exponenten
        const seite = (Math.cos((u - m.sonne) * Math.PI * 2) * 0.5 + 0.5) ** (1 / m.sonnenBreite)
        const wolke = feld(n2, u, v, m.wolken, m.wolken * 0.9, 4)
        // Pole bleiben eher frei von Deckfarbe; Grenze zur Grube unregelmäßig
        const { seite: gs, d } = grubenAbstand(u, v)
        const pol = gs === 'stiel' ? glatt(0.6, 1.4 + wolke * 0.8, d) : glatt(0.25, 0.8 + wolke * 0.5, d)
        basis[y * mw + x] = (seite * 0.75 + wolke * 0.6) * (0.55 + 0.45 * pol)
      }
    }
    // deckende Rötung wirkt größer als dünne: Anteil leicht gekürzt (Abgleich mit NFC-Tafeln, 23.10.2026)
    const schwelle = gewichtetesQuantil(basis, flaeche, p.deckfarbeAnteil * 0.9)
    // Deckfarben aus Fotos wirken nach Licht und Tonwertkurve stumpfer als am Baum: Sättigung leicht anheben
    const [dr, dg, db] = gesaettigt(hexNachRgb(p.deckfarbe), 1.18)
    const arten = new Set(p.deckfarbeArt)
    const streifen = arten.has('gestreift') || arten.has('geflammt')
    const nurStreifen = streifen && !arten.has('verwaschen')
    const sprenkel = arten.has('getuepfelt') ? Math.max(0.45, m.sprenkel) : arten.has('marmoriert') ? Math.max(0.3, m.sprenkel) : m.sprenkel
    const bAt = (u: number, v: number) => basis[Math.min(mh - 1, Math.floor((1 - v) * mh)) * mw + Math.min(mw - 1, Math.floor(u * mw))]

    // flächiger Anteil, weicher Übergang, darin feine Sprenkel (die Rötung ist nie ganz gleichmäßig)
    zeichneMaske(fc, W / halb, H / halb, W, H, (u, v) => {
      const b = bAt(u, v)
      const mm = glatt(schwelle - m.weich, schwelle + m.weich * 0.9, b)
      const tiefe = glatt(schwelle, schwelle + 0.45, b)
      const fein = feld(n3, u, v, 70, 55, 2)
      // feine Längsstruktur, wie sie auch flächige Rötung bei genauem Hinsehen zeigt
      const laengs = feld(n, u, v, 140, 7, 2)
      const spr = (1 - sprenkel * glatt(0.35, 0.75, fein) * (1 - tiefe * 0.6)) * (0.82 + 0.3 * laengs)
      // unter Streifen ist die Rötung heller und orangestichiger (Mischung mit der Grundfarbe)
      // gestreifte Sorten: die Rötung unter den Streifen ist meist nur ein heller Hauch (Fotos der NFC)
      // Abgleich mit 153 NFC-Tafeln (23.10.2026): gerötete Flächen sind auf den Fotos tiefrot (Farbton um 28°),
      // dünne Deckkraft über Gelb ergab Orange (55°); daher deckender und etwas dunkler
      const a = mm * (nurStreifen ? 0.3 + 0.3 * tiefe : streifen ? 0.5 + 0.42 * tiefe : 0.62 + 0.36 * tiefe) * spr
      const hell = streifen ? 0.1 * (1 - tiefe) : 0
      return [mix(dr, gr, hell) * (0.94 - tiefe * 0.22), mix(dg, gg * 0.8, hell) * (0.9 - tiefe * 0.3), mix(db, gb * 0.6, hell) * (0.94 - tiefe * 0.2), a]
    })
    for (let y = 0; y < mh; y++) {
      const v = 1 - (y + 0.5) / mh
      for (let x = 0; x < mw; x++) {
        const b = basis[y * mw + x]
        deckA[y * mw + x] = glatt(schwelle - m.weich, schwelle + m.weich, b) * (nurStreifen ? 0.6 : 1) * glatt(0.02, 0.1, v)
      }
    }

    if (streifen || arten.has('marmoriert') || arten.has('getuepfelt')) {
      // Streifen laufen vom Stiel zum Kelch. Eine Kosinuswelle rund herum (ganzzahlige Frequenz,
      // damit die Naht verschwindet), verzogen durch Rauschen; Breite, Stärke und Abrisse je Streifen.
      // Feine Streifen (gestreift) und breite Flammen (geflammt) sind eigene Lagen, oft beide zugleich.
      const lage = (geflammt: boolean) => {
        const f = Math.round(geflammt ? m.streifenGrob : m.streifenFein)
        // nicht jeder Streifen ist gleich kräftig: etwa ein Drittel bleibt nur angedeutet
        const staerke = Float32Array.from({ length: f }, () => (rnd() < 0.35 ? 0.08 + rnd() * 0.2 : 0.4 + rnd() * 0.6))
        const breiteJe = Float32Array.from({ length: f }, () => rnd())
        const versatz = rnd() * 10
        zeichneMaske(fc, klein ? W * 1.5 : W * 2, Math.max(64, H / 4), W, H, (u, v) => {
          const b = bAt(u, v)
          const bereich = glatt(schwelle - 0.32, schwelle + 0.08, b) * glatt(0.04, 0.16, v) * glatt(0.99, 0.86, v)
          if (bereich <= 0.002) return [0, 0, 0, 0]
          const verzug = (feld(n2, u, v + versatz, 3, 2, 3) - 0.5) * (geflammt ? 1.6 : 0.9) + (feld(n, u, v, 9, 5, 2) - 0.5) * m.streifenUnruhe * f * 0.5
          const phase = f * u + verzug
          const k = ((Math.floor(phase) % f) + f) % f
          const welle = 0.5 + 0.5 * Math.cos(Math.PI * 2 * phase)
          // breiter am Äquator, spitz zu den Polen
          const pol = Math.sin(Math.PI * v)
          const breiteS = (geflammt ? 0.25 + 0.3 * breiteJe[k] : 0.12 + 0.26 * breiteJe[k]) * (0.45 + 0.55 * pol) * (0.7 + 0.6 * feld(n2, u + versatz, v, f * 0.5, 9, 1))
          const kante = geflammt ? 0.16 : 0.08
          const linie = glatt(1 - breiteS - kante, 1 - breiteS + kante * 0.3, welle)
          // Abrisse: feine Streifen bestehen aus Strichen, Flammen aus längeren Zungen
          const strich = glatt(0.36, 0.56, feld(n3, u + versatz, v, f * 0.7, geflammt ? m.streifenStriche : m.streifenStriche * 2.5, 2))
          const ausfransen = geflammt ? 0.55 + 0.45 * feld(n, u, v, 70, 30, 2) : 1
          // auf flächiger Rötung sind Streifen nur dunklere Linien darin, auf Grundfarbe kräftiger
          const a = linie * strich * staerke[k] * bereich * ausfransen * (geflammt && arten.has('gestreift') ? 0.6 : 1) * (nurStreifen ? 1 : 0.7)
          const dunkel = nurStreifen ? m.streifenDunkel + 0.06 : m.streifenDunkel
          return [dr * dunkel, dg * dunkel * 0.85, db * dunkel * 0.95, a * 0.95]
        })
      }
      if (arten.has('geflammt')) lage(true)
      if (arten.has('gestreift')) lage(false)
      if (arten.has('marmoriert')) {
        zeichneMaske(fc, W / halb, H / halb, W, H, (u, v) => {
          const b = bAt(u, v)
          const bereich = glatt(schwelle - 0.25, schwelle + 0.1, b)
          // Marmorierung: weiche, ineinanderlaufende Wolken auf zwei Größen, keine scharfen Zellen
          const w = feld(n, u, v, m.marmor, m.marmor * 0.7, 4) * 0.7 + feld(n3, u, v, m.marmor * 2.5, m.marmor * 2, 2) * 0.3
          const mm = glatt(0.42, 0.72, w)
          return [dr * 0.85, dg * 0.75, db * 0.85, mm * bereich * (streifen ? 0.22 : 0.6)]
        })
      }
      // getüpfelt: kleine rote Tupfen am Rand der Rötung (wie bei Cox Orange und Boskoop)
      if (arten.has('getuepfelt')) {
        zeichneMaske(fc, klein ? W / 2 : W, klein ? H / 2 : H, W, H, (u, v) => {
          const b = bAt(u, v)
          // nur ein schmaler Saum am Rand der Rötung, zart (Fotos der NFC: Schattenseite ohne Tupfen)
          const rand = glatt(schwelle - 0.14, schwelle - 0.02, b) * (1 - glatt(schwelle + 0.02, schwelle + 0.14, b))
          if (rand <= 0.002) return [0, 0, 0, 0]
          const t = glatt(0.7, 0.76, feld(n3, u + 0.17, v, 230, 180, 1))
          return [dr * 0.9, dg * 0.8, db * 0.85, t * rand * 0.5]
        })
      }
    }
  }

  // ---- Berostung: dünne, matte, korkige Schicht; die Farbe darunter scheint durch
  const [rr0, rg0, rb0] = hexNachRgb(p.rostfarbe)
  // zweiter Ton: graugrün-ockerfarben statt zimtbraun
  const rostB: [number, number, number] = [rr0 * 0.92 + 14, rg0 * 0.98 + 16, rb0 * 0.9 + 6]
  const rostMaske = (u: number, v: number) => {
    const { seite, d } = grubenAbstand(u, v)
    // schnell: weit weg von den Gruben und ohne Wangenrost gibt es nichts zu rechnen
    if (p.rostWangen <= 0 && d > (seite === 'stiel' ? 1.6 + p.rostStiel * 2.4 : 1.2 + p.rostKelch * 1.8)) return 0
    const w = feld(n2, u, v, 18, 14, 3)
    let mk = 0
    if (seite === 'stiel' && p.rostStiel > 0) {
      // Grube berostet, dazu strahlenförmige Ausläufer über die Schulter
      const strahl = feld(n3, u, v * 0.3, m.rostStrahlen, 2, 2)
      const laenge = 0.8 + p.rostStiel * (0.3 + 0.8 * glatt(0.55, 0.8, strahl)) * (0.7 + 0.6 * w)
      const grube = 1 - glatt(laenge - 0.35, laenge, d + (w - 0.5) * 0.35)
      const netz = 1 - glatt(0.02, 0.07, Math.abs(feld(n2, u, v, 50, 40, 2) - 0.5))
      mk = Math.max(mk, grube * glatt(0, 0.4, p.rostStiel) * (0.75 + 0.25 * w), netz * (1 - glatt(laenge, laenge + 0.6, d)) * 0.6 * p.rostStiel)
    }
    if (seite === 'kelch' && p.rostKelch > 0) {
      const strahl = feld(n3, u + 0.5, v * 0.3, m.rostStrahlen * 0.8, 2, 2)
      const laenge = 0.7 + p.rostKelch * (0.5 + 1.2 * glatt(0.35, 0.8, strahl))
      mk = Math.max(mk, (1 - glatt(laenge - 0.3, laenge, d + (w - 0.5) * 0.3)) * glatt(0, 0.4, p.rostKelch))
    }
    if (p.rostWangen > 0) {
      // Flächen mittlerer Größe, darin und darum ein feines Netz, wie bei Renetten und Boskoop
      // Bedeckung wächst mit der Stärke, bleibt aber lückig: dichte Flecken, dazwischen ein Netz
      const r = p.rostWangen
      // geringe Berostung: wenige kleine Flecken (feineres Rauschen); starke: große, lückige Flächen mit Netz
      const fein = 0.5 * (1 - glatt(0.3, 0.7, r))
      const wolke = feld(n, u, v, 7, 6, 4) * (1 - fein) + feld(n3, u, v, 26, 20, 3) * fein
      // stark berostete Sorten (Egremont Russet, Boskoop) sind auf den Fotos fast ganz bedeckt
      const fl = glatt(0.8 - r * 0.62, 0.9 - r * 0.62, wolke) * (0.55 + 0.35 * feld(n3, u, v, 30, 24, 2) + 0.15 * glatt(0.6, 0.9, r))
      const netz = 1 - glatt(0.012, 0.05, Math.abs(feld(n2, u, v, 46, 38, 2) - 0.5))
      const rand = glatt(0.04, 0.18, v) * glatt(1, 0.9, v)
      mk = Math.max(mk, Math.max(fl, netz * Math.min(0.6, r ** 1.5 * 1.3) * glatt(0.62 - r * 0.4, 0.8 - r * 0.4, wolke)) * rand)
    }
    return mk
  }
  const rostGitter = new Float32Array(mw * mh)
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) rostGitter[y * mw + x] = rostMaske((x + 0.5) / mw, 1 - (y + 0.5) / mh)
  const rostAt = (u: number, v: number) => rostGitter[Math.min(mh - 1, Math.floor((1 - v) * mh)) * mw + Math.min(mw - 1, Math.floor(u * mw))]
  // grobe Vorprüfung für die fein aufgelösten Rostlagen: Nachbarschaft im groben Raster
  const rostNah = new Uint8Array(mw * mh)
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    let mx = 0
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const yy = Math.min(mh - 1, Math.max(0, y + dy)), xx = (x + dx + mw) % mw
      mx = Math.max(mx, rostGitter[yy * mw + xx])
    }
    rostNah[y * mw + x] = mx > 0.002 ? 1 : 0
  }
  const rostMoeglich = (u: number, v: number) => rostNah[Math.min(mh - 1, Math.floor((1 - v) * mh)) * mw + Math.min(mw - 1, Math.floor(u * mw))] === 1

  zeichneMaske(fc, klein ? W / 2 : W, klein ? H / 2 : H, W, H, (u, v) => {
    if (!rostMoeglich(u, v)) return [0, 0, 0, 0]
    const mk = klein ? rostAt(u, v) : rostMaske(u, v)
    if (mk <= 0.001) return [0, 0, 0, 0]
    const k = feld(n, u, v, 90, 70, 2)
    const ton = glatt(0.3, 0.7, feld(n3, u, v, 9, 7, 2)) * 0.5 + m.rostTon * 0.5
    // Rost ist schuppig: die Deckkraft schwankt fein, dichte Stellen fast deckend
    const schuppe = 0.7 + 0.3 * feld(n2, u, v, 150, 120, 1)
    return [
      mix(rr0, rostB[0], ton) * (0.82 + k * 0.32),
      mix(rg0, rostB[1], ton) * (0.82 + k * 0.32),
      mix(rb0, rostB[2], ton) * (0.85 + k * 0.25),
      mk * (0.62 + 0.26 * mk) * schuppe,
    ]
  })
  zeichneMaske(rc, mw, mh, W, H, (u, v) => [240, 240, 240, rostAt(u, v)])
  zeichneMaske(gc, mw, mh, W, H, (u, v) => [0, 0, 0, Math.min(1, rostAt(u, v) * 1.3)])
  zeichneMaske(lc, W / 2, H / 2, W, H, (u, v) => {
    if (!rostMoeglich(u, v)) return [0, 0, 0, 0]
    const mk = klein ? rostAt(u, v) : rostMaske(u, v)
    const k = feld(n, u, v, 110, 90, 2)
    return [k * 255, k * 255, k * 255, mk * 0.55]
  })

  // ---- leichte Verschattung tief in den Gruben (Rand folgt der unregelmäßigen Grube)
  zeichneMaske(fc, mw, mh, W, H, (u, v) => {
    const { seite, d } = grubenAbstand(u, v)
    const w = feld(n, u, v, 12, 9, 2)
    const tief = seite === 'stiel' ? 1 - glatt(0.1, 0.75 + w * 0.25, d) : 1 - glatt(0.05, 0.5, d)
    return seite === 'stiel' ? [80, 86, 40, tief * 0.22] : [60, 50, 25, tief * 0.22]
  })

  // ---- Rauheit: leicht wolkig, rauer in den Gruben
  zeichneMaske(rc, mw, mh, W, H, (u, v) => {
    const w = feld(n3, u, v, 5, 4, 3)
    const { d } = grubenAbstand(u, v)
    const g = (1 - glatt(0.5, 1.1, d)) * 0.12
    const r = Math.min(1, basisRau + (w - 0.5) * 0.14 + g)
    return [r * 255, r * 255, r * 255, 0.85]
  })
  // feiner Wechsel im Wachsbelag
  zeichneMaske(gc, mw, mh, W, H, (u, v) => {
    const w = feld(n3, u + 0.4, v, 6, 5, 2)
    return [0, 0, 0, glatt(0.55, 0.8, w) * 0.35]
  })

  // ---- Schalenpunkte (Lentizellen)
  const voll = texelMasse(p, H)
  const kumuliert: number[] = []
  // zum Kelch hin dichter
  const zeilenGewicht = voll.umfang.map((u, i) => u * voll.bogen[i] * (1 + m.punkteKelch * (1 - i / H) * 1.5))
  zeilenGewicht.reduce((s, g, i) => (kumuliert[i] = s + g), 0)
  const gesamt = kumuliert[kumuliert.length - 1]
  const anzahl = Math.round(p.punkteDichte * 2600 * (W / 1024) ** 0.5)
  const radiusPhys = (0.0014 + p.punkteGroesse * 0.0028) // relativ zur Fruchtbreite: echte Lentizellen 0,3–1 mm
  const hof = p.punkteHof ? hexNachRgb(p.punkteHof) : null
  const [pr0, pg0, pb0] = hexNachRgb(p.punkteFarbe)
  const hellAufRot: [number, number, number] = [236, 222, 186]
  for (let k = 0; k < anzahl; k++) {
    const z = rnd() * gesamt
    let lo = 0, hi = kumuliert.length - 1
    while (lo < hi) { const mm = (lo + hi) >> 1; if (kumuliert[mm] < z) lo = mm + 1; else hi = mm }
    const i = lo // Profilzeile, 0 = Kelch
    if (i < 3 || i > H - 4) continue
    const y = H - i
    const x = rnd() * W
    const u = x / W, v = i / H
    const { d } = grubenAbstand(u, v)
    if (d < 0.55) continue // tief in der Grube keine Punkte
    // ungleich groß: viele kleine, wenige große
    const g = radiusPhys * Math.exp((rnd() - 0.5) * 1.1 * m.punkteStreuung)
    // zu den Polen hin länglich, der Länge nach (entlang der Achse) gestreckt
    const pol = 1 - Math.sin(Math.PI * v)
    const streck = 1 + pol * 0.5 + rnd() * 0.25
    const rx = Math.min(30, (g / voll.umfang[i]) * W) / Math.sqrt(streck)
    const ry = Math.min(30, g / voll.bogen[i]) * Math.sqrt(streck)
    const rost = rostAt(u, v)
    const sicht = 1 - rost * 0.85
    if (sicht < 0.1) continue
    // auf der Rötung erscheinen Schalenpunkte hell, auf der Grundfarbe in ihrer eigenen Farbe
    const rot = deckA[Math.min(mh - 1, Math.floor((1 - v) * mh)) * mw + Math.min(mw - 1, Math.floor(u * mw))]
    const c0 = [mix(pr0, hellAufRot[0], rot), mix(pg0, hellAufRot[1], rot), mix(pb0, hellAufRot[2], rot)].map(Math.round)
    if (hof) {
      fc.fillStyle = `rgba(${hof[0]},${hof[1]},${hof[2]},${0.32 * sicht * (1 - rot * 0.5)})`
      ellipse(fc, x, y, rx * 2.8, ry * 2.8, W)
    }
    // weicher Rand, kräftiger Kern
    fc.fillStyle = `rgba(${c0[0]},${c0[1]},${c0[2]},${(0.15 + rnd() * 0.15) * sicht})`
    ellipse(fc, x, y, rx * 1.6, ry * 1.6, W)
    fc.fillStyle = `rgba(${c0[0]},${c0[1]},${c0[2]},${(0.6 + rnd() * 0.35) * sicht})`
    ellipse(fc, x, y, rx, ry, W)
    lc.fillStyle = 'rgba(255,255,255,0.6)'
    ellipse(lc, x, y, rx * 1.2, ry * 1.2, W)
    rc.fillStyle = 'rgba(225,225,225,0.7)'
    ellipse(rc, x, y, rx * 1.1, ry * 1.1, W)
    gc.fillStyle = 'rgba(0,0,0,0.6)'
    ellipse(gc, x, y, rx * 1.1, ry * 1.1, W)
  }

  // ---- feine Struktur im Relief: Poren der Wachsschicht und sanfte Wellen
  if (!klein) zeichneMaske(lc, W, H / 2, W, H, (u, v) => {
    const k = feld(n2, u, v, 220, 170, 1)
    return [k * 255, k * 255, k * 255, 0.16]
  })
  zeichneMaske(lc, mw, mh, W, H, (u, v) => {
    const k = feld(n, u + 0.2, v, 10, 8, 2)
    return [k * 255, k * 255, k * 255, 0.12]
  })

  return { farbe, rauheit: rau, relief: rel, glanz: gl }
}

/** Farbton in Grad (0 rot, 60 gelb, 120 grün) */
function farbton(r: number, g: number, b: number) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  if (mx === mn) return 0
  const d = mx - mn
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

/** Sättigung einer Farbe um den Faktor anheben (Abstand zum Grauwert strecken) */
function gesaettigt([r, g, b]: [number, number, number], faktor: number): [number, number, number] {
  const l = 0.3 * r + 0.59 * g + 0.11 * b
  const k = (x: number) => Math.max(0, Math.min(255, l + (x - l) * faktor))
  return [k(r), k(g), k(b)]
}

function grau(w: number) {
  const g = Math.round(Math.min(1, Math.max(0, w)) * 255)
  return `rgb(${g},${g},${g})`
}

function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, W: number) {
  for (const dx of [0, -W, W]) {
    if (x + dx + rx < 0 || x + dx - rx > W) continue
    c.beginPath()
    c.ellipse(x + dx, y, Math.max(0.4, rx), Math.max(0.4, ry), 0, 0, Math.PI * 2)
    c.fill()
  }
}

/** Rechnet eine Farbmaske auf kleinem Raster und zeichnet sie geglättet auf die volle Fläche */
function zeichneMaske(
  ziel: CanvasRenderingContext2D,
  mw: number,
  mh: number,
  W: number,
  H: number,
  f: (u: number, v: number) => [number, number, number, number],
) {
  const c = leinwand(mw, mh)
  const ctx = c.getContext('2d')!
  const bild = ctx.createImageData(mw, mh)
  const d = bild.data
  for (let y = 0; y < mh; y++) {
    const v = 1 - (y + 0.5) / mh
    for (let x = 0; x < mw; x++) {
      const [r, g, b, a] = f((x + 0.5) / mw, v)
      const o = (y * mw + x) * 4
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = Math.max(0, Math.min(1, a)) * 255
    }
  }
  ctx.putImageData(bild, 0, 0)
  ziel.imageSmoothingEnabled = true
  ziel.imageSmoothingQuality = 'high'
  ziel.drawImage(c, 0, 0, W, H)
}
