import { useEffect, useRef, useState } from 'react'
import { useKonto, codeAnfordern, bestaetigen, einwilligen, aktuelleEinwilligung, bereit, zielNachAnmeldung, eigeneAnfrage, kontoApi } from '../daten/konto.ts'
import { gehe, zurueck } from '../ui/router.ts'
import { Zurueck } from '../ui/symbole.tsx'

// Anmeldung ohne Passwort: E-Mail eingeben, Code aus der E-Mail eintippen (oder den Link öffnen).
// Danach einmalig den Nutzungsbedingungen zustimmen; die Verbesserungsnutzung ist freiwillig.

function weiter() {
  gehe(zielNachAnmeldung(), true)
}

export default function AnmeldenSeite() {
  const konto = useKonto()
  const [email, setEmail] = useState('')
  const [anfrage, setAnfrage] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [fehler, setFehler] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const linkGeprueft = useRef(false)
  const [fremderLink, setFremderLink] = useState<{ a: string; t: string; email: string } | null>(null)

  // Anmeldelink aus der E-Mail: #/anmelden?a=…&t=…
  useEffect(() => {
    if (linkGeprueft.current) return
    linkGeprueft.current = true
    const p = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
    const a = p.get('a'), t = p.get('t')
    if (!a || !t) return
    window.history.replaceState(null, '', '#/anmelden') // Token nicht in der Adresszeile lassen
    setLaeuft(true)
    if (eigeneAnfrage(a)) {
      bestaetigen(a, { token: t }).catch((e) => setFehler(e.message)).finally(() => setLaeuft(false))
      return
    }
    // Link wurde auf einem anderen Gerät angefordert (oder von jemand anderem geschickt): erst nachfragen
    kontoApi<{ email: string }>(`/api/anfrage?id=${encodeURIComponent(a)}`)
      .then((d) => setFremderLink({ a, t, email: d.email }))
      .catch((e) => setFehler(e.message))
      .finally(() => setLaeuft(false))
  }, [])

  useEffect(() => { if (bereit(konto)) weiter() }, [konto])

  if (konto.status === 'angemeldet' && !aktuelleEinwilligung(konto.konto, 'nutzung')?.erteilt) return <Zustimmung />

  const anfordern = async (e: React.FormEvent) => {
    e.preventDefault()
    setFehler(''); setLaeuft(true)
    try { setAnfrage(await codeAnfordern(email.trim())); setCode('') } catch (err) { setFehler((err as Error).message) }
    setLaeuft(false)
  }
  const pruefen = async (wert: string) => {
    if (!anfrage || wert.length !== 6) return
    setFehler(''); setLaeuft(true)
    try { await bestaetigen(anfrage, { code: wert }) } catch (err) { setFehler((err as Error).message); setCode('') }
    setLaeuft(false)
  }

  if (fremderLink) {
    return (
      <div className="seite">
        <h1 className="name" style={{ fontSize: 40 }}>Anmelden?</h1>
        <p>Mit diesem Link meldest du dich als <b>{fremderLink.email}</b> an.</p>
        <p className="klein">Fahre nur fort, wenn das deine Adresse ist und du die Anmeldung selbst angefordert hast. Hat dir jemand diesen Link geschickt, brich ab.</p>
        {fehler && <p className="klein" style={{ color: 'var(--warn)' }}>{fehler}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="knopf leise" style={{ flex: 1 }} onClick={() => { setFremderLink(null); gehe('/', true) }}>Abbrechen</button>
          <button className="knopf haupt" style={{ flex: 1 }} disabled={laeuft} onClick={() => {
            setLaeuft(true)
            bestaetigen(fremderLink.a, { token: fremderLink.t }).catch((e) => setFehler(e.message)).finally(() => setLaeuft(false))
          }}>Anmelden</button>
        </div>
      </div>
    )
  }

  return (
    <div className="seite">
      <button className="rund-knopf" onClick={() => zurueck('/')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 44, marginTop: 8 }}>Anmelden</h1>
      <p className="klein">Mit deinem Konto liegen deine Bäume und Fotos sicher auf dem Server und sind auf jedem deiner Geräte da. Ein Passwort brauchst du nicht: Wir schicken dir einen Code per E-Mail.</p>

      {!anfrage ? (
        <form onSubmit={anfordern}>
          <label className="feld"><span>E-Mail-Adresse</span>
            <input className="eingabe" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" />
          </label>
          <button className="knopf haupt" type="submit" disabled={laeuft || !email.includes('@')} style={{ width: '100%' }}>{laeuft ? 'Wird verschickt …' : 'Code per E-Mail schicken'}</button>
        </form>
      ) : (
        <div>
          <p>Wir haben einen sechsstelligen Code an <b>{email}</b> geschickt. Er gilt 15 Minuten.</p>
          <label className="feld"><span>Code aus der E-Mail</span>
            <input className="eingabe" style={{ fontSize: 28, letterSpacing: 8, textAlign: 'center' }} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus
              onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(v); if (v.length === 6) pruefen(v) }} />
          </label>
          <button className="knopf haupt" disabled={laeuft || code.length !== 6} onClick={() => pruefen(code)} style={{ width: '100%' }}>{laeuft ? 'Wird geprüft …' : 'Anmelden'}</button>
          <p className="sehr-klein">Keine E-Mail bekommen? Schau im Spam-Ordner nach oder <button className="knopf leise" style={{ minHeight: 0, padding: '0 4px', fontSize: 13, border: 'none' }} onClick={() => { setAnfrage(null); setCode('') }}>fordere einen neuen Code an</button>.</p>
          <p className="sehr-klein">Auf dem iPhone mit der App auf dem Home-Bildschirm: Gib den Code hier ein. Der Link in der E-Mail öffnet sich im Browser und meldet nur dort an.</p>
        </div>
      )}
      {laeuft && !anfrage && !email && <p className="hinweis">Anmeldung wird geprüft …</p>}
      {fehler && <p className="klein" style={{ color: 'var(--warn)' }}>{fehler}</p>}
      <hr className="haarlinie" />
      <p className="sehr-klein"><a href="#/datenschutz">Datenschutzhinweise</a> · <a href="#/impressum">Impressum</a></p>
    </div>
  )
}

