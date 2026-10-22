// Messung per Code an einem Foto auf A4: Blatt entzerren, Weißabgleich am Papier,
// Teile freistellen, Größe in mm, Farben. Reiner Code ohne DOM (läuft auch im Node-Test).

import { erkenneBlatt, type Bildpuffer, type Punkt } from './blatterkennung.ts'

export const PX_PRO_MM = 3

export interface Teil {
  flaecheMm2: number
  breiteMm: number // größere Ausdehnung
  hoeheMm: number // kleinere Ausdehnung
  mitte: Punkt // mm auf dem Blatt
  /** Achsparalleles Rechteck um das Teil, mm auf dem entzerrten Blatt */
  box: { x0: number; y0: number; x1: number; y1: number }
  art: 'frucht' | 'kern' | 'klein'
}

export interface Fotoauswertung {
  blattGefunden: boolean
  querformat: boolean
  teile: Teil[]
  /** Entzerrtes, weißabgeglichenes Blatt; Hintergrund durchsichtig (freigestellt) */
  freigestellt?: Bildpuffer
  /** Entzerrtes, weißabgeglichenes Blatt, ringsum 3 mm beschnitten (zum Ansehen) */
  blatt?: Bildpuffer
  papierfarbe?: [number, number, number]
  /** Licht auf dem Blatt deutlich ungleichmäßig (Sonne und Schatten, farbige Reflexe) */
  lichtUngleich?: boolean
  /** Farbcluster der Fruchtflächen nach Weißabgleich */
  farben?: { rgb: [number, number, number]; anteil: number; art: 'grund' | 'deck' | 'rost' | 'hell' }[]
  schaerfe?: number
  /** Schalenpunkte (Lentizellen) auf Fruchtflächen: Anzahl je cm² und mittlere Farbe */
  punkte?: { jeCm2: number; farbe: [number, number, number]; anzahl: number; hof?: [number, number, number] }
}

// ------------------------------------------------------------------ Perspektive

/** Homographie, die Punkte von src nach dst abbildet (je 4 Punkte) */
export function homographie(src: Punkt[], dst: Punkt[]): number[] {
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i], { x: u, y: v } = dst[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v)
  }
  const h = loese(A, b)
  return [...h, 1]
}

function loese(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((r, i) => [...r, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = M[r][c] / M[c][c]
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  return M.map((r, i) => r[n] / r[i])
}

function abbilden(H: number[], x: number, y: number): Punkt {
  const w = H[6] * x + H[7] * y + H[8]
  return { x: (H[0] * x + H[1] * y + H[2]) / w, y: (H[3] * x + H[4] * y + H[5]) / w }
}

/** Entzerrt das Blatt auf ein Rechteck in PX_PRO_MM (Hochformat 210 × 297 mm oder quer) */
export function entzerren(bild: Bildpuffer, ecken: Punkt[], pxProMm = PX_PRO_MM): { bild: Bildpuffer; querformat: boolean } {
  const [ol, or, ur, ul] = ecken.map((p) => ({ x: p.x * bild.width, y: p.y * bild.height }))
  const breitePx = (Math.hypot(or.x - ol.x, or.y - ol.y) + Math.hypot(ur.x - ul.x, ur.y - ul.y)) / 2
  const hoehePx = (Math.hypot(ul.x - ol.x, ul.y - ol.y) + Math.hypot(ur.x - or.x, ur.y - or.y)) / 2
  const querformat = breitePx > hoehePx
  const W = Math.round((querformat ? 297 : 210) * pxProMm)
  const H = Math.round((querformat ? 210 : 297) * pxProMm)
  // Abbildung Ziel → Quelle, damit jedes Zielpixel genau einmal abgetastet wird
  const M = homographie([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], [ol, or, ur, ul])
  const out = new Uint8ClampedArray(W * H * 4)
  const { data, width: bw, height: bh } = bild
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const q = abbilden(M, x + 0.5, y + 0.5)
      const sx = Math.min(bw - 2, Math.max(0, q.x - 0.5)), sy = Math.min(bh - 2, Math.max(0, q.y - 0.5))
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0
      const i00 = (y0 * bw + x0) * 4, i10 = i00 + 4, i01 = i00 + bw * 4, i11 = i01 + 4
      const o = (y * W + x) * 4
      for (let k = 0; k < 3; k++) {
        out[o + k] = (data[i00 + k] * (1 - fx) + data[i10 + k] * fx) * (1 - fy) + (data[i01 + k] * (1 - fx) + data[i11 + k] * fx) * fy
      }
      out[o + 3] = 255
    }
  }
  return { bild: { data: out, width: W, height: H }, querformat }
}

