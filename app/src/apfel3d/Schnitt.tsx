import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ApfelParameter } from './darstellung.ts'
import { Apfel } from './Apfel.tsx'
import { profil, verformung, pole } from './geometrie.ts'
import { Umgebung, Licht, Bereit, Platzhalter, neuerBlick, useDrehgeste, blickHoehe, type Blick } from './Buehne.tsx'
import { neigung, bewegungReduziert } from './neigung.ts'
import { hexNachRgb } from './schale.ts'
import { webglVerfuegbar, FlacherApfel } from './ohne3d.tsx'

// Schnittansichten: Längsschnitt durch Stiel und Kelch, Querschnitt an der breitesten Stelle.
// Der halbe Apfel steht still, die Kamera kreist um ihn; so bleibt die Schnittebene (in
// Weltkoordinaten) immer am Apfel. Die Schnittfläche ist eine Kappe in Form des tatsächlichen
// Umrisses, bemalt mit Fleisch, Kernhauslinie, Kernfächern, Kernen und Kelchhöhle.

const S = 1024 // Kantenlänge der Schnittbild-Textur
const R = 0.62 // Textur deckt x, y ∈ [−R, R] ab
const SKALA = S / (2 * R)

export type Schnittart = 'laengs' | 'quer'

function zuLeinwand(x: number, y: number): [number, number] {
  return [((x + R) / (2 * R)) * S, (1 - (y + R) / (2 * R)) * S]
}

