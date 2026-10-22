import { useEffect, useMemo, useState } from 'react'
import { ApfelBuehne } from '../apfel3d/Buehne.tsx'
import { useBaeume, aktualisiereBaum, loescheBaum, ladeFoto, VERTRAUEN, type Baum, type Vertrauen } from '../daten/baeume.ts'
import { useSortenindex, normalisiere } from '../daten/sorten.ts'
import { modellFuerBaum } from '../daten/baumModell.ts'
import { MERKMALE, MERKMAL_NACH_ID, auspraegungLabel } from '../daten/merkmalskatalog.ts'
import { zurueck, gehe } from '../ui/router.ts'
import { Zurueck, Kamera, Ort, Muell, Pfeil } from '../ui/symbole.tsx'
import { Sortenname } from '../ui/Sortenname.tsx'
import { Leuchtkasten } from '../ui/Leuchtkasten.tsx'
import { MerkmalChips } from '../ui/MerkmalChips.tsx'
import { gleicheAb } from '../daten/abgleich.ts'
import { KandidatZeile } from './Bestimmen.tsx'
import { Schnittansicht } from '../apfel3d/Schnitt.tsx'

export default function BaumSeite({ id }: { id: string }) {
  const { baeume, geladen } = useBaeume()
  const baum = baeume.find((b) => b.id === id)
  const index = useSortenindex()
  const modell = useMemo(() => (baum ? modellFuerBaum(baum, index) : null), [baum, index])
  const [schnitt, setSchnitt] = useState(false)

  if (!geladen) return <div className="seite" />
  if (!baum || !modell) return <div className="seite"><p className="hinweis">Diesen Baum gibt es nicht mehr.</p><a href="#/">Zu meinen Äpfeln</a></div>

  const aendern = (teil: Partial<Baum>) => aktualisiereBaum(baum.id, (b) => ({ ...b, ...teil }))
  const herkunft = { messung: '3D-Modell aus den Messwerten dieses Baums', sorte: 'Typischer Apfel der Sorte, noch nicht aus deinen Fotos gemessen', keine: 'Noch nicht vermessen' }[modell.herkunft]

  return (
    <div className="seite" style={{ paddingTop: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, paddingTop: 'var(--oben)', display: 'flex', justifyContent: 'space-between' }}>
        <button className="rund-knopf" onClick={() => zurueck('/')} aria-label="Zurück"><Zurueck /></button>
        <div className="chips" style={{ background: 'color-mix(in srgb, var(--papier) 80%, transparent)', borderRadius: 999, padding: 2 }}>
          <button className={`chip ${!schnitt ? 'an' : ''}`} onClick={() => setSchnitt(false)}>Ganz</button>
          <button className={`chip ${schnitt ? 'an' : ''}`} onClick={() => setSchnitt(true)}>Aufgeschnitten</button>
        </div>
      </div>
      <div style={{ position: 'relative', height: 300, margin: '-44px -16px 0' }}>
        {schnitt ? <Schnittansicht p={modell.p} className="buehne" /> : <ApfelBuehne aepfel={[modell.p]} className="buehne" />}
      </div>
      <div style={{ textAlign: 'center' }}>
        <Sortenname baum={baum} groesse={46} />
        <div className="klein kursiv">{VERTRAUEN[baum.bestimmung.status].label} · {baum.name}</div>
        <div className="sehr-klein" style={{ marginTop: 4 }}>{herkunft}</div>
      </div>
      <hr className="doppellinie" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {baum.fotosaetze.length > 0 && <a className="knopf" href={`#/baum/${baum.id}/angleichen`}>Modell mit dem Foto angleichen <Pfeil /></a>}
        <a className="knopf leise" href={`#/baum/${baum.id}/merkmale`}>Merkmale am eigenen Apfel ansehen <Pfeil /></a>
      </div>

      <BestimmungAbschnitt baum={baum} aendern={aendern} />
      <FotoAbschnitt baum={baum} />
      <MessAbschnitt baum={baum} />
      <AngabenAbschnitt baum={baum} aendern={aendern} />
      <OrtAbschnitt baum={baum} aendern={aendern} />

      <hr className="haarlinie" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button className="knopf" onClick={() => gehe(`/neu/${baum.id}`)}><Kamera /> Weitere vier Fotos</button>
        <button className="knopf leise" onClick={async () => {
          if (confirm(`„${baum.name}“ mit allen Fotos löschen? Er wird auch aus deinem Konto entfernt.`)) { await loescheBaum(baum.id); gehe('/', true) }
        }}><Muell /> Baum löschen</button>
      </div>
    </div>
  )
}

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h2 className="kapitaelchen" style={{ fontSize: 17, color: 'var(--tinte-2)', marginBottom: 6 }}>{titel}</h2>
      {children}
    </section>
  )
}

