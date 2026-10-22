import { useSyncExternalStore, useState } from 'react'
import { syncStatus, syncHoeren, uebernahmeEntscheiden } from '../daten/serverabgleich.ts'

/** Fragt, ob Bäume, die schon auf dem Gerät lagen, in das angemeldete Konto übernommen werden */
export function Uebernahme() {
  const s = useSyncExternalStore(syncHoeren, syncStatus)
  const [laeuft, setLaeuft] = useState(false)
  if (!s.frage) return null
  const n = s.frage.anzahl
  const entscheiden = async (ja: boolean) => { setLaeuft(true); await uebernahmeEntscheiden(ja); setLaeuft(false) }
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', padding: '16px 12px calc(var(--sicher-unten) + 16px)' }}>
      <div className="karte-papier" style={{ width: '100%', boxShadow: 'var(--schatten)' }}>
        <h2 className="kapitaelchen" style={{ fontSize: 17 }}>Bäume übernehmen?</h2>
        <p className="klein">Auf diesem Gerät {n === 1 ? 'liegt ein Baum' : `liegen ${n} Bäume`}, die noch keinem Konto gehören. Sollen sie in dein Konto <b>{s.frage.email}</b> übernommen und auf dem Server gesichert werden?</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="knopf leise" style={{ flex: 1 }} disabled={laeuft} onClick={() => entscheiden(false)}>Vom Gerät entfernen</button>
          <button className="knopf haupt" style={{ flex: 1 }} disabled={laeuft} onClick={() => entscheiden(true)}>Übernehmen</button>
        </div>
      </div>
    </div>
  )
}
