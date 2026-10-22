import type { Baum } from './baeume.ts'
import { letzterFotosatz } from './baeume.ts'
import type { Sortenindex } from './sorten.ts'
import { parameterAusEintrag } from './sorten.ts'
import { darstellungAus, farbenOhne, saatAusText, UNVERMESSEN, type ApfelParameter } from '../apfel3d/darstellung.ts'

export type Modellherkunft = 'messung' | 'sorte' | 'keine'

/**
 * 3D-Modell eines Baums: aus der Messung des neuesten Fotosatzes; ohne Messung das
 * typische Modell der zugeordneten Sorte; sonst ein neutraler Apfel.
 */
export function modellFuerBaum(b: Baum, index: Sortenindex | null): { p: ApfelParameter; herkunft: Modellherkunft } {
  const satz = letzterFotosatz(b)
  if (satz?.messung && (satz.messung.werte.length > 0 || Object.keys(satz.messung.farben).length > 0)) {
    // Angaben und Korrekturen des Nutzers haben Vorrang vor der Messung
    const p = darstellungAus([...b.angaben, ...satz.messung.werte], farbenOhne(satz.messung.farben, b.angaben.map((a) => a.merkmal)), saatAusText(b.id)).p
    // von Hand angeglichene Parameter gelten zuletzt
    return { p: { ...p, ...(satz.modell as Partial<ApfelParameter> | undefined) }, herkunft: 'messung' }
  }
  const eintrag = b.bestimmung.sorteId ? index?.sorten.find((s) => s.id === b.bestimmung.sorteId) : undefined
  if (eintrag) return { p: parameterAusEintrag(eintrag), herkunft: 'sorte' }
  return { p: { ...UNVERMESSEN, saat: saatAusText(b.id) }, herkunft: 'keine' }
}

const ROEMISCH = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
export function roemisch(n: number): string {
  if (n <= 0 || n > 399) return String(n)
  const h = ['', 'C', 'CC', 'CCC'][Math.floor(n / 100)]
  const z = ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC'][Math.floor((n % 100) / 10)]
  return h + z + ROEMISCH[n % 10]
}
