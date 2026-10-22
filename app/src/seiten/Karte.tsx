import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { get, set } from 'idb-keyval'
import { useBaeume, aktualisiereBaum, VERTRAUEN, type Baum } from '../daten/baeume.ts'
import { useSortenindex } from '../daten/sorten.ts'
import { modellFuerBaum } from '../daten/baumModell.ts'
import { medaillonBild } from '../apfel3d/medaillonBild.ts'
import { gehe } from '../ui/router.ts'
import { Suche, Ort, Kreuz, Pfeil } from '../ui/symbole.tsx'
import { Sortenname } from '../ui/Sortenname.tsx'

// Die Wiese als Luftbild: eigene Bäume als Äpfel an ihrem Standort. Beim Öffnen zeigt die Karte
// alle Bäume, sonst den gemerkten Ausschnitt der Wiese. Verschieben nur nach „Verschieben“.

const AUSSCHNITT = 'wiese-ausschnitt'
/** Gemerkter Ausschnitt der Wiese: Südwest- und Nordost-Ecke */
type Ausschnitt = { sw: [number, number]; no: [number, number] }
type Ebene = 'luftbild' | 'karte'

function grundkarten(): Record<Ebene, L.TileLayer> {
  const karte = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19, maxZoom: 21,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
  })
  // Luftbild über die eigene Domain (vercel.json): Esri sieht nicht die IP der Nutzer, der Schlüssel bleibt auf dem Server
  const luftbild = L.tileLayer('/kacheln/luftbild/{z}/{y}/{x}', {
    maxNativeZoom: 19, maxZoom: 21,
    attribution: 'Powered by <a href="https://www.esri.com">Esri</a> | Esri, Vantor, Earthstar Geographics, GIS User Community',
  })
  return { luftbild, karte }
}

