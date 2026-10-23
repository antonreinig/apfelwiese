import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Medaillon } from '../apfel3d/Buehne.tsx'
import { useSortenindex, parameterAusEintrag, normalisiere } from '../daten/sorten.ts'
import { Suche, Kompass, Wuerfel, Stern } from '../ui/symbole.tsx'
import { Seitenkopf, Verweis, Verweiskarte } from '../ui/Seite.tsx'
import { zahl, MONATE_KURZ } from '../ui/format.ts'
import type { SortenEintrag } from '../daten/sorte.ts'
import {
  apfelDesTages, zufaelligeSorte, reifekalender, regionSorten, regionsarten, REGIONSART, SAMMLUNGEN, SAMMLUNG_NACH_ID,
  sammlungAnwenden, steckbrief, MONATSNAMEN, type Regionsart, type Sammlung,
} from '../daten/erkunden.ts'
import { useEinstellungen, setzeRegion, BUNDESLAENDER, BUNDESLAND_NAME } from '../daten/einstellungen.ts'

// Sorten-Tab: Startseite zum Erkunden (Apfel des Tages, Ratgeber, Reife, Region, Seltenes, Sammlungen)
// und Listen für Suche, Sammlung, Monat, Region und alle Sorten.

const SEITE = 40

/** Gut beschriebene Sorten mit Bild zuerst (für Reihen auf der Startseite) */
const zuerstGut = (l: SortenEintrag[]) => [...l].sort((a, b) => Number(b.hatBild) - Number(a.hatBild) || Number(!!b.ausfuehrlich) - Number(!!a.ausfuehrlich) || b.anzahlMerkmale - a.anzahlMerkmale)

/** Scrollstand einer Seite merken, damit „Zurück“ aus einem Sortenporträt an dieselbe Stelle führt */
function useScrollstand(schluessel: string, bereit: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !bereit) return
    try { const y = Number(sessionStorage.getItem(`scroll:${schluessel}`)); if (y) el.scrollTop = y } catch { /* privat */ }
    const merken = () => { try { sessionStorage.setItem(`scroll:${schluessel}`, String(el.scrollTop)) } catch { /* privat */ } }
    el.addEventListener('scroll', merken, { passive: true })
    return () => el.removeEventListener('scroll', merken)
  }, [schluessel, bereit])
  return ref
}

// ------------------------------------------------------------------ Startseite

export function SortenSeite() {
  const index = useSortenindex()
  const [suche, setSuche] = useState(() => sessionStorageLesen('sorten-suche'))
  useEffect(() => { try { sessionStorage.setItem('sorten-suche', suche) } catch { /* privat */ } }, [suche])
  const ref = useScrollstand(suche ? 'sorten-suche' : 'sorten', !!index)

  return (
    <div className="seite" ref={ref}>
      <div className="tafelkopf">
        <span>Sorten</span>
        <span>{index ? `${zahl(index.anzahl)} im Verzeichnis` : ''}</span>
      </div>
      <div style={{ position: 'relative', marginTop: 12 }}>
        <Suche style={{ position: 'absolute', left: 12, top: 12, width: 20, height: 20, color: 'var(--bleistift)' }} />
        <input
          className="eingabe"
          style={{ paddingLeft: 40, borderRadius: 999 }}
          placeholder="Name oder Synonym"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          type="search"
          enterKeyHint="search"
          aria-label="Sorte suchen"
        />
      </div>
      {index && index.anzahl === 0 && <p className="hinweis" style={{ marginTop: 24 }}>Die Sortendatenbank wird gerade aufgebaut.</p>}
      {index && index.anzahl > 0 && (suche.trim() ? <Suchtreffer sorten={index.sorten} suche={suche} /> : <Erkunden sorten={index.sorten} />)}
    </div>
  )
}

