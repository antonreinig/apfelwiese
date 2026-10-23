// Ohne Konto: Einführung, alle Tabs, Sorten, rechtliche Seiten. Keine leeren Seiten, keine Skriptfehler.

import { test, expect } from '@playwright/test'
import { konsolenfehler, ohneEinfuehrung, nichtLeer, alsTest } from './hilfen.ts'

// Fehlermeldungen dieser Läufe zählen nicht als Nutzung
test.beforeEach(async ({ page }) => { await alsTest(page) })

test('Einführung erscheint beim ersten Start und lässt sich durchblättern', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Vier Äpfel, vier Fotos')).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByText('Dein Apfel in 3D')).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await page.getByRole('button', { name: 'Loslegen' }).click()
  await expect(page.getByText('Meine Äpfel')).toBeVisible()
})

test('Alle Tabs und Seiten laden ohne Fehler', async ({ page }) => {
  const fehler = konsolenfehler(page)
  await ohneEinfuehrung(page)
  await page.goto('/')
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()

  await page.getByRole('link', { name: 'Sorten' }).click()
  await expect(page.getByText('Sortenverzeichnis')).toBeVisible()
  await page.getByPlaceholder('Name oder Synonym').fill('Gravensteiner')
  await page.getByText('Gravensteiner', { exact: true }).first().click()
  await expect(page.getByText('Herkunft', { exact: false }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Wiese' }).click()
  await expect(page.getByText('Deine Wiese')).toBeVisible()

  for (const [pfad, text] of [['#/info', 'Dein Konto'], ['#/impressum', 'Loki-Schmidt-Platz'], ['#/datenschutz', 'Fehlerprotokoll'], ['#/nutzung', 'Sortenvorschläge'], ['#/installieren', 'Home-Bildschirm'], ['#/anmelden', 'Code per E-Mail schicken']] as const) {
    await page.goto('/' + pfad)
    await nichtLeer(page)
    await expect(page.getByText(text).first()).toBeVisible()
  }
  expect(fehler, fehler.join('\n')).toEqual([])
})

test('Fehlt nach einem Update ein Teil der App, lädt sie sich neu statt leer zu bleiben', async ({ page }) => {
  await ohneEinfuehrung(page)
  let abgefangen = 0
  // erste Anfrage nach dem Sortenporträt scheitert wie nach einem Update
  await page.route(/\/assets\/Sorte-[^/]+\.js$/, (route) => {
    if (abgefangen++ === 0) return route.fulfill({ status: 404, body: 'Not Found' })
    return route.continue()
  })
  await page.goto('/#/sorte/gravensteiner')
  await nichtLeer(page)
  await expect(page.getByText('Gravensteiner').first()).toBeVisible()
  expect(abgefangen).toBeGreaterThanOrEqual(2)
})

test('Ohne 3D-Grafik (kein WebGL) erscheint ein flacher Apfel statt eines Fehlers', async ({ page }) => {
  const fehler = konsolenfehler(page)
  await ohneEinfuehrung(page)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    // WebGL abschalten, 2D-Zeichnen erlauben
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, art: string, ...rest: unknown[]) {
      if (/webgl/i.test(art)) return null
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, art, ...rest)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.getByRole('img', { name: 'Apfel' }).first()).toBeVisible()
  await expect(page.getByText('Da ist etwas schiefgelaufen')).toHaveCount(0)
  await page.getByRole('link', { name: 'Sorten' }).click()
  await expect(page.getByText('Sortenverzeichnis')).toBeVisible()
  expect(fehler, fehler.join('\n')).toEqual([])
})