// ------------------------------------------------------------------ Auswertung

export function werteFotoAus(bild: Bildpuffer, ecken?: Punkt[]): Fotoauswertung {
  let e = ecken
  if (!e) {
    // Ecken auf einer verkleinerten Kopie suchen
    const klein = verkleinern(bild, 900)
    const b = erkenneBlatt(klein)
    if (!b.gefunden || b.randBeruehrt.length) return { blattGefunden: false, querformat: false, teile: [] }
    e = b.ecken
  }
  const { bild: blatt, querformat } = entzerren(bild, e)
  const { width: W, height: H, data } = blatt
  const n = W * H

  // Papierfarbe: Median der hellsten Pixel im Randstreifen (10–20 mm vom Rand). Das Papier kann je nach
  // Licht deutlich bläulich, grünlich oder gelblich sein; es ist aber im Streifen fast überall das Hellste.
  const streifen: [number, number, number, number][] = []
  const rand = 10 * PX_PRO_MM, breit = 20 * PX_PRO_MM
  for (let y = rand; y < H - rand; y += 3)
    for (let x = rand; x < W - rand; x += 3) {
      if (x > breit && x < W - breit && y > breit && y < H - breit) continue
      const o = (y * W + x) * 4
      const r = data[o], g = data[o + 1], b = data[o + 2]
      streifen.push([r * 0.3 + g * 0.59 + b * 0.11, r, g, b])
    }
  streifen.sort((a, b) => b[0] - a[0])
  const hellste = streifen.slice(0, Math.max(1, Math.floor(streifen.length * 0.6)))
  const papier = [1, 2, 3].map((k) => median(hellste.map((q) => q[k])) || 230) as [number, number, number]

  // Weißabgleich: Papier → (245, 245, 245). Unter farbigem Licht (Schatten unter blauem Himmel) braucht
  // ein Kanal fast den doppelten Faktor; die Rohwerte bleiben deshalb für die Farbmessung erhalten,
  // die ohne Abschneiden bei 255 rechnet.
  const f = papier.map((v) => 245 / Math.max(40, v))
  const roh = new Uint8ClampedArray(data)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    data[o] = Math.min(255, data[o] * f[0]); data[o + 1] = Math.min(255, data[o + 1] * f[1]); data[o + 2] = Math.min(255, data[o + 2] * f[2])
  }

  // Feiner entzerrtes Blatt (6 px/mm) zum Ansehen und für kleine Einzelheiten wie Schalenpunkte
  const FEIN = 6
  const fein = entzerren(bild, e, FEIN).bild
  for (let i = 0; i < fein.data.length; i += 4) {
    fein.data[i] = Math.min(255, fein.data[i] * f[0]); fein.data[i + 1] = Math.min(255, fein.data[i + 1] * f[1]); fein.data[i + 2] = Math.min(255, fein.data[i + 2] * f[2])
  }
  // Ansichtsbild: Blatt ohne Randblitzer (3 mm nach innen beschnitten), Papier fast weiß
  const rand3 = 3 * FEIN
  const bw = fein.width - 2 * rand3, bh = fein.height - 2 * rand3
  const ansicht = new Uint8ClampedArray(bw * bh * 4)
  for (let y = 0; y < bh; y++) ansicht.set(fein.data.subarray(((y + rand3) * fein.width + rand3) * 4, ((y + rand3) * fein.width + rand3 + bw) * 4), y * bw * 4)
  for (let i = 0; i < ansicht.length; i += 4) { ansicht[i] = Math.min(255, ansicht[i] * 1.03); ansicht[i + 1] = Math.min(255, ansicht[i + 1] * 1.03); ansicht[i + 2] = Math.min(255, ansicht[i + 2] * 1.03) }
  const blattBild: Bildpuffer = { data: ansicht, width: bw, height: bh }

  // Objekte: Farbort deutlich vom Papier entfernt. Schatten sind abgedunkeltes Papier mit fast
  // neutralem Farbort (leicht getönt vom Licht, das die Frucht zurückwirft). Deshalb zweistufig:
  // sichere Pixel (deutlich farbig oder sehr dunkel) und schwach farbige, die nur zählen, wenn sie
  // höchstens 1 mm neben sicheren liegen. Ein Schattensaum, der weiter reicht, fällt heraus.
  const sicher = new Uint8Array(n)
  const schwach = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    const r = data[o], g = data[o + 1], b = data[o + 2]
    const summe = r + g + b + 1
    const dr = r / summe - 1 / 3, dg = g / summe - 1 / 3, db = b / summe - 1 / 3
    const abstand = Math.sqrt(dr * dr + dg * dg + db * db)
    const hell = Math.max(r, g, b)
    if (abstand > 0.075 || hell < 50) sicher[i] = 1
    else if (abstand > 0.04) schwach[i] = 1
  }
  const nahe = dehnen(sicher, W, H, PX_PRO_MM)
  const maske = new Uint8Array(n)
  for (let i = 0; i < n; i++) maske[i] = sicher[i] || (schwach[i] && nahe[i]) ? 1 : 0
  // Rand des Blatts (2 mm) ignorieren
  const r2 = 2 * PX_PRO_MM
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < r2 || y < r2 || x >= W - r2 || y >= H - r2) maske[y * W + x] = 0

  const vorlaeufig = loecherFuellen(oeffnen(schliessen(maske, W, H, 2), W, H, 1), W, H)
  // Große Teile (Fruchtstücke) kräftig schließen: sehr helles Fruchtfleisch hat kaum Farbe und
  // bricht sonst auf. Kleine Teile (Kerne) bleiben unberührt, damit sie nicht verschmelzen.
  const vor = flaechen(vorlaeufig, W, H)
  const gross = new Uint8Array(n)
  const grenze = 400 * PX_PRO_MM * PX_PRO_MM
  for (let i = 0; i < n; i++) if (vor.marken[i] && vor.groessen[vor.marken[i]] > grenze) gross[i] = 1
  const grossZu = huellenFuellen(loecherFuellen(schliessen(gross, W, H, 4 * PX_PRO_MM), W, H), W, H)
  const geschlossen = new Uint8Array(n)
  for (let i = 0; i < n; i++) geschlossen[i] = vorlaeufig[i] || grossZu[i] ? 1 : 0
  const { marken, groessen } = flaechen(geschlossen, W, H)

  // Örtliche Papierfarbe (Raster aus Feldern von etwa 30 mm): freies Papier mit Abstand zu allen
  // Teilen. Damit wird jeder Apfel mit dem Papier in seiner Nähe abgeglichen, auch wenn das Blatt
  // teils in der Sonne und teils im Schatten liegt.
  const abstandFrei = dehnen(geschlossen, W, H, 4 * PX_PRO_MM)
  const FELD = 30 * PX_PRO_MM
  const fx = Math.ceil(W / FELD), fy = Math.ceil(H / FELD)
  const feldFarbe: ([number, number, number] | null)[] = []
  for (let gy = 0; gy < fy; gy++)
    for (let gx = 0; gx < fx; gx++) {
      const proben2: number[][] = [[], [], []]
      for (let y = gy * FELD + 2; y < Math.min(H - 6, (gy + 1) * FELD); y += 2)
        for (let x = gx * FELD + 2; x < Math.min(W - 6, (gx + 1) * FELD); x += 2) {
          const i = y * W + x
          if (abstandFrei[i] || x < 6 || y < 6) continue
          proben2[0].push(roh[i * 4]); proben2[1].push(roh[i * 4 + 1]); proben2[2].push(roh[i * 4 + 2])
        }
      feldFarbe.push(proben2[0].length > 30 ? (proben2.map(median) as [number, number, number]) : null)
    }
  // leere Felder (ganz unter einem Apfel) vom nächsten belegten Feld füllen
  const feldFarbeVoll = feldFarbe.map((c, k) => {
    if (c) return c
    let best: [number, number, number] = papier, bd = Infinity
    feldFarbe.forEach((d, j) => {
      if (!d) return
      const dd = (j % fx - k % fx) ** 2 + (Math.floor(j / fx) - Math.floor(k / fx)) ** 2
      if (dd < bd) { bd = dd; best = d }
    })
    return best
  })
  const papierBei = (x: number, y: number): [number, number, number] => {
    // bilinear zwischen den Feldmitten
    const u = Math.max(0, Math.min(fx - 1, x / FELD - 0.5)), v = Math.max(0, Math.min(fy - 1, y / FELD - 0.5))
    const x0 = Math.floor(u), y0 = Math.floor(v), x1 = Math.min(fx - 1, x0 + 1), y1 = Math.min(fy - 1, y0 + 1)
    const tx = u - x0, ty = v - y0
    const c = (gx: number, gy: number) => feldFarbeVoll[gy * fx + gx]
    return [0, 1, 2].map((k) =>
      (c(x0, y0)[k] * (1 - tx) + c(x1, y0)[k] * tx) * (1 - ty) + (c(x0, y1)[k] * (1 - tx) + c(x1, y1)[k] * tx) * ty) as [number, number, number]
  }
  const helligkeiten = feldFarbe.filter(Boolean).map((c) => c![0] * 0.3 + c![1] * 0.59 + c![2] * 0.11)
  const farborte = feldFarbe.filter(Boolean).map((c) => { const t = c![0] + c![1] + c![2] + 1; return [c![0] / t, c![2] / t] })
  const lichtUngleich = helligkeiten.length > 3 && (
    Math.max(...helligkeiten) / Math.max(1, Math.min(...helligkeiten)) > 1.45 ||
    Math.max(...farborte.map((o) => o[0])) - Math.min(...farborte.map((o) => o[0])) > 0.05 ||
    Math.max(...farborte.map((o) => o[1])) - Math.min(...farborte.map((o) => o[1])) > 0.05)

  const mm2 = PX_PRO_MM * PX_PRO_MM
  const teile: Teil[] = []
  const fruchtMarken = new Set<number>()
  for (let m = 1; m < groessen.length; m++) {
    const flaecheMm2 = groessen[m] / mm2
    if (flaecheMm2 < 8) continue
    const art = flaecheMm2 > 500 ? 'frucht' : flaecheMm2 < 150 ? 'kern' : 'klein'
    const { laenge, breite, mitte, box } = hauptachsen(marken, W, H, m)
    teile.push({
      flaecheMm2, breiteMm: laenge / PX_PRO_MM, hoeheMm: breite / PX_PRO_MM, art,
      mitte: { x: mitte.x / PX_PRO_MM, y: mitte.y / PX_PRO_MM },
      box: { x0: box.x0 / PX_PRO_MM, y0: box.y0 / PX_PRO_MM, x1: box.x1 / PX_PRO_MM, y1: box.y1 / PX_PRO_MM },
    })
    if (art === 'frucht') fruchtMarken.add(m)
  }

  // Freigestellt: Hintergrund durchsichtig, weiche Kante
  const alpha = weichzeichnen(geschlossen, W, H)
  for (let i = 0; i < n; i++) data[i * 4 + 3] = alpha[i]

  // Farben der Fruchtflächen (Rand 2 mm weggelassen)
  const innen = erodieren(geschlossen, W, H, 2 * PX_PRO_MM)
  const pixel: [number, number, number][] = []
  for (let i = 0; i < n; i += 2) {
    if (!innen[i] || !fruchtMarken.has(marken[i])) continue
    const o = i * 4
    if (Math.max(roh[o], roh[o + 1], roh[o + 2]) > 250) continue // Glanzlicht oder übersteuert
    const pa = papierBei(i % W, Math.floor(i / W))
    const r = (roh[o] * 245) / Math.max(30, pa[0]), g = (roh[o + 1] * 245) / Math.max(30, pa[1]), b = (roh[o + 2] * 245) / Math.max(30, pa[2])
    if (Math.max(r, g, b) < 40) continue // tiefer Schatten
    pixel.push([r, g, b])
  }
  const farben = pixel.length > 200 ? schalenfarben(pixel) : undefined
  const punkte = schalenpunkte(fein, innen, marken, fruchtMarken, W, FEIN)

  return { blattGefunden: true, querformat, teile, freigestellt: blatt, blatt: blattBild, papierfarbe: papier, lichtUngleich, farben, schaerfe: schaerfe(blatt), punkte }
}

