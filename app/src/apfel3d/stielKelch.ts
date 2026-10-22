// Stiel und Kelch als eigene three.js-Körper.
// Maßstab: Fruchtbreite = 1. Beide Funktionen liefern eine Gruppe, deren Ursprung am Ansatzpunkt
// liegt (Grund der Stielgrube bzw. Mitte der Kelchgrube); die lokale +y-Achse zeigt aus der
// Frucht heraus (beim Stiel nach oben, beim Kelch nach unten). Positionieren und Ausrichten
// übernimmt der Aufrufer (modell.ts).
//
// Botanik in Kürze
// - Stiel: holzig, zur Frucht hin verdickt (bei fleischigen Stielen keulig), gleichmäßig verjüngt,
//   oben die flache, schräge Abrissstelle vom Fruchtholz (hell, dunkler Rand, leicht verbreitert),
//   feine Längsrillen, Lentizellen, stellenweise graubraune Rinde, Sonnenseite rötlich.
// - Kelch: fünf vertrocknete, schmal-dreieckige Kelchblätter, am Grund zu einer kleinen filzigen
//   Wulst verwachsen; Spitzen dunkler und eingerollt. Geschlossen neigen sich die Blätter über
//   der Kelchhöhle zusammen, offen sind sie zurückgeschlagen und geben den Blick auf die
//   dunkle Höhle mit den vertrockneten Staubgefäß- und Griffelresten frei.
//
// Alle Maße werden in Millimetern gedacht und mit 1 / breiteMm in Modelleinheiten umgerechnet.
// Die Grubenwand wird aus dem Längsumriss (geometrie.ts) gelesen, damit Kelchblätter und Wulst
// auf der Fruchtoberfläche aufliegen und der Stiel nicht durch die Grubenwand sticht.

import * as THREE from 'three'
import type { ApfelParameter } from './darstellung.ts'
import { profil } from './geometrie.ts'

export interface Optionen {
  /** Schnittebenen für Schnittansichten (Weltkoordinaten) */
  clipping?: THREE.Plane[]
}

// ------------------------------------------------------------------ kleine Hilfen

