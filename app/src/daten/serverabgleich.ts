// Abgleich der eigenen Bäume mit dem Server. Das Gerät arbeitet weiter lokal (IndexedDB), der
// Server hält die Sicherung und bringt Bäume auf andere Geräte. Fotos werden direkt in den
// privaten Speicher hochgeladen und auf anderen Geräten erst bei Bedarf geladen.

import { get, set, del, clear } from 'idb-keyval'
import { uploadPresigned } from '@vercel/blob/client'
import { setzeServerHaken, alleBaeume, ersetzeBaeume, baeumeGeladen, ladeFotoLokal, type Baum } from './baeume.ts'
import { meldeFehler } from '../ui/protokoll.ts'
import { kontoApi, kontoJetzt, bereit, abmelden as kontoAbmelden, setzeAbmeldeHaken } from './konto.ts'

const HOCHGELADEN = 'sync-fotos' // Set der Fotoschlüssel, die schon auf dem Server liegen
const BEKANNT = 'sync-baeume' // Bäume, die schon einmal auf dem Server waren
const BESITZER = 'sync-besitzer' // Konto, dem die Daten auf diesem Gerät gehören

/** frage: Bäume auf dem Gerät, die noch keinem Konto gehören; der Nutzer entscheidet über die Übernahme */
type SyncStatus = { laeuft: boolean; fehler?: string; zuletzt?: string; frage?: { anzahl: number; email: string } }
let status: SyncStatus = { laeuft: false }
const hoerer = new Set<() => void>()
function setzeStatus(s: Partial<SyncStatus>) { status = { ...status, ...s }; hoerer.forEach((h) => h()) }
export function syncStatus() { return status }
export function syncHoeren(h: () => void) { hoerer.add(h); return () => { hoerer.delete(h) } }

function uid() {
  const z = kontoJetzt()
  return z.status === 'angemeldet' ? z.konto.uid : null
}
const serverKey = (k: string) => k.replace(':', '-')
const fotosVon = (b: Baum) => b.fotosaetze.flatMap((s) => [...s.fotos, ...(s.vorschau ?? []), ...(s.blatt ?? [])]).filter((k): k is string => !!k)

async function hochgeladen(): Promise<Set<string>> { return new Set((await get<string[]>(HOCHGELADEN)) ?? []) }

async function baumHochladen(b: Baum) {
  const id = uid()
  if (!id || b.beispiel) return
  const fertig = await hochgeladen()
  for (const k of fotosVon(b)) {
    if (fertig.has(k)) continue
    const blob = await ladeFotoLokal(k)
    if (!blob) continue // liegt nur auf dem Server oder ist verloren
    await uploadPresigned(`n/${id}/f/${serverKey(k)}`, blob, {
      access: 'private',
      handleUploadUrl: '/api/foto-hochladen',
      contentType: blob.type || 'image/jpeg',
      multipart: blob.size > 8 * 1024 * 1024,
    })
    fertig.add(k)
    await set(HOCHGELADEN, [...fertig])
  }
  await kontoApi(`/api/baeume?id=${encodeURIComponent(b.id)}`, { method: 'PUT', body: JSON.stringify(b) })
  const bekannt = new Set((await get<string[]>(BEKANNT)) ?? [])
  bekannt.add(b.id)
  await set(BEKANNT, [...bekannt])
}

// Änderungen gebündelt hochladen
const wartend = new Map<string, Baum>()
let zeitgeber: ReturnType<typeof setTimeout> | undefined
function vormerken(b: Baum) {
  if (b.beispiel || !bereit(kontoJetzt())) return
  wartend.set(b.id, b)
  clearTimeout(zeitgeber)
  zeitgeber = setTimeout(abarbeiten, 1500)
}
async function abarbeiten() {
  if (status.laeuft) { zeitgeber = setTimeout(abarbeiten, 1500); return }
  setzeStatus({ laeuft: true, fehler: undefined })
  try {
    for (const [id, b] of [...wartend]) {
      await baumHochladen(b)
      if (wartend.get(id) === b) wartend.delete(id)
    }
    setzeStatus({ laeuft: false, zuletzt: new Date().toISOString() })
  } catch (e) {
    setzeStatus({ laeuft: false, fehler: (e as Error).message })
    if (navigator.onLine) meldeFehler('upload', e)
    zeitgeber = setTimeout(abarbeiten, 30_000) // später erneut
  }
}

