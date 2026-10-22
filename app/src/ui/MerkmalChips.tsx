import { MERKMAL_NACH_ID } from '../daten/merkmalskatalog.ts'

/**
 * Auswahl einer Ausprägung als Chips (statt Dropdown). Mehrfachmerkmale erlauben mehrere.
 * Monatsmerkmale können ab einem Monat beginnen (z. B. Genussreife ab der Pflückreife).
 */
export function MerkmalChips({ merkmal, werte, onChange, abMonat }: {
  merkmal: string
  werte: string[]
  onChange: (werte: string[]) => void
  abMonat?: string
}) {
  const m = MERKMAL_NACH_ID[merkmal]
  if (!m?.auspraegungen) return null
  let optionen = m.auspraegungen
  if (m.einheit === 'monat' && abMonat) {
    // zwölf Monate ab dem angegebenen, in Kalenderfolge
    const start = Number(abMonat)
    optionen = Array.from({ length: 12 }, (_, k) => String(((start - 1 + k) % 12) + 1))
      .map((code) => m.auspraegungen!.find((a) => a.code === code)!)
      .filter(Boolean)
  }
  const umschalten = (code: string) => {
    if (m.mehrfach) onChange(werte.includes(code) ? werte.filter((w) => w !== code) : [...werte, code])
    else onChange(werte[0] === code ? [] : [code])
  }
  return (
    <div className="chips" style={{ flexWrap: optionen.length > 6 && m.einheit === 'monat' ? 'nowrap' : 'wrap' }} role="group" aria-label={m.name}>
      {optionen.map((a) => (
        <button key={a.code} type="button" aria-pressed={werte.includes(a.code)} className={`chip ${werte.includes(a.code) ? 'an' : ''}`} onClick={() => umschalten(a.code)} title={a.beschreibung}>
          {a.label}
        </button>
      ))}
    </div>
  )
}
