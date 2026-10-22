import { useMemo, useRef, useState } from 'react'
import { Kamera, type Aufnahme } from '../kamera/Kamera.tsx'
import { werteAus, messungAusFotos, blattImFoto, ausschnitteAus } from '../kamera/auswerten.ts'
import { bewerteBefund, type Blattbefund } from '../kamera/blatterkennung.ts'
import type { Fotoauswertung } from '../kamera/messung.ts'
import { useBaeume, speichereBaum, speichereFoto, loescheFoto, neueId, type Baum, type Fotosatz, type Fotomessung } from '../daten/baeume.ts'
import { useSortenindex } from '../daten/sorten.ts'
import { gleicheAb, type Kandidat } from '../daten/abgleich.ts'
import { darstellungAus, saatAusText, type ApfelParameter } from '../apfel3d/darstellung.ts'
import { ApfelBuehne, Medaillon } from '../apfel3d/Buehne.tsx'
import { parameterAusEintrag } from '../daten/sorten.ts'
import { MERKMAL_NACH_ID } from '../daten/merkmalskatalog.ts'
import { gehe, zurueck } from '../ui/router.ts'
import { Zurueck, Kreuz, Kamera as KameraSymbol, Foto, Ort, Pfeil } from '../ui/symbole.tsx'
import { Skizze } from '../ui/Skizze.tsx'
import { MerkmalChips } from '../ui/MerkmalChips.tsx'
import { meldeFehler } from '../ui/protokoll.ts'

// Ablauf: Baum anlegen → vier Fotos (je mit Prüfung) → Fragen → Ergebnis mit 3D-Modell und Abgleich

export const FOTOS = [
  {
    titel: 'Längshälften, Schale nach oben',
    schneiden: 'Äpfel A und B längs genau durch Stiel und Kelch halbieren.',
    legen: 'Alle vier Hälften mit der Schnittfläche nach unten legen. Bei Apfel A die stärker gefärbte Seite nach oben, bei Apfel B die blassere.',
    zeigt: 'Umriss und Größe, Grundfarbe, Deckfarbe, Berostung, Schalenpunkte',
  },
  {
    titel: 'Längsscheiben, Kernhaus nach oben',
    schneiden: 'Von jeder Hälfte die runde Kappe parallel zur Schnittfläche abschneiden, sodass eine etwa 1 cm dicke Scheibe bleibt.',
    legen: 'Die Scheiben mit der mittigen Schnittfläche nach oben legen. Danach die Kerne von Apfel A herauslösen, auch aus den Kappen.',
    zeigt: 'Kernhaus, Kelchhöhle, Stiel- und Kelchgrube, Fleischfarbe',
  },
  {
    titel: 'Querhälften, Schale nach oben, mit Kernen',
    schneiden: 'Äpfel C und D quer an der breitesten Stelle durch die Mitte des Kernhauses halbieren.',
    legen: 'Alle vier Hälften mit der Schnittfläche nach unten legen: zwei zeigen den Kelch, zwei die Stielgrube. Die Kerne von Apfel A am Rand in eine Reihe legen.',
    zeigt: 'Kelch, Kelchgrube, Stiel, Stielgrube, Durchmesser, Kerne',
  },
  {
    titel: 'Querscheiben, Kernhausstern nach oben',
    schneiden: 'Von jeder Hälfte die runde Kappe abschneiden, sodass eine etwa 1 cm dicke Scheibe bleibt.',
    legen: 'Mit der mittigen Schnittfläche nach oben legen. Die Kerne bleiben am Rand liegen.',
    zeigt: 'Kernhausstern, Kernfächer, Gefäßbündel, Fleischfarbe',
  },
]

interface Foto {
  blob: Blob
  url: string
  befund: Blattbefund | null
  auswertung?: Fotoauswertung
  vorschau?: Blob
  vorschauUrl?: string
  blatt?: Blob
  blattUrl?: string
  fehler?: string
}

type Schritt = { art: 'baum' } | { art: 'foto'; i: number } | { art: 'pruefen'; i: number } | { art: 'fragen' } | { art: 'ergebnis' }

