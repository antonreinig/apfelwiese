import { useMemo, useState } from 'react'
import { ApfelBuehne } from '../apfel3d/Buehne.tsx'
import { useSorte, useSortenindex, parameterAusSorte, parameterAusEintrag } from '../daten/sorten.ts'
import type { Sorte, Textthema, Merkmalswert, Quelle } from '../daten/sorte.ts'
import { MERKMAL_NACH_ID, GRUPPEN, auspraegungLabel, type Gruppe } from '../daten/merkmalskatalog.ts'
import { BelegRegister, Fussnoten, Belegliste } from '../ui/Belege.tsx'
import { zurueck, gehe } from '../ui/router.ts'
import { Zurueck } from '../ui/symbole.tsx'
import { useBaeume, aktualisiereBaum, VERTRAUEN } from '../daten/baeume.ts'

const THEMEN: [Textthema, string][] = [
  ['ueberblick', 'Überblick'],
  ['herkunft', 'Herkunft'],
  ['frucht', 'Frucht'],
  ['schale', 'Schale'],
  ['schnitt', 'Im Schnitt'],
  ['fleisch_geschmack', 'Fleisch und Geschmack'],
  ['reife_lagerung', 'Reife und Lagerung'],
  ['baum', 'Baum'],
  ['verwendung', 'Verwendung'],
  ['unterscheidung', 'Verwechslung und Unterscheidung'],
]

export default function SorteSeite({ id }: { id: string }) {
  const sorte = useSorte(id)
  const index = useSortenindex()
  const eintrag = index?.sorten.find((s) => s.id === id)
  const quellen = useMemo(() => new Map<string, Quelle>((index?.quellen ?? []).map((q) => [q.id, q])), [index])
  // Dasselbe Modell wie im Medaillon (Index); nur ohne Indexeintrag aus der vollen Sorte
  const p = useMemo(() => (eintrag ? parameterAusEintrag(eintrag) : sorte ? parameterAusSorte(sorte) : null), [sorte, eintrag])

  return (
    <div className="seite" style={{ paddingTop: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 3, paddingTop: 'var(--oben)', display: 'flex' }}>
        <button className="rund-knopf" onClick={() => zurueck('/sorten')} aria-label="Zurück"><Zurueck /></button>
      </div>
      <div style={{ position: 'relative', height: 300, margin: '-44px -16px 0' }}>
        {p && <ApfelBuehne aepfel={[p]} className="buehne" />}
      </div>
      <h1 className="name" style={{ fontSize: 48, textAlign: 'center' }}>{sorte?.name ?? eintrag?.name ?? ''}</h1>
      {sorte === null && <p className="hinweis" style={{ textAlign: 'center' }}>Zu dieser Sorte liegen noch keine Angaben vor.</p>}
      {sorte && <Inhalt sorte={sorte} quellen={quellen} />}
    </div>
  )
}

function Inhalt({ sorte, quellen }: { sorte: Sorte; quellen: Map<string, Quelle> }) {
  const synonyme = sorte.synonyme.map((s) => s.name).filter((n) => n !== sorte.name)
  return (
    <BelegRegister>
      {synonyme.length > 0 && (
        <p className="klein kursiv" style={{ textAlign: 'center', margin: '4px 0 0' }}>
          auch {synonyme.slice(0, 6).join(', ')}{synonyme.length > 6 ? ` und ${synonyme.length - 6} weitere Namen` : ''}
        </p>
      )}
      <hr className="doppellinie" />

      {sorte.herkunft && (
        <p style={{ marginTop: 0 }}><span className="kapitaelchen">Herkunft.</span> {sorte.herkunft.text}<Fussnoten belege={sorte.herkunft.belege} /></p>
      )}

      {THEMEN.map(([thema, titel]) => {
        const texte = sorte.texte.filter((t) => t.thema === thema)
        if (!texte.length) return null
        return (
          <section key={thema} style={{ marginBottom: 14 }}>
            <h2 className="kapitaelchen" style={{ fontSize: 17, color: 'var(--tinte-2)', marginBottom: 4 }}>{titel}</h2>
            {texte.map((t, i) => (
              <p key={i} style={{ margin: '0 0 8px' }}>{t.text}<Fussnoten belege={t.belege} /></p>
            ))}
          </section>
        )
      })}

      <Bilder sorte={sorte} />
      <Merkmale werte={sorte.merkmale} />
      <BaumZuordnen sorte={sorte} />

      <hr className="haarlinie" />
      <h2 className="kapitaelchen" style={{ fontSize: 17, color: 'var(--tinte-2)', marginBottom: 8 }}>Quellen</h2>
      <Belegliste quellen={quellen} />
      <p className="sehr-klein kursiv" style={{ marginTop: 12 }}>
        Das 3D-Modell ist aus den belegten Merkmalen{sorte.farbmessung?.length ? ' und aus Farben, die per Programm aus einem Referenzbild gemessen wurden,' : ''} berechnet. Es zeigt einen typischen Apfel der Sorte; einzelne Früchte weichen ab.
      </p>
    </BelegRegister>
  )
}

