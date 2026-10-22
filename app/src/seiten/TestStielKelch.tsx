// Entwicklerseite für Stiel und Kelch (#/test-stiel): Nahansichten mit verschiedenen Parametern,
// Blick in Stiel- und Kelchgrube, Medaillons und ein Referenzfoto zum Vergleichen.
import { useMemo, useState, type ChangeEvent, type MouseEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Apfel } from '../apfel3d/Apfel.tsx'
import { Umgebung, Licht, Medaillon } from '../apfel3d/Buehne.tsx'
import { STANDARD, type ApfelParameter } from '../apfel3d/darstellung.ts'
import { pole } from '../apfel3d/geometrie.ts'
import { baueStiel, baueKelch, entsorgen } from '../apfel3d/stielKelch.ts'

type Teil = Partial<ApfelParameter>
type Fokus = 'alle' | 'stiel' | 'kelch' | 'ganz'

const VORLAGEN: { name: string; p: Teil }[] = [
  { name: 'Standard', p: {} },
  {
    // Querhälften im Beispielfoto (vermutlich Ananasrenette, unbestätigt): kurzer, kräftiger,
    // graubrauner Stiel; Kelch geschlossen bis halboffen, dunkel, kleine gedrehte Blättchen
    name: 'Beispielfoto',
    p: {
      breiteMm: 62, hoeheZuBreite: 0.86, grundfarbe: '#e2cf4a', deckfarbeAnteil: 0, punkteDichte: 0.6, punkteFarbe: '#8a9a52',
      stielLaengeMm: 9, stielDickeMm: 3, stielKruemmung: 0.15, stielFarbe: '#6d604c', stielgrubeTiefe: 0.45, stielgrubeWeite: 0.35,
      kelchOffen: 0.1, kelchblattLaenge: 0.35, kelchFarbe: '#4e3f2a', kelchgrubeTiefe: 0.25, kelchgrubeWeite: 0.3, rostStiel: 0.35,
    },
  },
  { name: 'fleischig, keulig', p: { stielLaengeMm: 8, stielDickeMm: 4.2, stielKruemmung: 0.1, stielFarbe: '#6e6a3c' } },
  { name: 'lang, dünn, gebogen', p: { stielLaengeMm: 28, stielDickeMm: 2, stielKruemmung: 0.8, stielgrubeTiefe: 0.68, stielgrubeWeite: 0.5 } },
  { name: 'Kelch offen, lang', p: { kelchOffen: 1, kelchblattLaenge: 0.75, kelchgrubeTiefe: 0.4, kelchgrubeWeite: 0.55 } },
  { name: 'Kelch geschlossen', p: { kelchOffen: 0, kelchblattLaenge: 0.5 } },
  { name: 'rot, Stiel rötlich', p: { deckfarbe: '#a92a25', deckfarbeAnteil: 0.7, stielFarbe: '#6a4732', stielLaengeMm: 20, stielDickeMm: 2.4 } },
]

const REGLER: { k: keyof ApfelParameter; min: number; max: number; schritt: number }[] = [
  { k: 'stielLaengeMm', min: 3, max: 35, schritt: 0.5 },
  { k: 'stielDickeMm', min: 1.4, max: 5, schritt: 0.1 },
  { k: 'stielKruemmung', min: 0, max: 1, schritt: 0.05 },
  { k: 'stielgrubeTiefe', min: 0, max: 1, schritt: 0.05 },
  { k: 'stielgrubeWeite', min: 0, max: 1, schritt: 0.05 },
  { k: 'kelchOffen', min: 0, max: 1, schritt: 0.05 },
  { k: 'kelchblattLaenge', min: 0, max: 1, schritt: 0.05 },
  { k: 'kelchgrubeTiefe', min: 0, max: 1, schritt: 0.05 },
  { k: 'kelchgrubeWeite', min: 0, max: 1, schritt: 0.05 },
  { k: 'breiteMm', min: 45, max: 95, schritt: 1 },
  { k: 'saat', min: 1, max: 40, schritt: 1 },
]

interface AnsichtProps {
  p: ApfelParameter
  titel: string
  kamera: [number, number, number]
  ziel: [number, number, number]
  fov: number
  hoehe?: number
  schnitt?: THREE.Plane
}

