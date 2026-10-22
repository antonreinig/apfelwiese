// Sicherung aller Bäume mit Fotos als eine JSON-Datei (Fotos als Data-URL) und Wiederherstellung.

import { set } from 'idb-keyval'
import type { Baum } from './baeume.ts'
import { speichereBaum, ladeFoto } from './baeume.ts'

interface Sicherung {
  format: 'apfelwiese-sicherung'
  version: 1
  erstellt: string
  baeume: Baum[]
  fotos: Record<string, string>
}

const alsDataUrl = (b: Blob) => new Promise<string>((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(r.result as string)
  r.onerror = () => rej(r.error)
  r.readAsDataURL(b)
})

export async function sicherungErstellen(baeume: Baum[]): Promise<Blob> {
  const fotos: Record<string, string> = {}
  for (const b of baeume)
    for (const s of b.fotosaetze)
      for (const k of [...s.fotos, ...(s.vorschau ?? []), ...(s.blatt ?? [])]) {
        if (!k || fotos[k]) continue
        const blob = await ladeFoto(k)
        if (blob) fotos[k] = await alsDataUrl(blob)
      }
  const daten: Sicherung = { format: 'apfelwiese-sicherung', version: 1, erstellt: new Date().toISOString(), baeume, fotos }
  return new Blob([JSON.stringify(daten)], { type: 'application/json' })
}

/** Spielt eine Sicherung ein. Bäume mit gleicher ID werden überschrieben, andere bleiben. */
export async function sicherungEinspielen(datei: File): Promise<number> {
  const daten = JSON.parse(await datei.text()) as Sicherung
  if (daten?.format !== 'apfelwiese-sicherung' || !Array.isArray(daten.baeume) || typeof daten.fotos !== 'object') throw new Error('Das ist keine Sicherung der Apfelwiese.')
  const KEY = /^foto:[a-z0-9]{6,40}$/
  const baeume = daten.baeume.filter((b) =>
    b && typeof b.id === 'string' && /^[a-z0-9-]{4,40}$/.test(b.id) && typeof b.name === 'string' && Array.isArray(b.fotosaetze) &&
    b.fotosaetze.every((x) => x && Array.isArray(x.fotos) && [...x.fotos, ...(x.vorschau ?? []), ...(x.blatt ?? [])].every((k) => k === null || (typeof k === 'string' && KEY.test(k)))))
  if (baeume.length !== daten.baeume.length) throw new Error('Die Sicherung enthält ungültige Einträge.')
  for (const [k, url] of Object.entries(daten.fotos)) {
    // nur Fotoschlüssel und Bild-Data-URLs annehmen; dekodieren ohne fetch (CSP erlaubt kein data: für fetch)
    const m = typeof url === 'string' ? /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(url) : null
    if (!KEY.test(k) || !m) continue
    const bin = atob(m[2])
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    await set(k, new Blob([bytes], { type: m[1] }))
  }
  for (const b of baeume) await speichereBaum(b)
  return baeume.length
}
