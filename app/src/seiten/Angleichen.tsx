import { useEffect, useMemo, useRef, useState } from 'react'
import { useBaeume, aktualisiereBaum, letzterFotosatz } from '../daten/baeume.ts'
import { useSortenindex } from '../daten/sorten.ts'
import { modellFuerBaum } from '../daten/baumModell.ts'
import { merkmaleAusParametern, type ApfelParameter, type DeckfarbeArt } from '../apfel3d/darstellung.ts'
import { ApfelBuehne } from '../apfel3d/Buehne.tsx'
import { Schnittansicht } from '../apfel3d/Schnitt.tsx'
import { MERKMAL_NACH_ID } from '../daten/merkmalskatalog.ts'
import { zurueck } from '../ui/router.ts'
import { Zurueck } from '../ui/symbole.tsx'
import { useBlobUrl } from './Baum.tsx'

// Modell angleichen: echtes Foto neben dem 3D-Apfel. Farben per Pipette aus dem Foto abnehmen,
// Form, Kernhaus, Kerne, Stiel und Kelch mit Reglern einstellen. Gespeichert werden die Parameter
// am Fotosatz und die daraus abgeleiteten Katalogwerte als eigene Angaben (für den Abgleich).

type Ansicht = 'schale' | 'kelchstiel' | 'laengs' | 'quer'
type Schluessel = keyof ApfelParameter

const ANSICHTEN: { id: Ansicht; titel: string; foto: number }[] = [
  { id: 'schale', titel: 'Schale', foto: 0 },
  { id: 'kelchstiel', titel: 'Kelch und Stiel', foto: 2 },
  { id: 'laengs', titel: 'Längsschnitt', foto: 1 },
  { id: 'quer', titel: 'Querschnitt', foto: 3 },
]

interface Pipette { schluessel: Schluessel; titel: string; klein?: boolean }

const PIPETTEN: Record<Ansicht, Pipette[]> = {
  schale: [
    { schluessel: 'grundfarbe', titel: 'Grundfarbe' },
    { schluessel: 'deckfarbe', titel: 'Deckfarbe' },
    { schluessel: 'punkteFarbe', titel: 'Schalenpunkte', klein: true },
    { schluessel: 'punkteHof', titel: 'Hof um die Punkte' },
    { schluessel: 'rostfarbe', titel: 'Rost' },
  ],
  kelchstiel: [
    { schluessel: 'stielFarbe', titel: 'Stiel', klein: true },
    { schluessel: 'kelchFarbe', titel: 'Kelch', klein: true },
    { schluessel: 'rostfarbe', titel: 'Rost' },
  ],
  laengs: [
    { schluessel: 'fleischfarbe', titel: 'Fruchtfleisch' },
    { schluessel: 'kernFarbe', titel: 'Kerne', klein: true },
  ],
  quer: [
    { schluessel: 'fleischfarbe', titel: 'Fruchtfleisch' },
    { schluessel: 'kernFarbe', titel: 'Kerne', klein: true },
  ],
}

interface Regler { schluessel: Schluessel; titel: string; min: number; max: number; schritt: number; einheit?: string; links?: string; rechts?: string }

