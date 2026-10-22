import { useMemo, useState } from 'react'
import { useSortenindex, parameterAusEintrag } from '../daten/sorten.ts'
import { Medaillon } from '../apfel3d/Buehne.tsx'

// Entwicklerseite (#/vergleich): Referenzfoto neben dem 3D-Medaillon, für viele Sorten auf einen Blick
export default function VergleichSeite() {
  const index = useSortenindex()
  const [nur, setNur] = useState<'nfc' | 'alle'>('nfc')
  const liste = useMemo(() => (index?.sorten ?? [])
    .filter((s) => s.bild && (nur === 'alle' || /National_Fruit_Collection|NFC/i.test(s.bild)))
    .slice(0, 80), [index, nur])
  return (
    <div className="seite">
      <div className="chips">
        <button className={`chip ${nur === 'nfc' ? 'an' : ''}`} onClick={() => setNur('nfc')}>NFC-Fotos</button>
        <button className={`chip ${nur === 'alle' ? 'an' : ''}`} onClick={() => setNur('alle')}>Alle Bilder</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        {liste.map((s) => (
          <div key={s.id} style={{ border: '0.5px solid var(--linie)', padding: 4 }}>
            <div className="sehr-klein" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <img src={s.bild} alt="" loading="lazy" style={{ width: 80, height: 80, objectFit: 'cover' }} />
              <Medaillon p={parameterAusEintrag(s)} groesse={80} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
