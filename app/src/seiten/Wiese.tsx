import { useEffect, useMemo, useRef, useState } from 'react'
import { ApfelBuehne, Medaillon } from '../apfel3d/Buehne.tsx'
import { useBaeume, sortiert, type Baum } from '../daten/baeume.ts'
import { useSortenindex, parameterAusEintrag } from '../daten/sorten.ts'
import { modellFuerBaum, roemisch } from '../daten/baumModell.ts'
import { gehe } from '../ui/router.ts'
import { Plus, Raster, Einzeln, Hoch, Info } from '../ui/symbole.tsx'
import { Sortenname } from '../ui/Sortenname.tsx'
import { useKonto, bereit, zurAnmeldung } from '../daten/konto.ts'

const ANSICHT_SCHLUESSEL = 'wiese-ansicht'

export function WieseSeite() {
  const { baeume, geladen } = useBaeume()
  const index = useSortenindex()
  const liste = useMemo(() => sortiert(baeume), [baeume])
  const modelle = useMemo(() => liste.map((b) => modellFuerBaum(b, index).p), [liste, index])
  const [ansicht, setAnsicht] = useState<'einzeln' | 'raster'>(() => {
    try { return (localStorage.getItem(ANSICHT_SCHLUESSEL) as 'raster') || 'einzeln' } catch { return 'einzeln' }
  })
  useEffect(() => { try { localStorage.setItem(ANSICHT_SCHLUESSEL, ansicht) } catch { /* privat */ } }, [ansicht])

  const konto = useKonto()
  if (konto.status !== 'laedt' && !bereit(konto)) return <LeereWiese ohneKonto />
  if (geladen && liste.length === 0) return <LeereWiese />

  return (
    <div className="seite" style={{ display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      <div className="tafelkopf">
        <span>Meine Äpfel</span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button className="rund-knopf" style={{ width: 36, height: 36 }} aria-label="Über die App" onClick={() => gehe('/info')}><Info /></button>
          <button
            className="rund-knopf" style={{ width: 36, height: 36 }}
            aria-label={ansicht === 'einzeln' ? 'Alle Bäume als Raster' : 'Einzelansicht'}
            onClick={() => setAnsicht(ansicht === 'einzeln' ? 'raster' : 'einzeln')}
          >
            {ansicht === 'einzeln' ? <Raster /> : <Einzeln />}
          </button>
        </span>
      </div>
      {ansicht === 'einzeln'
        ? <Karussell liste={liste} modelle={modelle} onRaster={() => setAnsicht('raster')} />
        : <WieseRaster liste={liste} />}
    </div>
  )
}

// ------------------------------------------------------------------ Einzelansicht mit Wischen

function Karussell({ liste, modelle, onRaster }: { liste: Baum[]; modelle: ReturnType<typeof modellFuerBaum>['p'][]; onRaster: () => void }) {
  const [index, setIndex] = useState(0)
  const [position, setPosition] = useState(0)
  const ziel = useRef(0)
  const zug = useRef<{ x: number; y: number; start: number; t: number; finger: Map<number, { x: number; y: number }>; abstand0?: number } | null>(null)
  const flaeche = useRef<HTMLDivElement>(null)

  // Weiches Einrasten
  useEffect(() => {
    let lauf = 0
    const schritt = () => {
      setPosition((p) => {
        if (zug.current) return p
        const d = ziel.current - p
        return Math.abs(d) < 0.001 ? ziel.current : p + d * 0.16
      })
      lauf = requestAnimationFrame(schritt)
    }
    lauf = requestAnimationFrame(schritt)
    return () => cancelAnimationFrame(lauf)
  }, [])

  useEffect(() => {
    if (index > liste.length - 1) { setIndex(Math.max(0, liste.length - 1)); ziel.current = Math.max(0, liste.length - 1) }
  }, [liste.length, index])

  const breite = () => flaeche.current?.clientWidth ?? 360

  const runter = (e: React.PointerEvent) => {
    const f = zug.current?.finger ?? new Map()
    f.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (f.size === 2) {
      const [a, b] = [...f.values()]
      zug.current = { ...(zug.current ?? { x: e.clientX, y: e.clientY, start: position, t: Date.now() }), finger: f, abstand0: Math.hypot(a.x - b.x, a.y - b.y) }
      return
    }
    zug.current = { x: e.clientX, y: e.clientY, start: position, t: Date.now(), finger: f }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const bewegen = (e: React.PointerEvent) => {
    const z = zug.current
    if (!z) return
    z.finger.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (z.finger.size >= 2 && z.abstand0) {
      // Zusammenziehen mit zwei Fingern → Raster
      const [a, b] = [...z.finger.values()]
      if (Math.hypot(a.x - b.x, a.y - b.y) < z.abstand0 * 0.7) { zug.current = null; onRaster() }
      return
    }
    const dx = e.clientX - z.x
    const neu = Math.max(-0.35, Math.min(liste.length - 0.65, z.start - dx / breite()))
    setPosition(neu)
  }
  const hoch = (e: React.PointerEvent) => {
    const z = zug.current
    if (!z) return
    z.finger.delete(e.pointerId)
    if (z.finger.size > 0) return
    const dx = e.clientX - z.x
    const dy = e.clientY - z.y
    const dt = Date.now() - z.t
    zug.current = null
    // Antippen öffnet das Baumblatt; nach oben wischen ebenso
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 400) { gehe(`/baum/${liste[index]?.id}`); return }
    if (dy < -60 && Math.abs(dx) < 40) { gehe(`/baum/${liste[index]?.id}`); return }
    const schwung = (dx / Math.max(1, dt)) * -0.35
    let n = Math.round(position + schwung)
    n = Math.max(0, Math.min(liste.length - 1, n))
    ziel.current = n
    setIndex(n)
  }

  const baum = liste[index]
  // Name blendet beim Wischen aus
  const naehe = 1 - Math.min(1, Math.abs(position - index) * 2.5)

  return (
    <>
      <div
        ref={flaeche}
        onPointerDown={runter}
        onPointerMove={bewegen}
        onPointerUp={hoch}
        onPointerCancel={hoch}
        style={{ position: 'relative', flex: '1 1 auto', minHeight: 300, touchAction: 'none', margin: '0 -16px' }}
        role="region"
        aria-label="Deine Bäume, zum Wechseln wischen"
      >
        <ApfelBuehne aepfel={modelle} position={position} className="buehne" drehbar={false} />
      </div>

      {baum && (
        <div style={{ textAlign: 'center', opacity: naehe, transition: 'opacity .1s', minHeight: 132 }}>
          <Sortenname baum={baum} groesse={46} />
          <div className="klein kursiv" style={{ marginTop: 2 }}>
            {baum.bestimmung.status === 'vorschlag' ? 'vermutlich · ' : ''}
            {baum.name}{baum.ort ? ` · ${baum.ort}` : ''}
          </div>
          <div className="sehr-klein" style={{ marginTop: 10, letterSpacing: '0.08em', fontVariant: 'small-caps' }}>
            Tafel {roemisch(index + 1)} von {roemisch(liste.length)}
          </div>
          <button className="knopf leise" style={{ marginTop: 6, border: 'none' }} onClick={() => gehe(`/baum/${baum.id}`)}>
            <Hoch /> Mehr über diesen Baum
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 calc(var(--nav-hoehe) + var(--sicher-unten) + 14px)' }}>
        <button className="knopf haupt" onClick={() => gehe('/neu')} style={{ minHeight: 50, padding: '0 26px' }}>
          <Plus /> Neuen Baum bestimmen
        </button>
      </div>
    </>
  )
}

// ------------------------------------------------------------------ Raster

function WieseRaster({ liste }: { liste: Baum[] }) {
  const index = useSortenindex()
  return (
    <div style={{ paddingTop: 18, paddingBottom: 'calc(var(--nav-hoehe) + 90px)' }}>
      <div className="raster">
        {liste.map((b, i) => (
          <a key={b.id} className="raster-eintrag" href={`#/baum/${b.id}`}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Medaillon p={modellFuerBaum(b, index).p} groesse={92} />
            </div>
            <Sortenname baum={b} groesse={20} block />
            <span className="sehr-klein kursiv">{b.name}</span>
            <span className="sehr-klein" style={{ display: 'block', fontVariant: 'small-caps' }}>{roemisch(i + 1)}</span>
          </a>
        ))}
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(var(--nav-hoehe) + var(--sicher-unten) + 14px)', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        <button className="knopf haupt" onClick={() => gehe('/neu')} style={{ minHeight: 50, padding: '0 26px' }}>
          <Plus /> Neuen Baum bestimmen
        </button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Leere Wiese: Sorte zum Kennenlernen

function LeereWiese({ ohneKonto = false }: { ohneKonto?: boolean }) {
  const index = useSortenindex()
  const sorte = useMemo(() => {
    if (!index?.sorten.length) return null
    const mitBild = index.sorten.filter((s) => s.hatBild)
    const auswahl = mitBild.length ? mitBild : index.sorten
    return auswahl[new Date().getDate() % auswahl.length]
  }, [index])
  return (
    <div className="seite" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="tafelkopf">
        <span>Meine Äpfel</span>
        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>Sorte des Tages
          <button className="rund-knopf" style={{ width: 36, height: 36 }} aria-label="Über die App" onClick={() => gehe('/info')}><Info /></button>
        </span>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 300, margin: '0 -16px' }}>
        {sorte && <ApfelBuehne aepfel={[parameterAusEintrag(sorte)]} className="buehne" />}
      </div>
      {sorte && (
        <a href={`#/sorte/${sorte.id}`} style={{ textAlign: 'center', textDecoration: 'none' }}>
          <div className="name" style={{ fontSize: 46 }}>{sorte.name}</div>
          <div className="klein kursiv">Mehr über diese Sorte</div>
        </a>
      )}
      <p className="hinweis" style={{ textAlign: 'center' }}>{ohneKonto ? 'Melde dich an, um deine eigenen Apfelbäume zu bestimmen und zu sammeln.' : 'Noch keine eigenen Äpfel. Fotografiere vier Äpfel eines Baums, um ihn hier anzulegen.'}</p>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 'calc(var(--nav-hoehe) + var(--sicher-unten) + 8px)' }}>
        {ohneKonto
          ? <button className="knopf haupt" onClick={() => zurAnmeldung('/')}>Anmelden</button>
          : <button className="knopf haupt" onClick={() => gehe('/neu')}><Plus /> Ersten Baum bestimmen</button>}
      </div>
    </div>
  )
}
