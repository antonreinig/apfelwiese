import { useRef, useState } from 'react'
import { Medaillon } from '../apfel3d/Buehne.tsx'
import { useSortenindex, parameterAusEintrag } from '../daten/sorten.ts'
import { Wiese as WieseSymbol, Apfel } from './symbole.tsx'

// Einführung beim ersten Start: drei Tafeln, wischbar. Später erneut aufrufbar unter „Über die App“.

const GESEHEN = 'einfuehrung-gesehen'

export function einfuehrungOffen() {
  try { return !localStorage.getItem(GESEHEN) } catch { return false }
}
export function einfuehrungZuruecksetzen() {
  try { localStorage.removeItem(GESEHEN) } catch { /* privat */ }
}

export function Einfuehrung({ fertig }: { fertig: () => void }) {
  const [i, setI] = useState(0)
  const start = useRef<number | null>(null)
  const index = useSortenindex()
  const sorte = index?.sorten.find((s) => s.id === 'ananasrenette') ?? index?.sorten.find((s) => s.hatBild)

  const schliessen = () => {
    try { localStorage.setItem(GESEHEN, '1') } catch { /* privat */ }
    fertig()
  }

  const tafeln = [
    {
      bild: <img src="/anleitung/foto1.jpg" alt="Vier Apfelhälften auf einem A4-Blatt" style={{ width: '62%', maxWidth: 240, borderRadius: 6, boxShadow: 'var(--schatten)' }} />,
      titel: 'Vier Äpfel, vier Fotos',
      text: 'Nimm vier typische Äpfel eines Baums, schneide sie auf und fotografiere sie auf einem weißen A4-Blatt. Die App führt dich durch die vier Aufnahmen. Das Blatt dient als Maßstab und für die Farben.',
    },
    {
      bild: sorte ? <Medaillon p={parameterAusEintrag(sorte)} groesse={190} /> : <Apfel style={{ width: 120, height: 120 }} />,
      titel: 'Dein Apfel in 3D',
      text: 'Aus den Fotos misst die App Größe, Form und Farben und baut ein 3D-Modell. Im Merkmals-Rundgang prüfst du Schritt für Schritt Stiel, Kelch, Kernhaus und Geschmack. Daraus entsteht ein Sortenvorschlag aus über 1.900 beschriebenen Sorten. Sicher wird eine Bestimmung erst durch Pomologen oder DNA.',
    },
    {
      bild: <WieseSymbol style={{ width: 120, height: 120, color: 'var(--blatt)' }} />,
      titel: 'Deine Wiese',
      text: 'Unter „Wiese“ setzt du deine Bäume auf das Luftbild, so wie sie wirklich stehen. Mit einem Konto (Anmeldung per E-Mail-Code) liegen Bäume und Fotos sicher auf dem Server. Tipp: Lege die App auf deinen Home-Bildschirm.',
    },
  ]
  const t = tafeln[i]
  const letzte = i === tafeln.length - 1

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Einführung"
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--papier)', display: 'flex', flexDirection: 'column', padding: 'var(--oben) 20px calc(var(--sicher-unten) + 20px)' }}
      onPointerDown={(e) => { start.current = e.clientX }}
      onPointerUp={(e) => {
        if (start.current === null) return
        const dx = e.clientX - start.current
        start.current = null
        if (dx < -50 && !letzte) setI(i + 1)
        if (dx > 50 && i > 0) setI(i - 1)
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="knopf leise" style={{ minHeight: 36, border: 'none' }} onClick={schliessen}>Überspringen</button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.bild}</div>
        <h1 className="name" style={{ fontSize: 42 }}>{t.titel}</h1>
        <p style={{ maxWidth: 420, margin: 0 }}>{t.text}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '16px 0' }} aria-hidden>
        {tafeln.map((_, k) => <span key={k} style={{ width: 8, height: 8, borderRadius: '50%', background: k === i ? 'var(--tinte)' : 'var(--linie-stark)' }} />)}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {i > 0 && <button className="knopf leise" style={{ flex: 1 }} onClick={() => setI(i - 1)}>Zurück</button>}
        <button className="knopf haupt" style={{ flex: 2 }} onClick={() => (letzte ? schliessen() : setI(i + 1))}>{letzte ? 'Loslegen' : 'Weiter'}</button>
      </div>
    </div>
  )
}
