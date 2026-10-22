// Neigung des Handys als sanftes Signal für Blickwinkel und Licht.
// Gemessen wird die Abweichung von der Haltung der letzten Sekunden (langsam nachgeführte
// Ruhelage), damit es egal ist, wie man das Handy grundsätzlich hält.
// Ohne Sensor (Desktop) folgt der Wert dem Mauszeiger.

const zustand = { x: 0, y: 0, quelle: 'keine' as 'keine' | 'sensor' | 'zeiger' }
const ziel = { x: 0, y: 0 }
const ruhe = { beta: NaN, gamma: NaN }
let gestartet = false
let erlaubnisErfragt = false

const begrenze = (v: number) => Math.max(-1, Math.min(1, v))

function aufOrientierung(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return
  zustand.quelle = 'sensor'
  if (Number.isNaN(ruhe.beta)) { ruhe.beta = e.beta; ruhe.gamma = e.gamma }
  // Ruhelage folgt langsam (Zeitkonstante rund zehn Sekunden), damit eine gehaltene Neigung wirkt
  ruhe.beta += (e.beta - ruhe.beta) * 0.002
  ruhe.gamma += (e.gamma - ruhe.gamma) * 0.002
  // ±25° Neigung reichen für den ganzen Bereich; positiv y = Oberkante des Handys nach hinten gekippt
  ziel.x = begrenze((e.gamma - ruhe.gamma) / 25)
  ziel.y = begrenze((e.beta - ruhe.beta) / 25)
}

function aufZeiger(e: PointerEvent) {
  if (zustand.quelle === 'sensor' || e.pointerType === 'touch') return
  zustand.quelle = 'zeiger'
  ziel.x = begrenze((e.clientX / window.innerWidth) * 2 - 1)
  ziel.y = begrenze((e.clientY / window.innerHeight) * 2 - 1)
}

let cssX = 0, cssY = 0
function schleife() {
  // Tiefpass gegen Zittern
  zustand.x += (ziel.x - zustand.x) * 0.08
  zustand.y += (ziel.y - zustand.y) * 0.08
  // Als CSS-Variablen für Glanzlichter auf Medaillon-Bildern (ohne React-Neuzeichnen)
  if (Math.abs(zustand.x - cssX) > 0.004 || Math.abs(zustand.y - cssY) > 0.004) {
    cssX = zustand.x; cssY = zustand.y
    const st = document.documentElement.style
    st.setProperty('--neig-x', cssX.toFixed(3))
    st.setProperty('--neig-y', cssY.toFixed(3))
  }
  requestAnimationFrame(schleife)
}

function starten() {
  if (gestartet) return
  gestartet = true
  window.addEventListener('pointermove', aufZeiger, { passive: true })
  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined
  if (DOE && typeof DOE.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', aufOrientierung)
  }
  requestAnimationFrame(schleife)
}

/**
 * iOS verlangt eine Erlaubnis, die nur bei einer Berührung erfragt werden darf.
 * Wird beim ersten Antippen oder Wischen irgendwo in der App aufgerufen.
 */
export async function neigungErlauben() {
  if (erlaubnisErfragt) return
  erlaubnisErfragt = true
  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined
  if (DOE && typeof DOE.requestPermission === 'function') {
    try {
      const antwort = await DOE.requestPermission()
      if (antwort === 'granted') window.addEventListener('deviceorientation', aufOrientierung)
    } catch {
      // abgelehnt oder nicht möglich: Apfel dreht sich weiter von selbst
    }
  }
}

export function neigung() {
  starten()
  return zustand
}

export function bewegungReduziert() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