/** Eine 3D-Ansicht mit fester Startkamera; drehbar und zoombar */
function Ansicht({ p, titel, kamera, ziel, fov, hoehe = 240, schnitt }: AnsichtProps) {
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ height: hoehe, borderRadius: 8, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, var(--papier-3), var(--papier-2))' }}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: kamera, fov, near: 0.01, far: 20 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, localClippingEnabled: true }}
        >
          <Umgebung />
          <Licht />
          <Apfel p={p} schnitt={schnitt} />
          <OrbitControls target={ziel} enablePan={false} minDistance={0.15} maxDistance={8} />
        </Canvas>
      </div>
      <figcaption className="sehr-klein" style={{ marginTop: 4 }}>{titel}</figcaption>
    </figure>
  )
}

/** Referenzfoto von der Festplatte laden und einen Ausschnitt vergrößern (Klick setzt die Mitte) */
function Referenz() {
  const [url, setUrl] = useState<string | null>(null)
  const [mitte, setMitte] = useState<[number, number]>([0.5, 0.5])
  const [zoom, setZoom] = useState(6)
  const laden = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setUrl(URL.createObjectURL(f))
  }
  const klick = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setMitte([(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height])
  }
  return (
    <section style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 18 }}>Referenzfoto</h2>
      <p className="sehr-klein">Foto wählen (z. B. docs/beispielbilder/foto3_…jpg), auf Kelch oder Stiel tippen, Zoom einstellen.</p>
      <input type="file" accept="image/*" onChange={laden} />
      {url && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <div onClick={klick} style={{ position: 'relative', cursor: 'crosshair' }}>
            <img src={url} style={{ width: '100%', display: 'block' }} alt="Referenz" />
            <div style={{
              position: 'absolute', left: `${mitte[0] * 100}%`, top: `${mitte[1] * 100}%`, width: `${100 / zoom}%`, aspectRatio: '1',
              transform: 'translate(-50%, -50%)', border: '1px solid red', pointerEvents: 'none',
            }} />
          </div>
          <div style={{
            aspectRatio: '1', backgroundImage: `url(${url})`, backgroundRepeat: 'no-repeat',
            backgroundSize: `${zoom * 100}% auto`, backgroundPosition: `${(mitte[0] * zoom - 0.5) / (zoom - 1) * 100}% ${mitte[1] * 100}%`, borderRadius: 8,
          }} />
          <label className="sehr-klein" style={{ gridColumn: '1 / 3' }}>
            Zoom {zoom}× <input type="range" min={2} max={14} step={1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
        </div>
      )}
    </section>
  )
}

function dreiecke(o: THREE.Object3D) {
  let n = 0
  o.traverse((x) => {
    const g = (x as THREE.Mesh).geometry
    if (g) n += (g.index ? g.index.count : g.getAttribute('position').count) / 3
  })
  return n
}

