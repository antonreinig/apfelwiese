import { useEffect, useMemo, useRef, useState } from 'react'
import { Medaillon } from '../apfel3d/Buehne.tsx'
import { useSortenindex, parameterAusEintrag, normalisiere } from '../daten/sorten.ts'
import { Suche } from '../ui/symbole.tsx'
import type { SortenEintrag } from '../daten/sorte.ts'

const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const SEITE = 40

type Filter = 'alle' | 'ausfuehrlich' | 'reif' | 'bild' | 'schnitt'

export function SortenSeite() {
  const index = useSortenindex()
  const [suche, setSuche] = useState(() => sessionStorageLesen('sorten-suche'))
  const [filter, setFilter] = useState<Filter>('alle')
  const [anzahl, setAnzahl] = useState(SEITE)
  const ende = useRef<HTMLDivElement>(null)
  const monat = new Date().getMonth() + 1

  useEffect(() => { try { sessionStorage.setItem('sorten-suche', suche) } catch { /* privat */ } }, [suche])

  const treffer = useMemo(() => {
    if (!index) return []
    const q = normalisiere(suche)
    let l = index.sorten
    if (filter === 'ausfuehrlich') l = l.filter((s) => s.ausfuehrlich)
    if (filter === 'reif') l = l.filter((s) => s.genuss?.includes(monat))
    if (filter === 'bild') l = l.filter((s) => s.hatBild)
    if (filter === 'schnitt') l = l.filter((s) => s.schnitt)
    if (q) {
      const bewertet = l
        .map((s) => {
          const n = normalisiere(s.name)
          if (n.startsWith(q)) return { s, w: 0 }
          if (n.includes(q)) return { s, w: 1 }
          if (s.synonyme.some((x) => normalisiere(x).includes(q))) return { s, w: 2 }
          return null
        })
        .filter((x): x is { s: SortenEintrag; w: number } => !!x)
      bewertet.sort((a, b) => a.w - b.w || a.s.name.localeCompare(b.s.name, 'de'))
      l = bewertet.map((x) => x.s)
    }
    return l
  }, [index, suche, filter, monat])

  useEffect(() => setAnzahl(SEITE), [suche, filter])
  useEffect(() => {
    const el = ende.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setAnzahl((a) => a + SEITE), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [treffer])

  return (
    <div className="seite">
      <div className="tafelkopf">
        <span>Sortenverzeichnis</span>
        <span>{index ? `${index.anzahl} Sorten` : ''}</span>
      </div>
      <div style={{ position: 'relative', marginTop: 12 }}>
        <Suche style={{ position: 'absolute', left: 12, top: 12, width: 20, height: 20, color: 'var(--bleistift)' }} />
        <input
          className="eingabe"
          style={{ paddingLeft: 40, borderRadius: 999 }}
          placeholder="Name oder Synonym"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          type="search"
          enterKeyHint="search"
          aria-label="Sorte suchen"
        />
      </div>
      <div className="chips" style={{ marginTop: 10 }}>
        {([
          ['alle', 'Alle'],
          ['ausfuehrlich', 'Ausführlich beschrieben'],
          ['reif', `Genussreif im ${MONATE[monat - 1]}`],
          ['bild', 'Mit Bild'],
          ['schnitt', 'Mit Schnittmerkmalen'],
        ] as [Filter, string][]).map(([f, t]) => (
          <button key={f} className={`chip ${filter === f ? 'an' : ''}`} onClick={() => setFilter(f)}>{t}</button>
        ))}
      </div>

      {index && index.anzahl === 0 && (
        <p className="hinweis" style={{ marginTop: 24 }}>Die Sortendatenbank wird gerade aufgebaut.</p>
      )}
      {index && index.anzahl > 0 && treffer.length === 0 && (
        <p className="hinweis" style={{ marginTop: 24 }}>Keine Sorte gefunden. Versuch einen anderen Namen oder ein Synonym.</p>
      )}

      <div style={{ marginTop: 8 }}>
        {treffer.slice(0, anzahl).map((s) => (
          <a key={s.id} className="zeile" href={`#/sorte/${s.id}`}>
            <Medaillon p={parameterAusEintrag(s)} groesse={60} />
            <div className="grow">
              <div className="name">{s.name}</div>
              <div className="sehr-klein" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {zeileText(s)}
              </div>
            </div>
          </a>
        ))}
        <div ref={ende} />
      </div>
    </div>
  )
}

function zeileText(s: SortenEintrag) {
  const teile: string[] = []
  if (s.reife) teile.push(s.reife)
  if (s.kurz) teile.push(s.kurz)
  else if (s.synonyme.length) teile.push(s.synonyme.slice(0, 2).join(', '))
  return teile.join(' · ')
}

function sessionStorageLesen(k: string) {
  try { return sessionStorage.getItem(k) ?? '' } catch { return '' }
}