const REGLER: Record<Ansicht, Regler[]> = {
  schale: [
    { schluessel: 'hoeheZuBreite', titel: 'Höhe zu Breite', min: 0.6, max: 1.2, schritt: 0.01, links: 'flach', rechts: 'hoch' },
    { schluessel: 'konisch', titel: 'Kegelform', min: -0.15, max: 0.3, schritt: 0.01, links: 'zum Kelch breit', rechts: 'zum Stiel breit' },
    { schluessel: 'walze', titel: 'Walzenform', min: 0, max: 1, schritt: 0.01, links: 'rund', rechts: 'kantig' },
    { schluessel: 'rippung', titel: 'Rippen', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'asymmetrie', titel: 'Schiefe', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'achseKruemmung', titel: 'Krumme Achse', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'unregelmaessig', titel: 'Beulen und Dellen', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'deckfarbeAnteil', titel: 'Anteil der Deckfarbe', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'rostWangen', titel: 'Rost auf der Fläche', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'rostStiel', titel: 'Rost in der Stielgrube', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'punkteDichte', titel: 'Schalenpunkte: Anzahl', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'punkteGroesse', titel: 'Schalenpunkte: Größe', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'glanz', titel: 'Glanz', min: 0, max: 1, schritt: 0.01, links: 'matt', rechts: 'glänzend' },
    { schluessel: 'bereifung', titel: 'Bereifung (Duftfilm)', min: 0, max: 1, schritt: 0.01 },
  ],
  kelchstiel: [
    { schluessel: 'stielLaengeMm', titel: 'Stiellänge', min: 2, max: 40, schritt: 0.5, einheit: 'mm' },
    { schluessel: 'stielDickeMm', titel: 'Stieldicke', min: 1.2, max: 6, schritt: 0.1, einheit: 'mm' },
    { schluessel: 'stielKruemmung', titel: 'Stiel gebogen', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'stielgrubeTiefe', titel: 'Stielgrube tief', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'stielgrubeWeite', titel: 'Stielgrube weit', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kelchgrubeTiefe', titel: 'Kelchgrube tief', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kelchgrubeWeite', titel: 'Kelchgrube weit', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kelchOffen', titel: 'Kelch offen', min: 0, max: 1, schritt: 0.01, links: 'geschlossen', rechts: 'offen' },
    { schluessel: 'kelchblattLaenge', titel: 'Kelchblätter lang', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kronung', titel: 'Kronung am Kelch', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'rostKelch', titel: 'Rost in der Kelchgrube', min: 0, max: 1, schritt: 0.01 },
  ],
  laengs: [
    { schluessel: 'kernhausBreite', titel: 'Kernhaus breit', min: 0.12, max: 0.5, schritt: 0.01 },
    { schluessel: 'kernhausHoehe', titel: 'Kernhaus hoch', min: 0.2, max: 0.75, schritt: 0.01 },
    { schluessel: 'kernhausSpitze', titel: 'Kernhaus spitz', min: 0, max: 1, schritt: 0.01, links: 'rund', rechts: 'spitz' },
    { schluessel: 'kernhausLage', titel: 'Lage des Kernhauses', min: -1, max: 1, schritt: 0.01, links: 'zum Kelch', rechts: 'zum Stiel' },
    { schluessel: 'kernfachGroesse', titel: 'Kernfächer groß', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kernfaecherOffen', titel: 'Kernfächer offen', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kernLaengeMm', titel: 'Kernlänge', min: 4, max: 12, schritt: 0.1, einheit: 'mm' },
    { schluessel: 'stielgrubeTiefe', titel: 'Stielgrube tief', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kelchgrubeTiefe', titel: 'Kelchgrube tief', min: 0, max: 1, schritt: 0.01 },
  ],
  quer: [
    { schluessel: 'kernhausBreite', titel: 'Kernhaus breit', min: 0.12, max: 0.5, schritt: 0.01 },
    { schluessel: 'kernhausSpitze', titel: 'Stern ausgeprägt', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kernfachGroesse', titel: 'Kernfächer groß', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kernfaecherOffen', titel: 'Kernfächer offen', min: 0, max: 1, schritt: 0.01 },
    { schluessel: 'kernLaengeMm', titel: 'Kernlänge', min: 4, max: 12, schritt: 0.1, einheit: 'mm' },
    { schluessel: 'rippung', titel: 'Rippen', min: 0, max: 1, schritt: 0.01 },
  ],
}

// Auswahl nach Katalog-Ausprägungen
const AUSWAHL: Record<Ansicht, { schluessel: Schluessel; merkmal: string; mehrfach?: boolean }[]> = {
  schale: [{ schluessel: 'deckfarbeArt', merkmal: 'schale_deckfarbe_art', mehrfach: true }],
  kelchstiel: [],
  laengs: [{ schluessel: 'kernhausForm', merkmal: 'kernhaus_form' }, { schluessel: 'kelchhoehle', merkmal: 'kelchhoehle_form' }, { schluessel: 'kernForm', merkmal: 'kerne_form' }],
  quer: [{ schluessel: 'kernForm', merkmal: 'kerne_form' }],
}

export default function AngleichenSeite({ id }: { id: string }) {
  const { baeume } = useBaeume()
  const index = useSortenindex()
  const baum = baeume.find((b) => b.id === id)
  const satz = baum ? letzterFotosatz(baum) : undefined
  const start = useMemo(() => (baum ? modellFuerBaum(baum, index).p : null), [baum?.id, index]) // eslint-disable-line
  const [p, setP] = useState<ApfelParameter | null>(null)
  const [geaendert, setGeaendert] = useState<Set<Schluessel>>(new Set())
  const [ansicht, setAnsicht] = useState<Ansicht>('schale')
  const [pipette, setPipette] = useState<Pipette | null>(null)
  const [blickKelch, setBlickKelch] = useState<'stiel' | 'kelch'>('kelch')
  const [gespeichert, setGespeichert] = useState(false)
  useEffect(() => { if (start && !p) setP(start) }, [start, p])

  const a = ANSICHTEN.find((x) => x.id === ansicht)!
  const fotoKey = satz ? satz.blatt?.[a.foto] ?? satz.vorschau?.[a.foto] ?? satz.fotos[a.foto] : null
  const fotoUrl = useBlobUrl(fotoKey)

  if (!baum || !p) return <div className="seite"><p className="hinweis">Lädt …</p></div>

  const setze = <K extends Schluessel>(k: K, v: ApfelParameter[K]) => {
    setP({ ...p, [k]: v })
    setGeaendert(new Set(geaendert).add(k))
    setGespeichert(false)
  }

  const speichern = async () => {
    if (!satz) return
    const teil: Record<string, unknown> = {}
    for (const k of geaendert) teil[k] = p[k]
    const neueWerte = merkmaleAusParametern(p, [...geaendert])
    const betroffen = new Set(neueWerte.map((w) => w.merkmal))
    await aktualisiereBaum(baum.id, (b) => ({
      ...b,
      fotosaetze: b.fotosaetze.map((s) => (s.id === satz.id ? { ...s, modell: { ...(s.modell ?? {}), ...teil } } : s)),
      angaben: [...b.angaben.filter((x) => !betroffen.has(x.merkmal)), ...neueWerte],
    }))
    setGespeichert(true)
  }

  return (
    <div className="seite" style={{ paddingTop: 0, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 4, background: 'var(--papier)', padding: 'var(--oben) 0 8px' }}>
        <button className="rund-knopf" onClick={() => zurueck(`/baum/${id}`)} aria-label="Zurück"><Zurueck /></button>
        <div style={{ flex: 1 }} className="kapitaelchen">Modell angleichen</div>
        <button className="knopf haupt" disabled={!geaendert.size} onClick={speichern}>{gespeichert ? 'Gespeichert' : 'Speichern'}</button>
      </div>

      <div className="chips" style={{ marginBottom: 8 }}>
        {ANSICHTEN.map((x) => (
          <button key={x.id} className={`chip ${ansicht === x.id ? 'an' : ''}`} onClick={() => { setAnsicht(x.id); setPipette(null) }}>{x.titel}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Fotoflaeche url={fotoUrl} pipette={pipette} onFarbe={(hex) => { if (pipette) { setze(pipette.schluessel, hex as never); setPipette(null) } }} />
        <div style={{ position: 'relative', aspectRatio: '210 / 297', background: 'var(--papier-3)', borderRadius: 4, border: '0.5px solid var(--linie)', overflow: 'hidden' }}>
          {ansicht === 'schale' && <ApfelBuehne aepfel={[p]} className="buehne" />}
          {ansicht === 'kelchstiel' && <ApfelBuehne aepfel={[p]} className="buehne" blickHoehe={blickKelch === 'kelch' ? -1.6 : 1.0} />}
          {ansicht === 'laengs' && <Schnittansicht p={p} art="laengs" className="buehne" />}
          {ansicht === 'quer' && <Schnittansicht p={p} art="quer" className="buehne" />}
        </div>
      </div>
      {ansicht === 'kelchstiel' && (
        <div className="chips" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
          <button className={`chip ${blickKelch === 'kelch' ? 'an' : ''}`} onClick={() => setBlickKelch('kelch')}>Kelch (von unten)</button>
          <button className={`chip ${blickKelch === 'stiel' ? 'an' : ''}`} onClick={() => setBlickKelch('stiel')}>Stiel (von oben)</button>
        </div>
      )}

      <h2 className="kapitaelchen" style={{ fontSize: 16, color: 'var(--tinte-2)', margin: '16px 0 4px' }}>Farben aus dem Foto</h2>
      <p className="sehr-klein" style={{ margin: '0 0 8px' }}>{pipette ? `Tippe im Foto auf: ${pipette.titel}${pipette.klein ? ' (ein einzelner Punkt genügt; zum Vergrößern die Lupe nutzen)' : ''}.` : 'Wähle, welche Farbe du abnehmen willst, und tippe dann im Foto auf die Stelle.'}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PIPETTEN[ansicht].map((x) => {
          const wert = p[x.schluessel] as string | null
          return (
            <button key={x.schluessel} className={`chip ${pipette?.schluessel === x.schluessel ? 'an' : ''}`} onClick={() => setPipette(pipette?.schluessel === x.schluessel ? null : x)}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: wert ?? 'transparent', border: '0.5px solid var(--linie-stark)', display: 'inline-block' }} />
              {x.titel}{geaendert.has(x.schluessel) ? ' ·' : ''}
            </button>
          )
        })}
        {ansicht === 'schale' && p.punkteHof && (
          <button className="chip" onClick={() => setze('punkteHof', null)}>Ohne Hof</button>
        )}
      </div>

      {AUSWAHL[ansicht].map((x) => {
        const m = MERKMAL_NACH_ID[x.merkmal]
        const aktuell = p[x.schluessel]
        return (
          <div key={x.schluessel} style={{ marginTop: 14 }}>
            <div className="klein" style={{ marginBottom: 5 }}>{m.name}</div>
            <div className="chips" style={{ flexWrap: 'wrap' }}>
              {m.auspraegungen!.map((o) => {
                const an = x.mehrfach ? (aktuell as string[]).includes(o.code) : aktuell === o.code
                return (
                  <button key={o.code} className={`chip ${an ? 'an' : ''}`} onClick={() => {
                    if (x.mehrfach) {
                      const l = aktuell as DeckfarbeArt[]
                      const neu = an ? l.filter((c) => c !== o.code) : [...l, o.code as DeckfarbeArt]
                      setze(x.schluessel, (neu.length ? neu : ['verwaschen']) as never)
                    } else setze(x.schluessel, o.code as never)
                  }}>{o.label}</button>
                )
              })}
            </div>
          </div>
        )
      })}
      {ansicht === 'laengs' && (
        <div className="chips" style={{ marginTop: 12 }}>
          <button className={`chip ${p.achseOffen ? 'an' : ''}`} onClick={() => setze('achseOffen', !p.achseOffen)}>Achse hohl</button>
        </div>
      )}

      <h2 className="kapitaelchen" style={{ fontSize: 16, color: 'var(--tinte-2)', margin: '18px 0 4px' }}>Form und Einzelheiten</h2>
      {REGLER[ansicht].map((r) => (
        <ReglerZeile key={r.schluessel} r={r} wert={p[r.schluessel] as number} geaendert={geaendert.has(r.schluessel)} onChange={(v) => setze(r.schluessel, v as never)} />
      ))}
      <p className="sehr-klein kursiv" style={{ marginTop: 14 }}>
        Deine Einstellungen gelten für diesen Baum. Aus Farben und Formen leitet die App die passenden Merkmale ab (zum Beispiel grün umhöfte Schalenpunkte oder ein spindelförmiges Kernhaus) und nutzt sie beim Abgleich mit den Sorten.
      </p>
    </div>
  )
}

function ReglerZeile({ r, wert, geaendert, onChange }: { r: Regler; wert: number; geaendert: boolean; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'block', margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }} className="klein">
        <span style={{ color: 'var(--tinte)' }}>{r.titel}{geaendert ? ' ·' : ''}</span>
        <span>{r.einheit ? `${wert.toFixed(1)} ${r.einheit}` : ''}</span>
      </div>
      <input type="range" min={r.min} max={r.max} step={r.schritt} value={wert} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--tinte)' }} />
      {(r.links || r.rechts) && (
        <div className="sehr-klein" style={{ display: 'flex', justifyContent: 'space-between', marginTop: -4 }}><span>{r.links}</span><span>{r.rechts}</span></div>
      )}
    </label>
  )
}