export default function TestStielKelchSeite() {
  const [vorlage, setVorlage] = useState(1)
  const [eigen, setEigen] = useState<Teil>({})
  const [schnittAn, setSchnittAn] = useState(false)
  const [gross, setGross] = useState(true)
  // Fokus auf einen Teil (bleibt im Browser gespeichert, damit Vergleichsrunden schneller gehen)
  const [fokus, setFokusRoh] = useState<Fokus>(() => {
    try { return (localStorage.getItem('testStielFokus') as Fokus) || 'alle' } catch { return 'alle' }
  })
  const setFokus = (f: Fokus) => { setFokusRoh(f); try { localStorage.setItem('testStielFokus', f) } catch { /* egal */ } }
  const zeige = (teil: Fokus) => fokus === 'alle' || fokus === teil
  const p: ApfelParameter = useMemo(() => ({ ...STANDARD, deckfarbeArt: [...STANDARD.deckfarbeArt], ...VORLAGEN[vorlage].p, ...eigen }), [vorlage, eigen])
  const pl = pole(p)
  const ls = (p.stielLaengeMm / p.breiteMm) * 0.5
  const sd = Math.max(0.42, ls * 5.5) // Kameraabstand für die Stielansicht
  const schnitt = useMemo(() => (schnittAn ? new THREE.Plane(new THREE.Vector3(0, 0, -1), 0) : undefined), [schnittAn])

  const zahlen = useMemo(() => {
    const s = baueStiel(p), k = baueKelch(p)
    const z = { stiel: dreiecke(s), kelch: dreiecke(k) }
    entsorgen(s); entsorgen(k)
    return z
  }, [p])

  const kelchVarianten = [0, 0.5, 1].map((o) => ({ ...p, kelchOffen: o }))

  return (
    <div className="seite">
      <h1 style={{ fontSize: 24 }}>Stiel und Kelch</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {VORLAGEN.map((v, i) => (
          <button key={v.name} className={i === vorlage ? 'knopf haupt' : 'knopf'} onClick={() => { setVorlage(i); setEigen({}) }}>{v.name}</button>
        ))}
      </div>
      <p className="sehr-klein">Dreiecke: Stiel {zahlen.stiel}, Kelch {zahlen.kelch}</p>

      <div className="sehr-klein" style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
        {(['alle', 'stiel', 'kelch', 'ganz'] as const).map((f) => (
          <label key={f}><input type="radio" checked={fokus === f} onChange={() => setFokus(f)} /> {f}</label>
        ))}
      </div>
      <label className="sehr-klein"><input type="checkbox" checked={gross} onChange={(e) => setGross(e.target.checked)} /> große Nahansichten</label>
      <div style={{ display: 'grid', gridTemplateColumns: gross ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
        {zeige('stiel') && <Ansicht p={p} titel="Stiel seitlich" hoehe={gross ? 340 : 240} kamera={[0.06 * sd, pl.stiel + ls * 0.9 + 0.5 * sd, 0.86 * sd]} ziel={[0, pl.stiel + ls * 0.9, 0]} fov={20} schnitt={schnitt} />}
        {zeige('stiel') && <Ansicht p={p} titel="Stielgrube von oben" hoehe={gross ? 340 : 240} kamera={[0, pl.stiel + 1.5, 0.12]} ziel={[0, pl.stiel, 0]} fov={14} schnitt={schnitt} />}
        {zeige('kelch') && <Ansicht p={p} titel="Kelch von unten" hoehe={gross ? 340 : 240} kamera={[0, pl.kelch - 1.5, 0.06]} ziel={[0, pl.kelch, 0]} fov={10} schnitt={schnitt} />}
        {zeige('kelch') && <Ansicht p={p} titel="Kelch schräg" hoehe={gross ? 340 : 240} kamera={[0.1, pl.kelch - 0.95, 0.75]} ziel={[0, pl.kelch, 0]} fov={11} schnitt={schnitt} />}
      </div>
      {fokus === 'kelch' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6, marginTop: 8 }}>
          {kelchVarianten.map((q, i) => (
            <Ansicht key={i} p={q} titel={`offen ${q.kelchOffen}`} hoehe={150} kamera={[0, pl.kelch - 1.5, 0.3]} ziel={[0, pl.kelch, 0]} fov={9} />
          ))}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        {zeige('ganz') && <Ansicht p={p} titel="Ganzer Apfel (Bühnenmaßstab)" kamera={[0, 0.45, 4.2]} ziel={[0, -0.03, 0]} fov={26} hoehe={360} schnitt={schnitt} />}
      </div>

      <h2 style={{ fontSize: 18, marginTop: 12 }}>Medaillons: Kelch geschlossen, halboffen, offen</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {kelchVarianten.map((q, i) => <Medaillon key={i} p={q} groesse={84} />)}
        <Medaillon p={p} groesse={56} />
      </div>

      <h2 style={{ fontSize: 18, marginTop: 12 }}>Parameter</h2>
      <label className="sehr-klein" style={{ display: 'block', marginBottom: 6 }}>
        <input type="checkbox" checked={schnittAn} onChange={(e) => setSchnittAn(e.target.checked)} /> Längsschnitt (prüft clippingPlanes)
      </label>
      {REGLER.map(({ k, min, max, schritt }) => (
        <label key={k} className="sehr-klein" style={{ display: 'grid', gridTemplateColumns: '9.5em 1fr 3em', gap: 6, alignItems: 'center' }}>
          {k}
          <input type="range" min={min} max={max} step={schritt} value={p[k] as number}
            onChange={(e) => setEigen((x) => ({ ...x, [k]: Number(e.target.value) }))} />
          <span>{Number(p[k]).toFixed(schritt < 1 ? 2 : 0)}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        {(['stielFarbe', 'kelchFarbe', 'grundfarbe'] as const).map((k) => (
          <label key={k} className="sehr-klein">{k} <input type="color" value={p[k]} onChange={(e) => setEigen((x) => ({ ...x, [k]: e.target.value }))} /></label>
        ))}
      </div>

      <Referenz />
    </div>
  )
}