// ------------------------------------------------------------------ Bildoperationen

export function verkleinern(bild: Bildpuffer, maxBreite: number): Bildpuffer {
  const s = Math.min(1, maxBreite / Math.max(bild.width, bild.height))
  if (s === 1) return bild
  const W = Math.round(bild.width * s), H = Math.round(bild.height * s)
  const out = new Uint8ClampedArray(W * H * 4)
  const k = 1 / s
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // Mittelwert über den Block
      let r = 0, g = 0, b = 0, c = 0
      const x0 = Math.floor(x * k), y0 = Math.floor(y * k), x1 = Math.min(bild.width, Math.floor((x + 1) * k)), y1 = Math.min(bild.height, Math.floor((y + 1) * k))
      for (let yy = y0; yy < y1; yy += 2)
        for (let xx = x0; xx < x1; xx += 2) {
          const o = (yy * bild.width + xx) * 4
          r += bild.data[o]; g += bild.data[o + 1]; b += bild.data[o + 2]; c++
        }
      const o = (y * W + x) * 4
      out[o] = r / c; out[o + 1] = g / c; out[o + 2] = b / c; out[o + 3] = 255
    }
  return { data: out, width: W, height: H }
}

function median(l: number[]) {
  if (!l.length) return 0
  const s = [...l].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

function erodieren(m: Uint8Array, w: number, h: number, r: number) {
  // Ein Pixel bleibt, wenn das ganze Quadrat (2r+1)² gesetzt ist; getrennt in x und y über Laufsummen
  const a = new Uint8Array(m.length), b = new Uint8Array(m.length)
  const k = 2 * r + 1
  for (let y = 0; y < h; y++) {
    let s = 0
    for (let x = 0; x < w + r; x++) {
      if (x < w) s += m[y * w + x]
      if (x - k >= 0) s -= m[y * w + x - k]
      const ziel = x - r
      if (ziel >= 0 && ziel < w) a[y * w + ziel] = s === k ? 1 : 0
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0
    for (let y = 0; y < h + r; y++) {
      if (y < h) s += a[y * w + x]
      if (y - k >= 0) s -= a[(y - k) * w + x]
      const ziel = y - r
      if (ziel >= 0 && ziel < h) b[ziel * w + x] = s === k ? 1 : 0
    }
  }
  return b
}

function dehnen(m: Uint8Array, w: number, h: number, r: number) {
  const a = new Uint8Array(m.length), b = new Uint8Array(m.length)
  for (let y = 0; y < h; y++) {
    let letzte = -1e9
    for (let x = 0; x < w; x++) { if (m[y * w + x]) letzte = x; if (x - letzte <= r) a[y * w + x] = 1 }
    letzte = 1e9
    for (let x = w - 1; x >= 0; x--) { if (m[y * w + x]) letzte = x; if (letzte - x <= r) a[y * w + x] = 1 }
  }
  for (let x = 0; x < w; x++) {
    let letzte = -1e9
    for (let y = 0; y < h; y++) { if (a[y * w + x]) letzte = y; if (y - letzte <= r) b[y * w + x] = 1 }
    letzte = 1e9
    for (let y = h - 1; y >= 0; y--) { if (a[y * w + x]) letzte = y; if (letzte - y <= r) b[y * w + x] = 1 }
  }
  return b
}

const schliessen = (m: Uint8Array, w: number, h: number, r: number) => erodieren(dehnen(m, w, h, r), w, h, r)
const oeffnen = (m: Uint8Array, w: number, h: number, r: number) => dehnen(erodieren(m, w, h, r), w, h, r)

/** Hintergrund, der nicht mit dem Bildrand verbunden ist, gehört zum Objekt (helles Fruchtfleisch) */
function loecherFuellen(m: Uint8Array, w: number, h: number) {
  const aussen = new Uint8Array(m.length)
  const stapel: number[] = []
  for (let x = 0; x < w; x++) { stapel.push(x, (h - 1) * w + x) }
  for (let y = 0; y < h; y++) { stapel.push(y * w, y * w + w - 1) }
  while (stapel.length) {
    const i = stapel.pop()!
    if (m[i] || aussen[i]) continue
    aussen[i] = 1
    const x = i % w
    if (x > 0) stapel.push(i - 1)
    if (x < w - 1) stapel.push(i + 1)
    if (i >= w) stapel.push(i - w)
    if (i < (h - 1) * w) stapel.push(i + w)
  }
  const out = new Uint8Array(m.length)
  for (let i = 0; i < m.length; i++) out[i] = aussen[i] ? 0 : 1
  return out
}

/** Füllt jede Fläche bis zu ihrer konvexen Hülle (Apfelstücke sind fast konvex) */
function huellenFuellen(m: Uint8Array, w: number, h: number) {
  const { marken, groessen } = flaechen(m, w, h)
  const out = new Uint8Array(m)
  for (let id = 1; id < groessen.length; id++) {
    const pts: [number, number][] = []
    for (let y = 0; y < h; y++) {
      let l = -1, r = -1
      for (let x = 0; x < w; x++) if (marken[y * w + x] === id) { if (l < 0) l = x; r = x }
      if (l >= 0) pts.push([l, y], [r, y])
    }
    const huelle = konvex(pts)
    if (huelle.length < 3) continue
    // Polygon zeilenweise füllen
    let y0 = Infinity, y1 = -Infinity
    for (const [, y] of huelle) { y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
    for (let y = Math.max(0, Math.ceil(y0)); y <= Math.min(h - 1, Math.floor(y1)); y++) {
      const xs: number[] = []
      for (let k = 0; k < huelle.length; k++) {
        const [ax, ay] = huelle[k], [bx, by] = huelle[(k + 1) % huelle.length]
        if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax))
      }
      xs.sort((a, b) => a - b)
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(w - 1, Math.floor(xs[k + 1])); x++) out[y * w + x] = 1
    }
  }
  return out
}

