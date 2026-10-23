import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Apfel } from './Apfel.tsx'
import type { ApfelParameter } from './darstellung.ts'
import { neigung, bewegungReduziert } from './neigung.ts'
import { medaillonBild } from './medaillonBild.ts'
import { webglVerfuegbar, FlacherApfel } from './ohne3d.tsx'

// ------------------------------------------------------------------ Umgebung und Licht

const umgebungen = new WeakMap<THREE.WebGLRenderer, THREE.Texture>()
function umgebungFuer(gl: THREE.WebGLRenderer) {
  let t = umgebungen.get(gl)
  if (!t) {
    const pm = new THREE.PMREMGenerator(gl)
    t = pm.fromScene(new RoomEnvironment(), 0.03).texture
    pm.dispose()
    umgebungen.set(gl, t)
  }
  return t
}

/** Setzt Spiegelungsumgebung für die aktuelle Szene */
export function Umgebung({ staerke = 0.85 }: { staerke?: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    scene.environment = umgebungFuer(gl)
    scene.environmentIntensity = staerke
    return () => { scene.environment = null }
  }, [gl, scene, staerke])
  return null
}

export function Licht() {
  return (
    <>
      <directionalLight position={[-2.2, 3, 2.5]} intensity={2.1} color="#fff6e8" />
      <directionalLight position={[2.5, 0.6, -1.5]} intensity={0.5} color="#dfe8ff" />
      <ambientLight intensity={0.15} />
    </>
  )
}

const schattenTextur = (() => {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const v = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  v.addColorStop(0, 'rgba(40,28,15,0.55)')
  v.addColorStop(0.45, 'rgba(40,28,15,0.22)')
  v.addColorStop(1, 'rgba(40,28,15,0)')
  g.fillStyle = v
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
})()

/** Meldet, sobald die Szene einige Bilder gezeichnet hat (Texturen und Shader sind dann fertig) */
export function Bereit({ onBereit }: { onBereit: () => void }) {
  const n = useRef(0)
  useFrame(() => { if (++n.current === 3) onBereit() })
  return null
}

/** Federzeichnung eines Apfels als Platzhalter, bis das 3D-Modell steht */
export function Platzhalter({ sichtbar }: { sichtbar: boolean }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{
      position: 'absolute', left: '50%', top: '50%', width: '34%', maxWidth: 160, transform: 'translate(-50%, -52%)',
      opacity: sichtbar ? 0.45 : 0, transition: 'opacity .5s', color: 'var(--bleistift)', pointerEvents: 'none',
    }}>
      <path d="M50 30c-6-5-15-7-23-2-9 6-11 21-6 33 5 11 13 19 21 19 3 0 5-1 8-1s5 1 8 1c8 0 16-8 21-19 5-12 3-27-6-33-8-5-17-3-23 2z" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M50 31c0-6 1-11 4-15M54 18c6-6 15-6 20-3-4 6-13 8-20 3z" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M30 45c1 8 4 15 9 20M36 40c0 9 3 17 7 23" fill="none" stroke="currentColor" strokeWidth="0.4" />
    </svg>
  )
}

// ------------------------------------------------------------------ Blick: Drehen per Hand und Neigung

/** Gemeinsamer Zustand der Blickrichtung, von Gesten und Neigung gesteuert */
export interface Blick {
  /** Drehung um die Fruchtachse (rad); Start mit der Sonnenseite zum Betrachter */
  dreh: number
  /** Blickhöhe aus der Geste (rad), zusätzlich zur Neigung */
  hoehe: number
  tempoDreh: number
  letzteGeste: number
  /** Blickhöhe, zu der die Ansicht nach einer Geste zurückkehrt */
  zielHoehe: number
}

export function neuerBlick(zielHoehe = 0): Blick {
  return { dreh: Math.PI + 0.15, hoehe: zielHoehe, tempoDreh: 0, letzteGeste: -1e9, zielHoehe }
}

export const GRUND_HOEHE = 0.3 // leicht von oben
const RUHE_MS = 3500 // so lange nach einer Geste dreht sich nichts von selbst

/** Blickhöhe aus Geste und Neigung: Handy nach unten gekippt → Blick von oben */
export function blickHoehe(b: Blick) {
  return Math.max(-1.4, Math.min(1.4, GRUND_HOEHE + b.hoehe - neigung().y * 1.1))
}

