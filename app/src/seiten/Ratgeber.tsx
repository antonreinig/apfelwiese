import { useEffect, useMemo, useState } from 'react'
import { Medaillon } from '../apfel3d/Buehne.tsx'
import { useSortenindex, parameterAusEintrag } from '../daten/sorten.ts'
import { zurueck } from '../ui/router.ts'
import { Ablaufkopf, Abschnitt, Verweis } from '../ui/Seite.tsx'
import { empfehlungen, START, type Antworten, type Empfehlung } from '../daten/ratgeber.ts'
import { useEinstellungen, setzeRegion, BUNDESLAENDER, BUNDESLAND_NAME } from '../daten/einstellungen.ts'
import { steckbrief } from '../daten/erkunden.ts'
import { L, LANDESGRUPPE, type Link } from '../daten/bezug.ts'

// Kaufratgeber: neun Fragen, danach passende Sorten mit Begründung, Lücken und Hinweisen zum Kauf.

const SPEICHER = 'aw-ratgeber'

interface Option<T> { wert: T; titel: string; text?: string }
interface Frage {
  id: keyof Antworten
  titel: string
  text?: string
  mehrfach?: boolean
  optionen: Option<string | boolean>[]
}

const FRAGEN: Frage[] = [
  { id: 'region', titel: 'Wo soll der Baum stehen?', text: 'Für Sorten aus deiner Region. Die Angabe bleibt auf diesem Gerät.', optionen: [] },
  {
    id: 'lage', titel: 'Wie ist die Lage?', optionen: [
      { wert: 'mild', titel: 'Mild und warm', text: 'Weinbauklima, geschützt, früher Frühling' },
      { wert: 'normal', titel: 'Durchschnittlich', text: 'Weder besonders warm noch rau' },
      { wert: 'rau', titel: 'Rau', text: 'Höhenlage, viel Wind, kurzer Sommer' },
      { wert: 'senke', titel: 'Senke mit Spätfrost', text: 'Kalte Luft sammelt sich, Fröste im Mai' },
    ],
  },
  {
    id: 'boden', titel: 'Wie ist der Boden?', optionen: [
      { wert: 'leicht', titel: 'Leicht und eher trocken', text: 'Sandig, Wasser versickert schnell' },
      { wert: 'mittel', titel: 'Normaler Gartenboden', text: 'Krümelig, weder nass noch staubtrocken' },
      { wert: 'schwer', titel: 'Schwer oder feucht', text: 'Lehmig, Ton, Pfützen nach Regen' },
      { wert: 'unbekannt', titel: 'Weiß ich nicht' },
    ],
  },
  {
    id: 'platz', titel: 'Wie viel Platz hast du?', optionen: [
      { wert: 'wiese', titel: 'Wiese oder großer Garten', text: 'Hochstamm, der groß und alt werden darf' },
      { wert: 'garten', titel: 'Hausgarten', text: 'Halb- oder Hochstamm, mittelgroßer Baum' },
      { wert: 'klein', titel: 'Wenig Platz', text: 'Kleine Baumform, Spindel oder Busch' },
    ],
  },
  {
    id: 'nutzung', titel: 'Was willst du mit den Äpfeln machen?', text: 'Mehrere Antworten möglich.', mehrfach: true, optionen: [
      { wert: 'sommer', titel: 'Im Sommer frisch essen', text: 'Ernte im Juli oder August' },
      { wert: 'herbst', titel: 'Im Herbst frisch essen', text: 'Direkt vom Baum bis in den Spätherbst' },
      { wert: 'lager', titel: 'Lagern bis ins Frühjahr', text: 'Kühler Keller oder Garage' },
      { wert: 'kueche', titel: 'Kochen und Backen', text: 'Kuchen, Mus, Bratäpfel' },
      { wert: 'most', titel: 'Saft und Most' },
    ],
  },
  {
    id: 'geschmack', titel: 'Wie sollen sie schmecken?', optionen: [
      { wert: 'suess', titel: 'Süß' },
      { wert: 'ausgewogen', titel: 'Ausgewogen', text: 'Süß und säuerlich zugleich' },
      { wert: 'saeuerlich', titel: 'Säuerlich und frisch' },
      { wert: 'egal', titel: 'Ist mir nicht so wichtig' },
    ],
  },
  {
    id: 'robust', titel: 'Wie viel Pflege willst du geben?', optionen: [
      { wert: true, titel: 'Wenig, die Sorte soll robust sein', text: 'Ohne Spritzen, möglichst wenig Krankheiten' },
      { wert: false, titel: 'Ich kümmere mich gern', text: 'Schnitt und Pflege machen mir nichts aus' },
    ],
  },
  {
    id: 'nachbarn', titel: 'Stehen andere Apfelbäume in der Nähe?', text: 'Äpfel brauchen Pollen einer anderen Sorte. Bienen fliegen dafür einige hundert Meter; auch Zieräpfel in Nachbargärten zählen.', optionen: [
      { wert: 'ja', titel: 'Ja, in der Nachbarschaft' },
      { wert: 'nein', titel: 'Nein, weit und breit keine' },
      { wert: 'unbekannt', titel: 'Weiß ich nicht' },
    ],
  },
  {
    id: 'vorliebe', titel: 'Was ist dir außerdem wichtig?', text: 'Mehrere Antworten möglich, oder keine.', mehrfach: true, optionen: [
      { wert: 'alt', titel: 'Eine alte Sorte', text: 'Entstanden oder beschrieben vor 1950' },
      { wert: 'regional', titel: 'Eine Sorte aus meiner Region', text: 'Dort entstanden oder als Regionalsorte geführt' },
    ],
  },
]

