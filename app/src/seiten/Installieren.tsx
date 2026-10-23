import { useEffect, useState } from 'react'
import { Seitenkopf } from '../ui/Seite.tsx'

// Anleitung: App zum Home-Bildschirm hinzufügen, je nach Gerät und Browser.

type Umgebung = 'ios-safari' | 'ios-chrome' | 'ios-andere' | 'android-chrome' | 'android-samsung' | 'android-andere' | 'computer'

export function umgebung(): Umgebung {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return /CriOS/.test(ua) ? 'ios-chrome' : /FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-andere' : 'ios-safari'
  if (/Android/.test(ua)) return /SamsungBrowser/.test(ua) ? 'android-samsung' : /Chrome/.test(ua) ? 'android-chrome' : 'android-andere'
  return 'computer'
}

export function istInstalliert() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

const TEXTE: Record<Umgebung, { titel: string; schritte: string[] }> = {
  'ios-safari': {
    titel: 'iPhone und iPad mit Safari',
    schritte: [
      'Tippe unten in der Leiste auf das Teilen-Symbol (Quadrat mit Pfeil nach oben). Bei eingeklappter Leiste erst auf die drei Punkte tippen.',
      'Scrolle in der Liste nach unten und wähle „Zum Home-Bildschirm“.',
      'Lass „Als Web-App öffnen“ eingeschaltet und tippe auf „Hinzufügen“.',
      'Öffne die Apfelwiese ab jetzt über das neue Symbol und melde dich dort einmal an. Die App auf dem Home-Bildschirm hat einen eigenen Speicher, getrennt von Safari.',
    ],
  },
  'ios-chrome': {
    titel: 'iPhone und iPad mit Chrome',
    schritte: [
      'Tippe oben rechts neben der Adresszeile auf das Teilen-Symbol.',
      'Wähle „Zum Startbildschirm hinzufügen“. Fehlt der Eintrag, scrolle die Liste nach unten.',
      'Prüfe den Namen und tippe auf „Hinzufügen“.',
      'Öffne die Apfelwiese ab jetzt über das neue Symbol und melde dich dort einmal an.',
      'Klappt es nicht, öffne apfelwiese.app in Safari und folge der Anleitung für Safari.',
    ],
  },
  'ios-andere': {
    titel: 'iPhone und iPad',
    schritte: [
      'Am zuverlässigsten geht es mit Safari: Öffne apfelwiese.app in Safari.',
      'Tippe auf das Teilen-Symbol und wähle „Zum Home-Bildschirm“.',
      'Tippe auf „Hinzufügen“ und öffne die App über das neue Symbol. Dort einmal anmelden.',
    ],
  },
  'android-chrome': {
    titel: 'Android mit Chrome',
    schritte: [
      'Tippe oben rechts auf die drei Punkte.',
      'Wähle „Installieren und Verknüpfung erstellen“ (oder „App installieren“).',
      'Bestätige mit „Installieren“. Die Apfelwiese erscheint bei deinen Apps und auf dem Startbildschirm.',
    ],
  },
  'android-samsung': {
    titel: 'Samsung Internet',
    schritte: [
      'Tippe unten rechts auf das Menü (drei Striche).',
      'Wähle „Seite hinzufügen zu“ und dann „Startbildschirm“.',
      'Bestätige mit „Hinzufügen“.',
    ],
  },
  'android-andere': {
    titel: 'Android',
    schritte: [
      'Am zuverlässigsten geht es mit Chrome: Öffne apfelwiese.app in Chrome.',
      'Tippe auf die drei Punkte und wähle „Installieren und Verknüpfung erstellen“.',
    ],
  },
  computer: {
    titel: 'Am Computer',
    schritte: [
      'Die Apfelwiese ist für das Smartphone gemacht, weil du dort fotografierst. Öffne apfelwiese.app auf deinem Handy.',
      'Am Computer kannst du sie in Chrome oder Edge über das Installieren-Symbol rechts in der Adresszeile als App anlegen.',
    ],
  },
}

interface InstallEreignis extends Event { prompt: () => Promise<void> }

export default function InstallierenSeite() {
  const [u, setU] = useState<Umgebung>(() => umgebung())
  const [angebot, setAngebot] = useState<InstallEreignis | null>(null)
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setAngebot(e as InstallEreignis) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  const t = TEXTE[u]
  return (
    <div className="seite">
      <Seitenkopf zurueckZu="/konto" titel="Auf den Home-Bildschirm" />
      <p className="klein">Als App auf dem Home-Bildschirm startet die Apfelwiese bildschirmfüllend und der Browser räumt ihre Daten nicht auf. Ohne Netz kannst du sie trotzdem öffnen.</p>
      {istInstalliert() && <p className="hinweis">Du nutzt die Apfelwiese bereits als App vom Home-Bildschirm.</p>}
      {angebot && (
        <button className="knopf haupt" style={{ width: '100%', margin: '8px 0 16px' }} onClick={() => { angebot.prompt(); setAngebot(null) }}>Jetzt installieren</button>
      )}
      <h2 className="abschnitt-titel" style={{ marginTop: 16 }}>{t.titel}</h2>
      <ol style={{ paddingLeft: 22 }}>
        {t.schritte.map((s, i) => <li key={i} style={{ marginBottom: 8 }}>{s}</li>)}
      </ol>
      <hr className="haarlinie" />
      <div className="sehr-klein" style={{ marginBottom: 6 }}>Anleitung für ein anderes Gerät:</div>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {(Object.keys(TEXTE) as Umgebung[]).map((k) => (
          <button key={k} className={`chip ${k === u ? 'an' : ''}`} onClick={() => setU(k)}>{TEXTE[k].titel}</button>
        ))}
      </div>
    </div>
  )
}
