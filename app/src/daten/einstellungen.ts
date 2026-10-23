// Einstellungen, die nur auf diesem Gerät gelten (localStorage): Region für die Sortenauswahl, Darstellung.
// Nichts davon geht an den Server.

import { useSyncExternalStore } from 'react'

export const BUNDESLAENDER: { code: string; name: string }[] = [
  { code: 'DE-BW', name: 'Baden-Württemberg' },
  { code: 'DE-BY', name: 'Bayern' },
  { code: 'DE-BE', name: 'Berlin' },
  { code: 'DE-BB', name: 'Brandenburg' },
  { code: 'DE-HB', name: 'Bremen' },
  { code: 'DE-HH', name: 'Hamburg' },
  { code: 'DE-HE', name: 'Hessen' },
  { code: 'DE-MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'DE-NI', name: 'Niedersachsen' },
  { code: 'DE-NW', name: 'Nordrhein-Westfalen' },
  { code: 'DE-RP', name: 'Rheinland-Pfalz' },
  { code: 'DE-SL', name: 'Saarland' },
  { code: 'DE-SN', name: 'Sachsen' },
  { code: 'DE-ST', name: 'Sachsen-Anhalt' },
  { code: 'DE-SH', name: 'Schleswig-Holstein' },
  { code: 'DE-TH', name: 'Thüringen' },
]
export const BUNDESLAND_NAME: Record<string, string> = Object.fromEntries(BUNDESLAENDER.map((b) => [b.code, b.name]))

/** Nachbarländer, damit kleine Länder (Stadtstaaten) nicht leer ausgehen */
export const NACHBARN: Record<string, string[]> = {
  'DE-BW': ['DE-BY', 'DE-HE', 'DE-RP'],
  'DE-BY': ['DE-BW', 'DE-HE', 'DE-TH', 'DE-SN'],
  'DE-BE': ['DE-BB'],
  'DE-BB': ['DE-BE', 'DE-MV', 'DE-SN', 'DE-ST', 'DE-NI'],
  'DE-HB': ['DE-NI'],
  'DE-HH': ['DE-SH', 'DE-NI'],
  'DE-HE': ['DE-NW', 'DE-NI', 'DE-TH', 'DE-BY', 'DE-BW', 'DE-RP'],
  'DE-MV': ['DE-SH', 'DE-NI', 'DE-BB'],
  'DE-NI': ['DE-HB', 'DE-HH', 'DE-SH', 'DE-MV', 'DE-BB', 'DE-ST', 'DE-TH', 'DE-HE', 'DE-NW'],
  'DE-NW': ['DE-NI', 'DE-HE', 'DE-RP'],
  'DE-RP': ['DE-NW', 'DE-HE', 'DE-BW', 'DE-SL'],
  'DE-SL': ['DE-RP'],
  'DE-SN': ['DE-BB', 'DE-ST', 'DE-TH', 'DE-BY'],
  'DE-ST': ['DE-NI', 'DE-BB', 'DE-SN', 'DE-TH'],
  'DE-SH': ['DE-HH', 'DE-NI', 'DE-MV'],
  'DE-TH': ['DE-NI', 'DE-ST', 'DE-SN', 'DE-BY', 'DE-HE'],
}

export type Darstellung = 'system' | 'hell' | 'dunkel'

interface Einstellungen { region: string | null; darstellung: Darstellung }

const SCHLUESSEL = 'aw-einstellungen'

function laden(): Einstellungen {
  try {
    const e = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? '{}')
    return {
      region: typeof e.region === 'string' && BUNDESLAND_NAME[e.region] ? e.region : null,
      darstellung: e.darstellung === 'hell' || e.darstellung === 'dunkel' ? e.darstellung : 'system',
    }
  } catch { return { region: null, darstellung: 'system' } }
}

let stand = laden()
const hoerer = new Set<() => void>()

function setze(neu: Partial<Einstellungen>) {
  stand = { ...stand, ...neu }
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify(stand)) } catch { /* privat */ }
  darstellungAnwenden()
  hoerer.forEach((h) => h())
}

export function useEinstellungen(): Einstellungen {
  return useSyncExternalStore((h) => { hoerer.add(h); return () => hoerer.delete(h) }, () => stand)
}
export const einstellungenJetzt = () => stand
export const setzeRegion = (region: string | null) => setze({ region })
export const setzeDarstellung = (darstellung: Darstellung) => setze({ darstellung })

/** Setzt data-theme am Wurzelelement und die Farbe der Statusleiste */
export function darstellungAnwenden() {
  if (typeof document === 'undefined') return
  const wurzel = document.documentElement
  if (stand.darstellung === 'system') delete wurzel.dataset.theme
  else wurzel.dataset.theme = stand.darstellung === 'dunkel' ? 'dark' : 'light'
  const dunkel = stand.darstellung === 'dunkel' || (stand.darstellung === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dunkel ? '#1c1915' : '#f3eee3')
}
