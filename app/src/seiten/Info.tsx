import { useState } from 'react'
import { useSortenindex } from '../daten/sorten.ts'
import { useBaeume } from '../daten/baeume.ts'
import { sicherungErstellen, sicherungEinspielen } from '../daten/sicherung.ts'
import { zurueck } from '../ui/router.ts'
import { Zurueck, Pfeil } from '../ui/symbole.tsx'
import { useKonto, aktuelleEinwilligung, einwilligen, kontoLoeschen, zurAnmeldung } from '../daten/konto.ts'
import { abmeldenUndAufraeumen, geraetLeeren, syncStatus, syncHoeren } from '../daten/serverabgleich.ts'
import { einfuehrungZuruecksetzen } from '../ui/Einfuehrung.tsx'
import { istInstalliert } from './Installieren.tsx'
import { useSyncExternalStore } from 'react'

function Konto() {
  const konto = useKonto()
  const sync = useSyncExternalStore(syncHoeren, syncStatus)
  const [meldung, setMeldung] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  if (konto.status !== 'angemeldet') {
    return (
      <div>
        <p className="klein">Ohne Konto kannst du die Sorten ansehen. Für eigene Bäume melde dich mit deiner E-Mail-Adresse an.</p>
        <button className="knopf haupt" onClick={() => zurAnmeldung('/')}>Anmelden</button>
      </div>
    )
  }
  const k = konto.konto
  const verbesserung = !!aktuelleEinwilligung(k, 'verbesserung')?.erteilt
  const tun = async (f: () => Promise<unknown>, ok: string) => {
    setLaeuft(true); setMeldung('')
    try { await f(); setMeldung(ok) } catch (e) { setMeldung((e as Error).message) }
    setLaeuft(false)
  }
  return (
    <div>
      <p className="klein" style={{ marginBottom: 4 }}>Angemeldet als <b>{k.email}</b>.</p>
      <p className="sehr-klein" style={{ marginTop: 0 }}>
        {sync.laeuft ? 'Wird mit dem Server abgeglichen …' : sync.fehler ? `Abgleich gerade nicht möglich (${sync.fehler}). Die App versucht es später erneut.` : sync.zuletzt ? `Zuletzt gesichert: ${new Date(sync.zuletzt).toLocaleString('de-DE')}` : ''}
      </p>
      <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', margin: '12px 0' }}>
        <input type="checkbox" checked={verbesserung} disabled={laeuft} style={{ width: 22, height: 22, marginTop: 3, flex: 'none' }}
          onChange={(e) => tun(() => einwilligen('verbesserung', e.target.checked), e.target.checked ? 'Einwilligung erteilt.' : 'Einwilligung widerrufen.')} />
        <span className="klein">Meine Fotos und Angaben dürfen zur Verbesserung der App verwendet werden (freiwillig, jederzeit widerrufbar). <a href="#/datenschutz">Mehr dazu</a></span>
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button className="knopf" disabled={laeuft} onClick={() => tun(() => abmeldenUndAufraeumen(false), 'Abgemeldet. Die Daten auf diesem Gerät wurden entfernt, im Konto sind sie gesichert.')}>Abmelden</button>
        <button className="knopf leise" disabled={laeuft} onClick={() => tun(() => abmeldenUndAufraeumen(true), 'Auf allen Geräten abgemeldet.')}>Überall abmelden</button>
        <button className="knopf leise" disabled={laeuft} style={{ color: 'var(--siegel)' }} onClick={() => {
          if (!confirm('Konto mit allen Bäumen, Fotos und Einwilligungen endgültig löschen? Das lässt sich nicht rückgängig machen. Lade vorher eine Sicherung herunter, wenn du die Daten behalten willst.')) return
          tun(async () => { await kontoLoeschen(); await geraetLeeren() }, 'Dein Konto und alle Daten wurden gelöscht.')
        }}>Konto löschen</button>
      </div>
      {meldung && <p className="sehr-klein">{meldung}</p>}
    </div>
  )
}

function Verweis({ ziel, children }: { ziel: string; children: React.ReactNode }) {
  return <a className="zeile" href={`#${ziel}`} style={{ padding: '12px 0' }}><span className="grow">{children}</span><Pfeil style={{ width: 18, height: 18, color: 'var(--bleistift)' }} /></a>
}

