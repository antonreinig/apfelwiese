// Parametrische Apfelform: Rotationskörper aus einem Längsumriss mit Stiel- und Kelchgrube,
// danach Rippung, Kronung und Schiefe als Verformung im Raum.
// Maßstab: Fruchtbreite = 1. Achse y, Stiel oben (+y), Kelch unten (−y).

import * as THREE from 'three'
import type { ApfelParameter } from './darstellung.ts'

export interface Profilpunkt {
  x: number // Abstand zur Achse
  y: number
}

const glatt = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const delle = (u: number) => (u >= 1 ? 0 : (1 - u * u) ** 2)

/** Längsumriss für t ∈ [0, 1], t = 0 am Kelch, t = 1 am Stiel */
export function profil(p: ApfelParameter, n = 64): Profilpunkt[] {
  const halb = p.hoeheZuBreite / 2
  const exp = 2.12 + p.walze * 1.1 // Superellipse: höher = kantiger, walzenförmiger
  const roh: Profilpunkt[] = []
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI
    const s = Math.sin(th), c = Math.cos(th)
    let x = 0.5 * Math.sign(s) * Math.abs(s) ** (2 / exp)
    let y = -halb * Math.sign(c) * Math.abs(c) ** (2 / exp)
    // Kegelform: zum Stiel breiter, zum Kelch schmaler; Kelchseite etwas abgeflacht
    const rel = y / halb
    x *= 1 + p.konisch * rel - 0.04 * Math.max(0, -rel) ** 3
    roh.push({ x, y })
  }
  // auf Breite 1 normieren
  const maxX = Math.max(...roh.map((q) => q.x))
  for (const q of roh) q.x *= 0.5 / maxX

  // Gruben: Punkte nahe der Achse nach innen ziehen
  const sw = 0.1 + p.stielgrubeWeite * 0.28
  const st = (0.05 + p.stielgrubeTiefe * 0.22) * p.hoeheZuBreite
  const kw = 0.1 + p.kelchgrubeWeite * 0.26
  const kt = (0.03 + p.kelchgrubeTiefe * 0.17) * p.hoeheZuBreite
  return roh.map((q) => {
    let y = q.y
    if (y > 0) y -= st * delle(q.x / sw) * glatt(0, 0.25 * halb, y)
    else y += kt * delle(q.x / kw) * glatt(0, 0.25 * halb, -y)
    return { x: q.x, y }
  })
}

/** Glatte, wiederholbare Unregelmäßigkeit aus wenigen Sinuswellen (Beulen, Dellen) */
function beulen(p: ApfelParameter, phi: number, t: number) {
  const s = p.saat
  const a = Math.sin(phi + s * 1.3) * Math.sin(Math.PI * t * 1.0 + s)
  const b = Math.sin(2 * phi + s * 2.1) * Math.sin(Math.PI * t * 2 + s * 0.7) * 0.6
  const c = Math.sin(3 * phi + s * 0.4) * Math.cos(Math.PI * t * 1.5 + s * 1.9) * 0.4
  return (a + b + c) / 2
}

/** Versatz der Achse bei krummen Früchten (in x), t = 0 Kelch … 1 Stiel */
export function achsVersatz(p: ApfelParameter, t: number) {
  return p.achseKruemmung * 0.07 * Math.sin(Math.PI * t)
}

/** Verformung im Raum: Rippen, Kronung am Kelch, Schiefe, krumme Achse, Beulen */
export function verformung(p: ApfelParameter, phi: number, t: number, q: Profilpunkt) {
  const halb = p.hoeheZuBreite / 2
  const sin = Math.sin(t * Math.PI)
  const rippe = Math.cos(5 * phi + 0.4)
  const kelchSchulter = Math.exp(-(((t - 0.2) / 0.12) ** 2))
  let r = q.x * (1 + p.rippung * 0.035 * rippe * Math.sqrt(sin) + p.kronung * 0.07 * rippe * kelchSchulter)
  // Beulen und leichte Unregelmäßigkeit, damit kein Apfel perfekt ist
  r *= 1 + (0.01 + p.unregelmaessig * 0.06) * beulen(p, phi, t) * sin
  let y = q.y + p.asymmetrie * 0.07 * Math.cos(phi) * Math.max(0, q.y / halb) * q.x * 2
  y += p.asymmetrie * 0.02 * Math.cos(phi) * sin
  // krumme Achse: Querschnitte verschieben sich seitlich
  const dx = achsVersatz(p, t)
  return { r, y, dx }
}

export function apfelGeometrie(p: ApfelParameter, segU = 96, segV = 64): THREE.BufferGeometry {
  const pr = profil(p, segV)
  const pos: number[] = []
  const uv: number[] = []
  for (let i = 0; i <= segV; i++) {
    const t = i / segV
    for (let j = 0; j <= segU; j++) {
      const u = j / segU
      const phi = u * Math.PI * 2
      const { r, y, dx } = verformung(p, phi, t, pr[i])
      pos.push(r * Math.cos(phi) + dx, y, -r * Math.sin(phi))
      uv.push(u, t)
    }
  }
  const index: number[] = []
  const zeile = segU + 1
  for (let i = 0; i < segV; i++)
    for (let j = 0; j < segU; j++) {
      const a = i * zeile + j, b = a + 1, c = a + zeile, d = c + 1
      index.push(a, b, d, a, d, c)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  naehteGlaetten(g, segU, segV)
  g.computeBoundingSphere()
  return g
}

/** Normalen an der Textur-Naht und an den Polen mitteln */
function naehteGlaetten(g: THREE.BufferGeometry, segU: number, segV: number) {
  const n = g.getAttribute('normal') as THREE.BufferAttribute
  const zeile = segU + 1
  const v = new THREE.Vector3()
  for (let i = 0; i <= segV; i++) {
    const a = i * zeile, b = a + segU
    v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize()
    n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z)
  }
  for (const i of [0, segV]) {
    v.set(0, 0, 0)
    for (let j = 0; j <= segU; j++) v.add(new THREE.Vector3(n.getX(i * zeile + j), n.getY(i * zeile + j), n.getZ(i * zeile + j)))
    v.normalize()
    for (let j = 0; j <= segU; j++) n.setXYZ(i * zeile + j, v.x, v.y, v.z)
  }
  n.needsUpdate = true
}

/** Lage des Stielansatzes und des Kelchs auf der Achse, mit Richtung der Achse dort */
export function pole(p: ApfelParameter) {
  const pr = profil(p, 64)
  const stiel = pr[pr.length - 1].y, kelch = pr[0].y
  // Neigung der Achse an den Polen (Ableitung des Achsversatzes nach der Höhe)
  const steigung = (p.achseKruemmung * 0.07 * Math.PI) / Math.max(0.3, stiel - kelch)
  return { stiel, kelch, stielNeigung: -Math.atan(steigung), kelchNeigung: Math.atan(steigung) }
}

/** Physische Größe eines Texturpixels in u- und v-Richtung je Profilzeile (für runde Schalenpunkte) */
export function texelMasse(p: ApfelParameter, zeilen: number) {
  const pr = profil(p, zeilen)
  const umfang: number[] = []
  const bogen: number[] = []
  for (let i = 0; i <= zeilen; i++) {
    umfang.push(2 * Math.PI * pr[i].x)
    const a = pr[Math.max(0, i - 1)], b = pr[Math.min(zeilen, i + 1)]
    bogen.push(Math.hypot(b.x - a.x, b.y - a.y) / (Math.min(zeilen, i + 1) - Math.max(0, i - 1)))
  }
  return { umfang, bogen, profil: pr }
}