function Suchtreffer({ sorten, suche }: { sorten: SortenEintrag[]; suche: string }) {
  const treffer = useMemo(() => {
    const q = normalisiere(suche)
    const bewertet = sorten
      .map((s) => {
        const n = normalisiere(s.name)
        if (n.startsWith(q)) return { s, w: 0 }
        if (n.includes(q)) return { s, w: 1 }
        if (s.synonyme.some((x) => normalisiere(x).includes(q))) return { s, w: 2 }
        return null
      })
      .filter((x): x is { s: SortenEintrag; w: number } => !!x)
    bewertet.sort((a, b) => a.w - b.w || a.s.name.localeCompare(b.s.name, 'de'))
    return bewertet.map((x) => x.s)
  }, [sorten, suche])
  if (!treffer.length) return <p className="hinweis" style={{ marginTop: 24 }}>Keine Sorte gefunden. Versuch einen anderen Namen oder ein Synonym.</p>
  return <Liste sorten={treffer} />
}

function Erkunden({ sorten }: { sorten: SortenEintrag[] }) {
  const monat = new Date().getMonth() + 1
  const reif = useMemo(() => zuerstGut(sorten.filter((s) => s.genuss?.includes(monat))), [sorten, monat])
  const selten = useMemo(() => zuerstGut(sorten.filter((s) => s.selten)), [sorten])
  return (
    <>
      <ApfelDesTages sorten={sorten} />
      <RatgeberKarte />
      <Reihe titel={`Jetzt genussreif · ${MONATSNAMEN[monat - 1]}`} ziel={`/sorten/monat/${monat}`} anzahl={reif.length} sorten={reif.slice(0, 14)} />
      <RegionReihe sorten={sorten} />
      {selten.length > 0 && <Reihe titel="Selten und erhaltenswert" ziel="/sorten/sammlung/selten" anzahl={selten.length} sorten={selten.slice(0, 14)} unter={(s) => (s.selten && s.selten !== 'selten' ? s.selten : steckbrief(s).split(' · ').pop() ?? '')} />}
      <Reifekalender sorten={sorten} />
      <Sammlungen sorten={sorten} />
      <BezugKarte />
      <div style={{ marginTop: 18 }}><Verweis ziel="/sorten/alle">Alle {zahl(sorten.length)} Sorten von A bis Z</Verweis></div>
    </>
  )
}

function Ueberschrift({ titel, ziel, anzahl }: { titel: string; ziel?: string; anzahl?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, margin: '26px 0 8px' }}>
      <h2 className="abschnitt-titel" style={{ marginBottom: 0 }}>{titel}</h2>
      {ziel && <a href={`#${ziel}`} className="klein" style={{ whiteSpace: 'nowrap', padding: '10px 0 10px 12px', margin: '-10px 0' }}>{anzahl !== undefined ? `alle ${zahl(anzahl)}` : 'alle'}</a>}
    </div>
  )
}

