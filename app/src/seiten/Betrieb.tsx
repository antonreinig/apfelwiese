import { useEffect, useState } from 'react'
import { kontoApi } from '../daten/konto.ts'
import { zurueck } from '../ui/router.ts'
import { Zurueck } from '../ui/symbole.tsx'

// Betriebsübersicht nur für den Betreiber: Konten, Ereignisse, Fehler der letzten Tage, Kontingente.

interface Fehlergruppe {
  art: string; quelle: string; meldung: string; anzahl: number; zuletzt: string
  seiten: string[]; geraete: string[]; versionen: string[]
  beispiel?: { ablauf?: string; zusatz?: string; uid?: string }
}
interface Betriebsdaten {
  konten: { email: string; erstellt: string; baeume: number; fotos: number; verbesserung: boolean }[]
  ereignisse: { zeit: string; art: string }[]
  fehler: Fehlergruppe[]
  kontingent: { anmeldemails: number; anmeldemailsMax: number; rueckmeldungen: number; rueckmeldungenMax: number }
}

const zeit = (t: string) => new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const ARTEN: Record<string, string> = { 'konto-neu': 'Neues Konto', 'konto-geloescht': 'Konto gelöscht', rueckmeldung: 'Rückmeldung' }

/** Browserkennung grob lesbar machen */
function geraet(ua: string) {
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'anderes'
  const br = /CriOS|Chrome/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser'
  return `${os}, ${br}`
}

export default function BetriebSeite() {
  const [d, setD] = useState<Betriebsdaten | null>(null)
  const [fehler, setFehler] = useState('')
  const [offen, setOffen] = useState<number | null>(null)
  useEffect(() => { kontoApi<Betriebsdaten>('/api/betrieb').then(setD).catch((e) => setFehler(e.message)) }, [])

  return (
    <div className="seite">
      <button className="rund-knopf" onClick={() => zurueck('/info')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 40, marginTop: 8 }}>Betrieb</h1>
      {fehler && <p className="klein" style={{ color: 'var(--warn)' }}>{fehler}</p>}
      {!d && !fehler && <p className="hinweis">Lädt …</p>}
      {d && (
        <>
          <p className="sehr-klein">Heute: {d.kontingent.anmeldemails} von {d.kontingent.anmeldemailsMax} Anmeldemails, {d.kontingent.rueckmeldungen} von {d.kontingent.rueckmeldungenMax} Rückmeldungen (je 24 Stunden).</p>

          <div className="tafelkopf" style={{ marginTop: 18 }}><span>Fehler, 7 Tage</span><span>{d.fehler.reduce((s, f) => s + f.anzahl, 0)}</span></div>
          {d.fehler.length === 0 && <p className="hinweis">Keine Fehler.</p>}
          {d.fehler.map((f, i) => (
            <div key={i} className="zeile" style={{ display: 'block', cursor: 'pointer' }} onClick={() => setOffen(offen === i ? null : i)}>
              <div className="klein" style={{ color: 'var(--tinte)' }}><b>{f.anzahl}×</b> {f.meldung}</div>
              <div className="sehr-klein">{f.quelle} · {f.art} · zuletzt {zeit(f.zuletzt)} · {f.seiten.join(', ')}</div>
              {offen === i && (
                <div className="sehr-klein" style={{ marginTop: 6 }}>
                  <div>Geräte: {f.geraete.map(geraet).join(' / ') || '–'}</div>
                  <div>App-Stand: {f.versionen.join(', ') || '–'}</div>
                  {f.beispiel?.zusatz && <div>Zusatz: {f.beispiel.zusatz}</div>}
                  {f.beispiel?.ablauf && <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, overflowX: 'auto', background: 'var(--papier-2)', padding: 8, borderRadius: 8 }}>{f.beispiel.ablauf}</pre>}
                </div>
              )}
            </div>
          ))}

          <div className="tafelkopf" style={{ marginTop: 18 }}><span>Ereignisse, 14 Tage</span><span>{d.ereignisse.length}</span></div>
          {d.ereignisse.length === 0 && <p className="hinweis">Keine.</p>}
          {d.ereignisse.map((e, i) => <div key={i} className="sehr-klein" style={{ padding: '4px 0' }}>{zeit(e.zeit)} · {ARTEN[e.art] ?? e.art}</div>)}

          <div className="tafelkopf" style={{ marginTop: 18 }}><span>Konten</span><span>{d.konten.length}</span></div>
          {d.konten.map((k, i) => (
            <div key={i} className="zeile" style={{ display: 'block' }}>
              <div className="klein" style={{ color: 'var(--tinte)' }}>{k.email}</div>
              <div className="sehr-klein">seit {zeit(k.erstellt)} · {k.baeume} Bäume · {k.fotos} Bilder · Verbesserung {k.verbesserung ? 'ja' : 'nein'}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