/** Vollständiger Abgleich nach dem Start oder der Anmeldung */
export async function synchronisieren() {
  const id = uid()
  if (!id || !bereit(kontoJetzt()) || status.laeuft) return
  setzeStatus({ laeuft: true, fehler: undefined })
  try {
    await baeumeGeladen
    const besitzer = await get<string>(BESITZER)
    if (besitzer && besitzer !== id) {
      // Daten eines anderen Kontos auf diesem Gerät: nicht in dieses Konto übernehmen
      await geraetLeeren()
    }
    if (!besitzer) {
      const fremd = alleBaeume().filter((b) => !b.beispiel)
      if (fremd.length) {
        // Bäume ohne Besitzer (vor der Anmeldung angelegt oder eingespielt): erst nachfragen
        const z = kontoJetzt()
        setzeStatus({ laeuft: false, frage: { anzahl: fremd.length, email: z.status === 'angemeldet' ? z.konto.email : '' } })
        return
      }
    }
    await set(BESITZER, id)
    const { baeume: entfernt } = await kontoApi<{ baeume: Baum[] }>('/api/baeume')
    const aufServer = new Map(entfernt.map((b) => [b.id, b]))
    const bekannt = new Set((await get<string[]>(BEKANNT)) ?? [])
    const lokal = alleBaeume()
    const ergebnis: Baum[] = []
    const hoch: Baum[] = []
    for (const l of lokal) {
      const s = aufServer.get(l.id)
      if (l.beispiel) ergebnis.push(l)
      else if (!s) {
        if (bekannt.has(l.id)) continue // auf einem anderen Gerät gelöscht
        ergebnis.push(l); hoch.push(l)
      } else if (s.geaendert > l.geaendert) ergebnis.push(s)
      else { ergebnis.push(l); if (l.geaendert > s.geaendert) hoch.push(l) }
      aufServer.delete(l.id)
    }
    for (const s of aufServer.values()) ergebnis.push(s)
    await set(BEKANNT, entfernt.map((b) => b.id))
    await ersetzeBaeume(ergebnis)
    for (const b of hoch) await baumHochladen(b)
    setzeStatus({ laeuft: false, zuletzt: new Date().toISOString() })
  } catch (e) {
    setzeStatus({ laeuft: false, fehler: (e as Error).message })
    if (navigator.onLine) meldeFehler('abgleich', e)
  }
}

/** Antwort auf die Frage, ob Bäume ohne Besitzer in das Konto übernommen werden */
export async function uebernahmeEntscheiden(uebernehmen: boolean) {
  const id = uid()
  if (!id) return
  setzeStatus({ frage: undefined })
  if (!uebernehmen) await geraetLeeren()
  await set(BESITZER, id)
  await synchronisieren()
}

/** Abmelden: erst ausstehende Änderungen sichern, dann die Daten von diesem Gerät entfernen */
export async function abmeldenUndAufraeumen(ueberall = false) {
  clearTimeout(zeitgeber)
  if (wartend.size) await abarbeiten()
  if (wartend.size) throw new Error('Nicht alle Änderungen sind gesichert. Bitte mit Netz erneut versuchen.')
  await kontoAbmelden(ueberall)
  await geraetLeeren()
}

/** Entfernt Bäume, Fotos und Abgleichsdaten von diesem Gerät */
export async function geraetLeeren() {
  wartend.clear()
  await clear()
  await ersetzeBaeume([])
  await del(BESITZER)
  // Kartenkacheln verraten den Ort der Wiese
  await caches?.delete('karte').catch(() => false)
  try { localStorage.removeItem('konto-zuletzt'); localStorage.removeItem('aw-anfrage') } catch { /* privat */ }
}

// Sitzung serverseitig beendet (abgelaufen, überall abgemeldet, Konto gelöscht): Daten dieses Kontos vom Gerät entfernen
setzeAbmeldeHaken(async () => { if (await get(BESITZER)) await geraetLeeren() })

setzeServerHaken({
  gespeichert: vormerken,
  geloescht: (baumId) => {
    wartend.delete(baumId)
    if (!bereit(kontoJetzt())) return
    kontoApi(`/api/baeume?id=${encodeURIComponent(baumId)}`, { method: 'DELETE' }).catch(() => {})
  },
  fotoHolen: async (k) => {
    if (!uid()) return undefined
    const { url } = await kontoApi<{ url: string }>(`/api/foto?k=${encodeURIComponent(serverKey(k))}`)
    const r = await fetch(url)
    if (!r.ok) return undefined
    const blob = await r.blob()
    const fertig = await hochgeladen()
    fertig.add(k)
    await set(HOCHGELADEN, [...fertig])
    return blob
  },
})