function ApfelDesTages({ sorten }: { sorten: SortenEintrag[] }) {
  const heute = useMemo(() => apfelDesTages(sorten), [sorten])
  const [zufall, setZufall] = useState<SortenEintrag | null>(null)
  const s = zufall ?? heute
  if (!s) return null
  const datum = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
  return (
    <section className="karte-papier" style={{ marginTop: 16, padding: '12px 14px' }} aria-label={zufall ? 'Zufallsfund' : 'Apfel des Tages'}>
      <div className="tafelkopf" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <span>{zufall ? 'Zufallsfund' : `Apfel des Tages · ${datum}`}</span>
        <button className="rund-knopf" aria-label="Zufällige Sorte" onClick={() => setZufall(zufaelligeSorte(sorten, s.id) ?? null)}><Wuerfel /></button>
      </div>
      <a href={`#/sorte/${s.id}`} style={{ display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none', marginTop: 4 }}>
        <Medaillon p={parameterAusEintrag(s)} groesse={108} />
        <div style={{ minWidth: 0 }}>
          <div className="name" style={{ fontSize: 34 }}>{s.name}</div>
          <div className="sehr-klein">{steckbrief(s)}</div>
          {s.kurz && <p className="klein" style={{ margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.kurz}</p>}
        </div>
      </a>
    </section>
  )
}

function RatgeberKarte() {
  return <Verweiskarte dunkel ziel="/sorten/ratgeber" symbol={<Kompass />} titel="Welcher Apfelbaum passt zu dir?" text="Neun Fragen zu Lage, Boden, Platz und Geschmack" />
}

function BezugKarte() {
  return (
    <div style={{ marginTop: 26 }}>
      <Verweiskarte ziel="/sorten/bezug" symbol={<Stern />} titel="Alte Sorten bekommen und erhalten" text="Baumschulen, Reiserbörsen, Sortenbestimmung und wie du Sorten weitergibst" />
    </div>
  )
}

/** Waagerechte Reihe von Medaillons */
function Reihe({ titel, ziel, anzahl, sorten, unter }: { titel: string; ziel?: string; anzahl?: number; sorten: SortenEintrag[]; unter?: (s: SortenEintrag) => string }) {
  if (!sorten.length) return null
  return (
    <section>
      <Ueberschrift titel={titel} ziel={ziel} anzahl={anzahl} />
      <div className="chips" style={{ gap: 14, margin: '0 -16px', padding: '2px 16px 6px' }}>
        {sorten.map((s) => (
          <a key={s.id} href={`#/sorte/${s.id}`} style={{ flex: 'none', width: 92, textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Medaillon p={parameterAusEintrag(s)} groesse={84} /></div>
            <div className="name" style={{ fontSize: 19, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.name}</div>
            {unter && <div className="sehr-klein" style={{ lineHeight: 1.2 }}>{unter(s)}</div>}
          </a>
        ))}
      </div>
    </section>
  )
}

function RegionReihe({ sorten }: { sorten: SortenEintrag[] }) {
  const { region } = useEinstellungen()
  const r = useMemo(() => (region ? regionSorten(sorten, region) : null), [sorten, region])
  if (!region || !r) {
    return (
      <section>
        <Ueberschrift titel="Aus deiner Region" />
        <div className="karte-papier">
          <p className="klein" style={{ marginTop: 0 }}>Wähle dein Bundesland: Die App zeigt dann Sorten, die dort entstanden sind oder als Regionalsorten gelten.</p>
          <RegionWahl />
        </div>
      </section>
    )
  }
  const name = BUNDESLAND_NAME[region]
  const eigene = r.eigene.map((x) => x.s)
  if (!eigene.length && !r.nachbarn.length) {
    return (
      <section>
        <Ueberschrift titel={`Aus ${name}`} />
        <p className="klein">Für {name} sind in der Datenbank noch keine Regionalsorten belegt.</p>
        <RegionWahl />
      </section>
    )
  }
  const arten = new Map(r.eigene.map((x) => [x.s.id, x.arten]))
  return (
    <Reihe
      titel={eigene.length ? `Aus ${name}` : `Aus der Nachbarschaft von ${name}`}
      ziel={`/sorten/region/${region}`}
      anzahl={eigene.length + r.nachbarn.length}
      sorten={zuerstGut(eigene).concat(r.nachbarn).slice(0, 14)}
      unter={(s) => { const a = arten.get(s.id); return a ? kurzArt(a) : 'Nachbarland' }}
    />
  )
}

const kurzArt = (a: Regionsart[]) => a.includes('h') ? 'hier entstanden' : a.includes('r') ? 'Regionalsorte' : a.includes('e') ? 'empfohlen' : 'verbreitet'

export function RegionWahl({ klein = false }: { klein?: boolean }) {
  const { region } = useEinstellungen()
  return (
    <select className="eingabe" aria-label="Bundesland" value={region ?? ''} onChange={(e) => setzeRegion(e.target.value || null)} style={klein ? { width: 'auto' } : undefined}>
      <option value="">Bundesland wählen</option>
      {BUNDESLAENDER.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
    </select>
  )
}

function Reifekalender({ sorten }: { sorten: SortenEintrag[] }) {
  const n = useMemo(() => reifekalender(sorten), [sorten])
  const max = Math.max(...n, 1)
  const jetzt = new Date().getMonth()
  return (
    <section>
      <Ueberschrift titel="Reifekalender" />
      <p className="sehr-klein" style={{ margin: '-4px 0 8px' }}>Wie viele Sorten in welchem Monat genussreif sind. Tippe auf einen Monat.</p>
      <div role="list">
        {n.map((x, i) => (
          <a key={i} href={`#/sorten/monat/${i + 1}`} role="listitem" aria-label={`${MONATSNAMEN[i]}: ${zahl(x)} Sorten`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36, textDecoration: 'none', color: i === jetzt ? 'var(--tinte)' : 'var(--tinte-2)', fontWeight: i === jetzt ? 500 : 400 }}>
            <span style={{ width: 34, fontSize: 15 }}>{MONATE_KURZ[i]}</span>
            <span style={{ flex: 1, height: 14 }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.max(1.5, (x / max) * 100)}%`, borderRadius: 4, background: i === jetzt ? 'var(--siegel)' : 'color-mix(in srgb, var(--blatt) 70%, transparent)' }} />
            </span>
            <span style={{ width: 46, textAlign: 'right', fontSize: 15 }}>{zahl(x)}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function Sammlungen({ sorten }: { sorten: SortenEintrag[] }) {
  const inhalt = useMemo(() => Object.fromEntries(SAMMLUNGEN.map((sm) => [sm.id, sammlungAnwenden(sorten, sm)])), [sorten])
  const gruppe = (g: Sammlung['gruppe']) => SAMMLUNGEN.filter((sm) => sm.gruppe === g && sm.id !== 'selten' && inhalt[sm.id].length >= 3)
  const vorbild = (sm: Sammlung) => zuerstGut(inhalt[sm.id])[0]
  return (
    <>
      <section>
        <Ueberschrift titel="Nach Farbe" />
        <div className="chips" style={{ gap: 12, margin: '0 -16px', padding: '2px 16px 6px' }}>
          {gruppe('farbe').map((sm) => (
            <a key={sm.id} href={`#/sorten/sammlung/${sm.id}`} style={{ flex: 'none', width: 74, textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>
              <span aria-hidden style={{ display: 'block', width: 52, height: 52, margin: '0 auto', borderRadius: '50%', background: sm.farbe, border: '0.5px solid var(--linie-stark)', boxShadow: 'var(--schatten)' }} />
              <span style={{ display: 'block', fontSize: 14, lineHeight: 1.2, marginTop: 6 }}>{sm.titel}</span>
              <span className="sehr-klein">{zahl(inhalt[sm.id].length)}</span>
            </a>
          ))}
        </div>
      </section>
      <section>
        <Ueberschrift titel="Sortenfamilien" />
        <p className="sehr-klein" style={{ margin: '-4px 0 8px' }}>Alte Gruppennamen, die bis heute in vielen Sortennamen stecken.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {gruppe('familie').map((sm) => {
            const v = vorbild(sm)
            return (
              <a key={sm.id} href={`#/sorten/sammlung/${sm.id}`} className="karte-papier" style={{ padding: '10px 12px', textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'center' }}>
                {v && <Medaillon p={parameterAusEintrag(v)} groesse={44} />}
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 17, lineHeight: 1.2 }}>{sm.titel}</span>
                  <span className="sehr-klein">{zahl(inhalt[sm.id].length)} Sorten</span>
                </span>
              </a>
            )
          })}
        </div>
      </section>
      <section>
        <Ueberschrift titel="Themen" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {gruppe('thema').map((sm) => (
            <a key={sm.id} href={`#/sorten/sammlung/${sm.id}`} className="karte-papier" style={{ padding: '10px 12px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 17, lineHeight: 1.2 }}>{sm.titel}</span>
              <span className="sehr-klein">{zahl(inhalt[sm.id].length)} Sorten</span>
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

// ------------------------------------------------------------------ Listen

export function SortenListeSeite({ art, wert }: { art: 'alle' | 'sammlung' | 'monat' | 'region'; wert?: string }) {
  const index = useSortenindex()
  const { region } = useEinstellungen()
  const code = art === 'region' ? (wert ?? region ?? '') : ''
  const inhalt = useMemo(() => {
    if (!index) return null
    const l = index.sorten
    if (art === 'sammlung') {
      const sm = SAMMLUNG_NACH_ID[wert ?? '']
      if (!sm) return { titel: 'Sammlung', text: 'Diese Sammlung gibt es nicht.', sorten: [] }
      return { titel: sm.titel, text: sm.text, sorten: sammlungAnwenden(l, sm) }
    }
    if (art === 'monat') {
      const m = Number(wert)
      return { titel: `Genussreif im ${MONATSNAMEN[m - 1] ?? ''}`, text: 'Nach den Angaben der Quellen zur Genussreife; je nach Jahr und Lage verschiebt sie sich um Wochen.', sorten: zuerstGut(l.filter((s) => s.genuss?.includes(m))) }
    }
    if (art === 'region') {
      const r = regionSorten(l, code)
      return {
        titel: `Sorten aus ${BUNDESLAND_NAME[code] ?? 'deiner Region'}`,
        text: 'Dort entstanden, in Regional- oder Lokalsortenlisten geführt, für den Streuobstbau empfohlen oder laut Quellen verbreitet. Darunter Regionalsorten der Nachbarländer.',
        sorten: [...r.eigene.map((x) => x.s), ...r.nachbarn],
        nachbarAb: r.eigene.length,
      }
    }
    return { titel: 'Alle Sorten', text: '', sorten: l }
  }, [index, art, wert, code])
  const ref = useScrollstand(`liste:${art}:${wert ?? ''}`, !!inhalt)

  return (
    <div className="seite" ref={ref}>
      <Seitenkopf zurueckZu="/sorten" titel={inhalt?.titel ?? ''} untertitel={inhalt?.text} />
      {art === 'region' && <RegionWahl klein />}
      {inhalt && <p className="sehr-klein" style={{ marginBottom: 0 }}>{zahl(inhalt.sorten.length)} Sorten</p>}
      {inhalt && <Liste sorten={inhalt.sorten} region={art === 'region' ? code : undefined} nachbarAb={'nachbarAb' in inhalt ? inhalt.nachbarAb : undefined} />}
    </div>
  )
}

function Liste({ sorten, region, nachbarAb }: { sorten: SortenEintrag[]; region?: string; nachbarAb?: number }) {
  const [anzahl, setAnzahl] = useState(SEITE)
  const ende = useRef<HTMLDivElement>(null)
  useEffect(() => setAnzahl(SEITE), [sorten])
  useEffect(() => {
    const el = ende.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setAnzahl((a) => a + SEITE), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [sorten])
  return (
    <div style={{ marginTop: 8 }}>
      {sorten.slice(0, anzahl).map((s, i) => (
        <div key={s.id}>
          {nachbarAb !== undefined && i === nachbarAb && i > 0 && <h2 className="abschnitt-titel" style={{ marginTop: 18 }}>Aus den Nachbarländern</h2>}
          <a className="zeile" href={`#/sorte/${s.id}`}>
            <Medaillon p={parameterAusEintrag(s)} groesse={60} />
            <div className="grow">
              <div className="name">{s.name}</div>
              <div className="sehr-klein" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {zeileText(s, region)}
              </div>
            </div>
          </a>
        </div>
      ))}
      <div ref={ende} />
    </div>
  )
}

function zeileText(s: SortenEintrag, region?: string) {
  const teile: string[] = []
  if (region) {
    const a = regionsarten(s, region)
    if (a.length) teile.push(a.map((x) => REGIONSART[x]).join(', '))
  }
  if (s.selten && s.selten !== 'selten') teile.push(s.selten)
  if (s.reife) teile.push(s.reife)
  if (s.kurz) teile.push(s.kurz)
  else if (s.synonyme.length) teile.push(s.synonyme.slice(0, 2).join(', '))
  return teile.join(' · ')
}

function sessionStorageLesen(k: string) {
  try { return sessionStorage.getItem(k) ?? '' } catch { return '' }
}