/** Zeigerereignisse für das Drehen per Finger oder Maus */
export function useDrehgeste(blick: React.RefObject<Blick>, aktiv: boolean) {
  const zug = useRef<{ x: number; y: number; t: number } | null>(null)
  if (!aktiv) return {}
  return {
    onPointerDown: (e: React.PointerEvent) => {
      zug.current = { x: e.clientX, y: e.clientY, t: performance.now() }
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      blick.current.letzteGeste = performance.now()
      blick.current.tempoDreh = 0
    },
    onPointerMove: (e: React.PointerEvent) => {
      const z = zug.current
      if (!z) return
      const jetzt = performance.now()
      const dx = e.clientX - z.x, dy = e.clientY - z.y
      const b = blick.current
      b.dreh += dx * 0.012
      b.hoehe = Math.max(-1.6, Math.min(1.3, b.hoehe + dy * 0.009))
      b.tempoDreh = ((dx * 0.012) / Math.max(8, jetzt - z.t)) * 1000
      b.letzteGeste = jetzt
      zug.current = { x: e.clientX, y: e.clientY, t: jetzt }
    },
    onPointerUp: () => { zug.current = null; blick.current.letzteGeste = performance.now() },
    onPointerCancel: () => { zug.current = null },
  }
}

/** Kamera kreist um den Apfel; Abstand und Blickziel gleiten weich zu neuen Werten (Heranzoomen) */
export function Kamerablick({ blick, abstand = 4.2, ziel = -0.03 }: { blick: React.RefObject<Blick>; abstand?: number; ziel?: number }) {
  const { camera } = useThree()
  const jetzt = useRef({ abstand, ziel })
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 4)
    jetzt.current.abstand += (abstand - jetzt.current.abstand) * k
    jetzt.current.ziel += (ziel - jetzt.current.ziel) * k
    const d = jetzt.current.abstand, z = jetzt.current.ziel
    const el = blickHoehe(blick.current)
    const az = neigung().x * 0.5
    camera.position.set(Math.sin(az) * d * Math.cos(el), z + Math.sin(el) * d, Math.cos(az) * d * Math.cos(el))
    camera.lookAt(0, z, 0)
  })
  return null
}

/** Dreht den Inhalt um die Fruchtachse: von selbst langsam, nach Gesten mit Schwung */
export function Drehung({ children, blick, pendeln = false }: { children: ReactNode; blick: React.RefObject<Blick>; pendeln?: boolean }) {
  const gruppe = useRef<THREE.Group>(null)
  const ruhig = useRef(bewegungReduziert())
  const start = useRef(0)
  useFrame((_, dt) => {
    const g = gruppe.current
    if (!g) return
    const b = blick.current
    const seitGeste = performance.now() - b.letzteGeste
    if (Math.abs(b.tempoDreh) > 0.01 && seitGeste < RUHE_MS) {
      b.dreh += b.tempoDreh * dt
      b.tempoDreh *= Math.pow(0.04, dt) // Schwung klingt ab
    } else if (seitGeste > RUHE_MS && !ruhig.current) {
      if (pendeln) {
        // sanft hin und her um die Ausgangslage (Schnittfläche bleibt sichtbar)
        start.current += dt
        b.dreh += (Math.sin(start.current * 0.45) * 0.3 - b.dreh) * Math.min(1, dt * 1.5)
      } else b.dreh += dt * 0.22
      b.hoehe = b.zielHoehe + (b.hoehe - b.zielHoehe) * Math.pow(0.5, dt) // Blickhöhe kehrt langsam zurück
    }
    g.rotation.y = b.dreh
  })
  return <group ref={gruppe}>{children}</group>
}

/** Schatten, der ausblendet, wenn man von unten auf den Apfel schaut */
function BodenSchatten({ y, blick }: { y: number; blick: React.RefObject<Blick> }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const el = blickHoehe(blick.current)
    const m = ref.current?.material as THREE.MeshBasicMaterial | undefined
    if (m) m.opacity = Math.max(0, Math.min(1, (el + 0.05) / 0.35))
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0.04, y, 0.02]} renderOrder={-1}>
      <planeGeometry args={[1.25, 1]} />
      <meshBasicMaterial map={schattenTextur} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

// ------------------------------------------------------------------ Großer Apfel (Wiese, Detail)

function Karussell({ aepfel, position, blick }: { aepfel: ApfelParameter[]; position: number; blick: React.RefObject<Blick> }) {
  const { viewport } = useThree()
  const abstand = Math.max(1.6, viewport.width * 0.9)
  return (
    <>
      {aepfel.map((p, i) => {
        const d = i - position
        if (Math.abs(d) > 1.6) return null
        const s = 1 - Math.min(1, Math.abs(d)) * 0.35
        return (
          <group key={i} position={[d * abstand, 0, -Math.abs(d) * 0.6]} scale={s}>
            <Drehung blick={blick}>
              <Apfel p={p} />
            </Drehung>
            <BodenSchatten y={-p.hoeheZuBreite / 2 + 0.03} blick={blick} />
          </group>
        )
      })}
    </>
  )
}