function laden(): { antworten: Antworten; schritt: number } {
  try {
    const d = JSON.parse(localStorage.getItem(SPEICHER) ?? 'null')
    if (d && typeof d.schritt === 'number' && d.antworten) return { antworten: { ...START, ...d.antworten }, schritt: Math.min(d.schritt, FRAGEN.length) }
  } catch { /* privat */ }
  return { antworten: START, schritt: 0 }
}

export default function RatgeberSeite() {
  const einst = useEinstellungen()
  const [{ antworten, schritt }, setStand] = useState(() => {
    const s = laden()
    return { ...s, antworten: { ...s.antworten, region: s.antworten.region ?? einst.region } }
  })
  useEffect(() => { try { localStorage.setItem(SPEICHER, JSON.stringify({ antworten, schritt })) } catch { /* privat */ } }, [antworten, schritt])
  const setze = (a: Partial<Antworten>) => setStand((s) => ({ ...s, antworten: { ...s.antworten, ...a } }))
  const gehe = (n: number) => { setStand((s) => ({ ...s, schritt: n })); document.querySelector('.seite')?.scrollTo(0, 0) }

  return (
    <div className="seite">
      <Ablaufkopf
        name="Sortenratgeber"
        schritt={schritt < FRAGEN.length ? `Frage ${schritt + 1} von ${FRAGEN.length}` : 'Ergebnis'}
        zurueck={() => (schritt > 0 ? gehe(schritt - 1) : zurueck('/sorten'))}
        schliessen={() => zurueck('/sorten')}
        schliessenLabel="Ratgeber schließen"
      />
      {schritt < FRAGEN.length
        ? <FrageAnsicht frage={FRAGEN[schritt]} antworten={antworten} setze={setze} weiter={() => gehe(schritt + 1)} />
        : <Ergebnis antworten={antworten} aendern={gehe} neu={() => setStand({ antworten: { ...START, region: einst.region }, schritt: 0 })} />}
    </div>
  )
}

