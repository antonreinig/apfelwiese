import { useSortenindex } from '../daten/sorten.ts'
import { istInstalliert } from './Installieren.tsx'
import { Seitenkopf, Abschnitt, Verweis } from '../ui/Seite.tsx'
import { datum, zahl } from '../ui/format.ts'

// Über die App: Funktionsweise, Quellen, Rechtliches. Konto und Einstellungen stehen in Konto.tsx.

export default function InfoSeite() {
  const index = useSortenindex()
  return (
    <div className="seite">
      <Seitenkopf titel="Apfelwiese" untertitel={`Alte Apfelsorten bestimmen und dokumentieren. Prototyp, Stand ${index?.stand ? datum(index.stand) : 'Oktober 2026'}.`} />
      <hr className="doppellinie" />

      <Abschnitt titel="So funktioniert es">
      <p>Pro Baum schneidest du vier typische Äpfel auf und fotografierst sie auf einem weißen A4-Blatt: vier Fotos, jedes zeigt andere Merkmale. Das Blatt dient als Maßstab und für den Weißabgleich. Die App erkennt das Blatt, misst Größe und Farben per Programm und baut daraus ein 3D-Modell deines Apfels.</p>
      <p>Was die App findet, ist ein Sortenvorschlag. Sicher wird eine Bestimmung erst durch eine Pomologin, einen Pomologen oder eine DNA-Analyse. Vorschläge der App fließen nie als Referenz in die Sortendatenbank zurück.</p>
      </Abschnitt>

      <div style={{ marginTop: 20 }}>
        <Verweis ziel="/konto">Konto</Verweis>
        {!istInstalliert() && <Verweis ziel="/installieren">Auf den Home-Bildschirm legen</Verweis>}
        <Verweis ziel="/sorten/bezug">Alte Sorten bekommen und erhalten</Verweis>
        <Verweis ziel="/rueckmeldung">Rückmeldung geben</Verweis>
        <Verweis ziel="/impressum">Impressum</Verweis>
        <Verweis ziel="/datenschutz">Datenschutz</Verweis>
        <Verweis ziel="/nutzung">Nutzungsbedingungen</Verweis>
      </div>

      <Abschnitt titel="Sortendatenbank">
      <p>{index?.anzahl ? `${zahl(index.anzahl)} Sorten.` : 'Im Aufbau.'} Jeder Wert trägt seine Quelle. Die 3D-Modelle der Sorten sind aus den belegten Merkmalen berechnet und, wo ein frei lizenziertes Referenzbild vorliegt, mit dort gemessenen Farben abgeglichen.</p>
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
      </Abschnitt>

      <Abschnitt titel="Wiese: Luftbild und Straßenkarte">
      <p className="klein">Kartendaten © OpenStreetMap-Mitwirkende (ODbL), Ortssuche mit Nominatim. Luftbild: Esri World Imagery (Esri, Vantor, Earthstar Geographics, GIS User Community).</p>
      </Abschnitt>

      <Abschnitt titel="Schriften">
      <p className="klein">EB Garamond (Georg Duffner, Octavio Pardo) und Pinyon Script (Nicole Fally), beide SIL Open Font License.</p>
      </Abschnitt>
    </div>
  )
}
