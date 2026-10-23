import type { ReactNode } from 'react'
import { zurueck } from '../ui/router.ts'
import { Zurueck } from '../ui/symbole.tsx'
import { useEinstellungen, BUNDESLAND_NAME } from '../daten/einstellungen.ts'
import { L, LANDESGRUPPE, REGIONAL, STAND_BEZUG, type Link } from '../daten/bezug.ts'
import { RegionWahl } from './Sorten.tsx'

// Alte Sorten bekommen und erhalten: bestimmen lassen, Baum kaufen, Reiser und Veredeln, mitmachen.
// Inhalte aus daten/ratgeber/recherche-bezug.md; jede Angabe mit Quelle.

const Q = ({ l, children }: { l: Link; children?: ReactNode }) => (
  <a href={l.url} target="_blank" rel="noreferrer">{children ?? l.titel}</a>
)

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 className="kapitaelchen" style={{ fontSize: 18, marginBottom: 6 }}>{titel}</h2>
      {children}
    </section>
  )
}

const JAHR: [string, string][] = [
  ['Februar, März', 'Reiserbörsen; Edelreiser im Winter geschnitten, im Frühjahr veredelt'],
  ['März, April', 'zweite Pflanzzeit für wurzelnackte Bäume'],
  ['August, September', 'Sammelbestellungen von Hochstämmen über Landkreise, Landschaftspflegeverbände und Naturschutzgruppen'],
  ['Ende September, Oktober', 'Apfeltage und Obstsortenausstellungen mit Sortenbestimmung'],
  ['Ende September bis Anfang Dezember', 'beste Pflanzzeit, größte Auswahl an Sorten'],
  ['bis 15. November', 'Edelreiser beim Erhalternetzwerk bestellen, Versand bis Anfang März'],
]