function konvex(punkte: [number, number][]): [number, number][] {
  const p = [...punkte].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const kreuz = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const unten: [number, number][] = [], oben: [number, number][] = []
  for (const q of p) { while (unten.length >= 2 && kreuz(unten[unten.length - 2], unten[unten.length - 1], q) <= 0) unten.pop(); unten.push(q) }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (oben.length >= 2 && kreuz(oben[oben.length - 2], oben[oben.length - 1], q) <= 0) oben.pop(); oben.push(q) }
  oben.pop(); unten.pop()
  return unten.concat(oben)
}

function flaechen(m: Uint8Array, w: number, h: number) {
  const marken = new Int32Array(m.length)
  const groessen = [0]
  const stapel = new Int32Array(m.length)
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || marken[s]) continue
    const id = groessen.length
    let oben = 0, g = 0
    stapel[oben++] = s
    marken[s] = id
    while (oben) {
      const i = stapel[--oben]
      g++
      const x = i % w
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < (h - 1) * w ? i + w : -1]
      for (const j of nb) if (j >= 0 && m[j] && !marken[j]) { marken[j] = id; stapel[oben++] = j }
    }
    groessen.push(g)
  }
  return { marken, groessen }
}

function hauptachsen(marken: Int32Array, w: number, h: number, id: number) {
  let n = 0, mx = 0, my = 0
  for (let i = 0; i < marken.length; i++) if (marken[i] === id) { n++; mx += i % w; my += Math.floor(i / w) }
  mx /= n; my /= n
  let sxx = 0, syy = 0, sxy = 0
  for (let i = 0; i < marken.length; i++) {
    if (marken[i] !== id) continue
    const dx = (i % w) - mx, dy = Math.floor(i / w) - my
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy
  }
  const winkel = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  const c = Math.cos(winkel), s = Math.sin(winkel)
  let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (let i = 0; i < marken.length; i++) {
    if (marken[i] !== id) continue
    const px = i % w, py = Math.floor(i / w)
    const dx = px - mx, dy = py - my
    const a = dx * c + dy * s, b = -dx * s + dy * c
    if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b
    if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py
  }
  void h
  const la = a1 - a0 + 1, lb = b1 - b0 + 1
  return { laenge: Math.max(la, lb), breite: Math.min(la, lb), mitte: { x: mx, y: my }, box: { x0, y0, x1: x1 + 1, y1: y1 + 1 } }
}

