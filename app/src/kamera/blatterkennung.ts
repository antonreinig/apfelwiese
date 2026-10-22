// Live-Erkennung des A4-Blatts in einem verkleinerten Kamerabild.
// Reiner Code ohne DOM, läuft im Worker und im Node-Test (scripts/test-blatterkennung.ts).
//
// Ablauf: Papierfarbe schätzen (hellste große Fläche) → Papierähnlichkeit je Pixel (Helligkeit und
// Abstand zum Farbort des Papiers) → Otsu-Schwelle →
// Öffnen → größte zusammenhängende Fläche → Randpunkte → vier gerade Kanten per RANSAC
// (robust gegen Äpfel oder Spiegelungen, die am Blatt anliegen) → Schnittpunkte = Ecken.

export interface Bildpuffer {
  data: Uint8ClampedArray | Uint8Array
  width: number
  height: number
}

export interface Punkt {
  x: number
  y: number
}

export type Seite = 'oben' | 'unten' | 'links' | 'rechts'

export interface Blattbefund {
  gefunden: boolean
  /** Ecken in Bildanteilen (0..1): oben links, oben rechts, unten rechts, unten links */
  ecken: Punkt[]
  /** Seiten, an denen das Blatt den Bildrand berührt */
  randBeruehrt: Seite[]
  /** Anteil der Blattfläche am Bild */
  flaechenanteil: number
  /**
   * Perspektivische Verzerrung als Wasserwaage: zeigt zur Seite des Handys,
   * die zu hoch gehalten wird. 0 = senkrecht von oben. Einheit: relativer
   * Längenunterschied gegenüberliegender Blattkanten.
   */
  neigung: Punkt
  /** Drehung des Blatts im Bild in Grad (0 = gerade) */
  drehung: number
}

const LEER: Blattbefund = {
  gefunden: false,
  ecken: [],
  randBeruehrt: [],
  flaechenanteil: 0,
  neigung: { x: 0, y: 0 },
  drehung: 0,
}

