import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Beleg, Quelle } from '../daten/sorte.ts'

// Fußnoten: jeder Beleg bekommt beim ersten Auftreten eine Nummer.

interface Register {
  nummer: (b: Beleg) => number
  liste: () => { n: number; b: Beleg }[]
}

const Kontext = createContext<Register | null>(null)

const schluessel = (b: Beleg) => [b.quelle, b.band ?? '', b.seite ?? '', b.url ?? ''].join('|')

export function BelegRegister({ children }: { children: ReactNode }) {
  const reg = useMemo<Register>(() => {
    const m = new Map<string, { n: number; b: Beleg }>()
    return {
      nummer: (b) => {
        const k = schluessel(b)
        let e = m.get(k)
        if (!e) { e = { n: m.size + 1, b }; m.set(k, e) }
        return e.n
      },
      liste: () => [...m.values()],
    }
  }, [])
  return <Kontext.Provider value={reg}>{children}</Kontext.Provider>
}

export function Fussnoten({ belege }: { belege: Beleg[] }) {
  const reg = useContext(Kontext)
  if (!reg || !belege.length) return null
  const nummern = [...new Set(belege.map((b) => reg.nummer(b)))].sort((a, b) => a - b)
  return (
    <sup className="ui" style={{ fontSize: 10, color: 'var(--bleistift)', marginLeft: 2 }}>
      {nummern.map((n, i) => (
        <a key={n} href={`#beleg-${n}`} onClick={(e) => { e.preventDefault(); document.getElementById(`beleg-${n}`)?.scrollIntoView({ behavior: 'smooth' }) }} style={{ textDecoration: 'none' }}>
          {i ? ',' : ''}{n}
        </a>
      ))}
    </sup>
  )
}

/** Seitenzahlen mit „S.“, andere Fundstellen (z. B. Akzessionsnummern) wie angegeben */
const seite = (s: string) => (/^[0-9IVXLC]/.test(s) ? `S. ${s}` : s)

export function Belegliste({ quellen }: { quellen: Map<string, Quelle> }) {
  const reg = useContext(Kontext)
  if (!reg) return null
  const l = reg.liste().sort((a, b) => a.n - b.n)
  if (!l.length) return null
  return (
    <ol style={{ paddingLeft: 22, margin: 0 }}>
      {l.map(({ n, b }) => {
        const q = quellen.get(b.quelle)
        const url = b.url ?? q?.url
        return (
          <li key={n} id={`beleg-${n}`} className="sehr-klein" style={{ marginBottom: 6 }}>
            {q ? (
              <>
                {q.autor ? `${q.autor}: ` : ''}<i>{q.werk}</i>{q.jahr ? ` (${q.jahr})` : ''}
                {b.band ? `, Bd. ${b.band}` : ''}{b.seite ? `, ${seite(b.seite)}` : ''}. {q.lizenz}.
              </>
            ) : (
              <>{b.quelle}{b.band ? `, Bd. ${b.band}` : ''}{b.seite ? `, ${seite(b.seite)}` : ''}.</>
            )}
            {url && <> <a href={url} target="_blank" rel="noreferrer">Quelle öffnen</a></>}
          </li>
        )
      })}
    </ol>
  )
}