export default function BestimmenSeite({ baumId }: { baumId?: string }) {
  const { baeume } = useBaeume()
  const vorhanden = baumId ? baeume.find((b) => b.id === baumId) : undefined
  const [schritt, setSchritt] = useState<Schritt>(baumId ? { art: 'foto', i: 0 } : { art: 'baum' })
  const [name, setName] = useState('')
  const [ort, setOrt] = useState('')
  const [standort, setStandort] = useState<Baum['standort']>()
  const [fotos, setFotos] = useState<(Foto | null)[]>([null, null, null, null])
  const [kamera, setKamera] = useState<number | null>(null)
  const [angaben, setAngaben] = useState<Record<string, string[]>>({})
  const testfeed = import.meta.env.DEV && new URLSearchParams(window.location.search).has('testfeed')

  const standardName = `Baum ${baeume.length + 1}`

  // Welches Foto gerade an welcher Stelle gilt; späte Ergebnisse verworfener Fotos werden ignoriert
  const aktuell = useRef<(Blob | null)[]>([null, null, null, null])
  const setzeFoto = (i: number, f: Foto | null) => {
    aktuell.current[i] = f?.blob ?? null
    setFotos((alt) => alt.map((x, k) => (k === i ? f : x)))
  }

  const fotoAufnehmen = async (i: number, blob: Blob, befund: Blattbefund | null) => {
    const url = URL.createObjectURL(blob)
    const f: Foto = { blob, url, befund }
    setzeFoto(i, f)
    setSchritt({ art: 'pruefen', i })
    const gilt = () => aktuell.current[i] === blob
    try {
      const geprueft = befund ?? (await blattImFoto(blob)).befund
      if (!gilt()) return
      setzeFoto(i, { ...f, befund: geprueft })
      const { auswertung, vorschau, blatt } = await werteAus(blob, geprueft.gefunden && !geprueft.randBeruehrt.length ? geprueft.ecken : undefined)
      if (!gilt()) return
      setzeFoto(i, {
        ...f, befund: geprueft, auswertung,
        vorschau: vorschau ?? undefined, vorschauUrl: vorschau ? URL.createObjectURL(vorschau) : undefined,
        blatt: blatt ?? undefined, blattUrl: blatt ? URL.createObjectURL(blatt) : undefined,
      })
    } catch (e) {
      meldeFehler('messung', e, `Foto ${i + 1}`)
      if (gilt()) setzeFoto(i, { ...f, fehler: e instanceof Error ? e.message : String(e) })
    }
  }

  const messung = useMemo<Fotomessung | null>(() => {
    if (fotos.every((f) => !f?.auswertung)) return null
    return messungAusFotos(fotos.map((f) => f?.auswertung ?? null))
  }, [fotos])

  // Ein Schritt zurück: Foto ← Prüfung ← nächstes Foto …; vom ersten Schritt aus abbrechen
  const schrittZurueck = () => {
    const erst: Schritt = baumId ? { art: 'foto', i: 0 } : { art: 'baum' }
    if (schritt.art === 'baum' || (schritt.art === 'foto' && schritt.i === 0 && baumId)) return abbrechen()
    if (schritt.art === 'foto') {
      if (schritt.i === 0) return setSchritt(erst)
      const vorher = schritt.i - 1
      return setSchritt(fotos[vorher] ? { art: 'pruefen', i: vorher } : { art: 'foto', i: vorher })
    }
    if (schritt.art === 'pruefen') return setSchritt({ art: 'foto', i: schritt.i })
    if (schritt.art === 'fragen') return setSchritt(fotos[3] ? { art: 'pruefen', i: 3 } : { art: 'foto', i: 3 })
    if (schritt.art === 'ergebnis') return setSchritt({ art: 'fragen' })
  }

  const abbrechen = () => {
    if (fotos.some(Boolean) && !confirm('Abbrechen? Die Fotos dieses Durchgangs werden nicht gespeichert.')) return
    zurueck(baumId ? `/baum/${baumId}` : '/')
  }

  const speichern = async (vorschlag?: Kandidat, danach = '') => {
    const geschrieben: string[] = []
    const ablegen = async (b?: Blob) => { if (!b) return null; const k = await speichereFoto(b); geschrieben.push(k); return k }
    try {
      await speichernIntern(vorschlag, ablegen, danach)
    } catch (e) {
      // halb geschriebene Fotos wieder entfernen
      for (const k of geschrieben) await loescheFoto(k).catch(() => {})
      throw e
    }
  }

  const speichernIntern = async (vorschlag: Kandidat | undefined, ablegen: (b?: Blob) => Promise<string | null>, danach: string) => {
    const satz: Fotosatz = {
      id: neueId(),
      datum: new Date().toISOString(),
      fotos: await Promise.all(fotos.map((f) => ablegen(f?.blob))),
      vorschau: await Promise.all(fotos.map((f) => ablegen(f?.vorschau))),
      blatt: await Promise.all(fotos.map((f) => ablegen(f?.blatt))),
      ausschnitte: fotos.map((f) => (f?.auswertung ? ausschnitteAus(f.auswertung) : null)),
      messung: messung ?? undefined,
    }
    const eigeneAngaben = alsWerte(angaben)
    const jetzt = new Date().toISOString()
    const baum: Baum = vorhanden
      ? { ...vorhanden, fotosaetze: [...vorhanden.fotosaetze, satz], angaben: [...vorhanden.angaben.filter((a) => !angaben[a.merkmal]?.length), ...eigeneAngaben] }
      : { id: neueId(), name: name.trim() || standardName, ort: ort.trim() || undefined, standort, erstellt: jetzt, geaendert: jetzt, bestimmung: { status: 'unbestimmt' }, fotosaetze: [satz], angaben: eigeneAngaben }
    if (vorschlag && (baum.bestimmung.status === 'unbestimmt' || baum.bestimmung.status === 'vorschlag')) {
      baum.bestimmung = {
        status: 'vorschlag', sorteId: vorschlag.sorte.id, sorteName: vorschlag.sorte.name, datum: jetzt.slice(0, 10),
        anmerkung: `Vorläufiger Abgleich: ${Math.round(vorschlag.punkte * 100)} % Übereinstimmung in ${vorschlag.verglichen} Merkmalen. Nicht bestätigt.`,
      }
    }
    await speichereBaum(baum)
    gehe(`/baum/${baum.id}`, true)
    if (danach) gehe(`/baum/${baum.id}${danach}`)
  }

  // ---------------------------------------------------------------- Darstellung
  if (kamera !== null) {
    return (
      <Kamera
        titel={`Foto ${kamera + 1} von 4 · ${FOTOS[kamera].titel}`}
        testfeed={testfeed}
        onAbbruch={() => setKamera(null)}
        onAufnahme={(a: Aufnahme) => { const i = kamera; setKamera(null); fotoAufnehmen(i, a.blob, a.befund) }}
      />
    )
  }

  return (
    <div className="seite" style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="rund-knopf" onClick={schrittZurueck} aria-label="Einen Schritt zurück"><Zurueck /></button>
        <div className="tafelkopf" style={{ flex: 1, border: 'none' }}>
          <span>{vorhanden ? vorhanden.name : 'Neuer Baum'}</span>
          <Fortschritt schritt={schritt} fotos={fotos} />
        </div>
        <button className="rund-knopf" onClick={abbrechen} aria-label="Abbrechen"><Kreuz /></button>
      </div>

      {schritt.art === 'baum' && (
        <BaumAnlegen name={name} setName={setName} standardName={standardName} ort={ort} setOrt={setOrt} standort={standort} setStandort={setStandort}
          weiter={() => setSchritt({ art: 'foto', i: 0 })} />
      )}

      {schritt.art === 'foto' && (
        <FotoSchritt i={schritt.i} onKamera={() => setKamera(schritt.i)} onDatei={(b) => fotoAufnehmen(schritt.i, b, null)}
          onUeberspringen={() => setSchritt(schritt.i < 3 ? { art: 'foto', i: schritt.i + 1 } : { art: 'fragen' })} />
      )}

      {schritt.art === 'pruefen' && (
        <Pruefen foto={fotos[schritt.i]} i={schritt.i}
          nochmal={() => { setzeFoto(schritt.i, null); setSchritt({ art: 'foto', i: schritt.i }) }}
          weiter={() => setSchritt(schritt.i < 3 ? { art: 'foto', i: schritt.i + 1 } : { art: 'fragen' })} />
      )}

      {schritt.art === 'fragen' && <Fragen angaben={angaben} setAngaben={setAngaben} weiter={() => setSchritt({ art: 'ergebnis' })} />}

      {schritt.art === 'ergebnis' && (
        <Ergebnis fotos={fotos} messung={messung} angaben={angaben} saat={name || baumId || 'neu'} speichern={speichern} />
      )}
    </div>
  )
}

