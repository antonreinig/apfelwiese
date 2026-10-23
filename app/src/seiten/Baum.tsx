import { useEffect, useMemo, useState } from 'react'
import { ApfelBuehne } from '../apfel3d/Buehne.tsx'
import { useBaeume, aktualisiereBaum, loescheBaum, ladeFoto, VERTRAUEN, type Baum } from '../daten/baeume.ts'
import { useSortenindex, normalisiere } from '../daten/sorten.ts'
import { modellFuerBaum } from '../daten/baumModell.ts'
import { MERKMALE, MERKMAL_NACH_ID, auspraegungLabel } from '../daten/merkmalskatalog.ts'
import { gehe } from '../ui/router.ts'
import { Kamera, Ort, Muell, Pfeil } from '../ui/symbole.tsx'
import { Seitenkopf, Abschnitt, Laden, NichtGefunden, Meldung, Wertzeile, Farbfeld } from '../ui/Seite.tsx'
import { datum, datumKurz } from '../ui/format.ts'
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

  if (!geladen) return <Laden />
  if (!baum || !modell) return <NichtGefunden text="Diesen Baum gibt es nicht mehr." />

  const aendern = (teil: Partial<Baum>) => aktualisiereBaum(baum.id, (b) => ({ ...b, ...teil }))
  const herkunft = { messung: '3D-Modell aus den Messwerten dieses Baums', sorte: 'Typischer Apfel der Sorte, noch nicht aus deinen Fotos gemessen', keine: 'Noch nicht vermessen' }[modell.herkunft]

  return (
    <div className="seite" style={{ paddingTop: 0 }}>
      <Seitenkopf rechts={
        <div className="chips" role="radiogroup" aria-label="Ansicht">
          <button role="radio" aria-checked={!schnitt} className={`chip ${!schnitt ? 'an' : ''}`} onClick={() => setSchnitt(false)}>Ganz</button>
          <button role="radio" aria-checked={schnitt} className={`chip ${schnitt ? 'an' : ''}`} onClick={() => setSchnitt(true)}>Aufgeschnitten</button>
        </div>
      } />
      <div style={{ position: 'relative', height: 290, margin: '-6px -16px 0' }}>
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
        <a className="knopf leise" href={`#/baum/${baum.id}/merkmale`}>Merkmals-Rundgang <Pfeil /></a>
      </div>

      <BestimmungAbschnitt baum={baum} aendern={aendern} />
      <FotoAbschnitt baum={baum} />
      <MessAbschnitt baum={baum} />
      <AngabenAbschnitt baum={baum} />
      <BaumAbschnitt baum={baum} aendern={aendern} />
      <OrtAbschnitt baum={baum} aendern={aendern} />

      <hr className="haarlinie" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button className="knopf" onClick={() => gehe(`/neu/${baum.id}`)}><Kamera /> Weitere vier Fotos</button>
        <button className="knopf gefahr" onClick={async () => {
          if (confirm(`„${baum.name}“ mit allen Fotos löschen? Er wird auch aus deinem Konto entfernt.`)) { await loescheBaum(baum.id); gehe('/', true) }
        }}><Muell /> Baum löschen</button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Bestimmung

/** Fragt nach, bevor eine bestätigte Bestimmung (Pomologe, DNA) überschrieben wird */
export function bestimmungErsetzen(alt: Baum['bestimmung'], neu: string) {
  if (alt.status !== 'pomologe' && alt.status !== 'dna') return true
  return confirm(`„${alt.sorteName}“ ist ${VERTRAUEN[alt.status].label}. Wirklich ${neu}?`)
}

function BestimmungAbschnitt({ baum, aendern }: { baum: Baum; aendern: (t: Partial<Baum>) => void }) {
  const [waehlen, setWaehlen] = useState(false)
  const [bestaetigen, setBestaetigen] = useState<'pomologe' | 'dna' | null>(null)
  const [von, setVon] = useState('')
  const b = baum.bestimmung
  const heute = () => new Date().toISOString().slice(0, 10)
  return (
    <Abschnitt titel="Bestimmung">
      {b.sorteId ? (
        <p style={{ margin: '0 0 8px' }}>
          <a href={`#/sorte/${b.sorteId}`}>{b.sorteName}</a> – {VERTRAUEN[b.status].label}
          {b.von ? ` (${b.von})` : ''}{b.datum ? `, ${datum(b.datum)}` : ''}.
        </p>
      ) : (
        <p className="hinweis" style={{ margin: '0 0 8px' }}>Noch keine Sorte zugeordnet.</p>
      )}
      {b.anmerkung && <p className="klein" style={{ marginTop: 0 }}>{b.anmerkung}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button className="knopf klein" onClick={() => setWaehlen(!waehlen)} aria-expanded={waehlen}>{b.sorteId ? 'Andere Sorte' : 'Sorte zuordnen'}</button>
        {b.sorteId && b.status !== 'pomologe' && <button className="knopf klein" onClick={() => { setBestaetigen('pomologe'); setVon('') }}>Pomologisch bestätigt</button>}
        {b.sorteId && b.status !== 'dna' && <button className="knopf klein" onClick={() => { setBestaetigen('dna'); setVon('') }}>Per DNA bestätigt</button>}
      </div>
      {bestaetigen && (
        <form className="karte-papier" style={{ marginTop: 10 }} onSubmit={(e) => {
          e.preventDefault()
          if (!von.trim()) return
          aendern({ bestimmung: { ...b, status: bestaetigen, von: von.trim(), datum: heute(), anmerkung: undefined } })
          setBestaetigen(null)
        }}>
          <label className="feld" style={{ marginTop: 0 }}>
            <span>{bestaetigen === 'pomologe' ? `Wer hat „${b.sorteName}“ bestätigt? Name der Pomologin oder des Pomologen` : `Welche Untersuchung hat „${b.sorteName}“ bestätigt? Labor, Verfahren, Jahr`}</span>
            <input className="eingabe" value={von} onChange={(e) => setVon(e.target.value)} autoFocus placeholder={bestaetigen === 'pomologe' ? 'z. B. Name, Norddeutsche Apfeltage 2026' : 'z. B. SSR-Analyse, JKI, 2026'} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="knopf haupt" type="submit" disabled={!von.trim()}>Speichern</button>
            <button className="knopf leise" type="button" onClick={() => setBestaetigen(null)}>Abbrechen</button>
          </div>
        </form>
      )}
      <AbgleichAnzeige baum={baum} aendern={aendern} />
      {waehlen && <SortenAuswahl onWahl={(id, name) => {
        if (!bestimmungErsetzen(b, `durch deine eigene Bestimmung „${name}“ ersetzen`)) return
        aendern({ bestimmung: { status: 'nutzer', sorteId: id, sorteName: name, datum: heute() } }); setWaehlen(false)
      }} />}
      {b.sorteId && (
        <button className="knopf leise klein" style={{ marginTop: 10, border: 'none', paddingLeft: 0 }} onClick={() => {
          if (bestimmungErsetzen(b, 'zurücksetzen')) aendern({ bestimmung: { status: 'unbestimmt' } })
        }}>Zuordnung zurücksetzen</button>
      )}
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
      <button className="knopf leise klein" onClick={() => setOffen(!offen)} aria-expanded={offen}>{offen ? 'Abgleich ausblenden' : 'Vorläufigen Abgleich anzeigen'}</button>
      {offen && (
        <div style={{ marginTop: 8 }}>
          <p className="sehr-klein" style={{ margin: '0 0 4px' }}>
            Aus {werte.length} Werten (Messung und deine Angaben, auch aus dem Merkmals-Rundgang). Je mehr Schnittmerkmale du im Rundgang einträgst, desto schärfer wird der Abgleich.
          </p>
          {kandidaten.map((k) => (
            <KandidatZeile key={k.sorte.id} k={k} gesperrt={false} eigen={eigen} onWahl={() => {
              const b = baum.bestimmung
              if (b.status === 'nutzer' && !confirm(`Deine eigene Bestimmung „${b.sorteName}“ durch den App-Vorschlag „${k.sorte.name}“ ersetzen?`)) return
              if (!bestimmungErsetzen(b, `durch den App-Vorschlag „${k.sorte.name}“ ersetzen`)) return
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
      <div className="sehr-klein">{datumKurz(satz.datum)}</div>
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
      {m.werte.map((w, i) => <Wertzeile key={i} titel={MERKMAL_NACH_ID[w.merkmal]?.name ?? w.merkmal}>{auspraegungLabel(w.merkmal, w.wert)}</Wertzeile>)}
      {m.objekte.length > 0 && (
        <p className="klein">Einzelmaße (Breite × Höhe): {m.objekte.map((o) => `${Math.round(o.breiteMm)} × ${Math.round(o.hoeheMm)} mm`).join('; ')}</p>
      )}
      {(m.farben.grundfarbe || m.farben.deckfarbe) && (
        <p className="klein" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {m.farben.grundfarbe && <><Farbfeld farbe={m.farben.grundfarbe} /> Grundfarbe</>}
          {m.farben.deckfarbe && <><Farbfeld farbe={m.farben.deckfarbe} /> Deckfarbe {m.farben.deckfarbeAnteil !== undefined ? `(${Math.round(m.farben.deckfarbeAnteil * 100)} %)` : ''}</>}
        </p>
      )}
      {m.hinweise.map((h, i) => <p key={i} className="sehr-klein kursiv" style={{ margin: '4px 0' }}>{h}</p>)}
    </Abschnitt>
  )
}


// ------------------------------------------------------------------ Eigene Angaben (aus dem Katalog: erfassung = abfrage)

// Die häufigsten Angaben zuerst; die übrigen (Duft, Geschmacksnoten, Schale, Baum) aufklappbar
const HAUPTANGABEN = ['pflueckreife', 'genussreife_beginn', 'genussreife_ende', 'geschmack_suesse', 'geschmack_saeure', 'fleisch_festigkeit', 'fleisch_saftigkeit', 'verwendung']

function AngabenAbschnitt({ baum }: { baum: Baum }) {
  const fragen = MERKMALE.filter((m) => m.erfassung === 'abfrage' && m.auspraegungen)
  const werte = (id: string) => baum.angaben.filter((a) => a.merkmal === id).map((a) => String(a.wert))
  const setze = (id: string, w: string[]) => aktualisiereBaum(baum.id, (b) => ({
    ...b, angaben: [...b.angaben.filter((a) => a.merkmal !== id), ...w.map((wert) => ({ merkmal: id, wert }))],
  }))
  const pflueck = werte('pflueckreife')[0]
  const frage = (m: (typeof fragen)[number]) => (
    <div key={m.id} style={{ margin: '10px 0' }}>
      <div className="klein" style={{ marginBottom: 5 }}>{m.name}{m.mehrfach ? ' (mehrere möglich)' : ''}</div>
      <MerkmalChips merkmal={m.id} werte={werte(m.id)} onChange={(w) => setze(m.id, w)}
        abMonat={m.id.startsWith('genussreife') ? (m.id === 'genussreife_ende' ? werte('genussreife_beginn')[0] ?? pflueck : pflueck) : undefined} />
    </div>
  )
  const haupt = HAUPTANGABEN.map((id) => fragen.find((m) => m.id === id)).filter((m): m is (typeof fragen)[number] => !!m)
  const weitere = fragen.filter((m) => !HAUPTANGABEN.includes(m.id))
  const weitereAusgefuellt = weitere.filter((m) => werte(m.id).length).length
  return (
    <Abschnitt titel="Deine Angaben">
      <p className="sehr-klein" style={{ marginTop: 0 }}>Was die Fotos nicht zeigen: Reife, Geschmack, Verwendung. Hilft beim Abgleich mit den Sorten. Wird sofort gespeichert.</p>
      {haupt.map(frage)}
      <details style={{ marginTop: 12 }}>
        <summary className="klein" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>
          Weitere Angaben: Schale, Duft, Geschmacksnoten, Baum{weitereAusgefuellt ? ` (${weitereAusgefuellt} ausgefüllt)` : ''}
        </summary>
        {weitere.map(frage)}
      </details>
    </Abschnitt>
  )
}

// ------------------------------------------------------------------ Baum: Bezeichnung, Ort, Notizen

function BaumAbschnitt({ baum, aendern }: { baum: Baum; aendern: (t: Partial<Baum>) => void }) {
  return (
    <Abschnitt titel="Baum">
      <label className="feld" style={{ marginTop: 0 }}>
        <span>Bezeichnung</span>
        <input className="eingabe" defaultValue={baum.name} onBlur={(e) => e.target.value.trim() && e.target.value !== baum.name && aendern({ name: e.target.value.trim() })} />
      </label>
      <label className="feld">
        <span>Ort</span>
        <input className="eingabe" defaultValue={baum.ort} placeholder="z. B. Obstwiese am Deich" onBlur={(e) => e.target.value !== (baum.ort ?? '') && aendern({ ort: e.target.value })} />
      </label>
      <label className="feld">
        <span>Notizen</span>
        <textarea className="eingabe" defaultValue={baum.notizen} onBlur={(e) => e.target.value !== (baum.notizen ?? '') && aendern({ notizen: e.target.value })} placeholder="Alter des Baums, Herkunft der Sorte, Erinnerungen …" />
      </label>
      <p className="sehr-klein" style={{ marginTop: 0 }}>Änderungen werden gespeichert, sobald du ein Feld verlässt.</p>
    </Abschnitt>
  )
}

// ------------------------------------------------------------------ Standort

function OrtAbschnitt({ baum, aendern }: { baum: Baum; aendern: (t: Partial<Baum>) => void }) {
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  return (
    <Abschnitt titel="Standort">
      {baum.standort ? (
        <p className="klein">Koordinaten gespeichert ({baum.standort.lat.toFixed(4)}, {baum.standort.lng.toFixed(4)}). <a href={`#/wiese?baum=${baum.id}`}>Auf der Wiese zeigen</a></p>
      ) : (
        <p className="sehr-klein">Noch kein Standort. Er wird in deinem Konto gespeichert und nur dir angezeigt; auf der Wiese kannst du den Baum auch von Hand platzieren.</p>
      )}
      <button className="knopf" disabled={laeuft} onClick={() => {
        setLaeuft(true); setFehler('')
        if (!navigator.geolocation) { setLaeuft(false); setFehler('Standort nicht verfügbar. Erlaube den Zugriff in den Einstellungen oder versuch es draußen noch einmal.'); return }
        navigator.geolocation.getCurrentPosition(
          (pos) => { aendern({ standort: { lat: pos.coords.latitude, lng: pos.coords.longitude, genauigkeit: pos.coords.accuracy } }); setLaeuft(false) },
          () => { setFehler('Standort nicht verfügbar. Erlaube den Zugriff in den Einstellungen oder versuch es draußen noch einmal.'); setLaeuft(false) },
          { enableHighAccuracy: true, timeout: 15000 },
        )
      }}><Ort /> {laeuft ? 'Suche Standort …' : baum.standort ? 'Standort neu bestimmen' : 'Aktuellen Standort übernehmen'}</button>
      <Meldung art="fehler">{fehler}</Meldung>
    </Abschnitt>
  )
}
