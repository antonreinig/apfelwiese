import type { ApfelParameter } from './darstellung.ts'

// Ersatz, wenn das Gerät kein WebGL kann (alte Geräte, Browser ohne Grafikbeschleunigung,
// Crawler): ein flacher Apfel in den Farben des Modells statt einer leeren oder abgestürzten Seite.

let verfuegbar: boolean | null = null

export function webglVerfuegbar(): boolean {
  if (verfuegbar !== null) return verfuegbar
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    verfuegbar = !!gl
    ;(gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    verfuegbar = false
  }
  return verfuegbar
}

/** Flacher Apfel: Grundfarbe, Deckfarbe nach Anteil zur Sonnenseite, Stiel */
export function FlacherApfel({ p, groesse }: { p: ApfelParameter; groesse: number | string }) {
  const deck = Math.round(Math.min(1, Math.max(0, p.deckfarbeAnteil)) * 70)
  return (
    <svg viewBox="0 0 100 100" width={groesse} height={groesse} role="img" aria-label="Apfel">
      <defs>
        <radialGradient id="flach-grund" cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="35%" stopColor={p.grundfarbe} />
          <stop offset="100%" stopColor={p.grundfarbe} stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="flach-deck" x1="1" y1="0" x2="0" y2="0.3">
          <stop offset="0%" stopColor={p.deckfarbe} stopOpacity="0.95" />
          <stop offset={`${deck}%`} stopColor={p.deckfarbe} stopOpacity="0.6" />
          <stop offset={`${Math.min(100, deck + 15)}%`} stopColor={p.deckfarbe} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M50 26c-8-7-24-8-32 4-9 13-5 34 5 48 7 10 15 14 21 12 3-1 4-2 6-2s3 1 6 2c6 2 14-2 21-12 10-14 14-35 5-48-8-12-24-11-32-4z" fill="url(#flach-grund)" />
      {deck > 0 && <path d="M50 26c-8-7-24-8-32 4-9 13-5 34 5 48 7 10 15 14 21 12 3-1 4-2 6-2s3 1 6 2c6 2 14-2 21-12 10-14 14-35 5-48-8-12-24-11-32-4z" fill="url(#flach-deck)" />}
      <path d="M50 27c0-6 1-11 4-15" stroke="#6b4a2b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