function Zustimmung() {
  const [nutzung, setNutzung] = useState(false)
  const [verbesserung, setVerbesserung] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  const absenden = async () => {
    setLaeuft(true); setFehler('')
    try {
      await einwilligen('verbesserung', verbesserung)
      await einwilligen('nutzung', true)
    } catch (e) { setFehler((e as Error).message) }
    setLaeuft(false)
  }
  return (
    <div className="seite">
      <h1 className="name" style={{ fontSize: 40 }}>Bevor es losgeht</h1>
      <p>Deine Bäume, Fotos, Standorte und Angaben werden in deinem Konto auf einem Server in Frankfurt am Main gespeichert, damit du sie nicht verlierst und auf mehreren Geräten nutzen kannst. Nur du hast darauf Zugriff. Du kannst dein Konto mit allen Daten jederzeit unter „Über die App“ löschen.</p>
      <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', margin: '16px 0' }}>
        <input type="checkbox" checked={nutzung} onChange={(e) => setNutzung(e.target.checked)} style={{ width: 22, height: 22, marginTop: 3, flex: 'none' }} />
        <span>Ich habe die <a href="#/nutzung">Nutzungsbedingungen</a> und die <a href="#/datenschutz">Datenschutzhinweise</a> gelesen und bin mit der Speicherung meiner Daten in meinem Konto einverstanden. <i>(erforderlich)</i></span>
      </label>
      <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', margin: '16px 0' }}>
        <input type="checkbox" checked={verbesserung} onChange={(e) => setVerbesserung(e.target.checked)} style={{ width: 22, height: 22, marginTop: 3, flex: 'none' }} />
        <span>Meine Fotos und Angaben dürfen zusätzlich verwendet werden, um die App zu verbessern, etwa um die Blatterkennung, die Messung und den Sortenvorschlag zu testen und weiterzuentwickeln. Sie werden dafür nicht veröffentlicht. <i>(freiwillig, jederzeit widerrufbar)</i></span>
      </label>
      <p className="sehr-klein">Die Bestimmung funktioniert auch ohne das zweite Häkchen. Du kannst diese Einwilligung jederzeit unter „Über die App“ ändern.</p>
      {fehler && <p className="klein" style={{ color: 'var(--warn)' }}>{fehler}</p>}
      <button className="knopf haupt" style={{ width: '100%' }} disabled={!nutzung || laeuft} onClick={absenden}>{laeuft ? 'Wird gespeichert …' : 'Weiter'}</button>
    </div>
  )
}
