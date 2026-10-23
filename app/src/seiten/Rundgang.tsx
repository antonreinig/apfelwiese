import { useEffect, useMemo, useRef, useState } from 'react'
import { useBaeume, aktualisiereBaum, letzterFotosatz, type Fotosatz } from '../daten/baeume.ts'
import { MERKMALE, GRUPPEN, auspraegungLabel, type Merkmal, type Ansicht } from '../daten/merkmalskatalog.ts'
import { darstellungAus, farbenOhne, saatAusText, type Wert } from '../apfel3d/darstellung.ts'
import { ApfelBuehne } from '../apfel3d/Buehne.tsx'
import { Schnittansicht, type Schnittart } from '../apfel3d/Schnitt.tsx'
import { zurueck } from '../ui/router.ts'
import { Ablaufkopf, Laden, NichtGefunden } from '../ui/Seite.tsx'
import { Zurueck, Pfeil } from '../ui/symbole.tsx'
import { useBlobUrl } from './Baum.tsx'

// Parametermodus: Rundgang durch die Merkmale am eigenen Apfel. Je Merkmal ein einzelner Apfel aus
// den eigenen Fotos (wischbar), das 3D-Modell auf die besprochene Stelle gezoomt, die erkannte
// Ausprägung, die anderen Ausprägungen zum Umschalten und eine Erklärung.

const FOTO_ZU_ANSICHT: Record<Ansicht, number> = {
  foto1_laengshaelfte_schale: 0, foto2_laengsscheibe: 1, foto3_querhaelfte_kelch: 2,
  foto3_querhaelfte_stiel: 2, foto3_kerne: 2, foto4_querscheibe: 3,
}
const FOTONAMEN = ['Längshälfte', 'Längsscheibe', 'Querhälfte', 'Querscheibe']

// ------------------------------------------------------------------ Blick auf die besprochene Stelle

interface Fokus { art: 'ganz' | Schnittart; zoom: number; zielY: number; hoehe: number }

const STIEL: Fokus = { art: 'ganz', zoom: 0.5, zielY: 0.3, hoehe: 1.0 }
const KELCH: Fokus = { art: 'ganz', zoom: 0.5, zielY: -0.3, hoehe: -1.55 }

function fokusFuer(m: Merkmal): Fokus {
  if (m.id.startsWith('stiel') || m.id === 'schale_berostung_stielgrube') return STIEL
  if (m.id.startsWith('kelchgrube') || m.id === 'kelch_offenheit' || m.id === 'schale_berostung_kelchgrube' || m.id === 'frucht_kronung') return KELCH
  if (m.id === 'kelchhoehle_form') return { art: 'laengs', zoom: 0.6, zielY: 0, hoehe: 0 }
  if (m.id === 'kernfaecher_oeffnung' || m.id === 'kernhaus_achse') return { art: 'quer', zoom: 0.55, zielY: 0, hoehe: 0 }
  if (m.gruppe === 'kernhaus' || m.gruppe === 'kerne') return { art: 'laengs', zoom: 0.55, zielY: 0, hoehe: 0 }
  if (m.gruppe === 'fleisch') return { art: 'laengs', zoom: 0.9, zielY: 0, hoehe: 0 }
  if (m.id.startsWith('schale_lentizellen')) return { art: 'ganz', zoom: 0.5, zielY: 0.05, hoehe: 0 }
  if (m.gruppe === 'schale') return { art: 'ganz', zoom: 0.8, zielY: 0, hoehe: 0 }
  return { art: 'ganz', zoom: 1, zielY: -0.03, hoehe: 0 }
}

// ------------------------------------------------------------------ Seite

