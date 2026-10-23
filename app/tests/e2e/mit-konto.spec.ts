// Mit Testkonto (delivered@resend.dev): Anmelden, Zustimmung, Baum aus den Beispielfotos anlegen,
// Merkmals-Rundgang bis „Fertig“, Baum auf der Wiese platzieren, Konto löschen.

import { test, expect } from '@playwright/test'
import { codeAusResend } from '../api/resend.ts'
import { konsolenfehler, ohneEinfuehrung, alsTest } from './hilfen.ts'

// Fehlermeldungen dieser Läufe zählen nicht als Nutzung
test.beforeEach(async ({ page }) => { await alsTest(page) })

test.skip(!process.env.RESEND_API_KEY, 'RESEND_API_KEY fehlt')

// Testkonto in jedem Fall löschen, auch nach Zeitüberschreitung
test.afterEach(async ({ page }) => {
  const status = await page.evaluate(() => fetch('/api/konto', { method: 'DELETE' }).then((r) => r.status)).catch(() => 0)
  expect([200, 401], 'Testkonto konnte nicht gelöscht werden').toContain(status)
})

test('Ganzer Ablauf mit Testkonto', async ({ page, request, baseURL }) => {
  test.setTimeout(240_000)
  const fehler = konsolenfehler(page)
  await ohneEinfuehrung(page)

  // Anmelden
  await page.goto('/#/anmelden')
  const email = `delivered+test${Date.now()}@resend.dev`
  await page.getByPlaceholder('name@beispiel.de').fill(email)
  const antwort = page.waitForResponse((r) => r.url().endsWith('/api/anmelden'))
  await page.getByRole('button', { name: 'Code per E-Mail schicken' }).click()
  const { anfrage } = await (await antwort).json()
  const code = await codeAusResend(anfrage)
  await page.locator('input[autocomplete="one-time-code"]').fill(code)
  await expect(page.getByText('Bevor es losgeht')).toBeVisible()
  await page.getByRole('checkbox').first().check()
  await page.getByRole('button', { name: 'Weiter' }).click()

  // Konto-Knopf in der Kopfleiste zeigt das Konto mit Abmelden und Löschen
  await expect(page.getByText('Bevor es losgeht')).toHaveCount(0)
  await page.goto('/')
  await page.getByRole('button', { name: 'Konto und Einstellungen' }).click()
  await expect(page.getByText(email)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Konto löschen' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sicherung herunterladen' })).toBeVisible()

  {
    // Neuen Baum aus den vier Beispielfotos
    await page.goto('/#/neu')
    await page.getByRole('button', { name: /Weiter zu den Fotos/ }).click()
    for (let i = 1; i <= 4; i++) {
      const name = ['foto1_laengshaelften_schale', 'foto2_laengsscheiben_kernhaus', 'foto3_querhaelften_kelch_stiel_kerne', 'foto4_querscheiben_kernhausstern'][i - 1]
      const bild = await (await request.get(`${baseURL}/beispiel/${name}.jpg`)).body()
      await page.locator('input[type="file"]:not([capture])').setInputFiles({ name: `${name}.jpg`, mimeType: 'image/jpeg', buffer: bild })
      await expect(page.getByText('Blatt mit vier Ecken erkannt')).toBeVisible({ timeout: 60_000 })
      await page.getByRole('button', { name: i < 4 ? 'Nächstes Foto' : 'Weiter' }).click()
    }
    await page.getByRole('button', { name: /Auswerten/ }).click()
    await expect(page.getByRole('button', { name: 'Ohne Sorte speichern' })).toBeEnabled({ timeout: 90_000 })
    await page.getByRole('button', { name: 'Ohne Sorte speichern' }).click()
    await expect(page).toHaveURL(/#\/baum\//, { timeout: 60_000 })
    const baumUrl = page.url()

    // Merkmals-Rundgang bis zum Ende
    await page.goto(baumUrl.replace(/#\/baum\/([^/?]+).*/, '#/baum/$1/merkmale'))
    for (let i = 0; i < 60; i++) {
      const fertig = page.getByRole('button', { name: 'Fertig' })
      if (await fertig.isVisible()) { await fertig.click(); break }
      await page.getByRole('button', { name: 'Weiter' }).click()
    }
    await expect(page).toHaveURL(/#\/baum\/[^/]+$/, { timeout: 10_000 })

    // Auf der Wiese platzieren
    await page.goto('/#/wiese')
    // neues Konto: zuerst den Ausschnitt der Wiese festlegen
    await page.getByRole('button', { name: 'Das ist meine Wiese' }).click({ timeout: 20_000 })
    await page.getByText(/ohne Standort/).click()
    await page.getByRole('button', { name: 'Platzieren' }).first().click()
    await page.getByRole('button', { name: 'Standort sichern' }).click()
    await expect(page.getByText(/1 Baum|2 Bäume/)).toBeVisible()

    // Abgleich mit dem Server abwarten
    await expect.poll(async () => (await page.evaluate(() => fetch('/api/baeume').then((r) => r.json()))).baeume.length, { timeout: 30_000 }).toBeGreaterThan(0)
  }
  expect(fehler, fehler.join('\n')).toEqual([])
})
