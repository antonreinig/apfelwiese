import type { Baum } from '../daten/baeume.ts'
import { VERTRAUEN } from '../daten/baeume.ts'

/**
 * Name eines Baums in Schreibschrift. Bleistift (grau) für App-Vorschläge und unbestimmte
 * Bäume, Tinte für eigene Bestimmungen, mit Siegel bei Bestätigung durch Pomologe oder DNA.
 */
export function Sortenname({ baum, groesse = 32, block = false }: { baum: Baum; groesse?: number; block?: boolean }) {
  const v = VERTRAUEN[baum.bestimmung.status]
  const name = baum.bestimmung.sorteName ?? 'Unbekannte Sorte'
  return (
    <span
      className={`name ${v.tinte ? '' : 'bleistift'}`}
      style={{ fontSize: groesse, display: block ? 'block' : 'inline', marginTop: block ? 4 : 0, lineHeight: block ? 1.05 : undefined, overflowWrap: 'anywhere' }}
      title={v.label}
    >
      {name}
      {v.siegel && <span className="siegel" style={{ marginLeft: 8, fontSize: Math.max(9, groesse * 0.22), width: Math.max(16, groesse * 0.5), height: Math.max(16, groesse * 0.5), padding: v.siegel === 'DNA' ? '0 3px' : 0, borderRadius: 999 }} aria-label={v.label}>{v.siegel}</span>}
    </span>
  )
}
