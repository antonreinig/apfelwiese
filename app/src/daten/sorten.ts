// Laden der Sortendatenbank (public/sorten/index.json und je Sorte eine Datei).

import { useEffect, useState } from 'react'
import type { Sorte, SortenEintrag, Quelle } from './sorte.ts'
import { darstellungAus, zusammenfassen, saatAusText, type ApfelParameter } from '../apfel3d/darstellung.ts'

export interface Sortenindex {
  stand: string
  anzahl: number
  sorten: SortenEintrag[]
  quellen: Quelle[]
}

let indexVersprechen: Promise<Sortenindex> | null = null

const LEER: Sortenindex = { stand: '', anzahl: 0, sorten: [], quellen: [] }

export function ladeIndex(): Promise<Sortenindex> {
  indexVersprechen ??= fetch('/sorten/index.json')
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Sortenindex> })
    .catch(() => { indexVersprechen = null; return LEER }) // beim nächsten Aufruf erneut versuchen
  return indexVersprechen
}

export function useSortenindex() {
  const [index, setIndex] = useState<Sortenindex | null>(null)
  useEffect(() => {
    let aktiv = true
    ladeIndex().then((i) => aktiv && setIndex(i))
    return () => { aktiv = false }
  }, [])
  return index
}

const sortenSpeicher = new Map<string, Promise<Sorte | null>>()

export function ladeSorte(id: string): Promise<Sorte | null> {
  let v = sortenSpeicher.get(id)
  if (!v) {
    v = fetch(`/sorten/${id}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => { sortenSpeicher.delete(id); return null }) // offline: später erneut versuchen
    sortenSpeicher.set(id, v)
  }
  return v
}

export function useSorte(id: string | undefined) {
  const [sorte, setSorte] = useState<Sorte | null | undefined>(undefined)
  useEffect(() => {
    if (!id) return
    let aktiv = true
    setSorte(undefined)
    ladeSorte(id).then((s) => aktiv && setSorte(s))
    return () => { aktiv = false }
  }, [id])
  return sorte
}

/** Modellparameter einer Sorte aus dem Index (dort bereits abgeleitet) */
const parameterSpeicher = new Map<string, ApfelParameter>()
export function parameterAusEintrag(e: SortenEintrag): ApfelParameter {
  let p = parameterSpeicher.get(e.id)
  if (!p) {
    const { p: basis } = darstellungAus([], undefined, saatAusText(e.id))
    p = { ...basis, ...(e.darstellung as Partial<ApfelParameter>), saat: saatAusText(e.id) } as ApfelParameter
    parameterSpeicher.set(e.id, p)
  }
  return p
}

export function parameterAusSorte(s: Sorte): ApfelParameter {
  const messung = s.farbmessung?.[0]
  return darstellungAus(zusammenfassen(s.merkmale), messung, saatAusText(s.id)).p
}

export function normalisiere(t: string) {
  return t
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
