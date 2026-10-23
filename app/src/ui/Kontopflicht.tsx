import type { ReactNode } from 'react'
import { useKonto, bereit, zurAnmeldung } from '../daten/konto.ts'
import { usePfad } from './router.ts'
import { Wiese } from './symbole.tsx'
import { Seitenkopf } from './Seite.tsx'

/** Ein Text für alle Stellen, an denen ein Konto fehlt */
export const OHNE_KONTO = 'Melde dich an, um eigene Bäume zu bestimmen und zu sammeln. Bäume und Fotos liegen dann sicher in deinem Konto. Die Sorten kannst du auch ohne Konto ansehen.'
export const OFFLINE = 'Gerade ist keine Verbindung zum Server möglich. Bitte prüfe deine Internetverbindung.'

/** Zeigt den Inhalt nur angemeldeten Nutzern, die den Nutzungsbedingungen zugestimmt haben */
export function Kontopflicht({ children, titel = 'Meine Bäume' }: { children: ReactNode; titel?: string }) {
  const konto = useKonto()
  const pfad = usePfad()
  if (konto.status === 'laedt') return <div className="seite" />
  if (bereit(konto)) return <>{children}</>
  const tab = /^\/(wiese|karte)/.test(pfad)
  return (
    <div className="seite" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 12 }}>
      {!tab && <div style={{ position: 'absolute', top: 0, left: 16, right: 16 }}><Seitenkopf /></div>}
      <Wiese style={{ width: 90, height: 90, color: 'var(--blatt)' }} />
      <h1 className="name titel">{titel}</h1>
      <p className="klein" style={{ maxWidth: 380 }}>
        {konto.status === 'offline' ? OFFLINE : OHNE_KONTO}
      </p>
      {konto.status !== 'offline' && <button className="knopf haupt" onClick={() => zurAnmeldung(pfad)}>Anmelden</button>}
    </div>
  )
}