function Fortschritt({ schritt, fotos }: { schritt: Schritt; fotos: (Foto | null)[] }) {
  const aktiv = schritt.art === 'foto' || schritt.art === 'pruefen' ? schritt.i : -1
  return (
    <span style={{ display: 'flex', gap: 5 }} aria-label="Fortschritt">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', border: '1px solid var(--tinte-2)', background: fotos[i] ? 'var(--tinte)' : i === aktiv ? 'var(--linie-stark)' : 'transparent' }} />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------- Baum anlegen

function BaumAnlegen(p: {
  name: string; setName: (s: string) => void; standardName: string; ort: string; setOrt: (s: string) => void
  standort?: Baum['standort']; setStandort: (s: Baum['standort']) => void; weiter: () => void
}) {
  const [suche, setSuche] = useState(false)
  return (
    <div>
      <h1 className="name" style={{ fontSize: 40, marginTop: 14 }}>Neuer Baum</h1>
      <p className="klein" style={{ marginTop: 0 }}>Du brauchst vier typische Äpfel von diesem Baum, ein weißes A4-Blatt, ein scharfes Messer und gleichmäßiges Licht ohne Blitz.</p>
      <label className="feld"><span>Bezeichnung</span><input className="eingabe" value={p.name} onChange={(e) => p.setName(e.target.value)} placeholder={`${p.standardName}, z. B. Baum am Gartentor`} /></label>
      <label className="feld"><span>Ort (optional)</span><input className="eingabe" value={p.ort} onChange={(e) => p.setOrt(e.target.value)} placeholder="z. B. Obstwiese am Deich" /></label>
      <button className="knopf" disabled={suche} onClick={() => {
        setSuche(true)
        navigator.geolocation?.getCurrentPosition(
          (pos) => { p.setStandort({ lat: pos.coords.latitude, lng: pos.coords.longitude, genauigkeit: pos.coords.accuracy }); setSuche(false) },
          () => setSuche(false), { enableHighAccuracy: true, timeout: 15000 })
      }}><Ort /> {p.standort ? 'Standort übernommen' : suche ? 'Suche …' : 'Standort übernehmen'}</button>
      <p className="sehr-klein">Der Standort wird in deinem Konto gespeichert und nur dir angezeigt.</p>
      <div style={{ marginTop: 24 }}><button className="knopf haupt" onClick={p.weiter}>Weiter zu den Fotos <Pfeil /></button></div>
    </div>
  )
}

// ---------------------------------------------------------------- Foto-Schritt

function FotoSchritt({ i, onKamera, onDatei, onUeberspringen }: { i: number; onKamera: () => void; onDatei: (b: Blob) => void; onUeberspringen: () => void }) {
  const f = FOTOS[i]
  const kameraApp = useRef<HTMLInputElement>(null)
  const galerie = useRef<HTMLInputElement>(null)
  const datei = (e: React.ChangeEvent<HTMLInputElement>) => { const x = e.target.files?.[0]; if (x) onDatei(x); e.target.value = '' }
  return (
    <div>
      <div className="sehr-klein kapitaelchen" style={{ marginTop: 14 }}>Foto {i + 1} von 4</div>
      <h1 className="name" style={{ fontSize: 34, lineHeight: 1.2 }}>{f.titel}</h1>
      <figure style={{ margin: '10px 0', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <img src={`/anleitung/foto${i + 1}.jpg`} alt={`Beispiel: ${f.titel}`}
          style={{ width: '58%', aspectRatio: '210 / 297', objectFit: 'cover', borderRadius: 3, border: '0.5px solid var(--linie)', boxShadow: '0 6px 18px -10px rgba(60,40,20,.5)' }} />
        <figcaption className="sehr-klein kursiv" style={{ flex: 1 }}>
          <Skizze nr={i} breite={70} />
          <div style={{ marginTop: 6 }}>So sieht es aus: Beispielaufnahme, entzerrt und auf das A4-Blatt zugeschnitten.</div>
        </figcaption>
      </figure>
      <p style={{ margin: '6px 0' }}><span className="kapitaelchen">Schneiden.</span> {f.schneiden}</p>
      <p style={{ margin: '6px 0' }}><span className="kapitaelchen">Legen.</span> {f.legen}</p>
      <p className="klein kursiv" style={{ margin: '6px 0 16px' }}>Zeigt: {f.zeigt}.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="knopf haupt" onClick={onKamera}><KameraSymbol /> Kamera mit Blatterkennung</button>
        <button className="knopf" onClick={() => kameraApp.current?.click()}><KameraSymbol /> Mit der Kamera-App fotografieren</button>
        <button className="knopf leise" onClick={() => galerie.current?.click()}><Foto /> Vorhandenes Foto wählen</button>
        <button className="knopf leise" style={{ border: 'none' }} onClick={onUeberspringen}>Dieses Foto überspringen</button>
      </div>
      <input ref={kameraApp} type="file" accept="image/*" capture="environment" hidden onChange={datei} />
      <input ref={galerie} type="file" accept="image/*" hidden onChange={datei} />
      <p className="sehr-klein" style={{ marginTop: 16 }}>Tipp: Senkrecht von oben, alle vier Ecken des Blatts im Bild, kein Blitz. Mit 2-fachem Zoom aus etwas Abstand wird das Bild schärfer als aus der Nähe.</p>
    </div>
  )
}

// ---------------------------------------------------------------- Prüfen

function Pruefen({ foto, i, nochmal, weiter }: { foto: Foto | null; i: number; nochmal: () => void; weiter: () => void }) {
  if (!foto) return null
  const b = foto.befund
  const h = b ? bewerteBefund(b) : null
  const a = foto.auswertung
  const fruechte = a?.teile.filter((t) => t.art === 'frucht').length ?? 0
  const kerne = a?.teile.filter((t) => t.art === 'kern').length ?? 0
  const pruefpunkte: [boolean | null, string][] = [
    [b ? b.gefunden && !b.randBeruehrt.length : null, b?.gefunden ? (b.randBeruehrt.length ? 'Blatt ragt aus dem Bild' : 'Blatt mit vier Ecken erkannt') : b ? 'Kein Blatt erkannt' : 'Suche das Blatt …'],
    [b?.gefunden ? h?.stufe === 'gut' || !/schräg/.test(h?.text ?? '') : null, b?.gefunden && /schräg/.test(h?.text ?? '') ? 'Etwas schräg aufgenommen; wird herausgerechnet' : 'Perspektive in Ordnung'],
    [a ? fruechte >= 2 : null, a ? `${fruechte} Apfelteile${kerne ? ` und ${kerne} Kerne` : ''} gefunden` : foto.fehler ? `Auswertung fehlgeschlagen: ${foto.fehler}` : 'Wird ausgewertet …'],
    ...(a?.lichtUngleich ? [[false, 'Ungleichmäßiges Licht (Sonne und Schatten). Die Farben werden örtlich abgeglichen, gleichmäßiger Schatten ist besser.'] as [boolean, string]] : []),
  ]
  return (
    <div>
      <div className="sehr-klein kapitaelchen" style={{ marginTop: 14 }}>Foto {i + 1} von 4 · Prüfung</div>
      <div style={{ position: 'relative', margin: '10px 0', borderRadius: 10, overflow: 'hidden', background: 'var(--papier-2)', minHeight: 200 }}>
        {foto.blattUrl || foto.vorschauUrl ? (
          <img src={foto.blattUrl ?? foto.vorschauUrl} alt="Entzerrtes Blatt" style={{ width: '100%', display: 'block' }} />
        ) : (
          <img src={foto.url} alt="Aufnahme" style={{ width: '100%', display: 'block', opacity: 0.85 }} />
        )}
      </div>
      {(foto.blattUrl || foto.vorschauUrl) && <p className="sehr-klein kursiv" style={{ marginTop: 0 }}>Entzerrt, auf das Blatt zugeschnitten und am Papier weißabgeglichen. Das Originalfoto bleibt unverändert gespeichert.</p>}
      {pruefpunkte.map(([ok, text], k) => (
        <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '3px 0' }}>
          <span style={{ width: 16, color: ok === null ? 'var(--bleistift)' : ok ? 'var(--gut)' : 'var(--warn)' }}>{ok === null ? '…' : ok ? '✓' : '!'}</span>
          <span className="klein" style={{ color: 'var(--tinte)' }}>{text}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="knopf" onClick={nochmal}>Nochmal</button>
        <button className="knopf haupt" onClick={weiter}>{i < 3 ? 'Nächstes Foto' : 'Weiter'} <Pfeil /></button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Fragen (aus dem Katalog: erfassung = abfrage)

const FRAGEN: { titel: string; merkmale: string[] }[] = [
  { titel: 'Geschmack', merkmale: ['geschmack_suesse', 'geschmack_saeure', 'aroma_staerke', 'aroma_noten'] },
  { titel: 'Duft', merkmale: ['duft_staerke', 'duft_noten'] },
  { titel: 'Fruchtfleisch und Schale', merkmale: ['fleisch_festigkeit', 'fleisch_saftigkeit', 'schale_beschaffenheit'] },
  { titel: 'Reife', merkmale: ['pflueckreife', 'genussreife_beginn', 'genussreife_ende'] },
]

export function alsWerte(angaben: Record<string, string[]>) {
  return Object.entries(angaben).flatMap(([merkmal, l]) => l.map((wert) => ({ merkmal, wert })))
}

function Fragen({ angaben, setAngaben, weiter }: { angaben: Record<string, string[]>; setAngaben: (a: Record<string, string[]>) => void; weiter: () => void }) {
  const pflueck = angaben.pflueckreife?.[0]
  return (
    <div>
      <h1 className="name" style={{ fontSize: 36, marginTop: 14 }}>Was die Fotos nicht zeigen</h1>
      <p className="klein" style={{ marginTop: 0 }}>Probier einen Apfel und riech daran. Alles ist freiwillig, jede Angabe hilft beim Abgleich.</p>
      {FRAGEN.map((gruppe) => (
        <section key={gruppe.titel} style={{ marginTop: 18 }}>
          <h2 className="kapitaelchen" style={{ fontSize: 16, color: 'var(--tinte-2)', margin: '0 0 4px' }}>{gruppe.titel}</h2>
          {gruppe.merkmale.map((id) => (
            <div key={id} style={{ margin: '10px 0' }}>
              <div className="klein" style={{ marginBottom: 6 }}>{MERKMAL_NACH_ID[id].name}{MERKMAL_NACH_ID[id].mehrfach ? ' (mehrere möglich)' : ''}</div>
              <MerkmalChips merkmal={id} werte={angaben[id] ?? []} onChange={(w) => setAngaben({ ...angaben, [id]: w })}
                abMonat={id.startsWith('genussreife') ? (id === 'genussreife_ende' ? angaben.genussreife_beginn?.[0] ?? pflueck : pflueck) : undefined} />
            </div>
          ))}
        </section>
      ))}
      <div style={{ marginTop: 24 }}><button className="knopf haupt" onClick={weiter}>Auswerten <Pfeil /></button></div>
    </div>
  )
}

// ---------------------------------------------------------------- Ergebnis

function Ergebnis({ fotos, messung, angaben, saat, speichern }: {
  fotos: (Foto | null)[]; messung: Fotomessung | null; angaben: Record<string, string[]>; saat: string; speichern: (k?: Kandidat, danach?: string) => Promise<void>
}) {
  const index = useSortenindex()
  const [laeuft, setLaeuft] = useState(false)
  const offen = fotos.some((f) => f && !f.auswertung && !f.fehler)
  const werte = useMemo(() => [
    ...(messung?.werte ?? []),
    ...alsWerte(angaben),
  ], [messung, angaben])
  const p = useMemo(() => darstellungAus(werte, messung?.farben, saatAusText(saat)).p, [werte, messung, saat])
  const kandidaten = useMemo(() => (index ? gleicheAb(werte, index.sorten) : []), [index, werte])
  const [fehler, setFehler] = useState('')
  const sichern = async (k?: Kandidat, danach?: string) => {
    setLaeuft(true); setFehler('')
    try { await speichern(k, danach) } catch (e) {
      meldeFehler('sonstiges', e, 'Baum speichern')
      setFehler(`Speichern fehlgeschlagen: ${e instanceof Error ? e.message : e}. Ist der Speicher des Geräts voll?`)
      setLaeuft(false)
    }
  }
  const gesperrt = laeuft || offen

  return (
    <div>
      <div style={{ position: 'relative', height: 280, margin: '0 -16px' }}>
        <ApfelBuehne aepfel={[p]} className="buehne" />
      </div>
      <p className="klein kursiv" style={{ textAlign: 'center', marginTop: 0 }}>Dein Apfel, aus den Fotos vermessen</p>
      {offen && <p className="hinweis">Die Fotos werden noch ausgewertet …</p>}
      {messung && (
        <div className="karte-papier" style={{ marginBottom: 16 }}>
          {messung.hinweise.map((h, i) => <p key={i} className="sehr-klein" style={{ margin: '3px 0' }}>{h}</p>)}
        </div>
      )}

      <h2 className="kapitaelchen" style={{ fontSize: 17, color: 'var(--tinte-2)' }}>Vorläufiger Abgleich</h2>
      <p className="sehr-klein" style={{ marginTop: 2 }}>
        Verglichen werden nur Größe, Form, Farben und deine Angaben, Merkmal für Merkmal, mit allen {index?.anzahl ?? ''} Sorten. Kernhaus und Kelch fließen noch nicht ein. Das Ergebnis ist ein Vorschlag, keine Bestimmung; es kann auch sein, dass keine Sorte passt.
      </p>
      {!kandidaten.length && <p className="hinweis">Zu wenige Merkmale für einen Abgleich.</p>}
      {kandidaten.map((k) => <KandidatZeile key={k.sorte.id} k={k} onWahl={() => sichern(k)} gesperrt={gesperrt} eigen={p} />)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        <button className="knopf haupt" disabled={gesperrt} onClick={() => sichern(undefined, '/angleichen')}>{offen ? 'Warte auf die Auswertung …' : 'Speichern und Modell angleichen'}</button>
        <button className="knopf" disabled={gesperrt} onClick={() => sichern()}>Ohne Sorte speichern</button>
        <p className="sehr-klein" style={{ margin: 0 }}>Passt das Modell nicht zu deinem Apfel? Beim Angleichen nimmst du Farben direkt aus dem Foto ab und stellst Form, Kernhaus und Kerne ein. Danach rechnet der Abgleich mit deinen Angaben.</p>
        {fehler && <p className="sehr-klein" style={{ color: 'var(--warn)' }}>{fehler}</p>}
      </div>
    </div>
  )
}

export function KandidatZeile({ k, onWahl, gesperrt, eigen }: { k: Kandidat; onWahl: () => void; gesperrt: boolean; eigen?: ApfelParameter }) {
  const [offen, setOffen] = useState(false)
  return (
    <div style={{ borderBottom: '0.5px solid var(--linie)', padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => setOffen(!offen)}>
        <Medaillon p={parameterAusEintrag(k.sorte)} groesse={54} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name bleistift" style={{ fontSize: 26, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.sorte.name}</div>
          <div className="sehr-klein">{Math.round(k.punkte * 100)} % Übereinstimmung in {k.verglichen} Merkmalen</div>
        </div>
      </div>
      {offen && (
        <div style={{ marginTop: 8 }}>
          {eigen && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '6px 0 10px' }}>
              <figure style={{ margin: 0, textAlign: 'center' }}>
                <Medaillon p={eigen} groesse={110} synchron />
                <figcaption className="sehr-klein">Dein Apfel</figcaption>
              </figure>
              <figure style={{ margin: 0, textAlign: 'center' }}>
                <Medaillon p={parameterAusEintrag(k.sorte)} groesse={110} synchron />
                <figcaption className="sehr-klein">{k.sorte.name}</figcaption>
              </figure>
            </div>
          )}
          {k.begruendung.map((b) => (
            <div key={b.merkmal} className="sehr-klein" style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
              <span style={{ width: 14, color: b.passung > 0.7 ? 'var(--gut)' : b.passung > 0.3 ? 'var(--bleistift)' : 'var(--warn)' }}>{b.passung > 0.7 ? '✓' : b.passung > 0.3 ? '~' : '✗'}</span>
              <span style={{ flex: 1 }}>{MERKMAL_NACH_ID[b.merkmal]?.name}: dein Apfel {b.eigen}, Sorte {b.sorte}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <a className="knopf leise" href={`#/sorte/${k.sorte.id}`} target="_blank" rel="noreferrer">Sorte ansehen</a>
            <button className="knopf" disabled={gesperrt} onClick={onWahl}>Als Vorschlag speichern</button>
          </div>
        </div>
      )}
    </div>
  )
}