export default function BezugSeite() {
  const { region } = useEinstellungen()
  const regional = region ? REGIONAL[region] ?? [] : []
  return (
    <div className="seite">
      <button className="rund-knopf" onClick={() => zurueck('/sorten')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 40, marginTop: 8 }}>Alte Sorten bekommen und erhalten</h1>
      <p className="klein kursiv" style={{ marginTop: 4 }}>Viele alte Sorten stehen nur noch auf wenigen Wiesen. Wer eine davon pflanzt oder einen alten Baum vermehren lässt, hilft, sie zu erhalten. So kommst du an gute Bäume.</p>

      <Abschnitt titel="Übers Jahr">
        <div style={{ borderLeft: '1.5px solid var(--blatt)', paddingLeft: 14, marginLeft: 4 }}>
          {JAHR.map(([wann, was]) => (
            <p key={wann} style={{ margin: '0 0 8px' }}><span className="kapitaelchen">{wann}.</span> {was}</p>
          ))}
        </div>
      </Abschnitt>

      <Abschnitt titel="In deiner Region">
        <RegionWahl />
        {region && (
          <div style={{ marginTop: 10 }}>
            {LANDESGRUPPE[region] && (
              <p style={{ margin: '0 0 8px' }}>Für {BUNDESLAND_NAME[region]} ist die <Q l={LANDESGRUPPE[region]} /> des Pomologen-Vereins zuständig. Dort stehen Ausstellungen, Kurse und Reiserbörsen.</p>
            )}
            {regional.map((r) => <p key={r.text} style={{ margin: '0 0 8px' }}>{r.text} <Q l={r.link}>Mehr</Q></p>)}
            <p style={{ margin: '0 0 8px' }}><a href={`#/sorten/region/${region}`}>Sorten aus {BUNDESLAND_NAME[region]}</a> in der Datenbank.</p>
          </div>
        )}
      </Abschnitt>

      <Abschnitt titel="1. Die Sorte bestimmen lassen">
        <p>Steht ein alter Baum unbekannter Sorte in deinem Garten, ist er vielleicht ein Fund. Pomologinnen und Pomologen bestimmen Sorten an echten Früchten, meist auf Apfeltagen und Obstsortenausstellungen im Herbst. Fotos reichen ihnen nicht; auch der Sortenvorschlag dieser App ist nur ein Hinweis.</p>
        <p><span className="kapitaelchen">Mitbringen:</span> drei bis fünf typische, reife Früchte ohne Wurmstich, möglichst von der Sonnenseite. Stiel dranlassen, nicht waschen oder polieren, stoßfest verpacken. Ein Zweig mit Blättern oder ein Foto des Baums helfen zusätzlich. <Q l={L.pvFaq}>Quelle</Q></p>
      </Abschnitt>

      <Abschnitt titel="2. Einen Baum kaufen">
        <p>Alte Sorten führen vor allem kleinere Baumschulen. Der NABU sammelt nach Bundesländern Baumschulen, die Hochstämme anbieten. <Q l={L.nabuBaumschulen}>Liste</Q></p>
        <p>Günstig und regional sind <span className="kapitaelchen">Sammelbestellungen</span>: Landkreise, Landschaftspflegeverbände und Naturschutzgruppen bestellen im Spätsommer heimische Sorten und geben die Bäume im November aus. Frag bei deinem Landkreis oder der NABU- oder BUND-Gruppe vor Ort.</p>
        <p><span className="kapitaelchen">Woran du einen guten Hochstamm erkennst:</span> Stammhöhe mindestens 180 cm, gerader, unverletzter Stamm, drei bis vier gut verteilte Seitentriebe, sauber verwachsene Veredelungsstelle, frische Wurzeln. <Q l={L.stuttgartPflanzung}>Quelle</Q></p>
        <p><span className="kapitaelchen">Frag nach der Unterlage.</span> Sie bestimmt Größe, Lebensdauer und Ertragsbeginn mehr als die Sorte:</p>
        <table className="klein" style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0 8px' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '0.5px solid var(--linie-stark)' }}><th style={{ padding: '4px 6px 4px 0' }}>Unterlage</th><th style={{ padding: 4 }}>Baum</th><th style={{ padding: 4 }}>Eigenschaften</th></tr></thead>
          <tbody>
            {[
              ['Sämling (z. B. Bittenfelder)', 'Hoch- und Halbstamm, etwa 80 m²', 'frosthart, genügsam; trägt spät, wird über 100 Jahre alt'],
              ['A2, M25, M11', 'Halb- und Hochstamm, etwa 65 m²', 'stark wachsend, Ertrag ab dem 4. bis 7. Jahr'],
              ['MM106, M7', 'Halbstamm, Busch, etwa 25 m²', 'mittelstark, braucht einen Pfahl'],
              ['M9, M26, M27', 'Spindel, Busch, kleines Spalier', 'trägt früh, lebt 15 bis 20 Jahre; Pfahl, guter Boden und Wasser nötig'],
            ].map(([u, b, e]) => (
              <tr key={u} style={{ borderBottom: '0.5px dotted var(--linie)', verticalAlign: 'top' }}><td style={{ padding: '4px 6px 4px 0' }}>{u}</td><td style={{ padding: 4 }}>{b}</td><td style={{ padding: 4 }}>{e}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="sehr-klein" style={{ marginTop: 0 }}><Q l={L.lwgUnterlagen} />, <Q l={L.pvFaq}>Pomologen-Verein</Q></p>
        <p><span className="kapitaelchen">Befruchtung:</span> Apfelbäume brauchen Pollen einer anderen Sorte, die etwa gleichzeitig blüht. Gut sind zwei oder drei verschiedene Sorten in der Nähe. Triploide Sorten wie Boskoop, Jakob Lebel oder Kaiser Wilhelm geben keinen brauchbaren Pollen; neben ihnen braucht es zwei weitere Sorten. <Q l={L.lwgStreuobst}>Quelle</Q></p>
        <p><span className="kapitaelchen">Pflanzzeit:</span> wurzelnackte Bäume von Ende September bis Anfang Dezember oder von Anfang März bis Ende April, an frostfreien Tagen. Für Äpfel eignet sich der Herbst besonders: großes Angebot, die Wurzeln wachsen noch vor dem Winter an. <Q l={L.lwgPflanzzeit}>Quelle</Q></p>
        <p>Hochstämme brauchen 8 bis 10 m Abstand, einen Pfahl auf der Südwestseite, wo Wühlmäuse vorkommen einen Drahtkorb um die Wurzeln, Schutz vor Wildverbiss und eine freie Baumscheibe in den ersten Jahren. <Q l={L.stuttgartPflanzung}>Quelle</Q></p>
      </Abschnitt>

      <Abschnitt titel="3. Edelreiser und Veredeln">
        <p>Aus Kernen wächst nie dieselbe Sorte. Alte Sorten werden vermehrt, indem man einen Zweig, das Edelreis, auf eine Unterlage veredelt.</p>
        <p><span className="kapitaelchen">Seltene Sorten:</span> Das Erhalternetzwerk Obstsortenvielfalt des Pomologen-Vereins gibt Edelreiser sortenecht geprüfter Sorten ab. In der <Q l={L.erhalterBoerse}>Sortenbörse</Q> die Sorte suchen und bis 15. November beim Erhalter bestellen; versandt wird bis Anfang März. Gebühren in der Saison 2025/26: 7 € je Bestellung, 5 € für das erste und 2 € für jedes weitere Reis einer Sorte, dazu Porto. <Q l={L.erhalterBedingungen}>Bedingungen</Q></p>
        <p><span className="kapitaelchen">Reiserbörsen</span> der Landesgruppen und Naturschutzgruppen finden im Februar und März statt. Dort tauschen Leute Reiser ihrer Bäume, oft wird auch vor Ort veredelt.</p>
        <p><span className="kapitaelchen">Den eigenen alten Baum vermehren:</span> im Winter einjährige, etwa bleistiftstarke Triebe von 25 cm Länge schneiden, kühl und feucht lagern und im Frühjahr veredeln. Veredeln lernt man in Kursen der <Q l={L.pvSeminare}>Landesgruppen</Q>; manche Mitglieder bieten Baumschularbeiten an.</p>
        <p className="sehr-klein">Auch die Deutsche Genbank Obst gibt Reiser in Kleinstmengen nach Verfügbarkeit ab, ohne Anspruch darauf. <Q l={L.dgo}>Bedingungen</Q></p>
      </Abschnitt>

      <Abschnitt titel="4. Mitmachen und erhalten">
        <p>Der Pomologen-Verein hat zwölf Landesgruppen und zwei Regionalgruppen. Mitglieder bekommen ein Jahresheft und Rundbriefe; der Beitrag liegt seit 2025 bei 60 € im Jahr, ermäßigt 36 €, für Kinder und Jugendliche frei. <Q l={L.pvGruppen}>Gruppen</Q>, <Q l={L.pvMitglied}>Mitgliedschaft</Q></p>
        <p>Regionen wählen jedes Jahr eine eigene <Q l={L.pvSorteDesJahres}>Obstsorte des Jahres</Q>, um eine alte Sorte bekannt zu machen; dazu gibt es Pflanzaktionen und Faltblätter. Regionale Sortenbroschüren verkauft der Verein im <Q l={L.pvShop}>Shop</Q>.</p>
        <p>Streuobstwiesen brauchen Pflege: Viele Naturschutzgruppen suchen Helfende für Schnitt, Mahd und Ernte. Termine und den Newsletter „Streuobst aktuell“ gibt es bei <Q l={L.hochstamm} />.</p>
        <p>Und in dieser App: Dokumentiere deine alten Bäume auf der Wiese. Bestätigt ein Pomologe die Sorte, trag es beim Baum ein.</p>
      </Abschnitt>

      <p className="sehr-klein kursiv" style={{ marginTop: 26 }}>Stand {STAND_BEZUG}. Termine, Gebühren und Förderprogramme ändern sich; die verlinkten Seiten gelten.</p>
    </div>
  )
}