export function erkenneBlatt(bild: Bildpuffer): Blattbefund {
  const { width: w, height: h, data } = bild
  const n = w * h

  // 1. Papierfarbe schätzen. Je nach Licht wirkt das weiße Blatt bläulich, grünlich oder gelblich;
  //    es ist aber immer die hellste große, gleichfarbige Fläche. Erst grob über die Helligkeit,
  //    dann den Farbort (Anteile r, g, b) der hellsten Pixel dieser Fläche als Papierfarbe nehmen.
  const hell = new Uint8Array(n)
  const histoHell = new Uint32Array(256)
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const l = (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8
    hell[i] = l
    histoHell[l]++
  }
  const grob = new Uint8Array(n)
  const schwelleHell = Math.max(otsu(histoHell, n), 80)
  for (let i = 0; i < n; i++) grob[i] = hell[i] > schwelleHell ? 1 : 0
  const grobFlaeche = groessteFlaeche(dehnen(erodieren(grob, w, h), w, h), w, h)
  if (grobFlaeche.groesse < n * 0.06) return LEER
  // hellste 40 % der groben Fläche
  const histoFlaeche = new Uint32Array(256)
  for (let i = 0; i < n; i++) if (grobFlaeche.label[i]) histoFlaeche[hell[i]]++
  let ab = 255
  for (let z = 0; ab > 0; ab--) { z += histoFlaeche[ab]; if (z > grobFlaeche.groesse * 0.4) break }
  let pr = 0, pg = 0, pb = 0, pn = 0
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    if (!grobFlaeche.label[i] || hell[i] < ab) continue
    const summe = data[p] + data[p + 1] + data[p + 2] + 1
    pr += data[p] / summe; pg += data[p + 1] / summe; pb += data[p + 2] / summe; pn++
  }
  pr /= pn; pg /= pn; pb /= pn

  // 2. Papierähnlichkeit je Pixel: hell und nah am Farbort des Papiers. Graues Holz oder Stahl sind
  //    dunkler und anders getönt, Äpfel deutlich bunter. Danach Otsu-Schwelle.
  const weiss = new Uint8Array(n)
  const histo = new Uint32Array(256)
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const summe = data[p] + data[p + 1] + data[p + 2] + 1
    const dr = data[p] / summe - pr, dg = data[p + 1] / summe - pg, db = data[p + 2] / summe - pb
    const abstand = Math.sqrt(dr * dr + dg * dg + db * db)
    const m = Math.max(0, Math.min(255, Math.round(hell[i] - abstand * 1400)))
    weiss[i] = m
    histo[m]++
  }
  // 2b. Flächenwachstum: von den hellsten Papierstellen aus wachsen, solange der Übergang zum
  //     Nachbarpixel weich ist. Schatten auf dem Blatt verlaufen allmählich, die Kante zum Tisch ist
  //     ein harter Sprung. So bleibt eine abgeschattete Blatthälfte dabei und helles Holz draußen.
  const glatt = new Float32Array(n)
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      let summe = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) summe += weiss[(y + dy) * w + x + dx]
      glatt[y * w + x] = summe / 9
    }
  const boden = Math.max(60, ab * 0.45)
  const toleranz = Math.max(4, ab * 0.035)
  const maske = new Uint8Array(n)
  const stapel = new Int32Array(n)
  let spitze = 0
  for (let i = 0; i < n; i++) if (grobFlaeche.label[i] && hell[i] >= ab && glatt[i] >= boden) { maske[i] = 1; stapel[spitze++] = i }
  while (spitze) {
    const i = stapel[--spitze]
    const x = i % w
    const nachbarn = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < (h - 1) * w ? i + w : -1]
    for (const j of nachbarn) {
      if (j < 0 || maske[j] || glatt[j] < boden) continue
      if (Math.abs(glatt[j] - glatt[i]) <= toleranz) { maske[j] = 1; stapel[spitze++] = j }
    }
  }
  void otsu(histo, n) // Histogramm bleibt für Tests erhalten

  // 3. Öffnen (3×3), trennt dünne Verbindungen zu hellen Dingen neben dem Blatt
  const geoeffnet = dehnen(erodieren(maske, w, h), w, h)

  // 4. Größte zusammenhängende Fläche
  const { label, groesse } = groessteFlaeche(geoeffnet, w, h)
  if (groesse < n * 0.06) return LEER

  // Randpunkte der Fläche: je Zeile ganz links und rechts, je Spalte ganz oben und unten
  const rand: Punkt[] = []
  const innen: Punkt[] = [] // Randpunkte, die nicht auf dem Bildrand liegen
  for (let y = 0; y < h; y++) {
    let l = -1, r = -1
    for (let x = 0; x < w; x++) if (label[y * w + x]) { if (l < 0) l = x; r = x }
    if (l >= 0) {
      rand.push({ x: l, y }, { x: r + 1, y })
      if (l > 0) innen.push({ x: l, y })
      if (r < w - 1) innen.push({ x: r + 1, y })
    }
  }
  for (let x = 0; x < w; x++) {
    let o = -1, u = -1
    for (let y = 0; y < h; y++) if (label[y * w + x]) { if (o < 0) o = y; u = y }
    if (o >= 0) {
      rand.push({ x, y: o }, { x, y: u + 1 })
      if (o > 0) innen.push({ x, y: o })
      if (u < h - 1) innen.push({ x, y: u + 1 })
    }
  }

  // 5. Vier Kanten per RANSAC; Ersatz: konvexe Hülle auf vier Ecken reduziert
  let viereck = viereckAusKanten(innen, w, h)
  if (!viereck) {
    const huelle = konvexeHuelle(rand)
    if (huelle.length < 4) return LEER
    viereck = aufVierReduzieren(huelle)
    viereck = kantenNachfitten(viereck, rand) ?? viereck
  }
  viereck = sortiereEcken(viereck)

  // 6. Kennzahlen. Randberührung aus den Ecken: helle Flächen außerhalb des Blatts
  // (Spiegelungen, Äpfel) dürfen hier keinen Fehlalarm auslösen.
  const randBeruehrt: Seite[] = []
  const m = 1.5
  if (viereck.some((p) => p.y < m)) randBeruehrt.push('oben')
  if (viereck.some((p) => p.y > h - m)) randBeruehrt.push('unten')
  if (viereck.some((p) => p.x < m)) randBeruehrt.push('links')
  if (viereck.some((p) => p.x > w - m)) randBeruehrt.push('rechts')

  const [ol, or, ur, ul] = viereck
  const oben = abstand(ol, or), unten = abstand(ul, ur)
  const links = abstand(ol, ul), rechts = abstand(or, ur)
  // Kürzere Kante = weiter weg = diese Seite des Handys ist angehoben.
  const neigung = {
    x: (links - rechts) / ((links + rechts) / 2),
    y: (oben - unten) / ((oben + unten) / 2),
  }
  // Drehung: mittlere Abweichung der Seitenkanten von der Senkrechten
  const winkelL = Math.atan2(ul.x - ol.x, ul.y - ol.y)
  const winkelR = Math.atan2(ur.x - or.x, ur.y - or.y)
  const drehung = (-(winkelL + winkelR) / 2) * (180 / Math.PI)

  return {
    gefunden: true,
    ecken: viereck.map((p) => ({ x: p.x / w, y: p.y / h })),
    randBeruehrt,
    flaechenanteil: vieleckFlaeche(viereck) / n,
    neigung,
    drehung,
  }
}

