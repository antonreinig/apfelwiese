import { useMemo, useEffect } from 'react'
import type * as THREE from 'three'
import type { ApfelParameter } from './darstellung.ts'
import { baueApfel } from './modell.ts'

interface Props {
  p: ApfelParameter
  aufloesung?: number
  segmente?: [number, number]
  /** Schnittebene: nur der Teil, für den plane.distanceToPoint ≥ 0 gilt, bleibt sichtbar */
  schnitt?: THREE.Plane
}

const SEGMENTE: [number, number] = [96, 64]

/** Apfel mit Fruchtbreite 1, Mitte im Ursprung */
export function Apfel({ p, aufloesung = 1024, segmente = SEGMENTE, schnitt }: Props) {
  // Inhaltlich gleiche Parameter (neues Objekt, gleicher Inhalt) sollen nichts neu bauen
  const key = JSON.stringify(p)
  const [su, sv] = segmente
  const objekt = useMemo(
    () => baueApfel(JSON.parse(key) as ApfelParameter, { aufloesung, segmente: [su, sv], clipping: schnitt ? [schnitt] : undefined }),
    [key, aufloesung, su, sv, schnitt],
  )
  useEffect(() => () => objekt.entsorgen(), [objekt])
  return <primitive object={objekt.gruppe} />
}
