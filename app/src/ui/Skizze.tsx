// Kleine Federzeichnungen: wie die Teile auf dem A4-Blatt liegen (2 × 2-Raster)

const strich = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function Haelfte({ x, y, stiel }: { x: number; y: number; stiel?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-17 2c0-12 8-18 17-18s17 6 17 18c0 9-8 15-17 15s-17-6-17-15z" {...strich} />
      {stiel && <path d="M0-16v-6" {...strich} />}
      <path d="M-9-6c2 1 3 1 4 0M5 4c1 1 2 1 3 0M-4 8c1 1 2 1 3 0" {...strich} strokeWidth={0.8} />
    </g>
  )
}

function Laengsscheibe({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-17 2c0-12 8-18 17-18s17 6 17 18c0 9-8 15-17 15s-17-6-17-15z" {...strich} />
      <path d="M-7 3c0-6 3-10 7-10s7 4 7 10-3 8-7 8-7-2-7-8z" {...strich} strokeWidth={0.9} />
      <path d="M-3 0c0-3 1-4 1.5-4M3 0c0-3-1-4-1.5-4M0-16v8M0 11l-3 6h6z" {...strich} strokeWidth={0.9} />
    </g>
  )
}

function Querhaelfte({ x, y, kelch }: { x: number; y: number; kelch: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="16" {...strich} />
      <circle r="6" {...strich} strokeWidth={0.9} />
      {kelch ? <path d="M0-3l1 2 2.5 0-2 1.5 1 2.5L0 1.5-2.5 3l1-2.5-2-1.5H-1z" {...strich} strokeWidth={0.8} /> : <path d="M0 0l4-6" {...strich} />}
    </g>
  )
}

function Querscheibe({ x, y }: { x: number; y: number }) {
  const zacken = Array.from({ length: 5 }, (_, i) => {
    const w = (i / 5) * Math.PI * 2 - Math.PI / 2
    return `M${(Math.cos(w) * 2).toFixed(1)} ${(Math.sin(w) * 2).toFixed(1)}L${(Math.cos(w) * 8).toFixed(1)} ${(Math.sin(w) * 8).toFixed(1)}`
  }).join('')
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="16" {...strich} />
      <path d={zacken} {...strich} strokeWidth={2.4} />
    </g>
  )
}

function Kerne({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${x} ${y + i * 9}c2 0 3 2 3 4s-1.5 3-3 3-3-1-3-3 1-4 3-4z`} fill="currentColor" />
      ))}
    </g>
  )
}

export function Skizze({ nr, breite = 150 }: { nr: number; breite?: number }) {
  return (
    <svg viewBox="0 0 140 196" width={breite} height={(breite * 196) / 140} aria-hidden="true" style={{ color: 'var(--tinte-2)' }}>
      <rect x="2" y="2" width="136" height="192" rx="1.5" fill="var(--papier-3)" stroke="var(--linie-stark)" />
      {nr === 0 && <><Haelfte x={40} y={58} stiel /><Haelfte x={98} y={58} /><Haelfte x={40} y={136} stiel /><Haelfte x={98} y={136} /></>}
      {nr === 1 && <><Laengsscheibe x={40} y={58} /><Laengsscheibe x={98} y={58} /><Laengsscheibe x={40} y={136} /><Laengsscheibe x={98} y={136} /></>}
      {nr === 2 && <><Querhaelfte x={38} y={58} kelch /><Querhaelfte x={94} y={58} kelch={false} /><Querhaelfte x={38} y={136} kelch /><Querhaelfte x={94} y={136} kelch={false} /><Kerne x={127} y={66} /></>}
      {nr === 3 && <><Querscheibe x={38} y={58} /><Querscheibe x={94} y={58} /><Querscheibe x={38} y={136} /><Querscheibe x={94} y={136} /><Kerne x={127} y={66} /></>}
    </svg>
  )
}