// ---------------------------------------------------------------------------
// Bewertung für die Anleitung beim Fotografieren

export type Hinweisstufe = 'fehlt' | 'korrigieren' | 'gut'

export interface Hinweis {
  stufe: Hinweisstufe
  text: string
}

export const GRENZEN = {
  neigungGut: 0.07, // 7 % Längenunterschied gegenüberliegender Kanten, etwa 8–10° Schräglage
  flaecheMin: 0.4,
  eckenAbstand: 0.015,
  drehungMax: 12,
}

export function bewerteBefund(b: Blattbefund): Hinweis {
  if (!b.gefunden) {
    return { stufe: 'fehlt', text: 'Kein Blatt erkannt. Leg das weiße A4-Blatt auf eine dunkle Fläche und halte das Handy darüber.' }
  }
  const r = new Set(b.randBeruehrt)
  if (r.size > 0 || b.ecken.some((p) => p.x < GRENZEN.eckenAbstand || p.y < GRENZEN.eckenAbstand || p.x > 1 - GRENZEN.eckenAbstand || p.y > 1 - GRENZEN.eckenAbstand)) {
    if ((r.has('oben') && r.has('unten')) || (r.has('links') && r.has('rechts'))) {
      return { stufe: 'korrigieren', text: 'Das Blatt ist zu groß im Bild. Geh etwas weiter weg.' }
    }
    const seite = [...r][0]
    const richtung: Record<Seite, string> = {
      oben: 'Das Blatt ragt oben aus dem Bild. Schieb das Handy etwas nach oben.',
      unten: 'Das Blatt ragt unten aus dem Bild. Schieb das Handy etwas nach unten.',
      links: 'Das Blatt ragt links aus dem Bild. Schieb das Handy etwas nach links.',
      rechts: 'Das Blatt ragt rechts aus dem Bild. Schieb das Handy etwas nach rechts.',
    }
    return { stufe: 'korrigieren', text: seite ? richtung[seite] : 'Eine Ecke fehlt. Alle vier Ecken müssen im Bild sein.' }
  }
  if (b.flaechenanteil < GRENZEN.flaecheMin) {
    return { stufe: 'korrigieren', text: 'Geh näher heran, bis das Blatt den Rahmen fast füllt.' }
  }
  const { x, y } = b.neigung
  if (Math.abs(x) > GRENZEN.neigungGut || Math.abs(y) > GRENZEN.neigungGut) {
    // Die stärkere Achse zuerst korrigieren
    if (Math.abs(y) >= Math.abs(x)) {
      return { stufe: 'korrigieren', text: y < 0 ? 'Handy schräg: obere Kante etwas absenken.' : 'Handy schräg: untere Kante etwas absenken.' }
    }
    return { stufe: 'korrigieren', text: x < 0 ? 'Handy schräg: linke Kante etwas absenken.' : 'Handy schräg: rechte Kante etwas absenken.' }
  }
  if (Math.abs(b.drehung) > GRENZEN.drehungMax) {
    return { stufe: 'korrigieren', text: 'Dreh das Handy, bis das Blatt gerade im Rahmen liegt.' }
  }
  return { stufe: 'gut', text: 'Gut so. Ruhig halten.' }
}

/** Mittlere Bewegung der Ecken zwischen zwei Befunden (Bildanteile) */
export function eckenBewegung(a: Blattbefund, b: Blattbefund): number {
  if (!a.gefunden || !b.gefunden) return 1
  let s = 0
  for (let i = 0; i < 4; i++) s += abstand(a.ecken[i], b.ecken[i])
  return s / 4
}


