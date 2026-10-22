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

export function gehe(pfad: string, ersetzen = false) {
  const ziel = `#${pfad}`
  if (ersetzen) window.history.replaceState(null, '', ziel)
  else window.history.pushState(null, '', ziel)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function zurueck(sonst = '/') {
  if (window.history.length > 1) window.history.back()
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
