import { useEffect, useMemo, useState } from 'react'
import { useSortenindex, parameterAusEintrag } from '../daten/sorten.ts'
import { medaillonBild, type BildAnsicht } from '../apfel3d/medaillonBild.ts'
import type { ApfelParameter } from '../apfel3d/darstellung.ts'

// Entwicklerseite (#/vergleich): Referenzfoto neben großen Renderings (Seite, Stielgrube, Kelch),
// um das Aussehen an echten Äpfeln zu prüfen. Mit ?sorten=a,b,c eine eigene Auswahl.
const AUSWAHL = ['ananasrenette', 'schoener-aus-boskoop', 'cox-orange', 'gravensteiner', 'golden-delicious', 'berlepsch', 'weisser-klarapfel', 'champagnerrenette', 'roter-eiserapfel', 'jakob-lebel', 'goldparmaene', 'kaiser-wilhelm']

function Bild({ p, ansicht, pixel }: { p: ApfelParameter; ansicht: BildAnsicht; pixel: number }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => { let a = true; medaillonBild(p, { ansicht, pixel, speichern: false }).then((u) => a && setUrl(u)); return () => { a = false } }, [p, ansicht, pixel])
  return url ? <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', background: '#f3eee3' }} /> : <div style={{ aspectRatio: '1', background: '#eee' }} />
}

export default function VergleichSeite() {
  const index = useSortenindex()
  const ids = useMemo(() => {
    const q = new URLSearchParams(location.hash.split('?')[1] ?? '').get('sorten')
    return q ? q.split(',') : AUSWAHL
  }, [])
  const liste = useMemo(() => ids.map((id) => index?.sorten.find((s) => s.id === id)).filter((s) => !!s), [index, ids])
  return (
    <div className="seite" style={{ maxWidth: 1400 }}>
      {liste.map((s) => (
        <div key={s.id} style={{ borderBottom: '0.5px solid var(--linie)', padding: '6px 0' }}>
          <div className="klein">{s.name} · {JSON.stringify(s.darstellung).slice(0, 160)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: liste.length === 1 ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 6 }}>
            {s.bild ? <img src={s.bild} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#fff' }} /> : <div />}
            <Bild p={parameterAusEintrag(s)} ansicht="seite" pixel={640} />
            <Bild p={parameterAusEintrag(s)} ansicht="stiel" pixel={640} />
            <Bild p={parameterAusEintrag(s)} ansicht="kelch" pixel={640} />
          </div>
        </div>
      ))}
    </div>
  )
}
