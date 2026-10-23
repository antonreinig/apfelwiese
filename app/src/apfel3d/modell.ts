// Baut den ganzen Apfel als three.js-Gruppe: Körper mit Schalenmaterial, Stiel, Kelch.
// Wird von der React-Komponente (Apfel.tsx) und vom Bildrenderer der Medaillons genutzt.

import * as THREE from 'three'
import type { ApfelParameter } from './darstellung.ts'
import { apfelGeometrie, pole } from './geometrie.ts'
import { schalenbilder } from './schale.ts'
import { baueStiel, baueKelch, entsorgen as teilEntsorgen } from './stielKelch.ts'

/** Bei Änderungen am Aussehen erhöhen: verwirft zwischengespeicherte Medaillon-Bilder */
export const MODELL_VERSION = 6

// ------------------------------------------------------------------ Schalenmaterial, geteilt

const materialSpeicher = new Map<string, { material: THREE.MeshPhysicalMaterial; nutzer: number }>()

function holeMaterial(key: string, p: ApfelParameter, aufloesung: number) {
  const vorhanden = materialSpeicher.get(key)
  if (vorhanden) { vorhanden.nutzer++; return vorhanden.material }
  const b = schalenbilder(p, aufloesung)
  const map = new THREE.CanvasTexture(b.farbe)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 4
  const rough = new THREE.CanvasTexture(b.rauheit)
  const bump = new THREE.CanvasTexture(b.relief)
  const glanz = new THREE.CanvasTexture(b.glanz)
  for (const t of [map, rough, bump, glanz]) {
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
  }
  // Apfelschale: Kutikula mit Wachs. Matte Sorten (Renetten, berostete) streuen das Licht breit,
  // wachsige glänzen mit einer zweiten, glatten Schicht. Rost und Schalenpunkte tragen kein Wachs
  // (Glanzkarte schwarz) und bleiben matt. Bereifung und der feine Flaum matter Schalen als Sheen.
  const wachs = Math.max(0, p.glanz - 0.5) * 1.1
  const material = new THREE.MeshPhysicalMaterial({
    map,
    roughnessMap: rough,
    roughness: 1,
    bumpMap: bump,
    bumpScale: 0.5,
    ior: 1.45,
    specularIntensity: 0.55 + p.glanz * 0.45,
    clearcoat: wachs,
    clearcoatMap: wachs > 0 ? glanz : null,
    clearcoatRoughness: 0.32 - p.glanz * 0.12,
    // Bereifung: zarter, kühler Hauch an den Rändern; zu stark färbt sie rote Äpfel violett
    sheen: Math.max(p.bereifung * 0.55, (1 - p.glanz) * 0.3),
    sheenColor: new THREE.Color(p.bereifung > 0.3 ? '#d9dee8' : '#e8e2d2'),
    sheenRoughness: 0.75,
    side: THREE.DoubleSide,
  })
  if (!wachs) glanz.dispose()
  materialSpeicher.set(key, { material, nutzer: 1 })
  return material
}

function freigeben(key: string) {
  const e = materialSpeicher.get(key)
  if (!e) return
  e.nutzer--
  if (e.nutzer > 0) return
  // kurz verzögert, damit ein Wechsel hin und zurück nichts neu berechnet
  setTimeout(() => {
    const x = materialSpeicher.get(key)
    if (x && x.nutzer <= 0) {
      x.material.map?.dispose(); x.material.roughnessMap?.dispose(); x.material.bumpMap?.dispose(); x.material.clearcoatMap?.dispose()
      x.material.dispose()
      materialSpeicher.delete(key)
    }
  }, 8000)
}

// ------------------------------------------------------------------ Apfel

export interface ApfelOptionen {
  aufloesung?: number
  segmente?: [number, number]
  clipping?: THREE.Plane[]
}

export interface ApfelObjekt {
  gruppe: THREE.Group
  entsorgen: () => void
}

export function parameterSchluessel(p: ApfelParameter, aufloesung: number) {
  return JSON.stringify(p) + '|' + aufloesung
}

/** Apfel mit Fruchtbreite 1, Mitte im Ursprung, Stiel nach +y */
export function baueApfel(p: ApfelParameter, opt: ApfelOptionen = {}): ApfelObjekt {
  const aufloesung = opt.aufloesung ?? 1024
  const [su, sv] = opt.segmente ?? [96, 64]
  const key = parameterSchluessel(p, aufloesung)
  const gruppe = new THREE.Group()

  const geteilt = holeMaterial(key, p, aufloesung)
  let material: THREE.Material = geteilt
  if (opt.clipping) {
    material = geteilt.clone()
    material.clippingPlanes = opt.clipping
  }
  const geometrie = apfelGeometrie(p, su, sv)
  gruppe.add(new THREE.Mesh(geometrie, material))

  const pl = pole(p)
  const stiel = baueStiel(p, { clipping: opt.clipping })
  stiel.position.set(0, pl.stiel, 0)
  stiel.rotation.z = pl.stielNeigung
  gruppe.add(stiel)

  const kelch = baueKelch(p, { clipping: opt.clipping })
  kelch.position.set(0, pl.kelch, 0)
  kelch.rotation.set(Math.PI, 0, -pl.kelchNeigung)
  gruppe.add(kelch)

  return {
    gruppe,
    entsorgen: () => {
      geometrie.dispose()
      if (material !== geteilt) material.dispose()
      freigeben(key)
      teilEntsorgen(stiel)
      teilEntsorgen(kelch)
    },
  }
}