function Merkmale({ werte }: { werte: Merkmalswert[] }) {
  const gruppen = useMemo(() => {
    const g = new Map<Gruppe, Merkmalswert[]>()
    for (const w of werte) {
      const m = MERKMAL_NACH_ID[w.merkmal]
      if (!m) continue
      if (!g.has(m.gruppe)) g.set(m.gruppe, [])
      g.get(m.gruppe)!.push(w)
    }
    return (Object.keys(GRUPPEN) as Gruppe[]).filter((k) => g.has(k)).map((k) => [k, g.get(k)!] as const)
  }, [werte])
  if (!gruppen.length) return null
  return (
    <section style={{ marginTop: 18 }}>
      <h2 className="kapitaelchen" style={{ fontSize: 17, color: 'var(--tinte-2)', marginBottom: 4 }}>Merkmale</h2>
      {gruppen.map(([g, ws]) => (
        <div key={g} style={{ marginBottom: 10 }}>
          <div className="sehr-klein kursiv" style={{ borderBottom: '0.5px solid var(--linie)', paddingBottom: 2 }}>{GRUPPEN[g]}</div>
          {zusammenfassen(ws).map(([mid, eintraege]) => (
            <div key={mid} style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '0.5px dotted var(--linie)', fontSize: 16 }}>
              <span style={{ flex: '0 0 44%', color: 'var(--tinte-2)' }}>{MERKMAL_NACH_ID[mid].name}</span>
              <span style={{ flex: 1 }}>
                {eintraege.map((w, i) => (
                  <span key={i}>{i ? '; ' : ''}{auspraegungLabel(mid, w.wert)}<Fussnoten belege={[w]} /></span>
                ))}
              </span>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

function zusammenfassen(ws: Merkmalswert[]) {
  const m = new Map<string, Merkmalswert[]>()
  for (const w of ws) {
    if (!m.has(w.merkmal)) m.set(w.merkmal, [])
    const l = m.get(w.merkmal)!
    if (!l.some((x) => String(x.wert) === String(w.wert) && x.quelle === w.quelle)) l.push(w)
  }
  return [...m.entries()]
}

function Bilder({ sorte }: { sorte: Sorte }) {
  const [gross, setGross] = useState<number | null>(null)
  if (!sorte.bilder.length) return null
  const reihenfolge = { frucht: 0, schnitt: 1, tafel: 2, baum: 3, bluete: 4 }
  const bilder = [...sorte.bilder].sort((a, b) => reihenfolge[a.art] - reihenfolge[b.art])
  const b = gross !== null ? bilder[gross] : null
  return (
    <section style={{ margin: '18px 0' }}>
      <h2 className="kapitaelchen" style={{ fontSize: 17, color: 'var(--tinte-2)', marginBottom: 6 }}>Bilder</h2>
      <div className="chips" style={{ gap: 10 }}>
        {bilder.map((x, i) => (
          <button key={i} onClick={() => setGross(i)} style={{ padding: 0, border: '0.5px solid var(--linie)', background: 'var(--papier-3)', borderRadius: 8, flex: 'none' }}>
            <img src={bildUrl(x.url)} alt={x.titel ?? `${sorte.name}, ${x.art}`} loading="lazy" style={{ height: 120, display: 'block', borderRadius: 8 }} />
          </button>
        ))}
      </div>
      {b && (
        <figure style={{ margin: '10px 0 0' }}>
          <img src={bildUrl(b.url)} alt={b.titel ?? sorte.name} style={{ width: '100%', borderRadius: 8 }} />
          <figcaption className="sehr-klein">
            {b.titel ? `${b.titel}. ` : ''}{b.urheber}, {b.lizenz}. <a href={b.seite} target="_blank" rel="noreferrer">Bildseite</a>
          </figcaption>
        </figure>
      )}
    </section>
  )
}

function BaumZuordnen({ sorte }: { sorte: Sorte }) {
  const { baeume } = useBaeume()
  const [offen, setOffen] = useState(false)
  if (!baeume.length) return null
  return (
    <section style={{ margin: '18px 0' }}>
      {!offen ? (
        <button className="knopf" onClick={() => setOffen(true)}>Einem meiner Bäume zuordnen</button>
      ) : (
        <div className="karte-papier">
          <p className="klein" style={{ marginTop: 0 }}>Welcher Baum ist {sorte.name}? Die Zuordnung gilt als deine eigene Bestimmung, bis ein Pomologe sie bestätigt.</p>
          {baeume.map((b) => (
            <button key={b.id} className="zeile" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              onClick={async () => {
                const alt = b.bestimmung
                if ((alt.status === 'pomologe' || alt.status === 'dna') && alt.sorteId !== sorte.id &&
                  !confirm(`„${b.name}“ ist als ${alt.sorteName} bestätigt (${VERTRAUEN[alt.status].label}). Durch deine eigene Bestimmung „${sorte.name}“ ersetzen?`)) return
                await aktualisiereBaum(b.id, (x) => ({ ...x, bestimmung: { status: 'nutzer', sorteId: sorte.id, sorteName: sorte.name, datum: new Date().toISOString().slice(0, 10) } }))
                gehe(`/baum/${b.id}`)
              }}>
              <span className="grow">{b.name}</span>
              <span className="sehr-klein">{b.bestimmung.sorteName ?? 'unbestimmt'}</span>
            </button>
          ))}
          <button className="knopf leise" onClick={() => setOffen(false)}>Abbrechen</button>
        </div>
      )}
    </section>
  )
}

/** Wikimedia-Bilder über die eigene Domain laden (vercel.json), damit die IP der Nutzer nicht in die USA geht */
function bildUrl(u: string) {
  return u.replace(/^https:\/\/upload\.wikimedia\.org\//, '/wm/')
}
