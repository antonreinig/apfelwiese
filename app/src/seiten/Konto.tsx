import { useState, useSyncExternalStore } from 'react'
import { useBaeume } from '../daten/baeume.ts'
import { sicherungErstellen, sicherungEinspielen } from '../daten/sicherung.ts'
import { zurueck } from '../ui/router.ts'
import { Zurueck, Pfeil, Person } from '../ui/symbole.tsx'
import { useKonto, aktuelleEinwilligung, einwilligen, kontoLoeschen, zurAnmeldung, type KontoDaten } from '../daten/konto.ts'
import { abmeldenUndAufraeumen, geraetLeeren, syncStatus, syncHoeren } from '../daten/serverabgleich.ts'
import { einfuehrungZuruecksetzen } from '../ui/Einfuehrung.tsx'
import { useEinstellungen, setzeRegion, setzeDarstellung, BUNDESLAENDER, type Darstellung } from '../daten/einstellungen.ts'
import { istInstalliert } from './Installieren.tsx'

// Konto und Einstellungen: alles, was den Nutzer und dieses Gerät betrifft.
// „Über die App“ (Info.tsx) erklärt die App, Quellen und Rechtliches.

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 className="kapitaelchen" style={{ fontSize: 17, marginBottom: 8 }}>{titel}</h2>
      {children}
    </section>
  )
}

function Verweis({ ziel, children, onClick }: { ziel: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <a className="zeile" href={`#${ziel}`} onClick={onClick} style={{ padding: '12px 0' }}>
      <span className="grow">{children}</span>
      <Pfeil style={{ width: 18, height: 18, color: 'var(--bleistift)' }} />
    </a>
  )
}

function Kontokarte({ k }: { k: KontoDaten }) {
  const sync = useSyncExternalStore(syncHoeren, syncStatus)
  const { baeume } = useBaeume()
  const seit = new Date(k.erstellt)
  return (
    <div className="karte-papier" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <div aria-hidden style={{
        width: 54, height: 54, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--blatt)', color: 'var(--papier)', fontSize: 26, fontFamily: 'var(--schrift)',
      }}>{k.email.slice(0, 1).toUpperCase()}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.email}</div>
        <div className="sehr-klein">
          {baeume.length === 1 ? '1 Baum' : `${baeume.length} Bäume`}
          {isNaN(seit.getTime()) ? '' : ` · dabei seit ${seit.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`}
        </div>
        <div className="sehr-klein" style={{ color: sync.fehler ? 'var(--warn)' : undefined }}>
          {sync.laeuft ? 'Wird mit dem Server abgeglichen …' : sync.fehler ? `Abgleich gerade nicht möglich (${sync.fehler}). Die App versucht es später erneut.` : sync.zuletzt ? `Zuletzt gesichert: ${new Date(sync.zuletzt).toLocaleString('de-DE')}` : ''}
        </div>
      </div>
    </div>
  )
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