/** Foto mit Lupe; tippen nimmt eine Farbe ab, wenn eine Pipette gewählt ist */
function Fotoflaeche({ url, pipette, onFarbe }: { url: string | null; pipette: Pipette | null; onFarbe: (hex: string) => void }) {
  const [zoom, setZoom] = useState(1)
  const [marke, setMarke] = useState<{ x: number; y: number; farbe: string } | null>(null)
  const pixel = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null)
  useEffect(() => {
    pixel.current = null
    if (!url) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const g = c.getContext('2d', { willReadFrequently: true })!
      g.drawImage(img, 0, 0)
      pixel.current = { data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }
    }
    img.src = url
  }, [url])

  const abnehmen = (e: React.MouseEvent<HTMLImageElement>) => {
    const px = pixel.current
    if (!pipette || !px) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - r.left) / r.width) * px.w)
    const y = Math.round(((e.clientY - r.top) / r.height) * px.h)
    const at = (xx: number, yy: number) => {
      const o = (Math.min(px.h - 1, Math.max(0, yy)) * px.w + Math.min(px.w - 1, Math.max(0, xx))) * 4
      return [px.data[o], px.data[o + 1], px.data[o + 2]]
    }
    let rgb: number[]
    if (pipette.klein) {
      // kleiner Gegenstand (Punkt, Kern, Stiel): Pixel, das am stärksten von seiner Umgebung abweicht
      const umgebung = [0, 0, 0]
      let n = 0
      for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const c = at(x + dx, y + dy); umgebung[0] += c[0]; umgebung[1] += c[1]; umgebung[2] += c[2]; n++ }
      const m = umgebung.map((v) => v / n)
      let best = at(x, y), bd = -1
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const c = at(x + dx, y + dy)
        const d = Math.abs(c[0] - m[0]) + Math.abs(c[1] - m[1]) + Math.abs(c[2] - m[2])
        if (d > bd) { bd = d; best = c }
      }
      rgb = best
    } else {
      const s = [0, 0, 0]
      let n = 0
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const c = at(x + dx, y + dy); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; n++ }
      rgb = s.map((v) => v / n)
    }
    const hex = '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
    setMarke({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, farbe: hex })
    onFarbe(hex)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ aspectRatio: '210 / 297', overflow: 'auto', background: 'var(--papier-3)', borderRadius: 4, border: `0.5px solid ${pipette ? 'var(--tinte)' : 'var(--linie)'}`, cursor: pipette ? 'crosshair' : 'default' }}>
        {url ? (
          <div style={{ position: 'relative', width: `${zoom * 100}%` }}>
            <img src={url} alt="Dein Foto" onClick={abnehmen} draggable={false} style={{ width: '100%', display: 'block' }} />
            {marke && <span style={{ position: 'absolute', left: `${marke.x * 100}%`, top: `${marke.y * 100}%`, width: 14, height: 14, marginLeft: -7, marginTop: -7, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #000', background: marke.farbe, pointerEvents: 'none' }} />}
          </div>
        ) : <p className="sehr-klein" style={{ padding: 8 }}>Kein Foto für diese Ansicht.</p>}
      </div>
      <div style={{ position: 'absolute', right: 4, bottom: 4, display: 'flex', gap: 4 }}>
        {[1, 2, 4].map((z) => (
          <button key={z} onClick={() => setZoom(z)} className={`chip ${zoom === z ? 'an' : ''}`} style={{ padding: '2px 8px', fontSize: 13, background: zoom === z ? undefined : 'var(--papier-3)' }}>{z}×</button>
        ))}
      </div>
    </div>
  )
}