// ---------------------------------------------------------------------------
// Kantensuche

interface Linie {
  p: Punkt // Punkt auf der Linie
  d: Punkt // Richtung (Einheitsvektor)
  stuetze: number // Anzahl passender Randpunkte
}

/** Einfacher Zufallsgenerator mit festem Startwert, damit die Erkennung reproduzierbar ist */
function zufall(start: number) {
  let s = start >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function findeLinien(punkte: Punkt[], w: number, h: number): Linie[] {
  const linien: Linie[] = []
  const frei = new Uint8Array(punkte.length).fill(1)
  const toleranz = Math.max(1.5, w * 0.006)
  const minStuetze = Math.min(w, h) * 0.18
  const rnd = zufall(12345)
  for (let runde = 0; runde < 6; runde++) {
    const kandidaten: number[] = []
    for (let i = 0; i < punkte.length; i++) if (frei[i]) kandidaten.push(i)
    if (kandidaten.length < minStuetze) break
    let beste: Linie | null = null
    for (let it = 0; it < 250; it++) {
      const a = punkte[kandidaten[Math.floor(rnd() * kandidaten.length)]]
      const b = punkte[kandidaten[Math.floor(rnd() * kandidaten.length)]]
      const len = abstand(a, b)
      if (len < Math.min(w, h) * 0.1) continue
      const d = { x: (b.x - a.x) / len, y: (b.y - a.y) / len }
      let n = 0
      for (const i of kandidaten) {
        const q = punkte[i]
        if (Math.abs((q.x - a.x) * d.y - (q.y - a.y) * d.x) < toleranz) n++
      }
      if (!beste || n > beste.stuetze) beste = { p: a, d, stuetze: n }
    }
    if (!beste || beste.stuetze < minStuetze) break
    // Mit allen passenden Punkten verfeinern (Hauptachse)
    const nah: Punkt[] = []
    for (const i of kandidaten) {
      const q = punkte[i]
      if (Math.abs((q.x - beste.p.x) * beste.d.y - (q.y - beste.p.y) * beste.d.x) < toleranz * 2) { nah.push(q); frei[i] = 0 }
    }
    linien.push({ ...hauptachse(nah), stuetze: beste.stuetze })
  }
  return linien
}

function hauptachse(punkte: Punkt[]): { p: Punkt; d: Punkt } {
  let mx = 0, my = 0
  for (const q of punkte) { mx += q.x; my += q.y }
  mx /= punkte.length; my /= punkte.length
  let sxx = 0, syy = 0, sxy = 0
  for (const q of punkte) { const dx = q.x - mx, dy = q.y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy }
  const winkel = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  return { p: { x: mx, y: my }, d: { x: Math.cos(winkel), y: Math.sin(winkel) } }
}

/**
 * Wählt aus den gefundenen Linien je zwei eher senkrechte und eher waagrechte Kanten.
 * Fehlt eine Kante (Blatt ragt aus dem Bild), wird der Bildrand auf dieser Seite eingesetzt.
 */
function viereckAusKanten(punkte: Punkt[], w: number, h: number): Punkt[] | null {
  const linien = findeLinien(punkte, w, h)
  const senkrecht = linien.filter((l) => Math.abs(l.d.y) > Math.abs(l.d.x))
  const waagrecht = linien.filter((l) => Math.abs(l.d.y) <= Math.abs(l.d.x))
  const paar = (gruppe: Linie[], achse: 'x' | 'y', groesse: number): [Linie, Linie] | null => {
    // Lage jeder Linie in der Bildmitte der anderen Achse
    const lage = (l: Linie) => {
      if (achse === 'x') { const t = (h / 2 - l.p.y) / l.d.y; return l.p.x + t * l.d.x }
      const t = (w / 2 - l.p.x) / l.d.x; return l.p.y + t * l.d.y
    }
    const sortiert = [...gruppe].sort((a, b) => b.stuetze - a.stuetze)
    const erste = sortiert[0]
    if (!erste) return null
    const zweite = sortiert.find((l) => l !== erste && Math.abs(lage(l) - lage(erste)) > groesse * 0.3)
    const bildrand = (seite: 'min' | 'max'): Linie =>
      achse === 'x'
        ? { p: { x: seite === 'min' ? 0 : w, y: 0 }, d: { x: 0, y: 1 }, stuetze: 0 }
        : { p: { x: 0, y: seite === 'min' ? 0 : h }, d: { x: 1, y: 0 }, stuetze: 0 }
    if (zweite) return lage(erste) < lage(zweite) ? [erste, zweite] : [zweite, erste]
    // Nur eine Kante gefunden: Gegenkante liegt außerhalb des Bilds
    return lage(erste) > groesse / 2 ? [bildrand('min'), erste] : [erste, bildrand('max')]
  }
  const lr = paar(senkrecht, 'x', w)
  const ou = paar(waagrecht, 'y', h)
  if (!lr || !ou) return null
  const [l, r] = lr, [o, u] = ou
  const ecken = [schnitt(o.p, o.d, l.p, l.d), schnitt(o.p, o.d, r.p, r.d), schnitt(u.p, u.d, r.p, r.d), schnitt(u.p, u.d, l.p, l.d)]
  if (ecken.some((e) => !e || e.x < -w * 0.5 || e.x > w * 1.5 || e.y < -h * 0.5 || e.y > h * 1.5)) return null
  return ecken as Punkt[]
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen

function otsu(histo: Uint32Array, n: number): number {
  let summe = 0
  for (let i = 0; i < 256; i++) summe += i * histo[i]
  let sumB = 0, wB = 0, beste = 0, schwelle = 127
  for (let t = 0; t < 256; t++) {
    wB += histo[t]
    if (wB === 0) continue
    const wF = n - wB
    if (wF === 0) break
    sumB += t * histo[t]
    const mB = sumB / wB, mF = (summe - sumB) / wF
    const zwischen = wB * wF * (mB - mF) * (mB - mF)
    if (zwischen > beste) { beste = zwischen; schwelle = t }
  }
  return schwelle
}

function erodieren(m: Uint8Array, w: number, h: number): Uint8Array {
  const o = new Uint8Array(m.length)
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      o[i] = m[i] & m[i - 1] & m[i + 1] & m[i - w] & m[i + w] & m[i - w - 1] & m[i - w + 1] & m[i + w - 1] & m[i + w + 1]
    }
  // Bildrand übernehmen, damit Berührungen mit dem Rand erhalten bleiben
  for (let x = 0; x < w; x++) { o[x] = m[x] & m[x + w]; o[(h - 1) * w + x] = m[(h - 1) * w + x] & m[(h - 2) * w + x] }
  for (let y = 0; y < h; y++) { o[y * w] = m[y * w] & m[y * w + 1]; o[y * w + w - 1] = m[y * w + w - 1] & m[y * w + w - 2] }
  return o
}

function dehnen(m: Uint8Array, w: number, h: number): Uint8Array {
  const o = new Uint8Array(m.length)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!m[i]) continue
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx >= 0 && xx < w) o[yy * w + xx] = 1
        }
      }
    }
  return o
}