interface BuehneProps {
  aepfel: ApfelParameter[]
  /** Fließkomma-Index des Apfels in der Mitte (für das Karussell) */
  position?: number
  className?: string
  /** Mit dem Finger drehbar (nicht auf der Wiese, dort wechselt Wischen den Baum) */
  drehbar?: boolean
  /** Blickhöhe zusätzlich zur Grundhöhe (rad): positiv von oben, negativ von unten */
  blickHoehe?: number
  /** Heranzoomen: 1 = ganzer Apfel, kleiner = näher */
  zoom?: number
  /** Blickziel auf der Achse (Fruchtbreite = 1; +0,4 etwa Stiel, −0,4 etwa Kelch) */
  zielY?: number
}

/** 3D-Bühne; ohne WebGL ein flacher Apfel statt einer abgestürzten Seite */
export function ApfelBuehne(props: BuehneProps) {
  if (webglVerfuegbar()) return <ApfelBuehne3d {...props} />
  const p = props.aepfel[Math.round(props.position ?? 0)] ?? props.aepfel[0]
  return (
    <div className={props.className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {p && <FlacherApfel p={p} groesse="58%" />}
    </div>
  )
}

function ApfelBuehne3d({ aepfel, position = 0, className, drehbar = true, blickHoehe: zielHoehe = 0, zoom = 1, zielY = -0.03 }: BuehneProps) {
  const [bereit, setBereit] = useState(false)
  const blick = useRef<Blick>(neuerBlick(zielHoehe))
  useEffect(() => { blick.current.zielHoehe = zielHoehe; blick.current.hoehe = zielHoehe; blick.current.letzteGeste = performance.now() - 3000 }, [zielHoehe])
  const geste = useDrehgeste(blick, drehbar)
  return (
    <div className={className} style={{ touchAction: drehbar ? 'none' : 'pan-y', cursor: drehbar ? 'grab' : undefined }} {...geste}>
      <Platzhalter sichtbar={!bereit && aepfel.length > 0} />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.2, 4], fov: 26 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
        style={{ pointerEvents: 'none' }}
      >
        <Umgebung />
        <Licht />
        <Kamerablick blick={blick} abstand={4.2 * zoom} ziel={zielY} />
        <Karussell aepfel={aepfel} position={position} blick={blick} />
        {!bereit && <Bereit onBereit={() => setBereit(true)} />}
      </Canvas>
    </div>
  )
}

// ------------------------------------------------------------------ Medaillons (viele kleine Äpfel, als Bild)

/**
 * Rundes Profilbild als 3D-Körper: einmal gerendert, als Bild angezeigt (ruckelfreies Scrollen).
 * Ein weiches Glanzlicht folgt der Neigung des Handys (CSS-Variablen aus neigung.ts).
 */
export function Medaillon({ p, groesse = 56, rahmen = true }: { p: ApfelParameter; groesse?: number; rahmen?: boolean; synchron?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [sichtbar, setSichtbar] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [ohne3d, setOhne3d] = useState(false)
  const key = JSON.stringify(p)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSichtbar(true) }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!sichtbar) return
    let aktiv = true
    medaillonBild(JSON.parse(key) as ApfelParameter).then((u) => aktiv && setUrl(u)).catch(() => aktiv && setOhne3d(true))
    return () => { aktiv = false }
  }, [sichtbar, key])
  useEffect(() => { neigung() }, []) // startet die Neigungsmessung
  return (
    <div
      ref={ref}
      className="medaillon"
      style={{
        width: groesse,
        height: groesse,
        background: rahmen ? 'radial-gradient(circle at 50% 42%, var(--papier-3), var(--papier-2))' : undefined,
        boxShadow: rahmen ? 'inset 0 0 0 0.5px var(--linie-stark)' : undefined,
      }}
    >
      {ohne3d && !url && <div style={{ position: 'absolute', inset: '10%' }}><FlacherApfel p={p} groesse="100%" /></div>}
      {url && (
        <>
          <img src={url} alt="" draggable={false} style={{ position: 'absolute', inset: '4%', width: '92%', height: '92%' }} />
          <div className="medaillon-glanz" style={{ WebkitMaskImage: `url(${url})`, maskImage: `url(${url})` }} />
        </>
      )}
    </div>
  )
}
