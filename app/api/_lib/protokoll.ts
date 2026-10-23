// Betriebsprotokoll im privaten Speicher, 30 Tage (Cron löscht ältere Einträge):
//   log/fehler/<JJJJ-MM-TT>/<zeit>-<zufall>.json     Fehler aus App und Server
//   log/ereignisse/<JJJJ-MM-TT>/<zeit>-<zufall>.json neue Konten, gelöschte Konten, Rückmeldungen
// Je Eintrag eine Datei: kein gleichzeitiges Schreiben in dieselbe Datei.

import { randomBytes } from 'node:crypto'
import { put } from '@vercel/blob'
import { fehler } from './http.js'

export interface Fehlereintrag {
  zeit: string
  quelle: 'app' | 'server'
  art: string
  meldung: string
  ablauf?: string
  zusatz?: string
  seite?: string
  version?: string
  geraet?: string
  uid?: string
  /** aus automatischen Tests (Testkonto oder Testkennzeichen) */
  test?: boolean
}

export interface Ereignis {
  zeit: string
  art: 'konto-neu' | 'konto-geloescht' | 'rueckmeldung'
  uid?: string
  test?: boolean
}

/** Testkonten (Resend-Testadressen) und Anfragen der automatischen Tests */
export function istTest(req: Request | null, email?: string) {
  return (!!email && /@resend\.dev$/i.test(email)) || req?.headers.get('x-apfelwiese-test') === '1'
}

async function ablegen(bereich: 'fehler' | 'ereignisse', daten: object) {
  const jetzt = new Date()
  const pfad = `log/${bereich}/${jetzt.toISOString().slice(0, 10)}/${jetzt.getTime()}-${randomBytes(4).toString('hex')}.json`
  await put(pfad, JSON.stringify(daten), { access: 'private', addRandomSuffix: false, contentType: 'application/json' })
}

export async function protokolliereFehler(e: Omit<Fehlereintrag, 'zeit'>) {
  await ablegen('fehler', { zeit: new Date().toISOString(), ...e }).catch(() => {})
}

export async function protokolliereEreignis(art: Ereignis['art'], uid?: string, test = false) {
  await ablegen('ereignisse', { zeit: new Date().toISOString(), art, uid, ...(test ? { test } : {}) }).catch(() => {})
}

type Handler = (req: Request) => Promise<Response>

/** Unerwartete Fehler einer API-Route protokollieren und als 500 beantworten */
export function mitProtokoll(route: string, h: Handler): Handler {
  return async (req) => {
    try {
      return await h(req)
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      console.error(`[${route}]`, err)
      await protokolliereFehler({ quelle: 'server', art: route, meldung: `${err.name}: ${err.message}`.slice(0, 500), ablauf: err.stack?.slice(0, 2000), seite: `${req.method} /api/${route}`, ...(istTest(req) ? { test: true } : {}) })
      return fehler(500, 'Interner Fehler. Er wurde protokolliert.')
    }
  }
}
