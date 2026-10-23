// Gemeinsame Bausteine für Seiten, damit Kopf, Abschnitte, Verweise und Meldungen überall gleich aussehen.
//
// Drei Kopfmuster:
//  - Tab-Startseite: <div className="tafelkopf"> mit dem Namen des Tabs (Äpfel, Sorten, Wiese)
//  - Unterseite: <Seitenkopf titel=…> mit festem Zurück-Knopf und Schreibschrift-Titel
//  - Ablauf (Bestimmen, Ratgeber, Rundgang): <Ablaufkopf> mit Zurück, Schritt „x von y“ und Schließen

import type { ReactNode } from 'react'
import { zurueck } from './router.ts'
import { Zurueck, Pfeil, Kreuz } from './symbole.tsx'

/** Kopf einer Unterseite: Zurück-Knopf bleibt beim Scrollen stehen, darunter der Titel */
export function Seitenkopf({ titel, untertitel, zurueckZu = '/', onZurueck, rechts }: {
  titel?: ReactNode; untertitel?: ReactNode; zurueckZu?: string; onZurueck?: () => void; rechts?: ReactNode
}) {
  return (
    <>
      <div className="kopf-fest">
        <button className="rund-knopf" onClick={onZurueck ?? (() => zurueck(zurueckZu))} aria-label="Zurück"><Zurueck /></button>
        {rechts}
      </div>
      {titel && <h1 className="name titel">{titel}</h1>}
      {untertitel && <p className="kursiv klein" style={{ marginTop: 2 }}>{untertitel}</p>}
    </>
  )
}

/** Kopf eines Ablaufs: links ein Schritt zurück, Mitte Name und Fortschritt, rechts Schließen */
export function Ablaufkopf({ name, schritt, zurueck: schrittZurueck, schliessen, schliessenLabel = 'Schließen' }: {
  name: string; schritt?: ReactNode; zurueck?: () => void; schliessen?: () => void; schliessenLabel?: string
}) {
  return (
    <div className="kopf-fest" style={{ gap: 12 }}>
      {schrittZurueck ? <button className="rund-knopf" onClick={schrittZurueck} aria-label="Zurück"><Zurueck /></button> : <span style={{ width: 44 }} />}
      <span className="tafelkopf" style={{ flex: 1, borderBottom: 'none', paddingBottom: 0, alignItems: 'center' }}>
        <span>{name}</span>
        {schritt && <span>{schritt}</span>}
      </span>
      {schliessen && <button className="rund-knopf" onClick={schliessen} aria-label={schliessenLabel}><Kreuz /></button>}
    </div>
  )
}

export function Abschnitt({ titel, children, id }: { titel: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="abschnitt" id={id}>
      <h2 className="abschnitt-titel">{titel}</h2>
      {children}
    </section>
  )
}

/** Zeile mit Pfeil zu einer anderen Seite der App */
export function Verweis({ ziel, children, onClick }: { ziel: string; children: ReactNode; onClick?: () => void }) {
  return (
    <a className="zeile verweis" href={`#${ziel}`} onClick={onClick}>
      <span className="grow">{children}</span>
      <Pfeil />
    </a>
  )
}

/** Karte mit Symbol, Titel, Unterzeile und Pfeil; `dunkel` für die eine Hauptempfehlung einer Seite */
export function Verweiskarte({ ziel, symbol, titel, text, dunkel = false }: { ziel: string; symbol?: ReactNode; titel: ReactNode; text?: ReactNode; dunkel?: boolean }) {
  return (
    <a href={`#${ziel}`} className={`karte-papier verweiskarte ${dunkel ? 'dunkel' : ''}`}>
      {symbol}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="verweiskarte-titel">{titel}</span>
        {text && <span className="verweiskarte-text">{text}</span>}
      </span>
      <Pfeil />
    </a>
  )
}

/** Fehler, Hinweis oder Erfolg nach einer Aktion: lesbar groß und für Screenreader angesagt */
export function Meldung({ art = 'hinweis', children }: { art?: 'fehler' | 'hinweis' | 'erfolg'; children: ReactNode }) {
  if (!children) return null
  return <p className={`meldung ${art}`} role={art === 'fehler' ? 'alert' : 'status'}>{children}</p>
}

export function Laden() {
  return <div className="seite"><p className="hinweis" role="status">Wird geladen …</p></div>
}

/** Für gelöschte oder unbekannte Bäume und Sorten: mit Weg zurück */
export function NichtGefunden({ text, ziel = '/', linkText = 'Zu meinen Bäumen' }: { text: string; ziel?: string; linkText?: string }) {
  return (
    <div className="seite">
      <Seitenkopf zurueckZu={ziel} />
      <p className="hinweis">{text}</p>
      <a className="knopf" href={`#${ziel}`}>{linkText}</a>
    </div>
  )
}

/** Runder Farbfleck für gemessene oder gewählte Farben */
export function Farbfeld({ farbe, groesse = 18 }: { farbe: string; groesse?: number }) {
  return <span aria-hidden className="farbfeld" style={{ width: groesse, height: groesse, background: farbe }} />
}

/** Zweispaltige Zeile „Merkmal – Wert“ in Tabellen wie „Gemessen“ und „Merkmale“ */
export function Wertzeile({ titel, children }: { titel: ReactNode; children: ReactNode }) {
  return (
    <div className="wertzeile">
      <span className="wertzeile-titel">{titel}</span>
      <span className="wertzeile-wert">{children}</span>
    </div>
  )
}

/** Knopf zum Schließen einer Überlagerung */
export function SchliessenKnopf({ onClick, label = 'Schließen' }: { onClick: () => void; label?: string }) {
  return <button className="rund-knopf" onClick={onClick} aria-label={label}><Kreuz /></button>
}