export default function RundgangSeite({ id }: { id: string }) {
  const { baeume, geladen } = useBaeume()
  const baum = baeume.find((b) => b.id === id)
  const satz = baum ? letzterFotosatz(baum) : undefined
  const [schritt, setSchritt] = useState(0)
  const [vorschau, setVorschau] = useState<string | null>(null)
  const [fertig, setFertig] = useState(false)

  // Merkmale mit Bezug zu den Fotos, in Katalogreihenfolge
  const merkmale = useMemo(() => MERKMALE.filter((m) => m.ansichten.length > 0 && m.auspraegungen), [])
  const werte: Wert[] = useMemo(() => (baum ? [...baum.angaben, ...(satz?.messung?.werte ?? [])] : []), [baum, satz])
  const m: Merkmal | undefined = merkmale[schritt]
  const eigen = m ? werte.find((w) => w.merkmal === m.id) : undefined
  const korrigiert = m ? baum?.angaben.some((a) => a.merkmal === m.id) : false
  const letzter = schritt === merkmale.length - 1

  const p = useMemo(() => {
    const ueber = m && vorschau !== null ? [{ merkmal: m.id, wert: vorschau }] : []
    const korrigiert = [...(baum?.angaben ?? []), ...ueber].map((w) => w.merkmal)
    return darstellungAus([...ueber, ...werte], farbenOhne(satz?.messung?.farben, korrigiert), saatAusText(id)).p
  }, [m, vorschau, werte, satz, id, baum])

  if (!geladen) return <Laden />
  if (!baum || !m) return <NichtGefunden text="Diesen Baum gibt es nicht mehr." />
  const fokus = fokusFuer(m)

  const speichern = async (code: string) => {
    await aktualisiereBaum(baum.id, (b) => ({ ...b, angaben: [...b.angaben.filter((a) => a.merkmal !== m.id), { merkmal: m.id, wert: code }] }))
  }
  // Eine gewählte Ausprägung wird beim Weiterblättern gespeichert, wenn vorher nichts angegeben war;
  // eine vorhandene Angabe ändert nur der Knopf „übernehmen“.
  const auswahlSichern = async () => { if (vorschau !== null && !eigen) await speichern(vorschau) }
  const gehe = async (n: number) => {
    await auswahlSichern()
    setSchritt(Math.max(0, Math.min(merkmale.length - 1, n)))
    setVorschau(null)
  }
  const abschliessen = async () => {
    await auswahlSichern()
    setFertig(true)
    // zurück zum Baumblatt, von dem der Rundgang meist geöffnet wurde (kein doppelter Verlaufseintrag)
    setTimeout(() => zurueck(`/baum/${id}`), 900)
  }
  const zuruecksetzen = async () => {
    await aktualisiereBaum(baum.id, (b) => ({ ...b, angaben: b.angaben.filter((a) => a.merkmal !== m.id) }))
  }

  return (
    <div className="seite" style={{ paddingBottom: 30 }}>
      <Ablaufkopf name={GRUPPEN[m.gruppe]} schritt={`${schritt + 1} von ${merkmale.length}`}
        zurueck={schritt > 0 ? () => gehe(schritt - 1) : undefined}
        schliessen={async () => { await auswahlSichern(); zurueck(`/baum/${id}`) }} schliessenLabel="Rundgang beenden" />

      <h1 className="name titel-schritt" style={{ marginTop: 6 }}>{m.name}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
        {satz ? <Einzelaepfel satz={satz} merkmal={m} /> : <div className="sehr-klein">Keine Fotos</div>}
        <div style={{ position: 'relative', aspectRatio: '3 / 4', margin: '0 -8px' }}>
          {fokus.art === 'ganz'
            ? <ApfelBuehne aepfel={[p]} className="buehne" zoom={fokus.zoom} zielY={fokus.zielY} blickHoehe={fokus.hoehe} />
            : <Schnittansicht p={p} className="buehne" art={fokus.art} zoom={fokus.zoom} />}
        </div>
      </div>

      <div className="karte-papier" style={{ marginTop: 12 }}>
        <div className="sehr-klein">{korrigiert ? 'Deine Angabe' : eigen ? 'Erkannt' : vorschau !== null ? 'Deine Auswahl, wird beim Weiterblättern gespeichert' : 'Noch nicht erfasst'}</div>
        <div style={{ fontSize: 24 }}>{eigen ? auspraegungLabel(m.id, eigen.wert) : vorschau !== null ? auspraegungLabel(m.id, vorschau) : '–'}</div>
        <p className="klein" style={{ margin: '6px 0 0' }}>{m.erklaerung}</p>
        {!eigen && vorschau === null && <p className="sehr-klein kursiv" style={{ margin: '6px 0 0' }}>Wird noch nicht automatisch erfasst. Wähle unten, was du auf dem Foto siehst; das Modell zeigt die Ausprägung zum Vergleich.</p>}
      </div>

      <div className="sehr-klein" style={{ margin: '14px 0 6px' }}>Mögliche Ausprägungen, im Modell umschaltbar:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {m.auspraegungen!.map((a) => {
          const istEigen = eigen && String(eigen.wert) === a.code
          const aktiv = vorschau === a.code || (vorschau === null && istEigen)
          return (
            <button key={a.code} className={`chip ${aktiv ? 'an' : ''}`} onClick={() => setVorschau(vorschau === a.code ? null : a.code)} title={a.beschreibung}>
              {a.label}{istEigen ? <span className="sehr-klein" style={{ color: 'inherit', opacity: 0.8 }}> (bisher)</span> : null}
            </button>
          )
        })}
      </div>
      {vorschau !== null && eigen && String(eigen.wert) !== vorschau && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="knopf" onClick={async () => { await speichern(vorschau); setVorschau(null) }}>„{auspraegungLabel(m.id, vorschau)}“ übernehmen</button>
        </div>
      )}
      {korrigiert && vorschau === null && <button className="knopf leise" style={{ marginTop: 10 }} onClick={zuruecksetzen}>Eigene Angabe entfernen</button>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
        <button className="knopf leise" disabled={schritt === 0} onClick={() => gehe(schritt - 1)}><Zurueck /> Zurück</button>
        {letzter
          ? <button className="knopf haupt" disabled={fertig} onClick={abschliessen}>{fertig ? 'Gespeichert' : 'Fertig'}</button>
          : <button className="knopf haupt" onClick={() => gehe(schritt + 1)}>Weiter <Pfeil /></button>}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Einzelne Äpfel aus den Fotos

interface Element { foto: number; nr: number; anzahl: number; x: number; y: number; w: number; h: number; art: 'frucht' | 'kerne' | 'blatt' }

/** Alle Apfelstücke aller vier Fotos als Liste; ohne Ausschnitte das ganze Blatt */
function elementeAus(satz: Fotosatz): Element[] {
  const l: Element[] = []
  for (let f = 0; f < 4; f++) {
    if (!(satz.blatt?.[f] ?? satz.vorschau?.[f] ?? satz.fotos[f])) continue
    const a = satz.ausschnitte?.[f]
    if (a?.length) a.forEach((x, k) => l.push({ foto: f, nr: k, anzahl: a.length, ...x }))
    else l.push({ foto: f, nr: 0, anzahl: 1, x: 0, y: 0, w: 1, h: 1, art: 'blatt' })
  }
  return l
}

function Einzelaepfel({ satz, merkmal }: { satz: Fotosatz; merkmal: Merkmal }) {
  const elemente = useMemo(() => elementeAus(satz), [satz])
  const urls = [
    useBlobUrl(satz.blatt?.[0] ?? satz.vorschau?.[0] ?? satz.fotos[0]),
    useBlobUrl(satz.blatt?.[1] ?? satz.vorschau?.[1] ?? satz.fotos[1]),
    useBlobUrl(satz.blatt?.[2] ?? satz.vorschau?.[2] ?? satz.fotos[2]),
    useBlobUrl(satz.blatt?.[3] ?? satz.vorschau?.[3] ?? satz.fotos[3]),
  ]
  // passendes Foto zum Merkmal vorwählen; Kerne zeigen die Kernreihe
  const vorwahl = useMemo(() => {
    const f = FOTO_ZU_ANSICHT[merkmal.ansichten[0]]
    const kerne = merkmal.gruppe === 'kerne' ? elemente.findIndex((e) => e.art === 'kerne') : -1
    if (kerne >= 0) return kerne
    const i = elemente.findIndex((e) => e.foto === f)
    return i >= 0 ? i : 0
  }, [merkmal, elemente])
  const [i, setI] = useState(vorwahl)
  useEffect(() => setI(vorwahl), [vorwahl])
  const zug = useRef<number | null>(null)
  const e = elemente[i]
  if (!e) return <div className="sehr-klein">Keine Fotos</div>
  const url = urls[e.foto]
  const blaettern = (d: number) => setI((i + d + elemente.length) % elemente.length)
  // Seitenverhältnis des Ausschnitts (Blattbild im Hochformat 204 : 291 mm)
  const verhaeltnis = (e.w * 204) / (e.h * 291)
  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{ aspectRatio: '3 / 4', background: 'var(--papier-3)', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'pan-y', position: 'relative' }}
        onPointerDown={(ev) => { zug.current = ev.clientX }}
        onPointerUp={(ev) => { if (zug.current !== null && Math.abs(ev.clientX - zug.current) > 30) blaettern(ev.clientX < zug.current ? 1 : -1); zug.current = null }}
      >
        {url && (
          <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: `${verhaeltnis}`, ...(verhaeltnis > 0.75 ? { width: '100%' } : { height: '100%' }) }}>
            <img src={url} alt={`${FOTONAMEN[e.foto]} ${e.nr + 1}`} draggable={false}
              style={{ position: 'absolute', width: `${100 / e.w}%`, height: `${100 / e.h}%`, left: `${(-e.x / e.w) * 100}%`, top: `${(-e.y / e.h) * 100}%`, maxWidth: 'none' }} />
          </div>
        )}
        {elemente.length > 1 && <>
          <button className="rund-knopf" aria-label="Vorheriger Apfel" onClick={() => blaettern(-1)} style={{ position: 'absolute', left: 2, top: '50%', marginTop: -22, opacity: 0.85 }}><Zurueck /></button>
          <button className="rund-knopf" aria-label="Nächster Apfel" onClick={() => blaettern(1)} style={{ position: 'absolute', right: 2, top: '50%', marginTop: -22, opacity: 0.85 }}><Pfeil /></button>
        </>}
      </div>
      <figcaption className="sehr-klein" style={{ marginTop: 2 }}>
        Foto {e.foto + 1}: {e.art === 'kerne' ? 'Kerne' : e.art === 'blatt' ? 'ganzes Blatt' : `${FOTONAMEN[e.foto]} ${e.nr + 1} von ${elemente.filter((x) => x.foto === e.foto && x.art === 'frucht').length}`}
      </figcaption>
    </figure>
  )
}
