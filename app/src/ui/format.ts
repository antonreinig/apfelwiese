// Zahlen, Daten und Monate einheitlich auf Deutsch.

export const MONATSNAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
export const MONATE_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

/** 1911 → „1.911“ */
export const zahl = (n: number) => n.toLocaleString('de-DE')

const alsDatum = (d: string | number | Date) => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d))

/** „23. Oktober 2026“ (Fließtext, Stand, Bestimmungen) */
export function datum(d: string | number | Date) {
  const x = alsDatum(d)
  return isNaN(x.getTime()) ? String(d) : x.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** „23.10.2026“ (kurz, in Listen und unter Fotos) */
export function datumKurz(d: string | number | Date) {
  const x = alsDatum(d)
  return isNaN(x.getTime()) ? String(d) : x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** „23. Oktober 2026, 14:03 Uhr“ */
export function zeitpunkt(d: string | number | Date) {
  const x = alsDatum(d)
  return isNaN(x.getTime()) ? String(d) : `${datum(x)}, ${x.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
}
