import { expect, type Page, type ConsoleMessage } from '@playwright/test'

/** Sammelt Konsolenfehler; 401 auf /api/ich ohne Anmeldung ist erwartet */
export function konsolenfehler(page: Page) {
  const fehler: string[] = []
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (/401|Failed to load resource/.test(t)) return
    fehler.push(t)
  })
  page.on('pageerror', (e) => fehler.push(String(e)))
  return fehler
}

/** Einführung beim ersten Start überspringen */
export async function ohneEinfuehrung(page: Page) {
  await page.addInitScript(() => { try { localStorage.setItem('einfuehrung-gesehen', '1') } catch { /* */ } })
}

/** Die Seite darf nie leer bleiben */
export async function nichtLeer(page: Page) {
  await expect.poll(async () => (await page.locator('#root').innerText()).trim().length, { timeout: 15_000 }).toBeGreaterThan(20)
}