// ------------------------------------------------------------------ Bestimmung

function BestimmungAbschnitt({ baum, aendern }: { baum: Baum; aendern: (t: Partial<Baum>) => void }) {
  const [waehlen, setWaehlen] = useState(false)
  const b = baum.bestimmung
  const setzeStatus = (status: Vertrauen, von?: string) =>
    aendern({ bestimmung: { ...b, status, von, datum: new Date().toISOString().slice(0, 10), anmerkung: undefined } })
  return (
    <Abschnitt titel="Bestimmung">
      {b.sorteId ? (
        <p style={{ margin: '0 0 8px' }}>
          <a href={`#/sorte/${b.sorteId}`}>{b.sorteName}</a> – {VERTRAUEN[b.status].label}
          {b.von ? ` (${b.von})` : ''}{b.datum ? `, ${new Date(b.datum).toLocaleDateString('de-DE')}` : ''}.
        </p>
      ) : (
        <p className="hinweis" style={{ margin: '0 0 8px' }}>Noch keine Sorte zugeordnet.</p>
      )}
      {b.anmerkung && <p className="klein" style={{ marginTop: 0 }}>{b.anmerkung}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button className="chip" onClick={() => setWaehlen(!waehlen)}>{b.sorteId ? 'Andere Sorte' : 'Sorte zuordnen'}</button>
        {b.sorteId && b.status !== 'pomologe' && (
          <button className="chip" onClick={() => {
            const von = prompt('Name des Pomologen oder der Pomologin, der oder die die Sorte bestätigt hat:')
            if (von) setzeStatus('pomologe', von)
          }}>Vom Pomologen bestätigt</button>
        )}
        {b.sorteId && b.status !== 'dna' && (
          <button className="chip" onClick={() => {
            const von = prompt('Labor oder Untersuchung (z. B. SSR-Analyse, Jahr):')
            if (von) setzeStatus('dna', von)
          }}>Per DNA bestätigt</button>
        )}
        {b.sorteId && (
          <button className="chip" onClick={() => aendern({ bestimmung: { status: 'unbestimmt' } })}>Zurücksetzen</button>
        )}
      </div>
      <AbgleichAnzeige baum={baum} aendern={aendern} />
      {waehlen && <SortenAuswahl onWahl={(id, name) => { aendern({ bestimmung: { status: 'nutzer', sorteId: id, sorteName: name, datum: new Date().toISOString().slice(0, 10) } }); setWaehlen(false) }} />}
    </Abschnitt>
  )
}

function AbgleichAnzeige({ baum, aendern }: { baum: Baum; aendern: (t: Partial<Baum>) => void }) {
  const index = useSortenindex()
  const eigen = useMemo(() => modellFuerBaum(baum, index).p, [baum, index])
  const [offen, setOffen] = useState(false)
  const satz = [...baum.fotosaetze].sort((a, b) => b.datum.localeCompare(a.datum))[0]
  const werte = useMemo(() => [...baum.angaben, ...(satz?.messung?.werte ?? [])], [baum.angaben, satz])
  const kandidaten = useMemo(() => (offen && index ? gleicheAb(werte, index.sorten, 6) : []), [offen, index, werte])
  if (!werte.length) return null
  return (
    <div style={{ marginTop: 10 }}>
      <button className="chip" onClick={() => setOffen(!offen)}>{offen ? 'Abgleich ausblenden' : 'Vorläufigen Abgleich anzeigen'}</button>
      {offen && (
        <div style={{ marginTop: 8 }}>
          <p className="sehr-klein" style={{ margin: '0 0 4px' }}>
            Aus {werte.length} Werten (Messung und deine Angaben, auch aus dem Merkmals-Rundgang). Je mehr Schnittmerkmale du im Rundgang einträgst, desto schärfer wird der Abgleich.
          </p>
          {kandidaten.map((k) => (
            <KandidatZeile key={k.sorte.id} k={k} gesperrt={false} eigen={eigen} onWahl={() => {
              const b = baum.bestimmung
              if (b.status !== 'unbestimmt' && b.status !== 'vorschlag' &&
                !confirm(`Die bisherige Bestimmung „${b.sorteName}“ (${VERTRAUEN[b.status].label}) durch den App-Vorschlag „${k.sorte.name}“ ersetzen?`)) return
              aendern({
                bestimmung: {
                  status: 'vorschlag', sorteId: k.sorte.id, sorteName: k.sorte.name, datum: new Date().toISOString().slice(0, 10),
                  anmerkung: `Vorläufiger Abgleich: ${Math.round(k.punkte * 100)} % Übereinstimmung in ${k.verglichen} Merkmalen. Nicht bestätigt.`,
                },
              })
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function SortenAuswahl({ onWahl }: { onWahl: (id: string, name: string) => void }) {
  const index = useSortenindex()
  const [q, setQ] = useState('')
  const treffer = useMemo(() => {
    const n = normalisiere(q)
    if (!index || n.length < 2) return []
    return index.sorten.filter((s) => normalisiere(s.name).includes(n) || s.synonyme.some((x) => normalisiere(x).includes(n))).slice(0, 12)
  }, [index, q])
  return (
    <div className="karte-papier" style={{ marginTop: 10 }}>
      <input className="eingabe" placeholder="Sortenname eingeben" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {treffer.map((s) => (
        <button key={s.id} className="zeile" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => onWahl(s.id, s.name)}>
          <span className="grow name" style={{ fontSize: 24 }}>{s.name}</span>
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------ Fotos

const FOTOTITEL = ['Foto 1 · Längshälften', 'Foto 2 · Längsscheiben', 'Foto 3 · Querhälften und Kerne', 'Foto 4 · Querscheiben']

function FotoAbschnitt({ baum }: { baum: Baum }) {
  const saetze = [...baum.fotosaetze].sort((a, b) => b.datum.localeCompare(a.datum))
  if (!saetze.length) return null
  return (
    <Abschnitt titel="Fotos">
      {saetze.map((s) => <Fotosatz key={s.id} satz={s} />)}
    </Abschnitt>
  )
}

function Fotosatz({ satz }: { satz: Baum['fotosaetze'][number] }) {
  // Angezeigt wird das entzerrte, weißabgeglichene Blatt; ältere Sätze ohne Blatt zeigen die Freistellung
  const k = [0, 1, 2, 3].map((i) => satz.blatt?.[i] ?? satz.vorschau?.[i] ?? satz.fotos[i] ?? null)
  const urls = [useBlobUrl(k[0]), useBlobUrl(k[1]), useBlobUrl(k[2]), useBlobUrl(k[3])]
  const [offen, setOffen] = useState<number | null>(null)
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="sehr-klein">{new Date(satz.datum).toLocaleDateString('de-DE')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 4 }}>
        {urls.map((u, i) => (
          <button key={i} onClick={() => u && setOffen(i)} aria-label={FOTOTITEL[i]}
            style={{ aspectRatio: '210 / 297', padding: 0, background: 'var(--papier-3)', borderRadius: 3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--linie)', boxShadow: '0 2px 6px -3px rgba(60,40,20,.35)' }}>
            {u ? <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span className="sehr-klein">{i + 1}</span>}
          </button>
        ))}
      </div>
      {offen !== null && <Leuchtkasten bilder={urls} start={offen} titel={(i) => FOTOTITEL[i]} onSchliessen={() => setOffen(null)} />}
    </div>
  )
}

export function useBlobUrl(k: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!k) { setUrl(null); return }
    let u: string | null = null
    let aktiv = true
    ladeFoto(k).then((b) => { if (b && aktiv) { u = URL.createObjectURL(b); setUrl(u) } })
    return () => { aktiv = false; if (u) URL.revokeObjectURL(u) }
  }, [k])
  return url
}

// ------------------------------------------------------------------ Messung

function MessAbschnitt({ baum }: { baum: Baum }) {
  const s = [...baum.fotosaetze].sort((a, b) => b.datum.localeCompare(a.datum))[0]
  const m = s?.messung
  if (!m) return null
  return (
    <Abschnitt titel="Gemessen">
      {m.werte.map((w, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '0.5px dotted var(--linie)' }}>
          <span style={{ flex: '0 0 50%', color: 'var(--tinte-2)' }}>{MERKMAL_NACH_ID[w.merkmal]?.name ?? w.merkmal}</span>
          <span>{auspraegungLabel(w.merkmal, w.wert)}</span>
        </div>
      ))}
      {m.objekte.length > 0 && (
        <p className="klein">Einzelmaße (Breite × Höhe): {m.objekte.map((o) => `${Math.round(o.breiteMm)} × ${Math.round(o.hoeheMm)} mm`).join('; ')}</p>
      )}
      {(m.farben.grundfarbe || m.farben.deckfarbe) && (
        <p className="klein" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {m.farben.grundfarbe && <><Farbfeld f={m.farben.grundfarbe} /> Grundfarbe</>}
          {m.farben.deckfarbe && <><Farbfeld f={m.farben.deckfarbe} /> Deckfarbe {m.farben.deckfarbeAnteil !== undefined ? `(${Math.round(m.farben.deckfarbeAnteil * 100)} %)` : ''}</>}
        </p>
      )}
      {m.hinweise.map((h, i) => <p key={i} className="sehr-klein kursiv" style={{ margin: '4px 0' }}>{h}</p>)}
    </Abschnitt>
  )
}

const Farbfeld = ({ f }: { f: string }) => <span style={{ width: 18, height: 18, borderRadius: '50%', background: f, border: '0.5px solid var(--linie-stark)', display: 'inline-block' }} />

// ------------------------------------------------------------------ Eigene Angaben (aus dem Katalog: erfassung = abfrage)

function AngabenAbschnitt({ baum, aendern }: { baum: Baum; aendern: (t: Partial<Baum>) => void }) {
  const fragen = MERKMALE.filter((m) => m.erfassung === 'abfrage' && m.auspraegungen)
  const werte = (id: string) => baum.angaben.filter((a) => a.merkmal === id).map((a) => String(a.wert))
  const setze = (id: string, w: string[]) => aktualisiereBaum(baum.id, (b) => ({
    ...b, angaben: [...b.angaben.filter((a) => a.merkmal !== id), ...w.map((wert) => ({ merkmal: id, wert }))],
  }))
  const pflueck = werte('pflueckreife')[0]
  return (
    <Abschnitt titel="Deine Angaben">
      <p className="sehr-klein" style={{ marginTop: 0 }}>Was die Fotos nicht zeigen. Hilft beim Abgleich mit den Sorten.</p>
      {fragen.map((m) => (
        <div key={m.id} style={{ margin: '10px 0' }}>
          <div className="klein" style={{ marginBottom: 5 }}>{m.name}{m.mehrfach ? ' (mehrere möglich)' : ''}</div>
          <MerkmalChips merkmal={m.id} werte={werte(m.id)} onChange={(w) => setze(m.id, w)}
            abMonat={m.id.startsWith('genussreife') ? (m.id === 'genussreife_ende' ? werte('genussreife_beginn')[0] ?? pflueck : pflueck) : undefined} />
        </div>
      ))}
      <label className="feld">
        <span>Notizen</span>
        <textarea className="eingabe" defaultValue={baum.notizen} onBlur={(e) => e.target.value !== (baum.notizen ?? '') && aendern({ notizen: e.target.value })} placeholder="Alter des Baums, Herkunft der Sorte, Erinnerungen …" />
      </label>
    </Abschnitt>
  )
}

// ------------------------------------------------------------------ Standort

function OrtAbschnitt({ baum, aendern }: { baum: Baum; aendern: (t: Partial<Baum>) => void }) {
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  return (
    <Abschnitt titel="Standort">
      <label className="feld" style={{ marginTop: 0 }}>
        <span>Bezeichnung des Baums</span>
        <input className="eingabe" defaultValue={baum.name} onBlur={(e) => e.target.value.trim() && e.target.value !== baum.name && aendern({ name: e.target.value.trim() })} />
      </label>
      <label className="feld">
        <span>Ort</span>
        <input className="eingabe" defaultValue={baum.ort} placeholder="z. B. Obstwiese am Deich" onBlur={(e) => e.target.value !== (baum.ort ?? '') && aendern({ ort: e.target.value })} />
      </label>
      {baum.standort ? (
        <p className="klein">Koordinaten gespeichert ({baum.standort.lat.toFixed(4)}, {baum.standort.lng.toFixed(4)}). <a href={`#/wiese?baum=${baum.id}`}>Auf der Wiese zeigen</a></p>
      ) : (
        <p className="sehr-klein">Noch kein Standort. Er wird in deinem Konto gespeichert und nur dir angezeigt; auf der Wiese kannst du den Baum auch von Hand platzieren.</p>
      )}
      <button className="knopf" disabled={laeuft} onClick={() => {
        setLaeuft(true); setFehler('')
        navigator.geolocation.getCurrentPosition(
          (pos) => { aendern({ standort: { lat: pos.coords.latitude, lng: pos.coords.longitude, genauigkeit: pos.coords.accuracy } }); setLaeuft(false) },
          () => { setFehler('Standort nicht verfügbar. Erlaube den Zugriff oder versuch es draußen noch einmal.'); setLaeuft(false) },
          { enableHighAccuracy: true, timeout: 15000 },
        )
      }}><Ort /> {laeuft ? 'Suche Standort …' : baum.standort ? 'Standort neu bestimmen' : 'Aktuellen Standort übernehmen'}</button>
      {fehler && <p className="sehr-klein" style={{ color: 'var(--warn)' }}>{fehler}</p>}
    </Abschnitt>
  )
}
