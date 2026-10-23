import { useSortenindex } from '../daten/sorten.ts'
import { zurueck } from '../ui/router.ts'
import { Zurueck, Pfeil } from '../ui/symbole.tsx'
import { useKonto } from '../daten/konto.ts'
import { istInstalliert } from './Installieren.tsx'

// Über die App: Funktionsweise, Quellen, Rechtliches. Konto und Einstellungen stehen in Konto.tsx.

function Verweis({ ziel, children }: { ziel: string; children: React.ReactNode }) {
  return <a className="zeile" href={`#${ziel}`} style={{ padding: '12px 0' }}><span className="grow">{children}</span><Pfeil style={{ width: 18, height: 18, color: 'var(--bleistift)' }} /></a>
}

export default function InfoSeite() {
  const index = useSortenindex()
  const konto = useKonto()
  return (
    <div className="seite">
      <button className="rund-knopf" onClick={() => zurueck('/')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 46, marginTop: 8 }}>Apfelwiese</h1>
      <p className="kursiv klein" style={{ marginTop: 0 }}>Alte Apfelsorten bestimmen und dokumentieren. Prototyp, Stand {index?.stand || 'Oktober 2026'}.</p>
      <hr className="doppellinie" />

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>So funktioniert es</h2>
      <p>Pro Baum schneidest du vier typische Äpfel auf und fotografierst sie auf einem weißen A4-Blatt: vier Fotos, jedes zeigt andere Merkmale. Das Blatt dient als Maßstab und für den Weißabgleich. Die App erkennt das Blatt, misst Größe und Farben per Programm und baut daraus ein 3D-Modell deines Apfels.</p>
      <p>Die Bestimmung ist ein Vorschlag. Erst eine Bestätigung durch eine Pomologin, einen Pomologen oder eine DNA-Analyse macht sie sicher. Vorschläge der App fließen nie als Referenz in die Sortendatenbank zurück.</p>

      <div style={{ marginTop: 20 }}>
        <Verweis ziel="/konto">{konto.status === 'angemeldet' ? 'Konto und Einstellungen' : 'Anmelden und Einstellungen'}</Verweis>
        {!istInstalliert() && <Verweis ziel="/installieren">Auf den Home-Bildschirm legen</Verweis>}
        <Verweis ziel="/sorten/bezug">Alte Sorten bekommen und erhalten</Verweis>
        <Verweis ziel="/rueckmeldung">Rückmeldung geben</Verweis>
        <Verweis ziel="/impressum">Impressum</Verweis>
        <Verweis ziel="/datenschutz">Datenschutz</Verweis>
        <Verweis ziel="/nutzung">Nutzungsbedingungen</Verweis>
      </div>

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Sortendatenbank</h2>
      <p>{index?.anzahl ? `${index.anzahl} Sorten.` : 'Im Aufbau.'} Jeder Wert trägt seine Quelle. Die 3D-Modelle der Sorten sind aus den belegten Merkmalen berechnet und, wo ein frei lizenziertes Referenzbild vorliegt, mit dort gemessenen Farben abgeglichen.</p>
      {index && index.quellen.length > 0 && (
        <ul style={{ paddingLeft: 20 }}>
          {index.quellen.map((q) => (
            <li key={q.id} className="klein" style={{ marginBottom: 6 }}>
              {q.autor ? `${q.autor}: ` : ''}<i>{q.werk}</i>{q.jahr ? ` (${q.jahr})` : ''}. {q.lizenz}.{' '}
              {q.url && <a href={q.url} target="_blank" rel="noreferrer">Link</a>}
            </li>
          ))}
        </ul>
      )}

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Karte</h2>
      <p className="klein">Kartendaten © OpenStreetMap-Mitwirkende (ODbL), Ortssuche mit Nominatim. Luftbild: Esri World Imagery (Esri, Vantor, Earthstar Geographics, GIS User Community).</p>

      <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Schriften</h2>
      <p className="klein">EB Garamond (Georg Duffner, Octavio Pardo) und Pinyon Script (Nicole Fally), beide SIL Open Font License.</p>
    </div>
  )
}
