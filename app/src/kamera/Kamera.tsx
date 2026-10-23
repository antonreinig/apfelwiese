import { useEffect, useRef, useState, useCallback } from 'react'
import { Kreuz } from '../ui/symbole.tsx'
import { bewerteBefund, eckenBewegung, GRENZEN, type Blattbefund, type Hinweis } from './blatterkennung.ts'
import BlattWorker from './blattWorker.ts?worker'
import { meldeFehler } from '../ui/protokoll.ts'

// Kamera mit Live-Erkennung des A4-Blatts. Führt mit Hinweisen, bis alle vier Ecken im Bild
// sind und das Handy gerade über dem Blatt liegt, und löst dann selbst aus.

export interface Aufnahme {
  blob: Blob
  breite: number
  hoehe: number
  befund: Blattbefund | null
}

interface Props {
  onAufnahme: (a: Aufnahme) => void
  onAbbruch: () => void
  titel: string
  testfeed?: boolean
}

const ANALYSE_BREITE = 240
const ZOOM_WUNSCH = 2

export function Kamera({ onAufnahme, onAbbruch, titel, testfeed }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const overlay = useRef<HTMLCanvasElement>(null)
  const analyse = useRef<HTMLCanvasElement | null>(null)
  const worker = useRef<Worker | null>(null)
  const strom = useRef<MediaStream | null>(null)
  const letzter = useRef<Blattbefund | null>(null)
  const gutSeit = useRef<number | null>(null)
  const ausgeloest = useRef(false)
  const [hinweis, setHinweis] = useState<Hinweis>({ stufe: 'fehlt', text: 'Kamera wird gestartet …' })
  const [fortschritt, setFortschritt] = useState(0)
  const [fehler, setFehler] = useState('')
  const [zoom, setZoom] = useState<{ min: number; max: number; wert: number } | null>(null)
  const [info, setInfo] = useState('')
  const [geraete, setGeraete] = useState<MediaDeviceInfo[]>([])
  const [geraet, setGeraet] = useState<string>('')
  const [einstellungen, setEinstellungen] = useState(false)
  const [blase, setBlase] = useState({ x: 0, y: 0, sichtbar: false })
  const [auto, setAuto] = useState(true)
  const autoRef = useRef(auto)
  useEffect(() => { autoRef.current = auto }, [auto])

  // ---------------------------------------------------------------- Kamera starten
  useEffect(() => {
    let aktiv = true
    const v = video.current!
    async function start() {
      setFehler('')
      if (testfeed) {
        v.src = '/testfeed.mp4'
        v.loop = true
        v.muted = true
        await v.play().catch(() => {})
        setInfo('Testvideo')
        return
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: geraet
            ? { deviceId: { exact: geraet }, width: { ideal: 4032 }, height: { ideal: 3024 } }
            : { facingMode: { ideal: 'environment' }, width: { ideal: 4032 }, height: { ideal: 3024 } },
        })
        if (!aktiv) { s.getTracks().forEach((t) => t.stop()); return }
        strom.current = s
        v.srcObject = s
        await v.play().catch(() => {})
        const spur = s.getVideoTracks()[0]
        const caps = (spur.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { zoom?: { min: number; max: number } }
        if (caps.zoom && caps.zoom.max > caps.zoom.min) {
          const wert = Math.min(caps.zoom.max, Math.max(caps.zoom.min, ZOOM_WUNSCH))
          try { await spur.applyConstraints({ advanced: [{ zoom: wert } as MediaTrackConstraintSet] }) } catch { /* nicht unterstützt */ }
          setZoom({ min: caps.zoom.min, max: caps.zoom.max, wert })
        }
        const st = spur.getSettings()
        setInfo(`${st.width}×${st.height}${caps.zoom ? `, Zoom ${caps.zoom.min}–${caps.zoom.max}` : ', kein Zoom einstellbar'} · ${spur.label}`)
        const alle = await navigator.mediaDevices.enumerateDevices()
        if (aktiv) setGeraete(alle.filter((d) => d.kind === 'videoinput'))
      } catch (e) {
        if (!(e instanceof Error && e.name === 'NotAllowedError')) meldeFehler('kamera', e)
        setFehler(e instanceof Error && e.name === 'NotAllowedError'
          ? 'Kein Zugriff auf die Kamera. Erlaube den Zugriff in den Einstellungen oder nimm die Fotos mit der Kamera-App auf.'
          : 'Die Kamera lässt sich nicht starten. Nimm die Fotos mit der Kamera-App auf.')
      }
    }
    start()
    return () => {
      aktiv = false
      strom.current?.getTracks().forEach((t) => t.stop())
      strom.current = null
    }
  }, [geraet, testfeed])

  const zoomSetzen = async (wert: number) => {
    const spur = strom.current?.getVideoTracks()[0]
    if (!spur || !zoom) return
    try {
      await spur.applyConstraints({ advanced: [{ zoom: wert } as MediaTrackConstraintSet] })
      setZoom({ ...zoom, wert })
    } catch { /* ignorieren */ }
  }

  // ---------------------------------------------------------------- Auslösen
  const ausloesen = useCallback(async (automatisch = false) => {
    const v = video.current
    if (!v || !v.videoWidth || ausgeloest.current) return
    ausgeloest.current = true
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.92))
    // Ecken nur weitergeben, wenn das Bild ruhig und geprüft war; sonst wird auf dem Foto neu erkannt
    if (blob) onAufnahme({ blob, breite: c.width, hoehe: c.height, befund: automatisch ? letzter.current : null })
    else ausgeloest.current = false
  }, [onAufnahme])

  // ---------------------------------------------------------------- Analyse-Schleife
  useEffect(() => {
    const w = new BlattWorker()
    worker.current = w
    let wartet = false
    let nr = 0
    let lauf = 0
    let zuletzt = 0
    const glatt = { x: 0, y: 0 }
    w.onerror = () => { wartet = false }
    w.onmessage = (e: MessageEvent<{ befund: Blattbefund; nr: number }>) => {
      wartet = false
      const b = e.data.befund
      const bewegung = letzter.current ? eckenBewegung(letzter.current, b) : 1
      letzter.current = b
      const h = bewerteBefund(b)
      setHinweis((alt) => (alt.text === h.text ? alt : h))
      if (b.gefunden) {
        glatt.x += (b.neigung.x - glatt.x) * 0.4
        glatt.y += (b.neigung.y - glatt.y) * 0.4
        setBlase({ x: glatt.x, y: glatt.y, sichtbar: true })
      } else setBlase((s) => ({ ...s, sichtbar: false }))
      // Automatisch auslösen, wenn es 0,9 s lang gut und ruhig ist
      const jetzt = performance.now()
      if (h.stufe === 'gut' && bewegung < 0.008) {
        gutSeit.current ??= jetzt
        const f = Math.min(1, (jetzt - gutSeit.current) / 900)
        setFortschritt(f)
        if (f >= 1 && autoRef.current) ausloesen(true)
      } else {
        gutSeit.current = null
        setFortschritt(0)
      }
      zeichne(b, h)
    }
    const schritt = (t: number) => {
      lauf = requestAnimationFrame(schritt)
      const v = video.current
      if (!v || !v.videoWidth || wartet || t - zuletzt < 70) return
      zuletzt = t
      const hoehe = Math.round((ANALYSE_BREITE * v.videoHeight) / v.videoWidth)
      analyse.current ??= document.createElement('canvas')
      const c = analyse.current
      if (c.width !== ANALYSE_BREITE || c.height !== hoehe) { c.width = ANALYSE_BREITE; c.height = hoehe }
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(v, 0, 0, c.width, c.height)
      const bild = ctx.getImageData(0, 0, c.width, c.height)
      wartet = true
      w.postMessage({ data: bild.data.buffer, width: c.width, height: c.height, nr: nr++ }, [bild.data.buffer])
    }
    lauf = requestAnimationFrame(schritt)
    return () => { cancelAnimationFrame(lauf); w.terminate() }
  }, [ausloesen])

  // ---------------------------------------------------------------- Overlay
  function zeichne(b: Blattbefund, h: Hinweis) {
    const c = overlay.current, v = video.current
    if (!c || !v || !v.videoWidth) return
    const r = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr) }
    const g = c.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, r.width, r.height)
    if (!b.gefunden) return
    // object-fit: contain – sichtbar ist genau, was aufgenommen wird
    const s = Math.min(r.width / v.videoWidth, r.height / v.videoHeight)
    const ox = (r.width - v.videoWidth * s) / 2, oy = (r.height - v.videoHeight * s) / 2
    const pts = b.ecken.map((p) => [ox + p.x * v.videoWidth * s, oy + p.y * v.videoHeight * s])
    const farbe = h.stufe === 'gut' ? '#7fd17a' : '#f2b441'
    g.beginPath()
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    g.closePath()
    g.fillStyle = h.stufe === 'gut' ? 'rgba(127,209,122,0.12)' : 'rgba(242,180,65,0.08)'
    g.fill()
    g.lineWidth = 3
    g.strokeStyle = farbe
    g.stroke()
    // Eckwinkel
    for (const [x, y] of pts) {
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2)
      g.fillStyle = farbe; g.fill()
    }
  }

  const farbeHinweis = hinweis.stufe === 'gut' ? '#7fd17a' : hinweis.stufe === 'korrigieren' ? '#f2b441' : '#fff'
  const ziel = GRENZEN.neigungGut

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 50, color: '#fff', fontFamily: 'var(--ui)' }}>
      <video ref={video} playsInline muted autoPlay style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
      <canvas ref={overlay} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

      {/* Kopf */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'var(--oben) 14px 10px', background: 'linear-gradient(rgba(0,0,0,.65), rgba(0,0,0,0))', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onAbbruch} aria-label="Kamera schließen" style={{ background: 'rgba(0,0,0,.4)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Kreuz style={{ width: 22, height: 22 }} /></button>
        <div style={{ flex: 1, fontSize: 15, lineHeight: 1.3 }}>{titel}</div>
        <button onClick={() => setEinstellungen(!einstellungen)} aria-label="Kamera-Einstellungen" style={{ background: 'rgba(0,0,0,.4)', border: 'none', color: '#fff', height: 40, padding: '0 12px', borderRadius: 20, fontSize: 13 }}>Kamera</button>
      </div>

      {einstellungen && (
        <div style={{ position: 'absolute', top: 'calc(var(--oben) + 52px)', left: 12, right: 12, background: 'rgba(20,20,20,.92)', borderRadius: 14, padding: 12, fontSize: 13, zIndex: 2 }}>
          <div style={{ opacity: 0.8, marginBottom: 6 }}>{info}</div>
          {geraete.length > 1 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ marginBottom: 4 }}>Objektiv</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[{ deviceId: '', label: 'Automatisch' }, ...geraete].map((d, i) => (
                  <button key={d.deviceId || i} onClick={() => setGeraet(d.deviceId)}
                    style={{ border: 'none', borderRadius: 14, padding: '5px 10px', fontSize: 13, background: geraet === d.deviceId ? '#f3eee3' : 'rgba(255,255,255,.18)', color: geraet === d.deviceId ? '#000' : '#fff' }}>
                    {d.label || `Kamera ${i}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Automatisch auslösen, wenn alles passt
          </label>
          <p style={{ opacity: 0.7, margin: '8px 0 0' }}>Tipp: Ohne Blitz, gleichmäßiges Licht, das Blatt auf einer dunklen Unterlage. Zwei- bis dreifacher Zoom aus etwas Abstand verzerrt weniger als Weitwinkel aus der Nähe.</p>
        </div>
      )}

      {/* Wasserwaage: der Punkt wandert zur Seite, die zu hoch gehalten wird */}
      {blase.sichtbar && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 76, height: 76, marginLeft: -38, marginTop: -38, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.85)', boxShadow: '0 0 0 1px rgba(0,0,0,.35), inset 0 0 0 1px rgba(0,0,0,.35)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 76 * (ziel / 0.2), height: 76 * (ziel / 0.2), transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '1px dashed rgba(0,0,0,.45)' }} />
          <div style={{
            position: 'absolute', left: '50%', top: '50%', width: 16, height: 16, borderRadius: '50%',
            background: Math.abs(blase.x) <= ziel && Math.abs(blase.y) <= ziel ? '#4caf50' : '#f2a020', boxShadow: '0 0 0 1.5px rgba(0,0,0,.5)',
            transform: `translate(calc(-50% + ${Math.max(-1, Math.min(1, blase.x / 0.2)) * 30}px), calc(-50% + ${Math.max(-1, Math.min(1, blase.y / 0.2)) * 30}px))`,
            transition: 'transform .12s linear',
          }} />
        </div>
      )}

      {/* Fuß */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 16px calc(var(--sicher-unten) + 18px)', background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.75))' }}>
        <div role="status" aria-live="polite" style={{ textAlign: 'center', fontSize: 17, minHeight: 46, color: farbeHinweis, textShadow: '0 1px 3px #000' }}>
          {fehler || hinweis.text}
        </div>
        {zoom && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '6px 0 10px' }}>
            {[1, 2, 3].filter((z) => z >= zoom.min && z <= zoom.max).map((z) => (
              <button key={z} onClick={() => zoomSetzen(z)} style={{ minWidth: 44, height: 32, borderRadius: 16, border: 'none', background: Math.abs(zoom.wert - z) < 0.05 ? '#f3eee3' : 'rgba(255,255,255,.2)', color: Math.abs(zoom.wert - z) < 0.05 ? '#000' : '#fff', fontSize: 14 }}>{z}×</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
          <span style={{ width: 60 }} />
          <button onClick={() => ausloesen(false)} aria-label="Foto aufnehmen" style={{ width: 76, height: 76, borderRadius: '50%', border: '4px solid #fff', background: 'transparent', position: 'relative', padding: 0 }}>
            <svg viewBox="0 0 76 76" style={{ position: 'absolute', inset: -4, width: 76, height: 76 }}>
              <circle cx="38" cy="38" r="34" fill="none" stroke="#7fd17a" strokeWidth="4" strokeDasharray={`${fortschritt * 213.6} 213.6`} transform="rotate(-90 38 38)" />
            </svg>
            <span style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: hinweis.stufe === 'gut' ? '#fff' : 'rgba(255,255,255,.55)' }} />
          </button>
          <span style={{ width: 60 }} />
        </div>
      </div>
    </div>
  )
}
