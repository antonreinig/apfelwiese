import { lazy, Suspense, useEffect, useState } from 'react'
import { usePfad, passt } from './ui/router.ts'
import { Navigation } from './ui/Navigation.tsx'
import { neigungErlauben } from './apfel3d/neigung.ts'
import { WieseSeite } from './seiten/Wiese.tsx'
import { SortenSeite, SortenListeSeite } from './seiten/Sorten.tsx'
import { Kontopflicht } from './ui/Kontopflicht.tsx'
import { Einfuehrung, einfuehrungOffen } from './ui/Einfuehrung.tsx'
import { useKonto, bereit } from './daten/konto.ts'
import { synchronisieren } from './daten/serverabgleich.ts'
import { Uebernahme } from './ui/Uebernahme.tsx'
import { Fehlergrenze } from './ui/Fehlergrenze.tsx'

const BaumSeite = lazy(() => import('./seiten/Baum.tsx'))
const SorteSeite = lazy(() => import('./seiten/Sorte.tsx'))
const KarteSeite = lazy(() => import('./seiten/Karte.tsx'))
const BestimmenSeite = lazy(() => import('./seiten/Bestimmen.tsx'))
const InfoSeite = lazy(() => import('./seiten/Info.tsx'))
const KontoSeite = lazy(() => import('./seiten/Konto.tsx'))
const RatgeberSeite = lazy(() => import('./seiten/Ratgeber.tsx'))
const BezugSeite = lazy(() => import('./seiten/Bezug.tsx'))
const Test3dSeite = lazy(() => import('./seiten/Test3d.tsx'))
const RundgangSeite = lazy(() => import('./seiten/Rundgang.tsx'))
const AngleichenSeite = lazy(() => import('./seiten/Angleichen.tsx'))
const VergleichSeite = lazy(() => import('./seiten/Vergleich.tsx'))
const TestStielKelchSeite = lazy(() => import('./seiten/TestStielKelch.tsx'))
const AnmeldenSeite = lazy(() => import('./seiten/Anmelden.tsx'))
const InstallierenSeite = lazy(() => import('./seiten/Installieren.tsx'))
const RueckmeldungSeite = lazy(() => import('./seiten/Rueckmeldung.tsx'))
const BetriebSeite = lazy(() => import('./seiten/Betrieb.tsx'))
const ImpressumSeite = lazy(() => import('./seiten/Rechtliches.tsx').then((m) => ({ default: m.ImpressumSeite })))
const DatenschutzSeite = lazy(() => import('./seiten/Rechtliches.tsx').then((m) => ({ default: m.DatenschutzSeite })))
const NutzungSeite = lazy(() => import('./seiten/Rechtliches.tsx').then((m) => ({ default: m.NutzungSeite })))

// Entwicklerseiten nur im Entwicklungsserver
const ENTWICKLUNG = import.meta.env.DEV

