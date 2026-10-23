import { useMemo, useState } from 'react'
import { ApfelBuehne } from '../apfel3d/Buehne.tsx'
import { useSorte, useSortenindex, parameterAusSorte, parameterAusEintrag } from '../daten/sorten.ts'
import type { Sorte, Textthema, Merkmalswert, Quelle, SortenEintrag } from '../daten/sorte.ts'
import { MERKMAL_NACH_ID, GRUPPEN, auspraegungLabel, type Gruppe } from '../daten/merkmalskatalog.ts'
import { BelegRegister, Fussnoten, Belegliste } from '../ui/Belege.tsx'
import { gehe } from '../ui/router.ts'
import { Stern } from '../ui/symbole.tsx'
import { Seitenkopf, Verweiskarte, Wertzeile } from '../ui/Seite.tsx'
import { BUNDESLAND_NAME } from '../daten/einstellungen.ts'
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

/** Sortenporträt; mit `schliessen` als Überlagerung (etwa im Bestimmungsablauf, der dabei erhalten bleibt) */
export default function SorteSeite({ id, schliessen }: { id: string; schliessen?: () => void }) {
  const sorte = useSorte(id)
  const index = useSortenindex()
  const eintrag = index?.sorten.find((s) => s.id === id)
  const quellen = useMemo(() => new Map<string, Quelle>((index?.quellen ?? []).map((q) => [q.id, q])), [index])
  // Dasselbe Modell wie im Medaillon (Index); nur ohne Indexeintrag aus der vollen Sorte
  const p = useMemo(() => (eintrag ? parameterAusEintrag(eintrag) : sorte ? parameterAusSorte(sorte) : null), [sorte, eintrag])

  return (
    <div className="seite" style={{ paddingTop: 0 }}>
      <Seitenkopf zurueckZu="/sorten" onZurueck={schliessen} />
      <div style={{ position: 'relative', height: 290, margin: '-6px -16px 0' }}>
        {p && <ApfelBuehne aepfel={[p]} className="buehne" />}
      </div>
      <h1 className="name titel-objekt" style={{ textAlign: 'center' }}>{sorte?.name ?? eintrag?.name ?? ''}</h1>
      {sorte === null && <p className="hinweis" style={{ textAlign: 'center' }}>Zu dieser Sorte liegen noch keine Angaben vor.</p>}
      {sorte && <Inhalt sorte={sorte} quellen={quellen} eintrag={eintrag} />}
    </div>
  )
}

function Inhalt({ sorte, quellen, eintrag }: { sorte: Sorte; quellen: Map<string, Quelle>; eintrag?: SortenEintrag }) {
  const synonyme = sorte.synonyme.map((s) => s.name).filter((n) => n !== sorte.name)
  return (
    <BelegRegister>
      {synonyme.length > 0 && (
        <p className="klein kursiv" style={{ textAlign: 'center', margin: '4px 0 0' }}>
          auch {synonyme.slice(0, 6).join(', ')}{synonyme.length > 6 ? ` und ${synonyme.length - 6} weitere Namen` : ''}
        </p>
      )}
      <hr className="doppellinie" />

      <AufEinenBlick sorte={sorte} eintrag={eintrag} />
      {sorte.herkunft && (
        <p style={{ marginTop: 0 }}><span className="kapitaelchen">Herkunft.</span> {sorte.herkunft.text}<Fussnoten belege={sorte.herkunft.belege} /></p>
      )}

      {THEMEN.map(([thema, titel]) => {
        const texte = sorte.texte.filter((t) => t.thema === thema)
        if (!texte.length) return null
        return (
          <section key={thema} style={{ marginBottom: 14 }}>
            <h2 className="abschnitt-titel">{titel}</h2>
            {texte.map((t, i) => (
              <p key={i} style={{ margin: '0 0 8px' }}>{t.text}<Fussnoten belege={t.belege} /></p>
            ))}
          </section>
        )
      })}

      <Bilder sorte={sorte} />
      <Merkmale werte={sorte.merkmale} />
      <BaumZuordnen sorte={sorte} />
      <div style={{ margin: '18px 0' }}>
        <Verweiskarte ziel="/sorten/bezug" symbol={<Stern />} titel="Einen Baum dieser Sorte bekommen" text="Baumschulen mit alten Sorten, Reiserbörsen, Veredeln vom eigenen Baum" />
      </div>

      <hr className="haarlinie" />
      <h2 className="abschnitt-titel">Quellen</h2>
      <Belegliste quellen={quellen} />
      <p className="sehr-klein kursiv" style={{ marginTop: 12 }}>
        Das 3D-Modell ist aus den belegten Merkmalen{sorte.farbmessung?.length ? ' und aus Farben, die per Programm aus einem Referenzbild gemessen wurden,' : ''} berechnet. Es zeigt einen typischen Apfel der Sorte; einzelne Früchte weichen ab.
        {sorte.bildabgleich && <> Die Form ist per Programm an den Umriss eines Fotos angeglichen{sorte.bildabgleich.hand ? ' und danach von Hand nachgestellt' : ''}{sorte.bildabgleich.seite ? <> (<a href={sorte.bildabgleich.seite} target="_blank" rel="noreferrer">Foto</a>)</> : ''}.</>}
      </p>
    </BelegRegister>
  )
}

