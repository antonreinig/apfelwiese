// Prozedurale Schalentextur: Grundfarbe, Deckfarbe (verwaschen, gestreift, geflammt …),
// Berostung, Schalenpunkte mit Hof. Dazu Rauheit und Relief für das Material.
// Textur-Layout: u = Umfang (0..1), v = Profil vom Kelch (unten) zum Stiel (oben).

import type { ApfelParameter } from './darstellung.ts'
import { texelMasse } from './geometrie.ts'

export interface Schalenbilder {
  farbe: HTMLCanvasElement
  rauheit: HTMLCanvasElement
  relief: HTMLCanvasElement
}

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

export function schalenbilder(p: ApfelParameter, breite = 1024): Schalenbilder {
  const W = breite, H = breite / 2
  const rnd = zufall(p.saat * 7919 + 13)
  const n = rauschen3(p.saat)
  const n2 = rauschen3(p.saat + 101)

  // Maße für die Masken auf kleinem Raster (wird beim Zeichnen hochskaliert)
  const mw = 256, mh = 128
  const masse = texelMasse(p, mh)
  const flaeche = new Float32Array(mw * mh)
  for (let y = 0; y < mh; y++) {
    const t = 1 - (y + 0.5) / mh
    const i = Math.round(t * mh)
    const w = masse.umfang[i] * masse.bogen[i]
    for (let x = 0; x < mw; x++) flaeche[y * mw + x] = w
  }

  const farbe = leinwand(W, H)
  const fc = farbe.getContext('2d')!
  const rau = leinwand(W, H)
  const rc = rau.getContext('2d')!
  const rel = leinwand(W, H)
  const lc = rel.getContext('2d')!

  // ---- Grundfarbe mit leichter Wolkigkeit
  const [gr, gg, gb] = hexNachRgb(p.grundfarbe)
  fc.fillStyle = p.grundfarbe
  fc.fillRect(0, 0, W, H)
  rc.fillStyle = grau(0.62 - p.glanz * 0.42)
  rc.fillRect(0, 0, W, H)
  lc.fillStyle = grau(0.5)
  lc.fillRect(0, 0, W, H)

  zeichneMaske(fc, mw, mh, W, H, (u, v) => {
    const w = feld(n, u, v, 6, 5, 3)
    // zur Stielseite oft grünlicher, zur Sonnenseite heller
    const gruen = glatt(0.65, 1, v) * 0.35
    return [gr * 0.86 + 10, gg * 0.97 + 8 * gruen, gb * 0.7, (Math.abs(w - 0.5) * 1.1 + gruen) * 0.6]
  })

  // ---- Deckfarbe
  if (p.deckfarbeAnteil > 0.01) {
    const sonne = 0.2 + rnd() * 0.1
    const basis = new Float32Array(mw * mh)
    for (let y = 0; y < mh; y++) {
      const v = 1 - (y + 0.5) / mh
      for (let x = 0; x < mw; x++) {
        const u = (x + 0.5) / mw
        const seite = Math.cos((u - sonne) * Math.PI * 2) * 0.5 + 0.5
        const wolke = feld(n2, u, v, 4, 4, 3)
        // Pole bleiben eher frei von Deckfarbe
        const pol = glatt(0, 0.12, v) * glatt(1, 0.85, v)
        basis[y * mw + x] = (seite * 0.75 + wolke * 0.55) * (0.6 + 0.4 * pol)
      }
    }
    const schwelle = gewichtetesQuantil(basis, flaeche, p.deckfarbeAnteil)
    const [dr, dg, db] = hexNachRgb(p.deckfarbe)
    const arten = new Set(p.deckfarbeArt)
    const streifen = arten.has('gestreift') || arten.has('geflammt')
    const nurStreifen = streifen && !arten.has('verwaschen')

    // flächiger Anteil (bei reinen Streifen schwächer), weicher Übergang wie ein Rotbacken
    zeichneMaske(fc, mw, mh, W, H, (u, v) => {
      const b = basis[Math.min(mh - 1, Math.floor((1 - v) * mh)) * mw + Math.min(mw - 1, Math.floor(u * mw))]
      const m = glatt(schwelle - 0.16, schwelle + 0.14, b)
      const tiefe = glatt(schwelle, schwelle + 0.4, b)
      // gestreift und verwaschen: kräftig gerötet, Streifen liegen darauf; nur Streifen: ein Hauch
      const a = m * (nurStreifen ? 0.28 + 0.2 * tiefe : 0.6 + 0.32 * tiefe)
      return [dr * (1 - tiefe * 0.22), dg * (1 - tiefe * 0.3), db * (1 - tiefe * 0.22), a]
    })

    if (streifen || arten.has('marmoriert') || arten.has('getuepfelt')) {
      const fein = arten.has('gestreift') && !arten.has('geflammt')
      // Streifen laufen vom Stiel zum Kelch: hohe Frequenz rund herum, niedrige entlang der Achse.
      // Dicke und Deckkraft schwanken, zum Rand der Deckfarbe hin laufen sie aus.
      zeichneMaske(fc, 1536, 96, W, H, (u, v) => {
        const b = basis[Math.min(mh - 1, Math.floor((1 - v) * mh)) * mw + Math.min(mw - 1, Math.floor(u * mw))]
        const bereich = glatt(schwelle - 0.3, schwelle + 0.12, b)
        let s: number
        // Streifen und Flammen sind das auffälligere Muster und haben Vorrang
        if (!streifen && arten.has('marmoriert')) s = glatt(0.45, 0.62, feld(n, u, v, 14, 10, 3))
        else if (!streifen) s = glatt(0.6, 0.7, feld(n, u, v, 40, 30, 2))
        else {
          const verzug = (feld(n2, u, v, 5, 4, 2) - 0.5) * (fein ? 0.03 : 0.06)
          const f = fein ? 130 : 38
          const w = feld(n, u + verzug, v, f, fein ? 2 : 3, 2)
          const dicke = feld(n2, u, v, fein ? 20 : 9, 2, 1)
          const lo = fein ? 0.62 - dicke * 0.16 : 0.5 - dicke * 0.12
          s = glatt(lo, lo + (fein ? 0.08 : 0.12), w) * (0.45 + 0.55 * feld(n2, u + 0.3, v, 12, 3, 1))
        }
        // Streifen sind dunkler als die Rötung darunter; zum Rand hin ausgefranst statt scharf begrenzt
        const ausfransen = 0.55 + 0.45 * feld(n, u * 3 + 0.7, v, 8, 6, 2)
        const dunkel = nurStreifen ? 0.85 : 0.68
        return [dr * dunkel, dg * dunkel * 0.88, db * dunkel * 0.95, s * bereich * ausfransen]
      })
    }
  }

  // ---- Berostung
  const [rr, rg, rb] = hexNachRgb(p.rostfarbe)
  const rostMaske = (u: number, v: number) => {
    const w = feld(n2, u, v, 18, 14, 3)
    let m = 0
    if (p.rostStiel > 0) m = Math.max(m, glatt(1 - 0.05 - p.rostStiel * 0.2 - w * 0.08, 1 - 0.02, v + (w - 0.5) * 0.05))
    if (p.rostKelch > 0) m = Math.max(m, glatt(0.04 + p.rostKelch * 0.15 + w * 0.06, 0.01, v + (w - 0.5) * 0.04))
    if (p.rostWangen > 0) {
      // Flächen mittlerer Größe, darin und darum ein feines Netz, wie bei Renetten und Boskoop
      const r = p.rostWangen
      const flaeche = glatt(1.05 - r, 1.25 - r, feld(n, u, v, 7, 6, 3) * 0.8 + r * 0.35)
      const netz = 1 - glatt(0.015, 0.06, Math.abs(feld(n2, u, v, 46, 38, 2) - 0.5))
      const rand = glatt(0.04, 0.18, v) * glatt(1, 0.9, v)
      m = Math.max(m, Math.max(flaeche * 0.85, netz * Math.min(0.75, r * 1.4)) * rand)
    }
    return m
  }
  zeichneMaske(fc, 512, 256, W, H, (u, v) => {
    const m = rostMaske(u, v)
    const k = feld(n, u, v, 60, 50, 2)
    return [rr * (0.85 + k * 0.3), rg * (0.85 + k * 0.3), rb * (0.85 + k * 0.25), m * 0.92]
  })
  zeichneMaske(rc, 256, 128, W, H, (u, v) => [235, 235, 235, rostMaske(u, v) * 0.9])
  zeichneMaske(lc, 512, 256, W, H, (u, v) => {
    const m = rostMaske(u, v)
    const k = feld(n, u, v, 80, 60, 2)
    return [k * 255, k * 255, k * 255, m * 0.5]
  })

  // ---- Schattierung an den Polen (Grubenschatten, leicht grünlich am Stiel)
  const verlauf = fc.createLinearGradient(0, 0, 0, H)
  verlauf.addColorStop(0, 'rgba(60,70,20,0.45)')
  verlauf.addColorStop(0.07, 'rgba(60,70,20,0.12)')
  verlauf.addColorStop(0.16, 'rgba(60,70,20,0)')
  verlauf.addColorStop(0.9, 'rgba(50,40,20,0)')
  verlauf.addColorStop(0.97, 'rgba(50,40,20,0.25)')
  verlauf.addColorStop(1, 'rgba(50,40,20,0.5)')
  fc.fillStyle = verlauf
  fc.fillRect(0, 0, W, H)

  // ---- Schalenpunkte
  const voll = texelMasse(p, H)
  const zeilenGewicht = voll.umfang.map((u, i) => u * voll.bogen[i])
  const kumuliert: number[] = []
  zeilenGewicht.reduce((s, g, i) => (kumuliert[i] = s + g), 0)
  const gesamt = kumuliert[kumuliert.length - 1]
  const anzahl = Math.round(p.punkteDichte * 2600 * (W / 1024) ** 0.5)
  const radiusPhys = (0.002 + p.punkteGroesse * 0.0045) // relativ zur Fruchtbreite
  const hof = p.punkteHof ? hexNachRgb(p.punkteHof) : null
  const [pr, pg, pb] = hexNachRgb(p.punkteFarbe)
  for (let k = 0; k < anzahl; k++) {
    // Zeile nach Fläche verteilt
    const z = rnd() * gesamt
    let lo = 0, hi = kumuliert.length - 1
    while (lo < hi) { const m = (lo + hi) >> 1; if (kumuliert[m] < z) lo = m + 1; else hi = m }
    const i = lo // Profilzeile, 0 = Kelch
    if (i < 3 || i > H - 4) continue
    const y = H - i
    const x = rnd() * W
    const groesse = radiusPhys * (0.6 + rnd() * 0.8)
    const rx = Math.min(30, (groesse / voll.umfang[i]) * W)
    const ry = Math.min(30, groesse / (voll.bogen[i] * (H / H)))
    // in Rostflächen weniger sichtbar
    const u = x / W, v = i / H
    const sicht = 1 - rostMaske(u, v) * 0.8
    if (hof) {
      fc.fillStyle = `rgba(${hof[0]},${hof[1]},${hof[2]},${0.4 * sicht})`
      ellipse(fc, x, y, rx * 2.6, ry * 2.6, W)
    }
    fc.fillStyle = `rgba(${pr},${pg},${pb},${(0.55 + rnd() * 0.4) * sicht})`
    ellipse(fc, x, y, rx, ry, W)
    lc.fillStyle = 'rgba(255,255,255,0.55)'
    ellipse(lc, x, y, rx * 1.2, ry * 1.2, W)
    rc.fillStyle = 'rgba(200,200,200,0.5)'
    ellipse(rc, x, y, rx, ry, W)
  }

  // ---- feine Struktur im Relief
  zeichneMaske(lc, 512, 256, W, H, (u, v) => {
    const k = feld(n2, u, v, 120, 90, 2)
    return [k * 255, k * 255, k * 255, 0.18]
  })

  return { farbe, rauheit: rau, relief: rel }
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