export default function App() {
  const pfad = usePfad()
  const konto = useKonto()
  const [einfuehrung, setEinfuehrung] = useState(einfuehrungOffen)

  // iOS: Neigungssensor erst nach einer Berührung erfragen
  useEffect(() => {
    const einmal = () => { neigungErlauben(); window.removeEventListener('pointerup', einmal) }
    window.addEventListener('pointerup', einmal)
    return () => window.removeEventListener('pointerup', einmal)
  }, [])

  // Nach Anmeldung und beim Start mit dem Server abgleichen; Browser um dauerhaften Speicher bitten
  const istBereit = bereit(konto)
  useEffect(() => {
    if (!istBereit) return
    synchronisieren()
    navigator.storage?.persist?.().catch(() => {})
    const wieder = () => { if (document.visibilityState === 'visible') synchronisieren() }
    document.addEventListener('visibilitychange', wieder)
    return () => document.removeEventListener('visibilitychange', wieder)
  }, [istBereit])

  // für Rückmeldungen: zuletzt besuchte Seite
  useEffect(() => {
    if (!/^\/(rueckmeldung|info|konto)/.test(pfad)) try { sessionStorage.setItem('letzte-seite', pfad.split('?')[0]) } catch { /* privat */ }
  }, [pfad])

  let inhalt: React.ReactNode
  let mitNavigation = true
  let p: Record<string, string> | null
  const mitKonto = (n: React.ReactNode, titel?: string) => <Kontopflicht titel={titel}>{n}</Kontopflicht>
  if ((p = passt('/baum/:id/merkmale', pfad))) { inhalt = mitKonto(<RundgangSeite id={p.id} />); mitNavigation = false }
  else if ((p = passt('/baum/:id/angleichen', pfad))) { inhalt = mitKonto(<AngleichenSeite id={p.id} />); mitNavigation = false }
  else if ((p = passt('/baum/:id', pfad))) inhalt = mitKonto(<BaumSeite id={p.id} />)
  else if ((p = passt('/sorte/:id', pfad))) inhalt = <SorteSeite id={p.id} />
  else if (passt('/sorten/ratgeber', pfad)) inhalt = <RatgeberSeite />
  else if (passt('/sorten/bezug', pfad)) inhalt = <BezugSeite />
  else if (passt('/sorten/alle', pfad)) inhalt = <SortenListeSeite art="alle" />
  else if ((p = passt('/sorten/:art/:wert', pfad)) && ['sammlung', 'monat', 'region'].includes(p.art)) inhalt = <SortenListeSeite key={pfad} art={p.art as 'sammlung'} wert={p.wert} />
  else if (passt('/sorten', pfad)) inhalt = <SortenSeite />
  else if (passt('/wiese', pfad) || passt('/karte', pfad)) inhalt = mitKonto(<KarteSeite />, 'Deine Wiese')
  else if (passt('/info', pfad)) inhalt = <InfoSeite />
  else if (passt('/konto', pfad)) inhalt = <KontoSeite />
  else if (passt('/anmelden', pfad)) { inhalt = <AnmeldenSeite />; mitNavigation = false }
  else if (passt('/installieren', pfad)) inhalt = <InstallierenSeite />
  else if (passt('/rueckmeldung', pfad)) inhalt = <RueckmeldungSeite />
  else if (passt('/betrieb', pfad)) inhalt = mitKonto(<BetriebSeite />, 'Betrieb')
  else if (passt('/impressum', pfad)) inhalt = <ImpressumSeite />
  else if (passt('/datenschutz', pfad)) inhalt = <DatenschutzSeite />
  else if (passt('/nutzung', pfad)) inhalt = <NutzungSeite />
  else if (ENTWICKLUNG && passt('/test3d', pfad)) inhalt = <Test3dSeite />
  else if (ENTWICKLUNG && passt('/vergleich', pfad)) inhalt = <VergleichSeite />
  else if (ENTWICKLUNG && passt('/test-stiel', pfad)) { inhalt = <TestStielKelchSeite />; mitNavigation = false }
  else if (passt('/neu', pfad)) { inhalt = mitKonto(<BestimmenSeite />); mitNavigation = false }
  else if ((p = passt('/neu/:baumId', pfad))) { inhalt = mitKonto(<BestimmenSeite baumId={p.baumId} />); mitNavigation = false }
  else inhalt = <WieseSeite />

  return (
    <div className="app">
      <Fehlergrenze schluessel={pfad.split('?')[0]}><Suspense fallback={<div className="seite" />}>{inhalt}</Suspense></Fehlergrenze>
      {mitNavigation && <Navigation pfad={pfad} />}
      <Uebernahme />
      {einfuehrung && !pfad.startsWith('/anmelden') && !/^\/(impressum|datenschutz|nutzung)/.test(pfad) && <Einfuehrung fertig={() => setEinfuehrung(false)} />}
    </div>
  )
}