const LAENDER: Record<string, string> = {
  DE: 'Deutschland', NL: 'Niederlande', BE: 'Belgien', FR: 'Frankreich', GB: 'England', IE: 'Irland', DK: 'Dänemark', SE: 'Schweden', NO: 'Norwegen',
  PL: 'Polen', CZ: 'Tschechien', AT: 'Österreich', CH: 'Schweiz', IT: 'Italien', RU: 'Russland', UA: 'Ukraine', LV: 'Lettland', LT: 'Litauen',
  EE: 'Estland', US: 'USA', CA: 'Kanada', NZ: 'Neuseeland', AU: 'Australien', JP: 'Japan', HU: 'Ungarn', SK: 'Slowakei', SI: 'Slowenien', LU: 'Luxemburg', FI: 'Finnland', IM: 'Isle of Man', ES: 'Spanien', PT: 'Portugal', HR: 'Kroatien', RO: 'Rumänien', BY: 'Belarus',
}
const REGION_ART: Record<string, string> = { herkunft: 'Entstanden in', regionalsorte: 'Regionalsorte in', empfehlung: 'Für den Streuobstbau empfohlen in', verbreitung: 'Verbreitet in' }

/** Werte eines Merkmals ohne Dubletten, je Wert mit seinen Belegen */
function werteMit(sorte: Sorte, merkmal: string) {
  const m = new Map<string, Merkmalswert[]>()
  for (const w of sorte.merkmale) if (w.merkmal === merkmal) m.set(String(w.wert), [...(m.get(String(w.wert)) ?? []), w])
  return [...m.entries()].map(([wert, ws]) => ({ text: auspraegungLabel(merkmal, wert), belege: ws.flatMap((w) => w.belege ?? [w]) }))
}

