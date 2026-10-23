import { useSyncExternalStore } from 'react'

function aktuellerPfad() {
  return window.location.hash.replace(/^#/, '') || '/'
}

export function usePfad(): string {
  return useSyncExternalStore(
    (h) => { window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h) },
    aktuellerPfad,
  )
}

// Tiefe innerhalb der App: Jeder Verlaufseintrag bekommt beim ersten Besuch die Tiefe des vorigen plus eins.
// So führt „Zurück“ nur dann in den Browserverlauf, wenn der vorige Eintrag auch zur App gehört
// (wichtig für geteilte Links, die in einem Tab mit fremder Vorgeschichte geöffnet werden).
let tiefe = 0
function tiefeLesen() { return (window.history.state as { aw?: number } | null)?.aw }
if (typeof window !== 'undefined') {
  const t = tiefeLesen()
  if (t === undefined) window.history.replaceState({ aw: 0 }, '')
  else tiefe = t
  window.addEventListener('hashchange', () => {
    const t = tiefeLesen()
    if (t === undefined) { tiefe += 1; window.history.replaceState({ aw: tiefe }, '') }
    else tiefe = t
  })
}

export function gehe(pfad: string, ersetzen = false) {
  const ziel = `#${pfad}`
  if (ersetzen) window.history.replaceState({ aw: tiefe }, '', ziel)
  else { tiefe += 1; window.history.pushState({ aw: tiefe }, '', ziel) }
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function zurueck(sonst = '/') {
  if (tiefe > 0) window.history.back()
  else gehe(sonst, true)
}

/** Prüft ein Muster wie "/baum/:id" und gibt die Parameter zurück */
export function passt(muster: string, pfad: string): Record<string, string> | null {
  const a = muster.split('/').filter(Boolean)
  const b = pfad.split('?')[0].split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const p: Record<string, string> = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) p[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return p
}