const klemme = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const glatt = (a: number, b: number, x: number) => {
  const t = klemme((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const mischen = (a: number, b: number, t: number) => a + (b - a) * t

/** Wiederholbarer Zufall (mulberry32) aus der Saat des Apfels */
function zufall(saat: number) {
  let a = (Math.imul(Math.floor(saat * 1009) ^ 0x9e3779b9, 0x85ebca6b) >>> 0) || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Höhe der Grubenwand über dem Grubengrund in Abhängigkeit vom Abstand zur Achse, im lokalen
 * Rahmen von Stiel bzw. Kelch (+y aus der Frucht heraus). Dazu die Umkehrung: Radius der Grube
 * in einer gegebenen Höhe.
 */
function grubenwand(p: ApfelParameter, seite: 'stiel' | 'kelch') {
  const pr = profil(p, 720)
  const halbe = seite === 'kelch' ? pr.slice(0, 361) : pr.slice(360).reverse()
  const pol = halbe[0].y
  const xs: number[] = []
  const hs: number[] = []
  for (const q of halbe) {
    if (xs.length && q.x <= xs[xs.length - 1]) break // nur der monoton steigende Teil am Pol
    xs.push(q.x)
    hs.push(seite === 'kelch' ? pol - q.y : q.y - pol)
  }
  // Höhe soll mit dem Radius steigen (Grube); flache Kelchseiten ohne Grube: nicht unter 0
  let hoechste = 0
  for (let i = 0; i < hs.length; i++) { hoechste = Math.max(hoechste, hs[i]); hs[i] = hoechste }
  const hoehe = (r: number) => {
    if (r <= xs[0]) return hs[0]
    for (let i = 1; i < xs.length; i++) {
      if (r <= xs[i]) {
        const t = (r - xs[i - 1]) / (xs[i] - xs[i - 1])
        return mischen(hs[i - 1], hs[i], t)
      }
    }
    return hs[hs.length - 1]
  }
  const radiusBei = (h: number) => {
    if (h <= hs[0]) return xs[0]
    for (let i = 1; i < hs.length; i++) {
      if (h <= hs[i] && hs[i] > hs[i - 1]) {
        const t = (h - hs[i - 1]) / (hs[i] - hs[i - 1])
        return mischen(xs[i - 1], xs[i], t)
      }
    }
    return Infinity // über dem Grubenrand
  }
  return { hoehe, radiusBei, rand: hs[hs.length - 1] }
}

/**
 * Höhe der Fruchtoberfläche, wie das Dreiecksnetz sie zeigt: über den Ringen des Längsumrisses
 * (bei 40 und 64 Zeilen, Medaillon und große Ansicht) linear verbunden, nie unter der wahren Kurve.
 */
function sehnenHoehe(p: ApfelParameter, hoehe: (r: number) => number) {
  const ringe = [40, 64].map((n) => {
    const xs: number[] = []
    // Ringradien am Pol: gleiche Winkelteilung wie profil(); nur die ersten Ringe sind wichtig
    const pr = profil(p, n)
    for (let i = 0; i <= 8; i++) xs.push(pr[i].x)
    return xs
  })
  return (r: number) => {
    let h = hoehe(r)
    for (const xs of ringe) {
      for (let i = 1; i < xs.length; i++) {
        if (r <= xs[i]) {
          const t = (r - xs[i - 1]) / Math.max(1e-9, xs[i] - xs[i - 1])
          h = Math.max(h, mischen(hoehe(xs[i - 1]), hoehe(xs[i]), t))
          break
        }
      }
    }
    return h
  }
}

// ------------------------------------------------------------------ Netz-Bauer

interface Ecke {
  p: THREE.Vector3
  u: number
  v: number
  c: THREE.Color
}

/** Sammelt Ecken und Dreiecke mehrerer Teile in einer Geometrie (eine Zeichenoperation) */
class Netz {
  pos: number[] = []
  uvs: number[] = []
  col: number[] = []
  idx: number[] = []
  naehte: [number, number][] = []

  get anzahl() { return this.pos.length / 3 }

  ecke(e: Ecke) {
    this.pos.push(e.p.x, e.p.y, e.p.z)
    this.uvs.push(e.u, e.v)
    this.col.push(e.c.r, e.c.g, e.c.b)
    return this.anzahl - 1
  }

  /**
   * Gitter aus zeilen × spalten Ecken. 'ring': Spalten schließen ohne doppelte Ecken;
   * 'naht': letzte Spalte liegt auf der ersten (für Texturkoordinaten), Normalen werden gemittelt.
   */
  gitter(zeilen: number, spalten: number, art: 'ring' | 'naht', f: (i: number, j: number) => Ecke) {
    const start = this.anzahl
    for (let i = 0; i < zeilen; i++) for (let j = 0; j < spalten; j++) this.ecke(f(i, j))
    const quer = art === 'ring' ? spalten : spalten - 1
    for (let i = 0; i < zeilen - 1; i++) {
      for (let j = 0; j < quer; j++) {
        const a = start + i * spalten + j
        const b = start + i * spalten + ((j + 1) % spalten)
        const c = a + spalten
        const d = b + spalten
        this.idx.push(a, b, d, a, d, c)
      }
    }
    if (art === 'naht') for (let i = 0; i < zeilen; i++) this.naehte.push([start + i * spalten, start + i * spalten + spalten - 1])
    return start
  }

  geometrie() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    g.setIndex(this.idx)
    g.computeVertexNormals()
    const n = g.getAttribute('normal') as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (const [a, b] of this.naehte) {
      v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize()
      n.setXYZ(a, v.x, v.y, v.z)
      n.setXYZ(b, v.x, v.y, v.z)
    }
    g.computeBoundingSphere()
    return g
  }
}

// ------------------------------------------------------------------ prozedurale Bilder (zwischengespeichert)

const hatDokument = typeof document !== 'undefined'
const bildSpeicher = new Map<string, HTMLCanvasElement[]>()

function bilder(schluessel: string, mache: () => HTMLCanvasElement[]) {
  let b = bildSpeicher.get(schluessel)
  if (!b) {
    b = mache()
    if (bildSpeicher.size > 32) bildSpeicher.delete(bildSpeicher.keys().next().value!)
    bildSpeicher.set(schluessel, b)
  }
  return b
}

function leinwand(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** Zeichnet f an der Stelle und an den Kopien jenseits der Ränder (nahtlos wiederholbar) */
function ueberall(w: number, h: number, x: number, y: number, rand: number, f: (x: number, y: number) => void) {
  for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
    const xx = x + dx, yy = y + dy
    if (xx > -rand && xx < w + rand && yy > -rand && yy < h + rand) f(xx, yy)
  }
}

function hslAus(farbe: string) {
  const hsl = { h: 0, s: 0, l: 0 }
  new THREE.Color(farbe).getHSL(hsl, THREE.SRGBColorSpace)
  return hsl
}

function textur(bild: HTMLCanvasElement, farbig: boolean) {
  const t = new THREE.CanvasTexture(bild)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  if (farbig) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Stielrinde: Farbbild und Reliefbild, 128 × 256 Pixel für 8 × 16 mm Stieloberfläche
 * (u rund um den Stiel, v entlang). Längsrillen, Rinde, Lentizellen, feine Fasern.
 */
function stielBilder(farbe: string, saat: number) {
  return bilder(`stiel|${farbe}|${saat}`, () => {
    const W = 128, H = 256
    const [bf, f] = leinwand(W, H)
    const [br, r] = leinwand(W, H)
    const rnd = zufall(saat * 3.7 + 11)
    const { h, s, l } = hslAus(farbe)
    const ton = (dl: number, sf = 1, dh = 0, a = 1) => `hsla(${(h + dh) * 360},${klemme(s * sf) * 100}%,${klemme(l + dl) * 100}%,${a})`
    const grau = (g: number, a = 1) => `rgba(${g},${g},${g},${a})`
    f.fillStyle = ton(-0.03, 1.2)
    f.fillRect(0, 0, W, H)
    r.fillStyle = grau(128)
    r.fillRect(0, 0, W, H)

    // Fleckung
    for (let k = 0; k < 70; k++) {
      const x = rnd() * W, y = rnd() * H, rx = 3 + rnd() * 9, ry = 8 + rnd() * 26
      const hell = rnd() < 0.5 ? -1 : 1
      ueberall(W, H, x, y, 40, (xx, yy) => {
        f.fillStyle = ton(hell * (0.03 + rnd() * 0.04), 1, 0, 0.35)
        f.beginPath(); f.ellipse(xx, yy, rx, ry, 0, 0, Math.PI * 2); f.fill()
      })
    }

    // Graubraune Rinde in länglichen Platten mit feinen Querrissen
    const rinde = 0.25 + rnd() * 0.45
    for (let k = 0; k < Math.round(16 * rinde); k++) {
      const x = rnd() * W, y = rnd() * H, rx = 6 + rnd() * 14, ry = 18 + rnd() * 50
      const ecken: [number, number][] = []
      for (let e = 0; e < 9; e++) {
        const a = (e / 9) * Math.PI * 2, q = 0.7 + rnd() * 0.45
        ecken.push([Math.cos(a) * rx * q, Math.sin(a) * ry * q])
      }
      ueberall(W, H, x, y, 70, (xx, yy) => {
        for (const [ctx, stil] of [[f, ton(0.05, 0.55, -0.01, 0.5)], [r, grau(158, 0.8)]] as const) {
          ctx.fillStyle = stil
          ctx.beginPath()
          ecken.forEach(([ex, ey], e) => (e ? ctx.lineTo(xx + ex, yy + ey) : ctx.moveTo(xx + ex, yy + ey)))
          ctx.closePath(); ctx.fill()
        }
        for (let c = 0; c < 4; c++) {
          const cy = yy + (rnd() - 0.5) * ry * 1.4, cx = xx + (rnd() - 0.5) * rx
          const lang = 2 + rnd() * rx
          f.strokeStyle = ton(-0.12, 1, 0, 0.6); f.lineWidth = 0.8
          f.beginPath(); f.moveTo(cx - lang / 2, cy); f.lineTo(cx + lang / 2, cy + (rnd() - 0.5) * 2); f.stroke()
          r.strokeStyle = grau(70, 0.9); r.lineWidth = 1.2
          r.beginPath(); r.moveTo(cx - lang / 2, cy); r.lineTo(cx + lang / 2, cy); r.stroke()
        }
      })
    }

    // Längsrillen (Furchen dunkel, Grate hell); ganzzahlige Wellen, damit die Textur nahtlos ist
    const rillen = 9 + Math.floor(rnd() * 4)
    for (let k = 0; k < rillen; k++) {
      const x0 = ((k + rnd() * 0.5) * W) / rillen
      const welle = 1 + Math.floor(rnd() * 2), ph = rnd() * 6.28, amp = 1 + rnd() * 1.6
      const linie = (ctx: CanvasRenderingContext2D, dx: number) => {
        for (const sx of [-W, 0, W]) {
          ctx.beginPath()
          for (let y = 0; y <= H; y += 8) {
            const x = x0 + dx + sx + amp * Math.sin((y / H) * Math.PI * 2 * welle + ph)
            if (y) ctx.lineTo(x, y); else ctx.moveTo(x, y)
          }
          ctx.stroke()
        }
      }
      f.strokeStyle = ton(-0.09, 1.05, 0, 0.55); f.lineWidth = 1.5; linie(f, 0)
      r.strokeStyle = grau(60, 0.9); r.lineWidth = 2.2; linie(r, 0)
      f.strokeStyle = ton(0.06, 0.9, 0, 0.35); f.lineWidth = 1.2; linie(f, W / rillen / 2)
      r.strokeStyle = grau(190, 0.7); r.lineWidth = 2.4; linie(r, W / rillen / 2)
    }

    // Feine Fasern
    for (let k = 0; k < 420; k++) {
      const x = rnd() * W, y = rnd() * H, lang = 3 + rnd() * 10, hell = rnd() < 0.5
      f.strokeStyle = ton(hell ? 0.08 : -0.08, 1, 0, 0.18); f.lineWidth = 0.7
      f.beginPath(); f.moveTo(x, y); f.lineTo(x + (rnd() - 0.5), y + lang); f.stroke()
      r.strokeStyle = grau(hell ? 165 : 95, 0.25); r.lineWidth = 0.8
      r.beginPath(); r.moveTo(x, y); r.lineTo(x, y + lang); r.stroke()
    }

    // Lentizellen: kleine, längliche, helle Korkwarzen mit dunklem Spalt
    const lentizellen = 10 + Math.floor(rnd() * 12)
    for (let k = 0; k < lentizellen; k++) {
      const x = rnd() * W, y = rnd() * H, rx = 0.7 + rnd() * 0.8, ry = 2 + rnd() * 2.4
      ueberall(W, H, x, y, 8, (xx, yy) => {
        f.fillStyle = ton(0.12, 0.6, 0.02, 0.6)
        f.beginPath(); f.ellipse(xx, yy, rx, ry, 0, 0, Math.PI * 2); f.fill()
        f.fillStyle = ton(-0.14, 1, 0, 0.7)
        f.beginPath(); f.ellipse(xx, yy, rx * 0.3, ry * 0.6, 0, 0, Math.PI * 2); f.fill()
        r.fillStyle = grau(185)
        r.beginPath(); r.ellipse(xx, yy, rx * 1.2, ry * 1.1, 0, 0, Math.PI * 2); r.fill()
        r.fillStyle = grau(110)
        r.beginPath(); r.ellipse(xx, yy, rx * 0.3, ry * 0.6, 0, 0, Math.PI * 2); r.fill()
      })
    }
    return [bf, br]
  })
}

/** Abrissstelle: helles, faseriges Holz mit dunklem Rand und dunklem Mark in der Mitte */
function abrissBilder(farbe: string, saat: number) {
  return bilder(`abriss|${farbe}|${saat}`, () => {
    const N = 64, m = N / 2
    const [bf, f] = leinwand(N, N)
    const [br, r] = leinwand(N, N)
    const rnd = zufall(saat * 5.3 + 2)
    const { h, s, l } = hslAus(farbe)
    const ton = (dl: number, sf = 1, a = 1) => `hsla(${h * 360},${klemme(s * sf) * 100}%,${klemme(l + dl) * 100}%,${a})`
    const v = f.createRadialGradient(m, m, 0, m, m, m)
    v.addColorStop(0, ton(0.14, 0.7))
    v.addColorStop(0.55, ton(0.24, 0.6))
    v.addColorStop(0.72, ton(0.12, 0.8))
    v.addColorStop(0.84, ton(-0.1, 1))
    v.addColorStop(1, ton(-0.16, 1))
    f.fillStyle = v
    f.fillRect(0, 0, N, N)
    const vr = r.createRadialGradient(m, m, 0, m, m, m)
    vr.addColorStop(0, 'rgb(120,120,120)')
    vr.addColorStop(0.6, 'rgb(140,140,140)')
    vr.addColorStop(0.82, 'rgb(170,170,170)')
    vr.addColorStop(1, 'rgb(150,150,150)')
    r.fillStyle = vr
    r.fillRect(0, 0, N, N)
    // Holzfasern: kurze radiale Striche, ausgefranst
    for (let k = 0; k < 140; k++) {
      const a = rnd() * Math.PI * 2, r0 = (0.1 + rnd() * 0.6) * m, lang = (0.05 + rnd() * 0.18) * m
      const hell = rnd() < 0.5
      f.strokeStyle = ton(hell ? 0.2 : -0.08, 0.6, 0.35); f.lineWidth = 0.8
      f.beginPath(); f.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); f.lineTo(m + Math.cos(a) * (r0 + lang), m + Math.sin(a) * (r0 + lang)); f.stroke()
      r.strokeStyle = hell ? 'rgba(200,200,200,0.5)' : 'rgba(70,70,70,0.5)'; r.lineWidth = 1
      r.beginPath(); r.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); r.lineTo(m + Math.cos(a) * (r0 + lang), m + Math.sin(a) * (r0 + lang)); r.stroke()
    }
    // Mark
    f.fillStyle = ton(-0.08, 0.9, 0.75)
    f.beginPath(); f.ellipse(m + (rnd() - 0.5) * 4, m + (rnd() - 0.5) * 4, 4 + rnd() * 2, 3 + rnd() * 2, rnd() * 3, 0, Math.PI * 2); f.fill()
    r.fillStyle = 'rgba(80,80,80,0.8)'
    r.beginPath(); r.arc(m, m, 4, 0, Math.PI * 2); r.fill()
    return [bf, br]
  })
}

/** Filz der Kelchblätter: feine helle und dunkle Härchen, grau (wird mit der Eckenfarbe multipliziert) */
function filzBild() {
  return bilder('filz', () => {
    const N = 64
    const [b, c] = leinwand(N, N)
    const rnd = zufall(4242)
    c.fillStyle = 'rgb(214,212,206)'
    c.fillRect(0, 0, N, N)
    for (let k = 0; k < 700; k++) {
      const x = rnd() * N, y = rnd() * N, a = rnd() * Math.PI, lang = 1.5 + rnd() * 4
      const g = rnd() < 0.55 ? 255 : 120
      ueberall(N, N, x, y, 6, (xx, yy) => {
        c.strokeStyle = `rgba(${g},${g},${g - 6},${0.25 + rnd() * 0.35})`
        c.lineWidth = 0.6
        c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + Math.cos(a) * lang, yy + Math.sin(a) * lang); c.stroke()
      })
    }
    return [b]
  })
}

// ------------------------------------------------------------------ Stiel

/** Schnittpunkt-freie Rahmen entlang einer Mittellinie (paralleler Transport) */
function rahmen(tangenten: THREE.Vector3[]) {
  const n: THREE.Vector3[] = []
  const b: THREE.Vector3[] = []
  let ni = new THREE.Vector3(1, 0, 0)
  for (let i = 0; i < tangenten.length; i++) {
    const t = tangenten[i]
    ni = ni.clone().addScaledVector(t, -ni.dot(t))
    if (ni.lengthSq() < 1e-10) ni = new THREE.Vector3(0, 0, 1).cross(t)
    ni.normalize()
    n.push(ni)
    b.push(new THREE.Vector3().crossVectors(ni, t).normalize())
  }
  return { n, b }
}

export function baueStiel(p: ApfelParameter, opt: Optionen = {}): THREE.Group {
  const g = new THREE.Group()
  g.name = 'Stiel'
  const mm = 1 / p.breiteMm
  const rnd = zufall(p.saat * 1.37 + 3)
  const L = Math.max(1.5, p.stielLaengeMm) * mm
  const R = (Math.max(0.6, p.stielDickeMm) / 2) * mm
  // Ab etwa 3,5 mm Dicke gilt der Stiel als fleischig: keulige Verdickung zur Frucht hin
  const fleischig = glatt(3.1, 4.3, p.stielDickeMm)
  const wand = grubenwand(p, 'stiel')
  const tiefe = 1.1 * mm // so weit steckt der Stiel im Fruchtfleisch
  const gesamt = L + tiefe

  const knoten = rnd() * 6.28 // leichte Unregelmäßigkeit der Dicke
  // Radius entlang des sichtbaren Stiels (u = 0 Grubengrund … 1 Abrissstelle)
  const radius = (u: number) =>
    R *
    (1.1 - 0.2 * u) *
    // normale Stiele: kurzer Übergang am Grund; fleischige: keulig über die ganze Länge
    (1 + (0.18 + 0.45 * fleischig) * mischen(1 - glatt(0, 0.14, u), (1 - u) ** 1.6, fleischig)) *
    (1 + 0.16 * glatt(0.86, 1, u)) *
    (1 + 0.035 * Math.sin(u * 7.3 + knoten) + 0.025 * Math.sin(u * 15.1 + 2 * knoten))

  // Mittellinie: Anfangsneigung, Biegung (zur Spitze hin zunehmend), leichte Seitenwelle
  const neigung0 = (rnd() - 0.5) * 0.28
  const ebene = (rnd() - 0.5) * 0.9 // Azimut der Biegeebene um die Achse
  const biegung = 0.04 + klemme(p.stielKruemmung) * 1.05
  const welle = (rnd() - 0.5) * 0.35
  const SCHRITTE = 160
  const ds = gesamt / SCHRITTE
  const mittellinie = (k: number) => {
    const pts: THREE.Vector3[] = []
    const pos = new THREE.Vector3(0, -tiefe, 0)
    const cosE = Math.cos(ebene), sinE = Math.sin(ebene)
    for (let i = 0; i <= SCHRITTE; i++) {
      pts.push(pos.clone())
      const u = klemme((i * ds - tiefe) / L)
      const a = k * (neigung0 + biegung * (0.45 * u + 0.55 * u * u))
      const b = k * welle * Math.sin(Math.PI * u)
      const d = new THREE.Vector3(Math.sin(a), Math.cos(a) * Math.cos(b), Math.sin(b)).normalize()
      pos.add(new THREE.Vector3(d.x * cosE - d.z * sinE, d.y, d.x * sinE + d.z * cosE).multiplyScalar(ds))
    }
    return pts
  }
  // Biegung zurücknehmen, solange der Stiel in der Grube an die Wand stößt
  let pts = mittellinie(1)
  for (let k = 1, versuch = 0; versuch < 10; versuch++) {
    const stoesst = pts.some((q, i) => {
      if (q.y < 1.5 * mm) return false
      const u = klemme((i * ds - tiefe) / L)
      return Math.hypot(q.x, q.z) + radius(u) > wand.radiusBei(q.y) - 0.25 * mm
    })
    if (!stoesst) break
    k *= 0.75
    pts = versuch === 9 ? mittellinie(0) : mittellinie(k)
  }
  const punktBei = (s: number) => {
    const f = klemme(s / ds, 0, SCHRITTE - 1e-6)
    const i = Math.floor(f)
    return pts[i].clone().lerp(pts[i + 1], f - i)
  }

  // Ringe: an beiden Enden dichter
  const RINGE = 30, SEITEN = 16
  const sPos: number[] = []
  for (let i = 0; i <= RINGE; i++) {
    const x = i / RINGE
    sPos.push(gesamt * (x - (0.13 * Math.sin(2 * Math.PI * x)) / (2 * Math.PI)))
  }
  const mitte = sPos.map(punktBei)
  const tang = sPos.map((s) => punktBei(Math.min(gesamt, s + ds)).sub(punktBei(Math.max(0, s - ds))).normalize())
  const { n: nor, b: bin } = rahmen(tang)

  // Schräge, flache Abrissstelle: die letzten Ringe werden zur Schnittebene hin geschert
  const schraeg = Math.tan(0.22 + rnd() * 0.3)
  const gamma = rnd() * Math.PI * 2
  const rEnde = radius(1) * 1.08
  const scherLaenge = Math.min(0.35 * gesamt, 2.2 * schraeg * rEnde)

  const phase1 = rnd() * 6.28, phase2 = rnd() * 6.28
  const sonne = 0.3 + rnd() * 0.35
  const ringe: THREE.Vector3[][] = []
  const netz = new Netz()
  netz.gitter(RINGE + 1, SEITEN + 1, 'naht', (i, j) => {
    const s = sPos[i]
    const u = klemme((s - tiefe) / L)
    const th = (j / SEITEN) * Math.PI * 2
    // leicht unrunder Querschnitt
    const r = radius(u) * (1 + 0.05 * Math.sin(2 * th + phase1) + 0.025 * Math.sin(3 * th + phase2))
    const off = nor[i].clone().multiplyScalar(Math.cos(th) * r).addScaledVector(bin[i], Math.sin(th) * r)
    const w = klemme((s - (gesamt - scherLaenge)) / scherLaenge)
    const d = nor[i].clone().multiplyScalar(Math.cos(gamma)).addScaledVector(bin[i], Math.sin(gamma))
    const pos = mitte[i].clone().add(off).addScaledVector(tang[i], -schraeg * off.dot(d) * w)
    if (j < SEITEN) (ringe[i] ??= []).push(pos)

    // Eckenfarbe als Tönung des Rindenbildes
    const c = new THREE.Color(1, 1, 1)
    const gruen = (1 - glatt(0, 0.18 + 0.3 * fleischig, u)) * (0.55 + 0.45 * fleischig)
    c.r *= 1 - 0.12 * gruen; c.g *= 1 + 0.1 * gruen; c.b *= 1 - 0.4 * gruen
    // Sonnenseite (−z, zum Betrachter gedreht): rötlicher Hauch
    const rot = Math.max(0, -Math.sin(th)) ** 1.5 * sonne * glatt(0.08, 0.5, u)
    c.r *= 1 + 0.3 * rot; c.g *= 1 - 0.14 * rot; c.b *= 1 - 0.18 * rot
    // dunkler Saum unter der Abrissstelle
    c.multiplyScalar(1 - 0.3 * glatt(0.93, 1, u))
    return { p: pos, u: j / SEITEN, v: (s / mm) / 16, c }
  })

  // Abrissstelle als flache, leicht unebene Scheibe
  const kappe = new Netz()
  const letzter = ringe[RINGE]
  const mittelpunkt = letzter.reduce((a, q) => a.add(q), new THREE.Vector3()).divideScalar(letzter.length)
  mittelpunkt.addScaledVector(tang[RINGE], 0.04 * rEnde)
  const weiss = new THREE.Color(1, 1, 1)
  const zentrum = kappe.ecke({ p: mittelpunkt, u: 0.5, v: 0.5, c: weiss })
  const innen: number[] = []
  const aussen: number[] = []
  for (let j = 0; j < SEITEN; j++) {
    const th = (j / SEITEN) * Math.PI * 2
    const q = letzter[j]
    const halb = mittelpunkt.clone().lerp(q, 0.55).addScaledVector(tang[RINGE], (rnd() - 0.5) * 0.06 * rEnde)
    innen.push(kappe.ecke({ p: halb, u: 0.5 + 0.5 * 0.55 * Math.cos(th), v: 0.5 + 0.5 * 0.55 * Math.sin(th), c: weiss }))
    aussen.push(kappe.ecke({ p: q, u: 0.5 + 0.5 * Math.cos(th), v: 0.5 + 0.5 * Math.sin(th), c: weiss }))
  }
  for (let j = 0; j < SEITEN; j++) {
    const k = (j + 1) % SEITEN
    kappe.idx.push(zentrum, innen[k], innen[j])
    kappe.idx.push(innen[j], innen[k], aussen[k], innen[j], aussen[k], aussen[j])
  }

  const clip = opt.clipping ?? null
  let seitenMat: THREE.MeshStandardMaterial
  let kappenMat: THREE.MeshStandardMaterial
  if (hatDokument) {
    const [farbe, relief] = stielBilder(p.stielFarbe, p.saat)
    const [kFarbe, kRelief] = abrissBilder(p.stielFarbe, p.saat)
    seitenMat = new THREE.MeshStandardMaterial({
      map: textur(farbe, true), bumpMap: textur(relief, false), bumpScale: 1.4,
      vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, clippingPlanes: clip,
    })
    kappenMat = new THREE.MeshStandardMaterial({
      map: textur(kFarbe, true), bumpMap: textur(kRelief, false), bumpScale: 1.2,
      roughness: 0.92, metalness: 0, side: THREE.DoubleSide, clippingPlanes: clip,
    })
  } else {
    seitenMat = new THREE.MeshStandardMaterial({ color: p.stielFarbe, vertexColors: true, roughness: 0.85, clippingPlanes: clip })
    kappenMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.stielFarbe).offsetHSL(0, -0.1, 0.18), roughness: 0.9, clippingPlanes: clip })
  }
  const seitenMesh = new THREE.Mesh(netz.geometrie(), seitenMat)
  seitenMesh.name = 'Stiel-Rinde'
  const kappenMesh = new THREE.Mesh(kappe.geometrie(), kappenMat)
  kappenMesh.name = 'Stiel-Abrissstelle'
  g.add(seitenMesh, kappenMesh)
  return g
}

