import type { ReactNode } from 'react'
import { useKonto, bereit, zurAnmeldung } from '../daten/konto.ts'
import { usePfad } from './router.ts'
import { Wiese } from './symbole.tsx'

/** Zeigt den Inhalt nur angemeldeten Nutzern, die den Nutzungsbedingungen zugestimmt haben */
export function Kontopflicht({ children, titel = 'Deine Bäume' }: { children: ReactNode; titel?: string }) {
  const konto = useKonto()
  const pfad = usePfad()
  if (konto.status === 'laedt') return <div className="seite" />
  if (bereit(konto)) return <>{children}</>
  return (
    <div className="seite" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 12 }}>
      <Wiese style={{ width: 90, height: 90, color: 'var(--blatt)' }} />
      <h1 className="name" style={{ fontSize: 40 }}>{titel}</h1>
      <p className="klein" style={{ maxWidth: 380 }}>
        {konto.status === 'offline'
          ? 'Gerade ist keine Verbindung zum Server möglich. Bitte prüfe deine Internetverbindung.'
          : 'Melde dich an, um eigene Bäume anzulegen. Bäume und Fotos liegen dann sicher in deinem Konto. Die Sorten kannst du auch ohne Konto ansehen.'}
      </p>
      {konto.status !== 'offline' && <button className="knopf haupt" onClick={() => zurAnmeldung(pfad)}>Anmelden</button>}
    </div>
  )
}
