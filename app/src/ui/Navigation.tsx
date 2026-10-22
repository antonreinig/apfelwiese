import { Wiese, Buch, Apfel } from './symbole.tsx'

export function Navigation({ pfad }: { pfad: string }) {
  const aktiv = (p: string) => (p === '/' ? pfad === '/' || pfad.startsWith('/baum') : pfad.startsWith(p))
  return (
    <nav className="nav" aria-label="Hauptnavigation">
      <a href="#/" className={aktiv('/') ? 'aktiv' : ''}><Apfel />Äpfel</a>
      <a href="#/sorten" className={aktiv('/sorte') ? 'aktiv' : ''}><Buch />Sorten</a>
      <a href="#/wiese" className={aktiv('/wiese') || aktiv('/karte') ? 'aktiv' : ''}><Wiese />Wiese</a>
    </nav>
  )
}