function abdunkeln(hex: string, f: number) {
  const [r, g, b] = hexNachRgb(hex)
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`
}

/** Umriss des Längsschnitts (Ebene z = 0) aus der echten Verformung */
function laengsUmriss(p: ApfelParameter, n = 96): THREE.Vector2[] {
  const pr = profil(p, n)
  const rechts: THREE.Vector2[] = []
  const links: THREE.Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = verformung(p, 0, t, pr[i])
    const b = verformung(p, Math.PI, t, pr[i])
    rechts.push(new THREE.Vector2(a.r + a.dx, a.y))
    links.push(new THREE.Vector2(-b.r + b.dx, b.y))
  }
  return [...rechts, ...links.reverse()]
}

/** Höhe der breitesten Stelle (etwas zum Kelch hin, dort liegt die Kernhausmitte meist) */
export function querLage(p: ApfelParameter, n = 64) {
  const pr = profil(p, n)
  let best = 0
  for (let i = 0; i <= n; i++) if (pr[i].x > pr[best].x) best = i
  const i = Math.max(1, best - 2)
  return { t: i / n, y: pr[i].y, punkt: pr[i] }
}

function querUmriss(p: ApfelParameter, n = 120): THREE.Vector2[] {
  const { t, punkt } = querLage(p)
  const pts: THREE.Vector2[] = []
  for (let j = 0; j < n; j++) {
    const phi = (j / n) * Math.PI * 2
    const { r, dx } = verformung(p, phi, t, punkt)
    // Kappe liegt nach Drehung um −90° um x in der Ebene y = konst.: X = x, Y = −z
    pts.push(new THREE.Vector2(r * Math.cos(phi) + dx, r * Math.sin(phi)))
  }
  return pts
}

// ------------------------------------------------------------------ Kernhaus und Kerne

/**
 * Kernhauslinie im Längsschnitt: Halbachsen a (Breite) und b (Höhe), Spitze 0 rund … 1 spitz.
 * Zwiebel: zum Stiel spitz, zum Kelch breit; Herz: umgekehrt.
 */
function kernhausPunkt(form: string, a: number, b: number, spitze: number, t: number): [number, number] {
  const c = Math.cos(t), s = Math.sin(t)
  const oben = Math.max(0, c), unten = Math.max(0, -c)
  let spitzeOben = spitze, spitzeUnten = spitze
  if (form === 'zwiebel') { spitzeOben = Math.min(1, spitze + 0.25); spitzeUnten = spitze * 0.4 }
  if (form === 'herz') { spitzeOben = spitze * 0.3; spitzeUnten = Math.min(1, spitze + 0.3) }
  if (form === 'kugelig') { spitzeOben *= 0.5; spitzeUnten *= 0.5 }
  // zu den Enden hin schmaler werden (spitz zulaufen)
  const schmal = 1 - spitzeOben * oben ** 1.6 * 0.85 - spitzeUnten * unten ** 1.6 * 0.85
  let x = a * s * Math.max(0.05, schmal)
  let y = b * c
  if (form === 'zwiebel') y += b * 0.12 * unten - b * 0.05 * oben
  if (form === 'herz') { x *= 1 + 0.15 * oben; y += b * 0.08 * oben }
  return [x, y]
}

/** Ein Apfelkern als Tropfen, Spitze in Richtung winkel (0 = nach oben), Länge l in Pixeln */
function zeichneKern(g: CanvasRenderingContext2D, x: number, y: number, winkel: number, l: number, form: string, farbe: string) {
  const breiteZuLaenge = { lang: 0.42, eifoermig: 0.55, rundlich: 0.68, breit: 0.75 }[form] ?? 0.55
  const w = l * breiteZuLaenge
  g.save()
  g.translate(x, y)
  g.rotate(winkel)
  g.beginPath()
  g.moveTo(0, -l / 2) // Spitze
  g.bezierCurveTo(w * 0.35, -l * 0.32, w * 0.55, l * 0.05, w * 0.48, l * 0.25)
  g.bezierCurveTo(w * 0.38, l * 0.48, -w * 0.38, l * 0.48, -w * 0.48, l * 0.25)
  g.bezierCurveTo(-w * 0.55, l * 0.05, -w * 0.35, -l * 0.32, 0, -l / 2)
  g.closePath()
  const [r, gr, b] = hexNachRgb(farbe)
  const v = g.createLinearGradient(-w / 2, 0, w / 2, 0)
  v.addColorStop(0, `rgb(${r * 0.65},${gr * 0.62},${b * 0.6})`)
  v.addColorStop(0.45, `rgb(${Math.min(255, r * 1.25)},${Math.min(255, gr * 1.2)},${Math.min(255, b * 1.15)})`)
  v.addColorStop(1, `rgb(${r * 0.6},${gr * 0.58},${b * 0.55})`)
  g.fillStyle = v
  g.fill()
  g.lineWidth = Math.max(1, l * 0.04)
  g.strokeStyle = `rgba(${r * 0.4},${gr * 0.35},${b * 0.3},0.9)`
  g.stroke()
  // Glanzstreifen und heller Nabel an der Spitze
  g.beginPath()
  g.ellipse(-w * 0.12, -l * 0.02, w * 0.08, l * 0.25, 0.1, 0, Math.PI * 2)
  g.fillStyle = 'rgba(255,240,220,0.35)'
  g.fill()
  g.beginPath()
  g.arc(0, -l * 0.44, l * 0.035, 0, Math.PI * 2)
  g.fillStyle = 'rgba(235,220,190,0.8)'
  g.fill()
  g.restore()
}

function fleischUndRand(g: CanvasRenderingContext2D, p: ApfelParameter, umriss: THREE.Vector2[], mitte: [number, number]) {
  const pfad = () => {
    g.beginPath()
    umriss.forEach((v, i) => { const [x, y] = zuLeinwand(v.x, v.y); if (i) g.lineTo(x, y); else g.moveTo(x, y) })
    g.closePath()
  }
  pfad()
  const verlauf = g.createRadialGradient(mitte[0], mitte[1], 10, mitte[0], mitte[1], S * 0.45)
  verlauf.addColorStop(0, p.fleischfarbe)
  verlauf.addColorStop(1, abdunkeln(p.fleischfarbe, 0.94))
  g.fillStyle = verlauf
  g.fill()
  g.save(); pfad(); g.clip()
  // feine Faserung, wiederholbar aus der Saat
  let z = p.saat * 9301 + 49297
  const rnd = () => ((z = (z * 233280 + 49297) % 233280) / 233280)
  g.globalAlpha = 0.05
  for (let k = 0; k < 900; k++) {
    g.fillStyle = k % 2 ? '#ffffff' : '#a08a50'
    g.fillRect(rnd() * S, rnd() * S, 2, 2)
  }
  g.globalAlpha = 1
  g.lineWidth = 7; g.strokeStyle = p.deckfarbeAnteil > 0.3 ? p.deckfarbe : p.grundfarbe; pfad(); g.stroke()
  g.restore()
}

function schnittbildLaengs(p: ApfelParameter, umriss: THREE.Vector2[]): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const { stiel, kelch } = pole(p)
  const hoehe = stiel - kelch
  fleischUndRand(g, p, umriss, zuLeinwand(0, (stiel + kelch) / 2))
  const pm = (x: number, y: number) => zuLeinwand(x, y)

  const a = p.kernhausBreite / 2
  const b = (p.kernhausHoehe * hoehe) / 2
  const yc = (stiel + kelch) / 2 + p.kernhausLage * 0.12 * hoehe - 0.02 * hoehe

  // Gefäßbündel (Kernhauslinie), leicht grünlich
  g.beginPath()
  for (let k = 0; k <= 120; k++) {
    const [x, y] = kernhausPunkt(p.kernhausForm, a, b, p.kernhausSpitze, (k / 120) * Math.PI * 2)
    const [cx, cy] = pm(x, yc + y)
    if (k) g.lineTo(cx, cy); else g.moveTo(cx, cy)
  }
  g.fillStyle = 'rgba(205, 195, 125, 0.13)'
  g.fill()
  g.lineWidth = 3
  g.strokeStyle = 'rgba(140, 145, 70, 0.75)'
  g.stroke()

  // Achse: Stielkanal, bei offener Achse ein Hohlraum
  g.strokeStyle = 'rgba(150, 140, 70, 0.6)'
  g.lineWidth = 2.5
  g.beginPath(); g.moveTo(...pm(0, yc + b * 0.9)); g.lineTo(...pm(0, stiel - 0.005)); g.stroke()
  if (p.achseOffen) {
    g.fillStyle = 'rgba(120, 95, 50, 0.45)'
    g.beginPath(); g.ellipse(...pm(0, yc), 0.012 * SKALA, b * 0.7 * SKALA, 0, 0, Math.PI * 2); g.fill()
  }

  // Kelchhöhle nach Form
  const unten = kelch + 0.004
  const kernUnten = yc - b * 0.85
  const spanne = kernUnten - unten
  const breit = 0.04 + p.kelchgrubeWeite * 0.03
  g.fillStyle = 'rgba(140, 110, 50, 0.5)'
  g.strokeStyle = 'rgba(110, 85, 40, 0.85)'
  g.lineWidth = 2
  g.beginPath()
  const roehre = (bis: number) => {
    g.moveTo(...pm(-breit, unten)); g.lineTo(...pm(-0.008, unten + spanne * 0.3)); g.lineTo(...pm(-0.006, bis))
    g.lineTo(...pm(0.006, bis)); g.lineTo(...pm(0.008, unten + spanne * 0.3)); g.lineTo(...pm(breit, unten))
  }
  switch (p.kelchhoehle) {
    case 'dreieck_breit': g.moveTo(...pm(-breit * 1.1, unten)); g.lineTo(...pm(0, unten + spanne * 0.35)); g.lineTo(...pm(breit * 1.1, unten)); break
    case 'dreieck_lang': g.moveTo(...pm(-breit * 0.8, unten)); g.lineTo(...pm(0, unten + spanne * 0.65)); g.lineTo(...pm(breit * 0.8, unten)); break
    case 'trichter_lang': roehre(unten + spanne * 0.8); break
    case 'roehre_kernhaus': roehre(kernUnten + b * 0.2); break
    default: roehre(unten + spanne * 0.5)
  }
  g.closePath(); g.fill(); g.stroke()

  // Zwei Kernfächer im Schnitt: kahnförmig, so spitz wie das Kernhaus, mit je einem Kern
  const kernL = (p.kernLaengeMm / p.breiteMm) * SKALA
  for (const seite of [-1, 1]) {
    const fx = seite * a * 0.45
    const fb = a * (0.18 + p.kernfachGroesse * 0.22)
    const fh = b * (0.55 + p.kernfachGroesse * 0.35)
    g.save()
    g.translate(...pm(fx, yc + b * 0.04))
    g.rotate(seite * 0.1)
    g.beginPath()
    for (let k = 0; k <= 60; k++) {
      const [x, y] = kernhausPunkt('spindel', fb, fh, Math.min(1, p.kernhausSpitze + 0.3), (k / 60) * Math.PI * 2)
      if (k) g.lineTo(x * SKALA, -y * SKALA); else g.moveTo(x * SKALA, -y * SKALA)
    }
    g.closePath()
    g.fillStyle = '#efe7d0'
    g.fill()
    g.strokeStyle = 'rgba(160, 140, 90, 0.9)'
    g.lineWidth = 2
    g.stroke()
    g.restore()
    if (p.kernfaecherOffen > 0.3) {
      // Spalt zur Achse hin
      g.fillStyle = 'rgba(120, 95, 50, 0.35)'
      const [x0, y0] = pm(0, yc + fh * 0.3)
      const [x1] = pm(fx, yc)
      g.fillRect(Math.min(x0, x1), y0, Math.abs(x1 - x0), fh * SKALA * 0.6 * p.kernfaecherOffen)
    }
    const [kx, ky] = pm(fx, yc + b * 0.06)
    zeichneKern(g, kx, ky, seite * 0.08, Math.min(kernL, fh * SKALA * 1.7), p.kernForm, p.kernFarbe)
  }
  return c
}

function schnittbildQuer(p: ApfelParameter, umriss: THREE.Vector2[]): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const [mx, my] = zuLeinwand(0, 0)
  fleischUndRand(g, p, umriss, [mx, my])

  g.save()
  g.translate(mx, my)
  const rk = (p.kernhausBreite / 2) * SKALA
  // Gefäßbündel: zehn Punkte im Ring
  g.fillStyle = 'rgba(140, 140, 70, 0.7)'
  for (let k = 0; k < 10; k++) {
    const w = (k / 10) * Math.PI * 2 + 0.31
    g.beginPath(); g.arc(Math.cos(w) * rk * 1.12, Math.sin(w) * rk * 1.12, 4, 0, Math.PI * 2); g.fill()
  }
  // Kernhauslinie: fünflappig, ausgeprägter bei spitzem Kernhaus
  g.beginPath()
  for (let k = 0; k <= 150; k++) {
    const w = (k / 150) * Math.PI * 2
    const r = rk * (1 + (0.1 + p.kernhausSpitze * 0.12) * Math.cos(5 * w))
    if (k) g.lineTo(Math.cos(w) * r, Math.sin(w) * r); else g.moveTo(Math.cos(w) * r, Math.sin(w) * r)
  }
  g.strokeStyle = 'rgba(140, 140, 60, 0.85)'; g.lineWidth = 3.5; g.stroke()
  // Kernfächer als Stern, mit Kernen
  const kernL = (p.kernLaengeMm / p.breiteMm) * SKALA
  for (let k = 0; k < 5; k++) {
    const w = (k / 5) * Math.PI * 2
    const laenge = rk * (0.35 + p.kernfachGroesse * 0.25)
    const breite = rk * (0.14 + p.kernfachGroesse * 0.12)
    g.save()
    g.rotate(w)
    g.beginPath()
    g.ellipse(rk * 0.55, 0, laenge, breite, 0, 0, Math.PI * 2)
    g.fillStyle = '#f1ead6'; g.fill()
    g.strokeStyle = 'rgba(150, 125, 70, 0.95)'; g.lineWidth = 3; g.stroke()
    if (p.kernfaecherOffen > 0.3) {
      g.fillStyle = 'rgba(120, 95, 50, 0.4)'
      g.fillRect(0, -rk * 0.04, rk * 0.3, rk * 0.08)
    }
    g.restore()
    if (k !== 1) zeichneKern(g, Math.cos(w) * rk * 0.6, Math.sin(w) * rk * 0.6, w + Math.PI / 2, Math.min(kernL * 0.8, laenge * 1.6), p.kernForm, p.kernFarbe)
  }
  g.beginPath(); g.arc(0, 0, p.kernfaecherOffen > 0.6 || p.achseOffen ? 8 : 4, 0, Math.PI * 2)
  g.fillStyle = 'rgba(120, 95, 50, 0.6)'; g.fill()
  g.restore()
  return c
}

// ------------------------------------------------------------------ Szene

function Kappe({ p, art }: { p: ApfelParameter; art: Schnittart }) {
  const { geo, tex, lage } = useMemo(() => {
    const umriss = art === 'laengs' ? laengsUmriss(p) : querUmriss(p)
    const geo = new THREE.ShapeGeometry(new THREE.Shape(umriss), 1)
    const bild = art === 'laengs' ? schnittbildLaengs(p, umriss) : schnittbildQuer(p, umriss)
    const tex = new THREE.CanvasTexture(bild)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.repeat.set(1 / (2 * R), 1 / (2 * R))
    tex.offset.set(0.5, 0.5)
    const lage = art === 'quer' ? querLage(p).y : 0
    return { geo, tex, lage }
  }, [p, art])
  useEffect(() => () => { geo.dispose(); tex.dispose() }, [geo, tex])
  return art === 'laengs' ? (
    <mesh geometry={geo} position={[0, 0, 0.0005]}>
      <meshStandardMaterial map={tex} roughness={0.55} />
    </mesh>
  ) : (
    <mesh geometry={geo} position={[0, lage + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial map={tex} roughness={0.55} />
    </mesh>
  )
}

/** Kamera kreist um den stillstehenden halben Apfel */
function Kreisen({ blick, art, zielY, zoom }: { blick: React.RefObject<Blick>; art: Schnittart; zielY: number; zoom: number }) {
  const { camera } = useThree()
  const ruhig = useRef(bewegungReduziert())
  const t = useRef(0)
  const aktuellD = useRef(3.6 * zoom)
  useFrame((_, dt) => {
    const b = blick.current
    const seit = performance.now() - b.letzteGeste
    if (Math.abs(b.tempoDreh) > 0.01 && seit < 3500) {
      b.dreh += b.tempoDreh * dt
      b.tempoDreh *= Math.pow(0.04, dt)
    } else if (seit > 3500 && !ruhig.current) {
      // sanft pendeln um die Ansicht auf die Schnittfläche
      t.current += dt
      const ziel = Math.PI + Math.sin(t.current * 0.45) * 0.35
      b.dreh += (ziel - b.dreh) * Math.min(1, dt * 1.2)
      b.hoehe = b.zielHoehe + (b.hoehe - b.zielHoehe) * Math.pow(0.5, dt)
    }
    // Querschnitt: Blick von schräg oben auf die Fläche
    const el = Math.max(-1.4, Math.min(1.45, blickHoehe(b) + (art === 'quer' ? 0.75 : 0)))
    const az = -(b.dreh - Math.PI) + neigung().x * 0.5
    aktuellD.current += (3.6 * zoom - aktuellD.current) * Math.min(1, dt * 4)
    const d = aktuellD.current
    camera.position.set(Math.sin(az) * d * Math.cos(el), zielY + Math.sin(el) * d, Math.cos(az) * d * Math.cos(el))
    camera.lookAt(0, zielY, 0)
  })
  return null
}

function Halbe({ p, art, blick, zoom }: { p: ApfelParameter; art: Schnittart; blick: React.RefObject<Blick>; zoom: number }) {
  const lage = useMemo(() => querLage(p).y, [p])
  const ebene = useMemo(() => {
    if (art === 'laengs') return new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), lage)
  }, [art, lage])
  return (
    <>
      <Kreisen blick={blick} art={art} zielY={art === 'quer' ? lage * 0.5 : 0} zoom={zoom} />
      <Apfel p={p} schnitt={ebene} />
      <Kappe p={p} art={art} />
    </>
  )
}

function Clipping() {
  const gl = useThree((s) => s.gl)
  useEffect(() => { gl.localClippingEnabled = true }, [gl])
  return null
}

type SchnittProps = { p: ApfelParameter; className?: string; art?: Schnittart; wahl?: boolean; zoom?: number }

/** Schnittansicht in 3D; ohne WebGL ein flacher Apfel mit Hinweis */
export function Schnittansicht(props: SchnittProps) {
  if (webglVerfuegbar()) return <Schnittansicht3d {...props} />
  return (
    <div className={props.className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <FlacherApfel p={props.p} groesse="45%" />
      <span className="sehr-klein">Die Schnittansicht braucht 3D-Grafik, die dieses Gerät nicht anbietet.</span>
    </div>
  )
}

function Schnittansicht3d({ p, className, art: vorgabe, wahl = true, zoom = 1 }: SchnittProps) {
  const [artIntern, setArt] = useState<Schnittart>('laengs')
  const art = vorgabe ?? artIntern
  const [bereit, setBereit] = useState(false)
  const blick = useRef<Blick>(neuerBlick())
  const geste = useDrehgeste(blick, true)
  useEffect(() => { blick.current = neuerBlick() }, [art])
  return (
    <div className={className} style={{ touchAction: 'none', cursor: 'grab' }} {...geste}>
      <Platzhalter sichtbar={!bereit} />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.2, 3.6], fov: 26 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
        style={{ pointerEvents: 'none' }}
      >
        <Clipping />
        <Umgebung />
        <Licht />
        <Halbe p={p} art={art} blick={blick} zoom={zoom} />
        {!bereit && <Bereit onBereit={() => setBereit(true)} />}
      </Canvas>
      {wahl && !vorgabe && (
        <div className="chips" style={{ position: 'absolute', bottom: 6, left: 0, right: 0, justifyContent: 'center' }} onPointerDown={(e) => e.stopPropagation()}>
          <button className={`chip ${art === 'laengs' ? 'an' : ''}`} onClick={() => setArt('laengs')}>Längs</button>
          <button className={`chip ${art === 'quer' ? 'an' : ''}`} onClick={() => setArt('quer')}>Quer</button>
        </div>
      )}
    </div>
  )
}
