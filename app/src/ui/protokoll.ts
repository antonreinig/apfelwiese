// Fehlerprotokoll: unerwartete Fehler gehen an /api/protokoll (30 Tage gespeichert, nur für den
// Betreiber sichtbar). Ohne Fotos und Inhalte: Art, Meldung, gekürzter Ablauf, Seite, App-Stand, Browser.

declare const __APP_STAND__: string

const gemeldet = new Set<string>()
let anzahl = 0

export type Fehlerart = 'js' | 'versprechen' | 'darstellung' | 'nachladen' | 'abgleich' | 'upload' | 'kamera' | 'messung' | 'sonstiges'

export function meldeFehler(art: Fehlerart, fehler: unknown, zusatz?: string) {
  try {
    const e = fehler instanceof Error ? fehler : new Error(String(fehler))
    const meldung = `${e.name}: ${e.message}`.slice(0, 500)
    const schluessel = art + meldung
    if (gemeldet.has(schluessel) || anzahl >= 20) return // je Sitzung jede Meldung einmal, höchstens 20
    gemeldet.add(schluessel)
    anzahl++
    const seite = window.location.hash.split('?')[0] || '#/'
    const daten = JSON.stringify({
      art, meldung,
      ablauf: (e.stack ?? '').slice(0, 2000),
      zusatz: zusatz?.slice(0, 300),
      seite, version: __APP_STAND__, geraet: navigator.userAgent,
    })
    fetch('/api/protokoll', { method: 'POST', headers: { 'content-type': 'application/json' }, body: daten, keepalive: true }).catch(() => {})
  } catch { /* Protokoll darf nie selbst Fehler werfen */ }
}

/** Ein Teil der App ließ sich nicht nachladen (meist nach einem Update): einmal neu laden */
export function istNachladefehler(e: unknown) {
  const t = String((e as Error)?.message ?? e)
  return /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically|ChunkLoadError|preload/i.test(t)
}

const NEU_GELADEN = 'neu-geladen'
export function einmalNeuLaden(): boolean {
  try {
    const zuletzt = Number(sessionStorage.getItem(NEU_GELADEN) ?? 0)
    if (Date.now() - zuletzt < 30_000) return false // schon versucht: nicht in eine Schleife geraten
    sessionStorage.setItem(NEU_GELADEN, String(Date.now()))
  } catch { /* privat */ }
  window.location.reload()
  return true
}

export function globaleFehlerAbfangen() {
  window.addEventListener('error', (ev) => {
    // Ressourcen-Ladefehler (Bilder, Skripte) haben kein ev.error
    if (ev.error) meldeFehler('js', ev.error)
  })
  window.addEventListener('unhandledrejection', (ev) => {
    if (istNachladefehler(ev.reason) && einmalNeuLaden()) return
    meldeFehler('versprechen', ev.reason)
  })
  // Vite meldet fehlgeschlagenes Vorladen von Teilen der App
  window.addEventListener('vite:preloadError', (ev) => {
    ev.preventDefault()
    if (!einmalNeuLaden()) meldeFehler('nachladen', (ev as Event & { payload?: unknown }).payload ?? 'preloadError')
  })
}