// ------------------------------------------------------------------ Kelch

// Kelchblatt-Mittellinie im Radialschnitt (Abstand zur Achse ρ, Höhe y), je nach Offenheit:
// d0 Anfangsrichtung, e Endpunkt (ρ = e0·r0 + e1·L, y = e2·L über der Basis), d1 Endrichtung.
// geschlossen: aufrecht und über der Kelchhöhle zusammengeneigt
const GESCHLOSSEN = { d0: [-0.6, 0.8], e: [0.05, 0, 0.55], d1: [-0.35, 0.94] }
// halboffen: aufrecht, Spitzen leicht auseinander
const HALBOFFEN = { d0: [0.12, 0.99], e: [1, 0.3, 0.86], d1: [0.4, 0.92] }
// offen: zurückgeschlagen, liegen auf der Grubenwand
const OFFEN = { d0: [0.85, 0.52], e: [1, 0.72, 0.16], d1: [0.92, 0.05] }

function zustand(o: number) {
  // bis etwa 0,15 bleibt der Kelch geschlossen, die Blätter öffnen sich erst darüber merklich
  const [a, b, t] = o < 0.5 ? [GESCHLOSSEN, HALBOFFEN, glatt(0.1, 0.5, o)] : [HALBOFFEN, OFFEN, (o - 0.5) * 2]
  const m = (x: number[], y: number[]) => x.map((v, i) => mischen(v, y[i], t))
  return { d0: m(a.d0, b.d0), e: m(a.e, b.e), d1: m(a.d1, b.d1) }
}

function bezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number) {
  const s = 1 - t
  return p0.map((_, k) => s * s * s * p0[k] + 3 * s * s * t * p1[k] + 3 * s * t * t * p2[k] + t * t * t * p3[k])
}

export function baueKelch(p: ApfelParameter, opt: Optionen = {}): THREE.Group {
  const g = new THREE.Group()
  g.name = 'Kelch'
  const mm = 1 / p.breiteMm
  const rnd = zufall(p.saat * 2.71 + 7)
  const o = klemme(p.kelchOffen)
  const wand = grubenwand(p, 'kelch')
  const r0 = (1.8 + 0.7 * o) * mm // Radius der verwachsenen Basis
  const L0 = (3 + 5 * klemme(p.kelchblattLaenge)) * mm // Länge der Kelchblätter
  const a0 = rnd() * Math.PI * 2
  const netz = new Netz()

  const kf = new THREE.Color(p.kelchFarbe)
  const filz = kf.clone().lerp(new THREE.Color('#9d9a86'), 0.3)
  const spitze = kf.clone().lerp(new THREE.Color('#160f09'), 0.7)
  const hoehle = new THREE.Color('#1b130c')
  const faden = new THREE.Color('#2b1c10')
  const griffel = kf.clone().lerp(new THREE.Color('#5d5530'), 0.3).multiplyScalar(0.55)

  // ---- Wulst: verwachsene Kelchbasis um die dunkle Kelchhöhle
  // Die Fruchtoberfläche ist am Pol ein grobes Dreiecksnetz, dessen Sehnen über der wahren Kurve
  // liegen; die Basis muss darüber bleiben, sonst verschwindet die dunkle Kelchhöhle unter der Schale.
  const grund = sehnenHoehe(p, wand.hoehe)
  const grubeTiefe = (0.08 + 0.12 * o) * mm
  const wulstHoehe = (rho: number, phi: number) =>
    grund(rho) + 0.04 * mm +
    mm * 0.35 * Math.exp(-(((rho - 0.62 * r0) / (0.25 * r0)) ** 2)) * (1 + 0.4 * Math.cos(5 * (phi - a0))) -
    grubeTiefe * (1 - glatt(0.1 * r0, 0.45 * r0, rho)) -
    0.5 * mm * glatt(0.8 * r0, 1.15 * r0, rho)
  const RADIEN = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.92, 1.05, 1.2]
  const UM = 24
  netz.gitter(RADIEN.length, UM, 'ring', (i, j) => {
    const rho = RADIEN[i] * r0 * (1 + (i > 2 ? 0.06 * Math.sin(3 * j + a0) : 0))
    const phi = (j / UM) * Math.PI * 2
    const c = hoehle.clone().lerp(kf.clone().lerp(filz, 0.5), glatt(0.4, 0.75, RADIEN[i])).multiplyScalar(0.8 + 0.25 * rnd())
    return {
      p: new THREE.Vector3(Math.cos(phi) * rho, wulstHoehe(rho, phi), Math.sin(phi) * rho),
      u: (j / UM) * 3, v: RADIEN[i], c,
    }
  })

  // ---- Fünf Kelchblätter
  const W0 = ((2 * Math.PI * r0) / 5) * 0.85 // an der Basis verwachsen (Wulst füllt die Lücken)
  const LAENGS = 14, QUER = 8
  for (let i = 0; i < 5; i++) {
    const a = a0 + (i / 5) * Math.PI * 2 + (rnd() - 0.5) * 0.22
    const oi = klemme(o + (rnd() - 0.5) * 0.24)
    const L = L0 * (0.86 + rnd() * 0.26)
    const seit = (rnd() - 0.5) * 0.3 // seitliches Ausweichen der Spitze
    const dreh = (rnd() - 0.5) * 1.2 // Verdrehung bis zur Spitze
    const roll = 0.5 + rnd() * 0.4 // Einrollen der Spitze
    const hell = 0.72 + rnd() * 0.28
    // Schrumpelfalten: wenige Wellen längs und quer, je Blatt anders
    const f1 = rnd() * 6.28, f2 = rnd() * 6.28, f3 = rnd() * 6.28
    const falte = 0.25 + rnd() * 0.25
    const er = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
    const et = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a))
    const ey = new THREE.Vector3(0, 1, 0)

    const z = zustand(oi)
    const norm = (v: number[]) => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l] }
    const d0 = norm(z.d0), d1 = norm(z.d1)
    const rhoB = 0.82 * r0
    const yB = grund(rhoB) - 0.05 * mm
    const P0 = [rhoB, yB]
    const E = [z.e[0] * r0 + z.e[1] * L, yB + z.e[2] * L]
    const P1 = [P0[0] + d0[0] * 0.38 * L, P0[1] + d0[1] * 0.38 * L]
    const P2 = [E[0] - d1[0] * 0.38 * L, E[1] - d1[1] * 0.38 * L]

    const dicke = (t: number) => mm * (0.3 * (1 - t) + 0.08)
    const breite = (t: number) => W0 * Math.max(0.03, (1 - t) ** 1.25) * (1 + 0.35 * (1 - glatt(0, 0.14, t))) * (1 + 0.12 * Math.sin(9 * t + f3))
    // Mittellinie, auf der Grubenwand aufliegend statt hindurch
    const mitte: THREE.Vector3[] = []
    for (let k = 0; k <= LAENGS; k++) {
      const t = k / LAENGS
      const [rho, y0] = bezier(P0, P1, P2, E, t)
      // zurückgeschlagene Blätter: Spitze leicht nach oben eingerollt
      const y = y0 + roll * 0.16 * L * glatt(0.7, 1, t) ** 2 * glatt(0.4, 1, oi)
      const q = er.clone().multiplyScalar(rho).addScaledVector(et, seit * t * t * L).addScaledVector(ey, y)
      const boden = grund(Math.hypot(q.x, q.z)) + dicke(t) * 0.6 + 0.1 * mm
      if (t > 0.15 && q.y < boden) q.y = boden
      mitte.push(q)
    }
    const tang = mitte.map((_, k) => mitte[Math.min(LAENGS, k + 1)].clone().sub(mitte[Math.max(0, k - 1)]).normalize())

    netz.gitter(LAENGS + 1, QUER, 'ring', (k, j) => {
      const t = k / LAENGS
      const T = tang[k]
      // Querachse tangential zur Frucht, um die Mittellinie verdreht
      const A = et.clone().addScaledVector(T, -et.dot(T)).normalize()
      A.applyAxisAngle(T, dreh * t ** 1.5)
      const N = new THREE.Vector3().crossVectors(A, T).normalize() // zeigt zur Innenseite (zur Achse)
      const th = (j / QUER) * Math.PI * 2
      const w = breite(t) / 2
      const cos = Math.cos(th), sin = Math.sin(th)
      // Ränder zur Innenseite eingerollt, zur Spitze hin stärker
      const rollen = (0.18 + roll * glatt(0.4, 1, t)) * w
      // vertrocknet: Mittelrippe als Kiel, schrumpelige Wellen längs und quer
      const kiel = -0.22 * w * (1 - Math.abs(cos))
      const schrumpel = falte * w * (Math.sin(2 * Math.PI * 2.2 * t + f1) * cos + 0.6 * Math.sin(Math.PI * 5 * t + f2) * cos * cos)
      const pos = mitte[k].clone()
        .addScaledVector(A, cos * w * (1 - 0.25 * glatt(0.5, 1, t) * cos * cos))
        .addScaledVector(N, (sin * dicke(t)) / 2 + rollen * cos * cos + kiel + schrumpel * glatt(0.05, 0.3, t))
      const c = (t < 0.4 ? filz.clone().lerp(kf, t / 0.4) : kf.clone().lerp(spitze, glatt(0.45, 0.95, t))).multiplyScalar(hell)
      if (sin > 0.2) c.lerp(filz, 0.3 * (1 - t)).multiplyScalar(mischen(0.7, 1, oi)) // Innenseite filzig, im geschlossenen Kelch verschattet
      return { p: pos, u: (cos + 1) * 0.25 + i * 0.2, v: t * 1.5, c }
    })
  }

  // ---- Vertrocknete Staubgefäße (feine dunkle Fäden mit Staubbeutelresten) und Griffelreste
  const faeden = (anzahl: number, rhoMin: number, rhoMax: number, laenge: number, dick: number, farbe: THREE.Color, beutel: boolean) => {
    for (let k = 0; k < anzahl; k++) {
      const phi = (k / anzahl) * Math.PI * 2 + (rnd() - 0.5) * 0.5
      const rho = r0 * (rhoMin + rnd() * (rhoMax - rhoMin))
      const er = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi))
      const et = new THREE.Vector3(-Math.sin(phi), 0, Math.cos(phi))
      const fuss = er.clone().multiplyScalar(rho).setY(wulstHoehe(rho, phi) - 0.1 * mm)
      const h = laenge * (0.6 + rnd() * 0.7)
      const neig = (rnd() - 0.6) * 0.9, quer = (rnd() - 0.5) * 0.5
      const kette = [fuss]
      for (let s = 1; s <= 3; s++) {
        const f = s / 3
        const d = new THREE.Vector3(0, 1, 0).addScaledVector(er, neig * (0.5 + f)).addScaledVector(et, quer).normalize()
        kette.push(kette[s - 1].clone().addScaledVector(d, h / 3))
      }
      const tg = kette.map((_, s) => kette[Math.min(3, s + 1)].clone().sub(kette[Math.max(0, s - 1)]).normalize())
      const { n, b } = rahmen(tg)
      const c = farbe.clone().multiplyScalar(0.8 + rnd() * 0.5)
      netz.gitter(4, 3, 'ring', (s, j) => {
        const th = (j / 3) * Math.PI * 2
        const r = dick * (1 - s * 0.15)
        return { p: kette[s].clone().addScaledVector(n[s], Math.cos(th) * r).addScaledVector(b[s], Math.sin(th) * r), u: 0, v: 0, c }
      })
      if (beutel) {
        // Staubbeutelrest: kleines, unregelmäßiges Doppelpyramidchen
        const spitzeP = kette[3]
        const r = (0.09 + rnd() * 0.07) * mm
        const cb = faden.clone().lerp(new THREE.Color('#5a3f25'), rnd() * 0.5)
        const start = netz.anzahl
        const ach = [er, et, new THREE.Vector3(0, 1, 0)]
        for (const [ax, sg] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]] as const) {
          netz.ecke({ p: spitzeP.clone().addScaledVector(ach[ax], sg * r * (ax === 2 ? 0.8 : 1.2)), u: 0, v: 0, c: cb })
        }
        const fl = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]
        for (const [x, y, w] of fl) netz.idx.push(start + x, start + y, start + w)
      }
    }
  }
  faeden(20, 0.3, 0.55, (0.8 + 0.7 * o) * mm, 0.07 * mm, faden, true)
  faeden(5, 0.02, 0.12, 0.9 * mm, 0.1 * mm, griffel, false)

  const clip = opt.clipping ?? null
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    sheen: 0.35,
    sheenColor: filz,
    sheenRoughness: 0.8,
    side: THREE.DoubleSide,
    clippingPlanes: clip,
  })
  if (hatDokument) {
    const [b] = filzBild()
    material.map = textur(b, true)
    material.bumpMap = textur(b, false)
    material.bumpScale = 0.6
  }
  const mesh = new THREE.Mesh(netz.geometrie(), material)
  mesh.name = 'Kelch'
  g.add(mesh)
  return g
}

/** Gibt Geometrien und Materialien eines Teilbaums frei (die Canvas-Bilder bleiben im Zwischenspeicher) */
export function entsorgen(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose()
      mat.dispose()
    }
  })
}
