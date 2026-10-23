import { useEffect, useRef, useState } from 'react'
import { Kreuz, Zurueck, Pfeil } from './symbole.tsx'

// Großansicht von Fotos innerhalb der App: wischen zum Blättern, doppelt tippen zum Vergrößern.

export function Leuchtkasten({ bilder, start, titel, onSchliessen }: {
  bilder: (string | null)[]
  start: number
  titel?: (i: number) => string
  onSchliessen: () => void
}) {
  const [i, setI] = useState(start)
  const [zoom, setZoom] = useState(false)
  const zug = useRef<{ x: number; t: number } | null>(null)
  const letzterTipp = useRef(0)
  const gueltig = bilder.map((b, k) => (b ? k : -1)).filter((k) => k >= 0)
  const weiter = (d: number) => {
    const pos = gueltig.indexOf(i)
    const neu = gueltig[(pos + d + gueltig.length) % gueltig.length]
    if (neu !== undefined) { setI(neu); setZoom(false) }
  }
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSchliessen()
      if (e.key === 'ArrowRight') weiter(1)
      if (e.key === 'ArrowLeft') weiter(-1)
    }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  })
  const url = bilder[i]
  return (
    <div role="dialog" aria-modal="true" aria-label="Foto" style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--papier)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--oben) 14px 8px' }}>
        <button className="rund-knopf" onClick={onSchliessen} aria-label="Schließen"><Kreuz /></button>
        <div className="klein" style={{ flex: 1 }}>{titel?.(i)}</div>
        {gueltig.length > 1 && <>
          <button className="rund-knopf" onClick={() => weiter(-1)} aria-label="Vorheriges Foto"><Zurueck /></button>
          <button className="rund-knopf" onClick={() => weiter(1)} aria-label="Nächstes Foto"><Pfeil /></button>
        </>}
      </div>
      <div
        style={{ flex: 1, overflow: zoom ? 'auto' : 'hidden', display: 'flex', alignItems: zoom ? 'flex-start' : 'center', justifyContent: zoom ? 'flex-start' : 'center', padding: zoom ? 0 : 12, touchAction: zoom ? 'pan-x pan-y pinch-zoom' : 'pan-y pinch-zoom' }}
        onPointerDown={(e) => { zug.current = { x: e.clientX, t: Date.now() } }}
        onPointerUp={(e) => {
          const z = zug.current
          zug.current = null
          if (!z) return
          const dx = e.clientX - z.x
          if (!zoom && Math.abs(dx) > 50) { weiter(dx < 0 ? 1 : -1); return }
          if (Math.abs(dx) < 8) {
            const jetzt = Date.now()
            if (jetzt - letzterTipp.current < 320) setZoom(!zoom)
            letzterTipp.current = jetzt
          }
        }}
      >
        {url && <img src={url} alt={titel?.(i) ?? 'Foto'} draggable={false}
          style={zoom ? { width: '250%', maxWidth: 'none' } : { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 8px 30px -12px rgba(60,40,20,.5)' }} />}
      </div>
      <p className="sehr-klein" style={{ textAlign: 'center', margin: '6px 0 calc(var(--sicher-unten) + 10px)' }}>Doppelt tippen zum Vergrößern{gueltig.length > 1 ? ', wischen zum Blättern' : ''}</p>
    </div>
  )
}
