import { useState } from 'react'
import { useKonto, kontoApi } from '../daten/konto.ts'
import { zurueck } from '../ui/router.ts'
import { Zurueck } from '../ui/symbole.tsx'

declare const __APP_STAND__: string

export default function RueckmeldungSeite() {
  const konto = useKonto()
  const [text, setText] = useState('')
  const [kontakt, setKontakt] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [fertig, setFertig] = useState(false)
  const [fehler, setFehler] = useState('')
  let seite = ''
  try { seite = sessionStorage.getItem('letzte-seite') ?? '' } catch { /* privat */ }

  const senden = async () => {
    setLaeuft(true); setFehler('')
    try {
      await kontoApi('/api/rueckmeldung', {
        method: 'POST',
        body: JSON.stringify({ text, kontakt: kontakt.trim() || undefined, seite, version: __APP_STAND__, geraet: navigator.userAgent }),
      })
      setFertig(true)
    } catch (e) { setFehler((e as Error).message) }
    setLaeuft(false)
  }

  return (
    <div className="seite">
      <button className="rund-knopf" onClick={() => zurueck('/info')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 40, marginTop: 8 }}>Rückmeldung</h1>
      {fertig ? (
        <p>Danke, deine Nachricht ist angekommen.</p>
      ) : (
        <>
          <p className="klein">Was klappt nicht, was fehlt, was ist unklar? Beschreibe kurz, was du gemacht hast und was passiert ist.</p>
          <label className="feld"><span>Deine Nachricht</span>
            <textarea className="eingabe" style={{ minHeight: 160 }} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          {konto.status !== 'angemeldet' && (
            <label className="feld"><span>E-Mail für eine Antwort (freiwillig)</span>
              <input className="eingabe" type="email" autoComplete="email" value={kontakt} onChange={(e) => setKontakt(e.target.value)} />
            </label>
          )}
          <p className="sehr-klein">Mitgeschickt werden {konto.status === 'angemeldet' ? 'deine Konto-E-Mail, ' : ''}die zuletzt geöffnete Seite, der App-Stand und die Browserkennung, damit sich Fehler nachvollziehen lassen. <a href="#/datenschutz">Datenschutz</a></p>
          {fehler && <p className="klein" style={{ color: 'var(--warn)' }}>{fehler}</p>}
          <button className="knopf haupt" style={{ width: '100%' }} disabled={laeuft || text.trim().length < 3} onClick={senden}>{laeuft ? 'Wird gesendet …' : 'Senden'}</button>
        </>
      )}
    </div>
  )
}