function Einstellungen() {
  const e = useEinstellungen()
  return (
    <>
      <Abschnitt titel="Deine Region">
        <p className="klein" style={{ marginTop: 0 }}>Im Tab Sorten zeigt die App dann Sorten aus deinem Bundesland und den Nachbarländern. Die Angabe bleibt auf diesem Gerät.</p>
        <select className="eingabe" aria-label="Bundesland" value={e.region ?? ''} onChange={(ev) => setzeRegion(ev.target.value || null)}>
          <option value="">Keine Angabe</option>
          {BUNDESLAENDER.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
      </Abschnitt>
      <Abschnitt titel="Darstellung">
        <div className="chips" role="radiogroup" aria-label="Darstellung">
          {([['system', 'Wie das Gerät'], ['hell', 'Hell'], ['dunkel', 'Dunkel']] as [Darstellung, string][]).map(([d, t]) => (
            <button key={d} role="radio" aria-checked={e.darstellung === d} className={`chip ${e.darstellung === d ? 'an' : ''}`} onClick={() => setzeDarstellung(d)}>{t}</button>
          ))}
        </div>
      </Abschnitt>
    </>
  )
}

export default function KontoSeite() {
  const konto = useKonto()
  const [meldung, setMeldung] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const tun = async (f: () => Promise<unknown>, ok: string) => {
    setLaeuft(true); setMeldung('')
    try { await f(); setMeldung(ok) } catch (e) { setMeldung((e as Error).message) }
    setLaeuft(false)
  }
  const k = konto.status === 'angemeldet' ? konto.konto : null
  const verbesserung = k ? !!aktuelleEinwilligung(k, 'verbesserung')?.erteilt : false

  return (
    <div className="seite">
      <button className="rund-knopf" onClick={() => zurueck('/')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 46, marginTop: 8 }}>Konto</h1>
      <p className="kursiv klein" style={{ marginTop: 0 }}>Anmeldung, Einstellungen und deine Daten.</p>
      <hr className="doppellinie" />

      {konto.status === 'laedt' && <p className="hinweis">Wird geladen …</p>}
      {(konto.status === 'abgemeldet' || konto.status === 'offline') && (
        <div className="karte-papier" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Person style={{ width: 44, height: 44, color: 'var(--bleistift)', flex: 'none' }} />
          <div>
            <p className="klein" style={{ margin: '0 0 8px' }}>
              {konto.status === 'offline'
                ? 'Gerade ist keine Verbindung zum Server möglich.'
                : 'Du bist nicht angemeldet. Die Sorten kannst du so ansehen; für eigene Bäume melde dich mit deiner E-Mail-Adresse an.'}
            </p>
            {konto.status === 'abgemeldet' && <button className="knopf haupt" onClick={() => zurAnmeldung('/konto')}>Anmelden</button>}
          </div>
        </div>
      )}
      {k && <Kontokarte k={k} />}

      <Einstellungen />

      {k && (
        <>
          <Abschnitt titel="Datenschutz">
            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', margin: '0 0 8px' }}>
              <input type="checkbox" checked={verbesserung} disabled={laeuft} style={{ width: 22, height: 22, marginTop: 3, flex: 'none' }}
                onChange={(e) => tun(() => einwilligen('verbesserung', e.target.checked), e.target.checked ? 'Einwilligung erteilt.' : 'Einwilligung widerrufen.')} />
              <span className="klein">Meine Fotos und Angaben dürfen zur Verbesserung der App verwendet werden (freiwillig, jederzeit widerrufbar). <a href="#/datenschutz">Mehr dazu</a></span>
            </label>
          </Abschnitt>

          <Abschnitt titel="Deine Daten als Datei">
            <p className="klein" style={{ marginTop: 0 }}>Bäume und Fotos liegen auf dem Server in Frankfurt und auf diesem Gerät. Zusätzlich kannst du alles als Datei sichern und wieder einspielen.</p>
            <Sicherung />
          </Abschnitt>

          <Abschnitt titel="Abmelden">
            <p className="klein" style={{ marginTop: 0 }}>Beim Abmelden werden die Daten von diesem Gerät entfernt. Im Konto bleiben sie gesichert.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button className="knopf" disabled={laeuft} onClick={() => tun(() => abmeldenUndAufraeumen(false), 'Abgemeldet. Die Daten auf diesem Gerät wurden entfernt, im Konto sind sie gesichert.')}>Abmelden</button>
              <button className="knopf leise" disabled={laeuft} onClick={() => tun(() => abmeldenUndAufraeumen(true), 'Auf allen Geräten abgemeldet.')}>Überall abmelden</button>
            </div>
          </Abschnitt>

          <Abschnitt titel="Konto löschen">
            <p className="klein" style={{ marginTop: 0 }}>Löscht dein Konto mit allen Bäumen, Fotos und Einwilligungen endgültig. Lade vorher eine Sicherung herunter, wenn du die Daten behalten willst.</p>
            <button className="knopf leise" disabled={laeuft} style={{ color: 'var(--siegel)', borderColor: 'var(--siegel)' }} onClick={() => {
              if (!confirm('Konto mit allen Bäumen, Fotos und Einwilligungen endgültig löschen? Das lässt sich nicht rückgängig machen.')) return
              tun(async () => { await kontoLoeschen(); await geraetLeeren() }, 'Dein Konto und alle Daten wurden gelöscht.')
            }}>Konto löschen</button>
          </Abschnitt>
        </>
      )}
      {meldung && <p className="klein" role="status" style={{ marginTop: 14 }}>{meldung}</p>}

      <div style={{ marginTop: 26 }}>
        {!istInstalliert() && <Verweis ziel="/installieren">Auf den Home-Bildschirm legen</Verweis>}
        <Verweis ziel="/" onClick={() => { einfuehrungZuruecksetzen(); setTimeout(() => location.reload(), 50) }}>Einführung noch einmal ansehen</Verweis>
        {k?.betreiber && <Verweis ziel="/betrieb">Betrieb: Konten, Fehler, Ereignisse</Verweis>}
        <Verweis ziel="/info">Über die App</Verweis>
        <Verweis ziel="/datenschutz">Datenschutz</Verweis>
      </div>
    </div>
  )
}