function groessteFlaeche(m: Uint8Array, w: number, h: number) {
  const marke = new Int32Array(m.length)
  const stapel = new Int32Array(m.length)
  let naechste = 0, beste = 0, besteGroesse = 0
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || marke[s]) continue
    naechste++
    let oben = 0, groesse = 0
    stapel[oben++] = s
    marke[s] = naechste
    while (oben > 0) {
      const i = stapel[--oben]
      groesse++
      const x = i % w
      if (x > 0 && m[i - 1] && !marke[i - 1]) { marke[i - 1] = naechste; stapel[oben++] = i - 1 }
      if (x < w - 1 && m[i + 1] && !marke[i + 1]) { marke[i + 1] = naechste; stapel[oben++] = i + 1 }
      if (i >= w && m[i - w] && !marke[i - w]) { marke[i - w] = naechste; stapel[oben++] = i - w }
      if (i < (h - 1) * w && m[i + w] && !marke[i + w]) { marke[i + w] = naechste; stapel[oben++] = i + w }
    }
    if (groesse > besteGroesse) { besteGroesse = groesse; beste = naechste }
  }
  const label = new Uint8Array(m.length)
  for (let i = 0; i < m.length; i++) if (marke[i] === beste) label[i] = 1
  return { label, groesse: besteGroesse }
}