export default function KarteSeite() {
  const { baeume, geladen } = useBaeume()
  const index = useSortenindex()
  const el = useRef<HTMLDivElement>(null)
  const karte = useRef<L.Map | null>(null)
  const kacheln = useRef<Record<Ebene, L.TileLayer> | null>(null)
  const ebene = useRef<L.LayerGroup | null>(null)
  const marker = useRef(new Map<string, L.Marker>())
  const [art, setArt] = useState<Ebene>('luftbild')
  const [ausschnitt, setAusschnitt] = useState<Ausschnitt | null | undefined>(undefined)
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const [verschieben, setVerschieben] = useState<{ id: string; lat: number; lng: number } | null>(null)
  const [einrichten, setEinrichten] = useState(false)
  const anfangGesetzt = useRef(false)

  const mitOrt = useMemo(() => baeume.filter((b) => b.standort), [baeume])
  const ohneOrt = useMemo(() => baeume.filter((b) => !b.standort && !b.beispiel), [baeume])

  // Karte einmal anlegen
  useEffect(() => {
    if (!el.current || karte.current) return
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, maxZoom: 21 }).setView([51.2, 10.4], 6)
    m.attributionControl.setPrefix(false)
    kacheln.current = grundkarten()
    kacheln.current.luftbild.addTo(m)
    ebene.current = L.layerGroup().addTo(m)
    m.on('click', () => setGewaehlt(null))
    karte.current = m
    get<Ausschnitt>(AUSSCHNITT).then((a) => setAusschnitt(a?.sw ? a : null)).catch(() => setAusschnitt(null))
    return () => { m.remove(); karte.current = null; marker.current.clear() }
  }, [])

  // Grundkarte wechseln
  useEffect(() => {
    const m = karte.current, k = kacheln.current
    if (!m || !k) return
    for (const e of Object.values(k)) if (m.hasLayer(e)) m.removeLayer(e)
    k[art].addTo(m)
    el.current?.classList.toggle('karte-gedimmt', art === 'karte')
    el.current?.classList.toggle('karte-luftbild', art === 'luftbild')
  }, [art])

  // Anfangsausschnitt: alle Bäume mit Standort, sonst die gemerkte Wiese, sonst einrichten
  useEffect(() => {
    const m = karte.current
    if (!m || !geladen || ausschnitt === undefined || anfangGesetzt.current) return
    anfangGesetzt.current = true
    // vom Baumblatt aus: diesen Baum zeigen
    const ziel = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('baum')
    const zielBaum = mitOrt.find((b) => b.id === ziel)
    if (zielBaum) { m.setView([zielBaum.standort!.lat, zielBaum.standort!.lng], 19); setGewaehlt(zielBaum.id); return }
    zurWiese(m, mitOrt, ausschnitt, false)
    if (!mitOrt.length && !ausschnitt) setEinrichten(true)
  }, [geladen, ausschnitt, mitOrt])

  // Äpfel als Marker
  useEffect(() => {
    const g = ebene.current
    if (!g) return
    const vorhanden = new Set<string>()
    for (const b of mitOrt) {
      vorhanden.add(b.id)
      const pos: L.LatLngExpression = verschieben?.id === b.id ? [verschieben.lat, verschieben.lng] : [b.standort!.lat, b.standort!.lng]
      let mk = marker.current.get(b.id)
      if (!mk) {
        mk = L.marker(pos, { icon: apfelIcon(null, false), keyboard: true, title: b.name })
        mk.on('click', (e) => { L.DomEvent.stopPropagation(e); setGewaehlt(b.id) })
        mk.on('drag', () => { const p = mk!.getLatLng(); setVerschieben((v) => (v ? { ...v, lat: p.lat, lng: p.lng } : v)) })
        mk.addTo(g)
        marker.current.set(b.id, mk)
      } else if (verschieben?.id !== b.id) mk.setLatLng(pos)
      const aktiv = gewaehlt === b.id || verschieben?.id === b.id
      const p = modellFuerBaum(b, index).p
      const m = mk
      medaillonBild(p).then((url) => m.setIcon(apfelIcon(url, aktiv))).catch(() => m.setIcon(apfelIcon(null, aktiv)))
      m.setZIndexOffset(aktiv ? 1000 : 0)
      if (verschieben?.id === b.id) m.dragging?.enable()
      else m.dragging?.disable()
    }
    for (const [id, mk] of marker.current) if (!vorhanden.has(id) && verschieben?.id !== id) { mk.remove(); marker.current.delete(id) }
  }, [mitOrt, index, gewaehlt, verschieben?.id])

  // Neuer Marker für einen Baum ohne Standort, der gerade platziert wird
  useEffect(() => {
    const g = ebene.current
    if (!g || !verschieben || marker.current.has(verschieben.id)) return
    const b = baeume.find((x) => x.id === verschieben.id)
    if (!b) return
    const mk = L.marker([verschieben.lat, verschieben.lng], { icon: apfelIcon(null, true), draggable: true, zIndexOffset: 1000 })
    mk.on('drag', () => { const p = mk.getLatLng(); setVerschieben((v) => (v ? { ...v, lat: p.lat, lng: p.lng } : v)) })
    mk.on('click', (e) => { L.DomEvent.stopPropagation(e); setGewaehlt(b.id) })
    mk.addTo(g)
    marker.current.set(b.id, mk)
    medaillonBild(modellFuerBaum(b, index).p).then((url) => mk.setIcon(apfelIcon(url, true))).catch(() => {})
  }, [verschieben, baeume, index])

  const baum = baeume.find((b) => b.id === (verschieben?.id ?? gewaehlt))

  const verschiebenBeenden = async (sichern: boolean) => {
    const v = verschieben
    if (!v) return
    setVerschieben(null)
    if (sichern) await aktualisiereBaum(v.id, (b) => ({ ...b, standort: { lat: v.lat, lng: v.lng } }))
    else {
      const b = baeume.find((x) => x.id === v.id)
      const mk = marker.current.get(v.id)
      if (b?.standort) mk?.setLatLng([b.standort.lat, b.standort.lng])
      else if (mk) { mk.remove(); marker.current.delete(v.id) }
    }
  }

  const platzieren = (b: Baum) => {
    const m = karte.current
    if (!m) return
    const c = m.getCenter()
    setGewaehlt(b.id)
    setVerschieben({ id: b.id, lat: c.lat, lng: c.lng })
  }

  const merken = async () => {
    const m = karte.current
    if (!m) return
    const g = m.getBounds()
    const a: Ausschnitt = { sw: [g.getSouth(), g.getWest()], no: [g.getNorth(), g.getEast()] }
    await set(AUSSCHNITT, a).catch(() => {})
    setAusschnitt(a)
    setEinrichten(false)
  }

  return (
    <div className="seite-voll">
      <div ref={el} style={{ position: 'absolute', inset: 0, bottom: 'calc(var(--nav-hoehe) + var(--sicher-unten))' }} />

      {/* Kopf: Titel, Suche, Grundkarte */}
      <div style={{ position: 'absolute', left: 12, right: 12, top: 'var(--oben)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {einrichten
          ? <Einrichten karte={karte.current} merken={merken} abbrechen={ausschnitt || mitOrt.length ? () => setEinrichten(false) : undefined} />
          : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="karte-papier" style={{ flex: 1, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="kapitaelchen" style={{ fontSize: 16, flex: 1 }}>Meine Wiese</span>
                <span className="sehr-klein">{mitOrt.length} {mitOrt.length === 1 ? 'Baum' : 'Bäume'}</span>
              </div>
              <button className="rund-knopf" aria-label="Zur Wiese zurück" title="Zur Wiese zurück" onClick={() => karte.current && zurWiese(karte.current, mitOrt, ausschnitt ?? null, true)}><Ort /></button>
              <button className="rund-knopf" aria-label="Ausschnitt der Wiese neu festlegen" title="Wiese neu festlegen" onClick={() => setEinrichten(true)}><Suche /></button>
            </div>
          )}
        <div className="chips" style={{ alignSelf: 'flex-start', background: 'color-mix(in srgb, var(--papier) 88%, transparent)', borderRadius: 999, padding: 2 }}>
          <button className={`chip ${art === 'luftbild' ? 'an' : ''}`} onClick={() => setArt('luftbild')}>Luftbild</button>
          <button className={`chip ${art === 'karte' ? 'an' : ''}`} onClick={() => setArt('karte')}>Karte</button>
        </div>
      </div>

      {/* Unten: gewählter Baum, Verschieben, Bäume ohne Standort */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(var(--nav-hoehe) + var(--sicher-unten) + 12px)', zIndex: 500 }}>
        {verschieben && baum ? (
          <div className="karte-papier" style={{ boxShadow: 'var(--schatten)' }}>
            <div className="klein">Ziehe <b>{baum.name}</b> an die richtige Stelle. Zum Feinjustieren weiter hineinzoomen.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="knopf leise" style={{ flex: 1 }} onClick={() => verschiebenBeenden(false)}>Abbrechen</button>
              <button className="knopf haupt" style={{ flex: 1 }} onClick={() => verschiebenBeenden(true)}>Standort sichern</button>
            </div>
          </div>
        ) : baum ? (
          <div className="karte-papier" style={{ boxShadow: 'var(--schatten)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Sortenname baum={baum} groesse={30} />
                <div className="sehr-klein kursiv">{VERTRAUEN[baum.bestimmung.status].label} · {baum.name}</div>
              </div>
              <button className="rund-knopf" style={{ width: 34, height: 34 }} aria-label="Schließen" onClick={() => setGewaehlt(null)}><Kreuz /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="knopf leise" style={{ flex: 1 }} onClick={() => setVerschieben({ id: baum.id, lat: baum.standort!.lat, lng: baum.standort!.lng })}>Verschieben</button>
              <button className="knopf haupt" style={{ flex: 1 }} onClick={() => gehe(`/baum/${baum.id}`)}>Zum Baum <Pfeil /></button>
            </div>
          </div>
        ) : !einrichten && ohneOrt.length > 0 ? (
          <OhneStandort liste={ohneOrt} platzieren={platzieren} />
        ) : null}
      </div>
    </div>
  )
}

/** Zeigt den gemerkten Ausschnitt der Wiese, erweitert um alle Bäume, die außerhalb stehen */
function zurWiese(m: L.Map, mitOrt: Baum[], ausschnitt: Ausschnitt | null, weich: boolean) {
  const punkte = mitOrt.map((b) => [b.standort!.lat, b.standort!.lng] as [number, number])
  if (ausschnitt) punkte.push(ausschnitt.sw, ausschnitt.no)
  if (!punkte.length) return
  // Bedienelemente oben und unten nicht über die Bäume legen
  const opt = { paddingTopLeft: [24, ausschnitt ? 40 : 120] as L.PointTuple, paddingBottomRight: [24, ausschnitt ? 40 : 100] as L.PointTuple, maxZoom: 19, animate: weich, duration: weich ? 0.8 : 0 }
  m.fitBounds(L.latLngBounds(punkte), opt)
}

function apfelIcon(url: string | null, aktiv: boolean) {
  const g = aktiv ? 58 : 46
  const inhalt = url
    ? `<img src="${url}" alt="" style="width:100%;height:100%;display:block" />`
    : '<div style="width:70%;height:70%;margin:15%;border-radius:50%;background:#9c3b2a"></div>'
  return L.divIcon({
    className: 'apfel-marker' + (aktiv ? ' aktiv' : ''),
    html: inhalt,
    iconSize: [g, g],
    iconAnchor: [g / 2, g / 2],
  })
}

// ------------------------------------------------------------------ Wiese einrichten: Ort suchen und merken

interface Treffer { name: string; lat: number; lng: number; bbox?: [number, number, number, number] }

function Einrichten({ karte, merken, abbrechen }: { karte: L.Map | null; merken: () => void; abbrechen?: () => void }) {
  const [text, setText] = useState('')
  const [treffer, setTreffer] = useState<Treffer[] | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')

  const suchen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || laeuft) return
    setLaeuft(true); setFehler('')
    try {
      // Nominatim: nur auf ausdrückliche Suche, keine Vorschläge beim Tippen (Nutzungsrichtlinie)
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=de&q=${encodeURIComponent(text.trim())}`
      const r = await fetch(url)
      if (!r.ok) throw new Error()
      const d = await r.json() as { display_name: string; lat: string; lon: string; boundingbox?: string[] }[]
      setTreffer(d.map((x) => ({
        name: x.display_name, lat: +x.lat, lng: +x.lon,
        bbox: x.boundingbox ? [+x.boundingbox[0], +x.boundingbox[1], +x.boundingbox[2], +x.boundingbox[3]] : undefined,
      })))
    } catch {
      setFehler('Die Suche hat nicht geklappt. Bitte später noch einmal versuchen.')
    }
    setLaeuft(false)
  }

  const hin = (t: Treffer) => {
    if (!karte) return
    if (t.bbox) karte.flyToBounds([[t.bbox[0], t.bbox[2]], [t.bbox[1], t.bbox[3]]], { maxZoom: 18, duration: 1 })
    else karte.flyTo([t.lat, t.lng], 17, { duration: 1 })
    setTreffer(null)
  }

  const hier = () => {
    if (!karte || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => karte.flyTo([p.coords.latitude, p.coords.longitude], 18, { duration: 1 }),
      () => setFehler('Standort nicht verfügbar. Bitte den Ort suchen.'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  return (
    <div className="karte-papier" style={{ boxShadow: 'var(--schatten)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div className="kapitaelchen" style={{ fontSize: 16, flex: 1 }}>Wo steht deine Wiese?</div>
        {abbrechen && <button className="knopf leise" style={{ minHeight: 32, padding: '0 10px', fontSize: 15 }} onClick={abbrechen}>Abbrechen</button>}
      </div>
      <form onSubmit={suchen} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <input className="eingabe" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ort, Straße oder Flurname" enterKeyHint="search" />
        <button className="rund-knopf" type="submit" aria-label="Suchen" disabled={laeuft}><Suche /></button>
      </form>
      {treffer && (
        <div style={{ marginTop: 6, maxHeight: 180, overflowY: 'auto' }}>
          {treffer.length === 0 && <div className="sehr-klein">Nichts gefunden.</div>}
          {treffer.map((t, i) => (
            <button key={i} className="zeile" style={{ width: '100%', background: 'none', border: 'none', borderBottom: '0.5px solid var(--linie)', textAlign: 'left', padding: '8px 0', fontSize: 15 }} onClick={() => hin(t)}>{t.name}</button>
          ))}
        </div>
      )}
      {fehler && <div className="sehr-klein" style={{ color: 'var(--warn)', marginTop: 6 }}>{fehler}</div>}
      <div className="sehr-klein" style={{ marginTop: 6 }}>Zoome so weit hinein, dass deine Bäume zu sehen sind, und merke dir den Ausschnitt. Suche: © OpenStreetMap-Mitwirkende, Nominatim.</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="knopf leise" style={{ flex: 'none', padding: '0 14px' }} onClick={hier} aria-label="Mein Standort"><Ort /> Hier</button>
        <button className="knopf haupt" style={{ flex: 1, whiteSpace: 'nowrap', padding: '0 12px' }} onClick={merken}>Das ist meine Wiese</button>
      </div>
    </div>
  )
}

function OhneStandort({ liste, platzieren }: { liste: Baum[]; platzieren: (b: Baum) => void }) {
  const [offen, setOffen] = useState(false)
  return (
    <div className="karte-papier" style={{ boxShadow: 'var(--schatten)', padding: '8px 14px' }}>
      <button style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', fontSize: 15 }} onClick={() => setOffen(!offen)}>
        {liste.length} {liste.length === 1 ? 'Baum' : 'Bäume'} ohne Standort {offen ? '▾' : '▸'}
      </button>
      {offen && (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {liste.map((b) => (
            <div key={b.id} className="zeile" style={{ padding: '6px 0' }}>
              <div className="grow"><Sortenname baum={b} groesse={22} /><div className="sehr-klein kursiv">{b.name}</div></div>
              <button className="knopf" style={{ minHeight: 34, fontSize: 15, padding: '0 12px' }} onClick={() => platzieren(b)}>Platzieren</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