function FrageAnsicht({ frage, antworten, setze, weiter }: { frage: Frage; antworten: Antworten; setze: (a: Partial<Antworten>) => void; weiter: () => void }) {
  const wert = antworten[frage.id]
  const gewaehlt = (w: string | boolean) => (Array.isArray(wert) ? (wert as unknown[]).includes(w) : wert === w)
  const waehle = (w: string | boolean) => {
    if (frage.mehrfach) {
      const l = (wert as string[]) ?? []
      setze({ [frage.id]: l.includes(w as string) ? l.filter((x) => x !== w) : [...l, w] } as Partial<Antworten>)
    } else {
      setze({ [frage.id]: w } as Partial<Antworten>)
      setTimeout(weiter, 180)
    }
  }
  return (
    <div style={{ marginTop: 18 }}>
      <h1 className="name titel-schritt">{frage.titel}</h1>
      {frage.text && <p className="klein kursiv" style={{ marginTop: 4 }}>{frage.text}</p>}
      {frage.id === 'region' ? (
        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          <select className="eingabe" aria-label="Bundesland" value={antworten.region ?? ''} onChange={(e) => { const r = e.target.value || null; setze({ region: r }); if (r) setzeRegion(r) }}>
            <option value="">Keine Angabe oder nicht in Deutschland</option>
            {BUNDESLAENDER.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <button className="knopf haupt" onClick={weiter} style={{ marginTop: 10 }}>Weiter</button>
        </div>
      ) : (
        <div role={frage.mehrfach ? 'group' : 'radiogroup'} aria-label={frage.titel} style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          {frage.optionen.map((o) => {
            const an = gewaehlt(o.wert)
            return (
              <button key={String(o.wert)} role={frage.mehrfach ? 'checkbox' : 'radio'} aria-checked={an} onClick={() => waehle(o.wert)}
                className="karte-papier" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', borderColor: an ? 'var(--tinte)' : undefined, boxShadow: an ? 'inset 0 0 0 1.5px var(--tinte)' : undefined }}>
                <span aria-hidden style={{ width: 22, height: 22, flex: 'none', borderRadius: frage.mehrfach ? 6 : '50%', border: '1px solid var(--linie-stark)', background: an ? 'var(--tinte)' : 'transparent', boxShadow: an ? 'inset 0 0 0 4px var(--papier-3)' : undefined }} />
                <span>
                  <span style={{ display: 'block', fontSize: 18 }}>{o.titel}</span>
                  {o.text && <span className="sehr-klein" style={{ display: 'block' }}>{o.text}</span>}
                </span>
              </button>
            )
          })}
          {frage.mehrfach && <button className="knopf haupt" onClick={weiter} style={{ marginTop: 10 }}>{(wert as string[]).length ? 'Weiter' : 'Überspringen'}</button>}
        </div>
      )}
    </div>
  )
}

function antwortText(f: Frage, a: Antworten): string {
  if (f.id === 'region') return a.region ? BUNDESLAND_NAME[a.region] : 'ohne Region'
  const w = a[f.id]
  if (Array.isArray(w)) return w.length ? w.map((x) => f.optionen.find((o) => o.wert === x)?.titel ?? x).join(', ') : 'nichts Besonderes'
  return f.optionen.find((o) => o.wert === w)?.titel ?? ''
}

function Ergebnis({ antworten, aendern, neu }: { antworten: Antworten; aendern: (n: number) => void; neu: () => void }) {
  const index = useSortenindex()
  const [anzahl, setAnzahl] = useState(10)
  const e = useMemo(() => (index ? empfehlungen(index.sorten, antworten) : null), [index, antworten])
  return (
    <div style={{ marginTop: 12 }}>
      <h1 className="name titel-schritt">Diese Sorten passen</h1>
      <div className="chips" style={{ flexWrap: 'wrap', marginTop: 8 }}>
        {FRAGEN.map((f, i) => <button key={f.id} className="chip" onClick={() => aendern(i)} aria-label={`${f.titel} ändern`}>{antwortText(f, antworten)}</button>)}
      </div>
      {e && (
        <p className="sehr-klein" style={{ marginTop: 10 }}>
          Bewertet wurden {e.pool} Sorten, zu denen die Quellen etwas über Anbau, Standort oder Krankheiten sagen; {e.anzahlPassend} passen ohne schweren Gegengrund.
          Fehlt eine Angabe, zählt sie nicht gegen die Sorte.
        </p>
      )}
      {e && e.liste.length === 0 && <p className="hinweis">Keine Sorte passt zu allen Antworten. Lass eine Antwort weg oder ändere sie, zum Beispiel den Geschmack.</p>}
      <div style={{ marginTop: 6 }}>
        {e?.liste.slice(0, anzahl).map((x, i) => <Karte key={x.sorte.id} e={x} platz={i + 1} />)}
      </div>
      {e && e.liste.length > anzahl && <button className="knopf" onClick={() => setAnzahl(anzahl + 10)} style={{ marginTop: 8 }}>Weitere Sorten</button>}

      <Kaufhinweise antworten={antworten} />

      <div style={{ marginTop: 10 }}><Verweis ziel="/sorten/bezug">Wo bekomme ich diese Sorten? Baumschulen, Reiserbörsen, Pomologen</Verweis></div>
      <button className="knopf leise" onClick={neu} style={{ marginTop: 14 }}>Ratgeber neu beginnen</button>
    </div>
  )
}

function Karte({ e, platz }: { e: Empfehlung; platz: number }) {
  const s = e.sorte
  const fuer = e.gruende.filter((g) => g.punkte > 0)
  const gegen = e.gruende.filter((g) => g.punkte < 0)
  return (
    <a href={`#/sorte/${s.id}`} className="karte-papier" style={{ display: 'block', textDecoration: 'none', marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Medaillon p={parameterAusEintrag(s)} groesse={68} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sehr-klein">{platz}.</div>
          <div className="name" style={{ fontSize: 28, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
          <div className="sehr-klein">{steckbrief(s)}</div>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', fontSize: 15 }}>
        {fuer.map((g, i) => <li key={i} style={{ color: 'var(--gut)' }}>＋ <span style={{ color: 'var(--tinte)' }}>{g.text}</span></li>)}
        {gegen.map((g, i) => <li key={i} style={{ color: 'var(--warn)' }}>－ <span style={{ color: 'var(--tinte)' }}>{g.text}</span></li>)}
        {e.luecken.length > 0 && <li className="sehr-klein kursiv" style={{ marginTop: 2 }}>Keine Angabe zu: {e.luecken.join(', ')}</li>}
      </ul>
    </a>
  )
}

function Kaufhinweise({ antworten }: { antworten: Antworten }) {
  const h: { titel: string; text: string; quelle: Link }[] = []
  if (antworten.platz === 'wiese') h.push({ titel: 'Baumform', text: 'Für die Wiese: Hochstamm mit mindestens 180 cm Stammhöhe auf Sämlingsunterlage, etwa Bittenfelder. Er trägt erst nach einigen Jahren, kann aber über 100 Jahre alt werden und braucht etwa 80 m².', quelle: L.lwgUnterlagen })
  if (antworten.platz === 'garten') h.push({ titel: 'Baumform', text: 'Für den Hausgarten: Halbstamm auf mittelstark wachsender Unterlage wie MM106 oder M7, etwa 25 m² Platz, mit Pfahl. Frag in der Baumschule nach der Unterlage; sie bestimmt die Größe mehr als die Sorte.', quelle: L.lwgUnterlagen })
  if (antworten.platz === 'klein') h.push({ titel: 'Baumform', text: 'Für wenig Platz: Spindel oder Busch auf schwach wachsender Unterlage wie M9 oder M26. Sie trägt früh, lebt aber nur 15 bis 20 Jahre und braucht dauerhaft einen Pfahl, guten Boden und Wasser.', quelle: L.lwgUnterlagen })
  if (antworten.nachbarn !== 'ja') h.push({ titel: 'Befruchtung', text: 'Äpfel tragen nur mit Pollen einer anderen Sorte, die etwa gleichzeitig blüht. Ohne Apfelbäume in der Nähe pflanze zwei oder drei verschiedene Sorten. Neben einer triploiden Sorte braucht es zwei weitere.', quelle: L.lwgHausgarten })
  if (antworten.lage === 'senke' || antworten.lage === 'rau') h.push({ titel: 'Spätfrost', text: 'Früh blühende Sorten trifft Spätfrost eher. Pflanze nicht an die tiefste Stelle, dort sammelt sich die Kaltluft.', quelle: L.shEmpfehlung })
  h.push({ titel: 'Pflanzzeit', text: 'Wurzelnackte Bäume von Ende September bis Anfang Dezember oder von Anfang März bis Ende April, an frostfreien Tagen. Im Herbst ist das Angebot am größten.', quelle: L.lwgPflanzzeit })
  if (antworten.region && LANDESGRUPPE[antworten.region]) h.push({ titel: 'Beratung', text: `Regionale Sortenlisten, Ausstellungen und Kurse kennt die ${LANDESGRUPPE[antworten.region].titel} des Pomologen-Vereins.`, quelle: LANDESGRUPPE[antworten.region] })
  return (
    <Abschnitt titel="Worauf du beim Kauf achten solltest">
      {h.map((x) => (
        <p key={x.titel} style={{ margin: '0 0 10px' }}>
          <span className="kapitaelchen">{x.titel}.</span> {x.text} <a href={x.quelle.url} target="_blank" rel="noreferrer" className="sehr-klein">Quelle</a>
        </p>
      ))}
    </Abschnitt>
  )
}