function Sicherung() {
  const { baeume } = useBaeume()
  const [meldung, setMeldung] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      <button className="knopf" disabled={laeuft} onClick={async () => {
        setLaeuft(true); setMeldung('Sicherung wird erstellt …')
        try {
          const blob = await sicherungErstellen(baeume)
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `apfelwiese-sicherung-${new Date().toISOString().slice(0, 10)}.json`
          a.click()
          setTimeout(() => URL.revokeObjectURL(a.href), 10000)
          setMeldung(`${baeume.length} Bäume gesichert (${(blob.size / 1e6).toFixed(1)} MB).`)
        } catch (e) { setMeldung(`Sicherung fehlgeschlagen: ${e instanceof Error ? e.message : e}`) }
        setLaeuft(false)
      }}>Sicherung herunterladen</button>
      <label className="knopf leise" style={{ cursor: 'pointer' }}>
        Sicherung einspielen
        <input type="file" accept="application/json,.json" hidden onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setLaeuft(true); setMeldung('Wird eingespielt …')
          try { setMeldung(`${await sicherungEinspielen(f)} Bäume eingespielt.`) } catch (err) { setMeldung(err instanceof Error ? err.message : String(err)) }
          setLaeuft(false)
        }} />
      </label>
      {meldung && <p className="sehr-klein" style={{ width: '100%', margin: 0 }}>{meldung}</p>}
    </div>
  )
}

export default function InfoSeite() {
  const index = useSortenindex()
  const konto = useKonto()
  return (
    <div className="seite">
      <button className="rund-knopf" onClick={() => zurueck('/')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 46, marginTop: 8 }}>Apfelwiese</h1>
      <p className="kursiv klein" style={{ marginTop: 0 }}>Alte Apfelsorten bestimmen und dokumentieren. Prototyp, Stand {index?.stand || 'Oktober 2026'}.</p>
      <hr className="doppellinie" />

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>So funktioniert es</h2>
      <p>Pro Baum schneidest du vier typische Äpfel auf und fotografierst sie auf einem weißen A4-Blatt: vier Fotos, jedes zeigt andere Merkmale. Das Blatt dient als Maßstab und für den Weißabgleich. Die App erkennt das Blatt, misst Größe und Farben per Programm und baut daraus ein 3D-Modell deines Apfels.</p>
      <p>Die Bestimmung ist ein Vorschlag. Erst eine Bestätigung durch eine Pomologin, einen Pomologen oder eine DNA-Analyse macht sie sicher. Vorschläge der App fließen nie als Referenz in die Sortendatenbank zurück.</p>

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Dein Konto</h2>
      <Konto />

      <h2 className="kapitaelchen" style={{ fontSize: 17, marginTop: 20 }}>Deine Daten als Datei</h2>
      <p className="klein">Mit Konto liegen Bäume und Fotos auf dem Server in Frankfurt und auf diesem Gerät. Zusätzlich kannst du alles als Datei sichern und wieder einspielen.</p>
      {konto.status === 'angemeldet' ? <Sicherung /> : <p className="sehr-klein">Nach der Anmeldung verfügbar.</p>}

      <div style={{ marginTop: 20 }}>
        {!istInstalliert() && <Verweis ziel="/installieren">Auf den Home-Bildschirm legen</Verweis>}
        <Verweis ziel="/rueckmeldung">Rückmeldung geben</Verweis>
        {konto.status === 'angemeldet' && konto.konto.betreiber && <Verweis ziel="/betrieb">Betrieb: Konten, Fehler, Ereignisse</Verweis>}
        <a className="zeile" href="#/" onClick={() => { einfuehrungZuruecksetzen(); setTimeout(() => location.reload(), 50) }} style={{ padding: '12px 0' }}><span className="grow">Einführung noch einmal ansehen</span><Pfeil style={{ width: 18, height: 18, color: 'var(--bleistift)' }} /></a>
        <Verweis ziel="/impressum">Impressum</Verweis>
        <Verweis ziel="/datenschutz">Datenschutz</Verweis>
        <Verweis ziel="/nutzung">Nutzungsbedingungen</Verweis>
      </div>

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Sortendatenbank</h2>
      <p>{index?.anzahl ? `${index.anzahl} Sorten.` : 'Im Aufbau.'} Jeder Wert trägt seine Quelle. Die 3D-Modelle der Sorten sind aus den belegten Merkmalen berechnet und, wo ein frei lizenziertes Referenzbild vorliegt, mit dort gemessenen Farben abgeglichen.</p>
      {index && index.quellen.length > 0 && (
        <ul style={{ paddingLeft: 20 }}>
          {index.quellen.map((q) => (
            <li key={q.id} className="klein" style={{ marginBottom: 6 }}>
              {q.autor ? `${q.autor}: ` : ''}<i>{q.werk}</i>{q.jahr ? ` (${q.jahr})` : ''}. {q.lizenz}.{' '}
              {q.url && <a href={q.url} target="_blank" rel="noreferrer">Link</a>}
            </li>
          ))}
        </ul>
      )}

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Karte</h2>
      <p className="klein">Kartendaten © OpenStreetMap-Mitwirkende (ODbL), Ortssuche mit Nominatim. Luftbild: Esri World Imagery (Esri, Vantor, Earthstar Geographics, GIS User Community).</p>

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Schriften</h2>
      <p className="klein">EB Garamond (Georg Duffner, Octavio Pardo) und Pinyon Script (Nicole Fally), beide SIL Open Font License.</p>
    </div>
  )
}
