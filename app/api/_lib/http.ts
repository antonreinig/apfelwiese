// Gemeinsame Hilfen für die API: Antworten, Eingaben begrenzen, Herkunft prüfen.

const PRODUKTION = process.env.VERCEL_ENV === 'production'

/** Adresse der App, an die Anmeldelinks zeigen: fest, nie aus Anfrage-Headern */
export const APP_URL = PRODUKTION
  ? 'https://apfelwiese.app'
  : `https://${process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL ?? 'localhost:5174'}`

const ERLAUBTE_HERKUNFT = new Set(
  PRODUKTION
    ? ['https://apfelwiese.app', 'https://www.apfelwiese.app']
    : [`https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_BRANCH_URL}`, 'http://localhost:5174', 'http://localhost:3000'],
)

export function json(daten: unknown, status = 200, kopf: Record<string, string> = {}) {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...kopf },
  })
}

export function fehler(status: number, meldung: string) {
  return json({ fehler: meldung }, status)
}

/**
 * Schutz gegen fremde Seiten, die im Namen des Nutzers Anfragen auslösen (CSRF):
 * Ändernde Anfragen müssen von der App selbst kommen.
 */
export function herkunftOk(req: Request) {
  const o = req.headers.get('origin')
  return !!o && ERLAUBTE_HERKUNFT.has(o)
}

/** Liest einen JSON-Körper bis zu einer Höchstgröße */
export async function koerper<T>(req: Request, maxBytes = 16 * 1024): Promise<T | null> {
  const laenge = Number(req.headers.get('content-length') ?? 0)
  if (laenge > maxBytes) return null
  const text = await req.text()
  if (new TextEncoder().encode(text).length > maxBytes) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function clientIp(req: Request) {
  return req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unbekannt'
}

export const EMAIL_MUSTER = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,24}$/i

/** Zeichenkette mit Höchstlänge oder undefined */
export function text(x: unknown, max: number): string | undefined {
  return typeof x === 'string' && x.length <= max ? x : undefined
}