/** Auf einen Blick: Herkunft, Alter, Region, Gefährdung, Reife, Nutzung und Anbau, jeweils mit Beleg */
function AufEinenBlick({ sorte, eintrag }: { sorte: Sorte; eintrag?: SortenEintrag }) {
  const zeilen: React.ReactNode[] = []
  const liste = (merkmal: string, praefix = '') => {
    const w = werteMit(sorte, merkmal)
    return w.length ? w.map((x, i) => <span key={i}>{i ? '; ' : ''}{praefix}{x.text}<Fussnoten belege={x.belege} /></span>) : null
  }
  const h = sorte.herkunft
  if (h?.land) zeilen.push(<Wertzeile key="herkunft" titel="Herkunft">{h.landSicher === false ? 'vermutlich ' : ''}{LAENDER[h.land] ?? h.land}{h.ort ? ` (${h.ort})` : ''}{h.jahr ? `, um ${h.jahr}` : ''}<Fussnoten belege={h.belege} /></Wertzeile>)
  if (eintrag?.alt) zeilen.push(<Wertzeile key="alt" titel="Alter">alte Sorte, belegt vor 1950{!h?.jahr && eintrag.beschrieben ? ` (beschrieben ${eintrag.beschrieben})` : ''}</Wertzeile>)
  for (const art of ['herkunft', 'regionalsorte', 'empfehlung', 'verbreitung'] as const) {
    const rs = (sorte.regionen ?? []).filter((r) => r.art === art)
    if (!rs.length) continue
    zeilen.push(
      <Wertzeile key={art} titel={REGION_ART[art]}>
        {rs.map((r, i) => <span key={r.region}>{i ? ', ' : ''}<a href={`#/sorten/region/${r.region}`}>{BUNDESLAND_NAME[r.region] ?? r.region}</a><Fussnoten belege={r.belege} /></span>)}
      </Wertzeile>,
    )
  }
  if (sorte.gefaehrdung?.length) {
    zeilen.push(
      <Wertzeile key="gefaehrdung" titel="Gefährdung">
        {sorte.gefaehrdung.map((g, i) => <span key={i} style={{ color: 'var(--siegel)' }}>{i ? '; ' : ''}{g.stufe === 'selten' && g.original ? `„${g.original}“` : g.stufe}<Fussnoten belege={g.belege} /></span>)}
      </Wertzeile>,
    )
  }
  if (eintrag?.reife) zeilen.push(<Wertzeile key="reife" titel="Genussreif">{eintrag.reife}</Wertzeile>)
  for (const [m, titel] of [['lagerfaehigkeit', 'Lagerfähigkeit'], ['verwendung', 'Verwendung'], ['baum_wuchs', 'Wuchs'], ['standort_klima', 'Lage'], ['standort_boden', 'Boden'], ['anfaelligkeit_schorf', 'Schorf'], ['anfaelligkeit_mehltau', 'Mehltau'], ['anfaelligkeit_krebs', 'Obstbaumkrebs'], ['bluete_frost', 'Blüte bei Frost']] as const) {
    const l = liste(m)
    if (l) zeilen.push(<Wertzeile key={m} titel={titel}>{l}</Wertzeile>)
  }
  if (werteMit(sorte, 'ploidie').some((x) => x.text === 'triploid')) {
    zeilen.push(<Wertzeile key="ploidie" titel="Befruchtung">triploid: guter Ertrag nur mit zwei anderen Sorten in der Nähe<Fussnoten belege={werteMit(sorte, 'ploidie').flatMap((x) => x.belege)} /></Wertzeile>)
  }
  if (!zeilen.length) return null
  return (
    <section style={{ marginBottom: 18 }} aria-label="Auf einen Blick">
      <h2 className="abschnitt-titel">Auf einen Blick</h2>
      <div style={{ fontSize: 16 }}>{zeilen}</div>
    </section>
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
      <h2 className="abschnitt-titel">Merkmale</h2>
      {gruppen.map(([g, ws]) => (
        <div key={g} style={{ marginBottom: 10 }}>
          <div className="sehr-klein kursiv" style={{ borderBottom: '0.5px solid var(--linie)', paddingBottom: 2 }}>{GRUPPEN[g]}</div>
          {zusammenfassen(ws).map(([mid, eintraege]) => (
            <Wertzeile key={mid} titel={MERKMAL_NACH_ID[mid].name}>
              {eintraege.map((w, i) => (
                <span key={i}>{i ? '; ' : ''}{auspraegungLabel(mid, w.wert)}<Fussnoten belege={w.belege ?? [w]} /></span>
              ))}
            </Wertzeile>
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
      <h2 className="abschnitt-titel">Bilder</h2>
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
              <span className="sehr-klein">{b.bestimmung.sorteName ?? VERTRAUEN.unbestimmt.label}</span>
            </button>
          ))}
          <button className="knopf leise" onClick={() => setOffen(false)}>Abbrechen</button>
        </div>
      )}
    </section>
  )
}

/** Bilder fremder Server über die eigene Domain laden (vercel.json, api/kachel.ts), damit die IP der Nutzer nicht in die USA geht */
function bildUrl(u: string) {
  return u
    .replace(/^https:\/\/upload\.wikimedia\.org\//, '/wm/')
    .replace(/^https:\/\/thumb\.wikimedia\.org\//, '/wmt/')
    .replace(/^https:\/\/archive\.org\//, '/ia/')
}