function weichzeichnen(m: Uint8Array, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(m.length)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0, c = 0
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
          s += m[yy * w + xx]; c++
        }
      out[y * w + x] = (s / c) * 255
    }
  return out
}

// ------------------------------------------------------------------ Schalenfarben in Lab

function lab([r, g, b]: [number, number, number]): [number, number, number] {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const R = lin(r), G = lin(g), B = lin(b)
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]
}

/**
 * Grund- und Deckfarbe pixelweise: Grundfarbe aus den gelbgrünen Schalenpixeln, Deckfarbe ist jedes
 * Pixel, dessen Rotanteil a* deutlich (≥ 12) über dem der Grundfarbe liegt, unabhängig von der
 * Helligkeit. Sehr dunkle, nicht eindeutig rote Pixel gelten als Schatten. (Verfahren wie bei der
 * Messung der Referenzbilder, daten/bilder/bericht.md.)
 */
function schalenfarben(px: [number, number, number][]) {
  const l = px.map(lab)
  const median = (v: number[]) => { const s2 = [...v].sort((a, b) => a - b); return s2[Math.floor(s2.length / 2)] }
  // Grundfarbe: Pixel mit Farbton gelb bis grün (b* deutlich positiv, a* eher klein)
  const gelbgruen = l.filter(([L, a, b]) => L > 35 && b > 15 && a < b * 0.6)
  const basis = gelbgruen.length > px.length * 0.05 ? gelbgruen : [...l].sort((x, y) => x[1] - y[1]).slice(0, Math.ceil(l.length / 4))
  const aGrund = median(basis.map((x) => x[1]))
  const grund: [number, number, number][] = [], deck: [number, number, number][] = []
  let schatten = 0
  l.forEach(([L, a], i) => {
    if (a >= aGrund + 12) deck.push(px[i])
    else if (L < 25) schatten++
    else grund.push(px[i])
  })
  const mittel = (v: [number, number, number][]) => [0, 1, 2].map((k) => v.reduce((s2, c) => s2 + c[k], 0) / Math.max(1, v.length)) as [number, number, number]
  const gesamt = grund.length + deck.length || 1
  const ergebnis: { rgb: [number, number, number]; anteil: number; art: 'grund' | 'deck' | 'rost' | 'hell' }[] = []
  if (grund.length) ergebnis.push({ rgb: mittel(grund).map(Math.round) as [number, number, number], anteil: grund.length / gesamt, art: 'grund' })
  if (deck.length) ergebnis.push({ rgb: mittel(deck).map(Math.round) as [number, number, number], anteil: deck.length / gesamt, art: 'deck' })
  void schatten
  return ergebnis
}