function kreuz(o: Punkt, a: Punkt, b: Punkt) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function konvexeHuelle(punkte: Punkt[]): Punkt[] {
  const p = [...punkte].sort((a, b) => a.x - b.x || a.y - b.y)
  if (p.length < 3) return p
  const unten: Punkt[] = []
  for (const q of p) {
    while (unten.length >= 2 && kreuz(unten[unten.length - 2], unten[unten.length - 1], q) <= 0) unten.pop()
    unten.push(q)
  }
  const oben: Punkt[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (oben.length >= 2 && kreuz(oben[oben.length - 2], oben[oben.length - 1], q) <= 0) oben.pop()
    oben.push(q)
  }
  oben.pop(); unten.pop()
  return unten.concat(oben)
}

/** Entfernt so lange die Ecke mit dem kleinsten Flächenbeitrag, bis vier übrig sind. */
function aufVierReduzieren(huelle: Punkt[]): Punkt[] {
  const p = [...huelle]
  while (p.length > 4) {
    let min = Infinity, idx = 0
    for (let i = 0; i < p.length; i++) {
      const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length]
      const f = Math.abs(kreuz(a, b, c))
      if (f < min) { min = f; idx = i }
    }
    p.splice(idx, 1)
  }
  return p
}

/** Passt an jede Viereckkante eine Gerade durch die nahen Randpunkte an und schneidet sie. */
function kantenNachfitten(v: Punkt[], rand: Punkt[]): Punkt[] | null {
  const linien: { p: Punkt; d: Punkt }[] = []
  for (let k = 0; k < 4; k++) {
    const a = v[k], b = v[(k + 1) % 4]
    const len = abstand(a, b)
    if (len < 4) return null
    const d = { x: (b.x - a.x) / len, y: (b.y - a.y) / len }
    const nah: Punkt[] = []
    for (const q of rand) {
      const t = (q.x - a.x) * d.x + (q.y - a.y) * d.y
      if (t < len * 0.1 || t > len * 0.9) continue // Ecken auslassen
      const dist = Math.abs((q.x - a.x) * d.y - (q.y - a.y) * d.x)
      if (dist < Math.max(2, len * 0.02)) nah.push(q)
    }
    if (nah.length < 6) { linien.push({ p: a, d }); continue }
    // Hauptachse der Punktwolke
    let mx = 0, my = 0
    for (const q of nah) { mx += q.x; my += q.y }
    mx /= nah.length; my /= nah.length
    let sxx = 0, syy = 0, sxy = 0
    for (const q of nah) { const dx = q.x - mx, dy = q.y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy }
    const winkel = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    linien.push({ p: { x: mx, y: my }, d: { x: Math.cos(winkel), y: Math.sin(winkel) } })
  }
  const neu: Punkt[] = []
  for (let k = 0; k < 4; k++) {
    const l1 = linien[(k + 3) % 4], l2 = linien[k]
    const s = schnitt(l1.p, l1.d, l2.p, l2.d)
    if (!s || abstand(s, v[k]) > 25) return null
    neu.push(s)
  }
  return neu
}

function schnitt(p1: Punkt, d1: Punkt, p2: Punkt, d2: Punkt): Punkt | null {
  const det = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(det) < 1e-6) return null
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / det
  return { x: p1.x + t * d1.x, y: p1.y + t * d1.y }
}

/** Reihenfolge: oben links, oben rechts, unten rechts, unten links */
function sortiereEcken(v: Punkt[]): Punkt[] {
  const mx = v.reduce((s, p) => s + p.x, 0) / 4
  const my = v.reduce((s, p) => s + p.y, 0) / 4
  const sortiert = [...v].sort((a, b) => Math.atan2(a.y - my, a.x - mx) - Math.atan2(b.y - my, b.x - mx))
  // atan2 aufsteigend läuft im Bild (y nach unten) im Uhrzeigersinn; Start bei der Ecke oben links
  let start = 0, min = Infinity
  for (let i = 0; i < 4; i++) {
    const s = sortiert[i].x + sortiert[i].y
    if (s < min) { min = s; start = i }
  }
  return [0, 1, 2, 3].map((k) => sortiert[(start + k) % 4])
}

function abstand(a: Punkt, b: Punkt) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function vieleckFlaeche(v: Punkt[]) {
  let s = 0
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length]
    s += a.x * b.y - b.x * a.y
  }
  return Math.abs(s) / 2
}
