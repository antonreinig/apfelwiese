import { useEffect, useMemo, useState } from 'react'
import { useSortenindex, parameterAusEintrag, useSorte } from '../daten/sorten.ts'
import { medaillonBild, type BildAnsicht } from '../apfel3d/medaillonBild.ts'
import type { ApfelParameter } from '../apfel3d/darstellung.ts'
import type { SortenEintrag } from '../daten/sorte.ts'
import { Schnittansicht } from '../apfel3d/Schnitt.tsx'

// Entwicklerseite (#/vergleich): NFC-Fototafel neben Renderings in derselben Anordnung
// (oben Seite und Stiel, unten Kopfstand und Kelch); bei einer Sorte dazu Längs- und Querschnitt.
// Mit ?sorten=a,b,c eine eigene Auswahl.
const AUSWAHL = ['ananasrenette', 'schoener-aus-boskoop', 'gravensteiner', 'golden-delicious', 'berlepsch', 'weisser-klarapfel', 'champagnerrenette', 'roter-eiserapfel', 'jakob-lebel', 'goldparmaene']

function Bild({ p, ansicht }: { p: ApfelParameter; ansicht: BildAnsicht }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => { let a = true; medaillonBild(p, { ansicht, pixel: 480, speichern: false }).then((u) => a && setUrl(u)); return () => { a = false } }, [p, ansicht])
  return url ? <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', background: '#c9ccd1' }} /> : <div style={{ aspectRatio: '1', background: '#c9ccd1' }} />
}

function Zeile({ s, werkzeug }: { s: SortenEintrag; werkzeug: boolean }) {
  const sorte = useSorte(s.id)
  const tafel = sorte?.bilder.find((b) => /Cross_section/.test(b.url))?.url ?? s.bild
  // Abgleichwerkzeug: Werte als JSON überschreiben und sofort neu rendern (Ergebnis für abgleich_hand.json)
  const [text, setText] = useState('{}')
  const ueber = useMemo(() => { try { return JSON.parse(text) as Partial<ApfelParameter> } catch { return null } }, [text])
  const p = useMemo(() => ({ ...parameterAusEintrag(s), ...(ueber ?? {}) }), [s, ueber])
  return (
    <div style={{ borderBottom: '0.5px solid var(--linie)', padding: '6px 0' }}>
      <div className="klein">{s.name} · {JSON.stringify(s.darstellung).slice(0, werkzeug ? 2000 : 220)}</div>
      {werkzeug && (
        <textarea className="eingabe" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false}
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, minHeight: 60, borderColor: ueber ? undefined : 'var(--warn)' }}
          aria-label="Werte überschreiben" />
      )}
      {/* bei einer Sorte darunter wie die rechte Spalte der Tafel: Längs- und Querschnitt (je eine 3D-Bühne) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 6 }}>
        {tafel ? <img src={tafel} alt="" style={{ width: '100%', objectFit: 'contain', background: '#fff' }} /> : <div />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignContent: 'start' }}>
          <Bild p={p} ansicht="seite" />
          <Bild p={p} ansicht="stiel" />
          <Bild p={p} ansicht="kopf" />
          <Bild p={p} ansicht="kelch" />
        </div>
      </div>
      {werkzeug && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
          {(['laengs', 'quer'] as const).map((art) => (
            <div key={art} style={{ position: 'relative', aspectRatio: '1', background: '#c9ccd1' }}><Schnittansicht p={p} art={art} wahl={false} className="buehne" /></div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VergleichSeite() {
  const index = useSortenindex()
  const ids = useMemo(() => {
    const q = new URLSearchParams(location.hash.split('?')[1] ?? '').get('sorten')
    return q ? q.split(',') : AUSWAHL
  }, [])
  const liste = useMemo(() => ids.map((id) => index?.sorten.find((s) => s.id === id)).filter((s): s is SortenEintrag => !!s), [index, ids])
  return <div className="seite" style={{ maxWidth: 1400 }}>{liste.map((s) => <Zeile key={s.id} s={s} werkzeug={liste.length === 1} />)}</div>
}
