// Strichsymbole im Stil feiner Federzeichnungen
import type { SVGProps } from 'react'

const basis = (p: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
})

export const Wiese = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}>
    <path d="M7 20v-5M17 20v-6" />
    <path d="M7 15c-2.8 0-4.5-1.8-4.5-4.2C2.5 8 4.6 6 7 6s4.5 2 4.5 4.8C11.5 13.2 9.8 15 7 15z" />
    <path d="M17 14c-2.6 0-4-1.7-4-3.9C13 7.6 14.8 5.5 17 5.5s4 2.1 4 4.6c0 2.2-1.4 3.9-4 3.9z" />
    <path d="M2 20.5h20" />
  </svg>
)
export const Apfel = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}>
    <path d="M12 7.2c-1.4-1-3.6-1.4-5.3-.4C4.4 8.1 3.8 11.2 4.6 14c.9 3.3 3.3 6.3 5.6 6.3.8 0 1.2-.4 1.8-.4s1 .4 1.8.4c2.3 0 4.7-3 5.6-6.3.8-2.8.2-5.9-2.1-7.2-1.7-1-3.9-.6-5.3.4z" />
    <path d="M12 7.2c0-1.6.4-3 1.4-4.2" />
    <path d="M13 5.2c1.2-1.4 3-1.8 4.6-1.4-.4 1.6-1.8 2.8-3.6 2.8" />
  </svg>
)
export const Buch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
    <path d="M12 6.5v13" />
  </svg>
)
export const Karte = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}>
    <path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z" />
    <path d="M9 4.5v13M15 6.5v13" />
  </svg>
)
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const Zurueck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M14.5 5.5L8 12l6.5 6.5" /></svg>
)
export const Kreuz = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const Raster = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /></svg>
)
export const Einzeln = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><circle cx="12" cy="12" r="6.5" /></svg>
)
export const Kamera = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
)
export const Suche = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" /></svg>
)
export const Pfeil = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M9.5 5.5L16 12l-6.5 6.5" /></svg>
)
export const Hoch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M6 14.5L12 8.5l6 6" /></svg>
)
export const Messer = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M4 20l9-9M13 11l6.5-6.5c.8 2.7-.3 6-3 8.2L13 11z" /></svg>
)
export const Ort = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
)
export const Foto = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><rect x="3.5" y="5" width="17" height="14" rx="1" /><path d="M3.5 16l5-5 4 4 2.5-2.5 5 5" /><circle cx="15.5" cy="9" r="1.4" /></svg>
)
export const Liste = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M9 7h11M9 12h11M9 17h11" /><path d="M4 7h1M4 12h1M4 17h1" /></svg>
)
export const Lupe = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5M8 10.5h5M10.5 8v5" /></svg>
)
export const Siegel = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><circle cx="12" cy="10" r="6" /><path d="M8.5 15l-1.5 6 5-2.5 5 2.5-1.5-6" /></svg>
)
export const Muell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></svg>
)
export const Info = (p: SVGProps<SVGSVGElement>) => (
  <svg {...basis(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 8v.01" /></svg>
)