export function farbton(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((v) => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  h = (h * 60 + 360) % 360
  return { h, s: max ? d / max : 0, v: max }
}


/** Kleine dunkle Flecken auf der Schale, deutlich dunkler als ihre Umgebung */
function schalenpunkte(b: Bildpuffer, innenGrob: Uint8Array, markenGrob: Int32Array, frucht: Set<number>, grobBreite: number, pxMm: number) {
  const { data, width: w, height: h } = b
  const n = w * h
  // Masken liegen im groben Raster (PX_PRO_MM); auf das feine Raster übertragen
  const k = pxMm / PX_PRO_MM
  const innen = new Uint8Array(n)
  const marken = new Int32Array(n)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const g = Math.floor(y / k) * grobBreite + Math.floor(x / k)
    innen[y * w + x] = innenGrob[g]; marken[y * w + x] = markenGrob[g]
  }
  const grau = new Float32Array(n)
  for (let i = 0; i < n; i++) grau[i] = data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11
  // lokaler Mittelwert (Kasten, Radius 3 mm) über Integralbild
  const r = 3 * pxMm
  const integral = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let zeile = 0
    for (let x = 0; x < w; x++) { zeile += grau[y * w + x]; integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + zeile }
  }
  const mittel = (x: number, y: number) => {
    const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(w, x + r + 1), y1 = Math.min(h, y + r + 1)
    const s = integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] - integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0]
    return s / ((x1 - x0) * (y1 - y0))
  }
  const fleck = new Uint8Array(n)
  let flaeche = 0
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!innen[i] || !frucht.has(marken[i])) continue
      flaeche++
      if (grau[i] < mittel(x, y) * 0.82) fleck[i] = 1
    }
  if (flaeche < 500) return undefined
  const { marken: fm, groessen } = flaechen(fleck, w, h)
  const mm2 = pxMm * pxMm
  let anzahl = 0
  const summe = [0, 0, 0]
  let px = 0
  const gueltig = new Set<number>()
  for (let m = 1; m < groessen.length; m++) {
    const a = groessen[m] / mm2
    if (a >= 0.1 && a <= 2.5) { anzahl++; gueltig.add(m) }
  }
  // Farbe je Punkt aus seinem dunkelsten Pixel (der Rand ist mit der Schale vermischt)
  const punkt = new Uint8Array(n)
  const kern = new Map<number, number>() // Fläche → dunkelstes Pixel
  for (let i = 0; i < n; i++) {
    if (!gueltig.has(fm[i])) continue
    punkt[i] = 1
    const k = kern.get(fm[i])
    if (k === undefined || grau[i] < grau[k]) kern.set(fm[i], i)
  }
  // die deutlichere Hälfte der Punkte (schwache Treffer sind oft nur Schattierung)
  const kerne = [...kern.values()].sort((a, b) => grau[a] - grau[b])
  for (const i of kerne.slice(0, Math.max(1, Math.ceil(kerne.length / 2)))) { summe[0] += data[i * 4]; summe[1] += data[i * 4 + 1]; summe[2] += data[i * 4 + 2]; px++ }
  // Hof: Ring von etwa 0,7 mm um die Punkte, verglichen mit der übrigen Schale
  const ring = dehnen(punkt, w, h, 2)
  const hof = [0, 0, 0], schale = [0, 0, 0]
  let nh = 0, ns = 0
  for (let i = 0; i < n; i++) {
    if (!innen[i] || !frucht.has(marken[i]) || punkt[i]) continue
    const o = i * 4
    if (ring[i]) { hof[0] += data[o]; hof[1] += data[o + 1]; hof[2] += data[o + 2]; nh++ }
    else { schale[0] += data[o]; schale[1] += data[o + 1]; schale[2] += data[o + 2]; ns++ }
  }
  const mitte = (v: number[], k: number) => v.map((x) => Math.round(x / Math.max(1, k))) as [number, number, number]
  const hofRgb = mitte(hof, nh), schaleRgb = mitte(schale, ns)
  // grüner oder röter als die Schale ringsum? (Unterschied im Farbort, nicht in der Helligkeit)
  const ort = (c: number[]) => { const t = c[0] + c[1] + c[2] + 1; return [c[0] / t, c[1] / t, c[2] / t] }
  const oh = ort(hofRgb), os = ort(schaleRgb)
  const gruener = oh[1] - os[1] > 0.015 && oh[0] - os[0] < 0
  const roeter = oh[0] - os[0] > 0.02
  const cm2 = flaeche / mm2 / 100
  return {
    jeCm2: anzahl / cm2,
    anzahl,
    farbe: mitte(summe, px),
    hof: nh > 50 && (gruener || roeter) ? hofRgb : undefined,
  }
}

/** Schärfe: Varianz des Laplace-Filters auf dem Graubild (höher = schärfer) */
function schaerfe(b: Bildpuffer) {
  const { data, width: w, height: h } = b
  let s = 0, s2 = 0, n = 0
  for (let y = 1; y < h - 1; y += 2)
    for (let x = 1; x < w - 1; x += 2) {
      const g = (i: number) => data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11
      const i = y * w + x
      const l = 4 * g(i) - g(i - 1) - g(i + 1) - g(i - w) - g(i + w)
      s += l; s2 += l * l; n++
    }
  const m = s / n
  return s2 / n - m * m
}

export function hex(rgb: [number, number, number]) {
  return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}
