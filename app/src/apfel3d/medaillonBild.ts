// Rendert Medaillons einmal als Bild (statt live), damit lange Listen ruckelfrei scrollen.
// Ein einziger, unsichtbarer WebGL-Renderer arbeitet eine Warteschlange ab; Ergebnisse bleiben
// je Parametersatz im Speicher. Das Glanzlicht, das der Neigung folgt, legt die Seite per CSS darüber.

import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { ApfelParameter } from './darstellung.ts'
import { get, set } from 'idb-keyval'
import { baueApfel, MODELL_VERSION } from './modell.ts'

const GROESSE = 320 // Pixel; reicht für Medaillons bis etwa 160 CSS-Pixel bei 2-facher Auflösung

let renderer: THREE.WebGLRenderer | null = null
let szene: THREE.Scene | null = null
let kamera: THREE.PerspectiveCamera | null = null

function vorbereiten() {
  if (renderer) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(GROESSE, GROESSE, false)
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  szene = new THREE.Scene()
  const pm = new THREE.PMREMGenerator(renderer)
  szene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture
  szene.environmentIntensity = 0.85
  pm.dispose()
  const key = new THREE.DirectionalLight('#fff6e8', 2.1)
  key.position.set(-2.2, 3, 2.5)
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.5)
  fill.position.set(2.5, 0.6, -1.5)
  szene.add(key, fill, new THREE.AmbientLight('#ffffff', 0.15))
  kamera = new THREE.PerspectiveCamera(24, 1, 0.1, 20)
  kamera.position.set(0, 0.75, 2.75)
  kamera.lookAt(0, -0.02, 0)
}

const fertig = new Map<string, Promise<string>>()
const warteschlange: (() => Promise<void>)[] = []
let laeuft = false

async function abarbeiten() {
  if (laeuft) return
  laeuft = true
  while (warteschlange.length) {
    const auftrag = warteschlange.shift()!
    await auftrag()
    // dem Browser zwischen zwei Bildern Luft lassen (ohne auf Bildwechsel zu warten, die gedrosselt sein können)
    await new Promise((r) => setTimeout(r, 4))
  }
  laeuft = false
}

/** Liefert eine Bild-URL des Apfels mit der Sonnenseite zum Betrachter */
export function medaillonBild(p: ApfelParameter): Promise<string> {
  const key = JSON.stringify(p)
  let v = fertig.get(key)
  if (v) return v
  const speicherKey = `medaillon:${MODELL_VERSION}:${hash(key)}`
  v = new Promise<string>((res, rej) => {
    warteschlange.push(async () => {
      try {
        // schon einmal gerendert (auch in einer früheren Sitzung)?
        const alt = await get<Blob>(speicherKey).catch(() => undefined)
        if (alt) { res(URL.createObjectURL(alt)); return }
        vorbereiten()
        const apfel = baueApfel(p, { aufloesung: 512, segmente: [64, 40] })
        apfel.gruppe.rotation.y = Math.PI + 0.15
        szene!.add(apfel.gruppe)
        renderer!.render(szene!, kamera!)
        szene!.remove(apfel.gruppe)
        apfel.entsorgen()
        const blob = await new Promise<Blob | null>((r) => renderer!.domElement.toBlob(r, 'image/png'))
        if (!blob) throw new Error('Bild leer')
        set(speicherKey, blob).catch(() => {}) // Speicher voll o. Ä.: dann eben nicht
        res(URL.createObjectURL(blob))
      } catch (e) {
        fertig.delete(key)
        rej(e)
      }
    })
    abarbeiten()
  })
  fertig.set(key, v)
  return v
}

function hash(t: string) {
  let h1 = 0x811c9dc5, h2 = 0x01000193
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 16777619)
    h2 = Math.imul(h2 ^ c, 2246822519)
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)
}
